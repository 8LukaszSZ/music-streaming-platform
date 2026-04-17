import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { Waveform } from '../components/Waveform'
import { useAudio } from '../contexts/AudioContext'
import { getApiOrigin } from '../api/httpClient'
import { likeTrack, unlikeTrack, getTrackById, getTrackStreamUrl, getWaveform, getComments, createComment, deleteComment, getCommentsCount, getLikesCount, getPlaysCount } from '../api/audioApi'

export function TrackPage() {
  const { trackId } = useParams<{ trackId: string }>()
  const navigate = useNavigate()
  const { playTrack, likedTracks, toggleLike, currentTrack, isPlaying, pauseTrack, progress, duration, seek, playsCount } = useAudio()
  const [track, setTrack] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [waveformBars, setWaveformBars] = useState<number[]>([])
  const [pendingSeekPercent, setPendingSeekPercent] = useState<number | null>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [stats, setStats] = useState({ plays: 0, likes: 0, comments: 0 })
  const [previousLiked, setPreviousLiked] = useState(false)
  const [previousPlaysCount, setPreviousPlaysCount] = useState(0)
  const wasPlayingRef = useRef(false)

  // Decode JWT to get current user ID before any fetch
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

  useEffect(() => {
    const loadAll = async () => {
      if (!trackId) return
      setLoading(true)
      setError('')

      try {
        const token = localStorage.getItem('authToken') || undefined
        const [data, waveform, commentsData, plays, likes, commentsCount] = await Promise.all([
          getTrackById(trackId, token),
          getWaveform(trackId, token).catch(() => {
            console.error('Failed to fetch waveform, using fallback')
            return Array.from({ length: 100 }, () => Math.random() * 60 + 20)
          }),
          getComments(trackId, 'TRACK', token).catch(() => []),
          getPlaysCount(trackId, 'TRACK', token).catch(() => 0),
          getLikesCount(trackId, 'TRACK', token).catch(() => 0),
          getCommentsCount(trackId, 'TRACK', token).catch(() => 0),
        ])

        setTrack(data)
        setWaveformBars(waveform as number[])
        setComments(commentsData as any[])
        setStats({
          plays: (plays as number) || 0,
          likes: (likes as number) || 0,
          comments: (commentsCount as number) || 0,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load track')
      } finally {
        setLoading(false)
      }
    }

    loadAll()
  }, [trackId])

  // Handle pending seek after track loads
  useEffect(() => {
    if (pendingSeekPercent !== null && currentTrack?.id === trackId && duration > 0) {
      const newTime = pendingSeekPercent * duration
      seek(newTime)
      setPendingSeekPercent(null)
    }
  }, [currentTrack, pendingSeekPercent, trackId, duration, seek])


  const handlePostComment = useCallback(async () => {
    if (!trackId || !newComment.trim()) return

    const token = localStorage.getItem('authToken')
    if (!token) {
      alert('You need to log in to comment')
      return
    }

    const tempComment = {
      id: `temp-${Date.now()}`,
      content: newComment.trim(),
      user: { id: currentUserId, username: 'You' },
      createdAt: new Date().toISOString(),
      replies: [],
    }

    // Optimistic update
    setComments(prev => [tempComment, ...prev])
    setNewComment('')
    setStats(prev => ({ ...prev, comments: prev.comments + 1 }))

    try {
      const created = await createComment(trackId, newComment.trim(), undefined, token)
      setComments(prev => prev.map(c => c.id === tempComment.id ? created : c))
    } catch (err) {
      console.error('Failed to post comment:', err)
      setComments(prev => prev.filter(c => c.id !== tempComment.id))
      setStats(prev => ({ ...prev, comments: prev.comments - 1 }))
      alert('Failed to post comment')
    }
  }, [trackId, newComment, currentUserId])

  const handlePostReply = useCallback(async (parentCommentId: string) => {
    if (!trackId || !replyContent.trim()) return

    const token = localStorage.getItem('authToken')
    if (!token) {
      alert('You need to log in to comment')
      return
    }

    const tempReply = {
      id: `temp-reply-${Date.now()}`,
      content: replyContent.trim(),
      user: { id: currentUserId, username: 'You' },
      createdAt: new Date().toISOString(),
    }

    // Optimistic update
    setComments(prev => prev.map(c => {
      if (c.id === parentCommentId) {
        return {
          ...c,
          replies: [...(c.replies || []), tempReply]
        }
      }
      return c
    }))
    setReplyContent('')
    setReplyTo(null)
    setStats(prev => ({ ...prev, comments: prev.comments + 1 }))

    try {
      const created = await createComment(trackId, replyContent.trim(), parentCommentId, token)
      setComments(prev => prev.map(c => {
        if (c.id === parentCommentId) {
          return {
            ...c,
            replies: (c.replies || []).map(r => r.id === tempReply.id ? created : r)
          }
        }
        return c
      }))
    } catch (err) {
      console.error('Failed to post reply:', err)
      setComments(prev => prev.map(c => {
        if (c.id === parentCommentId) {
          return {
            ...c,
            replies: (c.replies || []).filter(r => r.id !== tempReply.id)
          }
        }
        return c
      }))
      setStats(prev => ({ ...prev, comments: prev.comments - 1 }))
      alert('Failed to post reply')
    }
  }, [trackId, replyContent, currentUserId])

  const handleDeleteComment = useCallback(async (commentId: string) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      alert('You need to log in to delete comments')
      return
    }

    if (!confirm('Are you sure you want to delete this comment?')) {
      return
    }

    // Optimistic update
    setComments(prev => prev.filter(c => c.id !== commentId))
    setStats(prev => ({ ...prev, comments: Math.max(0, prev.comments - 1) }))

    try {
      await deleteComment(commentId, token)
    } catch (err) {
      console.error('Failed to delete comment:', err)
      setStats(prev => ({ ...prev, comments: prev.comments + 1 }))
      // Refetch on error
      const data = await getComments(trackId, 'TRACK', token) as any[]
      setComments(data)
      alert('Failed to delete comment')
    }
  }, [trackId])

  const isAuthenticated = useMemo(() => Boolean(localStorage.getItem('authToken')), [])
  const likedTrackIds = useMemo(() => new Set(likedTracks.map((t) => t.id)), [likedTracks])
  const liked = useMemo(() => likedTrackIds.has(trackId || ''), [likedTrackIds, trackId])

  const resolveImage = useCallback((path: string | undefined) => {
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://')) return path

    const normalizedPath = path.replaceAll('\\', '/').replace(/^wwwroot\//, '')
    return `${getApiOrigin()}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  // Sync stats.likes when liked status changes from AudioPlayer
  useEffect(() => {
    if (!trackId) return

    const isCurrentlyLiked = likedTrackIds.has(trackId)
    if (isCurrentlyLiked !== previousLiked) {
      setStats((prev) => ({
        ...prev,
        likes: isCurrentlyLiked ? prev.likes + 1 : Math.max(0, prev.likes - 1),
      }))
      setPreviousLiked(isCurrentlyLiked)
    }
  }, [likedTrackIds, trackId, previousLiked])

  // Sync stats.plays with AudioContext playsCount
  useEffect(() => {
    if (!trackId || currentTrack?.id !== trackId) return

    // Reset previousPlaysCount when track changes or replay starts
    if (isPlaying && !wasPlayingRef.current) {
      setPreviousPlaysCount(playsCount)
    }
    wasPlayingRef.current = isPlaying

    // Increment stats.plays whenever AudioContext playsCount increases
    if (playsCount > previousPlaysCount) {
      setStats((prev) => ({
        ...prev,
        plays: prev.plays + (playsCount - previousPlaysCount),
      }))
      setPreviousPlaysCount(playsCount)
    }
  }, [trackId, currentTrack, isPlaying, playsCount, previousPlaysCount])

  const handlePlay = useCallback(() => {
    if (!track) return

    if (currentTrack?.id === track.id && isPlaying) {
      pauseTrack()
    } else {
      playTrack(
        {
          id: track.id,
          title: track.title,
          subtitle: track.username || 'Deleted User',
          imageUrl: track.trackImagePath ? resolveImage(track.trackImagePath) : undefined,
          userId: track.userId,
          duration: track.duration,
        },
        getTrackStreamUrl(track.id)
      )
    }
  }, [track, currentTrack, isPlaying, pauseTrack, playTrack, resolveImage])

  const handleLike = useCallback(async () => {
    if (!trackId) return

    const token = localStorage.getItem('authToken')
    if (!token) {
      alert('You need to log in to like tracks')
      return
    }

    const previousLiked = liked

    try {
      if (liked) {
        await unlikeTrack(trackId, token)
        toggleLike(trackId, false)
      } else {
        await likeTrack(trackId, token)
        toggleLike(trackId, true, {
          id: track.id,
          title: track.title,
          subtitle: track.username || 'Deleted User',
          imageUrl: track.trackImagePath ? resolveImage(track.trackImagePath) : undefined,
          duration: track.duration,
          userId: track.userId,
        })
      }
    } catch (error) {
      console.error('Failed to toggle like:', error)
      toggleLike(trackId, previousLiked)
      alert('Failed to like track')
    }
  }, [trackId, liked, track, toggleLike, resolveImage])

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <div className="track-page">
          <div className="track-page-left">
            <div className="track-page-image-skeleton"></div>
            <div className="track-page-title-skeleton"></div>
            <div className="track-page-artist-skeleton"></div>
          </div>
          <div className="track-page-right">
            <div className="track-page-waveform-skeleton">
              <div className="track-page-waveform-time-skeleton"></div>
              <div className="track-page-waveform-bars-skeleton"></div>
              <div className="track-page-waveform-time-skeleton"></div>
            </div>
            <div className="track-page-stats-skeleton">
              <div className="track-page-stat-skeleton"></div>
              <div className="track-page-stat-skeleton"></div>
              <div className="track-page-stat-skeleton"></div>
            </div>
          </div>
        </div>
        <Footer isAuthenticated={isAuthenticated} />
      </div>
    )
  }

  if (error || !track) {
    return (
      <div className="page">
        <Navbar />
        <div className="profile-container">
          <p>{error || 'Track not found'}</p>
        </div>
        <Footer isAuthenticated={isAuthenticated} />
      </div>
    )
  }

  return (
    <div className="page">
      <Navbar />
      <div className="track-page">
        <div className="track-page-left">
          {track.trackImagePath ? (
            <img className="track-page-image" src={resolveImage(track.trackImagePath)} alt={track.title} />
          ) : (
            <div className="track-page-image placeholder">{track.title.slice(0, 1).toUpperCase()}</div>
          )}
          <h1 className="track-page-title">
            {track.title}
            {track.isPrivate && (
              <svg viewBox="0 0 24 24" className="lock-icon" aria-hidden="true" style={{ width: 32, height: 32, marginLeft: 12, opacity: 0.7, verticalAlign: 'middle', marginTop: '-8px' }}>
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor" />
              </svg>
            )}
          </h1>
          <button
            type="button"
            className="track-page-artist"
            onClick={() => navigate(`/profile/${track.userId}`)}
          >
            {track.username || 'Deleted User'}
          </button>
        </div>

        <div className="track-page-right">
          <div className="track-page-waveform">
            <div className="track-page-waveform-time-start">{formatTime(currentTrack?.id === track.id ? progress : 0)}</div>
            <div className="track-page-waveform-fallback">
              <Waveform
                waveformBars={waveformBars}
                progressPercent={currentTrack?.id === track.id && duration > 0 ? (progress / duration) * 100 : 0}
                onSeek={(percent) => {
                  if (!track) return
                  if (currentTrack?.id === track.id) {
                    const newTime = percent * duration
                    seek(newTime)
                  } else {
                    setPendingSeekPercent(percent)
                    playTrack(
                      {
                        id: track.id,
                        title: track.title,
                        subtitle: track.username || 'Deleted User',
                        imageUrl: track.trackImagePath ? resolveImage(track.trackImagePath) : undefined,
                        userId: track.userId,
                        duration: track.duration,
                      },
                      getTrackStreamUrl(track.id)
                    )
                  }
                }}
              />
              <div className="track-page-waveform-time-end">{formatTime(currentTrack?.id === track.id ? duration : track.duration)}</div>
            </div>

            {/* Track stats */}
            <div className="track-page-stats">
              <div className="track-page-stat-item">
                <svg viewBox="0 0 24 24" className="track-page-stat-icon" aria-hidden="true">
                  <path d="M8 5v14l11-7z" fill="currentColor" />
                </svg>
                <span className="track-page-stat-value">{stats.plays}</span>
                <span className="track-page-stat-label">plays</span>
              </div>
              <div className="track-page-stat-item">
                <svg viewBox="0 0 24 24" className="track-page-stat-icon" aria-hidden="true">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor" />
                </svg>
                <span className="track-page-stat-value">{stats.likes}</span>
                <span className="track-page-stat-label">likes</span>
              </div>
              <div className="track-page-stat-item">
                <svg viewBox="0 0 24 24" className="track-page-stat-icon" aria-hidden="true">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill="currentColor" />
                </svg>
                <span className="track-page-stat-value">{stats.comments}</span>
                <span className="track-page-stat-label">comments</span>
              </div>
            </div>
          </div>

          {/* Comment input bar */}
          {isAuthenticated && (
            <div className="track-page-comment-input-bar">
              <input
                type="text"
                className="track-page-comment-input-field"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newComment.trim()) {
                    handlePostComment()
                  }
                }}
              />
              <button
                type="button"
                className="track-page-comment-input-btn"
                onClick={handlePostComment}
                disabled={!newComment.trim()}
              >
                <svg viewBox="0 0 24 24" className="track-page-comment-input-icon" aria-hidden="true">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          )}

          <div className="track-page-actions">
            <button
              type="button"
              className="track-page-action-btn"
              onClick={handlePlay}
              aria-label={isPlaying && currentTrack?.id === track.id ? 'Pause' : 'Play'}
            >
              <svg viewBox="0 0 24 24" className="track-page-action-icon" aria-hidden="true">
                {isPlaying && currentTrack?.id === track.id ? (
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                ) : (
                  <path d="M8 5v14l12-7L8 5z" />
                )}
              </svg>
              <span className="track-page-action-text">{isPlaying && currentTrack?.id === track.id ? 'Pause' : 'Play'}</span>
            </button>
            <button
              type="button"
              className="track-page-action-btn"
              onClick={handleLike}
              aria-label={liked ? 'Unlike' : 'Like'}
            >
              <svg viewBox="0 0 24 24" className={`track-page-action-icon ${liked ? 'liked' : ''}`} aria-hidden="true">
                <path d={liked ? "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" : "M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"} />
              </svg>
              <span className="track-page-action-text">{liked ? 'Liked' : 'Like'}</span>
            </button>
            <button
              type="button"
              className="track-page-action-btn"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: track.title,
                    text: `Check out ${track.title} by ${track.username}`,
                    url: window.location.href,
                  })
                } else {
                  navigator.clipboard.writeText(window.location.href)
                  alert('Link copied to clipboard')
                }
              }}
              aria-label="Share"
            >
              <svg viewBox="0 0 24 24" className="track-page-action-icon" aria-hidden="true">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
              </svg>
              <span className="track-page-action-text">Share</span>
            </button>
            <button
              type="button"
              className="track-page-action-btn"
              onClick={() => alert('Add to playlist feature coming soon')}
              aria-label="Add to playlist"
            >
              <svg viewBox="0 0 24 24" className="track-page-action-icon" aria-hidden="true">
                <path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z" />
              </svg>
              <span className="track-page-action-text">Add to playlist</span>
            </button>
          </div>

          <div className="track-page-divider"></div>

          <div className="track-page-comments">
            <h2 className="track-page-comments-title">Comments</h2>

            {/* Comments list */}
            {comments.length === 0 ? (
              <p className="track-page-comments-empty">No comments yet. Be the first to comment!</p>
            ) : (
              <div className="track-page-comments-list">
                {comments.map((comment) => (
                  <div key={comment.id} className="track-page-comment">
                    <div className="track-page-comment-header">
                      <button
                        type="button"
                        className="track-page-comment-username"
                        onClick={() => navigate(`/profile/${comment.user.id}`)}
                      >
                        {comment.user.username}
                      </button>
                      <span className="track-page-comment-date">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                      {isAuthenticated && currentUserId === comment.user.id && comment.content !== "Deleted comment" && (
                        <button
                          type="button"
                          className="track-page-comment-delete-btn"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="track-page-comment-content">{comment.content}</p>
                    {isAuthenticated && (
                      <button
                        type="button"
                        className="track-page-comment-reply-btn"
                        onClick={() => setReplyTo(comment.id)}
                      >
                        Reply
                      </button>
                    )}

                    {/* Reply form */}
                    {replyTo === comment.id && (
                      <div className="track-page-reply-form">
                        <textarea
                          className="track-page-reply-input"
                          placeholder="Write a reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          rows={2}
                        />
                        <div className="track-page-reply-actions">
                          <button
                            type="button"
                            className="track-page-reply-cancel"
                            onClick={() => {
                              setReplyTo(null)
                              setReplyContent('')
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="track-page-reply-submit"
                            onClick={() => handlePostReply(comment.id)}
                            disabled={!replyContent.trim()}
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="track-page-replies">
                        {comment.replies.map((reply: any) => (
                          <div key={reply.id} className="track-page-reply">
                            <div className="track-page-comment-header">
                              <button
                                type="button"
                                className="track-page-comment-username"
                                onClick={() => navigate(`/profile/${reply.user.id}`)}
                              >
                                {reply.user.username}
                              </button>
                              <span className="track-page-comment-date">
                                {new Date(reply.createdAt).toLocaleDateString()}
                              </span>
                              {isAuthenticated && currentUserId === reply.user.id && (
                                <button
                                  type="button"
                                  className="track-page-comment-delete-btn"
                                  onClick={() => handleDeleteComment(reply.id)}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                            <p className="track-page-comment-content">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer isAuthenticated={isAuthenticated} />
    </div>
  )
}
