import { derived, type Writable } from 'svelte/store'
import { ZodError } from 'zod'

export const trurthly = (z: string) => !!z
export const toReadable = <T>(w: Writable<T>) => derived(w, a => a)

export const getErrorMessage = (e: unknown): string => {
  if (e instanceof ZodError)
    return e.issues
      .filter(a => a.path.length === 0) // Only take error from root
      .map(a => a.message)
      .join()
  if (e instanceof Error) return e.message
  else if (typeof e === 'string') return e
  else return JSON.stringify(e)
}
