import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { ImageCropper } from '../components/ImageCropper'
import { createPlaylist } from '../api/profileApi'

export function CreatePlaylistPage() {
  const navigate = useNavigate()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [tempImageFile, setTempImageFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isAuthenticated = useMemo(() => Boolean(localStorage.getItem('authToken')), [])

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
    reader.readAsDataURL(croppedFile)
    setShowCropper(false)
    setTempImageFile(null)
  }

  const handleCancelCrop = () => {
    setShowCropper(false)
    setTempImageFile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    try {
      const token = localStorage.getItem('authToken') || undefined
      const result = await createPlaylist(
        token,
        {
          name,
          description: description || undefined,
          isPublic,
          playlistImage: imageFile || undefined,
        }
      )
      console.log('Playlist created:', result)
      navigate(`/playlist/${result.id}`)
    } catch (error) {
      console.error('Failed to create playlist:', error)
      alert('Failed to create playlist')
    }
  }

  return (
    <div className="upload-page">
      <Navbar />
      <div className="upload-page-container">
        <h1 className="upload-page-title">Create Playlist</h1>
        
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
              <span>Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter playlist name"
                required
              />
            </label>

            <label className="field">
              <span>Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter playlist description (optional)"
                rows={3}
                style={{
                  width: '100%',
                  background: 'rgba(9, 11, 18, 0.92)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  color: 'var(--text-h)',
                  fontSize: '14px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
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

            <div className="upload-page-actions">
              <button
                type="button"
                className="auth-button"
                onClick={() => navigate(-1)}
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-h)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="auth-button"
                disabled={!name}
              >
                Create Playlist
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
