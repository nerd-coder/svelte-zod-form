import { derived, get, writable, type Readable } from 'svelte/store'
import { zip } from 'radash'
import { ZodEffects, ZodError, type z } from 'zod'

import { ZodFieldStore } from './ZodFieldStore'
import { getErrorMessage, toReadable, trurthly } from './utils'

/**
 * Settings for ZodFormStore
 */
interface ICreateFormOptions<T> {
  /**
   * The initial value of fields in the form.
   */
  initialValue?: Partial<T>
  /** Should return nothing, or an error message */
  onSubmit?: (v: T) => Promise<void | string> | string | void
  /**
   * Debounce the value update (ms). Passing 0 to disable debounce
   * @default 0
   */
  debounceDelay?: number
}

/**
 * Instance that hold all our form's state, as Svelte's Store
 */
export class ZodFormStore<A extends z.ZodRawShape, O = A> {
  /** Form's data. Will be passed to onSubmit handler */
  readonly model: Readable<O>
  /** Form settings. Should not be update */
  readonly options: ICreateFormOptions<O>

  /** Generated fields's stores */
  fields: { [K in keyof Required<O>]: ZodFieldStore<K, A, O> }
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
      name =>
        new ZodFieldStore(
          schema instanceof ZodEffects ? schema.innerType() : schema,
          name as keyof O,
          this.options.initialValue?.[name as keyof O],
          this.options.debounceDelay
        )
    )

    const model = derived(
      fieldStores.map(z => z.value),
      z => Object.fromEntries(zip(fieldNames, z)) as O
    )
    const fieldErrors = derived(
      fieldStores.map(z => z.error),
      e => e.filter(trurthly)
    )

    const triggerSubmit = async () => {
      dirty.set(true)
      if (!this.options.onSubmit) return
      const _fieldErrors = get(fieldErrors)
      if (_fieldErrors.length > 0) {
        console.log('❗️ Please resolve field errors before submitting again', _fieldErrors)
        return
      }

      formError.set('')
      submitting.set(true)
      try {
        const values = schema.parse(get(model))
        const result = await this.options.onSubmit(values)
        if (result) formError.set(result)
      } catch (e) {
        console.log(`🚫 Form error`, e)
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
      fieldStores.forEach(fs => fs.reset())
    }

    this.fields = Object.fromEntries(
      fieldStores.map(z => [z.name, z])
    ) as unknown as typeof this.fields
    this.triggerSubmit = triggerSubmit
    this.reset = handleReset
    this.submitting = toReadable(submitting)
    this.error = toReadable(formError)
    this.dirty = derived([dirty, ...fieldStores.map(a => a.dirty)], a => a.some(b => b))
    this.errors = derived([fieldErrors, formError], errors =>
      errors.flatMap(z => z).filter(trurthly)
    )
    this.model = model
  }

  /** Set the form's error message manually */
  setError(errorMessage: string, path: (string | number)[]) {
    const [currentPath] = path
    const field = this.fields[currentPath as keyof O]
    if (!field) return
    field.setError(errorMessage)
  }
}
