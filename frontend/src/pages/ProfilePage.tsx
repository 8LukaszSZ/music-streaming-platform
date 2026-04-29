import { Navbar } from '../components/Navbar'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ProfileMediaTile } from '../components/ProfileMediaTile'
import { getApiOrigin } from '../api/httpClient'
import { getProfileData, getUserProfileData, updateProfileData } from '../services/profileService'
import { likeTrack, unlikeTrack, deleteTrack, getLatestCommentsForUser, getFansAlsoLike } from '../api/audioApi'
import { followUser, unfollowUser, deletePlaylist } from '../api/profileApi'
import { getUnreadMessageCount } from '../api/conversationApi'
import type { PlaylistDto, TrackDto, UserActivityDto, UserLiteDto } from '../types/profile'
import type { ProfileTab } from '../types/page'
import { Footer } from '../components/Footer'
import { useAudio } from '../contexts/AudioContext'

export function ProfilePage() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId?: string }>()
  const isAuthenticated = Boolean(localStorage.getItem('authToken'))
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
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)

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

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const token = localStorage.getItem('authToken')
      if (!token) return
      try {
        const count = await getUnreadMessageCount(token)
        setUnreadMessageCount(count)
      } catch (error) {
        console.error('Failed to fetch unread message count:', error)
      }
    }

    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

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
            const recommendations = await getFansAlsoLike(targetUserId, 5)
            setFansAlsoLike(recommendations)
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

  const sharedItems = useMemo(() => {
    if (!profile) return []
    return profile.shared.map((activity) => ({
      id: activity.id,
      title: activity.message || `Shared ${activity.contentType.toLowerCase()}`,
      subtitle: new Date(activity.createdAt).toLocaleDateString(),
    }))
  }, [profile])

  const likedTrackIds = useMemo(() => {
    return new Set(contextLikedTracks.map((track) => track.id))
  }, [contextLikedTracks])

  const resolveImage = useCallback((path?: string) => {
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://')) return path

    const normalizedPath = path.replaceAll('\\', '/').replace(/^wwwroot\//, '')
    return `${getApiOrigin()}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`
  }, [])

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
      trackList = profile.likedTracks.map((track) => ({
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

  const handleFollowToggle = async () => {
    if (!userId) return

    const token = localStorage.getItem('authToken')
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
    const token = localStorage.getItem('authToken')
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

    const token = localStorage.getItem('authToken')
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

    const token = localStorage.getItem('authToken')
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

    const token = localStorage.getItem('authToken')
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
                    {sharedItems.map((item) => (
                      <div key={item.id} className="profile-list-item">
                        <p className="track-title">{item.title}</p>
                        <p className="track-meta">{item.subtitle}</p>
                      </div>
                    ))}
                    {sharedItems.length === 0 ? <p className="track-meta">Nothing shared yet.</p> : null}
                  </>
                ) : null}
              </div>
            </article>

            <aside className="panel profile-side">
              <div className="profile-side-header profile-side-section-title">
                <h3>Statistics</h3>
              </div>
              <div className="profile-side-stats">
                <div className="profile-pill">
                  <span className="profile-pill-value">12.4K</span>
                  <span className="profile-pill-label">Plays</span>
                </div>
                <div className="profile-pill">
                  <span className="profile-pill-value">438</span>
                  <span className="profile-pill-label">Likes</span>
                </div>
                <div className="profile-pill">
                  <span className="profile-pill-value">27</span>
                  <span className="profile-pill-label">Tracks</span>
                </div>
                <div className="profile-pill">
                  <span className="profile-pill-value">9</span>
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
                {fansAlsoLike.slice(0, 3).map((item) => (
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
