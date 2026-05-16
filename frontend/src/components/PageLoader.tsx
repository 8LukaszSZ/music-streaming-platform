import { Navbar } from './Navbar'
import { Footer } from './Footer'

interface PageLoaderProps {
  isAuthenticated: boolean
}

export function PageLoader({ isAuthenticated }: PageLoaderProps) {
  return (
    <div className="page">
      <Navbar />
      <div className="upload-page-container">
        <p>Loading...</p>
      </div>
      <Footer isAuthenticated={isAuthenticated} />
    </div>
  )
}
