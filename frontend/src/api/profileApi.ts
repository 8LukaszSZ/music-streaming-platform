import { request } from './httpClient'
import type { UserDto } from '../types/auth'
import type { PlaylistDto, TrackDto, UserActivityDto, UserLiteDto } from '../types/profile'

export function getMe(token: string) {
  return request<UserDto>('/user/me', { token })
}

export function getMyTracks(token: string) {
  return request<TrackDto[]>('/localtracks/me', { token })
}

export function getTracksByUserId(userId: string, token?: string) {
  return request<TrackDto[]>(`/localtracks/user/${userId}`, { token })
}

export function getMyPlaylists(token: string) {
  return request<PlaylistDto[]>('/playlists/me', { token })
}

export function getPlaylistsByUserId(userId: string, token?: string) {
  return request<PlaylistDto[]>(`/playlists/user/${userId}`, { token })
}

export function getMyActivities(token: string) {
  return request<UserActivityDto[]>('/useractivities/me?all=true', { token })
}

export function getUserById(userId: string, token?: string) {
  return request<UserDto>(`/user/${userId}`, { token })
}

export function getUserActivities(userId: string, token?: string) {
  return request<UserActivityDto[]>(`/useractivities/${userId}?all=true`, { token })
}

export function getFollowers(userId: string, token?: string) {
  return request<UserLiteDto[]>(`/userfollows/${userId}/followers`, { token })
}

export function getFollowing(userId: string, token?: string) {
  return request<UserLiteDto[]>(`/userfollows/${userId}/following`, { token })
}

export function getMyLikedTracks(token: string) {
  return request<TrackDto[]>('/contentlikes/me/tracks', { token })
}

export function getLikedTracksByUserId(userId: string, token?: string) {
  return request<TrackDto[]>(`/contentlikes/user/${userId}/tracks`, { token })
}

export async function updateMyProfile(token: string, payload: { bio: string; profileImage?: File }) {
  const formData = new FormData()
  formData.append('bio', payload.bio)
  if (payload.profileImage) {
    formData.append('profileImage', payload.profileImage)
  }

  return request<UserDto>('/user/me/profile', {
    method: 'PUT',
    body: formData,
    token,
    isFormData: true,
  })
}
