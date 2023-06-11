import { writable, type Readable, type Updater, derived } from 'svelte/store'
import { debounce } from 'radash'
import type { z } from 'zod'

import { getErrorMessage, toReadable } from './utils.js'

export class ZodFieldStore<K extends keyof O, A extends z.ZodRawShape, O = A> {
  name: K
  value: Readable<O[K]>
  touched: Readable<boolean>
  dirty: Readable<boolean>
  error: Readable<string>
  valid: Readable<boolean>
  handleUpdate: (updater: Updater<O[K]>) => void
  handleChange: (e: unknown) => void
  handleBlur: () => void
  reset: () => void
  setError: (e: string) => void
  setTouched: (v: boolean) => void

  constructor(
    parentSchema: z.ZodObject<A, z.UnknownKeysParam, z.ZodTypeAny, O>,
    name: K,
    initialValue?: unknown,
    ms = 0
  ) {
    if (!(name in parentSchema.shape)) throw new Error('Invalid field name')

    // Stores
    const touched = writable(false)
    const dirty = writable(false)
    const error = writable('')
    const value = writable<O[K]>()

    const setError = ms > 0 ? debounce({ delay: ms }, error.set) : error.set
    const setTouched = ms > 0 ? debounce({ delay: ms }, touched.set) : touched.set
    const setDirty = ms > 0 ? debounce({ delay: ms }, dirty.set) : dirty.set

    const schema = parentSchema.shape[name as keyof A]
    const handleError = (e: unknown) => setError(getErrorMessage(e))
    try {
      initialValue = schema.parse(initialValue)
    } catch (e) {
      handleError(e)
    }
    const resetValue = () => value.set(initialValue as O[K])

    resetValue()

    const setValue = ms > 0 ? debounce({ delay: ms }, value.set) : value.set
    const updateValue = ms > 0 ? debounce({ delay: ms }, value.update) : value.update

    const handleChange = (e: unknown) => {
      setError('')
      let nextVal = e
      if (e instanceof Event)
        if (e instanceof CustomEvent)
          if (typeof e.detail === 'object' && 'value' in e.detail) nextVal = e.detail.value
          else nextVal = e.detail
        else if (e.target instanceof HTMLInputElement)
          if (e.target.type === 'checkbox') nextVal = e.target.checked
          else nextVal = e.target.value
        else if (e.target instanceof HTMLSelectElement) nextVal = e.target.value
        else if (e.target instanceof HTMLTextAreaElement) nextVal = e.target.value

      try {
        nextVal = schema.parse(nextVal)
      } catch (e) {
        handleError(e)
      }

      setValue(nextVal as O[K])
      setTouched(true)
      setDirty(true)
    }
    const handleUpdate = (updater: Updater<O[K]>) => {
      const safeUpdater: typeof updater = (v) => {
        setError('')
        const updatedVal = updater(v)
        if (schema)
          try {
            return schema.parse(updatedVal)
          } catch (e) {
            handleError(e)
          }
        return updatedVal
      }
      updateValue(safeUpdater)
      setTouched(true)
      setDirty(true)
    }
    const handleBlur = () => setTouched(true)
    const handleReset = () => {
      touched.set(false)
      dirty.set(false)
      error.set('')
      resetValue()
    }

    this.name = name
    this.value = toReadable(value)
    this.touched = toReadable(touched)
    this.dirty = toReadable(dirty)
    this.error = toReadable(error)
    this.valid = derived(error, (e) => !e)
    this.handleChange = handleChange
    this.handleUpdate = handleUpdate
    this.handleBlur = handleBlur
    this.reset = handleReset
    this.setError = setError
    this.setTouched = setTouched
  }
}
