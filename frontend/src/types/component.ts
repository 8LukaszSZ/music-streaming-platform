export type ProfileMediaTileProps = {
  title: string
  subtitle?: string
  imageUrl?: string
  trailingText?: string
  trackId?: string
  playlistId?: string
  canPlay?: boolean
  isLiked?: boolean
  onLikeToggle?: (trackId: string, isLiked: boolean) => void
  userId?: string
  isPrivate?: boolean
  isCreator?: boolean
  isTrackAuthor?: boolean
  onDelete?: (trackId: string) => void
  onEdit?: (trackId: string) => void
  onPlay?: (trackId: string) => void
  onDeletePlaylist?: (playlistId: string) => void
  onEditPlaylist?: (playlistId: string) => void
  onRemoveFromPlaylist?: (trackId: string) => void
  trackNumber?: number
  isPlaylistTile?: boolean
}

export type WaveformProps = {
  waveformBars: number[]
  progressPercent: number
  onSeek: (percent: number) => void
}

export type ImageCropperProps = {
  imageFile: File
  onCroppedImage: (croppedBlob: Blob) => void
  onCancel: () => void
}

export type FooterProps = {
  isAuthenticated: boolean
}
