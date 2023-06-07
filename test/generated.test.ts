import { z } from 'zod'
import { get } from 'svelte/store'
import { ZodFieldStore } from '../src/ZodFieldStore'
import { polyfillDOM } from './test-utils'

describe('ZodFieldStore_class', () => {
  beforeEach(polyfillDOM)

  // Tests that a new instance of ZodFieldStore can be created with valid parameters.
  it('test_creating_new_instance_with_valid_parameters', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    })
    const field = new ZodFieldStore(schema, 'name', 'John')
    expect(field.name).toBe('name')
    expect(get(field.value)).toBeDefined()
    expect(field.touched).toBeDefined()
    expect(field.dirty).toBeDefined()
    expect(field.error).toBeDefined()
    expect(field.handleChange).toBeDefined()
    expect(field.handleUpdate).toBeDefined()
    expect(field.handleBlur).toBeDefined()
    expect(field.reset).toBeDefined()
    expect(field.setError).toBeDefined()
  })

  // Tests that the name of the field can be retrieved.
  it('test_getting_name_of_field', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    })
    const field = new ZodFieldStore(schema, 'name', 'John')
    expect(field.name).toBe('name')
  })

  // Tests that a new instance of ZodFieldStore cannot be created with invalid parameters.
  it('test_creating_new_instance_with_invalid_parameters', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    })
    expect(() => new ZodFieldStore(schema, 'invalid' as 'name', 'John')).toThrow()
  })

  // Tests that the value of the field can be updated.
  it('test_updating_value_of_field', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    })
    const field = new ZodFieldStore(schema, 'name', 'John')
    field.handleUpdate(() => 'Jane')
    expect(get(field.value)).toBe('Jane')
  })

  // Tests that a change event on the field can be handled.
  it('test_handling_change_event_on_field', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    })
    const field = new ZodFieldStore(schema, 'name', 'John')

    const elm = document.createElement('input')
    elm.addEventListener('change', field.handleChange)
    elm.setAttribute('value', 'Jane')
    elm.dispatchEvent(new Event('change'))

    expect(get(field.value)).toBe('Jane')
  })

  it('test_handling_custom_event_on_field', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    })
    const field = new ZodFieldStore(schema, 'name', 'John')

    const elm = document.createElement('input')
    elm.addEventListener('custom', field.handleChange)

    elm.dispatchEvent(new CustomEvent('custom', { detail: 'Jane' as unknown as object }))
    expect(get(field.value)).toBe('Jane')

    elm.dispatchEvent(new CustomEvent('custom', { detail: { value: 'Mary' } }))
    expect(get(field.value)).toBe('Mary')
  })

  // Tests that an error message can be set on the field.
  it('test_setting_error_message_on_field', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    })
    const field = new ZodFieldStore(schema, 'age', 'John')
    field.handleChange({ target: { value: 'not a number' } })
    expect(field.error).not.toBe('')
  })
})
