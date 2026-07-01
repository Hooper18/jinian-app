export interface CivilDate {
  y: number
  m: number
  d: number
}

export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

export function daysInMonth(y: number, m: number): number {
  if (m === 2 && isLeapYear(y)) return 29
  return MONTH_DAYS[m - 1]
}

/** UTC 正午锚点毫秒数 — 用正午而非 0 点，吸收任何理论上的 DST/闰秒残差。 */
function toUTCNoonMs(c: CivilDate): number {
  return Date.UTC(c.y, c.m - 1, c.d, 12, 0, 0)
}

export function diffDays(a: CivilDate, b: CivilDate): number {
  return Math.round((toUTCNoonMs(b) - toUTCNoonMs(a)) / 86_400_000)
}

export function addDays(c: CivilDate, n: number): CivilDate {
  const dt = new Date(toUTCNoonMs(c) + n * 86_400_000)
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() }
}

/** 加月并 clamp 到目标月的最后一天（如 1/31 +1月 -> 2/28），不会"回弹"。 */
export function addMonthsClamped(c: CivilDate, n: number): CivilDate {
  const total = c.y * 12 + (c.m - 1) + n
  const y = Math.floor(total / 12)
  const m = (((total % 12) + 12) % 12) + 1
  return { y, m, d: Math.min(c.d, daysInMonth(y, m)) }
}

export function todayCivil(): CivilDate {
  const now = new Date()
  return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() }
}

export function compareCivilDate(a: CivilDate, b: CivilDate): number {
  return diffDays(b, a)
}

export function parseCivilDate(s: string): CivilDate {
  const [y, m, d] = s.split('-').map(Number)
  return { y, m, d }
}

export function formatCivilDate(c: CivilDate): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${c.y}-${pad(c.m)}-${pad(c.d)}`
}
