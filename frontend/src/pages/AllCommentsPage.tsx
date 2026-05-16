import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { getLatestCommentsForUser } from '../api/audioApi'
import { getToken } from '../utils/auth'

export function AllCommentsPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!userId) return
      setLoading(true)
      setError('')

      try {
        const token = getToken() || undefined
        const commentsData = await getLatestCommentsForUser(userId, 100, token)
        setComments(commentsData)
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Failed to load comments.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [userId])

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <div className="profile-container">
          <p>Loading...</p>
        </div>
        <Footer isAuthenticated={Boolean(localStorage.getItem('authToken'))} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <Navbar />
        <div className="profile-container">
          <p>{error}</p>
        </div>
        <Footer isAuthenticated={Boolean(localStorage.getItem('authToken'))} />
      </div>
    )
  }

  return (
    <div className="page">
      <Navbar />
      <div className="upload-page-container">
        <h1 className="upload-page-title">All comments</h1>
        {comments.length === 0 ? (
          <p className="track-meta">No comments on tracks yet.</p>
        ) : (
          <div className="profile-comments">
            {comments.map((c) => (
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
            ))}
          </div>
        )}
      </div>
      <Footer isAuthenticated={Boolean(localStorage.getItem('authToken'))} />
    </div>
  )
}
