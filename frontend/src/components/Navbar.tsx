import { useEffect, useState, useRef } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { SearchResults } from './SearchResults'

export function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(localStorage.getItem('authToken')))
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIsAuthenticated(Boolean(localStorage.getItem('authToken')))
  }, [location.pathname])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    setIsAuthenticated(false)
    navigate('/')
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setShowSearchResults(true)
  }

  const handleSearchBlur = () => {
    setTimeout(() => setShowSearchResults(false), 200)
  }

  const handleSearchFocus = () => {
    if (searchQuery.trim()) {
      setShowSearchResults(true)
    }
  }

  const closeSearchResults = () => {
    setShowSearchResults(false)
    setSearchQuery('')
  }

  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <div className="nav-left">
          <Link to="/" className="brand">
            WaveStream
          </Link>
          <nav className="nav-links">
            <NavLink to="/trending">
              Discover
            </NavLink>
          </nav>
        </div>

        <div className="nav-center" style={{ position: 'relative' }}>
          <input
            ref={searchInputRef}
            className="search-input"
            type="search"
            placeholder="Search tracks, artists, playlists..."
            value={searchQuery}
            onChange={handleSearchChange}
            onBlur={handleSearchBlur}
            onFocus={handleSearchFocus}
          />
          {showSearchResults && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000 }}>
              <SearchResults query={searchQuery} onClose={closeSearchResults} />
            </div>
          )}
        </div>

        <div className="nav-right">
          <button
            type="button"
            className="ghost-btn"
            onClick={() => navigate(isAuthenticated ? '/upload' : '/login')}
          >
            Upload
          </button>
          {isAuthenticated ? (
            <>
              <Link className="ghost-btn" to="/profile">
                My profile
              </Link>
              <button type="button" className="solid-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="ghost-btn" to="/login">
                Login
              </Link>
              <Link className="solid-btn" to="/register">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
