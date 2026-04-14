/**
 * Normaliza fechas del API (p. ej. `DATE` vía pg como `2026-04-14T00:00:00.000Z`)
 * a `YYYY-MM-DD` para comparación local y badges.
 */
export function dueDateToYmd(raw: string | null | undefined): string | null {
  if (raw == null || raw === '') return null;
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(raw).trim());
  return m?.[1] ?? null;
}
