import { useMemo } from 'react'

export function useCurrentUser() {
  return useMemo(() => {
    const token = localStorage.getItem('authToken')
    if (!token) return null
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.nameid || payload.sub || null
    } catch {
      return null
    }
  }, [])
}
