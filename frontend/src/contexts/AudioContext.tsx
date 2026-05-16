import { createContext, useContext, useState, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import { getTrackStreamUrl, postPlay } from '../api/audioApi'
import type { TrackInfo, AudioContextType } from '../types/audio'

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(1)
  const [trackList, setTrackListState] = useState<TrackInfo[]>([])
  const [likedTracks, setLikedTracksState] = useState<TrackInfo[]>([])
  const [playsCount, setPlaysCount] = useState(0)
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const nextTrackRef = useRef<(() => void) | null>(null)
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearProgressInterval = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }, [])

  const clearPlayTimer = useCallback(() => {
    if (playTimerRef.current) {
      clearTimeout(playTimerRef.current)
      playTimerRef.current = null
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
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    clearProgressInterval()
    clearPlayTimer()
    setProgress(0)

    if (currentTrack && currentTrack.id !== track.id) {
      setPlaysCount(0)
    }

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
        clearPlayTimer()
        if (nextTrackRef.current) {
          nextTrackRef.current()
        }
      })

      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e)
        setIsPlaying(false)
        clearPlayTimer()
      })

      await audio.play()
      setCurrentTrack(track)
      setIsPlaying(true)
      setAudioUnlocked(true)
      startProgressInterval()

      const token = localStorage.getItem('authToken')
      if (token) {
        const duration = audio.duration
        const delay = duration < 20 ? duration * 1000 : 20000

        playTimerRef.current = setTimeout(async () => {
          try {
            await postPlay(track.id, 'TRACK', token)
            incrementPlaysCount()
          } catch (error) {
            console.error('Failed to post play:', error)
          }
        }, delay)
      }
    } catch (error) {
      console.error('Failed to play audio:', error)
      if (!audioUnlocked) {
        console.warn('Audio may be blocked by browser autoplay policy. Try interacting with the page first.')
      }
      setIsPlaying(false)
    }
  }, [clearProgressInterval, clearPlayTimer, startProgressInterval, volume, audioUnlocked])

  const pauseTrack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      clearProgressInterval()
      clearPlayTimer()
    }
  }, [clearProgressInterval, clearPlayTimer])

  const resumeTrack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true)
        startProgressInterval()

        const token = localStorage.getItem('authToken')
        if (token && currentTrack) {
          const duration = audioRef.current?.duration || 0
          const delay = duration < 20 ? duration * 1000 : 20000

          playTimerRef.current = setTimeout(async () => {
            try {
              await postPlay(currentTrack.id, 'TRACK', token)
              incrementPlaysCount()
            } catch (error) {
              console.error('Failed to post play:', error)
            }
          }, delay)
        }
      }).catch((error) => {
        console.error('Failed to resume audio:', error)
      })
    }
  }, [startProgressInterval, currentTrack])

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

  const incrementPlaysCount = useCallback(() => {
    setPlaysCount((prev) => prev + 1)
  }, [])

  const stopAndClearAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    clearProgressInterval()
    clearPlayTimer()
    setCurrentTrack(null)
    setIsPlaying(false)
    setProgress(0)
    setDuration(0)
    setPlaysCount(0)
  }, [clearProgressInterval, clearPlayTimer])

  return (
    <AudioContext.Provider value={{ currentTrack, isPlaying, progress, duration, volume, trackList, likedTracks, playsCount, playTrack, pauseTrack, resumeTrack, seek, setVolume, nextTrack, prevTrack, setTrackList, setLikedTracks, toggleLike, incrementPlaysCount, stopAndClearAudio }}>
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
