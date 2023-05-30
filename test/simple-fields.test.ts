import { test, expect } from 'vitest'
import { z } from 'zod'
import { get } from 'svelte/store'

import { ZodFormStore } from '../src/main'

test('should update vaule when changed', () => {
  const schema = z.object({ email: z.string() })
  const form = new ZodFormStore(schema)
  const field = form.fields.email

  const email = 'me@toan.io'
  field.handleChange(email)

  expect(get(field.value)).toBe(email)
})

test('should have error message about email', () => {
  const wrongEmailMsg = 'Must in email format'
  const schema = z.object({ email: z.string().email(wrongEmailMsg) })
  const form = new ZodFormStore(schema)
  const field = form.fields.email

  const email = 'abcdef'

  expect(get(field.error)).toBe('')

  field.handleChange(email)

  expect(get(field.error)).toBe(wrongEmailMsg)
})
