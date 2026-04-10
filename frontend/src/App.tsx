import './styles/auth.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/footer.css'
import './styles/profile.css'
import './styles/audioPlayer.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'
import { StreamPage } from './pages/StreamPage'
import { AudioProvider } from './contexts/AudioContext'
import { AudioPlayer } from './components/AudioPlayer'

function App() {
  return (
    <AudioProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/discover" element={<Navigate to="/" replace />} />
        <Route path="/stream" element={<StreamPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
      <AudioPlayer />
    </AudioProvider>
  )
}

export default App
