import { writable, type Readable, type Updater, derived, readonly } from 'svelte/store'
import type { z } from 'zod'

import { getErrorMessage } from './utils/getErrorMessage.js'

enum ErrorMessages {
  invalidEvent = 'Invalid param passes to `handleChange`. If you want to pass value directly, please use `setValue` instead',
  invalidEventTarget = 'Invalid event target. Supported elements are: HTMLInputElement, HTMLSelectElement, HTMLTextAreaElement',
}

/**
 * Instance that hold all our field's state, as Svelte's Store
 *
 * @see {@link ZodFormStore}
 * @template K Name of the field
 * @template A Zod's parent schema type of the field
 * @template O Type of the parent data
 */
export class ZodFieldStore<K extends Extract<keyof O, string>, A extends z.ZodRawShape, O = A> {
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
   * Callback to update field's value.
   * Should be used in input's `onInput` event
   *
   * If you want to pass value directly, please use `setValue` instead
   */
  handleChange: (e: Event) => void
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
    initialValue?: unknown
  ) {
    if (!(name in parentSchema.shape)) throw new Error('Invalid field name')

    // Stores
    const touched = writable(false)
    const dirty = writable(false)
    const error = writable('')
    const value = writable<O[K]>()

    const schema = parentSchema.shape[name as keyof A]
    const handleError = (e: unknown) => error.set(getErrorMessage(e))
    const resetValue = () => {
      value.set(initialValue as O[K])
      try {
        const parsed = schema.parse(initialValue)
        value.set(parsed)
      } catch (e) {
        error.set(getErrorMessage(e))
      }
    }

    resetValue()

    const handleChange = (e: Event) => {
      error.set('')
      let nextVal: string | boolean | number | null = null
      if (!(e instanceof Event)) throw new Error(ErrorMessages.invalidEvent, { cause: e })

      if (e.currentTarget instanceof HTMLInputElement)
        if (e.currentTarget.type === 'checkbox') nextVal = e.currentTarget.checked
        else nextVal = e.currentTarget.value
      else if (
        e.currentTarget instanceof HTMLSelectElement ||
        e.currentTarget instanceof HTMLTextAreaElement
      )
        nextVal = e.currentTarget.value
      else throw new Error(ErrorMessages.invalidEventTarget, { cause: e })

      try {
        nextVal = schema.parse(nextVal)
      } catch (e) {
        handleError(e)
      }

      value.set(nextVal as O[K])
      touched.set(true)
      dirty.set(true)
    }
    const handleSetValue = (v: O[K]) => {
      error.set('')
      if (schema)
        try {
          value.set(schema.parse(v))
        } catch (e) {
          handleError(e)
        }
      else value.set(v)
      touched.set(true)
      dirty.set(true)
    }
    const handleUpdateValue = (updater: Updater<O[K]>) => {
      const safeUpdater: typeof updater = v => {
        error.set('')
        const updatedVal = updater(v)
        if (schema)
          try {
            return schema.parse(updatedVal)
          } catch (e) {
            handleError(e)
          }
        return updatedVal
      }
      value.update(safeUpdater)
      touched.set(true)
      dirty.set(true)
    }
    this.name = name
    // Stores
    this.value = readonly(value)
    this.touched = readonly(touched)
    this.dirty = readonly(dirty)
    this.error = readonly(error)
    this.valid = derived(error, e => !e)
    // Handlers
    this.handleChange = handleChange
    this.updateValue = handleUpdateValue
    this.setValue = handleSetValue
    this.handleBlur = () => touched.set(true)
    this.setError = (e: string) => error.set(e)
    this.setTouched = (v: boolean) => touched.set(v)
    this.reset = () => {
      touched.set(false)
      dirty.set(false)
      error.set('')
      resetValue()
    }
  }
}
