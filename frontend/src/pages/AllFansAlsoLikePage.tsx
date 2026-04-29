import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { ProfileMediaTile } from '../components/ProfileMediaTile'
import { useAudio } from '../contexts/AudioContext'
import { getTrackStreamUrl, getFansAlsoLike, likeTrack, unlikeTrack } from '../api/audioApi'
import { getApiOrigin } from '../api/httpClient'

export function AllFansAlsoLikePage() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId?: string }>()
  const { playTrack, pauseTrack, currentTrack, isPlaying, toggleLike, likedTracks: contextLikedTracks } = useAudio()
  const [loading, setLoading] = useState(true)
  const [tracks, setTracks] = useState<any[]>([])

  const isAuthenticated = useMemo(() => Boolean(localStorage.getItem('authToken')), [])
  const contextLikedTrackIds = useMemo(() => new Set(contextLikedTracks.map((t) => t.id)), [contextLikedTracks])

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

  const handleDelete = (_trackId: string) => {
    navigate(`/profile/${currentUserId}`)
  }

  const handleEdit = (trackId: string) => {
    navigate(`/track/${trackId}/edit`)
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const targetUserId = userId || currentUserId
        if (!targetUserId) {
          setTracks([])
          setLoading(false)
          return
        }

        const token = localStorage.getItem('authToken')
        const fetchedTracks = await getFansAlsoLike(targetUserId, 50, token || undefined)
        const formattedTracks = fetchedTracks.map((t: any) => ({
          id: t.id,
          title: t.title,
          subtitle: t.username?.startsWith('Deleted_') ? 'Deleted user' : (t.username || 'Unknown Artist'),
          imageUrl: t.trackImagePath ? `${getApiOrigin()}/${t.trackImagePath.replace(/^\//, '')}` : undefined,
          duration: t.duration,
          userId: t.userId,
        }))
        setTracks(formattedTracks)
      } catch (error) {
        console.error('Failed to load recommendations:', error)
        setTracks([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId, currentUserId])

  const handleLikeToggle = async (trackId: string, isLiked: boolean) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      alert('You need to log in to like tracks')
      return
    }

    const track = tracks.find(t => t.id === trackId)
    if (!track) return

    try {
      if (isLiked) {
        await likeTrack(trackId, token)
        toggleLike(trackId, true, {
          id: track.id,
          title: track.title,
          subtitle: track.subtitle || 'Deleted User',
          imageUrl: track.imageUrl,
          duration: track.duration,
          userId: track.userId,
        })
      } else {
        await unlikeTrack(trackId, token)
        toggleLike(trackId, false)
      }
    } catch (error) {
      console.error('Failed to toggle like:', error)
      alert('Failed to update like status')
    }
  }

  const handlePlay = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId)
    if (!track) return

    if (currentTrack?.id === trackId && isPlaying) {
      pauseTrack()
    } else {
      playTrack(
        {
          id: track.id,
          title: track.title,
          subtitle: track.subtitle || 'Deleted User',
          imageUrl: track.imageUrl,
          duration: track.duration,
          userId: track.userId,
        },
        getTrackStreamUrl(track.id)
      )
    }
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
        <h1 className="upload-page-title">Fans also like</h1>
        {tracks.length === 0 ? (
          <p className="track-meta">No recommendations yet.</p>
        ) : (
          <div className="profile-list">
            {tracks.map((track, index) => (
              <ProfileMediaTile
                key={track.id}
                title={track.title}
                subtitle={track.subtitle || 'Deleted User'}
                imageUrl={track.imageUrl}
                trailingText={track.duration ? `${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, '0')}` : undefined}
                trackId={track.id}
                canPlay={true}
                isLiked={isAuthenticated ? contextLikedTrackIds.has(track.id) : false}
                onLikeToggle={isAuthenticated ? handleLikeToggle : undefined}
                onPlay={handlePlay}
                isCreator={track.userId === currentUserId}
                isTrackAuthor={track.userId === currentUserId}
                userId={track.userId}
                onDelete={track.userId === currentUserId ? handleDelete : undefined}
                onEdit={track.userId === currentUserId ? handleEdit : undefined}
                trackNumber={index + 1}
              />
            ))}
          </div>
        )}
      </div>
      <Footer isAuthenticated={isAuthenticated} />
    </div>
  )
}
