import { fireEvent, render } from '@testing-library/svelte'
import { userEvent } from '@testing-library/user-event'

import RegisterPage from '../src/routes/register/+page.svelte'
import { getElement } from './test-utils.ts'

const user = userEvent.setup()
let container: HTMLElement

beforeEach(() => {
  const { container: renderedContainer } = render(RegisterPage)
  container = renderedContainer
})

test('should show valid and invalid', async () => {
  const formElement = getElement(container, 'form', HTMLFormElement)
  const emailInput = getElement(formElement, 'input[name="email"]', HTMLInputElement)
  const passInput = getElement(formElement, 'input[name="pass"]', HTMLInputElement)
  const acceptCheckbox = getElement(formElement, 'input[name="acceptTerms"]', HTMLInputElement)
  const submitBtn = getElement(formElement, 'button[type=submit]', HTMLButtonElement)

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

  // tick the accept checkbox
  await user.click(acceptCheckbox)

  // submit button should be enabled
  expect(submitBtn.disabled).toBe(false)
})
