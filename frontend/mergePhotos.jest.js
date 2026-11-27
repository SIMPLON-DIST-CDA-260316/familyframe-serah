import { expect, test } from '@jest/globals'
import { mergePhotos } from './src/photos.js'

test('place la photo la plus récente en premier', () => {
    const ancienne = { id: 'a', createdAt: '2026-11-26T10:00:00Z' }
    const recente = { id: 'b', createdAt: '2026-11-26T11:00:00Z' }

    const resultat = mergePhotos([], [ancienne, recente])

    expect(resultat).toEqual([ancienne, recente])
})
