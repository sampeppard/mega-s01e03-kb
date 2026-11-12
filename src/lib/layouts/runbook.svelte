<script lang="ts">
  // Not in the export (src/lib/layouts/): a stand-in frame so the pages render.
  let { title, owner, status, reviewed, signature, children } = $props();
</script>

<svelte:head><title>{title} · kb</title></svelte:head>

<main>
  <nav><a href="/kb/">kb</a></nav>
  <header>
    <h1>{title}</h1>
    <p class="meta">{owner} · <span class="status">{status}</span> · reviewed {String(reviewed).slice(0, 10)}{#if signature} · signed {signature}{/if}</p>
  </header>
  {@render children()}
</main>

<style>
  :global(:root) {
    --accent: #2f6fb0; --warn: #b4521f; --warn-bg: #fbeee6; --note-bg: #eef4fa;
    --line: #d8dde3; --muted: #5d6670; --mono: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  :global(body) { margin: 0; background: #fff; color: #1c2127; font: 16px/1.55 system-ui, sans-serif; }
  main { max-width: 760px; margin: 0 auto; padding: 1.5rem 16px 3rem; }
  nav a { color: var(--muted); font-size: 0.85rem; }
  h1 { margin: 0.4rem 0 0.2rem; line-height: 1.2; }
  .meta { margin: 0 0 1.5rem; color: var(--muted); font-size: 0.9rem; }
  .status { font-weight: 600; }
  :global(table) { border-collapse: collapse; width: 100%; font-size: 0.92rem; margin: 0.75rem 0; display: block; overflow-x: auto; }
  :global(th), :global(td) { text-align: left; padding: 0.35rem 0.6rem; border-bottom: 1px solid var(--line); vertical-align: top; }
  :global(code) { font-family: var(--mono); font-size: 0.9em; }
  :global(a) { color: var(--accent); }
</style>
