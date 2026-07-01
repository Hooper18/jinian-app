import { describe, it, expect, vi, beforeEach } from 'vitest'
import { syncReminders, requestNotificationPermissions, sendTestReminder } from './localNotifications'
import { computeReminderTimes } from './reminders'
import { todayCivil } from './civilDate'

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

  it('syncReminders 差量同步：重叠 id 存活，仅取消陈旧 id，并带上 extra.occasionId', async () => {
    // 与 syncReminders 内部同样的方式算出 desired 集合，取一个真实的 desired id
    const desired = computeReminderTimes([row], todayCivil(), new Date())
    expect(desired.length).toBeGreaterThan(0)
    const keepId = desired[0].id

    // pending 里混入一个与 desired 重叠的 id（必须存活）和一个陈旧 id（必须被取消）
    getPending.mockResolvedValue({ notifications: [{ id: keepId }, { id: 999999 }] })

    await syncReminders([row])

    // 只取消陈旧 id，重叠的 keepId 不应出现在 cancel 参数里
    expect(cancel).toHaveBeenCalledWith({ notifications: [{ id: 999999 }] })
    const cancelArgs = cancel.mock.calls[0][0] as { notifications: { id: number }[] }
    expect(cancelArgs.notifications.some((n) => n.id === keepId)).toBe(false)

    // schedule 携带目标集合，且回传 extra.occasionId 供深链使用
    expect(schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        notifications: expect.arrayContaining([
          expect.objectContaining({ extra: { occasionId: row.id } }),
        ]),
      }),
    )
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
