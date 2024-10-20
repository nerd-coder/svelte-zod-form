import { render } from '@testing-library/svelte'
import { userEvent } from '@testing-library/user-event'

import AutoSubmitPage from '../src/routes/auto-submit/+page.svelte'
import { getElement } from './test-utils.ts'
import { sleep } from '$lib/utils/sleep.ts'

const user = userEvent.setup()
let container: HTMLElement

beforeEach(() => {
  const { container: renderedContainer } = render(AutoSubmitPage)
  container = renderedContainer
})

test('should auto submit form', async () => {
  const email = getElement(container, 'input[name="email"]', HTMLInputElement)
  const pass = getElement(container, 'input[name="pass"]', HTMLInputElement)
  const submit = getElement(container, 'button[type="submit"]', HTMLButtonElement)

  await user.type(email, 'test@mail.com')
  await user.type(pass, '1234')

  await sleep(350)
  expect(submit.disabled).toBe(true)
})
