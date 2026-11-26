import express from 'express'
import { createServer } from 'node:http'
import multer from 'multer'
import sharp from 'sharp'
import { Server } from 'socket.io'
import { cloudinary, uploadImage } from './cloudinary.js'
import { prisma } from './db.js'

export const app = express()
export const server = createServer(app)
export const io = new Server(server)

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

app.get('/photos', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'La connexion MongoDB doit être configurée côté serveur.' })
  }
  const photos = await prisma.photo.findMany({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] })
  res.json(photos)
})

app.post('/photos', receivePhoto, async (req, res) => {
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
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'La connexion MongoDB doit être configurée côté serveur.' })
  }

  const stored = await uploadImage(image)
  let photo
  try {
    photo = await prisma.photo.create({
      data: { url: stored.secure_url, cloudinaryId: stored.public_id, pseudo },
    })
  } catch (error) {
    // Éviter de laisser une image inutilisée si l'enregistrement en base échoue.
    try {
      await cloudinary.uploader.destroy(stored.public_id, { resource_type: 'image' })
    } catch {
      console.error('Une image Cloudinary n’a pas pu être nettoyée après un échec en base.')
    }
    throw error
  }
  io.emit('photo:new', photo)
  res.status(201).json(photo)
})

app.use((error, req, res, next) => {
  res.status(500).json({ error: 'Le serveur n’a pas pu traiter la demande. Réessayez.' })
})
