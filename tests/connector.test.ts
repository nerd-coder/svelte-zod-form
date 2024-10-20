import { fireEvent, render } from '@testing-library/svelte'
import { userEvent } from '@testing-library/user-event'

import Example3 from '../src/routes/example3/+page.svelte'

const user = userEvent.setup()
let container: HTMLElement

beforeEach(() => {
  const { container: renderedContainer } = render(Example3)
  container = renderedContainer
})

function getElements(container: HTMLElement) {
  const formElement = container.querySelector('form')
  expect(formElement).not.toBeNull()
  if (!formElement) throw new Error('form element not found')

  const emailInput = formElement.querySelector('input[name="email"]')
  expect(emailInput).not.toBeNull()
  if (!emailInput || !(emailInput instanceof HTMLInputElement))
    throw new Error('email input not found')

  const passInput = formElement.querySelector('input[name="pass"]')
  expect(passInput).not.toBeNull()
  if (!passInput || !(passInput instanceof HTMLInputElement))
    throw new Error('pass input not found')

  const submitBtn = formElement.querySelector('button[type=submit]')
  expect(submitBtn).not.toBeNull()
  if (!submitBtn || !(submitBtn instanceof HTMLButtonElement))
    throw new Error('pass input not found')

  return { formElement, emailInput, passInput, submitBtn }
}

test('should show valid and invalid', async () => {
  const { emailInput, passInput, submitBtn } = getElements(container)

  expect(emailInput.classList.contains('valid')).toBe(false)
  expect(passInput.classList.contains('valid')).toBe(false)
  expect(emailInput.classList.contains('invalid')).toBe(false)
  expect(passInput.classList.contains('invalid')).toBe(false)
  expect(submitBtn.disabled).toBe(true)

  // make emailInput invalid
  await user.type(emailInput, 'abcde')
  await fireEvent.blur(emailInput)

  expect(emailInput.classList.contains('invalid')).toBe(true)
  expect(emailInput.classList.contains('valid')).toBe(false)

  // make emailInput valid
  await user.clear(emailInput)
  await user.type(emailInput, 'test@email.com')
  await fireEvent.blur(emailInput)

  expect(emailInput.classList.contains('invalid')).toBe(false)
  expect(emailInput.classList.contains('valid')).toBe(true)

  // make passInput invalid
  await user.type(passInput, 'abc')
  await fireEvent.blur(passInput)

  expect(passInput.classList.contains('invalid')).toBe(true)
  expect(passInput.classList.contains('valid')).toBe(false)

  // make passInput valid
  await user.clear(passInput)
  await user.type(passInput, 'ValidPass123!')
  await fireEvent.blur(passInput)

  expect(passInput.classList.contains('invalid')).toBe(false)
  expect(passInput.classList.contains('valid')).toBe(true)

  // submit button should be enabled
  expect(submitBtn.disabled).toBe(false)
})
