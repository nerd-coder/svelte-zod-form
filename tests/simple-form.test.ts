import { z } from 'zod'
import { get } from 'svelte/store'

import { ZodFormStore } from '../src/lib/index.ts'

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

  expect(get(form.stores.email_value)).toBe(undefined)
  expect(get(form.stores.pass_value)).toBe(undefined)
})

test('should hold initital values, even if invalid', () => {
  const form = new ZodFormStore(schema, {
    initialValue: {
      email: 'this is invalid email',
      pass: '123',
    },
  })

  expect(get(form.stores.email_value)).toBe('this is invalid email')
  expect(get(form.stores.pass_value)).toBe('123')
})

test('should update vaule when changed', () => {
  const form = new ZodFormStore(schema)
  const email = 'me@toan.io'
  form.fields.email.setValue(email)

  expect(get(form.stores.email_value)).toBe(email)
})

test('should have error message about email', () => {
  const form = new ZodFormStore(schema)

  form.fields.email.setValue('abcdef')

  expect(get(form.stores.email_error)).toBe('Invalid email')
})

test('should reset', () => {
  const form = new ZodFormStore(schema)

  expect(get(form.stores.email_value)).toBe(undefined)
  expect(get(form.stores.pass_value)).toBe(undefined)

  form.fields.email.setValue('abc@mail.com')
  form.fields.pass.setValue('123123')

  expect(get(form.stores.email_value)).toBe('abc@mail.com')
  expect(get(form.stores.pass_value)).toBe('123123')

  form.reset()

  expect(get(form.stores.email_value)).toBe(undefined)
  expect(get(form.stores.pass_value)).toBe(undefined)
})

test('should reset to initial values', () => {
  const form = new ZodFormStore(schema, {
    initialValue: {
      email: 'abc',
      pass: '123',
    },
  })

  expect(get(form.stores.email_value)).toBe('abc')
  expect(get(form.stores.pass_value)).toBe('123')

  form.fields.email.setValue('abc@mail.com')
  form.fields.pass.setValue('123123')

  expect(get(form.stores.email_value)).toBe('abc@mail.com')
  expect(get(form.stores.pass_value)).toBe('123123')

  form.reset()

  expect(get(form.stores.email_value)).toBe('abc')
  expect(get(form.stores.pass_value)).toBe('123')
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
  form.fields.email.setValue('abc')
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
  form.fields.email.setValue('abc')
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

  expect(get(form.stores.pass_verify_error)).toBe('Passwords does not match')
  expect(get(form.errors)).to.be.instanceOf(Array).and.include('Passwords does not match')
  expect(get(form.error)).toBe('')
})

test('should show error throwed in onSubmit handler', () => {
  const form = new ZodFormStore(schema, {
    initialValue: {
      email: 'abc@mail.com',
      pass: '12345',
      pass_verify: '12345',
    },
    onSubmit: () => {
      throw new Error('failed')
    },
  })

  form.triggerSubmit()

  expect(get(form.errors)).to.be.instanceOf(Array).and.include('failed')
  expect(get(form.error)).toBe('failed')
})

test('should not trigger onSubmit handler if there is any field error(s)', () => {
  const form = new ZodFormStore(schema, {
    initialValue: {
      email: '-----',
      pass: '1234',
      pass_verify: '1234',
    },
    onSubmit: async v => console.log('submitted', v),
  })

  const spy = vi.spyOn(form.options, 'onSubmit')

  form.triggerSubmit()

  expect(spy).not.toBeCalled()
  expect(get(form.stores.email_error)).toBe('Invalid email')
})

test('should do nothing if setting the wrong field', () => {
  const form = new ZodFormStore(schema, {
    initialValue: {
      email: 'me@mail.com',
      pass: '1234',
      pass_verify: '1234',
    },
    onSubmit: async v => console.log('submitted', v),
  })

  form.setError('failed', ['abc'])

  expect(get(form.errors)).to.be.instanceOf(Array).and.lengthOf(0)
})

test('should have error returned from `onSubmit` handler', async () => {
  const form = new ZodFormStore(schema, {
    initialValue: {
      email: 'me@mail.com',
      pass: '1234',
      pass_verify: '1234',
    },
    onSubmit: () => 'submitted failed',
  })

  await form.triggerSubmit()

  expect(get(form.error)).toBe('submitted failed')
  expect(get(form.errors)).to.be.instanceOf(Array).and.include('submitted failed')
})

test('should have error returned from `onSubmit` handler (async)', async () => {
  const form = new ZodFormStore(schema, {
    initialValue: {
      email: 'me@mail.com',
      pass: '1234',
      pass_verify: '1234',
    },
    onSubmit: async () => 'submitted failed',
  })

  await form.triggerSubmit()

  expect(get(form.error)).toBe('submitted failed')
  expect(get(form.errors)).to.be.instanceOf(Array).and.include('submitted failed')
})

test('should have error if have no initial value', async () => {
  const form = new ZodFormStore(schema, { onSubmit: async () => {} })
  expect(get(form.valid)).toBe(false)
  await form.triggerSubmit()
  expect(get(form.valid)).toBe(false)
  expect(get(form.errors)).toContain('Required')
})

test('should not trigger submit if having error', async () => {
  const form = new ZodFormStore(schema, { onSubmit: async () => {} })
  const spy = vi.spyOn(form.options, 'onSubmit')
  expect(get(form.valid)).toBe(false)
  await form.triggerSubmit()
  expect(get(form.valid)).toBe(false)
  expect(spy).toBeCalledTimes(0)
})
