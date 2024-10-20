<script lang="ts">
  import { z } from 'zod'
  import {
    connectError,
    connectInput,
    connectSelect,
    connectSubmit,
    ZodFormStore,
  } from '@nerd-coder/svelte-zod-form'
  import { sleep } from '$lib/utils/sleep.ts'

  const registrationSchema = z.object({
    email: z.string().email(),
    pass: z.string().min(4, 'Pass must have more than 4 letters'),
    hobby: z.string().optional(),
    interest: z.array(z.string()).optional(),
    acceptTerms: z.boolean().refine(v => v === true, 'You must accept the terms before continue'),
  })
  const form = new ZodFormStore(registrationSchema, {
    debug: true,
    onSubmit: async v => {
      await sleep(2000) // fake delay to simulate api call
      console.log('Submitted values:', v)
    },
  })

  const { submitting, valid, error, dirty, model } = form
</script>

<form on:submit|preventDefault={form.triggerSubmit} on:reset={form.reset}>
  <fieldset>
    <input name="email" placeholder="Email" use:connectInput={form.fields.email} />
    <p use:connectError={form.fields.email}></p>
  </fieldset>

  <fieldset>
    <input name="pass" type="password" placeholder="Password" use:connectInput={form.fields.pass} />
    <p use:connectError={form.fields.pass}></p>
  </fieldset>

  <fieldset>
    <select name="hobby" use:connectSelect={form.fields.hobby}>
      <option value="">-- Select Hobby --</option>
      <option value="reading">Reading</option>
      <option value="coding">Coding</option>
      <option value="gaming">Gaming</option>
    </select>
    <p use:connectError={form.fields.hobby}></p>
  </fieldset>

  <fieldset>
    <select name="interest" multiple use:connectSelect={form.fields.interest}>
      <option value="sports">Sports</option>
      <option value="music">Music</option>
      <option value="travel">Travel</option>
    </select>
    <p use:connectError={form.fields.interest}></p>
  </fieldset>

  <fieldset>
    <label>
      <input type="checkbox" name="acceptTerms" use:connectInput={form.fields.acceptTerms} />
      Accept Terms
    </label>
    <p use:connectError={form.fields.acceptTerms}></p>
  </fieldset>

  <button type="submit" use:connectSubmit={form}>
    {$submitting ? 'Submitting...' : 'Submit'}
  </button>
  <button type="reset">Reset</button>
</form>

<pre>Form state:
» dirty      : {$dirty}
» valid      : {$valid}
» error      : {$error}
» submitting : {$submitting}
» model      : {JSON.stringify($model, null, 2)}
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
  select,
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
