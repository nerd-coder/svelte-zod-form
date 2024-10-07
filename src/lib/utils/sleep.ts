/**
 * Async wait
 */
export const sleep = (milliseconds: number): Promise<void> => {
  return new Promise(res => setTimeout(res, milliseconds))
}
