import assert from 'node:assert/strict'
import { once } from 'node:events'
import { Writable } from 'node:stream'
import test from 'node:test'
import sharp from 'sharp'
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
    const photo = { id: 'test-photo', ...data, createdAt: new Date() }
    records.push(photo)
    return photo
  }
  prisma.photo.findMany = async ({ orderBy }) => {
    assert.deepEqual(orderBy, [{ createdAt: 'desc' }, { id: 'desc' }])
    return records
  }
  t.mock.method(io, 'emit', (name, photo) => { events.push({ name, photo }) })

  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const base = `http://127.0.0.1:${server.address().port}`
  t.after(async () => {
    await new Promise(resolve => io.close(resolve))
    await prisma.$disconnect()
  })

  const png = await sharp({ create: { width: 2048, height: 8, channels: 3, background: 'red' } })
    .withMetadata().png().toBuffer()

  function send(pseudo = ' Alice ', buffer = png, type = 'image/png', field = 'photo') {
    const form = new FormData()
    form.append('pseudo', pseudo)
    if (buffer) form.append(field, new Blob([buffer], { type }), 'photo.png')
    return fetch(`${base}/photos`, { method: 'POST', body: form })
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
    assert.equal(photo.url, 'https://example.test/photo.jpg')
    assert.equal(photo.cloudinaryId, 'familyframe/test')
    assert.ok(photo.createdAt)
    const image = await sharp(uploaded[0]).metadata()
    assert.equal(image.format, 'jpeg')
    assert.equal(image.width, 1920)
    assert.equal(image.exif, undefined)
    assert.equal(events.length, 1)
    assert.equal(events[0].name, 'photo:new')
    assert.equal(events[0].photo.id, photo.id)
    assert.equal((await (await fetch(`${base}/photos`)).json())[0].id, photo.id)
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
    const response = await fetch(`${base}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data' },
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
    assert.equal((await fetch(`${base}/photos`)).status, 503)
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
