import { derived, get, readonly, writable, type Readable, type Unsubscriber } from 'svelte/store'
import { ZodEffects, ZodError, type z } from 'zod'

import { ZodFieldStore } from './ZodFieldStore.js'
import { getErrorMessage } from './utils/getErrorMessage.js'
import { debounce } from './utils/debounce.js'
import { zip } from './utils/zip.js'

/**
 * Settings for ZodFormStore
 */
export interface ZodFormStoreOptions<T> {
  /**
   * The initial value of fields in the form.
   */
  initialValue?: Partial<T>
  /**
   * Async callback to handle submission of the form.
   * Should return nothing, or an `string` contain error message
   */
  onSubmit?: (v: T) => Promise<void | string> | string | void
  /** Print debug messages */
  debug?: boolean
}

/**
 * Instance that hold all our form's state, as Svelte's Store
 *
 * @template A Input Zod schema for data in the form
 * @template O Output type. Represents the type of data in the form
 */
export class ZodFormStore<A extends z.ZodRawShape, O extends object> {
  /** Form's data. Will be passed to onSubmit handler */
  readonly model: Readable<O>
  /** Form settings. Should not be update */
  readonly options: ZodFormStoreOptions<O>

  /**
   * Generated fields's functions
   */
  fields: { [K in Extract<keyof O, string>]: ZodFieldStore<K, A, O> }

  /** Generated fields's stores, for easier access */
  // prettier-ignore
  stores: 
    & { [K in Extract<keyof O,string> as `${K}_value`  ]: ZodFieldStore<K,A,O>['value'  ] }
    & { [K in Extract<keyof O,string> as `${K}_touched`]: ZodFieldStore<K,A,O>['touched'] }
    & { [K in Extract<keyof O,string> as `${K}_dirty`  ]: ZodFieldStore<K,A,O>['dirty'  ] }
    & { [K in Extract<keyof O,string> as `${K}_error`  ]: ZodFieldStore<K,A,O>['error'  ] }
    & { [K in Extract<keyof O,string> as `${K}_valid`  ]: ZodFieldStore<K,A,O>['valid'  ] }
  /**
   * Function to start parsing, validating and submit the form's data.
   *
   * Should assign to form's submit event or submit button.
   *
   * ```svelte
   * <form on:submit={form.triggerSubmit}>
   *  ...
   * </form>
   * ```
   */
  triggerSubmit: () => Promise<void>
  /**
   * Function to reset the form to original state.
   *
   * Should assign to form's `reset` event, reset button, or call directly.
   *
   * ```svelte
   * <form on:reset={form.reset}>
   *  ...
   * </form>
   * ```
   */
  reset: () => void
  /** Indicate if the form is being submitted (`onSubmit` handler is resolving).  */
  submitting: Readable<boolean>
  /**
   * Array of string contains all error messages
   * (including fields's errors and error return from `onSubmit` handler).
   */
  errors: Readable<string[]>
  /** Error message returned from `onSubmit` handler, or custom validation message. */
  error: Readable<string>
  /** Indicate if the form is edited or submitted. */
  dirty: Readable<boolean>
  /** Indicate if the form is valid. */
  valid: Readable<boolean>

