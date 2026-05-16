import { useState } from 'react'
import type { ShareModalProps } from '../types/component'

export function ShareModal({ content, contentType, onShare, onCancel }: ShareModalProps) {
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onShare(message || undefined)
      setMessage('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="share-modal-overlay">
      <div className="share-modal">
        <h3 className="share-modal-title">Share {contentType === 'TRACK' ? 'Track' : 'Playlist'}</h3>

        <div className="share-modal-preview">
          {content.imageUrl && (
            <img
              src={content.imageUrl}
              alt={content.title}
              className="share-modal-image"
            />
          )}
          <div className="share-modal-info">
            <p className="share-modal-content-title">{content.title}</p>
            {content.subtitle && (
              <p className="share-modal-content-subtitle">{content.subtitle}</p>
            )}
          </div>
        </div>

        <div className="share-modal-message">
          <label htmlFor="share-message">Add a comment (optional)</label>
          <textarea
            id="share-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What do you think about this?"
            maxLength={1000}
            rows={3}
            className="share-modal-textarea"
          />
          <p className="share-modal-char-count">{message.length}/1000</p>
        </div>

        <div className="share-modal-actions">
          <button
            type="button"
            className="share-modal-cancel"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="share-modal-confirm"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  )
}
