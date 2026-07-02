import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { computeReminderTimes, computeDigestReminders } from './reminders'
import { isDigestEnabled } from './prefs'
import { todayCivil } from './civilDate'
import type { OccasionRow } from '../types/occasion'

export function isNativeAvailable(): boolean {
  return Capacitor.isNativePlatform()
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!isNativeAvailable()) return false
  const result = await LocalNotifications.requestPermissions()
  return result.display === 'granted'
}

async function checkPermission(): Promise<boolean> {
  if (!isNativeAvailable()) return false
  const result = await LocalNotifications.checkPermissions()
  return result.display === 'granted'
}

/**
 * 全量同步：拿当前系统里已排程的 pending → 与目标列表 diff →
 * cancel 差集、schedule 目标集。打开 app / 数据变化时调用。
 */
export async function syncReminders(occasions: OccasionRow[]): Promise<void> {
  if (!isNativeAvailable()) return

  const granted = await checkPermission()

  const pendingResp = await LocalNotifications.getPending().catch(() => null)
  const pending = pendingResp?.notifications ?? []

  if (!granted) {
    if (pending.length) {
      await LocalNotifications.cancel({ notifications: pending.map((n) => ({ id: n.id })) })
    }
    return
  }

  const items = isDigestEnabled()
    ? computeDigestReminders(occasions, todayCivil(), new Date())
    : computeReminderTimes(occasions, todayCivil(), new Date())

  const desired = items.map((item) => ({
    id: item.id,
    title: item.title,
    body: item.body,
    schedule: { at: item.at, allowWhileIdle: true },
    extra: { occasionId: item.occasionId },
  }))

  const desiredIds = new Set(desired.map((d) => d.id))
  const toCancel = pending.filter((n) => !desiredIds.has(n.id))
  if (toCancel.length) {
    await LocalNotifications.cancel({ notifications: toCancel.map((n) => ({ id: n.id })) })
  }
  if (desired.length) {
    await LocalNotifications.schedule({ notifications: desired })
  }
}

/** 让用户当场验证提醒是否生效：约10秒后弹一条测试通知。 */
export async function sendTestReminder(): Promise<void> {
  if (!isNativeAvailable()) return
  const granted = await requestNotificationPermissions()
  if (!granted) return
  await LocalNotifications.schedule({
    notifications: [
      {
        id: 999999999,
        title: '纪念',
        body: '提醒已生效 — 这是一条测试通知',
        schedule: { at: new Date(Date.now() + 10_000), allowWhileIdle: true },
      },
    ],
  })
}
