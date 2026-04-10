import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Footer } from '../components/Footer'
import { Navbar } from '../components/Navbar'

const trendingTracks = [
  { title: 'Midnight Pulse', artist: 'Astra Nova', plays: '84K plays', genre: 'Synthwave', duration: '3:14' },
  { title: 'Neon Streets', artist: 'Kairo', plays: '61K plays', genre: 'Alt Pop', duration: '2:58' },
  { title: 'Cloudline', artist: 'Lumi', plays: '45K plays', genre: 'Lo-fi', duration: '3:42' },
  { title: 'Gravity Echo', artist: 'Elar', plays: '39K plays', genre: 'House', duration: '4:01' },
  { title: 'Afterlight', artist: 'Mono Vale', plays: '33K plays', genre: 'Indie', duration: '2:45' },
  { title: 'Zero Hour', artist: 'Daxon', plays: '27K plays', genre: 'Trap', duration: '3:27' },
]

const featuredPlaylists = [
  { name: 'Late Night Coding', tag: 'Electronic / Chill', tracks: '42 tracks' },
  { name: 'Focus Flow', tag: 'Lo-fi / Ambient', tracks: '28 tracks' },
  { name: 'Fresh Finds Weekly', tag: 'Trending / New', tracks: '35 tracks' },
  { name: 'Sunset Drive', tag: 'Pop / House', tracks: '21 tracks' },
]

export function HomePage() {
  const navigate = useNavigate()
  const slides = [
    {
      imageUrl: 'https://www.rollingstone.com/wp-content/uploads/2018/06/rs-175023-144588548.jpg',
      title: 'Discover. Get Discovered.',
      description: 'Find fresh tracks and let your music reach new listeners every day.',
    },
    {
      imageUrl:
        'https://www.mensjournal.com/.image/NDI6MDAwMDAwMDAxMTE1NDAw/gettyimages-75944522.jpg?io=1&profile=w2560&ar=16-9&x=38&y=37',
      title: 'Publish and listen without limits.',
      description: 'Everyone can listen, upload songs, and share playlists on WaveStream.',
    },
  ]
  const [activeSlide, setActiveSlide] = useState(0)
  const isAuthenticated = Boolean(localStorage.getItem('authToken'))

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length)
    }, 4500)

    return () => window.clearInterval(timer)
  }, [slides.length])

  return (
    <main>
      <Navbar />

      <section className="hero-slider">
        {slides.map((slide, index) => (
          <article
            key={slide.title}
            className={`hero-slide ${index === activeSlide ? 'is-active' : ''}`}
            style={{ backgroundImage: `url(${slide.imageUrl})` }}
          >
            <div className="hero-overlay">
              <p className="eyebrow">Discover Tracks and Playlists</p>
              <h1>{slide.title}</h1>
              <p className="hero-copy">{slide.description}</p>
              <div className="hero-actions">
                {index === 0 ? (
                  <Link to="/stream" className="hero-btn primary">
                    Go to Stream
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="hero-btn primary"
                    onClick={() => navigate(isAuthenticated ? '/stream' : '/register')}
                  >
                    Upload
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
        <div className="slider-dots">
          {slides.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              className={index === activeSlide ? 'is-active' : ''}
              onClick={() => setActiveSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <div className="app-shell">
        <section className="home-section">
          <div className="section-header">
            <h2>Trending Tracks</h2>
            <Link to="/stream">Explore all tracks</Link>
          </div>
          <div className="tiles-grid">
            {trendingTracks.map((track, index) => (
              <article key={track.title} className="media-tile">
                <div className={`tile-cover cover-${(index % 6) + 1}`}>
                  <span>{track.genre}</span>
                </div>
                <div className="tile-body">
                  <p className="track-title">{track.title}</p>
                  <p className="track-meta">{track.artist}</p>
                  <div className="tile-stats">
                    <span>{track.plays}</span>
                    <span>{track.duration}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="home-section">
          <div className="section-header">
            <h2>Popular Playlists</h2>
            <Link to="/stream">Explore playlists</Link>
          </div>
          <div className="playlist-grid">
            {featuredPlaylists.map((playlist) => (
              <article key={playlist.name} className="playlist-tile">
                <div className="playlist-thumb" />
                <div>
                  <p className="playlist-name">{playlist.name}</p>
                  <p className="track-meta">{playlist.tag}</p>
                  <p className="playlist-extra">{playlist.tracks}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="creator-banner">
          <div>
            <p className="eyebrow">Calling all creators</p>
            <h3>Upload your music. Build your audience.</h3>
            <p>
              Anyone can listen and anyone can publish. Start sharing tracks, build playlists, and connect with new
              fans on WaveStream.
            </p>
          </div>
          <button type="button" onClick={() => navigate(isAuthenticated ? '/stream' : '/register')}>
            Start uploading
          </button>
        </section>

        <section className="closing-cta">
          <p className="eyebrow">Thanks for listening</p>
          <h3>Ready to build your music space with us?</h3>
          {!isAuthenticated ? (
            <>
              <Link to="/register" className="hero-btn primary">
                Create account
              </Link>
              <p className="closing-signin">
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </>
          ) : null}
        </section>
      </div>

      <Footer isAuthenticated={isAuthenticated} />
    </main>
  )
}
