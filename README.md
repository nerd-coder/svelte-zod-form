# 🌵 Svelte Zod Form

[![version](https://img.shields.io/npm/v/@nerd-coder/svelte-zod-form)](https://www.npmjs.com/package/@nerd-coder/svelte-zod-form)
![license](https://img.shields.io/github/license/nerd-coder/svelte-zod-form)
[![codecov](https://codecov.io/gh/nerd-coder/svelte-zod-form/branch/main/graph/badge.svg?token=60IHHKQJ1Y)](https://codecov.io/gh/nerd-coder/svelte-zod-form)

Building forms with breeze, using Svelte + Zod

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

Full example: [Svelte REPL](https://svelte.dev/repl/33ff009d317745a389663c61ab228538)

## Features

- Use Svelte native stores
- Fast - only update what changed
- Minimal - only **~1.22Kb** in size (gzipped)
- Build-in validation using Zod
- Typescript

## Extra

Why the catus?

\> For it resilience

## TODO

- More tests
- Support Array
