import * as profileApi from '../api/profileApi'
import { getAuthToken } from './authService'

export async function getProfileData() {
  const token = getAuthToken()
  if (!token) {
    throw new Error('You need to log in first.')
  }

  const me = await profileApi.getMe(token)
  const [tracks, playlists, activities, followers, following, likedTracks] = await Promise.all([
    profileApi.getMyTracks(token),
    profileApi.getMyPlaylists(token),
    profileApi.getMyActivities(token),
    profileApi.getFollowers(me.id, token),
    profileApi.getFollowing(me.id, token),
    profileApi.getMyLikedTracks(token),
  ])

  const shared = activities.filter((activity) => activity.activityType === 'SHARE')

  return {
    me,
    tracks,
    playlists,
    shared,
    followers,
    following,
    likedTracks,
  }
}

export async function updateProfileData(payload: { bio: string; profileImage?: File }) {
  const token = getAuthToken()
  if (!token) {
    throw new Error('You need to log in first.')
  }

  return profileApi.updateMyProfile(token, payload)
}

export async function getUserProfileData(userId: string) {
  const token = getAuthToken()
  const [user, tracks, playlists, followers, following, shared, likedTracks] = await Promise.all([
    profileApi.getUserById(userId, token),
    profileApi.getTracksByUserId(userId, token),
    profileApi.getPlaylistsByUserId(userId, token),
    profileApi.getFollowers(userId, token),
    profileApi.getFollowing(userId, token),
    profileApi.getUserActivities(userId, token),
    profileApi.getLikedTracksByUserId(userId, token),
  ])

  return {
    me: {
      id: user.id,
      username: user.username,
      bio: user.bio,
      profileImagePath: user.profileImagePath,
    },
    tracks,
    playlists,
    shared,
    followers,
    following,
    likedTracks,
  }
}
