import type { OccasionKind, LeapFallback, MilestoneConfig } from '../lib/occasion'

export interface OccasionRow {
  id: string
  user_id: string
  kind: OccasionKind
  title: string
  date: string // 'YYYY-MM-DD'，公历基准日
  lunar: boolean
  lunar_month: number | null
  lunar_day: number | null
  lunar_is_leap: boolean
  cover_path: string | null
  note: string | null
  remind_days: number[]
  milestones: MilestoneConfig
  leap_fallback: LeapFallback
  created_at: string
  updated_at: string
}

export interface OccasionInsert {
  kind: OccasionKind
  title: string
  date: string
  lunar?: boolean
  lunar_month?: number | null
  lunar_day?: number | null
  lunar_is_leap?: boolean
  cover_path?: string | null
  note?: string | null
  remind_days?: number[]
  milestones?: MilestoneConfig
  leap_fallback?: LeapFallback
}
