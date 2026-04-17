import { Link } from 'react-router-dom'
import type { FooterProps } from '../types/component'

export function Footer({ isAuthenticated }: FooterProps) {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand">
          <p>WaveStream</p>
          <span>Stream, discover, and publish your sound.</span>
        </div>
        <div className="footer-columns">
          <div>
            <h4>Platform</h4>
            <nav>
              <Link to="/">Home</Link>
              <Link to="/stream">Stream</Link>
              {!isAuthenticated ? <Link to="/register">Create account</Link> : null}
            </nav>
          </div>
          <div>
            <h4>Company</h4>
            <nav>
              <a href="#">About</a>
              <a href="#">Careers</a>
              <a href="#">Contact</a>
            </nav>
          </div>
          <div>
            <h4>Legal</h4>
            <nav>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Cookies</a>
            </nav>
          </div>
        </div>
      </div>
      <p className="footer-bottom">Thanks for listening with WaveStream.</p>
    </footer>
  )
}
