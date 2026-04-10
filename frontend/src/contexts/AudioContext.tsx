import { createContext, useContext, useState, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import { getTrackStreamUrl } from '../api/audioApi'

type TrackInfo = {
  id: string
  title: string
  subtitle?: string
  imageUrl?: string
  duration?: number
}

type AudioContextType = {
  currentTrack: TrackInfo | null
  isPlaying: boolean
  progress: number
  duration: number
  volume: number
  trackList: TrackInfo[]
  likedTracks: TrackInfo[]
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
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(1)
  const [trackList, setTrackListState] = useState<TrackInfo[]>([])
  const [likedTracks, setLikedTracksState] = useState<TrackInfo[]>([])
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const nextTrackRef = useRef<(() => void) | null>(null)

  const clearProgressInterval = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }, [])

  const startProgressInterval = useCallback(() => {
    clearProgressInterval()
    progressIntervalRef.current = setInterval(() => {
      if (audioRef.current) {
        setProgress(audioRef.current.currentTime)
      }
    }, 1000)
  }, [clearProgressInterval])

  const playTrack = useCallback(async (track: TrackInfo, streamUrl: string) => {
    // Cleanup previous audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    clearProgressInterval()
    setProgress(0)

    try {
      const audio = new Audio(streamUrl)
      audioRef.current = audio
      audio.volume = volume

      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration)
      })

      audio.addEventListener('timeupdate', () => {
        setProgress(audio.currentTime)
      })

      audio.addEventListener('ended', () => {
        setIsPlaying(false)
        clearProgressInterval()
        if (nextTrackRef.current) {
          nextTrackRef.current()
        }
      })

      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e)
        setIsPlaying(false)
      })

      await audio.play()
      setCurrentTrack(track)
      setIsPlaying(true)
      setAudioUnlocked(true)
      startProgressInterval()
    } catch (error) {
      console.error('Failed to play audio:', error)
      if (!audioUnlocked) {
        console.warn('Audio may be blocked by browser autoplay policy. Try interacting with the page first.')
      }
      setIsPlaying(false)
    }
  }, [clearProgressInterval, startProgressInterval, volume, audioUnlocked])

  const pauseTrack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      clearProgressInterval()
    }
  }, [clearProgressInterval])

  const resumeTrack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true)
        startProgressInterval()
      }).catch((error) => {
        console.error('Failed to resume audio:', error)
      })
    }
  }, [startProgressInterval])

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setProgress(time)
    }
  }, [])

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }, [])

  const nextTrack = useCallback(() => {
    if (!currentTrack || trackList.length === 0) return
    const currentIndex = trackList.findIndex((t) => t.id === currentTrack.id)
    if (currentIndex === -1 || currentIndex === trackList.length - 1) return
    const next = trackList[currentIndex + 1]
    playTrack(next, getTrackStreamUrl(next.id))
  }, [currentTrack, trackList, playTrack])

  // Update ref whenever nextTrack changes
  nextTrackRef.current = nextTrack

  const prevTrack = useCallback(() => {
    if (!currentTrack || trackList.length === 0) return
    const currentIndex = trackList.findIndex((t) => t.id === currentTrack.id)
    if (currentIndex <= 0) return
    const prevTrack = trackList[currentIndex - 1]
    playTrack(prevTrack, getTrackStreamUrl(prevTrack.id))
  }, [currentTrack, trackList, playTrack])

  const setTrackList = useCallback((tracks: TrackInfo[]) => {
    setTrackListState(tracks)
  }, [])

  const setLikedTracks = useCallback((tracks: TrackInfo[]) => {
    setLikedTracksState(tracks)
  }, [])

  const toggleLike = useCallback((trackId: string, isLiked: boolean, track?: TrackInfo) => {
    if (isLiked) {
      setLikedTracksState((prev) => {
        const existingTrack = prev.find((t) => t.id === trackId)
        if (existingTrack) {
          return [existingTrack, ...prev]
        }
        if (track) {
          return [track, ...prev]
        }
        return prev
      })
    } else {
      setLikedTracksState((prev) => prev.filter((t) => t.id !== trackId))
    }
  }, [])

  return (
    <AudioContext.Provider value={{ currentTrack, isPlaying, progress, duration, volume, trackList, likedTracks, playTrack, pauseTrack, resumeTrack, seek, setVolume, nextTrack, prevTrack, setTrackList, setLikedTracks, toggleLike }}>
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider')
  }
  return context
}
