import { test, expect } from 'vitest'
import { z } from 'zod'
import { get } from 'svelte/store'

import { ZodFormStore } from '../main'

const schema = z.object({ email: z.string().email(), pass: z.string().min(4) })

test('should have undefined as initital values', () => {
  const form = new ZodFormStore(schema)

  expect(get(form.fields.email.value)).toBe(undefined)
  expect(get(form.fields.pass.value)).toBe(undefined)
})

test('should hold initital values, even if invalid', () => {
  const form = new ZodFormStore(schema, {
    initialValue: {
      email: 'this is invalid email',
      pass: '123',
    },
  })

  expect(get(form.fields.email.value)).toBe('this is invalid email')
  expect(get(form.fields.pass.value)).toBe('123')
})

test('should show no error, even if initital values is invalid', () => {
  const form = new ZodFormStore(schema, {
    initialValue: {
      email: 'this is invalid email',
      pass: '123',
    },
  })

  expect(get(form.fields.email.error)).toBe('')
  expect(get(form.fields.pass.error)).toBe('')
})

test('should update vaule when changed', () => {
  const form = new ZodFormStore(schema)
  const field = form.fields.email

  const email = 'me@toan.io'
  field.handleChange(email)

  expect(get(field.value)).toBe(email)
})

test('should have error message about email', () => {
  const form = new ZodFormStore(schema)

  expect(get(form.fields.email.error)).toBe('')

  form.fields.email.handleChange('abcdef')

  expect(get(form.fields.email.error)).toBe('Invalid email')
})

test('should show error message only when dirty', () => {
  const form = new ZodFormStore(schema, { initialValue: { email: 'abcdf' } })

  expect(get(form.fields.email.error)).toBe('')

  form.fields.email.handleBlur()

  expect(get(form.fields.email.error)).toBe('Invalid email')
})

test('should reset', () => {
  const form = new ZodFormStore(schema)

  expect(get(form.fields.email.value)).toBe(undefined)
  expect(get(form.fields.pass.value)).toBe(undefined)

  form.fields.email.handleChange('abc@mail.com')
  form.fields.pass.handleChange('123123')

  expect(get(form.fields.email.value)).toBe('abc@mail.com')
  expect(get(form.fields.pass.value)).toBe('123123')

  form.reset()

  expect(get(form.fields.email.value)).toBe(undefined)
  expect(get(form.fields.pass.value)).toBe(undefined)
})

test('should reset to initial values', () => {
  const form = new ZodFormStore(schema, {
    initialValue: {
      email: 'abc',
      pass: '123',
    },
  })

  expect(get(form.fields.email.value)).toBe('abc')
  expect(get(form.fields.pass.value)).toBe('123')

  form.fields.email.handleChange('abc@mail.com')
  form.fields.pass.handleChange('123123')

  expect(get(form.fields.email.value)).toBe('abc@mail.com')
  expect(get(form.fields.pass.value)).toBe('123123')

  form.reset()

  expect(get(form.fields.email.value)).toBe('abc')
  expect(get(form.fields.pass.value)).toBe('123')
})
