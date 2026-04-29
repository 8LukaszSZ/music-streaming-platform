import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchPlaylists, searchUsers } from '../api/profileApi'
import { searchTracks } from '../api/audioApi'
import { getApiOrigin } from '../api/httpClient'
import '../styles/searchResults.css'

type SearchResult = {
  users: any[]
  playlists: any[]
  tracks: any[]
}

type SearchResultsProps = {
  query: string
  onClose: () => void
}

export function SearchResults({ query, onClose }: SearchResultsProps) {
  const navigate = useNavigate()
  const [results, setResults] = useState<SearchResult>({ users: [], playlists: [], tracks: [] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setResults({ users: [], playlists: [], tracks: [] })
      return
    }

    const fetchResults = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('authToken') || undefined
        const [users, playlists, tracks] = await Promise.all([
          searchUsers(query, token).catch(() => []),
          searchPlaylists(query, token).catch(() => []),
          searchTracks(query, token).catch(() => []),
        ])
        setResults({ users, playlists, tracks })
      } catch (error) {
        console.error('Search failed:', error)
        setResults({ users: [], playlists: [], tracks: [] })
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(fetchResults, 300)
    return () => clearTimeout(debounceTimer)
  }, [query])

  const resolveImage = (path?: string) => {
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return `${getApiOrigin()}/${path}`
  }

  const handleUserClick = (userId: string) => {
    onClose()
    navigate(`/profile/${userId}`)
  }

  const handlePlaylistClick = (playlistId: string) => {
    onClose()
    navigate(`/playlist/${playlistId}`)
  }

  const handleTrackClick = (trackId: string) => {
    onClose()
    navigate(`/track/${trackId}`)
  }

  return (
    <div className="search-results">
      {loading && <p className="search-results-loading">Loading...</p>}
      {!loading && query.trim() && (
        <>
          {results.users.length > 0 && (
            <div className="search-results-section">
              <h3 className="search-results-section-title">Users</h3>
              <div className="search-results-list">
                {results.users.map((user) => (
                  <div
                    key={user.id}
                    className="search-results-item"
                    onClick={() => handleUserClick(user.id)}
                  >
                    {user.profileImagePath ? (
                      <img
                        className="search-results-item-image user-avatar"
                        src={resolveImage(user.profileImagePath)}
                        alt={user.username}
                      />
                    ) : (
                      <div className="search-results-item-image placeholder user-avatar">
                        {user.username.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span className="search-results-item-name">{user.username}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {results.playlists.length > 0 && (
            <div className="search-results-section">
              <h3 className="search-results-section-title">Playlists</h3>
              <div className="search-results-list">
                {results.playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className="search-results-item"
                    onClick={() => handlePlaylistClick(playlist.id)}
                  >
                    {playlist.playlistImagePath ? (
                      <img
                        className="search-results-item-image"
                        src={resolveImage(playlist.playlistImagePath)}
                        alt={playlist.name}
                      />
                    ) : (
                      <div className="search-results-item-image placeholder">
                        {playlist.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span className="search-results-item-name">{playlist.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {results.tracks.length > 0 && (
            <div className="search-results-section">
              <h3 className="search-results-section-title">Tracks</h3>
              <div className="search-results-list">
                {results.tracks.map((track) => (
                  <div
                    key={track.id}
                    className="search-results-item"
                    onClick={() => handleTrackClick(track.id)}
                  >
                    {track.trackImagePath ? (
                      <img
                        className="search-results-item-image"
                        src={resolveImage(track.trackImagePath)}
                        alt={track.title}
                      />
                    ) : (
                      <div className="search-results-item-image placeholder">
                        {track.title.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="search-results-item-info">
                      <span className="search-results-item-name">{track.title}</span>
                      <span className="search-results-item-subtitle">{track.username || 'Unknown'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!loading && results.users.length === 0 && results.playlists.length === 0 && results.tracks.length === 0 && (
            <p className="search-results-empty">No results found</p>
          )}
        </>
      )}
    </div>
  )
}
