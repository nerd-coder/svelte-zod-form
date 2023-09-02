<script lang="ts">
  import { z } from 'zod'
  import { sleep } from 'radash'
  import { ZodFormStore } from '@nerd-coder/svelte-zod-form'

  const loginSchema = z.object({
    email: z.string().email(),
    pass: z.string().min(4, 'Pass must have more than 4 letters'),
  })
  const form = new ZodFormStore(loginSchema, {
    debug: true,
    onSubmit: async (v) => {
      await sleep(2000) // fake delay to simutate api call
      console.log('Submitted values:', v)
    },
  })

  // We need pull the generated field store out, in order
  // to use the Svelte's "auto subscription" feature "$"
  const {
    email_value,
    email_error,
    email_valid,
    email_dirty,
    email_touched,
    pass_value,
    pass_error,
    pass_dirty,
    pass_touched,
  } = form.stores

  const { submitting, valid, model, fields } = form
</script>

<form on:submit|preventDefault={form.triggerSubmit} on:reset={form.reset}>
  <fieldset>
    <input
      name="email"
      on:input={fields.email.handleChange}
      on:blur={fields.email.handleBlur}
      placeholder="Email"
      value={$email_value || ''}
      class:invalid={!$email_valid && $email_touched}
      class:valid={$email_valid && $email_dirty}
    />
    {#if $email_error && $email_touched}<p>{$email_error}</p>{/if}
  </fieldset>

  <fieldset>
    <input
      name="pass"
      type="password"
      placeholder="Password"
      on:input={fields.pass.handleChange}
      on:blur={fields.pass.handleChange}
      value={$pass_value || ''}
      class:invalid={!!$pass_error && $pass_touched}
      class:valid={!$pass_error && !!$pass_dirty}
    />
    {#if $pass_error && $pass_touched}<p>{$pass_error}</p>{/if}
  </fieldset>

  <button type="submit" disabled={!$valid || $submitting}>
    {$submitting ? 'Submiting...' : 'Submit'}
  </button>
  <button type="reset">Reset</button>
</form>

<pre>
valid: {$valid}
submitting: {$submitting}
model: {JSON.stringify($model, null, 2)}
</pre>

<style>
  fieldset {
    border: none;
    padding: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  p {
    color: red;
    font-size: 0.8rem;
  }
  input.invalid {
    border-color: red;
  }
  input.valid {
    border-color: green;
  }

  input,
  button {
    padding: 0.4em;
    margin: 0 0 0.5em 0;
    box-sizing: border-box;
    border: 1px solid #ccc;
    border-radius: 2px;
  }

  pre {
    margin: 12px 0;
    padding: 8px;
    background-color: whitesmoke;
    color: darkgray;
    border-radius: 4px;
    font-size: small;
  }
</style>
