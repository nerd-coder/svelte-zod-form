# 🌵 Svelte Zod Form

[![version](https://img.shields.io/npm/v/@nerd-coder/svelte-zod-form)](https://www.npmjs.com/package/@nerd-coder/svelte-zod-form)
![license](https://img.shields.io/github/license/nerd-coder/svelte-zod-form)
![bundlejs](https://deno.bundlejs.com/?q=@nerd-coder/svelte-zod-form&badge=)
[![codecov](https://codecov.io/gh/nerd-coder/svelte-zod-form/branch/main/graph/badge.svg?token=60IHHKQJ1Y)](https://codecov.io/gh/nerd-coder/svelte-zod-form)

Building forms in Svelte with breeze, using [Zod](https://zod.dev/)

## Example

[REPL: Simple login form](https://svelte.dev/repl/33ff009d317745a389663c61ab228538)
[![REPL: Simple login form](docs/screenshot-01.png)](<(https://svelte.dev/repl/33ff009d317745a389663c61ab228538)>)

## Installation

```sh
npm i @nerd-coder/svelte-zod-form
```

## How to use

First you need to create a Zod's schema

```ts
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  pass: z.string().min(4),
})
```

Then pass the schem to `ZodFormStore`:

```ts
const form = new ZodFormStore(loginSchema, { onSubmit: (v) => console.log('Submitted values:', v) })
```

All the field's handler, value will be generated and typed for you:

```ts
// We need pull the generated field store out, in order
// to use the Svelte's "auto subscription" feature "$"
const {
  email_value,
  email_error,
  email_dirty,
  email_handleChange,
  email_handleBlur,
  pass_value,
  pass_error,
  pass_dirty,
  pass_handleChange,
  pass_handleBlur,
} = form.stores
```

Fianlly, use it in html

```svelte
<form on:submit|preventDefault={form.triggerSubmit}>
  <fieldset>
    <input
      name="email"
      on:input={email_handleChange}
      on:blur={email_handleBlur}
      value={$email_value || ''}
      class:invalid={!!$email_error}
      class:valid={!$email_error && !!$email_dirty}
    />
    {#if $email_error}<p>{$email_error}</p>{/if}
  </fieldset>

  <fieldset>
    <input
      name="pass"
      type="password"
      on:input={pass_handleChange}
      on:blur={pass_handleBlur}
      value={$pass_value || ''}
      class:invalid={!!$pass_error}
      class:valid={!$pass_error && !!$pass_dirty}
    />
    {#if $pass_error}<p>{$pass_error}</p>{/if}
  </fieldset>

  <button type="submit">Sign In</button>
</form>
```

## Configuration

### `initialValue`

- type: `Partial<T>`
- required: `false`
- default: `undefined`

The initial data in the form. Will revert to this value if call `form.reset`.

```ts
const form = new ZodFormStore(schema, {
  initialValue: { email: 'my@email.com' },
  ...
})
```

### `onSubmit`

- type: `(v: T) => Promise<void | string> | string | void`
- required: `true`

Async callback to handle submmition of the form. Should return nothing, or an `string` contain error message

```ts
const form = new ZodFormStore(schema, {
  onSubmit: (values) => console.log('Submitted values:', values),
  ...
})
```

### `autoSubmitAfter`

- type: `number`
- required: `false`
- default: `undefined`

Auto trigger submit when any data changed, after the delay in `ms`.
Passing falsy value (`0` or `undefined`) to disabled.

```ts
const form = new ZodFormStore(schema, {
  autoSubmitAfter: 200,
  ...
})
```

### `debounceDelay`

- type: `number`
- required: `false`
- default: `undefined`

Debounce the value update, in `ms`.
Passing falsy value (`0` or `undefined`) to disabled.

```ts
const form = new ZodFormStore(schema, {
  debounceDelay: 200,
  ...
})
```

### `debug`

- type: `boolean`
- required: `false`
- default: `false`

Print various debug messages.

```ts
const form = new ZodFormStore(schema, {
  debug: true,
  ...
})
```

## API

| Prop          | Type                             | Description                                                                                                       |
| ------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| model         | `Readable<T>`                    | Form's data. Will be passed to onSubmit handler                                                                   |
| options       | `readonly ICreateFormOptions<T>` | Form settings. Should not be update                                                                               |
| triggerSubmit | `() => Promise<void>`            | Function to start parsing, validating and submit the form's data                                                  |
| reset         | `() => void`                     | Function to reset the form to original state.                                                                     |
| submitting    | `Readable<boolean>`              | True of submitting the form.                                                                                      |
| error         | `Readable<string>`               | Error message returned from `onSubmit` handler, or custom validation message.                                     |
| errors        | `Readable<string[]>`             | Array of string contains all error messages (including fields's errors and error return from `onSubmit` handler). |
| dirty         | `Readable<boolean>`              | Indicate if the form is edited or submitted.                                                                      |
| valid         | `Readable<boolean>`              | Indicate if the form is valid.                                                                                    |
| stores        | `object`                         | Generated fields's stores. Each field will contain the set of prop below:                                         |

### Generated stores's props

| Prop                               | Type                                         | Description                          |
| ---------------------------------- | -------------------------------------------- | ------------------------------------ |
| stores._"fieldname"_\_value        | `Readable<T['fieldname']>`                   | Readable store holding field's value |
| stores._"fieldname"_\_touched      | `Readable<boolean>`                          | The field have been touched or not   |
| stores._"fieldname"_\_dirty        | `Readable<boolean>`                          | The field value been changed or not  |
| stores._"fieldname"_\_error        | `Readable<boolean>`                          | The field validation error, if any   |
| stores._"fieldname"_\_valid        | `Readable<boolean>`                          | The field value is valid or not      |
| stores._"fieldname"_\_handleUpdate | `(updater: Updater<T['fieldname']>) => void` | Callback to update field's value     |
| stores._"fieldname"_\_handleChange | `(e: unknown) => void`                       | Callback to update field's value     |
| stores._"fieldname"_\_handleBlur   | `() => void`                                 | Callback to mark field as touched    |
| stores._"fieldname"_\_reset        | `() => void`                                 | Reset field to original state        |
| stores._"fieldname"_\_setError     | `(e: string) => void`                        | Set custom field error               |
| stores._"fieldname"_\_setTouched   | `(v: boolean) => void`                       | Update touched state                 |

## Features

- Use Svelte native stores
- Fast: only update what changed, and you only subscribe to what you need
- Minimal - only **~1.55Kb** in size (gzipped)
- Build-in validation using Zod
- Typescript

## Extra

Why the catus?

\> For it resilience

## TODO

- More tests
- Support Array
