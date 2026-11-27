import assert from 'node:assert/strict'
import { once } from 'node:events'
import { Writable } from 'node:stream'
import test from 'node:test'
import sharp from 'sharp'
import { io as connect } from 'socket.io-client'
import { io, server } from '../src/app.js'
import { cloudinary } from '../src/cloudinary.js'
import { prisma } from '../src/db.js'

test('API photo : traitement réel, services externes remplacés pour les tests', { timeout: 15000 }, async t => {
  let records = []
  let uploaded = []
  let destroyed = []
  let events = []
  let failUpload = false
  let failDatabase = false
  const frames = []
  const photoId = '000000000000000000000111'
  process.env.FRAME_SESSION_SECRET = 'test-only-secret-at-least-32-characters'
  process.env.DATABASE_URL = 'mongodb://127.0.0.1:27017/familyframe_test'

  const originalFrame = { create: prisma.frame.create, findUnique: prisma.frame.findUnique, findMany: prisma.frame.findMany }
  const originalFindFirst = prisma.photo.findFirst
  t.after(() => {
    Object.assign(prisma.frame, originalFrame)
    prisma.photo.findFirst = originalFindFirst
  })
  prisma.frame.create = async ({ data }) => {
    const frame = { ...data, id: (frames.length + 1).toString(16).padStart(24, '0') }
    frames.push(frame)
    return { id: frame.id, name: frame.name }
  }
  prisma.frame.findUnique = async ({ where }) =>
    frames.find(frame => where.id ? frame.id === where.id : frame.inviteHash === where.inviteHash) ?? null
  prisma.frame.findMany = async ({ where }) =>
    frames.filter(frame => where.id.in.includes(frame.id)).map(({ id, name }) => ({ id, name }))

  t.beforeEach(() => {
    records = []
    uploaded = []
    destroyed = []
    events = []
    failUpload = false
    failDatabase = false
    process.env.DATABASE_URL = 'mongodb://127.0.0.1:27017/familyframe_test'
    cloudinary.config({ cloud_name: 'test', api_key: 'test', api_secret: 'test' })
  })

  t.mock.method(cloudinary.uploader, 'upload_stream', (options, callback) => {
    const chunks = []
    return new Writable({
      write(chunk, encoding, done) { chunks.push(chunk); done() },
      final(done) {
        uploaded.push(Buffer.concat(chunks))
        if (failUpload) callback(new Error('PRIVATE_PROVIDER_DETAIL'))
        else callback(null, { secure_url: 'https://example.test/photo.jpg', public_id: 'familyframe/test' })
        done()
      },
    })
  })
  t.mock.method(cloudinary.uploader, 'destroy', async id => { destroyed.push(id) })
  const originalCreate = prisma.photo.create
  const originalFindMany = prisma.photo.findMany
  t.after(() => {
    prisma.photo.create = originalCreate
    prisma.photo.findMany = originalFindMany
  })
  prisma.photo.create = async ({ data }) => {
    if (failDatabase) throw new Error('PRIVATE_DATABASE_DETAIL')
    const photo = { id: photoId, ...data, createdAt: new Date() }
    records.push(photo)
    return photo
  }
  prisma.photo.findMany = async ({ where, orderBy }) => {
    assert.deepEqual(orderBy, [{ createdAt: 'desc' }, { id: 'desc' }])
    return records.filter(photo => photo.frameId === where.frameId)
  }
  prisma.photo.findFirst = async ({ where }) =>
    records.find(photo => photo.id === where.id && photo.frameId === where.frameId) ?? null
  const toRoom = io.to.bind(io)
  t.mock.method(io, 'to', room => {
    const broadcast = toRoom(room)
    return { emit(name, photo) { events.push({ room, name, photo }); return broadcast.emit(name, photo) } }
  })

  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const base = `http://127.0.0.1:${server.address().port}`
  t.after(async () => {
    await new Promise(resolve => io.close(resolve))
    await prisma.$disconnect()
  })

  async function createFrame(name) {
    const response = await fetch(`${base}/frames`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }),
    })
    assert.equal(response.status, 201)
    const cookie = response.headers.get('set-cookie')
    assert.match(cookie, /HttpOnly/)
    assert.match(cookie, /SameSite=Strict/)
    return { ...await response.json(), cookie: cookie.split(';')[0] }
  }

  const a = await createFrame('Dupont')
  const b = await createFrame('Martin')
  const aPhotos = `${base}/frames/${a.frame.id}/photos`
  const bPhotos = `${base}/frames/${b.frame.id}/photos`

  const png = await sharp({ create: { width: 2048, height: 8, channels: 3, background: 'red' } })
    .withMetadata().png().toBuffer()

  function send(pseudo = ' Alice ', buffer = png, type = 'image/png', field = 'photo') {
    const form = new FormData()
    form.append('pseudo', pseudo)
    if (buffer) form.append(field, new Blob([buffer], { type }), 'photo.png')
    return fetch(aPhotos, { method: 'POST', headers: { Cookie: a.cookie }, body: form })
  }

  await t.test('le serveur répond et une route inconnue renvoie 404', async () => {
    assert.deepEqual(await (await fetch(`${base}/health`)).json(), { status: 'ok' })
    assert.equal((await fetch(`${base}/inconnue`)).status, 404)
  })

  await t.test('une photo valide est réencodée, enregistrée et diffusée', async () => {
    const response = await send()
    assert.equal(response.status, 201)
    const photo = await response.json()
    assert.equal(photo.pseudo, 'Alice')
    assert.equal(photo.url, `/api/frames/${a.frame.id}/photos/${photoId}/image`)
    assert.equal('cloudinaryId' in photo, false)
    assert.equal(records[0].frameId, a.frame.id)
    assert.equal(records[0].restricted, true)
    assert.ok(photo.createdAt)
    const image = await sharp(uploaded[0]).metadata()
    assert.equal(image.format, 'jpeg')
    assert.equal(image.width, 1920)
    assert.equal(image.exif, undefined)
    assert.equal(events.length, 1)
    assert.equal(events[0].name, 'photo:new')
    assert.equal(events[0].photo.id, photo.id)
    assert.equal((await (await fetch(aPhotos, { headers: { Cookie: a.cookie } })).json())[0].id, photo.id)
  })

  await t.test('les invitations sont vérifiées et les cadres restent isolés', async () => {
    assert.match(a.qr, /^data:image\/png;base64,/)
    assert.equal(new URL(a.invitationUrl).hash, `#invitation=${a.code}`)
    assert.notEqual(frames[0].inviteHash, a.code)
    const join = code => fetch(`${base}/frames/join`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }),
    })
    assert.equal((await join('x'.repeat(24))).status, 404)
    const joined = await join(a.code)
    assert.equal(joined.status, 200)
    assert.equal((await joined.json()).id, a.frame.id)
    const joinedCookie = joined.headers.get('set-cookie').split(';')[0]
    assert.equal((await fetch(aPhotos)).status, 403)
    assert.equal((await fetch(aPhotos, { method: 'POST' })).status, 403)
    assert.equal((await fetch(bPhotos, { headers: { Cookie: joinedCookie } })).status, 403)
    const sent = await send()
    assert.equal(sent.status, 201)
    assert.deepEqual(await (await fetch(bPhotos, { headers: { Cookie: b.cookie } })).json(), [])
    assert.equal((await fetch(`${bPhotos}/${photoId}/image`, { headers: { Cookie: b.cookie } })).status, 404)
    assert.equal((await fetch(`${aPhotos}/${photoId}/image`, { headers: { Cookie: b.cookie } })).status, 403)
  })

  await t.test('Socket.IO refuse un cadre étranger et diffuse seulement à la bonne room', async () => {
    const socket = (id, cookie) => connect(base, {
      auth: { frameId: id }, extraHeaders: { Cookie: cookie }, transports: ['websocket'], reconnection: false,
    })
    const waitFor = (client, event) => new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Événement absent : ${event}`)), 2000)
      client.once(event, result => { clearTimeout(timeout); resolve(result) })
    })
    const clients = [socket(a.frame.id, a.cookie), socket(b.frame.id, b.cookie), socket(b.frame.id, a.cookie)]
    const [alice, bob, refused] = clients
    try {
      const [, , rejection] = await Promise.all([
        waitFor(alice, 'connect'), waitFor(bob, 'connect'), waitFor(refused, 'connect_error'),
      ])
      assert.match(rejection.message, /refusé/)
      bob.on('photo:new', () => { assert.fail('Un autre cadre a reçu la photo.') })
      const incoming = waitFor(alice, 'photo:new')
      assert.equal((await send()).status, 201)
      assert.equal((await incoming).id, photoId)
      assert.equal(events[0].room, `frame:${a.frame.id}`)
      await new Promise(resolve => setTimeout(resolve, 50))
    } finally {
      clients.forEach(client => client.close())
    }
  })

  await t.test('pseudo vide ou trop long et photo absente sont refusés', async () => {
    assert.equal((await send(' ')).status, 400)
    assert.equal((await send('a'.repeat(51))).status, 400)
    assert.equal((await send('Alice', null)).status, 400)
    assert.equal(uploaded.length, 0)
  })

  await t.test('les faux fichiers et les formats déclarés incorrects sont refusés', async () => {
    assert.equal((await send('Alice', Buffer.from('not an image'))).status, 415)
    assert.equal((await send('Alice', png, 'text/plain')).status, 415)
    const huge = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100000" height="100000"></svg>')
    assert.equal((await send('Alice', huge, 'image/svg+xml')).status, 415)
    assert.equal(uploaded.length, 0)
  })

  await t.test('la taille maximale et le nom du champ fichier sont contrôlés', async () => {
    assert.equal((await send('Alice', Buffer.alloc(5 * 1024 * 1024 + 1))).status, 413)
    assert.equal((await send('Alice', png, 'image/png', 'inconnu')).status, 400)
    assert.equal(uploaded.length, 0)
  })

  await t.test('un formulaire multipart mal formé est refusé sans erreur serveur', async () => {
    const response = await fetch(aPhotos, {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data', Cookie: a.cookie },
      body: 'broken multipart',
    })
    assert.equal(response.status, 400)
    assert.equal(uploaded.length, 0)
  })

  await t.test('une configuration manquante renvoie 503 sans envoi externe', async () => {
    cloudinary.config({ api_secret: '' })
    assert.equal((await send()).status, 503)
    cloudinary.config({ api_secret: 'test' })
    delete process.env.DATABASE_URL
    assert.equal((await send()).status, 503)
    assert.equal((await fetch(aPhotos, { headers: { Cookie: a.cookie } })).status, 503)
    assert.equal(uploaded.length, 0)
  })

  await t.test('un échec Cloudinary ne crée ni enregistrement ni événement', async () => {
    failUpload = true
    const response = await send()
    assert.equal(response.status, 500)
    assert.equal((await response.text()).includes('PRIVATE_PROVIDER_DETAIL'), false)
    assert.equal(records.length, 0)
    assert.equal(events.length, 0)
  })

  await t.test('un échec en base déclenche le nettoyage, sans diffuser de faux succès', async () => {
    failDatabase = true
    const response = await send()
    assert.equal(response.status, 500)
    assert.equal((await response.text()).includes('PRIVATE_DATABASE_DETAIL'), false)
    assert.deepEqual(destroyed, ['familyframe/test'])
    assert.equal(events.length, 0)
  })
})
