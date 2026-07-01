import { describe, it, expect, vi, beforeEach } from 'vitest'
import { syncReminders, requestNotificationPermissions, sendTestReminder } from './localNotifications'

const getPending = vi.fn()
const cancel = vi.fn(async () => undefined)
const schedule = vi.fn(async () => undefined)
const requestPermissions = vi.fn(async () => ({ display: 'granted' }))
const checkPermissions = vi.fn(async () => ({ display: 'granted' }))

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => true },
}))

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    getPending: (...args: unknown[]) => getPending(...args),
    cancel: (...args: unknown[]) => cancel(...args),
    schedule: (...args: unknown[]) => schedule(...args),
    requestPermissions: (...args: unknown[]) => requestPermissions(...args),
    checkPermissions: (...args: unknown[]) => checkPermissions(...args),
  },
}))

const row = {
  id: 'occ-1',
  user_id: 'u1',
  kind: 'until' as const,
  title: '婚礼',
  date: '2099-01-01',
  lunar: false,
  lunar_month: null,
  lunar_day: null,
  lunar_is_leap: false,
  cover_path: null,
  note: null,
  remind_days: [0],
  milestones: {},
  leap_fallback: 'feb28' as const,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

describe('localNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getPending.mockResolvedValue({ notifications: [] })
  })

  it('requestNotificationPermissions 返回 granted 时为 true', async () => {
    const granted = await requestNotificationPermissions()
    expect(granted).toBe(true)
    expect(requestPermissions).toHaveBeenCalled()
  })

  it('syncReminders 取消不再需要的 pending，排程新的', async () => {
    getPending.mockResolvedValue({ notifications: [{ id: 999999 }] })
    await syncReminders([row])
    expect(cancel).toHaveBeenCalledWith({ notifications: [{ id: 999999 }] })
    expect(schedule).toHaveBeenCalled()
  })

  it('syncReminders 在无权限时不调用 schedule', async () => {
    checkPermissions.mockResolvedValueOnce({ display: 'denied' })
    await syncReminders([row])
    expect(schedule).not.toHaveBeenCalled()
  })

  it('sendTestReminder 立即排程一条约10秒后的通知', async () => {
    await sendTestReminder()
    expect(schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        notifications: [expect.objectContaining({ title: expect.any(String) })],
      }),
    )
  })
})
