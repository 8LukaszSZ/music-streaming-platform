import { useAudio } from '../contexts/AudioContext'
import { likeTrack, unlikeTrack } from '../api/audioApi'

export function AudioPlayer() {
  const { currentTrack, isPlaying, progress, duration, volume, pauseTrack, resumeTrack, seek, setVolume, nextTrack, prevTrack, likedTracks, toggleLike } = useAudio()

  if (!currentTrack) return null

  const liked = likedTracks.some((t) => t.id === currentTrack.id)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0
  const volumePercent = volume * 100

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = (parseFloat(e.target.value) / 100) * duration
    seek(newTime)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value))
  }

  const handleLike = async () => {
    if (!currentTrack?.id) return

    const token = localStorage.getItem('authToken')
    if (!token) {
      alert('You need to log in to like tracks')
      return
    }

    const previousLiked = liked

    try {
      if (liked) {
        await unlikeTrack(currentTrack.id, token)
        toggleLike(currentTrack.id, false)
      } else {
        await likeTrack(currentTrack.id, token)
        toggleLike(currentTrack.id, true, currentTrack)
      }
    } catch (error) {
      console.error('Failed to toggle like:', error)
      toggleLike(currentTrack.id, previousLiked)
      alert('Failed to like track')
    }
  }

  const progressStyle = {
    background: `linear-gradient(90deg, #9e77ff ${progressPercent}%, rgba(255, 255, 255, 0.1) ${progressPercent}%)`,
  }

  const volumeStyle = {
    background: `linear-gradient(90deg, #9e77ff ${volumePercent}%, rgba(255, 255, 255, 0.1) ${volumePercent}%)`,
  }

  return (
    <div className="audio-player">
      <div className="audio-player-content">
        <div className="audio-player-left">
          {currentTrack.imageUrl ? (
            <img className="audio-player-image" src={currentTrack.imageUrl} alt={currentTrack.title} />
          ) : (
            <div className="audio-player-image placeholder">{currentTrack.title.slice(0, 1).toUpperCase()}</div>
          )}
          <div className="audio-player-info">
            <p className="audio-player-title">{currentTrack.title}</p>
            {currentTrack.subtitle ? <p className="audio-player-subtitle">{currentTrack.subtitle}</p> : null}
          </div>
          <button type="button" className="audio-player-like-btn" onClick={handleLike} aria-label={liked ? 'Unlike' : 'Like'}>
            <svg viewBox="0 0 24 24" className={`icon ${liked ? 'liked' : ''}`} aria-hidden="true">
              <path d={liked ? "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" : "M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"} />
            </svg>
          </button>
        </div>

        <div className="audio-player-center">
          <div className="audio-player-controls">
            <button
              type="button"
              className="audio-player-control-btn"
              onClick={prevTrack}
              aria-label="Previous track"
            >
              <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
                <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
              </svg>
            </button>
            <button
              type="button"
              className="audio-player-control-btn audio-player-play-btn"
              onClick={isPlaying ? pauseTrack : resumeTrack}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
                  <path d="M8 5v14l12-7L8 5z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              className="audio-player-control-btn"
              onClick={nextTrack}
              aria-label="Next track"
            >
              <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
                <path d="M6 18l8.5-6L6 6v12zm8.5 0V6H16v12h-1.5z" />
              </svg>
            </button>
          </div>
          <div className="audio-player-progress">
            <span className="audio-player-time">{formatTime(progress)}</span>
            <input
              type="range"
              className="audio-player-slider"
              min="0"
              max="100"
              value={progressPercent}
              onChange={handleSeek}
              aria-label="Seek"
              style={progressStyle}
            />
            <span className="audio-player-time">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="audio-player-right">
          <div className="audio-player-volume">
            <svg viewBox="0 0 24 24" className="audio-player-volume-icon icon" aria-hidden="true">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
            <input
              type="range"
              className="audio-player-volume-slider"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              aria-label="Volume"
              style={volumeStyle}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
