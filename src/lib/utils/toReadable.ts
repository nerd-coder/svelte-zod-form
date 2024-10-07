import { derived, type Readable, type Writable } from 'svelte/store'

export const toReadable = <T>(w: Writable<T>): Readable<T> => derived(w, a => a)
