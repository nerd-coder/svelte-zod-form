<script lang="ts">
  import { z } from 'zod'
  import { connectInput, connectSubmit, ZodFormStore } from '@nerd-coder/svelte-zod-form'
  import { sleep } from '$lib/utils/sleep.ts'

  const loginSchema = z.object({
    email: z.string().email(),
    pass: z.string().min(4, 'Pass must have more than 4 letters'),
  })
  const form = new ZodFormStore(loginSchema, {
    debug: true,
    onSubmit: async v => {
      await sleep(2000) // fake delay to simulate api call
      console.log('Submitted values:', v)
    },
  })

  // We need pull the generated field store out, in order
  // to use the Svelte's "auto subscription" feature "$"
  const {
    email_error,
    email_valid,
    email_dirty,
    email_touched,
    pass_error,
    pass_dirty,
    pass_touched,
  } = form.stores

  const { submitting, valid, model } = form
</script>

<form on:submit|preventDefault={form.triggerSubmit} on:reset={form.reset}>
  <fieldset>
    <input name="email" placeholder="Email" use:connectInput={form.fields.email} />
    {#if $email_error && $email_touched}<p>{$email_error}</p>{/if}
  </fieldset>

  <fieldset>
    <input name="pass" type="password" placeholder="Password" use:connectInput={form.fields.pass} />
    {#if $pass_error && $pass_touched}<p>{$pass_error}</p>{/if}
  </fieldset>

  <button type="submit" use:connectSubmit={form}>
    {$submitting ? 'Submitting...' : 'Submit'}
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
  input:global(.invalid) {
    border-color: red;
  }
  input:global(.valid) {
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
