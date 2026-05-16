import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as signalR from '@microsoft/signalr'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { getMyConversations, createConversation, deleteConversation, getMessagesByConversation } from '../api/conversationApi'
import type { SendMessageDto } from '../api/conversationApi'
import type { ConversationDto, MessageDto } from '../api/conversationApi'
import { getApiOrigin } from '../api/httpClient'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { getToken } from '../utils/auth'

export function ChatPage() {
  const { userId } = useParams<{ userId?: string }>()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<ConversationDto[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationDto | null>(null)
  const [messages, setMessages] = useState<MessageDto[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [showJumpToLatest, setShowJumpToLatest] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<ConversationDto | null>(null)
  const [countdown, setCountdown] = useState(5)
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const connectionRef = useRef<signalR.HubConnection | null>(null)
  const selectedConversationRef = useRef<ConversationDto | null>(null)
  const shouldAutoScrollRef = useRef(true)
  const processedMessagesRef = useRef<Set<string>>(new Set())

  const currentUserId = useCurrentUser()

  useEffect(() => {
    const init = async () => {
      await cleanupSignalRConnection()
      const loaded = await loadConversations()
      await setupSignalRConnection()
      if (userId) {
        await findOrCreateConversation(userId, loaded)
      }
    }
    init()
    return () => {
      cleanupSignalRConnection()
    }
  }, [userId])

  useEffect(() => {
    selectedConversationRef.current = selectedConversation
  }, [selectedConversation])

  const scrollToBottom = (smooth: boolean = true) => {
    const container = messagesContainerRef.current
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      })
    }
  }

  const handleScroll = () => {
    const container = messagesContainerRef.current
    if (!container) return

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    const isNearBottom = distanceFromBottom < 80

    shouldAutoScrollRef.current = isNearBottom
    setShowJumpToLatest(!isNearBottom)
  }

  const jumpToLatest = () => {
    shouldAutoScrollRef.current = true
    setShowJumpToLatest(false)
    scrollToBottom(true)
  }

  const setupSignalRConnection = async () => {
    const token = getToken()
    if (!token) return

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${getApiOrigin()}/hubs/chat`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build()

    connection.on('MessageReceived', (...args) => {
      const message = Array.isArray(args[0]) ? args[0][0] as MessageDto : args[0] as MessageDto
      if (selectedConversationRef.current && message && message.conversationId === selectedConversationRef.current.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) {
            return prev
          }
          if (shouldAutoScrollRef.current) {
            requestAnimationFrame(() => scrollToBottom(false))
          }
          return [...prev, message]
        })
        if (message.senderId !== currentUserId && connectionRef.current?.state === signalR.HubConnectionState.Connected) {
          connectionRef.current.invoke('MarkConversationAsRead', message.conversationId)
          setConversations((prev) =>
            prev.map((c) => (c.id === message.conversationId ? { ...c, unreadCount: 0 } : c))
          )
        }
      }
    })

    connection.on('NewMessageNotification', (message: MessageDto) => {
      if (message.senderId === currentUserId) {
        return
      }
      if (processedMessagesRef.current.has(message.id)) {
        return
      }
      processedMessagesRef.current.add(message.id)
      setConversations((prev) => {
        const existing = prev.find((c) => c.id === message.conversationId)
        if (existing) {
          const isConversationOpen = selectedConversationRef.current?.id === message.conversationId
          const updated = {
            ...existing,
            unreadCount: !isConversationOpen ? existing.unreadCount + 1 : existing.unreadCount
          }
          return [updated, ...prev.filter((c) => c.id !== message.conversationId)]
        }
        const token = localStorage.getItem('authToken')
        if (token) {
          getMyConversations(token).then(setConversations)
        }
        return prev
      })
    })

    connection.on('ConversationDeleted', (conversationId: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== conversationId))
      if (selectedConversationRef.current?.id === conversationId) {
        setSelectedConversation(null)
        setMessages([])
      }
    })

    connection.on('MessagesRead', (data: { conversationId: string; readerId: string; lastReadAt: string }) => {
      if (selectedConversationRef.current && data.conversationId === selectedConversationRef.current.id) {
        const readAt = new Date(data.lastReadAt)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.senderId !== data.readerId && new Date(msg.sentAt) <= readAt
              ? { ...msg, isRead: true }
              : msg
          )
        )
      }
    })

    try {
      await connection.start()
      connectionRef.current = connection
    } catch (error) {
      console.error('SignalR Connection Error:', error)
    }
  }

  const cleanupSignalRConnection = async () => {
    if (connectionRef.current) {
      try {
        await connectionRef.current.stop()
        connectionRef.current = null
      } catch (error) {
        console.error('SignalR Disconnect Error:', error)
      }
    }
  }

  const joinConversation = async (conversationId: string) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      try {
        console.log('Joining conversation:', conversationId)
        await connectionRef.current.invoke('JoinConversation', conversationId)
        console.log('Successfully joined conversation:', conversationId)
      } catch (error) {
        console.error('Error joining conversation:', error)
      }
    } else {
      console.warn('Cannot join conversation - SignalR not connected')
    }
  }

  const leaveConversation = async (conversationId: string) => {
    if (connectionRef.current) {
      try {
        await connectionRef.current.invoke('LeaveConversation', conversationId)
      } catch (error) {
        console.error('Error leaving conversation:', error)
      }
    }
  }

  const loadConversations = async (): Promise<ConversationDto[]> => {
    const token = getToken()
    if (!token) return []

    try {
      const data = await getMyConversations(token)
      console.log('Loaded conversations:', data)
      const uniqueMap = new Map(data.map((conv) => [conv.id, conv]))
      const uniqueConversations = Array.from(uniqueMap.values())
      console.log('Unique conversations:', uniqueConversations)
      setConversations(uniqueConversations)
      return uniqueConversations
    } catch (error) {
      console.error('Failed to load conversations:', error)
      return []
    } finally {
      setLoading(false)
    }
  }

  const findOrCreateConversation = async (targetUserId: string, loadedConversations: ConversationDto[]) => {
    const token = getToken()
    if (!token) return

    try {
      const existingConversation = loadedConversations.find(
        (conv) =>
          (conv.participantAId === targetUserId && conv.participantBId === currentUserId) ||
          (conv.participantBId === targetUserId && conv.participantAId === currentUserId)
      )
      if (existingConversation) {
        setSelectedConversation(existingConversation)
        loadMessages(existingConversation.id, selectedConversationRef.current?.id)
      } else {
        const newConversation = await createConversation(targetUserId, token)
        setConversations((prev) => [...prev, newConversation])
        setSelectedConversation(newConversation)
        loadMessages(newConversation.id, selectedConversationRef.current?.id)
      }
    } catch (error) {
      console.error('Failed to find or create conversation:', error)
    }
  }

  const loadMessages = async (conversationId: string, previousConversationId?: string) => {
    const token = getToken()
    if (!token) return

    if (previousConversationId) {
      await leaveConversation(previousConversationId)
    }

    setLoadingMessages(true)
    try {
      const data = await getMessagesByConversation(conversationId, token)
      setMessages(data)
      await joinConversation(conversationId)
      if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
        await connectionRef.current.invoke('MarkConversationAsRead', conversationId)
      }
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
      )
      shouldAutoScrollRef.current = true
      setShowJumpToLatest(false)
      setTimeout(() => scrollToBottom(false), 100)
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleSendMessage = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    if (!connectionRef.current) {
      console.error('SignalR connection not established')
      return
    }

    try {
      const dto: SendMessageDto = {
        conversationId: selectedConversation.id,
        content: newMessage.trim(),
      }
      console.log('Sending message via SignalR:', dto)
      await connectionRef.current.invoke('SendMessage', dto)
      setNewMessage('')
      console.log('Message sent, waiting for MessageReceived event')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const getOtherParticipant = (conversation: ConversationDto) => {
    return conversation.participantAId === currentUserId
      ? conversation.participantBUsername
      : conversation.participantAUsername
  }

  const getOtherParticipantId = (conversation: ConversationDto) => {
    return conversation.participantAId === currentUserId
      ? conversation.participantBId
      : conversation.participantAId
  }

  const handleDropdownToggle = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const button = e.currentTarget as HTMLElement
    const rect = button.getBoundingClientRect()

    setDropdownPosition({
      top: rect.top - 50,
      right: window.innerWidth - rect.right
    })

    setDropdownOpen(dropdownOpen === conversationId ? null : conversationId)
  }

  const handleDeleteClick = (conversation: ConversationDto, e: React.MouseEvent) => {
    e.stopPropagation()
    setDropdownOpen(null)
    setConversationToDelete(conversation)
    setCountdown(5)
    setDeleteModalOpen(true)
  }

  const handleCancelDelete = () => {
    setDeleteModalOpen(false)
    setConversationToDelete(null)
    setCountdown(5)
  }

  const handleConfirmDelete = useCallback(async () => {
    if (!conversationToDelete) return

    const token = getToken()
    if (!token) return

    try {
      await deleteConversation(conversationToDelete.id, token)
      setConversations((prev) => prev.filter((c) => c.id !== conversationToDelete.id))
      if (selectedConversation?.id === conversationToDelete.id) {
        setSelectedConversation(null)
        setMessages([])
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    } finally {
      setDeleteModalOpen(false)
      setConversationToDelete(null)
      setCountdown(5)
    }
  }, [conversationToDelete, selectedConversation])

  useEffect(() => {
    let interval: number
    if (deleteModalOpen && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    } else if (deleteModalOpen && countdown === 0) {
      handleConfirmDelete()
    }
    return () => clearInterval(interval)
  }, [deleteModalOpen, countdown, handleConfirmDelete])

  useEffect(() => {
    const handleClickOutside = () => {
      if (dropdownOpen) {
        setDropdownOpen(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [dropdownOpen])

  return (
    <div className="page">
      <Navbar />
      <div className="chat-page">
        {/* Conversation List */}
        <div className="chat-sidebar">
          <h2 className="chat-sidebar-title">Messages</h2>
          {loading ? (
            <p className="chat-loading">Loading conversations...</p>
          ) : conversations.length === 0 ? (
            <p className="chat-empty">No conversations yet.</p>
          ) : (
            <div className="chat-conversation-list">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`chat-conversation-item ${selectedConversation?.id === conversation.id ? 'active' : ''}`}
                  onClick={() => {
                    if (conversation.id === selectedConversationRef.current?.id) return
                    const prevId = selectedConversationRef.current?.id
                    setSelectedConversation(conversation)
                    loadMessages(conversation.id, prevId)
                  }}
                >
                  <div className="chat-conversation-avatar">
                    {getOtherParticipant(conversation).slice(0, 1).toUpperCase()}
                  </div>
                  <div className="chat-conversation-info">
                    <div className="chat-conversation-name-row">
                      <span className="chat-conversation-name">{getOtherParticipant(conversation)}</span>
                      {conversation.unreadCount > 0 && (
                        <span className="conversation-unread-badge">{conversation.unreadCount}</span>
                      )}
                    </div>
                    <span className="chat-conversation-date">
                      {new Date(conversation.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    className="chat-conversation-more-btn"
                    onClick={(e) => handleDropdownToggle(conversation.id, e)}
                  >
                    •••
                  </button>
                  {dropdownOpen === conversation.id && dropdownPosition && (
                    <div
                      className="chat-conversation-dropdown"
                      style={{
                        top: `${dropdownPosition.top}px`,
                        right: `${dropdownPosition.right}px`
                      }}
                    >
                      <button
                        className="chat-dropdown-item danger"
                        onClick={(e) => handleDeleteClick(conversation, e)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="chat-main">
          {selectedConversation ? (
            <>
              <div className="chat-header">
                <div className="chat-header-avatar">
                  {getOtherParticipant(selectedConversation).slice(0, 1).toUpperCase()}
                </div>
                <h2
                  className="chat-header-name"
                  onClick={() => navigate(`/profile/${getOtherParticipantId(selectedConversation)}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {getOtherParticipant(selectedConversation)}
                </h2>
              </div>

              <div
                className="chat-messages"
                ref={messagesContainerRef}
                onScroll={handleScroll}
              >
                {loadingMessages ? (
                  <p className="chat-loading">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="chat-empty">No messages yet. Start the conversation!</p>
                ) : (
                  messages.map((message, index) => {
                    const isLastSentByMe = message.senderId === currentUserId &&
                      messages.slice(index + 1).every(m => m.senderId !== currentUserId)

                    return (
                      <div
                        key={message.id}
                        className={`chat-message ${message.senderId === currentUserId ? 'sent' : 'received'}`}
                      >
                        <div className="chat-message-content">{message.content}</div>
                        <div className="chat-message-meta">
                          <span className="chat-message-time">
                            {new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {message.senderId === currentUserId && isLastSentByMe && (
                            <span className="chat-message-status">
                              {message.isRead ? '✓✓ Read' : '✓ Sent'}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {showJumpToLatest && (
                <button className="chat-jump-to-latest" onClick={jumpToLatest}>
                  ↓ Jump to latest
                </button>
              )}

              <div className="chat-input-area">
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newMessage.trim()) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <button
                  type="button"
                  className="chat-send-btn"
                  onClick={(e) => handleSendMessage(e)}
                  disabled={!newMessage.trim()}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="chat-empty-state">
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
      <Footer isAuthenticated={Boolean(getToken())} />

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="chat-delete-modal-overlay">
          <div className="chat-delete-modal">
            <h3>Delete Conversation?</h3>
            <p>This will delete the conversation for both participants.</p>
            <p className="chat-delete-countdown">Cancelling in {countdown} seconds...</p>
            <div className="chat-delete-modal-actions">
              <button
                className="chat-delete-cancel-btn"
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
              <button
                className="chat-delete-confirm-btn"
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
