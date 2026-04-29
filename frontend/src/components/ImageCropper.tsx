import { useState, useRef, useEffect } from 'react'
import type { ImageCropperProps } from '../types/component'

export function ImageCropper({ imageFile, onCroppedImage, onCancel }: ImageCropperProps) {
  const [imageSrc, setImageSrc] = useState<string>('')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [minZoom, setMinZoom] = useState(1)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader()
      reader.onload = () => {
        setImageSrc(reader.result as string)
      }
      reader.readAsDataURL(imageFile)
    }
  }, [imageFile])

  useEffect(() => {
    if (imageSrc && canvasRef.current && imageRef.current) {
      const img = imageRef.current
      setImageSize({ width: img.width, height: img.height })
      
      const maxSize = Math.max(img.width, img.height)
      if (img.width > img.height) {
        setMinZoom(maxSize / img.height)
      } else if (img.height > img.width) {
        setMinZoom(maxSize / img.width)
      } else {
        setMinZoom(1)
      }
      
      setZoom(prev => Math.max(prev, maxSize / (img.width > img.height ? img.height : img.width)))
    }
  }, [imageSrc])

  useEffect(() => {
    if (imageSrc && canvasRef.current && imageRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const img = imageRef.current

      if (ctx && img) {
        canvas.width = 400
        canvas.height = 400

        ctx.fillStyle = '#0f0f0f'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const maxSize = Math.max(img.width, img.height)
        const scale = (400 / maxSize) * zoom
        
        const scaledWidth = img.width * scale
        const scaledHeight = img.height * scale
        
        const x = (canvas.width - scaledWidth) / 2 + crop.x
        const y = (canvas.height - scaledHeight) / 2 + crop.y

        ctx.drawImage(img, x, y, scaledWidth, scaledHeight)

        ctx.strokeStyle = '#9e77ff'
        ctx.lineWidth = 2
        ctx.setLineDash([8, 4])
        ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4)
        ctx.setLineDash([])
      }
    }
  }, [imageSrc, crop, zoom, imageSize])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const startX = e.clientX - crop.x
    const startY = e.clientY - crop.y

    const handleMouseMove = (e: MouseEvent) => {
      const img = imageRef.current
      if (!img) return

      const maxSize = Math.max(img.width, img.height)
      const scale = (400 / maxSize) * zoom
      const scaledWidth = img.width * scale
      const scaledHeight = img.height * scale

      const maxCropX = (scaledWidth - 400) / 2
      const maxCropY = (scaledHeight - 400) / 2

      let newX = e.clientX - startX
      let newY = e.clientY - startY

      newX = Math.max(-maxCropX, Math.min(maxCropX, newX))
      newY = Math.max(-maxCropY, Math.min(maxCropY, newY))

      setCrop({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleCrop = () => {
    if (canvasRef.current && imageRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const img = imageRef.current

      if (ctx && img) {
        ctx.fillStyle = '#0f0f0f'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const maxSize = Math.max(img.width, img.height)
        const scale = (400 / maxSize) * zoom
        
        const scaledWidth = img.width * scale
        const scaledHeight = img.height * scale
        
        const x = (canvas.width - scaledWidth) / 2 + crop.x
        const y = (canvas.height - scaledHeight) / 2 + crop.y

        ctx.drawImage(img, x, y, scaledWidth, scaledHeight)
      }

      canvas.toBlob((blob) => {
        if (blob) {
          onCroppedImage(blob)
        }
      }, 'image/jpeg', 0.9)
    }
  }

  const handleZoomChange = (newZoom: number) => {
    const img = imageRef.current
    if (!img) {
      setZoom(newZoom)
      return
    }

    const maxSize = Math.max(img.width, img.height)
    const scale = (400 / maxSize) * newZoom
    const scaledWidth = img.width * scale
    const scaledHeight = img.height * scale

    const maxCropX = (scaledWidth - 400) / 2
    const maxCropY = (scaledHeight - 400) / 2

    setCrop(prev => ({
      x: Math.max(-maxCropX, Math.min(maxCropX, prev.x)),
      y: Math.max(-maxCropY, Math.min(maxCropY, prev.y)),
    }))
    setZoom(newZoom)
  }

  if (!imageSrc) return null

  return (
    <div className="image-cropper-overlay">
      <div className="image-cropper-modal">
        <h3 className="image-cropper-title">Crop Image to Square</h3>
        
        <div className="image-cropper-preview">
          <canvas
            ref={canvasRef}
            className="image-cropper-canvas"
            onMouseDown={handleMouseDown}
          />
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Original"
            className="image-cropper-original"
            style={{ display: 'none' }}
          />
        </div>

        <div className="image-cropper-controls">
          <div className="image-cropper-zoom">
            <label>Zoom</label>
            <input
              type="range"
              min={minZoom}
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="image-cropper-zoom-slider"
            />
          </div>
        </div>

        <div className="image-cropper-actions">
          <button type="button" className="image-cropper-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="image-cropper-confirm" onClick={handleCrop}>
            Crop & Use
          </button>
        </div>
      </div>
    </div>
  )
}
