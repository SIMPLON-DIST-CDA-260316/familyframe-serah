import assert from 'node:assert/strict'
import test from 'node:test'
import { mergePhotos } from '../src/photos.js'

test('une réponse HTTP ancienne ne remplace pas la photo reçue en direct', () => {
  const recent = { id: 'b', createdAt: '2026-11-23T12:00:00Z' }
  const old = { id: 'a', createdAt: '2026-11-23T11:00:00Z' }
  assert.deepEqual(mergePhotos([recent], [old]), [recent, old])
})

test('le rechargement et le direct ne créent pas de doublons', () => {
  const photo = { id: 'a', createdAt: '2026-11-23T11:00:00Z' }
  assert.deepEqual(mergePhotos([photo], [photo]), [photo])
})

test('le tri reste stable quand deux photos ont la même date', () => {
  const a = { id: 'a', createdAt: '2026-11-23T11:00:00Z' }
  const b = { id: 'b', createdAt: a.createdAt }
  assert.deepEqual(mergePhotos([a], [b]), [b, a])
})
