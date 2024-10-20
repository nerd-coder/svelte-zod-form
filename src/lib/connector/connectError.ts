import type { ZodFieldStore } from '@nerd-coder/svelte-zod-form'
import type { ActionReturn } from 'svelte/action'
import { derived } from 'svelte/store'
import type { z } from 'zod'

type TSupportedElement = HTMLParagraphElement | HTMLSpanElement | HTMLDivElement

/**
 * Connects an error feedback element to a ZodFieldStore, enabling automatic show/hide
 * of the error message with the field store.
 */
export function connectError<K extends Extract<keyof O, string>, A extends z.ZodRawShape, O = A>(
  node: TSupportedElement,
  param: ZodFieldStore<K, A, O>
): ActionReturn<ZodFieldStore<K, A, O>> {
  let cleanup = initialize(node, param)

  return {
    destroy: () => cleanup(),
    update: nextParams => {
      cleanup()
      cleanup = initialize(node, nextParams)
    },
  }
}

function initialize<K extends Extract<keyof O, string>, A extends z.ZodRawShape, O = A>(
  node: TSupportedElement,
  param: ZodFieldStore<K, A, O>
) {
  return derived([param.error, param.touched], ([a, b]) => [a, b]).subscribe(([error, touched]) => {
    if (typeof error === 'string' && error && touched) {
      node.innerText = error
      node.style.display = ''
    } else {
      node.innerText = ''
      node.style.display = 'none'
    }
  })
}
