import { derived, get, writable, type Readable } from 'svelte/store'
import { ZodEffects, ZodError, type z } from 'zod'
import { pick, zip, keys, debounce } from 'radash'

import { ZodFieldStore } from './ZodFieldStore.js'
import { getErrorMessage, toReadable, trurthly } from './utils.js'

/**
 * Settings for ZodFormStore
 */
interface ICreateFormOptions<T> {
  /**
   * The initial value of fields in the form.
   */
  initialValue?: Partial<T>
  /**
   * Async callback to handle submmition of the form.
   * Should return nothing, or an `string` contain error message
   */
  onSubmit?: (v: T) => Promise<void | string> | string | void
  /**
   * Auto trigger submit when any data changed, after the delay in `ms`.
   * Passing `0` or `undefined` to disabled.
   *
   * @default undefined
   */
  autoSubmitAfter?: number
  /**
   * Debounce the value update, in `ms`.
   * Passing falsy value (`0` or `undefined`) to disabled.
   *
   * @default undefined
   */
  debounceDelay?: number
  /** Print debug messages */
  debug?: boolean
}

/**
 * Instance that hold all our form's state, as Svelte's Store
 */
export class ZodFormStore<A extends z.ZodRawShape = z.ZodRawShape, O = A> {
  /** Form's data. Will be passed to onSubmit handler */
  readonly model: Readable<O>
  /** Form settings. Should not be update */
  readonly options: ICreateFormOptions<O>

  /**
   * Generated fields's functions
   */
  fields: {
    [K in keyof Required<O>]: Pick<
      ZodFieldStore<K, A, O>,
      | 'updateValue'
      | 'setValue'
      | 'handleChange'
      | 'handleBlur'
      | 'reset'
      | 'setError'
      | 'setTouched'
    >
  }

  /** Generated fields's stores */
  // prettier-ignore
  stores: 
    & { [K in keyof Required<O> as `${string & K}_value`       ]: ZodFieldStore<K,A,O>['value'       ] }
    & { [K in keyof Required<O> as `${string & K}_touched`     ]: ZodFieldStore<K,A,O>['touched'     ] }
    & { [K in keyof Required<O> as `${string & K}_dirty`       ]: ZodFieldStore<K,A,O>['dirty'       ] }
    & { [K in keyof Required<O> as `${string & K}_error`       ]: ZodFieldStore<K,A,O>['error'       ] }
    & { [K in keyof Required<O> as `${string & K}_valid`       ]: ZodFieldStore<K,A,O>['valid'       ] }
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
    schema:
      | z.ZodObject<A, z.UnknownKeysParam, z.ZodTypeAny, O>
      | z.ZodEffects<z.ZodObject<A, z.UnknownKeysParam, z.ZodTypeAny, O>>,
    /** Additional configuration */
    options?: ICreateFormOptions<O>
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
      (name) =>
        new ZodFieldStore(
          schema instanceof ZodEffects ? schema.innerType() : schema,
          name as keyof O,
          this.options.initialValue?.[name as keyof O],
          this.options.debounceDelay
        )
    )

    const model = derived(
      fieldStores.map((z) => z.value),
      (z) => Object.fromEntries(zip(fieldNames, z)) as O
    )
    const fieldErrors = derived(
      fieldStores.map((z) => z.error),
      (e) => e.filter(trurthly)
    )

    const triggerSubmit = async () => {
      dirty.set(true)
      fieldStores.forEach((f) => f.setTouched(true))

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
      fieldStores.forEach((f) => f.reset())
    }

    if (this.options.autoSubmitAfter && this.options.autoSubmitAfter > 0) {
      const debouncedTriggerSubmit = debounce({ delay: this.options.autoSubmitAfter }, () => {
        if (this.options.debug) console.debug('⏱️ Auto submitting...')
        triggerSubmit()
      })
      let prevModel: O | null = null
      model.subscribe((nextModel) => {
        if (prevModel === null) {
          prevModel = nextModel
          return
        }
        if (prevModel === nextModel) return

        prevModel = nextModel
        debouncedTriggerSubmit()
      })
    }

    type FKey = keyof ZodFieldStore<keyof O, A, O>
    const handlerFuncNames: Array<FKey> = [
      'updateValue',
      'setValue',
      'handleChange',
      'handleBlur',
      'reset',
      'setError',
      'setTouched',
    ]
    this.fields = Object.fromEntries(
      fieldStores.map((z) => [z.name, pick(z, handlerFuncNames)])
    ) as unknown as typeof this.fields
    this.stores = Object.fromEntries(
      fieldStores.flatMap((fieldStore) =>
        Object.keys(fieldStore)
          .filter((key) => key !== 'name' && !handlerFuncNames.includes(key as FKey))
          .map((prop) => [
            `${String(fieldStore.name)}_${prop}`,
            fieldStore[prop as keyof typeof fieldStore],
          ])
      )
    ) as typeof this.stores
    this.triggerSubmit = triggerSubmit
    this.reset = handleReset
    this.submitting = toReadable(submitting)
    this.error = toReadable(formError)
    this.dirty = derived([dirty, ...fieldStores.map((a) => a.dirty)], (a) => a.some((b) => b))
    this.errors = derived([fieldErrors, formError], (errors) =>
      errors.flatMap((z) => z).filter(trurthly)
    )
    this.model = model
    this.valid = derived(this.errors, (e) => !e.length)
  }

  /** Set the form's error message manually */
  setError(errorMessage: string, path: (string | number)[]) {
    const [currentPath] = path
    const field = this.fields[currentPath as keyof O]
    if (!field) return
    field.setError(errorMessage)
  }
}
