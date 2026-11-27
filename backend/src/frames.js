import express from 'express'
import QRCode from 'qrcode'
import { prisma } from './db.js'
import { authorizedFrameIds, frameConfig, grantFrame, invitationDigest, isInvitation, newInvitation } from './access.js'

export const frames = express.Router()
const parseJson = express.json({ limit: '4kb' })
const visibleFields = { id: true, name: true }

frames.use(frameConfig)

frames.get('/', async (req, res) => {
  const ids = authorizedFrameIds(req.headers.cookie)
  const results = ids.length ? await prisma.frame.findMany({
    where: { id: { in: ids } }, select: visibleFields, orderBy: { name: 'asc' },
  }) : []
  res.json(results)
})

frames.post('/', parseJson, async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  if (!name || name.length > 60) return res.status(400).json({ error: 'Le nom du cadre doit contenir entre 1 et 60 caractères.' })
  const code = newInvitation()
  const origin = new URL(req.get('origin') || `${req.protocol}://${req.get('host')}`)
  if (!['http:', 'https:'].includes(origin.protocol)) return res.status(400).json({ error: 'Adresse d’invitation invalide.' })
  const invitationUrl = new URL('/', origin.origin)
  invitationUrl.hash = `invitation=${code}`
  const qr = await QRCode.toDataURL(invitationUrl.href, { width: 240, margin: 2 })
  const frame = await prisma.frame.create({
    data: { name, inviteHash: invitationDigest(code) }, select: visibleFields,
  })
  grantFrame(req, res, frame.id)
  res.status(201).json({ frame, code, invitationUrl: invitationUrl.href, qr })
})

frames.post('/join', parseJson, async (req, res) => {
  const code = typeof req.body?.code === 'string' ? req.body.code.trim() : ''
  const frame = isInvitation(code) && await prisma.frame.findUnique({
    where: { inviteHash: invitationDigest(code) }, select: visibleFields,
  })
  if (!frame) return res.status(404).json({ error: 'Code d’invitation invalide.' })
  grantFrame(req, res, frame.id)
  res.json(frame)
})
