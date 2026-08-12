// Validated allowlist loader (blueprint §5.3) shared by every gate that has
// a time-boxed escape hatch. An unvalidated allowlist makes a blocking gate
// non-deterministic and silently bypassable, so EVERYTHING is checked on load,
// and all load failures are collected (never first-fail only).
import { readFileSync, existsSync } from "node:fs";

export interface AllowlistEntry {
  scope: string; // what the exception covers — gate-specific meaning
  reason: string;
  approvedBy: string;
  added: string; // YYYY-MM-DD
  expires: string; // YYYY-MM-DD — MANDATORY; an expired entry fails CI
}

export interface LoadedAllowlist {
  entries: AllowlistEntry[];
  /** Load-time validation failures. Non-empty = the OWNING GATE must go red. */
  errors: string[];
  /** Entries expiring within 30 days — surfaced, not blocking. */
  expiringSoon: AllowlistEntry[];
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const validDate = (s: string) => DATE.test(s) && !Number.isNaN(Date.parse(s));

/**
 * `today` is injected (never read from the clock inside validation logic
 * callers can't control) so expiry behaviour is deterministic and testable.
 */
export function loadAllowlist(path: string, today: string): LoadedAllowlist {
  const errors: string[] = [];
  const expiringSoon: AllowlistEntry[] = [];
  if (!existsSync(path)) return { entries: [], errors: [], expiringSoon: [] };

  let data: { description?: unknown; entries?: unknown };
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    return {
      entries: [],
      errors: [`${path}: unparseable JSON (${(e as Error).message})`],
      expiringSoon: [],
    };
  }
  if (typeof data.description !== "string" || data.description.trim() === "")
    errors.push(`${path}: missing or blank top-level "description"`);
  if (!Array.isArray(data.entries))
    return {
      entries: [],
      errors: [...errors, `${path}: "entries" must be an array`],
      expiringSoon: [],
    };

  const seenScopes = new Set<string>();
  const entries: AllowlistEntry[] = [];
  data.entries.forEach((raw: Record<string, unknown>, i: number) => {
    const at = `${path} entry #${i + 1}`;
    const e = raw as unknown as AllowlistEntry;
    // Blank-checked, not just type-checked: a past incident had three loaders
    // accepting "" as an approver while their own comments cited the lesson.
    for (const field of ["scope", "reason", "approvedBy", "added", "expires"] as const) {
      if (typeof e[field] !== "string" || e[field].trim() === "")
        errors.push(`${at}: field "${field}" is missing or blank`);
    }
    if (typeof e.reason === "string" && e.reason.trim().length > 0 && e.reason.trim().length < 40)
      errors.push(
        `${at}: reason is not substantive (< 40 chars) — state what fails, measured, and why it is acceptable now`,
      );
    if (typeof e.added === "string" && e.added.trim() !== "" && !validDate(e.added))
      errors.push(`${at}: "added" is not a valid YYYY-MM-DD date`);
    if (typeof e.expires === "string" && e.expires.trim() !== "") {
      if (!validDate(e.expires)) errors.push(`${at}: "expires" is not a valid YYYY-MM-DD date`);
      else {
        if (validDate(e.added) && e.expires <= e.added)
          errors.push(`${at}: "expires" must be after "added"`);
        if (e.expires < today)
          errors.push(
            `${at}: EXPIRED on ${e.expires} — the exception is over; fix the finding or renew with a new approval`,
          );
        else {
          const soon = new Date(Date.parse(today) + 30 * 86400000).toISOString().slice(0, 10);
          if (e.expires <= soon) expiringSoon.push(e);
        }
      }
    }
    if (typeof e.scope === "string" && e.scope.trim() !== "") {
      if (seenScopes.has(e.scope)) errors.push(`${at}: duplicate scope "${e.scope}"`);
      seenScopes.add(e.scope);
    }
    entries.push(e);
  });

  return { entries, errors, expiringSoon };
}
