/**
 * Async wait
 */
export const sleep = (milliseconds: number): Promise<void> =>
  new Promise(res => setTimeout(res, milliseconds))
