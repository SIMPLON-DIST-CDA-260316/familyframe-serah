import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { mergePhotos } from './photos.js'
import Icon from './Icon.jsx'

function Frame() {
  const [photos, setPhotos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    let active = true
    const socket = io()

    async function loadPhotos() {
      try {
        const response = await fetch('/api/photos')
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
      setIsConnected(true)
      loadPhotos()
    })
    socket.on('disconnect', () => setIsConnected(false))
    socket.on('connect_error', () => setIsConnected(false))
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
  }, [])

  const latest = photos[0]
  const previous = photos.slice(1)

  return (
    <section className="frame" aria-labelledby="frame-title">
      <div className="frame-heading">
        <h1 id="frame-title">Les instants qui nous rapprochent.</h1>
        <p className={`live-status ${isConnected ? 'is-connected' : ''}`} role="status"><span />{isConnected ? 'Connecté au direct' : 'Connexion au direct…'}</p>
      </div>
      {error ? <p className="frame-error" role="alert">{error}</p> : null}
      {isLoading && !latest ? <div className="frame-placeholder"><span className="spinner" /><p>Vos souvenirs arrivent…</p></div> : null}
      {!isLoading && !latest && !error ? <div className="frame-placeholder"><Icon name="image" /><h2>Le début de vos souvenirs.</h2><p>Une première photo, et vous voilà un peu plus proches.</p><a className="text-link" href="/">Partager le premier souvenir <Icon name="arrow" /></a></div> : null}

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
