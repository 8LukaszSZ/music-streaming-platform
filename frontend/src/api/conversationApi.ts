import { request } from './httpClient'

export interface ConversationDto {
  id: string
  participantAId: string
  participantBId: string
  participantAUsername: string
  participantBUsername: string
  createdAt: string
  unreadCount: number
}

export interface MessageDto {
  id: string
  conversationId: string
  senderId: string
  senderUsername: string
  content: string
  sharedContentId: string | null
  sharedContentType: string | null
  sentAt: string
  isRead: boolean
}

export interface SendMessageDto {
  conversationId: string
  content: string
  sharedContentId?: string
  sharedContentType?: string
}

export async function getMyConversations(token?: string) {
  return request<ConversationDto[]>('/conversation', { method: 'GET', token })
}

export async function getConversationById(conversationId: string, token?: string) {
  return request<ConversationDto>(`/conversation/${conversationId}`, { method: 'GET', token })
}

export async function createConversation(otherUserId: string, token?: string) {
  return request<ConversationDto>('/conversation', {
    method: 'POST',
    token,
    body: otherUserId,
  })
}

export async function deleteConversation(conversationId: string, token?: string) {
  return request(`/conversation/${conversationId}`, { method: 'DELETE', token })
}

export async function getMessagesByConversation(conversationId: string, token?: string) {
  return request<MessageDto[]>(`/message/conversation/${conversationId}`, { method: 'GET', token })
}

export async function sendMessage(dto: SendMessageDto, token?: string) {
  return request<MessageDto>('/message', {
    method: 'POST',
    token,
    body: dto,
  })
}

export async function markMessagesAsRead(conversationId: string, token?: string) {
  return request(`/message/${conversationId}/read`, { method: 'PUT', token })
}

export async function getUnreadMessageCount(token?: string) {
  return request<number>('/message/unread-count', { method: 'GET', token })
}
