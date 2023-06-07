import { Window } from 'happy-dom'

export function polyfillDOM() {
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
  for (const key of keys) global[key] = window[key]
  self.requestAnimationFrame = setTimeout
}
