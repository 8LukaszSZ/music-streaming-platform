import { useEffect, useState, useCallback } from 'react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { ProfileMediaTile } from '../components/ProfileMediaTile'
import { ShareModal } from '../components/ShareModal'
import { useAudio } from '../contexts/AudioContext'
import { getTrendingTracks, getTrackStreamUrl, likeTrack, unlikeTrack, shareContent, getUserActivities, deleteActivity } from '../api/audioApi'
import { getApiOrigin } from '../api/httpClient'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useAuth } from '../hooks/useAuth'
import { getToken } from '../utils/auth'

export function MoreTrendingTracksPage() {
  const { likedTracks: contextLikedTracks, playTrack, pauseTrack, currentTrack, isPlaying, toggleLike, setTrackList } = useAudio()
  const [loading, setLoading] = useState(true)
  const [tracks, setTracks] = useState<any[]>([])
  const [shareModal, setShareModal] = useState<{ content: { title: string; subtitle?: string; imageUrl?: string }, contentType: 'TRACK' | 'PLAYLIST', contentId: string } | null>(null)
  const [sharedActivities, setSharedActivities] = useState<any[]>([])

  const currentUserId = useCurrentUser()
  const isAuthenticated = useAuth()
  const contextLikedTrackIds = new Set(contextLikedTracks.map((t) => t.id))
  const sharedContentIds = new Set(sharedActivities.map((a) => `${a.contentType}-${a.contentId}`))

  useEffect(() => {
    const loadSharedActivities = async () => {
      if (!currentUserId) return
      try {
        const token = getToken()
        const activities = await getUserActivities(currentUserId, false, token || undefined)
        const activitiesArray = Array.isArray(activities) ? activities : []
        setSharedActivities(activitiesArray)
      } catch (error) {
        console.error('Failed to load shared activities:', error)
        setSharedActivities([])
      }
    }

    loadSharedActivities()
  }, [currentUserId])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const token = getToken() || undefined
        const fetchedTracks = await getTrendingTracks(25, token)
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
        console.error('Failed to load trending tracks:', error)
        setTracks([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const handleLikeToggle = async (trackId: string, isLiked: boolean) => {
    const token = getToken()
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
      const trackInfo = {
        id: track.id,
        title: track.title,
        subtitle: track.subtitle || 'Deleted User',
        imageUrl: track.imageUrl,
        duration: track.duration,
        userId: track.userId,
      }
      setTrackList(tracks.map(t => ({
        id: t.id,
        title: t.title,
        subtitle: t.subtitle || 'Deleted User',
        imageUrl: t.imageUrl,
        duration: t.duration,
        userId: t.userId,
      })))
      playTrack(trackInfo, getTrackStreamUrl(track.id))
    }
  }

  const handleShare = useCallback((contentId: string, contentType: 'TRACK' | 'PLAYLIST', title: string, subtitle?: string, imageUrl?: string) => {
    setShareModal({
      content: { title, subtitle, imageUrl },
      contentType,
      contentId
    })
  }, [])

  const handleShareSubmit = useCallback(async (message?: string) => {
    if (!shareModal) return

    const token = getToken()
    if (!token) {
      alert('You need to log in to share content')
      return
    }

    try {
      const result = await shareContent(shareModal.contentId, shareModal.contentType, message, token) as any
      setShareModal(null)

      if (result && result.id) {
        setSharedActivities((prev) => [
          {
            id: result.id,
            userId: result.userId,
            contentId: shareModal.contentId,
            contentType: shareModal.contentType,
            message: message || '',
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ])
      }
    } catch (error) {
      console.error('Failed to share content:', error)
      alert('Failed to share content')
    }
  }, [shareModal])

  const handleUnshare = useCallback(async (activityId: string) => {
    const token = getToken()
    if (!token) return

    try {
      await deleteActivity(activityId, token)
      setSharedActivities((prev) => prev.filter((a) => a.id !== activityId))
    } catch (error) {
      console.error('Failed to remove shared item:', error)
      alert('Failed to remove from shared')
    }
  }, [])

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
        <h1 className="upload-page-title">Trending Tracks</h1>
        {tracks.length === 0 ? (
          <p className="track-meta">No trending tracks yet.</p>
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
                userId={track.userId}
                isLiked={isAuthenticated ? contextLikedTrackIds.has(track.id) : false}
                onLikeToggle={isAuthenticated ? handleLikeToggle : undefined}
                onPlay={handlePlay}
                trackNumber={index + 1}
                isShared={sharedContentIds.has(`TRACK-${track.id}`)}
                onShare={isAuthenticated && !sharedContentIds.has(`TRACK-${track.id}`) ? (contentId, contentType) => handleShare(contentId, contentType, track.title, track.subtitle || 'Deleted User', track.imageUrl) : undefined}
                onUnshare={isAuthenticated && sharedContentIds.has(`TRACK-${track.id}`) ? () => {
                  const activity = sharedActivities.find(a => a.contentType === 'TRACK' && a.contentId === track.id)
                  if (activity) handleUnshare(activity.id)
                } : undefined}
              />
            ))}
          </div>
        )}
      </div>
      <Footer isAuthenticated={isAuthenticated} />
      {shareModal && (
        <ShareModal
          content={shareModal.content}
          contentType={shareModal.contentType}
          onShare={handleShareSubmit}
          onCancel={() => setShareModal(null)}
        />
      )}
    </div>
  )
}
