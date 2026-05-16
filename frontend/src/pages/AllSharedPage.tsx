import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { ProfileMediaTile } from '../components/ProfileMediaTile'
import { ShareModal } from '../components/ShareModal'
import { useAudio } from '../contexts/AudioContext'
import { getUserActivities, shareContent, deleteActivity, getTrackById } from '../api/audioApi'
import { getPlaylistById } from '../api/profileApi'
import { getApiOrigin } from '../api/httpClient'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useAuth } from '../hooks/useAuth'
import { getToken } from '../utils/auth'

export function AllSharedPage() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId?: string }>()
  const { likedTracks: contextLikedTracks, toggleLike } = useAudio()
  const [loading, setLoading] = useState(true)
  const [sharedActivities, setSharedActivities] = useState<any[]>([])
  const [sharedContentDetails, setSharedContentDetails] = useState<Map<string, any>>(new Map())
  const [shareModal, setShareModal] = useState<{ content: { title: string; subtitle?: string; imageUrl?: string }, contentType: 'TRACK' | 'PLAYLIST', contentId: string } | null>(null)
  const [mySharedActivities, setMySharedActivities] = useState<any[]>([])

  const currentUserId = useCurrentUser()
  const isAuthenticated = useAuth()
  const contextLikedTrackIds = new Set(contextLikedTracks.map((t) => t.id))
  const sharedContentIds = new Set(mySharedActivities.map((a) => `${a.contentType}-${a.contentId}`))

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
        const newActivity = {
          id: result.id,
          userId: result.userId,
          contentId: shareModal.contentId,
          contentType: shareModal.contentType,
          message: message || '',
          createdAt: new Date().toISOString(),
        }
        setMySharedActivities((prev) => [newActivity, ...prev])

        const targetUserId = userId || currentUserId
        if (targetUserId === currentUserId) {
          setSharedActivities((prev) => [newActivity, ...prev])

          const key = `${shareModal.contentType}-${shareModal.contentId}`
          try {
            let content
            if (shareModal.contentType === 'TRACK') {
              content = await getTrackById(shareModal.contentId, token)
            } else if (shareModal.contentType === 'PLAYLIST') {
              content = await getPlaylistById(shareModal.contentId, token)
            }
            if (content) {
              setSharedContentDetails((prev) => new Map(prev).set(key, content))
            }
          } catch (error) {
            console.error('Failed to load content details:', error)
          }
        }
      }
    } catch (error) {
      console.error('Failed to share content:', error)
      alert('Failed to share content')
    }
  }, [shareModal, userId, currentUserId])

  const handleUnshare = useCallback(async (activityId: string) => {
    const token = getToken()
    if (!token) return

    try {
      await deleteActivity(activityId, token)
      setMySharedActivities((prev) => prev.filter((a) => a.id !== activityId))
      setSharedActivities((prev) => prev.filter((a) => a.id !== activityId))
    } catch (error) {
      console.error('Failed to remove shared item:', error)
      alert('Failed to remove from shared')
    }
  }, [])

  const resolveImage = useCallback((path?: string) => {
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://')) return path

    const normalizedPath = path.replaceAll('\\', '/').replace(/^wwwroot\//, '')
    return `${getApiOrigin()}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`
  }, [])

  const handlePlayTrack = useCallback((_trackId: string) => {
    // Play track logic
  }, [])

  const handlePlayPlaylist = useCallback((_playlistId: string) => {
    // Play playlist logic
  }, [])

  useEffect(() => {
    const loadSharedActivities = async () => {
      const targetUserId = userId || currentUserId
      if (!targetUserId) return

      setLoading(true)
      try {
        const token = getToken()
        const activities = await getUserActivities(targetUserId, true, token || undefined)
        const activitiesArray = Array.isArray(activities) ? activities : []
        setSharedActivities(activitiesArray)

        const detailsMap = new Map<string, any>()
        await Promise.all(
          activitiesArray.map(async (activity: any) => {
            const key = `${activity.contentType}-${activity.contentId}`
            if (activity.contentType === 'TRACK') {
              try {
                const track = await getTrackById(activity.contentId, token || undefined)
                detailsMap.set(key, track)
              } catch (error) {
                console.error('Failed to load track:', error)
              }
            } else if (activity.contentType === 'PLAYLIST') {
              try {
                const playlist = await getPlaylistById(activity.contentId, token || undefined)
                detailsMap.set(key, playlist)
              } catch (error) {
                console.error('Failed to load playlist:', error)
              }
            }
          })
        )
        setSharedContentDetails(detailsMap)
      } catch (error) {
        console.error('Failed to load shared activities:', error)
        setSharedActivities([])
      } finally {
        setLoading(false)
      }
    }

    loadSharedActivities()
  }, [userId, currentUserId])

  useEffect(() => {
    const loadMySharedActivities = async () => {
      if (!currentUserId) return

      try {
        const token = getToken()
        const activities = await getUserActivities(currentUserId, true, token || undefined)
        const activitiesArray = Array.isArray(activities) ? activities : []
        setMySharedActivities(activitiesArray)
      } catch (error) {
        console.error('Failed to load my shared activities:', error)
        setMySharedActivities([])
      }
    }

    loadMySharedActivities()
  }, [currentUserId])

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
        <h1 className="upload-page-title">Shared</h1>
        {sharedActivities.length === 0 ? (
          <p className="track-meta">Nothing shared yet.</p>
        ) : (
          <div className="profile-list">
            {sharedActivities.map((activity) => {
              const key = `${activity.contentType}-${activity.contentId}`
              const content = sharedContentDetails.get(key)
              if (!content) return null

              return (
                <div key={activity.id} className="shared-item-wrapper">
                  {activity.message && (
                    <div className="shared-comment">
                      <p className="shared-comment-text">{activity.message}</p>
                      <p className="shared-date">{new Date(activity.createdAt).toLocaleDateString()}</p>
                    </div>
                  )}
                  {activity.contentType === 'TRACK' ? (
                    <ProfileMediaTile
                      title={content.title}
                      subtitle={content.username || 'Deleted User'}
                      imageUrl={resolveImage(content.trackImagePath)}
                      trailingText={`${Math.floor(content.duration / 60)}:${String(content.duration % 60).padStart(2, '0')}`}
                      trackId={content.id}
                      canPlay={!content.isPrivate || content.userId === currentUserId}
                      isLiked={isAuthenticated ? contextLikedTrackIds.has(content.id) : false}
                      onLikeToggle={isAuthenticated ? toggleLike : undefined}
                      userId={content.userId}
                      isPrivate={content.isPrivate}
                      isCreator={content.userId === currentUserId}
                      isTrackAuthor={content.userId === currentUserId}
                      onDelete={content.userId === currentUserId ? () => navigate(`/track/${content.id}/edit`) : undefined}
                      onEdit={content.userId === currentUserId ? (trackId) => navigate(`/track/${trackId}/edit`) : undefined}
                      onPlay={handlePlayTrack}
                      isShared={sharedContentIds.has(`TRACK-${content.id}`)}
                      onShare={isAuthenticated && !sharedContentIds.has(`TRACK-${content.id}`) ? (contentId, contentType) => handleShare(contentId, contentType, content.title, content.username || 'Deleted User', resolveImage(content.trackImagePath)) : undefined}
                      onUnshare={isAuthenticated && sharedContentIds.has(`TRACK-${content.id}`) ? () => {
                        const userActivity = sharedActivities.find(a => a.contentType === 'TRACK' && a.contentId === content.id)
                        if (userActivity) handleUnshare(userActivity.id)
                      } : undefined}
                    />
                  ) : (
                    <ProfileMediaTile
                      title={content.name}
                      subtitle={content.username || 'Unknown Artist'}
                      imageUrl={resolveImage(content.playlistImagePath)}
                      playlistId={content.id}
                      canPlay={true}
                      onPlay={() => handlePlayPlaylist(content.id)}
                      isCreator={content.userId === currentUserId}
                      onEditPlaylist={() => navigate(`/playlist/${content.id}/edit`)}
                      onDeletePlaylist={() => navigate(`/playlist/${content.id}/edit`)}
                      isPrivate={!content.isPublic}
                      isPlaylistTile={true}
                      userId={content.userId}
                      isShared={sharedContentIds.has(`PLAYLIST-${content.id}`)}
                      onShare={isAuthenticated && !sharedContentIds.has(`PLAYLIST-${content.id}`) ? (contentId, contentType) => handleShare(contentId, contentType, content.name, content.username || 'Unknown Artist', resolveImage(content.playlistImagePath)) : undefined}
                      onUnshare={isAuthenticated && sharedContentIds.has(`PLAYLIST-${content.id}`) ? () => {
                        const userActivity = sharedActivities.find(a => a.contentType === 'PLAYLIST' && a.contentId === content.id)
                        if (userActivity) handleUnshare(userActivity.id)
                      } : undefined}
                    />
                  )}
                </div>
              )
            })}
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
