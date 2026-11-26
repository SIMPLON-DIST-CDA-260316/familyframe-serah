import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'

function PhotoForm() {
  const [photo, setPhoto] = useState(null)
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [preview, setPreview] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  function clearMessage() {
    setMessage('')
    setStatus('')
  }

  function selectPhoto(event) {
    const selected = event.target.files[0]
    if (!selected) return
    setPhoto(selected)
    setPreview(selected.size <= 5 * 1024 * 1024 && selected.type.startsWith('image/')
      ? URL.createObjectURL(selected) : '')
    clearMessage()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSending) return

    const form = event.currentTarget
    const formData = new FormData(form)
    const pseudo = formData.get('pseudo').trim()
    if (!pseudo || pseudo.length > 50) {
      setStatus('error')
      setMessage('Le pseudo doit contenir entre 1 et 50 caractères.')
      return
    }
    if (!photo || photo.size === 0 || photo.size > 5 * 1024 * 1024) {
      setStatus('error')
      setMessage('Choisissez une photo non vide de 5 Mo maximum.')
      return
    }

    formData.set('pseudo', pseudo)
    formData.set('photo', photo)
    setIsSending(true)
    setStatus('sending')
    setMessage('Envoi en cours…')
    try {
      const response = await fetch('/api/photos', { method: 'POST', body: formData })
      const result = await response.json()
      if (!response.ok) {
        setStatus('error')
        setMessage(result.error || 'La photo n’a pas pu être envoyée.')
        return
      }
      setStatus('success')
      setMessage('Sourire envoyé ! Votre photo est maintenant sur le cadre.')
      form.reset()
      setPhoto(null)
      setPreview('')
    } catch {
      setStatus('error')
      setMessage('Envoi impossible. Vérifiez votre connexion et le démarrage du serveur.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <form className="photo-form" onSubmit={handleSubmit} onChange={clearMessage} aria-labelledby="form-title" aria-busy={isSending}>
      <h2 id="form-title">Quoi de neuf chez vous ?</h2>
      <p className="form-intro">Partagez un instant avec vos proches. <br />Il trouvera sa place sur leur cadre.</p>
      <fieldset disabled={isSending}>
        <legend className="visually-hidden">Votre souvenir à partager</legend>
        <div className="form-field">
          <label htmlFor="pseudo">Votre pseudo</label>
          <input id="pseudo" name="pseudo" type="text" placeholder="Comment vous appelle-t-on ?" maxLength={50} required autoComplete="nickname" />
        </div>
        <div className="form-field">
          <label htmlFor="photo">Votre photo</label>
          <div className={`photo-picker ${photo ? 'has-photo' : ''}`}>
            <input id="photo" type="file" accept="image/*" onChange={selectPhoto} required={!photo} aria-label={photo ? 'Changer de photo' : 'Choisir une photo'} aria-describedby="photo-help selected-photo" />
            {preview ? <img className="photo-preview" src={preview} alt="Aperçu de la photo choisie" onError={() => setPreview('')} /> : <Icon name="image" />}
            <span className="picker-title">{photo ? 'Changer de photo' : 'Choisir une photo'}</span>
            <span className="picker-hint">{photo ? 'Un autre instant à partager ?' : 'Depuis votre téléphone ou votre ordinateur'}</span>
          </div>
          <div className="camera-picker">
            <input id="camera" type="file" accept="image/*" capture="environment" onChange={selectPhoto} aria-label="Prendre une photo" aria-describedby="camera-help" />
            <span><Icon name="camera" /> Ou prendre une photo</span>
          </div>
          <p id="photo-help" className="field-help">5 Mo maximum · Les images sont adaptées pour le cadre.</p>
          <p id="camera-help" className="visually-hidden">L’ouverture de l’appareil photo dépend de votre navigateur mobile.</p>
          {photo ? <p id="selected-photo" className="selected-file"><Icon name="check" /><span>{photo.name}</span></p> : <span id="selected-photo" />}
        </div>
        <button className="send-button" type="submit">
          {isSending ? <><span className="spinner" /> Envoi de votre sourire…</> : <>Envoyer un sourire <Icon name="arrow" /></>}
        </button>
      </fieldset>
      {message ? <div className={`form-message ${status}`} role={status === 'error' ? 'alert' : 'status'}>
        {status === 'success' ? <Icon name="check" /> : null}
        <p>{message}{status === 'success' ? <> <a href="/cadre">Voir le cadre <span aria-hidden="true">→</span></a></> : null}</p>
      </div> : <p className="form-note">Votre photo apparaîtra directement sur le cadre.</p>}
    </form>
  )
}

export default PhotoForm
