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
          <a href="/" aria-current={!isFrame ? 'page' : undefined}>Partager une photo</a>
          <a href="/cadre" aria-current={isFrame ? 'page' : undefined}>Le cadre familial</a>
        </nav>
      </header>
      <main id="content" className={isFrame ? 'frame-layout' : 'share-layout'}>
        {isFrame ? <Frame /> : <>
          <section className="share-intro" aria-labelledby="intro-title">
            <h1 id="intro-title">Un petit moment.<br /><em>Un grand sourire.</em></h1>
            <p>Une photo de votre quotidien, un peu de vous<br className="desktop-break" /> chez ceux que vous aimez.</p>
            <figure className="memory-print">
              <img src="/images/family-moment.webp" alt="" width="1200" height="900" />
              <figcaption>Les souvenirs font le lien.</figcaption>
            </figure>
          </section>
          <PhotoForm />
        </>}
      </main>
      <footer className="site-footer">
        <p>Un peu plus proches, même de loin.</p>
        <span>FamilyFrame · Les instants qui comptent</span>
      </footer>
    </div>
  )
}

export default App
