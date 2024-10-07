import { ZodError } from 'zod'

export const getErrorMessage = (e: unknown): string => {
  if (e instanceof ZodError)
    return e.issues
      .filter(a => a.path.length === 0) // Only take error from root
      .map(a => a.message)
      .join()
  if (e instanceof Error) return e.message
  if (typeof e === 'string') return e
  if (typeof e === 'undefined') return ''
  if (e === null) return ''
  return JSON.stringify(e)
}
