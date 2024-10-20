import type { ZodFormStore } from '@nerd-coder/svelte-zod-form'
import type { ActionReturn } from 'svelte/action'
import { derived } from 'svelte/store'
import type { z } from 'zod'

type TSupportedElement = HTMLButtonElement

/**
 * Connects a button element to a ZodFormStore, enabling automatic synchronization
 * of the button's disabled state with the store and handling of submit events.
 */
export function connectSubmit<A extends z.ZodRawShape, O extends object = A>(
  node: TSupportedElement,
  param: ZodFormStore<A, O>
): ActionReturn<ZodFormStore<A, O>> {
  let cleanup = initialize(node, param)

  return {
    destroy: () => cleanup(),
    update: nextParams => {
      cleanup()
      cleanup = initialize(node, nextParams)
    },
  }
}

function initialize<A extends z.ZodRawShape, O extends object = A>(
  node: TSupportedElement,
  store: ZodFormStore<A, O>
) {
  // Subscribe to the value store
  return derived([store.valid, store.submitting], ([a, b]) => [a, b]).subscribe(
    ([valid, submitting]) => {
      node.disabled = !valid || submitting
    }
  )
}
