import { describe, expect, it } from 'vitest';
import reports from '#lib/data/reports-4471.json';
import notes from '#lib/data/desk-notes.json';
import { tenantOf } from '#lib/kb/locales';
import { readsAsShift, splitTicket } from '#lib/kb/problems';
import type { Report } from '#lib/kb/causes';

describe('readsAsShift', () => {
  it('reads a swap as no shift', () => expect(readsAsShift('Booked for 2 July. The invite says 7 February.')).toBe(false));
  it('reads one day apart as a shift', () => expect(readsAsShift('Invite says Tuesday 12 May. Calendar says Monday 11 May.')).toBe(true));
  it('reads a weekday-only move as a shift', () => expect(readsAsShift('Tuesday 6 October showed as Monday.')).toBe(true));
  it('keeps a swap with weekdays a swap', () => expect(readsAsShift('Thursday 8 January showed as Saturday 1 August.')).toBe(false));
});

describe('#4471', () => {
  const s = splitTicket(reports as Report[], 4471, tenantOf, notes.oneDayMove);
  const n = Object.fromEntries(s.groups.map((g) => [g.problem, g.reports.length]));
  it('prints the split', () => { console.log(s.rows, s.merged.length, n); });
  it('counts every unique report once', () => expect(s.groups.reduce((a, g) => a + g.reports.length, 0)).toBe(s.merged.length));
  it('reads no one-day move the desk did not note', () => {
    const bare = splitTicket(reports as Report[], 4471, tenantOf, []);
    const ids = bare.groups.find((g) => g.problem === 'shift')?.reports.map((r) => r.id) ?? [];
    expect(ids.every((id) => notes.oneDayMove.includes(id))).toBe(true);
  });
});
