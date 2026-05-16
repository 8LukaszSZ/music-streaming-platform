import { API_BASE_URL } from './httpClient'
import { request } from './httpClient'

export function getTrackStreamUrl(trackId: string): string {
  const token = localStorage.getItem('authToken')
  if (token) {
    return `${API_BASE_URL}/LocalTracks/${trackId}/stream?access_token=${token}`
  }
  return `${API_BASE_URL}/LocalTracks/${trackId}/stream`
}

export function getTrackById(trackId: string, token?: string) {
  return request(`/LocalTracks/${trackId}`, {
    method: 'GET',
    token,
  })
}

export function getWaveform(trackId: string, token?: string) {
  return request(`/LocalTracks/${trackId}/waveform`, {
    method: 'GET',
    token,
  })
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

export async function removeTrackFromPlaylist(playlistId: string, playlistTrackId: string, token: string) {
  return request(`/playlists/${playlistId}/tracks/${playlistTrackId}`, {
    method: 'DELETE',
    token,
  })
}

export function searchTracks(query: string, token?: string) {
  return request<any[]>(`/localtracks/search?query=${encodeURIComponent(query)}`, { token })
}

export function getComments(contentId: string, contentType: string = 'TRACK', token?: string) {
  return request(`/ContentComments?contentId=${contentId}&contentType=${contentType}`, {
    method: 'GET',
    token,
  })
}

export function createComment(contentId: string, content: string, parentCommentId?: string, token?: string) {
  return request('/ContentComments', {
    method: 'POST',
    body: {
      contentId,
      contentType: 'TRACK',
      content,
      parentCommentId,
    },
    token,
  })
}

export function getLatestCommentsForUser(userId: string, count: number = 3, token?: string) {
  return request<any[]>(`/ContentComments/latest?userId=${userId}&count=${count}`, { token })
}

export function getFansAlsoLike(artistUserId: string, count: number = 5, token?: string) {
  return request<any[]>(`/LocalTracks/recommendations?artistUserId=${artistUserId}&count=${count}`, { token })
}

export function getTrendingTracks(count: number = 6, token?: string) {
  return request<any[]>(`/LocalTracks/trending?count=${count}`, { token })
}

export function getLikedTracksByUser(userId: string, token?: string) {
  return request<any[]>(`/ContentLikes/user/${userId}/tracks`, { token })
}

export function deleteComment(commentId: string, token?: string) {
  return request(`/ContentComments/${commentId}`, {
    method: 'DELETE',
    token,
  })
}

export function getCommentsCount(contentId: string, contentType: string = 'TRACK', token?: string) {
  return request(`/ContentComments/count?contentId=${contentId}&contentType=${contentType}`, {
    method: 'GET',
    token,
  })
}

export function getLikesCount(contentId: string, contentType: string = 'TRACK', token?: string) {
  return request(`/ContentLikes/count?contentId=${contentId}&contentType=${contentType}`, {
    method: 'GET',
    token,
  })
}

export function getPlaysCount(contentId: string, contentType: string = 'TRACK', token?: string) {
  return request(`/ContentPlays/count?contentId=${contentId}&contentType=${contentType}`, {
    method: 'GET',
    token,
  })
}

export function postPlay(contentId: string, contentType: string = 'TRACK', token: string) {
  return request('/contentplays', {
    method: 'POST',
    body: { contentId, contentType },
    token,
  })
}

export function uploadTrack(
  audioFile: File,
  imageFile: File | null,
  title: string,
  duration: number,
  isPublic: boolean,
  valence?: string,
  energy?: string,
  token?: string
) {
  const formData = new FormData()
  formData.append('File', audioFile)
  if (imageFile) {
    formData.append('TrackImage', imageFile)
  }
  formData.append('Title', title)
  formData.append('Duration', Math.floor(duration).toString())
  formData.append('IsPrivate', (!isPublic).toString())
  if (valence) {
    formData.append('Valence', valence)
  }
  if (energy) {
    formData.append('Energy', energy)
  }

  return fetch(`${API_BASE_URL}/localtracks`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: formData,
  }).then((response) => {
    if (!response.ok) {
      throw new Error('Upload failed')
    }
    return response.json()
  })
}

export async function deleteTrack(trackId: string, token?: string) {
  return request(`/localtracks/${trackId}`, { method: 'DELETE', token })
}

export async function addTrackToPlaylist(playlistId: string, trackId: string, token?: string) {
  return request(`/playlists/${playlistId}/tracks`, {
    method: 'POST',
    token,
    body: { localTrackId: trackId },
  })
}

export async function likePlaylist(playlistId: string, token?: string) {
  return request('/contentlikes', {
    method: 'POST',
    token,
    body: { contentId: playlistId, contentType: 'PLAYLIST' },
  })
}

export async function unlikePlaylist(playlistId: string, token?: string) {
  return request('/contentlikes', {
    method: 'DELETE',
    token,
    body: { contentId: playlistId, contentType: 'PLAYLIST' },
  })
}

export async function shareContent(contentId: string, contentType: 'TRACK' | 'PLAYLIST', message?: string, token?: string) {
  return request('/useractivities/share', {
    method: 'POST',
    token,
    body: { contentId, contentType, message },
  })
}

export async function getUserActivities(userId: string, all: boolean = false, token?: string) {
  return request(`/useractivities/${userId}?all=${all}`, {
    method: 'GET',
    token,
  })
}

export async function getMyActivities(all: boolean = false, token?: string) {
  return request(`/useractivities/me?all=${all}`, {
    method: 'GET',
    token,
  })
}

export async function deleteActivity(activityId: string, token?: string) {
  return request(`/useractivities/${activityId}`, {
    method: 'DELETE',
    token,
  })
}

export function getContentStatsTwoWeeks(contentId: string, contentType: 'TRACK' | 'PLAYLIST', token?: string) {
  return request(`/contentstats/two-weeks?contentId=${contentId}&contentType=${contentType}`, {
    method: 'GET',
    token,
  })
}
