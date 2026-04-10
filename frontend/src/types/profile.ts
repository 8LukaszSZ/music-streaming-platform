export type TrackDto = {
  id: string
  userId: string
  title: string
  duration: number
  trackImagePath?: string
  filePath?: string
  username?: string
  isPrivate: boolean
}

export type PlaylistDto = {
  id: string
  userId: string
  name: string
  description?: string
  isPublic: boolean
  playlistImagePath?: string
}

export type UserLiteDto = {
  id: string
  username: string
  profileImagePath?: string
}

export type UserActivityDto = {
  id: string
  activityType: string
  contentId: string
  contentType: string
  message?: string
  createdAt: string
}
