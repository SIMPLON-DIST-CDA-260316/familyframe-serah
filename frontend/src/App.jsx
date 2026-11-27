import PhotoForm from './PhotoForm.jsx'
import Frame from './Frame.jsx'
import Icon from './Icon.jsx'

function App() {
  const isFrame = window.location.pathname === '/cadre'

  return (
    <div className="app-shell">
      <a className="skip-link" href="#content">Aller au contenu</a>
      <header className="site-header">
        <a className="brand" href="/" aria-label="FamilyFrame — accueil">
          <Icon name="frame" />
          <span>FamilyFrame<span className="brand-dot">.</span></span>
        </a>
        <nav aria-label="Navigation principale">
          <a href="/" aria-current={!isFrame ? 'page' : undefined}><Icon name="camera" /> Partager</a>
          <a href="/cadre" aria-current={isFrame ? 'page' : undefined}><Icon name="frame" /> Le cadre</a>
        </nav>
      </header>
      <main id="content" className={isFrame ? 'frame-layout' : 'share-layout'}>
        {isFrame ? <Frame /> : <>
          <PhotoForm />
          <aside className="share-intro" aria-label="Une photo, un souvenir">
            <figure className="memory-print">
              <img src="/images/family-moment.webp" alt="" width="1200" height="900" />
              <figcaption><Icon name="frame" /><span>Les petits moments<br /><em>font les grands souvenirs.</em></span></figcaption>
            </figure>
          </aside>
        </>}
      </main>
      <footer className="site-footer">
        <p>Un peu plus proches, même de loin.</p>
        <a href={isFrame ? '/' : '/cadre'}>{isFrame ? 'Partager une photo' : 'Ouvrir le cadre'} <Icon name="arrow" /></a>
      </footer>
    </div>
  )
}

export default App
