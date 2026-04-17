import { memo, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useAudio } from '../contexts/AudioContext'
import { getTrackStreamUrl, addTrackToPlaylist } from '../api/audioApi'
import { getMyPlaylists } from '../api/profileApi'
import { getApiOrigin } from '../api/httpClient'
import type { ProfileMediaTileProps } from '../types/component'

export const ProfileMediaTile = memo(function ProfileMediaTile({ title, subtitle, imageUrl, trailingText, trackId, playlistId, canPlay = true, isLiked = false, onLikeToggle, userId, isPrivate = false, isCreator = false, onDelete, onEdit, onPlay, onDeletePlaylist, onEditPlaylist, onRemoveFromPlaylist }: ProfileMediaTileProps) {
  const navigate = useNavigate()
  const { currentTrack, playTrack, pauseTrack, isPlaying } = useAudio()
  const [showMenu, setShowMenu] = useState(false)
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [playlists, setPlaylists] = useState<any[]>([])
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  const [playlistsWithTrack, setPlaylistsWithTrack] = useState<Set<string>>(new Set())
  const menuRef = useRef<HTMLDivElement>(null)

  const isCurrentTrack = trackId && currentTrack?.id === trackId

  const handlePlayClick = () => {
    if (trackId) {
      if (onPlay) {
        onPlay(trackId)
      }

      if (isCurrentTrack && isPlaying) {
        pauseTrack()
      } else {
        playTrack(
          {
            id: trackId,
            title,
            subtitle,
            imageUrl,
            userId,
          },
          getTrackStreamUrl(trackId)
        )
      }
      return
    }

    if (playlistId && onPlay) {
      onPlay(playlistId)
    }
  }

  const handleMenuToggle = () => {
    setShowMenu(!showMenu)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const handleLike = () => {
    if (!trackId) return

    onLikeToggle?.(trackId, !isLiked)
    setShowMenu(false)
  }

  const handleDelete = () => {
    if (!trackId || !onDelete) return

    if (confirm('Are you sure you want to delete this track?')) {
      onDelete(trackId)
      setShowMenu(false)
    }
  }

  const handleEdit = () => {
    if (!trackId || !onEdit) return
    onEdit(trackId)
    setShowMenu(false)
  }

  const handleTitleClick = () => {
    if (trackId) {
      navigate(`/track/${trackId}`)
    } else if (playlistId) {
      navigate(`/playlist/${playlistId}`)
    }
  }

  const handleAddToPlaylist = async () => {
    if (!trackId) return

    const token = localStorage.getItem('authToken')
    if (!token) {
      alert('You need to log in to add tracks to playlists')
      return
    }

    setShowMenu(false)
    setShowPlaylistModal(true)
    setLoadingPlaylists(true)
    setPlaylistsWithTrack(new Set())

    try {
      const userPlaylists = await getMyPlaylists(token)
      console.log('Playlists data:', userPlaylists)

      // Check which playlists already contain the track
      const playlistsWithTrackSet = new Set<string>()
      await Promise.all(
        userPlaylists.map(async (playlist: any) => {
          try {
            const response = await fetch(`${getApiOrigin()}/api/playlists/${playlist.id}/tracks`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            if (response.ok) {
              const tracks: any[] = await response.json()
              const hasTrack = tracks.some((t) => t.localTrackId === trackId)
              if (hasTrack) {
                playlistsWithTrackSet.add(playlist.id)
              }
            }
          } catch (error) {
            console.error(`Failed to check tracks for playlist ${playlist.id}:`, error)
          }
        })
      )

      setPlaylistsWithTrack(playlistsWithTrackSet)
      setPlaylists(userPlaylists)
    } catch (error) {
      console.error('Failed to load playlists:', error)
    } finally {
      setLoadingPlaylists(false)
    }
  }

  const resolveImage = (path: string | undefined) => {
    if (!path) return undefined
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path
    }
    return `${getApiOrigin()}/${path.replace(/^\//, '')}`
  }

  const handleAddTrackToPlaylist = async (playlistId: string) => {
    if (!trackId) return

    try {
      const token = localStorage.getItem('authToken') || undefined
      await addTrackToPlaylist(playlistId, trackId, token)
      alert('Track added to playlist')
      setShowPlaylistModal(false)
    } catch (error) {
      console.error('Failed to add track to playlist:', error)
      alert('Failed to add track to playlist')
    }
  }

  return (
    <div className={`profile-media-tile${isCurrentTrack ? ' active' : ''}`} role="group" aria-label={title}>
      <div className="profile-media-left">
        {imageUrl ? (
          <img className="profile-media-image" src={imageUrl} alt={title} />
        ) : (
          <div className="profile-media-image placeholder" aria-hidden="true">
            {title.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <button
            type="button"
            className="track-title"
            onClick={handleTitleClick}
            style={{ cursor: (playlistId || trackId) ? 'pointer' : 'default', background: 'none', border: 'none', padding: 0, textAlign: 'left' }}
          >
            {title}
            {isPrivate && (
              <svg viewBox="0 0 24 24" className="lock-icon" aria-hidden="true" style={{ width: 14, height: 14, marginLeft: 6, opacity: 0.7 }}>
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor" />
              </svg>
            )}
          </button>
          {subtitle ? (
            userId ? (
              <button
                type="button"
                className="username-link"
                onClick={() => navigate(`/profile/${userId}`)}
              >
                {subtitle}
              </button>
            ) : (
              <p className="track-meta">{subtitle}</p>
            )
          ) : null}
        </div>
      </div>

      <div className="profile-media-right">
        {trailingText ? <span className="track-meta">{trailingText}</span> : null}
        {(trackId || playlistId) && canPlay ? (
          <button type="button" className="profile-icon-btn" onClick={handlePlayClick} aria-label={isCurrentTrack && isPlaying ? 'Pause' : 'Play'}>
            {isCurrentTrack && isPlaying ? (
              <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
                <path d="M8 5v14l12-7L8 5z" />
              </svg>
            )}
          </button>
        ) : null}
        <div className="profile-media-more" ref={menuRef}>
          <button type="button" className="profile-icon-btn" onClick={handleMenuToggle} aria-label="More options">
            <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
              <path d="M12 7.25a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5Zm0 6.5a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5Zm0 6.5a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5Z" />
            </svg>
          </button>
          {showMenu && (
            <div className="profile-media-menu">
              <button type="button" className="profile-menu-item" onClick={handleLike}>
                <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
                  <path d={isLiked ? "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" : "M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"} />
                </svg>
                <span className={isLiked ? 'liked' : ''}>{isLiked ? 'liked' : 'like'}</span>
              </button>
              {!playlistId && (
                <button type="button" className="profile-menu-item" onClick={handleAddToPlaylist}>
                  <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
                    <path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z" />
                  </svg>
                  <span>Add to playlist</span>
                </button>
              )}
              <button type="button" className="profile-menu-item">
                <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
                </svg>
                <span>Share</span>
              </button>
              {isCreator && playlistId && onEditPlaylist && (
                <button type="button" className="profile-menu-item" onClick={() => { setShowMenu(false); onEditPlaylist(playlistId) }}>
                  <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                  <span>Edit playlist</span>
                </button>
              )}
              {isCreator && playlistId && onDeletePlaylist && (
                <button type="button" className="profile-menu-item" onClick={() => { setShowMenu(false); onDeletePlaylist(playlistId) }}>
                  <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </svg>
                  <span>Delete playlist</span>
                </button>
              )}
              {isCreator && !playlistId && (
                <button type="button" className="profile-menu-item" onClick={handleEdit}>
                  <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                  <span>Edit</span>
                </button>
              )}
              {isCreator && !playlistId && (
                <button type="button" className="profile-menu-item" onClick={handleDelete}>
                  <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </svg>
                  <span>Delete</span>
                </button>
              )}
              {playlistId && onRemoveFromPlaylist && (
                <button type="button" className="profile-menu-item" onClick={() => { setShowMenu(false); onRemoveFromPlaylist(trackId!) }}>
                  <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                  <span>Remove</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showPlaylistModal && createPortal(
        <div className="playlist-modal-overlay" onClick={() => setShowPlaylistModal(false)}>
          <div className="playlist-modal" onClick={(e) => e.stopPropagation()}>
            <div className="playlist-modal-header">
              <h3>Add to playlist</h3>
              <button
                type="button"
                className="playlist-modal-close"
                onClick={() => setShowPlaylistModal(false)}
              >
                ×
              </button>
            </div>
            <div className="playlist-modal-content">
              {loadingPlaylists ? (
                <p>Loading playlists...</p>
              ) : playlists.length === 0 ? (
                <>
                  <p>No playlists found. Create one first.</p>
                  <button
                    type="button"
                    className="solid-btn"
                    onClick={() => {
                      setShowPlaylistModal(false)
                      navigate('/playlist/create')
                    }}
                    style={{ marginTop: '16px', width: '100%' }}
                  >
                    Create a playlist
                  </button>
                </>
              ) : (
                <div className="playlist-modal-list">
                  {playlists.map((playlist) => {
                    const imageUrl = resolveImage(playlist.playlistImagePath)
                    console.log('Playlist:', playlist.name, 'ImagePath:', playlist.playlistImagePath, 'Resolved:', imageUrl)
                    return (
                      <div key={playlist.id} className="playlist-modal-item">
                        <div className="playlist-modal-item-left">
                          {imageUrl ? (
                            <img
                              className="playlist-modal-item-cover"
                              src={imageUrl}
                              alt={playlist.name}
                              onError={(e) => {
                                console.error('Image load error for:', playlist.name, imageUrl)
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="playlist-modal-item-cover">
                              {playlist.name.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <span className="playlist-modal-item-name">{playlist.name}</span>
                        </div>
                        <button
                          type="button"
                          className="playlist-modal-add-btn"
                          onClick={() => handleAddTrackToPlaylist(playlist.id)}
                          disabled={playlistsWithTrack.has(playlist.id)}
                          style={{
                            opacity: playlistsWithTrack.has(playlist.id) ? 0.5 : 1,
                            cursor: playlistsWithTrack.has(playlist.id) ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {playlistsWithTrack.has(playlist.id) ? 'Added' : 'Add'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
})
