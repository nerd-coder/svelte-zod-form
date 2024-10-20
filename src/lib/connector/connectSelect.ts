import type { ZodFieldStore } from '@nerd-coder/svelte-zod-form'
import type { ActionReturn } from 'svelte/action'
import { derived } from 'svelte/store'
import type { z } from 'zod'

type TSupportedElement = HTMLSelectElement

/**
 * Connects a select element to a ZodFieldStore, enabling automatic synchronization
 * of the select's value with the store and handling of input events.
 */
export function connectSelect<K extends Extract<keyof O, string>, A extends z.ZodRawShape, O = A>(
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
  const { value, handleChange, handleBlur } = store
  const handleSelectChange = node.multiple
    ? (e: Event) => {
        const elm = e.target as TSupportedElement
        const val = Array.from(elm.selectedOptions).map(a => a.value)
        handleChange(val)
      }
    : handleChange

  node.addEventListener('input', handleSelectChange)
  node.addEventListener('blur', handleBlur)

  const unsubscribes = [
    value.subscribe(v => {
      if (typeof v === 'undefined') node.value = ''
      else if (typeof v === 'string') node.value = v
      else if (Array.isArray(v)) for (const o of node.options) o.selected = v.includes(o.value)
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

  const destroy = () => {
    unsubscribes.forEach(a => a())
    node.removeEventListener('input', handleSelectChange)
    node.removeEventListener('blur', handleBlur)
  }

  return destroy
}
