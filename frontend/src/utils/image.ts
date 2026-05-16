import { getApiOrigin } from '../api/httpClient'

export function resolveImage(path?: string): string | undefined {
  if (!path) return undefined
  return `${getApiOrigin()}/${path.replace(/^\//, '')}`
}
