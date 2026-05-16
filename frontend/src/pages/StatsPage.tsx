import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { ShareModal } from '../components/ShareModal'
import { ProfileMediaTile } from '../components/ProfileMediaTile'
import { getApiOrigin } from '../api/httpClient'
import { getUserProfileData, getProfileData } from '../services/profileService'
import { getContentStatsTwoWeeks, likeTrack, unlikeTrack, deleteTrack, shareContent } from '../api/audioApi'
import { useAudio } from '../contexts/AudioContext'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useAuth } from '../hooks/useAuth'
import { resolveImage } from '../utils/image'
import { getToken } from '../utils/auth'
import type { TrackDto, PlaylistDto } from '../types/profile'

type StatsTab = 'plays' | 'likes'

interface TrackWithStats extends TrackDto {
  playsCount: number
  likesCount: number
}

export function StatsPage() {
  const { userId } = useParams<{ userId?: string }>()
  const navigate = useNavigate()
  const { setTrackList, playTrack } = useAudio()
  const [activeTab, setActiveTab] = useState<StatsTab>('plays')
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{
    me: { id: string; username: string; bio?: string; profileImagePath?: string }
    tracks: TrackDto[]
    playlists: PlaylistDto[]
    likedTracks: TrackDto[]
  } | null>(null)
  const [tracksWithStats, setTracksWithStats] = useState<TrackWithStats[]>([])
  const [tracksWithLikes, setTracksWithLikes] = useState<TrackWithStats[]>([])
  const [shareModal, setShareModal] = useState<{ content: { title: string; subtitle?: string; imageUrl?: string }, contentType: 'TRACK' | 'PLAYLIST', contentId: string } | null>(null)

  const currentUserId = useCurrentUser()
  const isAuthenticated = useAuth()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = userId ? await getUserProfileData(userId) : await getProfileData()
        setProfile(data)

        const token = localStorage.getItem('authToken')

        // Load tracks with plays and likes stats
        if (data.tracks.length > 0 && token) {
          const trackStatsPromises = data.tracks.map(async (track) => {
            try {
              const stats = await getContentStatsTwoWeeks(track.id, 'TRACK', token)
              return {
                ...track,
                playsCount: (stats as any)?.playsCount || 0,
                likesCount: (stats as any)?.likesCount || 0
              }
            } catch {
              return { ...track, playsCount: 0, likesCount: 0 }
            }
          })
          const tracksWithStatsData = await Promise.all(trackStatsPromises)
          setTracksWithStats(tracksWithStatsData.sort((a, b) => b.playsCount - a.playsCount))
          setTracksWithLikes(tracksWithStatsData.sort((a, b) => b.likesCount - a.likesCount))
        }
      } catch (error) {
        console.error('Failed to load stats:', error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId])

  const likedTrackIds = useMemo(() => {
    if (!profile) return new Set<string>()
    return new Set(profile.likedTracks.map(t => t.id))
  }, [profile])

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
      await shareContent(shareModal.contentId, shareModal.contentType, message, token)
      setShareModal(null)
    } catch (error) {
      console.error('Failed to share content:', error)
      alert('Failed to share content')
    }
  }, [shareModal])

  const handleLikeToggle = useCallback(async (trackId: string, isLiked: boolean) => {
    const token = getToken()
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
      const data = userId ? await getUserProfileData(userId) : await getProfileData()
      setProfile(data)
    } catch (error) {
      console.error('Failed to toggle like:', error)
      alert('Failed to like track')
    }
  }, [userId])

  const handleDelete = useCallback(async (trackId: string) => {
    if (!confirm('Are you sure you want to delete this track?')) return
    const token = getToken()
    if (!token) {
      alert('You need to log in to delete tracks')
      return
    }
    try {
      await deleteTrack(trackId, token)
      const data = userId ? await getUserProfileData(userId) : await getProfileData()
      setProfile(data)
    } catch (error) {
      console.error('Failed to delete track:', error)
      alert('Failed to delete track')
    }
  }, [userId])

  const handlePlayTrack = useCallback((trackId: string) => {
    const track = tracksWithStats.find(t => t.id === trackId) || tracksWithLikes.find(t => t.id === trackId)
    if (!track) return
    const trackList = (activeTab === 'plays' ? tracksWithStats : tracksWithLikes).map(t => ({
      id: t.id,
      title: t.title,
      subtitle: t.username || 'Deleted User',
      imageUrl: resolveImage(t.trackImagePath),
      duration: t.duration
    }))
    setTrackList(trackList)
    playTrack(
      {
        id: track.id,
        title: track.title,
        subtitle: track.username || 'Deleted User',
        imageUrl: resolveImage(track.trackImagePath),
        userId: track.userId,
        duration: track.duration,
      },
      `${getApiOrigin()}/api/LocalTracks/${track.id}/stream`
    )
  }, [tracksWithStats, tracksWithLikes, activeTab, setTrackList, playTrack, resolveImage])

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <div className="upload-page-container">
          <p>Loading...</p>
        </div>
        <Footer isAuthenticated={Boolean(currentUserId)} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="page">
        <Navbar />
        <div className="upload-page-container">
          <p>Profile not found</p>
        </div>
        <Footer isAuthenticated={Boolean(currentUserId)} />
      </div>
    )
  }

  return (
    <div className="page">
      <Navbar />
      <div className="upload-page-container">
        <div className="section-header">
          <h1 style={{ color: 'white' }}>Statistics</h1>
        </div>
        <p style={{ color: '#888', marginBottom: '20px' }}>Statistics from the last 2 weeks</p>

        <div className="profile-tabs">
          <button
            type="button"
            className={activeTab === 'plays' ? 'active' : ''}
            onClick={() => setActiveTab('plays')}
          >
            Plays
          </button>
          <button
            type="button"
            className={activeTab === 'likes' ? 'active' : ''}
            onClick={() => setActiveTab('likes')}
          >
            Likes
          </button>
        </div>

        <div className="profile-list">
          {activeTab === 'plays' ? (
            <>
              {tracksWithStats.length === 0 ? (
                <p className="track-meta">No tracks yet.</p>
              ) : (
                tracksWithStats.map((track, index) => (
                  <ProfileMediaTile
                    key={track.id}
                    title={track.title}
                    subtitle={track.username || 'Deleted User'}
                    imageUrl={resolveImage(track.trackImagePath)}
                    trailingText={`${track.playsCount} plays`}
                    trackId={track.id}
                    canPlay={!track.isPrivate || track.userId === currentUserId}
                    isLiked={isAuthenticated ? likedTrackIds.has(track.id) : false}
                    onLikeToggle={isAuthenticated ? handleLikeToggle : undefined}
                    userId={track.userId}
                    isPrivate={track.isPrivate}
                    isCreator={track.userId === currentUserId}
                    isTrackAuthor={track.userId === currentUserId}
                    onDelete={track.userId === currentUserId ? handleDelete : undefined}
                    onEdit={track.userId === currentUserId ? (trackId) => navigate(`/track/${trackId}/edit`) : undefined}
                    onPlay={handlePlayTrack}
                    onShare={isAuthenticated ? (contentId, contentType) => handleShare(contentId, contentType, track.title, track.username || 'Deleted User', resolveImage(track.trackImagePath)) : undefined}
                    trackNumber={index + 1}
                  />
                ))
              )}
            </>
          ) : (
            <>
              {tracksWithLikes.length === 0 ? (
                <p className="track-meta">No tracks yet.</p>
              ) : (
                tracksWithLikes.map((track, index) => (
                  <ProfileMediaTile
                    key={track.id}
                    title={track.title}
                    subtitle={track.username || 'Deleted User'}
                    imageUrl={resolveImage(track.trackImagePath)}
                    trailingText={`${track.likesCount} likes`}
                    trackId={track.id}
                    canPlay={!track.isPrivate || track.userId === currentUserId}
                    isLiked={isAuthenticated ? likedTrackIds.has(track.id) : false}
                    onLikeToggle={isAuthenticated ? handleLikeToggle : undefined}
                    userId={track.userId}
                    isPrivate={track.isPrivate}
                    isCreator={track.userId === currentUserId}
                    isTrackAuthor={track.userId === currentUserId}
                    onDelete={track.userId === currentUserId ? handleDelete : undefined}
                    onEdit={track.userId === currentUserId ? (trackId) => navigate(`/track/${trackId}/edit`) : undefined}
                    onPlay={handlePlayTrack}
                    onShare={isAuthenticated ? (contentId, contentType) => handleShare(contentId, contentType, track.title, track.username || 'Deleted User', resolveImage(track.trackImagePath)) : undefined}
                    trackNumber={index + 1}
                  />
                ))
              )}
            </>
          )}
        </div>
      </div>
      <Footer isAuthenticated={Boolean(currentUserId)} />
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
