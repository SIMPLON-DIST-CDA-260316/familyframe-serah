import { useEffect, useState } from 'react'
import FrameAccess from './FrameAccess.jsx'
import { frameHref } from './frame-links.js'
import PhotoForm from './PhotoForm.jsx'
import Frame from './Frame.jsx'
import Icon from './Icon.jsx'

function App() {
  const isFrame = window.location.pathname === '/cadre'
  const path = isFrame ? '/cadre' : '/'
  const selectedId = new URLSearchParams(window.location.search).get('frame')
  const invitationCode = new URLSearchParams(window.location.hash.slice(1)).get('invitation') ?? ''
  const [frames, setFrames] = useState(null)
  const [error, setError] = useState('')
  const currentFrame = invitationCode ? null : frames?.find(frame => frame.id === selectedId)

  useEffect(() => {
    const request = new AbortController()
    async function loadFrames() {
      try {
        const response = await fetch('/api/frames', { signal: request.signal })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Impossible de charger vos cadres.')
        setFrames(result)
      } catch (failure) {
        if (!request.signal.aborted) setError(failure.message)
      }
    }
    loadFrames()
    return () => request.abort()
  }, [])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#content">Aller au contenu</a>
      <header className="site-header">
        <a className="brand" href={frameHref('/', currentFrame?.id)} aria-label="FamilyFrame — accueil">
          <Icon name="frame" />
          <span>FamilyFrame<span className="brand-dot">.</span></span>
        </a>
        <nav aria-label="Navigation principale">
          <a href={frameHref('/', currentFrame?.id)} aria-current={!isFrame ? 'page' : undefined}><Icon name="camera" /> Partager</a>
          <a href={frameHref('/cadre', currentFrame?.id)} aria-current={isFrame ? 'page' : undefined}><Icon name="frame" /> Le cadre</a>
        </nav>
      </header>
      {currentFrame ? (
        <div className="frame-context">
          <span>Cadre actif <strong>{currentFrame.name}</strong></span>
          <a href={path}>Changer de cadre</a>
        </div>
      ) : null}
      <main id="content" className={isFrame || !currentFrame ? 'frame-layout' : 'share-layout'}>
        {error ? <p className="frame-error" role="alert">{error}</p>
          : !frames ? <p role="status">Chargement de vos cadres…</p>
          : !currentFrame ? <FrameAccess frames={frames} path={path} initialCode={invitationCode} />
          : isFrame ? <Frame frame={currentFrame} /> : <>
          <PhotoForm frame={currentFrame} />
          <div className="share-intro" aria-hidden="true">
            <div className="memory-print">
              <img src="/images/family-moment.webp" alt="" width="1200" height="900" />
            </div>
          </div>
        </>}
      </main>
      <footer className="site-footer">
        <a href={frameHref(isFrame ? '/' : '/cadre', currentFrame?.id)}>{isFrame ? 'Partager une photo' : 'Ouvrir le cadre'} <Icon name="arrow" /></a>
      </footer>
    </div>
  )
}

export default App
