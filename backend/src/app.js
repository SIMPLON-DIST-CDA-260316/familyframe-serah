import express from 'express'
import { createServer } from 'node:http'
import multer from 'multer'
import sharp from 'sharp'
import { Server } from 'socket.io'
import { frameRoom, frameSession, isId, requireFrame } from './access.js'
import { frames } from './frames.js'
import { cloudinary, uploadImage } from './cloudinary.js'
import { prisma } from './db.js'

export const app = express()
export const server = createServer(app)
export const io = new Server(server)

io.use(async (socket, next) => {
  const { frameId } = socket.handshake.auth ?? {}
  const session = frameSession(socket.request.headers.cookie, frameId)
  if (!session) return next(new Error('Accès au cadre refusé.'))
  try {
    const frame = await prisma.frame.findUnique({ where: { id: frameId }, select: { id: true } })
    if (!frame) return next(new Error('Accès au cadre refusé.'))
    socket.data.frameId = frameId
    socket.data.expiresAt = session.exp * 1000
    next()
  } catch {
    next(new Error('Le cadre n’est pas disponible.'))
  }
})

io.on('connection', socket => {
  socket.join(frameRoom(socket.data.frameId))
  const expiry = setTimeout(() => socket.disconnect(true), Math.max(0, socket.data.expiresAt - Date.now()))
  socket.once('disconnect', () => clearTimeout(expiry))
})

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 1, parts: 3, fieldSize: 200 },
})

function receivePhoto(req, res, next) {
  upload.single('photo')(req, res, error => {
    if (!error) return next()
    const tooLarge = error.code === 'LIMIT_FILE_SIZE'
    res.status(tooLarge ? 413 : 400).json({
      error: tooLarge ? 'La photo dépasse la limite de 5 Mo.' : 'Envoi invalide : une photo et un pseudo sont attendus.',
    })
  })
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/frames', frames)
const photosPath = '/frames/:frameId/photos'
app.use(photosPath, requireFrame)

function serializePhoto(photo) {
  const { id, frameId, pseudo, createdAt } = photo
  return { id, pseudo, createdAt, url: `/api/frames/${frameId}/photos/${id}/image` }
}

app.get(photosPath, async (req, res) => {
  const photos = await prisma.photo.findMany({
    where: { frameId: req.params.frameId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  })
  res.json(photos.map(serializePhoto))
})

app.get(photosPath + '/:photoId/image', async (req, res) => {
  const { frameId, photoId } = req.params
  if (!isId(photoId)) return res.sendStatus(404)
  const photo = await prisma.photo.findFirst({ where: { id: photoId, frameId } })
  if (!photo) return res.sendStatus(404)
  const url = cloudinary.url(photo.cloudinaryId, {
    type: photo.restricted ? 'authenticated' : 'upload', sign_url: Boolean(photo.restricted),
    secure: true, format: 'jpg',
  })
  const upstream = await fetch(url, { signal: AbortSignal.timeout(10000), redirect: 'error' })
  if (!upstream.ok) return res.sendStatus(502)
  res.set('Cache-Control', 'private, no-store').type('jpeg').send(Buffer.from(await upstream.arrayBuffer()))
})

app.post(photosPath, receivePhoto, async (req, res) => {
  const { frameId } = req.params
  const pseudo = typeof req.body?.pseudo === 'string' ? req.body.pseudo.trim() : ''

  if (!pseudo || pseudo.length > 50) {
    return res.status(400).json({ error: 'Le pseudo doit contenir entre 1 et 50 caractères.' })
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Sélectionnez une photo.' })
  }
  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(415).json({ error: 'Le fichier doit être une image.' })
  }

  let image
  try {
    image = await sharp(req.file.buffer, { limitInputPixels: 25_000_000 })
      .rotate()
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 85 })
      .toBuffer()
  } catch {
    return res.status(415).json({ error: 'Image invalide, trop grande ou format non pris en charge.' })
  }

  const config = cloudinary.config()
  if (!config.cloud_name || !config.api_key || !config.api_secret) {
    return res.status(503).json({ error: 'Les accès Cloudinary doivent être configurés côté serveur.' })
  }
  let stored
  try {
    stored = await uploadImage(image)
  } catch (error) {
    if (Number(error?.http_code) === 401) {
      return res.status(503).json({ error: 'Cloudinary a refusé les identifiants du serveur.' })
    }
    throw error
  }
  let photo
  try {
    photo = await prisma.photo.create({
      data: { url: stored.secure_url, cloudinaryId: stored.public_id, pseudo, frameId, restricted: true },
    })
  } catch (error) {
    // Éviter de laisser une image inutilisée si l'enregistrement en base échoue.
    try {
      await cloudinary.uploader.destroy(stored.public_id, { resource_type: 'image', type: 'authenticated' })
    } catch {
      console.error('Une image Cloudinary n’a pas pu être nettoyée après un échec en base.')
    }
    throw error
  }
  const result = serializePhoto(photo)
  io.to(frameRoom(frameId)).emit('photo:new', result)
  res.status(201).json(result)
})

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error)
  if (error.status === 400 || error.status === 413) {
    return res.status(error.status).json({ error: 'Les données envoyées sont invalides.' })
  }
  res.status(500).json({ error: 'Le serveur n’a pas pu traiter la demande. Réessayez.' })
})
