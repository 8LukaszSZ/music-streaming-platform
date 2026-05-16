import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { getPopularPlaylists } from '../api/profileApi'
import { getApiOrigin } from '../api/httpClient'
import { useAuth } from '../hooks/useAuth'
import { getToken } from '../utils/auth'

interface Playlist {
  id: string
  name: string
  description?: string
  userId: string
  username?: string
  playlistImagePath?: string
  isPublic: boolean
  createdAt?: string
}

export function MorePopularPlaylistsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [playlists, setPlaylists] = useState<Playlist[]>([])

  const isAuthenticated = useAuth()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const token = getToken() || undefined
        const fetchedPlaylists = await getPopularPlaylists(25, token)
        setPlaylists(fetchedPlaylists)
      } catch (error) {
        console.error('Failed to load popular playlists:', error)
        setPlaylists([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const handlePlaylistClick = (playlistId: string) => {
    navigate(`/playlist/${playlistId}`)
  }

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <div className="upload-page-container">
          <p>Loading...</p>
        </div>
        <Footer isAuthenticated={isAuthenticated} />
      </div>
    )
  }

  return (
    <div className="page">
      <Navbar />
      <div className="upload-page-container">
        <h1 className="upload-page-title">Popular Playlists</h1>
        {playlists.length === 0 ? (
          <p className="track-meta">No popular playlists yet.</p>
        ) : (
          <div className="tiles-grid">
            {playlists.map((playlist, index) => (
              <article
                key={playlist.id}
                className="media-tile"
                onClick={() => handlePlaylistClick(playlist.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className={`tile-cover cover-${(index % 6) + 1}`}>
                  {playlist.playlistImagePath && (
                    <img
                      src={`${getApiOrigin()}/${playlist.playlistImagePath.replace(/^\//, '')}`}
                      alt={playlist.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </div>
                <div className="tile-body">
                  <p className="track-title">{playlist.name}</p>
                  <p className="track-meta">{playlist.username || 'Unknown'}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <Footer isAuthenticated={isAuthenticated} />
    </div>
  )
}
