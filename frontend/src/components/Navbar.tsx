import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'

export function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(localStorage.getItem('authToken')))

  useEffect(() => {
    setIsAuthenticated(Boolean(localStorage.getItem('authToken')))
  }, [location.pathname])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    setIsAuthenticated(false)
    navigate('/')
  }

  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <div className="nav-left">
          <Link to="/" className="brand">
            WaveStream
          </Link>
          <nav className="nav-links">
            <NavLink to="/" end>
              Discover
            </NavLink>
            <NavLink to="/stream">Stream</NavLink>
          </nav>
        </div>

        <div className="nav-center">
          <input className="search-input" type="search" placeholder="Search tracks, artists, playlists..." />
        </div>

        <div className="nav-right">
          <button type="button" className="ghost-btn">
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
