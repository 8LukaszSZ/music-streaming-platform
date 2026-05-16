import { useEffect, useRef, useState } from 'react'
import * as signalR from '@microsoft/signalr'
import { getApiOrigin } from '../api/httpClient'
import { getUnreadMessageCount } from '../api/conversationApi'
import { useCurrentUser } from './useCurrentUser'

export function useUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0)
  const connectionRef = useRef<signalR.HubConnection | null>(null)
  const currentUserId = useCurrentUser()

  const fetchUnreadCount = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) return
    try {
      const count = await getUnreadMessageCount(token)
      setUnreadCount(count)
    } catch (error) {
      console.error('Failed to fetch unread message count:', error)
    }
  }

  useEffect(() => {
    fetchUnreadCount()

    const setupSignalR = async () => {
      const token = localStorage.getItem('authToken')
      if (!token) return

      const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${getApiOrigin()}/hubs/chat`, {
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build()

      connection.on('NewMessageNotification', (message: any) => {
        if (message.senderId === currentUserId) {
          return
        }
        fetchUnreadCount()
      })

      try {
        await connection.start()
        connectionRef.current = connection
      } catch (error) {
        console.error('SignalR Connection Error:', error)
      }
    }

    setupSignalR()

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop()
      }
    }
  }, [currentUserId])

  return unreadCount
}
