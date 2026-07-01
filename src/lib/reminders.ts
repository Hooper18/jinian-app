import { type CivilDate, parseCivilDate, addDays, diffDays } from './civilDate'
import { computeOccasion, expandMilestones } from './occasion'
import type { OccasionRow } from '../types/occasion'

export interface ReminderItem {
  id: number
  at: Date
  title: string
  body: string
  occasionId: string
}

/** 字符串哈希成32位正整数，供 Capacitor LocalNotifications 的 id 使用（必须是 int32）。 */
function hashToInt32(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h) % 2147483647
}

/** 关键日期 -> 当地09:00（Asia/Shanghai固定为UTC+8）的 Date 对象。 */
function keyDateToNineAM(key: CivilDate): Date {
  return new Date(Date.UTC(key.y, key.m - 1, key.d, 1, 0, 0)) // 09:00 CST = 01:00 UTC
}

function bodyFor(row: OccasionRow, keyDate: CivilDate, today: CivilDate): string {
  const days = diffDays(today, keyDate)
  if (days === 0) return `今天是${row.title}`
  if (days > 0) return `还有 ${days} 天`
  return `${row.title}`
}

export function computeReminderTimes(
  occasions: OccasionRow[],
  today: CivilDate,
  now: Date,
  maxItems = 64,
): ReminderItem[] {
  const items: ReminderItem[] = []

  for (const row of occasions) {
    const anchorDate = parseCivilDate(row.date)
    const keyDates: CivilDate[] = []

    if (row.kind === 'anniversary') {
      const state = computeOccasion(
        {
          kind: 'anniversary',
          date: anchorDate,
          lunar: row.lunar
            ? { lunarMonth: row.lunar_month!, lunarDay: row.lunar_day!, isLeap: row.lunar_is_leap }
            : null,
          leapFallback: row.leap_fallback,
        },
        today,
      )
      if (state.nextDate) keyDates.push(state.nextDate)
    } else if (row.kind === 'until') {
      const state = computeOccasion({ kind: 'until', date: anchorDate }, today)
      if (state.daysBetween >= 0 && state.nextDate) keyDates.push(state.nextDate)
    } else {
      // since：取 isNext 及其后若干个里程碑
      const milestones = expandMilestones(anchorDate, row.milestones, today)
      const nextIndex = milestones.findIndex((m) => m.isNext)
      if (nextIndex >= 0) {
        for (const m of milestones.slice(nextIndex, nextIndex + 3)) keyDates.push(m.date)
      }
    }

    for (const keyDate of keyDates) {
      for (const offset of row.remind_days) {
        const remindDate = addDays(keyDate, -offset)
        const at = keyDateToNineAM(remindDate)
        if (at.getTime() <= now.getTime()) continue
        items.push({
          id: hashToInt32(`${row.id}:${keyDate.y}-${keyDate.m}-${keyDate.d}:${offset}`),
          at,
          title: row.title,
          body: bodyFor(row, keyDate, today),
          occasionId: row.id,
        })
      }
    }
  }

  items.sort((a, b) => a.at.getTime() - b.at.getTime())

  const seen = new Set<number>()
  const deduped = items.filter((it) => {
    if (seen.has(it.id)) return false
    seen.add(it.id)
    return true
  })

  return deduped.slice(0, maxItems)
}
