import { createHash, randomBytes } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { prisma } from './db.js'

const sessionSeconds = 7 * 24 * 60 * 60
const cookiePrefix = 'ff_frame_'

export const isId = value => typeof value === 'string' && /^[a-f0-9]{24}$/.test(value)
export const isInvitation = value => typeof value === 'string' && /^[A-Za-z0-9_-]{24}$/.test(value)
export const invitationDigest = value => createHash('sha256').update(value).digest('hex')
export const newInvitation = () => randomBytes(18).toString('base64url')
export const frameRoom = id => `frame:${id}`

function secret() {
  const key = process.env.FRAME_SESSION_SECRET
  return key?.length >= 32 ? key : null
}

function cookies(header = '') {
  return new Map(header.split(';').map(cookie => {
    const [key, value] = cookie.trim().split('=', 2)
    return [key, value]
  }))
}

function verify(token, id) {
  if (!token || !secret()) return null
  try {
    const claims = jwt.verify(token, secret(), {
      algorithms: ['HS256'], issuer: 'familyframe', audience: 'frame', subject: id,
    })
    return claims
  } catch {
    return null
  }
}

export function frameSession(header, id) {
  return isId(id) ? verify(cookies(header).get(cookiePrefix + id), id) : null
}

export function authorizedFrameIds(header) {
  return [...cookies(header)].filter(([name, token]) => {
    const id = name.slice(cookiePrefix.length)
    return name.startsWith(cookiePrefix) && isId(id) && verify(token, id)
  }).map(([name]) => name.slice(cookiePrefix.length))
}

export function frameConfig(req, res, next) {
  if (!secret()) return res.status(503).json({ error: 'Le serveur doit configurer les sessions des cadres.' })
  if (!process.env.DATABASE_URL) return res.status(503).json({ error: 'La connexion MongoDB doit être configurée côté serveur.' })
  res.set('Cache-Control', 'no-store')
  next()
}

export function grantFrame(req, res, id) {
  const token = jwt.sign({}, secret(), {
    algorithm: 'HS256', issuer: 'familyframe', audience: 'frame', subject: id, expiresIn: sessionSeconds,
  })
  res.cookie(cookiePrefix + id, token, {
    httpOnly: true, sameSite: 'strict', secure: req.secure || process.env.FRAME_COOKIE_SECURE === 'true',
    maxAge: sessionSeconds * 1000, path: '/',
  })
}

export async function requireFrame(req, res, next) {
  const { frameId } = req.params
  if (!frameSession(req.headers.cookie, frameId)) {
    return res.status(403).json({ error: 'Rejoignez ce cadre avec son code d’invitation.' })
  }
  if (!await prisma.frame.findUnique({ where: { id: frameId }, select: { id: true } })) {
    return res.status(404).json({ error: 'Ce cadre n’existe plus.' })
  }
  next()
}
