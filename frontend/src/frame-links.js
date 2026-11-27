export function frameHref(path, frameId) {
  return frameId ? `${path}?frame=${encodeURIComponent(frameId)}` : path
}

export function framePhotos(frameId) {
  return `/api/frames/${encodeURIComponent(frameId)}/photos`
}
