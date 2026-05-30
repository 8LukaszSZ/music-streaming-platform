import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { ImageCropper } from '../components/ImageCropper'
import { uploadTrack } from '../api/audioApi'
import { getMe } from '../api/profileApi'
import { useAuth } from '../hooks/useAuth'
import { getToken } from '../utils/auth'

export function UploadPage() {
  const navigate = useNavigate()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [tempImageFile, setTempImageFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [duration, setDuration] = useState<number>(0)
  const [isPublic, setIsPublic] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [valence, setValence] = useState('')
  const [energy, setEnergy] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  const isAuthenticated = useAuth()

  useEffect(() => {
    const token = getToken()
    if (!token) return

    getMe(token)
      .then((user) => setArtist(user.username))
      .catch((err) => console.error('Failed to load current user:', err))
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setTempImageFile(file)
      setShowCropper(true)
    }
  }

  const handleCroppedImage = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' })
    setImageFile(croppedFile)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(croppedBlob)
    setShowCropper(false)
    setTempImageFile(null)
  }

  const handleCancelCrop = () => {
    setShowCropper(false)
    setTempImageFile(null)
  }

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAudioFile(file)
      const audio = new Audio(URL.createObjectURL(file))
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration)
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!audioFile || !title || !artist || isUploading) return

    const token = localStorage.getItem('authToken') || undefined
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const result = await uploadTrack(
        audioFile,
        imageFile,
        title,
        duration,
        isPublic,
        valence || undefined,
        energy || undefined,
        token,
        setUploadProgress
      )
      setUploadProgress(100)
      navigate(`/track/${result.id}`)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload track')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="upload-page">
      <Navbar />
      <div className="upload-page-container">
        <h1 className="upload-page-title">Upload Track</h1>
        
        <form className="upload-page-form" onSubmit={handleSubmit}>
          <div className="upload-page-left">
            <div className="upload-page-image-section">
              <div 
                className="upload-page-image-upload"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Cover preview" className="upload-page-image-preview" />
                ) : (
                  <div className="upload-page-image-placeholder">
                    <svg viewBox="0 0 24 24" className="upload-page-image-icon">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="currentColor" />
                    </svg>
                    <span>Click to upload image</span>
                    <span className="upload-page-image-hint">Square image recommended</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="upload-page-hidden-input"
              />
            </div>
          </div>

          <div className="upload-page-right">
            <label className="field">
              <span>Audio File</span>
              <button
                type="button"
                className="upload-page-audio-button"
                onClick={() => audioInputRef.current?.click()}
              >
                {audioFile ? audioFile.name : 'Choose audio file'}
              </button>
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                onChange={handleAudioChange}
                className="upload-page-hidden-input"
              />
            </label>

            <label className="field">
              <span>Title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter track title"
                required
              />
            </label>

            <label className="field">
              <span>Artist</span>
              <input
                type="text"
                value={artist}
                placeholder="Artist name"
                readOnly
                required
                style={{ cursor: 'not-allowed', opacity: 0.7 }}
              />
            </label>

            <label className="field">
              <span>Duration</span>
              <input
                type="text"
                value={duration > 0 ? `${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}` : ''}
                placeholder="Auto-filled from audio"
                readOnly
                style={{ cursor: 'not-allowed', opacity: 0.5 }}
              />
            </label>

            <label className="field">
              <span>Visibility</span>
              <div className="upload-page-toggle">
                <button
                  type="button"
                  className={`upload-page-toggle-button ${isPublic ? 'upload-page-toggle-active' : ''}`}
                  onClick={() => setIsPublic(true)}
                >
                  Public
                </button>
                <button
                  type="button"
                  className={`upload-page-toggle-button ${!isPublic ? 'upload-page-toggle-active' : ''}`}
                  onClick={() => setIsPublic(false)}
                >
                  Private
                </button>
              </div>
            </label>

            <div className="upload-page-advanced-section">
              <button
                type="button"
                className="upload-page-advanced-toggle"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? '▼' : '▶'} Advanced Options
              </button>
              
              {showAdvanced && (
                <div className="upload-page-advanced-options">
                  <label className="field">
                    <span>Valence (mood)</span>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={valence}
                      onChange={(e) => setValence(e.target.value)}
                      placeholder="0.0 - 1.0 (optional)"
                    />
                  </label>

                  <label className="field">
                    <span>Energy</span>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={energy}
                      onChange={(e) => setEnergy(e.target.value)}
                      placeholder="0.0 - 1.0 (optional)"
                    />
                  </label>
                </div>
              )}
            </div>

            {isUploading && (
              <div className="upload-page-progress" role="status" aria-live="polite">
                <div className="upload-page-progress-header">
                  <span>Uploading track…</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="upload-page-progress-track">
                  <div
                    className="upload-page-progress-bar"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="upload-page-progress-hint">
                  Please wait - large files may take a few minutes.
                </p>
              </div>
            )}

            <div className="upload-page-actions">
              <button
                type="button"
                className="auth-button"
                onClick={() => navigate(-1)}
                disabled={isUploading}
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-h)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="auth-button"
                disabled={!audioFile || !title || !artist || isUploading}
              >
                {isUploading ? 'Uploading…' : 'Upload Track'}
              </button>
            </div>
          </div>
        </form>
      </div>
      <Footer isAuthenticated={isAuthenticated} />
      
      {showCropper && tempImageFile && (
        <ImageCropper
          imageFile={tempImageFile}
          onCroppedImage={handleCroppedImage}
          onCancel={handleCancelCrop}
        />
      )}
    </div>
  )
}
