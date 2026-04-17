import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { ProfileMediaTile } from '../components/ProfileMediaTile'
import { getApiOrigin } from '../api/httpClient'
import { request } from '../api/httpClient'
import { likeTrack, unlikeTrack, removeTrackFromPlaylist } from '../api/audioApi'
import type { Playlist, PlaylistTrack, PlaylistTrackInfo } from '../types/profile'
import { useAudio } from '../contexts/AudioContext'

export function PlaylistPage() {
  const { playlistId } = useParams<{ playlistId: string }>()
  const navigate = useNavigate()
  const { setTrackList, likedTracks, toggleLike } = useAudio()
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [tracks, setTracks] = useState<PlaylistTrackInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const currentUserId = useMemo(() => {
    const token = localStorage.getItem('authToken')
    if (!token) return null
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.nameid || payload.sub || null
    } catch {
      return null
    }
  }, [])

  const isAuthenticated = useMemo(() => Boolean(localStorage.getItem('authToken')), [])

  const resolveImage = (path: string | undefined) => {
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://')) return path

    const normalizedPath = path.replaceAll('\\', '/').replace(/^wwwroot\//, '')
    return `${getApiOrigin()}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`
  }

  const handlePlayTrack = (_trackId: string) => {
    const trackList = tracks.map((track) => ({
      id: track.id,
      title: track.title,
      subtitle: track.username || 'Deleted User',
      imageUrl: track.trackImagePath ? resolveImage(track.trackImagePath) : undefined,
      duration: track.duration,
      userId: track.userId,
    }))
    setTrackList(trackList)
  }

  const likedTrackIds = useMemo(() => {
    return new Set(likedTracks.map((track) => track.id))
  }, [likedTracks])

  const handleLikeToggle = async (trackId: string, isLiked: boolean) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      alert('You need to log in to like tracks')
      return
    }

    try {
      if (isLiked) {
        await likeTrack(trackId, token)
      } else {
        await unlikeTrack(trackId, token)
      }

      const track = tracks.find((t) => t.id === trackId)
      if (track) {
        toggleLike(trackId, isLiked, {
          id: track.id,
          title: track.title,
          subtitle: track.username || 'Deleted User',
          imageUrl: track.trackImagePath ? resolveImage(track.trackImagePath) : undefined,
          duration: track.duration,
          userId: track.userId,
        })
      }
    } catch (error) {
      console.error('Failed to toggle like:', error)
      alert('Failed to update like status')
    }
  }

  const handleRemoveFromPlaylist = async (trackId: string) => {
    if (!confirm('Are you sure you want to remove this track from the playlist?')) return

    const token = localStorage.getItem('authToken')
    if (!token) {
      alert('You need to log in to remove tracks from playlist')
      return
    }

    try {
      const trackToRemove = tracks.find((t) => t.id === trackId)
      if (!trackToRemove || !trackToRemove.playlistTrackId) {
        alert('Unable to remove track from playlist')
        return
      }

      await removeTrackFromPlaylist(playlistId!, trackToRemove.playlistTrackId, token)
      setTracks(tracks.filter((t) => t.id !== trackId))
    } catch (error) {
      console.error('Failed to remove track from playlist:', error)
      alert('Failed to remove track from playlist')
    }
  }

  const totalDuration = useMemo(() => {
    const duration = tracks.reduce((sum, track) => sum + (track.duration || 0), 0)
    console.log('Total duration calculation:', { tracks, duration })
    return duration
  }, [tracks])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours} hr ${minutes} min`
    }
    return `${minutes} min`
  }

  useEffect(() => {
    const loadPlaylist = async () => {
      if (!playlistId) return

      try {
        const token = localStorage.getItem('authToken') || undefined
        const [playlistData, tracksData] = await Promise.all([
          request<Playlist>(`/playlists/${playlistId}`, { token }),
          request<PlaylistTrack[]>(`/playlists/${playlistId}/tracks`, { token }),
        ])

        setPlaylist(playlistData)

        // Fetch user data separately
        if (playlistData.userId) {
          try {
            const userData = await request<{ id: string; username: string; profileImagePath?: string }>(`/user/${playlistData.userId}`, { token })
            setPlaylist({ ...playlistData, user: userData })
          } catch (userErr) {
            console.error('Failed to load user:', userErr)
          }
        }

        // Fetch track details for each playlist track
        if (tracksData && tracksData.length > 0) {
          const trackDetails = await Promise.all(
            tracksData.map(async (pt) => {
              const trackInfo = await request<PlaylistTrackInfo>(`/LocalTracks/${pt.localTrackId}`, { token })
              return {
                ...trackInfo,
                playlistTrackId: pt.id
              }
            })
          )
          console.log('Track details:', trackDetails)
          setTracks(trackDetails)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load playlist')
      } finally {
        setLoading(false)
      }
    }

    loadPlaylist()
  }, [playlistId])

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <div className="profile-container">
          <p>Loading...</p>
        </div>
        <Footer isAuthenticated={isAuthenticated} />
      </div>
    )
  }

  if (error || !playlist) {
    return (
      <div className="page">
        <Navbar />
        <div className="profile-container">
          <p>{error || 'Playlist not found'}</p>
        </div>
        <Footer isAuthenticated={isAuthenticated} />
      </div>
    )
  }

  return (
    <div className="page">
      <Navbar />
      <div className="playlist-page">
        <div className="playlist-page-header">
          <div className="playlist-page-left">
            {playlist.playlistImagePath ? (
              <img className="playlist-page-image" src={resolveImage(playlist.playlistImagePath)} alt={playlist.name} />
            ) : (
              <div className="playlist-page-image placeholder">{playlist.name.slice(0, 1).toUpperCase()}</div>
            )}
          </div>
          <div className="playlist-page-right">
            <h1 className="playlist-page-title">{playlist.name}</h1>
            {playlist.description && (
              <p className="playlist-page-description">{playlist.description}</p>
            )}
            <div className="playlist-page-meta">
              {playlist.user && (
                <span
                  className="playlist-page-author"
                  onClick={() => navigate(`/profile/${playlist.user.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  By {playlist.user.username}
                </span>
              )}
              <span className="playlist-page-track-count">
                {tracks.length} song{tracks.length !== 1 ? 's' : ''}
              </span>
              <span className="playlist-page-duration">
                {formatDuration(totalDuration)}
              </span>
            </div>
            {!playlist.isPublic && (
              <div className="playlist-page-private-badge">
                <svg viewBox="0 0 24 24" className="lock-icon" style={{ width: 14, height: 14, marginRight: 4 }}>
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor" />
                </svg>
                <span>Private</span>
              </div>
            )}
          </div>
        </div>

        <div className="playlist-page-tracks">
          <h2 className="playlist-page-tracks-title">Tracks</h2>
          {tracks.length === 0 ? (
            <p className="track-meta">No tracks in this playlist yet.</p>
          ) : (
            <div className="profile-list">
              {tracks.map((track) => (
                <ProfileMediaTile
                  key={track.id}
                  title={track.title}
                  subtitle={track.username || 'Deleted User'}
                  imageUrl={resolveImage(track.trackImagePath)}
                  trailingText={`${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, '0')}`}
                  trackId={track.id}
                  canPlay={!track.isPrivate || track.userId === currentUserId}
                  userId={track.userId}
                  isPrivate={track.isPrivate}
                  onPlay={handlePlayTrack}
                  isLiked={isAuthenticated ? likedTrackIds.has(track.id) : false}
                  onLikeToggle={isAuthenticated ? handleLikeToggle : undefined}
                  playlistId={playlistId}
                  onRemoveFromPlaylist={handleRemoveFromPlaylist}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer isAuthenticated={isAuthenticated} />
    </div>
  )
}
