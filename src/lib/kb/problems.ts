// What a report actually describes, read from its body as well as its tenant.
// causes.ts sorts by tenant and channel only, so a one-day move from a day-first tenant lands
// under `parser`. A one-day move is not a day/month swap: the parser cannot produce it.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'shift' | 'unplaced';

export const PROBLEMS: Record<Problem, { title: string; what: string }> = {
  parser: {
    title: 'Shared parser reads day-first dates month first',
    what: 'Day and month swap: 7 April becomes 4 July. Every channel, every day-first tenant.',
  },
  hint: {
    title: 'booking-v3 form hint says MM/DD/YYYY to day-first tenants',
    what: 'People type month first, as the hint tells them; the form reads it the tenant\'s way.',
  },
  shift: {
    title: 'Bookings move by one day',
    what: 'Tuesday shows as Monday; two cities see different days. Not a swap: a time-zone or day-boundary bug.',
  },
  unplaced: { title: 'No cause on file', what: 'Tenant unknown or not day-first.' },
};

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const DATE = /(\d{1,2}) (january|february|march|april|may|june|july|august|september|october|november|december)/gi;
const WEEKDAY = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi;

type DM = { d: number; m: number };
const datesIn = (body: string): DM[] =>
  [...body.matchAll(DATE)].map((x) => ({ d: Number(x[1]), m: MONTHS.indexOf(x[2].toLowerCase()) + 1 }));

const swapped = (a: DM, b: DM) => a.d === b.m && a.m === b.d && a.d !== a.m;
const oneDayApart = (a: DM, b: DM) =>
  Math.abs(Date.UTC(2026, a.m - 1, a.d) - Date.UTC(2026, b.m - 1, b.d)) === 86_400_000;

// Does the body describe a move by one day, rather than a day/month swap?
export function readsAsShift(body: string): boolean {
  const dates = datesIn(body);
  for (let i = 0; i < dates.length; i++)
    for (let j = i + 1; j < dates.length; j++) {
      if (swapped(dates[i], dates[j])) return false;
      if (oneDayApart(dates[i], dates[j])) return true;
    }
  if (/one day (off|early|late|out)/i.test(body)) return true;
  // Two different weekdays and no swapped pair: "Tuesday 6 October showed as Monday".
  const days = new Set([...body.matchAll(WEEKDAY)].map((x) => x[1].toLowerCase()));
  return dates.length < 2 && days.size >= 2;
}

// `known`: ids the desk already read as a one-day move (desk-notes.json).
export function problemOf(r: Report, t: Tenant | undefined, known: readonly string[] = []): Problem {
  if (known.includes(r.id) || readsAsShift(r.body)) return 'shift';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: string[];
  channels: Record<string, number>;
  taggedAs: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

const tally = (xs: string[]) => xs.reduce<Record<string, number>>((n, x) => ({ ...n, [x]: (n[x] ?? 0) + 1 }), {});

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  known: readonly string[] = [],
): { rows: number; merged: Report[]; groups: ProblemGroup[] } {
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket);
  const by = new Map<Problem, Report[]>();
  for (const r of merged) {
    const p = problemOf(r, tenantOf(r), known);
    by.set(p, [...(by.get(p) ?? []), r]);
  }
  const groups = [...by.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
        channels: tally(rs.map((r) => r.channel)),
        taggedAs: tally(rs.map((r) => r.meta.intakeTag)),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
  return { rows: all.filter((r) => r.mergedInto === ticket).length, merged, groups };
}
