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

  expect(get(form.stores.name_value)).toBe(undefined)
  expect(get(form.stores.address_value)).toBe(undefined)
  expect(get(form.stores.founders_value)).toBe(undefined)
})

test('should valid', async () => {
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

  await form.triggerSubmit()

  expect(get(form.error)).toBe('')
  expect(get(form.stores.founders_error)).toBe('Invalid social link')
})
