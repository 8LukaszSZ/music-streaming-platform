import './styles/auth.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/footer.css'
import './styles/profile.css'
import './styles/audioPlayer.css'
import './styles/trackPage.css'
import './styles/uploadPage.css'
import './styles/imageCropper.css'
import './styles/playlistPage.css'
import './styles/chatPage.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'
import { StreamPage } from './pages/StreamPage'
import { TrackPage } from './pages/TrackPage'
import { UploadPage } from './pages/UploadPage'
import { EditTrackPage } from './pages/EditTrackPage'
import { PlaylistPage } from './pages/PlaylistPage'
import { CreatePlaylistPage } from './pages/CreatePlaylistPage'
import { EditPlaylistPage } from './pages/EditPlaylistPage'
import { AllCommentsPage } from './pages/AllCommentsPage'
import { AllLikedTracksPage } from './pages/AllLikedTracksPage'
import { AllFansAlsoLikePage } from './pages/AllFansAlsoLikePage'
import { ChatPage } from './pages/ChatPage'
import { AudioProvider } from './contexts/AudioContext'
import { AudioPlayer } from './components/AudioPlayer'
import { PageTransition } from './routes/PageTransition'

function App() {
  return (
    <AudioProvider>
      <PageTransition>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/discover" element={<Navigate to="/" replace />} />
          <Route path="/stream" element={<StreamPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/track/:trackId" element={<TrackPage />} />
          <Route path="/track/:trackId/edit" element={<EditTrackPage />} />
          <Route path="/playlist/:playlistId" element={<PlaylistPage />} />
          <Route path="/playlist/:playlistId/edit" element={<EditPlaylistPage />} />
          <Route path="/playlist/create" element={<CreatePlaylistPage />} />
          <Route path="/profile/:userId/comments" element={<AllCommentsPage />} />
          <Route path="/profile/:userId/liked" element={<AllLikedTracksPage />} />
          <Route path="/profile/:userId/fans-also-like" element={<AllFansAlsoLikePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:userId" element={<ChatPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </PageTransition>
      <AudioPlayer />
    </AudioProvider>
  )
}

export default App
