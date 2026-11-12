<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { PROBLEMS, splitTicket, type Problem } from '#lib/kb/problems';

  // `issues`: problem → the GitHub issue filed for it.
  let { ticket, issues = {} }: { ticket: number; issues?: Partial<Record<Problem, string>> } = $props();

  const s = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const fmt = (n: Record<string, number>) =>
    Object.entries(n)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ×${v}`)
      .join(' · ');
  const misTagged = $derived(
    s.groups.reduce((a, g) => a + g.reports.filter((r) => r.meta.intakeTag !== g.problem).length, 0),
  );
</script>

<p class="sum">
  <strong>{s.merged.length}</strong> reports in #{ticket} ({s.rows} export rows, {s.rows - s.merged.length} repeats) ·
  <strong>{s.groups.length}</strong> {s.groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>channels</th><th>intake tagged</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each s.groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code><br /><b>{PROBLEMS[g.problem].title}</b><br /><span class="what">{PROBLEMS[g.problem].what}</span></td>
        <td class="n">{g.reports.length}</td>
        <td>{g.tenants.length}<br /><span class="what">{g.tenants.length <= 4 ? g.tenants.join(', ') : ''}</span></td>
        <td class="what">{fmt(g.channels)}</td>
        <td class="what">{fmt(g.taggedAs)}</td>
        <td class="what">{g.firstSeen} → {g.lastSeen}</td>
        <td>{#if issues[g.problem]}<a href={issues[g.problem]}>{issues[g.problem]?.replace(/.*\/issues\//, '#')}</a>{:else}<span class="none">none yet</span>{/if}</td>
      </tr>
    {/each}
  </tbody>
</table>

<p class="note">{misTagged} of {s.merged.length} reports carry an intake tag that disagrees with their problem: intake guesses from the browser, the problem follows the tenant and the body.</p>

{#each s.groups.filter((g) => g.problem === 'shift') as g (g.problem)}
  <ul class="ids">
    {#each g.reports as r (r.id)}<li><code>{r.id}</code> {r.tenant} ({r.channel}): “{r.body}”</li>{/each}
  </ul>
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .n { font-weight: 700; font-size: 1.1rem; }
  .what, .note { color: var(--muted); font-size: 0.85em; }
  .none { color: var(--warn); font-weight: 600; }
  .ids { font-size: 0.85em; color: var(--muted); }
</style>
