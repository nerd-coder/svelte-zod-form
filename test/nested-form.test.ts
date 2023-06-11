import { z } from 'zod'
import { get } from 'svelte/store'

import { ZodFormStore } from '../src/lib'

const schema = z.object({
  name: z.string(),
  address: z.string(),
  founders: z.array(
    z.object({
      name: z.string(),
      age: z.number(),
      socials: z.array(
        z.object({
          type: z.enum(['facebook', 'linkedin']),
          link: z.string().nonempty('Invalid social link'),
        })
      ),
    })
  ),
})

test('should have undefined as initital values', () => {
  const form = new ZodFormStore(schema)

  expect(get(form.fields.name.value)).toBe(undefined)
  expect(get(form.fields.address.value)).toBe(undefined)
  expect(get(form.fields.founders.value)).toBe(undefined)
})

test('should valid', () => {
  const form = new ZodFormStore(schema, {
    initialValue: {
      name: '',
      address: '',
      founders: [
        {
          name: '',
          age: 0,
          socials: [
            { type: 'facebook', link: '' },
            { type: 'linkedin', link: '' },
          ],
        },
      ],
    },
    onSubmit: () => '',
  })

  form.triggerSubmit()

  expect(get(form.error)).toBe('')
  expect(get(form.fields.founders.error)).toBe('Invalid social link')
})