  constructor(
    /** Zod's schema for data in the form. Should be a `ZodObject`. */
    public schema:
      | z.ZodObject<A, z.UnknownKeysParam, z.ZodTypeAny, O>
      | z.ZodEffects<z.ZodObject<A, z.UnknownKeysParam, z.ZodTypeAny, O>>,
    /** Additional configuration */
    options?: ZodFormStoreOptions<O>
  ) {
    this.options = options || {}

    // Form stores
    const submitting = writable(false)
    const dirty = writable(false)
    const formError = writable<string>()

    // Fields stores
    const fieldNames = Object.keys(
      schema instanceof ZodEffects ? schema.innerType().shape : schema.shape
    )
    const fieldStores = fieldNames.map(
      name =>
        new ZodFieldStore(
          schema instanceof ZodEffects ? schema.innerType() : schema,
          name as Extract<keyof O, string>,
          this.options.initialValue?.[name as keyof O]
        )
    )

    const model = derived(
      fieldStores.map(z => z.value),
      z => Object.fromEntries(zip(fieldNames, z)) as O
    )
    const fieldErrors = derived(
      fieldStores.map(z => z.error),
      e => e.filter(Boolean)
    )

    const triggerSubmit = async () => {
      dirty.set(true)
      fieldStores.forEach(f => f.setTouched(true))

      if (!this.options.onSubmit) return

      const _fieldErrors = get(fieldErrors)
      if (_fieldErrors.length > 0) {
        if (this.options.debug) console.debug('❗️ Form not valid', _fieldErrors)
        return
      }

      formError.set('')
      submitting.set(true)
      try {
        const values = schema.parse(get(model))
        const result = await this.options.onSubmit(values)
        if (result) formError.set(result)
      } catch (e) {
        if (this.options.debug) console.debug(`🚫 Form submit error`, e)
        // Set Error back to field
        if (e instanceof ZodError)
          for (const issue of e.issues) this.setError(issue.message, issue.path)

        formError.set(getErrorMessage(e))
      } finally {
        submitting.set(false)
      }
    }
    function handleReset() {
      dirty.set(false)
      submitting.set(false)
      formError.set('')
      fieldStores.forEach(f => f.reset())
    }

    type FKey = keyof ZodFieldStore<Extract<keyof O, string>, A, O>
    this.fields = Object.fromEntries(
      fieldStores.map(z => [z.name, z])
    ) as unknown as typeof this.fields
    const handlerFuncNames: Array<FKey> = [
      'updateValue',
      'setValue',
      'handleChange',
      'handleBlur',
      'reset',
      'setError',
      'setTouched',
    ]
    this.stores = Object.fromEntries(
      fieldStores.flatMap(fieldStore =>
        Object.keys(fieldStore)
          .filter(key => key !== 'name' && !handlerFuncNames.includes(key as FKey))
          .map(prop => [
            `${String(fieldStore.name)}_${prop}`,
            fieldStore[prop as keyof typeof fieldStore],
          ])
      )
    ) as typeof this.stores
    this.triggerSubmit = triggerSubmit
    this.reset = handleReset
    this.submitting = readonly(submitting)
    this.error = readonly(formError)
    this.dirty = derived([dirty, ...fieldStores.map(a => a.dirty)], a => a.some(b => b))
    this.errors = derived([fieldErrors, formError], errors =>
      errors.flatMap(z => z).filter(Boolean)
    )
    this.model = model
    this.valid = derived(this.errors, e => !e.length)
  }

  /** Set the form's error message manually */
  setError(errorMessage: string, path: (string | number)[]): void {
    const [currentPath] = path
    const field = this.fields[currentPath as Extract<keyof O, string>]
    if (!field) return
    field.setError(errorMessage)
  }

  /**
   * Setup auto submit on every change of the model.
   * If the model changed, it will be submit in last `delay` milliseconds.
   *
   * @param delay Time in milliseconds to wait before submitting the form.
   */
  setupAutoSubmit(delay: number): Unsubscriber {
    const debouncedTriggerSubmit = debounce({ delay }, () => {
      if (this.options.debug) console.debug('⏱️ Auto submitting...')
      this.triggerSubmit()
    })
    let prevModel: O | null = null

    // Subscribe to the model and on every change, debouncedTriggerSubmit will be called
    const sub = this.model.subscribe(nextModel => {
      // If it's the first time here, just save the model and return
      if (prevModel === null) {
        prevModel = nextModel
        return
      }
      // If the model didn't change, just return
      if (prevModel === nextModel) return

      prevModel = nextModel
      debouncedTriggerSubmit()
    })
    return sub
  }
}
