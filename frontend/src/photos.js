export function mergePhotos(current, incoming) {
  const byId = new Map([...current, ...incoming].map(photo => [photo.id, photo]))
  return [...byId.values()].sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt) || b.id.localeCompare(a.id),
  )
}
