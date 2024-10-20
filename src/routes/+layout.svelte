<script lang="ts">
  import TabBar from './TabBar.svelte'

  const title = '🌵 Svelte Zod Form'
  const TABS = [
    { href: '/example1', title: 'Simple Form' },
    { href: '/example2', title: 'Auto Submit' },
    { href: '/example3', title: 'Connector' },
  ]
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<main class="p-6 max-w-6xl mx-auto">
  <h1 class="text-3xl font-bold mb-4">{title}</h1>

  <TabBar data={TABS} />
  <slot />
</main>

<style global>
  :root {
    color: #333;
    margin: 0;
    padding: 8px;
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu,
      Cantarell, 'Helvetica Neue', sans-serif;
  }
</style>
