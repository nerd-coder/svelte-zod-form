import type { ZodFieldStore } from '@nerd-coder/svelte-zod-form'
import type { ActionReturn } from 'svelte/action'
import { derived } from 'svelte/store'
import type { z } from 'zod'

type TSupportedElement = HTMLInputElement | HTMLTextAreaElement

/**
 * Connects an input element to a ZodFieldStore, enabling automatic synchronization
 * of the input's value with the store and handling of input events.
 *
 * Supports text inputs and textareas.
 */
export function connectInput<K extends Extract<keyof O, string>, A extends z.ZodRawShape, O = A>(
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
  store: ZodFieldStore<K, A, O>
) {
  const { handleChange, handleBlur } = store

  node.addEventListener('input', handleChange)
  node.addEventListener('blur', handleBlur)

  const unsubscribes = [
    // Sync value to node
    store.value.subscribe(v => {
      if (typeof v === 'undefined') node.value = ''
      else if (typeof v === 'string') node.value = v
      else if (v instanceof Date) node.value = v.toISOString()
      else console.log('⚠️ Unsupported type')
      // TODO: handle other types
    }),
    // Set 'invalid' class
    derived([store.error, store.touched], ([a, b]) => [a, b]).subscribe(([error, touched]) =>
      node.classList.toggle('invalid', Boolean(error && touched))
    ),
    // Set 'valid' class
    derived([store.error, store.dirty], ([a, b]) => [a, b]).subscribe(([error, dirty]) =>
      node.classList.toggle('valid', Boolean(!error && dirty))
    ),
  ]

  const cleanup = () => {
    unsubscribes.forEach(a => a())
    node.removeEventListener('input', handleChange)
    node.removeEventListener('blur', handleBlur)
  }

  return cleanup
}
