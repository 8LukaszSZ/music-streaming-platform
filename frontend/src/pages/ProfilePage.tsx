import { Navbar } from '../components/Navbar'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ProfileMediaTile } from '../components/ProfileMediaTile'
import { getApiOrigin } from '../api/httpClient'
import { getProfileData, getUserProfileData, updateProfileData } from '../services/profileService'
import { likeTrack, unlikeTrack } from '../api/audioApi'
import type { PlaylistDto, TrackDto, UserActivityDto, UserLiteDto } from '../types/profile'
import { Footer } from '../components/Footer'
import { useAudio } from '../contexts/AudioContext'

type ProfileTab = 'tracks' | 'playlists' | 'shared'

export function ProfilePage() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId?: string }>()
  const isAuthenticated = Boolean(localStorage.getItem('authToken'))
  const { setTrackList, setLikedTracks, toggleLike, likedTracks: contextLikedTracks } = useAudio()
  const [activeTab, setActiveTab] = useState<ProfileTab>('tracks')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [peopleModal, setPeopleModal] = useState<'followers' | 'following' | null>(null)
  const [editBio, setEditBio] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | undefined>(undefined)
  const [saving, setSaving] = useState(false)

  // Fetch current user's liked tracks on mount to ensure contextLikedTracks is always populated
  useEffect(() => {
    const fetchCurrentUserLikedTracks = async () => {
      const token = localStorage.getItem('authToken')
      if (!token) return

      try {
        const currentUserData = await getProfileData()
        setLikedTracks(
          currentUserData.likedTracks.map((track) => ({
            id: track.id,
            title: track.title,
            subtitle: track.username || 'Deleted User',
            imageUrl: track.trackImagePath ? resolveImage(track.trackImagePath) : undefined,
            duration: track.duration,
          }))
        )
      } catch (error) {
        console.error('Failed to fetch current user liked tracks:', error)
      }
    }

    fetchCurrentUserLikedTracks()
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
  const fansAlsoLike = [
    { title: 'Night Drive', artist: 'Lune', duration: 182 },
    { title: 'Violet Lines', artist: 'Aeria', duration: 201 },
    { title: 'Static Dreams', artist: 'Kade', duration: 168 },
  ]
  const latestComments = [
    { author: 'Nova', text: 'This track is on repeat.', when: '2d ago' },
    { author: 'Mira', text: 'Love the mix and vibe.', when: '5d ago' },
    { author: 'Orin', text: 'The chorus hits hard.', when: '1w ago' },
  ]

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = userId ? await getUserProfileData(userId) : await getProfileData()
        setProfile(data)

        // Decode JWT to get current user ID
        const token = localStorage.getItem('authToken')
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            setCurrentUserId(payload.nameid || payload.sub || null)
          } catch {
            setCurrentUserId(null)
          }
        }
        setProfile(data)
        // Only set contextLikedTracks when viewing own profile
        const isOwnProfile = !userId || userId === currentUserId
        if (isOwnProfile) {
          setLikedTracks(
            data.likedTracks.map((track) => ({
              id: track.id,
              title: track.title,
              subtitle: track.username || 'Deleted User',
              imageUrl: track.trackImagePath ? resolveImage(track.trackImagePath) : undefined,
              duration: track.duration,
            }))
          )
        }

        // Set track list for audio navigation
        const trackList = data.tracks.map((track) => ({
          id: track.id,
          title: track.title,
          subtitle: track.username || 'Deleted User',
          imageUrl: track.trackImagePath ? resolveImage(track.trackImagePath) : undefined,
          duration: track.duration,
        }))
        setTrackList(trackList)
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
  }, [navigate, userId, setTrackList])

  const sharedItems = useMemo(() => {
    if (!profile) return []
    return profile.shared.map((activity) => ({
      id: activity.id,
      title: activity.message || `Shared ${activity.contentType.toLowerCase()}`,
      subtitle: new Date(activity.createdAt).toLocaleDateString(),
    }))
  }, [profile])

  const resolveImage = (path?: string) => {
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://')) return path

    const normalizedPath = path.replaceAll('\\', '/').replace(/^wwwroot\//, '')
    return `${getApiOrigin()}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`
  }

  const handleLikeToggle = async (trackId: string, isLiked: boolean) => {
    if (!profile) return

    const token = localStorage.getItem('authToken')
    if (!token) {
      alert('You need to log in to like tracks')
      return
    }

    // Try to find track in profile.tracks first, then in contextLikedTracks
    const trackDto = profile.tracks.find((t) => t.id === trackId)
    const trackInfo = contextLikedTracks.find((t) => t.id === trackId)
    const track = trackDto || trackInfo
    if (!track) return

    // Only update local profile state if viewing own profile
    const isOwnProfile = !userId || userId === currentUserId

    try {
      if (isLiked) {
        await likeTrack(trackId, token)
        toggleLike(trackId, true, {
          id: track.id,
          title: track.title,
          subtitle: trackInfo?.subtitle || trackDto?.username || 'Deleted User',
          imageUrl: trackInfo?.imageUrl || (trackDto?.trackImagePath ? resolveImage(trackDto.trackImagePath) : undefined),
          duration: track.duration,
        })
        // Update local profile state if viewing own profile
        if (isOwnProfile) {
          setProfile({
            ...profile,
            likedTracks: [trackDto!, ...profile.likedTracks],
          })
        }
      } else {
        await unlikeTrack(trackId, token)
        toggleLike(trackId, false)
        // Update local profile state if viewing own profile
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
        {loading ? <p className="track-meta">Loading profile...</p> : null}
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
                {userId ? null : (
                  <button type="button" className="ghost-btn profile-edit-btn" onClick={handleStartEdit}>
                    Edit profile
                  </button>
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
                        isLiked={isAuthenticated ? contextLikedTracks.some((liked) => liked.id === track.id) : false}
                        onLikeToggle={isAuthenticated ? handleLikeToggle : undefined}
                      />
                    ))}
                    {profile.tracks.length === 0 ? <p className="track-meta">No tracks yet.</p> : null}
                    <div className="profile-cta">
                      <p className="profile-cta-title">Share your creativity with others.</p>
                      <p className="track-meta">Upload more tracks and let people discover your sound.</p>
                      <button type="button" className="solid-btn" onClick={() => navigate('/stream')}>
                        Upload a track
                      </button>
                    </div>
                  </>
                ) : null}

                {activeTab === 'playlists' ? (
                  <>
                    {profile.playlists.map((playlist) => (
                      <ProfileMediaTile
                        key={playlist.id}
                        title={playlist.name}
                        subtitle={playlist.description || (playlist.isPublic ? 'Public playlist' : 'Private playlist')}
                        imageUrl={resolveImage(playlist.playlistImagePath)}
                        trailingText="Playlist"
                      />
                    ))}
                    {profile.playlists.length === 0 ? <p className="track-meta">No playlists yet.</p> : null}
                    <div className="profile-cta">
                      <p className="profile-cta-title">Create more playlists. Share your taste.</p>
                      <p className="track-meta">Organize tracks into moods and collections for others to explore.</p>
                      <button type="button" className="solid-btn" onClick={() => navigate('/stream')}>
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
                <button type="button" className="profile-see-more">
                  See more
                </button>
              </div>
              <div className="profile-list">
                {(!userId || userId === currentUserId) ? (
                  contextLikedTracks.length === 0 ? (
                    <p className="track-meta">No liked tracks yet.</p>
                  ) : (
                    contextLikedTracks.map((track) => (
                      <ProfileMediaTile
                        key={track.id}
                        title={track.title}
                        subtitle={track.subtitle || 'Deleted User'}
                        imageUrl={track.imageUrl}
                        trailingText={track.duration ? `${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, '0')}` : undefined}
                        trackId={track.id}
                        canPlay={true}
                        isLiked={isAuthenticated ? contextLikedTracks.some((liked) => liked.id === track.id) : false}
                        onLikeToggle={isAuthenticated ? handleLikeToggle : undefined}
                      />
                    ))
                  )
                ) : (
                  profile.likedTracks.length === 0 ? (
                    <p className="track-meta">No liked tracks yet.</p>
                  ) : (
                    profile.likedTracks.map((track) => (
                      <ProfileMediaTile
                        key={track.id}
                        title={track.title}
                        subtitle={track.username || 'Deleted User'}
                        imageUrl={resolveImage(track.trackImagePath)}
                        trailingText={`${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, '0')}`}
                        trackId={track.id}
                        canPlay={true}
                        isLiked={isAuthenticated ? profile.likedTracks.some((liked) => liked.id === track.id) : false}
                        onLikeToggle={isAuthenticated ? handleLikeToggle : undefined}
                      />
                    ))
                  )
                )}
              </div>

              <div className="profile-side-header profile-side-section-title">
                <h3>Fans also like</h3>
                <button type="button" className="profile-see-more">
                  See more
                </button>
              </div>
              <div className="profile-list">
                {fansAlsoLike.map((item) => (
                  <ProfileMediaTile
                    key={item.title}
                    title={item.title}
                    subtitle={item.artist}
                    trailingText={`${Math.floor(item.duration / 60)}:${String(item.duration % 60).padStart(2, '0')}`}
                    trackId={undefined}
                    canPlay={false}
                  />
                ))}
              </div>

              <div className="profile-side-header profile-side-section-title">
                <h3>Latest comments</h3>
                <button type="button" className="profile-see-more">
                  See more
                </button>
              </div>
              <div className="profile-comments">
                {latestComments.map((c) => (
                  <div key={`${c.author}-${c.text}`} className="profile-comment">
                    <div className="profile-comment-top">
                      <p className="track-title">{c.author}</p>
                      <span className="track-meta">{c.when}</span>
                    </div>
                    <p className="track-meta">{c.text}</p>
                  </div>
                ))}
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
