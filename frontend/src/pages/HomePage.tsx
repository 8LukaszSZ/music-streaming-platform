import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Footer } from '../components/Footer'
import { Navbar } from '../components/Navbar'
import { getTrendingTracks } from '../api/audioApi'
import { getPopularPlaylists } from '../api/profileApi'
import { getApiOrigin } from '../api/httpClient'
import { useAuth } from '../hooks/useAuth'

interface TrendingTrack {
  id: string
  title: string
  username: string
  userId: string
  trackImagePath?: string
  duration: number
}

interface PopularPlaylist {
  id: string
  name: string
  description?: string
  userId: string
  username?: string
  playlistImagePath?: string
  isPublic: boolean
}

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
  const [trendingTracks, setTrendingTracks] = useState<TrendingTrack[]>([])
  const [popularPlaylists, setPopularPlaylists] = useState<PopularPlaylist[]>([])
  const [loading, setLoading] = useState(true)
  const isAuthenticated = useAuth()

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length)
    }, 4500)

    return () => window.clearInterval(timer)
  }, [slides.length])

  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('authToken') || undefined
        const [tracks, playlists] = await Promise.all([
          getTrendingTracks(6, token),
          getPopularPlaylists(4, token)
        ])
        setTrendingTracks(tracks)
        setPopularPlaylists(playlists)
      } catch (error) {
        console.error('Failed to load home data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadHomeData()
  }, [])

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
                    onClick={() => navigate(isAuthenticated ? '/upload' : '/login')}
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
            <Link to="/trending">Explore all tracks</Link>
          </div>
          <div className="tiles-grid">
            {loading ? (
              <p>Loading trending tracks...</p>
            ) : trendingTracks.length === 0 ? (
              <p>No trending tracks yet.</p>
            ) : (
              trendingTracks.map((track, index) => (
                <article
                  key={track.id}
                  className="media-tile"
                  onClick={() => navigate(`/track/${track.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={`tile-cover cover-${(index % 6) + 1}`}>
                    {track.trackImagePath && (
                      <img
                        src={`${getApiOrigin()}/${track.trackImagePath.replace(/^\//, '')}`}
                        alt={track.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>
                  <div className="tile-body">
                    <p className="track-title">{track.title}</p>
                    <p className="track-meta">{track.username || 'Unknown Artist'}</p>
                    <div className="tile-stats">
                      <span>{track.duration ? `${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, '0')}` : '-'}</span>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="home-section">
          <div className="section-header">
            <h2>Popular Playlists</h2>
            <Link to="/playlists/popular">Explore playlists</Link>
          </div>
          <div className="playlist-grid">
            {loading ? (
              <p>Loading popular playlists...</p>
            ) : popularPlaylists.length === 0 ? (
              <p>No popular playlists yet.</p>
            ) : (
              popularPlaylists.map((playlist) => (
                <article
                  key={playlist.id}
                  className="playlist-tile"
                  onClick={() => navigate(`/playlist/${playlist.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="playlist-thumb">
                    {playlist.playlistImagePath && (
                      <img
                        src={`${getApiOrigin()}/${playlist.playlistImagePath.replace(/^\//, '')}`}
                        alt={playlist.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                      />
                    )}
                  </div>
                  <div>
                    <p className="playlist-name">{playlist.name}</p>
                    <p className="track-meta">{playlist.username || 'Unknown'}</p>
                    <p className="playlist-extra">{playlist.description || 'Public playlist'}</p>
                  </div>
                </article>
              ))
            )}
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
          <button type="button" onClick={() => navigate(isAuthenticated ? '/upload' : '/login')}>
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
