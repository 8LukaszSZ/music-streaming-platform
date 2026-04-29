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

export function getLikedPlaylists(token: string) {
  return request<PlaylistDto[]>('/contentlikes/me/playlists', { token })
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

export async function followUser(userId: string, token: string) {
  return request(`/userfollows/${userId}`, {
    method: 'POST',
    token,
  })
}

export async function unfollowUser(userId: string, token: string) {
  return request(`/userfollows/${userId}`, {
    method: 'DELETE',
    token,
  })
}

export async function deletePlaylist(playlistId: string, token: string) {
  return request(`/playlists/${playlistId}`, {
    method: 'DELETE',
    token,
  })
}

export function getPlaylistById(playlistId: string, token?: string) {
  return request<PlaylistDto>(`/playlists/${playlistId}`, { token })
}

export async function updatePlaylistVisibility(playlistId: string, isPublic: boolean, token: string) {
  return request(`/playlists/${playlistId}/visibility`, {
    method: 'PUT',
    body: { isPublic },
    token,
  })
}

export async function updatePlaylist(playlistId: string, token: string, payload: { name?: string; description?: string; playlistImage?: File }) {
  const formData = new FormData()
  formData.append('Name', payload.name || '')
  if (payload.description !== undefined) formData.append('Description', payload.description)
  if (payload.playlistImage) formData.append('PlaylistImage', payload.playlistImage)

  return request(`/playlists/${playlistId}`, {
    method: 'PUT',
    body: formData,
    token,
    isFormData: true,
  })
}

export function getMyLikedTracks(token: string) {
  return request<TrackDto[]>('/contentlikes/me/tracks', { token })
}

export function getLikedTracksByUserId(userId: string, token?: string) {
  return request<TrackDto[]>(`/contentlikes/user/${userId}/tracks`, { token })
}

export function searchPlaylists(query: string, token?: string) {
  return request<PlaylistDto[]>(`/playlists/search?query=${encodeURIComponent(query)}`, { token })
}

export function searchUsers(query: string, token?: string) {
  return request<any[]>(`/user/search?query=${encodeURIComponent(query)}`, { token })
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

export async function createPlaylist(token: string, payload: { name: string; description?: string; isPublic: boolean; playlistImage?: File }) {
  const formData = new FormData()
  formData.append('name', payload.name)
  if (payload.description) {
    formData.append('description', payload.description)
  }
  formData.append('isPublic', payload.isPublic.toString())
  if (payload.playlistImage) {
    formData.append('playlistImage', payload.playlistImage)
  }

  return request<PlaylistDto>('/playlists', {
    method: 'POST',
    body: formData,
    token,
    isFormData: true,
  })
}
