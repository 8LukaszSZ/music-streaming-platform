export type TrackInfo = {
  id: string
  title: string
  subtitle: string
  imageUrl?: string
  userId?: string
  duration?: number
}

export type AudioContextType = {
  currentTrack: TrackInfo | null
  isPlaying: boolean
  progress: number
  duration: number
  volume: number
  trackList: TrackInfo[]
  likedTracks: TrackInfo[]
  playsCount: number
  playTrack: (track: TrackInfo, streamUrl: string) => void
  pauseTrack: () => void
  resumeTrack: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  nextTrack: () => void
  prevTrack: () => void
  setTrackList: (tracks: TrackInfo[]) => void
  setLikedTracks: (tracks: TrackInfo[]) => void
  toggleLike: (trackId: string, isLiked: boolean, track?: TrackInfo) => void
  incrementPlaysCount: () => void
}
