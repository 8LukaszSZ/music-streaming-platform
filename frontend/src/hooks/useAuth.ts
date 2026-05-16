import { useMemo } from 'react'

export function useAuth() {
  return useMemo(() => Boolean(localStorage.getItem('authToken')), [])
}
