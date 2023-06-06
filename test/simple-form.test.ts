import { test, expect, vi } from 'vitest'
import { z } from 'zod'
import { get } from 'svelte/store'

import { ZodFormStore } from '../src'

const schema = z
  .object({
    email: z.string().email(),
    pass: z.string().min(4),
    pass_verify: z.string(),
  })
  .refine(({ pass, pass_verify }) => pass === pass_verify, {
    message: 'Passwords does not match',
    path: ['pass_verify'],
  })

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

test('should update vaule when changed', () => {
  const form = new ZodFormStore(schema)
  const field = form.fields.email

  const email = 'me@toan.io'
  field.handleChange(email)

  expect(get(field.value)).toBe(email)
})

test('should have error message about email', () => {
  const form = new ZodFormStore(schema)

  form.fields.email.handleChange('abcdef')

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

test('should start with no dirty ', () => {
  const form = new ZodFormStore(schema, {
    initialValue: {
      email: 'abc',
      pass: '123',
    },
  })
  expect(get(form.dirty)).toBe(false)
})

test('should dirty after trying to submit ', () => {
  const form = new ZodFormStore(schema, {
    initialValue: {
      email: 'abc',
      pass: '123',
    },
  })
  form.triggerSubmit()
  expect(get(form.dirty)).toBe(true)
})

test('should dirty after setting any field', () => {
  const form = new ZodFormStore(schema, {
    initialValue: {
      email: 'abc',
      pass: '123',
    },
  })
  form.fields.email.handleChange('abc')
  expect(get(form.dirty)).toBe(true)
})

test('should not dirty if do other things', () => {
  const form = new ZodFormStore(schema, {
    initialValue: {
      email: 'abc',
      pass: '123',
    },
  })
  form.fields.email.handleBlur()

  expect(get(form.dirty)).toBe(false)
})

test('should not dirty after reset', () => {
  const form = new ZodFormStore(schema, {
    initialValue: {
      email: 'abc',
      pass: '123',
    },
  })
  form.fields.email.handleChange('abc')
  expect(get(form.dirty)).toBe(true)
  form.reset()
  expect(get(form.dirty)).toBe(false)
})

test('should valid', () => {
  const form = new ZodFormStore(schema, {
    initialValue: {
      email: 'abc@mail.com',
      pass: '1234',
      pass_verify: '1234',
    },
    onSubmit: async v => console.log('submitted', v),
  })

  const spy = vi.spyOn(form.options, 'onSubmit')

  form.triggerSubmit()

  expect(spy).toBeCalled()
  expect(get(form.errors)).to.be.instanceOf(Array).and.lengthOf(0)
})

test('should show verify password error', () => {
  const form = new ZodFormStore(schema, {
    initialValue: {
      email: 'abc@mail.com',
      pass: '1234',
      pass_verify: '12345',
    },
    onSubmit: async v => console.log('submitted', v),
  })

  form.triggerSubmit()

  expect(get(form.fields.pass_verify.error)).toBe('Passwords does not match')
  expect(get(form.errors)).to.be.instanceOf(Array).and.include('Passwords does not match')
  expect(get(form.error)).toBe('')
})
