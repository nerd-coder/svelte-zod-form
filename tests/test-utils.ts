import { Window } from 'happy-dom'

export function polyfillDOM(): void {
  const window = new Window()
  const keys = [
    'self',
    'window',
    'document',
    'Event',
    'CustomEvent',
    'HTMLElement',
    'HTMLInputElement',
    'HTMLUnknownElement',
    'customElements',
  ]
  // @ts-expect-error We're doing monkey patching here
  for (const key of keys) global[key] = window[key]
  self.requestAnimationFrame = setTimeout
}
