import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { mergePhotos } from './photos.js'
import Icon from './Icon.jsx'
import { frameHref, framePhotos } from './frame-links.js'

function Frame({ frame }) {
  const [photos, setPhotos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [connection, setConnection] = useState('connecting')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    const socket = io({ auth: { frameId: frame.id } })

    async function loadPhotos() {
      try {
        const response = await fetch(framePhotos(frame.id))
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Impossible de charger les photos.')
        if (active) {
          setPhotos(current => mergePhotos(current, result))
          setError('')
        }
      } catch (error) {
        if (active) setError(error instanceof TypeError || error instanceof SyntaxError
          ? 'Impossible de charger les photos. Vérifiez le serveur et votre connexion.'
          : error.message)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    socket.on('connect', () => {
      setConnection('live')
      loadPhotos()
    })
    socket.on('disconnect', () => setConnection('offline'))
    socket.on('connect_error', () => setConnection('offline'))
    socket.on('photo:new', photo => {
      setPhotos(current => mergePhotos(current, [photo]))
      setError('')
    })
    loadPhotos()

    return () => {
      active = false
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [attempt, frame.id])

  function retry() {
    setError('')
    setIsLoading(true)
    setConnection('connecting')
    setAttempt(current => current + 1)
  }

  const latest = photos[0]
  const previous = photos.slice(1)
  const liveLabel = { live: 'En direct', connecting: 'Connexion au cadre…', offline: 'Direct interrompu' }[connection]

  return (
    <section className="frame" aria-labelledby="frame-title">
      <div className="frame-heading">
        <h1 id="frame-title">Le cadre familial</h1>
        <p className={`live-status ${connection === 'live' ? 'is-connected' : ''}`} role="status"><span aria-hidden="true" />{liveLabel}</p>
      </div>
      {error ? <div className="frame-error"><p role="alert">{error}</p><button type="button" onClick={retry}>Réessayer</button></div> : null}
      {(isLoading && !latest && !error) ? <div className="frame-placeholder" role="status"><p>Chargement des photos…</p></div> : null}
      {!isLoading && !latest && !error ? <div className="frame-placeholder"><Icon name="image" /><h2>En attendant la première photo</h2><p>Les nouvelles photos apparaîtront ici automatiquement.</p><a className="text-link" href={frameHref('/', frame.id)}>Partager la première photo <Icon name="arrow" /></a></div> : null}

      {latest ? (
        <figure className="latest" key={latest.id}>
          <div className="photo-stage"><img src={latest.url} alt={`Photo partagée par ${latest.pseudo}`} /></div>
          <figcaption>
            <span className="photo-author">Un souvenir de <strong>{latest.pseudo}</strong></span>
            <time dateTime={latest.createdAt}>{new Date(latest.createdAt).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</time>
          </figcaption>
        </figure>
      ) : null}

      {previous.length > 0 ? (
        <details className="photo-history">
          <summary><span>Les souvenirs précédents <span className="history-count">({previous.length})</span></span><Icon name="chevron" /></summary>
          <ul className="history">
            {previous.map(photo => (
              <li key={photo.id}>
                <figure>
                  <a href={photo.url} target="_blank" rel="noreferrer">
                    <img src={photo.url} alt={`Photo partagée par ${photo.pseudo}`} loading="lazy" />
                  </a>
                  <figcaption>
                    <strong>{photo.pseudo}</strong><time dateTime={photo.createdAt}>{new Date(photo.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  )
}

export default Frame
