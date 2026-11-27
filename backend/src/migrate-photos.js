import { prisma } from './db.js'
import { isId } from './access.js'

const [, , frameId, mode] = process.argv
const orphanPhotos = { OR: [{ frameId: null }, { frameId: { isSet: false } }] }

try {
  if (!isId(frameId) || (mode && mode !== '--apply')) {
    throw new Error('Utilisation : pnpm db:migrate-photos ID_DU_CADRE [--apply]')
  }
  const frame = await prisma.frame.findUnique({ where: { id: frameId } })
  if (!frame) throw new Error('Le cadre de destination est introuvable.')
  if (mode === '--apply') {
    const { count } = await prisma.photo.updateMany({ where: orphanPhotos, data: { frameId } })
    console.log(`${count} photo(s) rattachée(s) au cadre « ${frame.name} ».`)
  } else {
    const count = await prisma.photo.count({ where: orphanPhotos })
    console.log(`Aperçu : ${count} photo(s) à rattacher au cadre « ${frame.name} ». Ajouter --apply pour appliquer.`)
  }
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
