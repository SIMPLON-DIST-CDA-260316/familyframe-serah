import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { frameHref, framePhotos } from './frame-links.js'

const maxPhotoSize = 5 * 1024 * 1024

function PhotoForm({ frame }) {
  const [photo, setPhoto] = useState(null)
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [preview, setPreview] = useState('')
  const [status, setStatus] = useState('')
  const fileInput = useRef(null)
  const cameraInput = useRef(null)
  const pickerButton = useRef(null)

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
    event.target.value = ''
    if (selected.size === 0 || selected.size > maxPhotoSize) {
      setPhoto(null)
      setPreview('')
      setStatus('error')
      setMessage('Choisissez une photo non vide de 5 Mo maximum.')
      return
    }
    setPhoto(selected)
    setPreview(selected.type.startsWith('image/') ? URL.createObjectURL(selected) : '')
    clearMessage()
  }

  function removePhoto() {
    setPhoto(null)
    setPreview('')
    clearMessage()
    pickerButton.current?.focus()
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
    if (!photo) {
      setStatus('error')
      setMessage('Choisissez une photo avant de l’envoyer.')
      pickerButton.current?.focus()
      return
    }

    formData.set('pseudo', pseudo)
    formData.set('photo', photo)
    setIsSending(true)
    setStatus('sending')
    setMessage('Envoi en cours…')
    try {
      const response = await fetch(framePhotos(frame.id), { method: 'POST', body: formData })
      const result = await response.json()
      if (!response.ok) {
        setStatus('error')
        setMessage(result.error || 'La photo n’a pas pu être envoyée.')
        return
      }
      setStatus('success')
      setMessage('Photo envoyée. Elle est disponible sur le cadre.')
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
    <form className="photo-form" onSubmit={handleSubmit} aria-labelledby="form-title" aria-busy={isSending}>
      <h1 id="form-title">Partager une photo</h1>
      <p className="form-intro">Elle apparaîtra en direct sur le cadre de vos proches.</p>
      <fieldset disabled={isSending}>
        <legend className="visually-hidden">Votre souvenir à partager</legend>
        <div className="form-field">
          <label htmlFor="pseudo">Votre prénom ou pseudo</label>
          <input id="pseudo" name="pseudo" type="text" placeholder="Ex. Camille" maxLength={50} required autoComplete="nickname" onChange={clearMessage} />
        </div>
        <div className="form-field">
          <p className="field-label">Votre photo</p>
          <input hidden ref={fileInput} type="file" accept="image/*" onChange={selectPhoto} />
          <input hidden ref={cameraInput} type="file" accept="image/*" capture="environment" onChange={selectPhoto} />
          <button ref={pickerButton} type="button" className={`photo-picker ${photo ? 'has-photo' : ''}`} onClick={() => fileInput.current?.click()} aria-describedby="photo-help">
            {preview ? <img className="photo-preview" src={preview} alt="" onError={() => setPreview('')} /> : <span className="picker-icon"><Icon name="image" /></span>}
            <span className="picker-title">{photo ? 'Changer de photo' : 'Choisir une photo'}</span>
          </button>
          <div className="photo-options">
            <p id="photo-help" className="field-help">Image de 5 Mo maximum</p>
            <button type="button" className="camera-picker" onClick={() => cameraInput.current?.click()}><Icon name="camera" /> Prendre une photo</button>
          </div>
          {photo ? <div className="selected-file"><Icon name="check" /><span>{photo.name}</span><button type="button" onClick={removePhoto}>Retirer</button></div> : null}
        </div>
        <button className="send-button" type="submit">
          {isSending ? <><span className="spinner" /> Envoi en cours…</> : <>Envoyer la photo <Icon name="arrow" /></>}
        </button>
      </fieldset>
      {message ? <div className={`form-message ${status}`} role={status === 'error' ? 'alert' : 'status'}>
        {status === 'success' ? <Icon name="check" /> : null}
        <p>{message}{status === 'success' ? <> <a href={frameHref('/cadre', frame.id)}>Voir le cadre <span aria-hidden="true">→</span></a></> : null}</p>
      </div> : null}
    </form>
  )
}

export default PhotoForm
