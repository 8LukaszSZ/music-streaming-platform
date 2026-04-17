import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { ImageCropper } from '../components/ImageCropper'
import { getTrackById } from '../api/audioApi'
import { getApiOrigin } from '../api/httpClient'

export function EditTrackPage() {
  const navigate = useNavigate()
  const { trackId } = useParams<{ trackId: string }>()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [tempImageFile, setTempImageFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [valence, setValence] = useState('')
  const [energy, setEnergy] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isAuthenticated = useMemo(() => Boolean(localStorage.getItem('authToken')), [])

  const resolveImage = (path: string | undefined) => {
    if (!path) return undefined
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path
    }
    return `${getApiOrigin()}/${path.replace(/^\//, '')}`
  }

  useEffect(() => {
    const loadTrack = async () => {
      if (!trackId) return

      try {
        const token = localStorage.getItem('authToken') || undefined
        const data = await getTrackById(trackId, token) as any
        setTitle(data.title)
        setIsPublic(!data.isPrivate)
        setValence(data.valence?.toString() || '')
        setEnergy(data.energy?.toString() || '')
        if (data.trackImagePath) {
          setImagePreview(resolveImage(data.trackImagePath))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load track')
      } finally {
        setLoading(false)
      }
    }

    loadTrack()
  }, [trackId])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackId || !title) return

    try {
      const token = localStorage.getItem('authToken') || undefined
      const formData = new FormData()
      formData.append('Title', title)
      formData.append('IsPrivate', (!isPublic).toString())
      if (valence) {
        formData.append('Valence', valence)
      }
      if (energy) {
        formData.append('Energy', energy)
      }
      if (imageFile) {
        formData.append('TrackImage', imageFile)
      }

      const response = await fetch(`${getApiOrigin()}/api/localtracks/${trackId}`, {
        method: 'PUT',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to update track')
      }

      const result = await response.json()
      console.log('Update successful:', result)
      navigate(`/track/${trackId}`)
    } catch (error) {
      console.error('Update failed:', error)
      alert('Failed to update track')
    }
  }

  if (loading) {
    return (
      <div className="upload-page">
        <Navbar />
        <div className="upload-page-container">
          <p>Loading...</p>
        </div>
        <Footer isAuthenticated={isAuthenticated} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="upload-page">
        <Navbar />
        <div className="upload-page-container">
          <p>{error}</p>
        </div>
        <Footer isAuthenticated={isAuthenticated} />
      </div>
    )
  }

  return (
    <div className="upload-page">
      <Navbar />
      <div className="upload-page-container">
        <h1 className="upload-page-title">Edit Track</h1>
        
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
                disabled={!title}
              >
                Save Changes
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
