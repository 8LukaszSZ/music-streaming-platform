import { Navbar } from '../components/Navbar'
import { ShareModal } from '../components/ShareModal'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ProfileMediaTile } from '../components/ProfileMediaTile'
import { getApiOrigin } from '../api/httpClient'
import { getProfileData, getUserProfileData, updateProfileData } from '../services/profileService'
import { likeTrack, unlikeTrack, deleteTrack, getLatestCommentsForUser, getFansAlsoLike, shareContent, getUserActivities, getTrackById, deleteActivity, getContentStatsTwoWeeks } from '../api/audioApi'
import { followUser, unfollowUser, deletePlaylist, getPlaylistById } from '../api/profileApi'
import type { PlaylistDto, TrackDto, UserActivityDto, UserLiteDto } from '../types/profile'
import type { ProfileTab } from '../types/page'
import { Footer } from '../components/Footer'
import { useAudio } from '../contexts/AudioContext'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useAuth } from '../hooks/useAuth'
import { useUnreadCount } from '../hooks/useUnreadCount'
import { resolveImage } from '../utils/image'
import { getToken } from '../utils/auth'

export function ProfilePage() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId?: string }>()
  const { setTrackList, setLikedTracks, toggleLike, likedTracks: contextLikedTracks, playTrack } = useAudio()
  const [activeTab, setActiveTab] = useState<ProfileTab>('tracks')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [peopleModal, setPeopleModal] = useState<'followers' | 'following' | null>(null)
  const [editBio, setEditBio] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [latestComments, setLatestComments] = useState<any[]>([])
  const [fansAlsoLike, setFansAlsoLike] = useState<any[]>([])
  const [playlistFilter, setPlaylistFilter] = useState<'all' | 'my' | 'added'>('all')
  const unreadMessageCount = useUnreadCount()
  const [shareModal, setShareModal] = useState<{ content: { title: string; subtitle?: string; imageUrl?: string }, contentType: 'TRACK' | 'PLAYLIST', contentId: string } | null>(null)
  const [sharedActivities, setSharedActivities] = useState<any[]>([])
  const [mySharedActivities, setMySharedActivities] = useState<any[]>([])
  const [loadingShared, setLoadingShared] = useState(false)
  const [sharedContentDetails, setSharedContentDetails] = useState<Map<string, any>>(new Map())
  const [stats, setStats] = useState({ likes: 0, tracks: 0, playlists: 0, plays: 0 })
  const [loadingStats, setLoadingStats] = useState(false)

  const [profile, setProfile] = useState<{
    me: {
      id: string
      username: string
      bio?: string
      profileImagePath?: string
    }
    tracks: TrackDto[]
    playlists: PlaylistDto[]
    shared: UserActivityDto[]
    followers: UserLiteDto[]
    following: UserLiteDto[]
    likedTracks: TrackDto[]
  } | null>(null)

  const currentUserId = useCurrentUser()
  const isAuthenticated = useAuth()

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

  useEffect(() => {
    const loadSharedActivities = async () => {
      const targetUserId = userId || currentUserId
      if (!targetUserId) return

      setLoadingShared(true)
      try {
        const token = getToken()
        const activities = await getUserActivities(targetUserId, false, token || undefined)
        const activitiesArray = Array.isArray(activities) ? activities : []
        setSharedActivities(activitiesArray)

        if (activeTab === 'shared') {
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
        }
      } catch (error) {
        console.error('Failed to load shared activities:', error)
        setSharedActivities([])
      } finally {
        setLoadingShared(false)
      }
    }

    loadSharedActivities()
  }, [userId, currentUserId, activeTab])

  useEffect(() => {
    const loadMySharedActivities = async () => {
      if (!currentUserId) return

      try {
        const token = getToken()
        const activities = await getUserActivities(currentUserId, false, token || undefined)
        const activitiesArray = Array.isArray(activities) ? activities : []
        setMySharedActivities(activitiesArray)
      } catch (error) {
        console.error('Failed to load my shared activities:', error)
        setMySharedActivities([])
      }
    }

    loadMySharedActivities()
  }, [currentUserId])

  useEffect(() => {
    const loadStats = async () => {
      const targetUserId = userId || currentUserId
      if (!targetUserId || !profile) return

      setLoadingStats(true)
      try {
        const token = getToken()
        const likesCount = profile.likedTracks?.length || 0
        const tracksCount = profile.tracks?.length || 0
        // Count only playlists created by the user (not liked playlists)
        const playlistsCount = profile.playlists?.filter(p => p.userId === targetUserId).length || 0

        // Calculate total plays from all tracks using contentstats endpoint
        let totalPlays = 0
        if (tracksCount > 0 && token) {
          const trackIds = profile.tracks.map(t => t.id)
          const playsPromises = trackIds.map(trackId =>
            getContentStatsTwoWeeks(trackId, 'TRACK', token)
              .then((stats: any) => stats?.playsCount || 0)
              .catch(() => 0)
          )
          const playsArray = await Promise.all(playsPromises)
          totalPlays = playsArray.reduce((sum, plays) => sum + plays, 0)
        }

        setStats({
          likes: likesCount,
          tracks: tracksCount,
          playlists: playlistsCount,
          plays: totalPlays
        })
      } catch (error) {
        console.error('Failed to load stats:', error)
        setStats({ likes: 0, tracks: 0, playlists: 0, plays: 0 })
      } finally {
        setLoadingStats(false)
      }
    }

    loadStats()
  }, [profile, userId, currentUserId])


  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = userId ? await getUserProfileData(userId) : await getProfileData()
        setProfile(data)

        const isOwnProfile = !userId || userId === currentUserId
        if (isOwnProfile) {
          setLikedTracks(
            data.likedTracks.map((track) => ({
              id: track.id,
              title: track.title,
              subtitle: track.username || 'Deleted User',
              imageUrl: track.trackImagePath ? resolveImage(track.trackImagePath) : undefined,
              duration: track.duration,
              userId: track.userId,
            }))
          )
        }

        const trackList = data.tracks.map((track) => ({
          id: track.id,
          title: track.title,
          subtitle: track.username || 'Deleted User',
          imageUrl: track.trackImagePath ? resolveImage(track.trackImagePath) : undefined,
          duration: track.duration,
          userId: track.userId,
        }))
        setTrackList(trackList)

        if (userId && currentUserId) {
          const isUserFollowing = data.followers.some((f: UserLiteDto) => f.id === currentUserId)
          setIsFollowing(isUserFollowing)
        }

        const targetUserId = userId || currentUserId
        if (targetUserId) {
          try {
            const comments = await getLatestCommentsForUser(targetUserId, 3)
            setLatestComments(comments)
          } catch (commentError) {
            console.error('Failed to load latest comments:', commentError)
            setLatestComments([])
          }

          try {
            const recommendations = await getFansAlsoLike(targetUserId, 50)
            const publicRecommendations = recommendations.filter((t: any) => !t.isPrivate)
            setFansAlsoLike(publicRecommendations)
          } catch (recError) {
            console.error('Failed to load recommendations:', recError)
            setFansAlsoLike([])
          }
        }
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Failed to load profile.'
        setError(message)
        if (!userId && message.includes('log in')) {
          navigate('/login')
        }
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [navigate, userId, currentUserId, setTrackList])

  const likedTrackIds = useMemo(() => {
    return new Set(contextLikedTracks.map((track) => track.id))
  }, [contextLikedTracks])

  const sharedContentIds = useMemo(() => {
    return new Set(mySharedActivities.map((a) => `${a.contentType}-${a.contentId}`))
  }, [mySharedActivities])


  const handlePlayTrack = useCallback((_trackId: string) => {
    if (!profile) return

    let trackList: any[] = []

    if (activeTab === 'tracks') {
      trackList = profile.tracks.map((track) => ({
        id: track.id,
        title: track.title,
        subtitle: track.username || 'Deleted User',
        imageUrl: track.trackImagePath ? resolveImage(track.trackImagePath) : undefined,
        duration: track.duration,
        userId: track.userId,
      }))
    }

    setTrackList(trackList)
  }, [profile, activeTab, resolveImage, setTrackList])

  const handlePlayLikedTrack = useCallback((_trackId: string) => {
    const isOwnProfile = !userId || userId === currentUserId
    let trackList: any[] = []

    if (isOwnProfile) {
      trackList = contextLikedTracks.map((track) => ({
        id: track.id,
        title: track.title,
        subtitle: track.subtitle,
        imageUrl: track.imageUrl,
        duration: track.duration,
        userId: track.userId,
      }))
    } else {
      trackList = profile!.likedTracks.map((track) => ({
        id: track.id,
        title: track.title,
        subtitle: track.username || 'Deleted User',
        imageUrl: track.trackImagePath ? resolveImage(track.trackImagePath) : undefined,
        duration: track.duration,
        userId: track.userId,
      }))
    }

    setTrackList(trackList)
  }, [contextLikedTracks, profile, userId, currentUserId, resolveImage, setTrackList])

  const handlePlayFansAlsoLike = useCallback((_trackId: string) => {
    const trackList = fansAlsoLike.map((track) => ({
      id: track.id,
      title: track.title,
      subtitle: track.username?.startsWith('Deleted_') ? 'Deleted user' : (track.username || 'Unknown Artist'),
      imageUrl: track.trackImagePath ? `${getApiOrigin()}/${track.trackImagePath.replace(/^\//, '')}` : undefined,
      duration: track.duration,
      userId: track.userId,
    }))
    setTrackList(trackList)
  }, [fansAlsoLike, setTrackList])

  const handleFollowToggle = async () => {
    if (!userId) return

    const token = getToken()
    if (!token) {
      alert('You need to log in to follow users')
      return
    }

    try {
      if (isFollowing) {
        await unfollowUser(userId, token)
        setIsFollowing(false)
      } else {
        await followUser(userId, token)
        setIsFollowing(true)
      }

      const data = userId ? await getUserProfileData(userId) : await getProfileData()
      setProfile(data)

      if (userId && currentUserId) {
        const isUserFollowing = data.followers.some((f: UserLiteDto) => f.id === currentUserId)
        setIsFollowing(isUserFollowing)
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error)
      alert('Failed to update follow status')
    }
  }

  const handlePlayPlaylist = async (playlistId: string) => {
    const token = getToken()
    if (!token) {
      alert('You need to log in to play playlists')
      return
    }

    try {
      const response = await fetch(`${getApiOrigin()}/api/playlists/${playlistId}/tracks`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const playlistTracks: any[] = await response.json()
        if (playlistTracks.length > 0) {
          const trackDetailsList = await Promise.all(
            playlistTracks.map((pt) =>
              fetch(`${getApiOrigin()}/api/LocalTracks/${pt.localTrackId}`, {
                headers: { Authorization: `Bearer ${token}` }
              }).then(res => res.json())
            )
          )

          const trackList = trackDetailsList.map((track) => ({
            id: track.id,
            title: track.title,
            subtitle: track.username || 'Deleted User',
            imageUrl: track.trackImagePath ? resolveImage(track.trackImagePath) : undefined,
            duration: track.duration,
            userId: track.userId,
          }))
          setTrackList(trackList)

          const firstTrack = trackDetailsList[0]
          playTrack(
            {
              id: firstTrack.id,
              title: firstTrack.title,
              subtitle: firstTrack.username || 'Deleted User',
              imageUrl: firstTrack.trackImagePath ? resolveImage(firstTrack.trackImagePath) : undefined,
              userId: firstTrack.userId,
              duration: firstTrack.duration,
            },
            `${getApiOrigin()}/api/LocalTracks/${firstTrack.id}/stream`
          )
        }
      }
    } catch (error) {
      console.error('Failed to play playlist:', error)
      alert('Failed to play playlist')
    }
  }

  const handleEditPlaylist = (playlistId: string) => {
    navigate(`/playlist/${playlistId}/edit`)
  }

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return

    const token = getToken()
    if (!token) {
      alert('You need to log in to delete playlists')
      return
    }

    try {
      await deletePlaylist(playlistId, token)
      const data = userId ? await getUserProfileData(userId) : await getProfileData()
      setProfile(data)
    } catch (error) {
      console.error('Failed to delete playlist:', error)
      alert('Failed to delete playlist')
    }
  }

  const handleLikeToggle = async (trackId: string, isLiked: boolean) => {
    if (!profile) return

    const token = getToken()
    if (!token) {
      alert('You need to log in to like tracks')
      return
    }

    const trackDto = profile.tracks.find((t) => t.id === trackId)
    const likedTrack = profile.likedTracks?.find((t) => t.id === trackId)
    const trackInfo = contextLikedTracks.find((t) => t.id === trackId)
    const fansTrack = fansAlsoLike.find((t) => t.id === trackId)
    const track = trackDto || likedTrack || trackInfo || fansTrack
    if (!track) return

    const isOwnProfile = !userId || userId === currentUserId

    try {
      if (isLiked) {
        await likeTrack(trackId, token)
        toggleLike(trackId, true, {
          id: track.id,
          title: track.title,
          subtitle: trackInfo?.subtitle || trackDto?.username || likedTrack?.username || fansTrack?.username || 'Deleted User',
          imageUrl: trackInfo?.imageUrl || (trackDto?.trackImagePath ? resolveImage(trackDto.trackImagePath) : (likedTrack?.trackImagePath ? resolveImage(likedTrack.trackImagePath) : (fansTrack?.trackImagePath ? `${getApiOrigin()}/${fansTrack.trackImagePath.replace(/^\//, '')}` : undefined))),
          duration: track.duration,
          userId: trackDto?.userId || likedTrack?.userId || trackInfo?.userId || fansTrack?.userId,
        })
        if (isOwnProfile) {
          setProfile({
            ...profile,
            likedTracks: [trackDto || likedTrack || trackInfo || fansTrack, ...profile.likedTracks],
          })
        }
      } else {
        await unlikeTrack(trackId, token)
        toggleLike(trackId, false)
        if (isOwnProfile) {
          setProfile({
            ...profile,
            likedTracks: profile.likedTracks.filter((t) => t.id !== trackId),
          })
        }
      }
    } catch (error) {
      console.error('Failed to toggle like:', error)
      alert('Failed to like track')
    }
  }

  const handleDelete = async (trackId: string) => {
    if (!profile) return

    const token = getToken()
    if (!token) {
      alert('You need to log in to delete tracks')
      return
    }

    try {
      await deleteTrack(trackId, token)
      setProfile({
        ...profile,
        tracks: profile.tracks.filter((t) => t.id !== trackId),
      })
    } catch (error) {
      console.error('Failed to delete track:', error)
      alert('Failed to delete track')
    }
  }

  const handleStartEdit = () => {
    if (!profile) return
    setEditBio(profile.me.bio ?? '')
    setSelectedImage(undefined)
    setIsEditing(true)
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      const updatedUser = await updateProfileData({ bio: editBio, profileImage: selectedImage })
      setProfile((prev) => (prev ? { ...prev, me: { ...prev.me, bio: updatedUser.bio, profileImagePath: updatedUser.profileImagePath } } : prev))
      setAvatarLoadFailed(false)
      setIsEditing(false)
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Could not update profile.'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const closePeopleModal = () => setPeopleModal(null)

  return (
    <main>
      <Navbar />

      <section className="app-shell profile-layout">
        {loading ? (
          <div className="profile-skeleton">
            <div className="profile-header-skeleton">
              <div className="profile-avatar-skeleton"></div>
              <div className="profile-header-content-skeleton">
                <div className="skeleton-text skeleton-title"></div>
                <div className="skeleton-text skeleton-subtitle"></div>
                <div className="skeleton-text skeleton-stats"></div>
              </div>
            </div>
            <div className="profile-tabs-skeleton">
              <div className="skeleton-tab"></div>
              <div className="skeleton-tab"></div>
              <div className="skeleton-tab"></div>
            </div>
            <div className="profile-list-skeleton">
              {[1, 2, 3].map((i) => (
                <div key={i} className="profile-media-tile-skeleton">
                  <div className="skeleton-image"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-text skeleton-title"></div>
                    <div className="skeleton-text skeleton-subtitle"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {error ? <p className="message error">{error}</p> : null}

        {profile && !loading ? (
          <>
            <article className="panel profile-main">
              <div className="profile-header">
                {profile.me.profileImagePath && !avatarLoadFailed ? (
                  <img
                    className="profile-avatar"
                    src={resolveImage(profile.me.profileImagePath)}
                    alt={profile.me.username}
                    onError={() => setAvatarLoadFailed(true)}
                  />
                ) : (
                  <div className="profile-avatar placeholder">{profile.me.username.slice(0, 1).toUpperCase()}</div>
                )}

                <div className="profile-header-content">
                  <h2>{profile.me.username}</h2>
                  <p className="track-meta">{profile.me.bio || 'No bio yet.'}</p>
                  <div className="profile-stats">
                    <button type="button" className="profile-stat-link" onClick={() => setPeopleModal('followers')}>
                      {profile.followers.length} followers
                    </button>
                    <button type="button" className="profile-stat-link" onClick={() => setPeopleModal('following')}>
                      {profile.following.length} following
                    </button>
                  </div>
                </div>
                {userId && userId !== currentUserId ? (
                  <div className="profile-header-actions">
                    <button
                      type="button"
                      className="solid-btn"
                      onClick={handleFollowToggle}
                      style={{ marginRight: '8px', minWidth: '100px' }}
                    >
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => navigate(`/chat/${userId}`)}
                    >
                      Message
                    </button>
                  </div>
                ) : (
                  <div className="profile-header-actions">
                    <button type="button" className="ghost-btn" onClick={handleStartEdit}>
                      Edit profile
                    </button>
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => navigate('/chat')}
                      style={{ marginLeft: '8px', position: 'relative' }}
                    >
                      Messages
                      {unreadMessageCount > 0 && (
                        <span className="notification-badge">{unreadMessageCount}</span>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="profile-tabs">
                <button type="button" className={activeTab === 'tracks' ? 'active' : ''} onClick={() => setActiveTab('tracks')}>
                  Tracks
                </button>
                <button
                  type="button"
                  className={activeTab === 'playlists' ? 'active' : ''}
                  onClick={() => setActiveTab('playlists')}
                >
                  Playlists
                </button>
                <button type="button" className={activeTab === 'shared' ? 'active' : ''} onClick={() => setActiveTab('shared')}>
                  Shared
                </button>
              </div>

              <div className="profile-list">
                {activeTab === 'tracks' ? (
                  <>
                    {profile.tracks.map((track) => (
                      <ProfileMediaTile
                        key={track.id}
                        title={track.title}
                        subtitle={track.username || 'Deleted User'}
                        imageUrl={resolveImage(track.trackImagePath)}
                        trailingText={`${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, '0')}`}
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
                        isShared={sharedContentIds.has(`TRACK-${track.id}`)}
                        onShare={isAuthenticated && !sharedContentIds.has(`TRACK-${track.id}`) ? (contentId, contentType) => handleShare(contentId, contentType, track.title, track.username || 'Deleted User', resolveImage(track.trackImagePath)) : undefined}
                        onUnshare={isAuthenticated && sharedContentIds.has(`TRACK-${track.id}`) ? () => {
                          const activity = sharedActivities.find(a => a.contentType === 'TRACK' && a.contentId === track.id)
                          if (activity) handleUnshare(activity.id)
                        } : undefined}
                      />
                    ))}
                    {profile.tracks.length === 0 ? <p className="track-meta">No tracks yet.</p> : null}
                    <div className="profile-cta">
                      <p className="profile-cta-title">Share your creativity with others.</p>
                      <p className="track-meta">Upload more tracks and let people discover your sound.</p>
                      <button type="button" className="solid-btn" onClick={() => navigate('/upload')}>
                        Upload a track
                      </button>
                    </div>
                  </>
                ) : null}

                {activeTab === 'playlists' ? (
                  <>
                    <div className="playlist-filter-wrapper">
                      <select
                        className="playlist-filter-select"
                        value={playlistFilter}
                        onChange={(e) => setPlaylistFilter(e.target.value as 'all' | 'my' | 'added')}
                      >
                        <option value="all">All</option>
                        <option value="my">My playlists</option>
                        <option value="added">Added playlists</option>
                      </select>
                    </div>
                    {(() => {
                      const profileOwnerId = userId || currentUserId
                      const filteredPlaylists = profile.playlists.filter((playlist) => {
                        if (!playlist.isPublic && playlist.userId !== currentUserId) return false
                        if (playlistFilter === 'all') return true
                        if (playlistFilter === 'my') return playlist.userId === profileOwnerId
                        if (playlistFilter === 'added') return playlist.userId !== profileOwnerId
                        return true
                      })
                      return filteredPlaylists.map((playlist) => (
                        <ProfileMediaTile
                          key={playlist.id}
                          title={playlist.name}
                          subtitle={playlist.username || 'Unknown Artist'}
                          imageUrl={resolveImage(playlist.playlistImagePath)}
                          playlistId={playlist.id}
                          canPlay={true}
                          onPlay={() => handlePlayPlaylist(playlist.id)}
                          isCreator={playlist.userId === currentUserId}
                          onEditPlaylist={handleEditPlaylist}
                          onDeletePlaylist={handleDeletePlaylist}
                          isPrivate={!playlist.isPublic}
                          isPlaylistTile={true}
                          userId={playlist.userId}
                          isShared={sharedContentIds.has(`PLAYLIST-${playlist.id}`)}
                          onShare={isAuthenticated && !sharedContentIds.has(`PLAYLIST-${playlist.id}`) ? (contentId, contentType) => handleShare(contentId, contentType, playlist.name, playlist.username || 'Unknown Artist', resolveImage(playlist.playlistImagePath)) : undefined}
                          onUnshare={isAuthenticated && sharedContentIds.has(`PLAYLIST-${playlist.id}`) ? () => {
                            const activity = sharedActivities.find(a => a.contentType === 'PLAYLIST' && a.contentId === playlist.id)
                            if (activity) handleUnshare(activity.id)
                          } : undefined}
                        />
                      ))
                    })()}
                    {profile.playlists.length === 0 ? <p className="track-meta">No playlists yet.</p> : null}
                    <div className="profile-cta">
                      <p className="profile-cta-title">Create more playlists. Share your taste.</p>
                      <p className="track-meta">Organize tracks into moods and collections for others to explore.</p>
                      <button type="button" className="solid-btn" onClick={() => navigate('/playlist/create')}>
                        Create a playlist
                      </button>
                    </div>
                  </>
                ) : null}

                {activeTab === 'shared' ? (
                  <>
                    {loadingShared ? (
                      <p className="track-meta">Loading...</p>
                    ) : sharedActivities.length === 0 ? (
                      <p className="track-meta">Nothing shared yet.</p>
                    ) : (
                      <>
                        {sharedActivities.slice(0, 4).map((activity) => {
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
                                  isLiked={isAuthenticated ? likedTrackIds.has(content.id) : false}
                                  onLikeToggle={isAuthenticated ? handleLikeToggle : undefined}
                                  userId={content.userId}
                                  isPrivate={content.isPrivate}
                                  isCreator={content.userId === currentUserId}
                                  isTrackAuthor={content.userId === currentUserId}
                                  onDelete={content.userId === currentUserId ? handleDelete : undefined}
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
                                  onEditPlaylist={handleEditPlaylist}
                                  onDeletePlaylist={handleDeletePlaylist}
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
                        {sharedActivities.length > 4 && (
                          <button
                            type="button"
                            className="profile-see-more"
                            onClick={() => navigate(`/profile/${userId || currentUserId}/shared`)}
                          >
                            See more
                          </button>
                        )}
                      </>
                    )}
                  </>
                ) : null}
              </div>
            </article>

            <aside className="panel profile-side">
              <div className="profile-side-header profile-side-section-title">
                <h3>Statistics</h3>
                {(!userId || userId === currentUserId) && (
                  <button
                    type="button"
                    className="profile-see-more"
                    onClick={() => navigate(`/profile/${userId || currentUserId}/stats`)}
                  >
                    See more
                  </button>
                )}
              </div>
              <div className="profile-side-stats">
                <div className="profile-pill">
                  <span className="profile-pill-value">{loadingStats ? '...' : stats.plays}</span>
                  <span className="profile-pill-label">Plays</span>
                </div>
                <div className="profile-pill">
                  <span className="profile-pill-value">{loadingStats ? '...' : stats.likes}</span>
                  <span className="profile-pill-label">Likes</span>
                </div>
                <div className="profile-pill">
                  <span className="profile-pill-value">{loadingStats ? '...' : stats.tracks}</span>
                  <span className="profile-pill-label">Tracks</span>
                </div>
                <div className="profile-pill">
                  <span className="profile-pill-value">{loadingStats ? '...' : stats.playlists}</span>
                  <span className="profile-pill-label">Playlists</span>
                </div>
              </div>

              <div className="profile-side-header profile-side-section-title profile-liked-header">
                <h3>Liked by me</h3>
                <button
                  type="button"
                  className="profile-see-more"
                  onClick={() => navigate(`/profile/${userId || currentUserId}/liked`)}
                >
                  See more
                </button>
              </div>
              <div className="profile-list">
                {(!userId || userId === currentUserId) ? (
                  contextLikedTracks.length === 0 ? (
                    <p className="track-meta">No liked tracks yet.</p>
                  ) : (
                    contextLikedTracks.slice(0, 3).map((track) => (
                      <ProfileMediaTile
                        key={track.id}
                        title={track.title}
                        subtitle={track.subtitle || 'Deleted User'}
                        imageUrl={track.imageUrl}
                        trailingText={track.duration ? `${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, '0')}` : undefined}
                        trackId={track.id}
                        canPlay={true}
                        isLiked={isAuthenticated ? likedTrackIds.has(track.id) : false}
                        onLikeToggle={isAuthenticated ? handleLikeToggle : undefined}
                        userId={track.userId}
                        isTrackAuthor={track.userId === currentUserId}
                        onDelete={track.userId === currentUserId ? handleDelete : undefined}
                        onEdit={track.userId === currentUserId ? (trackId) => navigate(`/track/${trackId}/edit`) : undefined}
                        onPlay={handlePlayLikedTrack}
                        isShared={sharedContentIds.has(`TRACK-${track.id}`)}
                        onShare={isAuthenticated && !sharedContentIds.has(`TRACK-${track.id}`) ? (contentId, contentType) => handleShare(contentId, contentType, track.title, track.subtitle || 'Deleted User', track.imageUrl) : undefined}
                        onUnshare={isAuthenticated && sharedContentIds.has(`TRACK-${track.id}`) ? () => {
                          const activity = sharedActivities.find(a => a.contentType === 'TRACK' && a.contentId === track.id)
                          if (activity) handleUnshare(activity.id)
                        } : undefined}
                      />
                    ))
                  )
                ) : (
                  profile.likedTracks.length === 0 ? (
                    <p className="track-meta">No liked tracks yet.</p>
                  ) : (
                    profile.likedTracks.slice(0, 3).map((track) => (
                      <ProfileMediaTile
                        key={track.id}
                        title={track.title}
                        subtitle={track.username || 'Deleted User'}
                        imageUrl={resolveImage(track.trackImagePath)}
                        trailingText={`${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, '0')}`}
                        trackId={track.id}
                        canPlay={true}
                        isLiked={isAuthenticated ? likedTrackIds.has(track.id) : false}
                        onLikeToggle={isAuthenticated ? handleLikeToggle : undefined}
                        userId={track.userId}
                        isPrivate={track.isPrivate}
                        isTrackAuthor={track.userId === currentUserId}
                        onDelete={track.userId === currentUserId ? handleDelete : undefined}
                        onEdit={track.userId === currentUserId ? (trackId) => navigate(`/track/${trackId}/edit`) : undefined}
                        onPlay={handlePlayLikedTrack}
                        isShared={sharedContentIds.has(`TRACK-${track.id}`)}
                        onShare={isAuthenticated && !sharedContentIds.has(`TRACK-${track.id}`) ? (contentId, contentType) => handleShare(contentId, contentType, track.title, track.username || 'Deleted User', resolveImage(track.trackImagePath)) : undefined}
                        onUnshare={isAuthenticated && sharedContentIds.has(`TRACK-${track.id}`) ? () => {
                          const activity = sharedActivities.find(a => a.contentType === 'TRACK' && a.contentId === track.id)
                          if (activity) handleUnshare(activity.id)
                        } : undefined}
                      />
                    ))
                  )
                )}
              </div>

              <div className="profile-side-header profile-side-section-title">
                <h3>Fans also like</h3>
                {fansAlsoLike.length > 0 && (
                  <button
                    type="button"
                    className="profile-see-more"
                    onClick={() => navigate(`/profile/${userId || currentUserId}/fans-also-like`)}
                  >
                    See more
                  </button>
                )}
              </div>
              <div className="profile-list">
                {fansAlsoLike.slice(0, 3).map((item, index) => (
                  <ProfileMediaTile
                    key={item.id}
                    title={item.title}
                    subtitle={item.username?.startsWith('Deleted_') ? 'Deleted user' : (item.username || 'Unknown Artist')}
                    imageUrl={item.trackImagePath ? `${getApiOrigin()}/${item.trackImagePath.replace(/^\//, '')}` : undefined}
                    trailingText={item.duration ? `${Math.floor(item.duration / 60)}:${String(item.duration % 60).padStart(2, '0')}` : undefined}
                    trackId={item.id}
                    canPlay={true}
                    userId={item.userId}
                    isLiked={isAuthenticated ? likedTrackIds.has(item.id) : false}
                    onLikeToggle={isAuthenticated ? handleLikeToggle : undefined}
                    onPlay={handlePlayFansAlsoLike}
                    trackNumber={index + 1}
                    isShared={sharedContentIds.has(`TRACK-${item.id}`)}
                    onShare={isAuthenticated && !sharedContentIds.has(`TRACK-${item.id}`) ? (contentId, contentType) => handleShare(contentId, contentType, item.title, item.username?.startsWith('Deleted_') ? 'Deleted user' : (item.username || 'Unknown Artist'), item.trackImagePath ? `${getApiOrigin()}/${item.trackImagePath.replace(/^\//, '')}` : undefined) : undefined}
                    onUnshare={isAuthenticated && sharedContentIds.has(`TRACK-${item.id}`) ? () => {
                      const activity = sharedActivities.find(a => a.contentType === 'TRACK' && a.contentId === item.id)
                      if (activity) handleUnshare(activity.id)
                    } : undefined}
                  />
                ))}
              </div>

              <div className="profile-side-header profile-side-section-title">
                <h3>Latest comments</h3>
                <button
                  type="button"
                  className="profile-see-more"
                  onClick={() => navigate(`/profile/${userId || currentUserId}/comments`)}
                >
                  See more
                </button>
              </div>
              <div className="profile-comments">
                {latestComments.length === 0 ? (
                  <p className="track-meta">No comments on tracks yet.</p>
                ) : (
                  latestComments.map((c) => (
                    <div key={c.id} className="profile-comment">
                      <p
                        className="track-title"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/track/${c.contentId}`)}
                      >
                        {c.trackTitle || 'Unknown Track'}
                      </p>
                      <div className="profile-comment-top">
                        <p className="track-meta">
                          <span
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/profile/${c.user?.id}`)}
                          >
                            {c.user?.username || 'Unknown'}
                          </span>
                          : {c.content}
                        </p>
                        <span className="track-meta">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </aside>
          </>
        ) : null}
      </section>

      {isEditing ? (
        <div className="profile-edit-modal-backdrop" onClick={() => setIsEditing(false)}>
          <div className="profile-edit-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Edit profile</h3>
            <div className="profile-edit-form">
              <label className="field">
                <span>Bio</span>
                <textarea value={editBio} onChange={(event) => setEditBio(event.target.value)} rows={4} maxLength={500} />
              </label>
              <label className="field">
                <span>Profile image</span>
                <div className="file-input-wrapper">
                  <input
                    className="file-input"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(event) => setSelectedImage(event.target.files?.[0])}
                  />
                </div>
              </label>
              <div className="profile-edit-actions">
                <button type="button" className="ghost-btn" onClick={() => setIsEditing(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="button" className="solid-btn" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {shareModal && (
        <ShareModal
          content={shareModal.content}
          contentType={shareModal.contentType}
          onShare={handleShareSubmit}
          onCancel={() => setShareModal(null)}
        />
      )}

      {profile && peopleModal ? (
        <div className="profile-edit-modal-backdrop" onClick={closePeopleModal}>
          <div className="profile-people-modal" onClick={(event) => event.stopPropagation()}>
            <div className="profile-people-header">
              <h3>{peopleModal === 'followers' ? 'Followers' : 'Following'}</h3>
              <button type="button" className="profile-people-close" onClick={closePeopleModal} aria-label="Close">
                ×
              </button>
            </div>

            <div className="profile-people-list">
              {(peopleModal === 'followers' ? profile.followers : profile.following).length === 0 ? (
                <p className="track-meta">Nothing here yet.</p>
              ) : (
                (peopleModal === 'followers' ? profile.followers : profile.following).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="profile-people-item"
                    onClick={() => {
                      setPeopleModal(null)
                      navigate(`/profile/${u.id}`)
                    }}
                  >
                    {u.profileImagePath ? (
                      <img className="profile-people-avatar" src={resolveImage(u.profileImagePath)} alt={u.username} />
                    ) : (
                      <div className="profile-people-avatar placeholder" aria-hidden="true">
                        {u.username.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="profile-people-text">
                      <p className="track-title">{u.username}</p>
                      <p className="track-meta">View profile</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      <Footer isAuthenticated={isAuthenticated} />
    </main>
  )
}
