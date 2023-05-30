# svelte-zod-Form

Building forms with breeze in Svelte

## Installation

```sh
npm i @nerd-coder/svelte-zod-Form
```

## How to use

First you need to create a Zod's schema

```ts
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  pass: z.string()
})
```

Then pass the schem to `ZodFormStore`:

```ts
const form = new ZodFromStore(loginSchema)
```

All the field's handler, value will be generated and typed for you:

```ts
// We need pull the generated field store out, in order
// to use the Svelte's "auto subscription" feature "$"
const email_value = form.fields.email.value
const email_error = form.fields.email.error
const pass_value = form.fields.pass.value
const pass_error = form.fields.pass.error
```

Fianlly, use it in html

```html
<form>
  <fieldset>
    <input
      name='email'
      on:input={form.fields.email.handleChange}
      on:blur={form.fields.email.handleBlur}
      value={$email_value}
    />
    {#if $email_error}<p>{$email_error}<p>{/if}
  </fieldset>
  <fieldset>
    <input
      name='pass'
      type='password'
      on:input={form.fields.pass.handleChange}
      on:blur={form.fields.pass.handleBlur}
      value={$pass_value}
    />
    {#if $pass_error}<p>{$pass_error}<p>{/if}
  </fieldset>
</form>
```
