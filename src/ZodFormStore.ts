import { derived, get, writable, type Readable } from 'svelte/store'
import { zip } from 'radash'
import { ZodEffects, ZodError, type z } from 'zod'

import { ZodFieldStore } from './ZodFieldStore'
import { getErrorMessage, toReadable, trurthly } from './utils'

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

export class ZodFormStore<A extends z.ZodRawShape, O = A> {
  readonly model: Readable<O>
  readonly options: ICreateFormOptions<O>

  fields: { [K in keyof Required<O>]: ZodFieldStore<K, A, O> }
  triggerSubmit: () => Promise<void>
  reset: () => void
  submitting: Readable<boolean>
  errors: Readable<string[]>
  error: Readable<string>
  dirty: Readable<boolean>

  constructor(
    schema:
      | z.ZodObject<A, z.UnknownKeysParam, z.ZodTypeAny, O>
      | z.ZodEffects<z.ZodObject<A, z.UnknownKeysParam, z.ZodTypeAny, O>>,
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

  setError(errorMessage: string, path: (string | number)[]) {
    const [currentPath] = path
    const field = this.fields[currentPath as keyof O]
    if (!field) return
    field.setError(errorMessage)
  }
}
