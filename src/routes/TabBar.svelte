<script lang="ts">
  import { crossfade, fade } from 'svelte/transition'
  import { page } from '$app/stores'

  export let data: { href: string; title: string }[] = []
  export let exact = false

  const key = crypto.randomUUID()

  const [send, receive] = crossfade({
    duration: 500,
    fallback: (node) => fade(node, { duration: 200 }),
  })

  $: path = $page.url.pathname
  $: tabs = data.map((z) => ({ ...z, active: exact ? path === z.href : path.startsWith(z.href) }))
</script>

<nav>
  {#each tabs as { href, title, active }, _ (href)}
    <a {href} data-active={active}>
      {#if active}
        <div in:receive|local={{ key }} out:send|local={{ key }} />
      {/if}
      <p>{title}</p>
    </a>
  {/each}
</nav>

<style>
  nav {
    border-bottom: 1px solid rgba(191, 219, 254, 1);
    margin-bottom: 16px;
    display: flex;
    gap: 4px;
    padding: 0 40px;
  }
  a {
    display: block;
    position: relative;
    color: rgba(100, 116, 139);
    background-color: rgba(241, 245, 249, 0.3);
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    padding: 12px 20px;
    user-select: none;
    text-decoration: none;
    font-weight: 300;
  }
  a[data-active='true'] {
    color: dodgerblue;
  }
  p {
    margin: 0;
  }

  div {
    position: absolute;
    left: 0;
    bottom: -1px;
    width: 100%;
    height: 100%;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    border-bottom: 1px solid rgba(96, 165, 250, 1);
    background-color: rgba(59, 130, 246, 0.05);
  }
</style>
