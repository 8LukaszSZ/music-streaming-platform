import { API_BASE_URL } from './httpClient'
import { request } from './httpClient'

export function getTrackStreamUrl(trackId: string): string {
  const token = localStorage.getItem('authToken')
  if (token) {
    return `${API_BASE_URL}/LocalTracks/${trackId}/stream?access_token=${token}`
  }
  return `${API_BASE_URL}/LocalTracks/${trackId}/stream`
}

export function likeTrack(trackId: string, token: string) {
  console.log('likeTrack called with:', { trackId, token: token ? 'exists' : 'missing' })
  return request('/contentlikes', {
    method: 'POST',
    body: { contentId: trackId, contentType: 'TRACK' },
    token,
  })
}

export function unlikeTrack(trackId: string, token: string) {
  console.log('unlikeTrack called with:', { trackId, token: token ? 'exists' : 'missing' })
  return request('/contentlikes', {
    method: 'DELETE',
    body: { contentId: trackId, contentType: 'TRACK' },
    token,
  })
}
