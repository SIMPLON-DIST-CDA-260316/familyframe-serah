import { useState } from 'react'
import { frameHref } from './frame-links.js'

export default function FrameAccess({ frames, path, initialCode }) {
  const [invitation, setInvitation] = useState(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event, join) {
    event.preventDefault()
    const value = new FormData(event.currentTarget).get(join ? 'code' : 'name')
    setPending(true)
    setError('')
    setInvitation(null)
    try {
      const response = await fetch(join ? '/api/frames/join' : '/api/frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(join ? { code: value } : { name: value }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Impossible d’ouvrir le cadre.')
      if (join) window.location.assign(frameHref(path, result.id))
      else setInvitation(result)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="access-panel" aria-labelledby="access-title">
      <h1 id="access-title">Vos cadres</h1>
      {frames.length > 0 ? (
        <ul className="frame-list" aria-label="Cadres rejoints">
          {frames.map(frame => <li key={frame.id}><a href={frameHref(path, frame.id)}>{frame.name}</a></li>)}
        </ul>
      ) : <p className="form-intro">Rejoignez un cadre avec son invitation ou créez-en un pour votre famille.</p>}

      {error ? <p className="form-message error" role="alert">{error}</p> : null}
      {invitation ? (
        <section className="invite-panel" aria-labelledby="invite-title">
          <h2 id="invite-title">Inviter vos proches</h2>
          <p>Partagez ce code ou ce QR code avec les personnes qui peuvent accéder à « {invitation.frame.name} ».</p>
          <img width="168" height="168" src={invitation.qr} alt="QR code d’invitation au cadre" />
          <label htmlFor="invite-code">Code d’invitation</label>
          <input id="invite-code" type="text" readOnly value={invitation.code} />
          <a href={invitation.invitationUrl} target="_blank" rel="noreferrer">Ouvrir le lien d’invitation</a>
          <a className="text-link" href={frameHref(path, invitation.frame.id)}>Ouvrir le cadre « {invitation.frame.name} »</a>
        </section>
      ) : (
        <div className="access-choices">
          <form onSubmit={event => submit(event, true)}>
            <h2>Rejoindre un cadre</h2>
            <label htmlFor="join-code">Code d’invitation</label>
            <input id="join-code" name="code" type="text" defaultValue={initialCode} autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={24} required />
            <button className="send-button" disabled={pending}>Rejoindre le cadre</button>
          </form>
          <form onSubmit={event => submit(event, false)}>
            <h2>Créer un cadre</h2>
            <label htmlFor="frame-name">Nom du cadre</label>
            <input id="frame-name" name="name" type="text" placeholder="Ex. Famille Dupont" maxLength={60} required />
            <button className="send-button" disabled={pending}>Créer le cadre</button>
          </form>
        </div>
      )}
    </section>
  )
}
