import { writable, type Readable, type Updater, derived } from 'svelte/store'
import { debounce } from 'radash'
import type { z } from 'zod'

import { getErrorMessage, toReadable } from './utils.js'

export class ZodFieldStore<
  K extends Extract<keyof O, string>,
  A extends z.ZodRawShape = z.ZodRawShape,
  O = A,
> {
  /**
   * Field name
   */
  name: K
  /**
   * Readable store holding field's value
   */
  value: Readable<O[K]>
  /**
   * The field have been touched or not
   */
  touched: Readable<boolean>
  /**
   * The field value been changed or not
   */
  dirty: Readable<boolean>
  /**
   * The field validation error, if any
   */
  error: Readable<string>
  /**
   * The field value is valid or not
   */
  valid: Readable<boolean>
  /**
   * Callback to update field's value
   */
  updateValue: (updater: Updater<O[K]>) => void
  /**
   * Function to set field's value
   */
  setValue: (val: O[K]) => void
  /**
   * Callback to update field's value
   */
  handleChange: (e: unknown) => void
  /**
   * Callback to mark field as touched
   */
  handleBlur: () => void
  /**
   * Reset field to original state
   */
  reset: () => void
  /**
   * Set custom field error
   */
  setError: (e: string) => void
  /**
   * Update touched state
   */
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
    const _resetValue = () => value.set(initialValue as O[K])

    _resetValue()

    const _setValue = ms > 0 ? debounce({ delay: ms }, value.set) : value.set
    const _updateValue = ms > 0 ? debounce({ delay: ms }, value.update) : value.update

    const handleChange = (e: unknown) => {
      setError('')
      let nextVal = e
      if (e instanceof Event)
        if (e instanceof CustomEvent)
          if (typeof e.detail === 'object' && e.detail !== null && 'value' in e.detail)
            nextVal = e.detail.value
          else nextVal = e.detail
        else if (e.currentTarget instanceof HTMLInputElement)
          if (e.currentTarget.type === 'checkbox') nextVal = e.currentTarget.checked
          else nextVal = e.currentTarget.value
        else if (
          e.currentTarget instanceof HTMLSelectElement ||
          e.currentTarget instanceof HTMLTextAreaElement
        )
          nextVal = e.currentTarget.value

      try {
        nextVal = schema.parse(nextVal)
      } catch (e) {
        handleError(e)
      }

      _setValue(nextVal as O[K])
      setTouched(true)
      setDirty(true)
    }
    const handleSetValue = (v: O[K]) => {
      setError('')
      if (schema)
        try {
          _setValue(schema.parse(v))
        } catch (e) {
          handleError(e)
        }
      else _setValue(v)
      setTouched(true)
      setDirty(true)
    }
    const handleUpdateValue = (updater: Updater<O[K]>) => {
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
      _updateValue(safeUpdater)
      setTouched(true)
      setDirty(true)
    }
    const handleBlur = () => setTouched(true)
    const handleReset = () => {
      touched.set(false)
      dirty.set(false)
      error.set('')
      _resetValue()
    }

    this.name = name
    // Stores
    this.value = toReadable(value)
    this.touched = toReadable(touched)
    this.dirty = toReadable(dirty)
    this.error = toReadable(error)
    this.valid = derived(error, (e) => !e)
    // Handlers
    this.handleChange = handleChange
    this.updateValue = handleUpdateValue
    this.setValue = handleSetValue
    this.handleBlur = handleBlur
    this.reset = handleReset
    this.setError = setError
    this.setTouched = setTouched
  }
}
