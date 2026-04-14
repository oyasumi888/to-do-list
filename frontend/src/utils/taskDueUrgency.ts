import type { TaskEstado } from '../services/api.js';
import { dueDateToYmd } from './dueDateFormat.js';

/** Días hasta la fecha límite: rojo si hoy o mañana (0–1), o vencida. */
const RED_MAX_DIFF_DAYS = 1;

/** Amarillo: entre 2 y 7 días inclusive desde hoy. */
const YELLOW_MIN_DIFF_DAYS = 2;
const YELLOW_MAX_DIFF_DAYS = 7;

function parseLocalMidnight(ymd: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  dt.setHours(0, 0, 0, 0);
  return dt.getTime();
}

function todayLocalMidnight(): number {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t.getTime();
}

/** Diferencia en días calendario: due - today (0 = hoy, 1 = mañana, -1 = ayer). */
function diffCalendarDays(dueMs: number, todayMs: number): number {
  return Math.round((dueMs - todayMs) / 86400000);
}

export type DueUrgency = 'none' | 'yellow' | 'red';

/**
 * Rojo: vencida (antes de hoy) o vence hoy o mañana (0–1 días).
 * Amarillo: vence entre 2 y 7 días.
 * Nada: sin fecha, completada, o más de 7 días.
 */
export function getDueUrgency(fecha_limite: string | null, estado: TaskEstado): DueUrgency {
  const ymd = dueDateToYmd(fecha_limite);
  if (!ymd || estado === 'completada') {
    return 'none';
  }

  const dueMs = parseLocalMidnight(ymd);
  if (dueMs === null) {
    return 'none';
  }

  const todayMs = todayLocalMidnight();
  const diff = diffCalendarDays(dueMs, todayMs);

  if (diff < 0 || diff <= RED_MAX_DIFF_DAYS) {
    return 'red';
  }
  if (diff >= YELLOW_MIN_DIFF_DAYS && diff <= YELLOW_MAX_DIFF_DAYS) {
    return 'yellow';
  }
  return 'none';
}
