import { Lunar, LunarYear, LunarMonth } from 'lunar-typescript'
import { type CivilDate, diffDays, compareCivilDate } from './civilDate'

export interface LunarDateSpec {
  lunarMonth: number
  lunarDay: number
  isLeap: boolean
}

/**
 * 农历(月,日)在指定公历年 gYear 内对应的全部公历日期。
 * 农历年整数 != 目标公历年（农历年末常落到次年公历1-2月），所以要扫
 * [gYear-1, gYear, gYear+1] 三个农历年，只留换算后 solar.getYear()===gYear 的。
 * 一个公历年可能命中 0（短月/无闰月）、1（一般情况）、2（如农历12月初一）次。
 */
export function lunarToSolarInYear(spec: LunarDateSpec, gYear: number): CivilDate[] {
  const { lunarMonth, lunarDay, isLeap } = spec
  const signedMonth = isLeap ? -Math.abs(lunarMonth) : Math.abs(lunarMonth)
  const hits: CivilDate[] = []

  for (const ly of [gYear - 1, gYear, gYear + 1]) {
    if (isLeap && LunarYear.fromYear(ly).getLeapMonth() !== Math.abs(lunarMonth)) continue
    const month = LunarMonth.fromYm(ly, signedMonth)
    if (!month || lunarDay > month.getDayCount()) continue

    let solar
    try {
      solar = Lunar.fromYmd(ly, signedMonth, lunarDay).getSolar()
    } catch {
      continue
    }
    if (solar.getYear() === gYear) {
      hits.push({ y: solar.getYear(), m: solar.getMonth(), d: solar.getDay() })
    }
  }

  return hits.sort((a, b) => compareCivilDate(a, b))
}

/**
 * 从 from（含）起，找该农历日期下一次出现的公历日期。
 * 闰月纪念日间隔可达 ~19 年，窗口默认给 25 年；窗口内无命中返回 null。
 */
export function nextLunarOccurrence(
  spec: LunarDateSpec,
  from: CivilDate,
  maxYears = 25,
): CivilDate | null {
  for (let y = from.y; y <= from.y + maxYears; y++) {
    for (const hit of lunarToSolarInYear(spec, y)) {
      if (diffDays(from, hit) >= 0) return hit
    }
  }
  return null
}
