import { ZodError } from 'zod'
import { getErrorMessage } from '../src/lib/utils.ts'

// Positive test case
test('Positive: getErrorMessage returns string for valid input', () => {
  const result = getErrorMessage('This is a valid input')
  expect(typeof result).toBe('string')
})

// Positive test case
test('Positive: getErrorMessage returns string for Error instance', () => {
  const error = new Error('This is an error')
  const result = getErrorMessage(error)
  expect(typeof result).toBe('string')
})

// Positive test case
test('Positive: getErrorMessage returns string for ZodError instance', () => {
  const error = new ZodError([])
  const result = getErrorMessage(error)
  expect(typeof result).toBe('string')
})

// Positive test case
test('Positive: getErrorMessage returns string for JSON input', () => {
  const result = getErrorMessage({ message: 'This is a JSON input' })
  expect(typeof result).toBe('string')
  expect(result).toBe(JSON.stringify({ message: 'This is a JSON input' }))
})

// Positive test case
test('Positive: getErrorMessage returns empty string for `null` input', () => {
  const result = getErrorMessage(null)
  expect(result).toBe('')
})

// Positive test case
test('Positive: getErrorMessage returns empty string for undefined input', () => {
  const result = getErrorMessage(undefined)
  expect(result).toBe('')
})

// Edge test case
test('Edge: getErrorMessage returns empty string for empty ZodError issues', () => {
  const error = new ZodError([])
  const result = getErrorMessage(error)
  expect(result).toBe('')
})
