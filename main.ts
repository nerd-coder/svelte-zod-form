import { derived, get, writable, type Readable, type Writable, type Updater } from 'svelte/store'
import { debounce, zip } from 'radash'
import { ZodError, type z } from 'zod'

const trurthly = (z: string) => !!z
const toReadable = <T>(w: Writable<T>) => derived(w, a => a)

const getErrorMessage = (e: unknown): string => {
  if (e instanceof ZodError) return e.format()._errors.join(',')
  if (e instanceof Error) return e.message
  else if (typeof e === 'string') return e
  else return JSON.stringify(e)
}

interface ICreateFormOptions<T> {
  /**
   * The initial value of fields in the form.
   */
  initialValue?: Partial<T>
  /** Should return nothing, or an error message */
  onSubmit?: (v: T) => Promise<void | string>
  /**
   * Debounce the value update (ms). Passing 0 to disable debounce
   * @default 0
   */
  debounceDelay?: number
}

export class ZodFormStore<A extends z.ZodRawShape, O = A> {
  readonly model: Readable<O>

  fields: { [K in keyof Required<O>]: ZodFieldStore<K, A, O> }
  triggerSubmit: () => void
  reset: () => void
  submitting: Readable<boolean>
  errors: Readable<string[]>
  valid: Readable<boolean>

  constructor(
    schema: z.ZodObject<A, z.UnknownKeysParam, z.ZodTypeAny, O>,
    options?: ICreateFormOptions<O>
  ) {
    const { initialValue, onSubmit, debounceDelay } = options || {}

    // Form stores
    const submitting = writable(false)
    const formError = writable<string>()

    // Fields stores
    const fieldNames = Object.keys(schema.shape)
    const fieldStores = fieldNames.map(
      name =>
        new ZodFieldStore(schema, name as keyof O, initialValue?.[name as keyof O], debounceDelay)
    )

    const model = derived(
      fieldStores.map(z => z.value),
      z => Object.fromEntries(zip(fieldNames, z)) as O
    )
    const fieldErrors = derived(
      fieldStores.map(z => z.error),
      e => e.filter(trurthly)
    )
    const errors = derived([fieldErrors, formError], errors =>
      errors.flatMap(z => z).filter(trurthly)
    )
    const valid = derived(errors, e => !e)

    const triggerSubmit = async () => {
      if (!onSubmit) return
      const _fieldErrors = get(fieldErrors)
      if (_fieldErrors.length > 0) {
        console.log('❗️ Please resolve field errors before submitting again', _fieldErrors)
        return
      }

      formError.set('')
      submitting.set(true)
      try {
        const values = schema.parse(get(model))
        const result = await onSubmit(values)
        if (result) formError.set(result)
      } catch (e) {
        console.log(`🚫 Form error`, e)
        formError.set(getErrorMessage(e))
      } finally {
        submitting.set(false)
      }
    }
    function handleReset() {
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
    this.errors = errors
    this.model = model
    this.valid = valid
  }
}

export class ZodFieldStore<K extends keyof O, A extends z.ZodRawShape, O = A> {
  name: K
  value: Readable<O[K]>
  touched: Readable<boolean>
  dirty: Readable<boolean>
  error: Readable<string>
  handleUpdate: (updater: Updater<O[K]>) => void
  handleChange: (e: unknown) => void
  handleBlur: () => void
  reset: () => void

  constructor(
    parentSchema: z.ZodObject<A, z.UnknownKeysParam, z.ZodTypeAny, O>,
    name: K,
    initialValue?: unknown,
    ms = 0
  ) {
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
      const safeUpdater: typeof updater = v => {
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
    this.error = derived([error, touched], ([e, t]) => (t ? e : ''))
    this.handleChange = handleChange
    this.handleUpdate = handleUpdate
    this.handleBlur = handleBlur
    this.reset = handleReset
  }
}
