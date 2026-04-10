import { useEffect, useRef, useState } from 'react'
import { useAudio } from '../contexts/AudioContext'
import { getTrackStreamUrl } from '../api/audioApi'

type ProfileMediaTileProps = {
  title: string
  subtitle?: string
  imageUrl?: string
  trailingText?: string
  trackId?: string
  canPlay?: boolean
  isLiked?: boolean
  onLikeToggle?: (trackId: string, isLiked: boolean) => void
}

export function ProfileMediaTile({ title, subtitle, imageUrl, trailingText, trackId, canPlay = true, isLiked = false, onLikeToggle }: ProfileMediaTileProps) {
  const { currentTrack, playTrack, pauseTrack, isPlaying } = useAudio()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isCurrentTrack = trackId && currentTrack?.id === trackId

  const handlePlayClick = () => {
    if (!trackId) return

    if (isCurrentTrack && isPlaying) {
      pauseTrack()
    } else {
      playTrack(
        {
          id: trackId,
          title,
          subtitle,
          imageUrl,
        },
        getTrackStreamUrl(trackId)
      )
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
          <p className="track-title">{title}</p>
          {subtitle ? <p className="track-meta">{subtitle}</p> : null}
        </div>
      </div>

      <div className="profile-media-right">
        {trailingText ? <span className="track-meta">{trailingText}</span> : null}
        {trackId && canPlay ? (
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
              <button type="button" className="profile-menu-item">
                <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
                  <path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z" />
                </svg>
                <span>Add to playlist</span>
              </button>
              <button type="button" className="profile-menu-item">
                <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
                </svg>
                <span>Share</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
