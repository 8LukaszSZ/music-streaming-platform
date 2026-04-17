import { memo } from 'react'
import type { WaveformProps } from '../types/component'

export const Waveform = memo(function Waveform({ waveformBars, progressPercent, onSeek }: WaveformProps) {
  return (
    <div
      className="waveform-bars"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const percent = x / rect.width
        onSeek(percent)
      }}
      style={{ cursor: 'pointer' }}
    >
      {waveformBars.map((height, i) => {
        const barProgress = (i / waveformBars.length) * 100
        const isPlayed = barProgress <= progressPercent
        return (
          <div
            key={i}
            className="waveform-bar"
            style={{
              height: `${height}%`,
              backgroundColor: isPlayed ? '#9e77ff' : 'rgba(255, 255, 255, 0.1)',
            }}
          />
        )
      })}
    </div>
  )
})
