import { useState } from 'react'
import { detectOem, type OemBrand } from '../lib/deviceOem'
import { sendTestReminder, requestNotificationPermissions } from '../lib/localNotifications'

const BRAND_LABEL: Record<OemBrand, string> = {
  vivo: 'vivo',
  xiaomi: '小米',
  huawei: '华为',
  other: '通用机型',
}

const STEPS: Record<OemBrand, string[]> = {
  vivo: [
    '设置 → 应用 → 纪念 → 自启动，打开',
    '设置 → 电池 → 后台高耗电管理 → 纪念 → 允许后台高耗电',
    '最近任务里给"纪念"上锁（防一键清理）',
    '设置 → 应用 → 纪念 → 通知，全部开启',
  ],
  xiaomi: [
    '安全中心 → 应用管理 → 纪念 → 自启动，打开',
    '设置 → 电池与性能 → 应用配置 → 纪念 → 无限制',
    '最近任务里锁定"纪念"',
    '设置 → 通知 → 纪念，全部开启',
  ],
  huawei: [
    '设置 → 应用 → 应用启动管理 → 纪念 → 改为"手动管理"，三个开关全开',
    '把"纪念"加入电池"不优化"名单',
    '通知设置里确保横幅/锁屏/勿扰白名单全开',
  ],
  other: [
    '确保"纪念"的通知权限已开启',
    '在系统电池设置里把"纪念"设为不受后台限制',
    '把"纪念"从任何"一键清理"白名单里排除',
  ],
}

export default function NotificationGuide() {
  const oem = detectOem()
  const [sent, setSent] = useState(false)

  const handleTest = async () => {
    await requestNotificationPermissions()
    await sendTestReminder()
    setSent(true)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-1 text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
        让提醒更准时
      </h1>
      <p className="mb-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
        当前机型：{BRAND_LABEL[oem]}
      </p>
      <ol className="mb-6 space-y-2 text-sm leading-7" style={{ color: 'var(--text-primary)' }}>
        {STEPS[oem].map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <button
        onClick={handleTest}
        className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white"
        style={{ background: 'var(--accent)' }}
      >
        发送测试提醒
      </button>
      {sent && (
        <p className="mt-3 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
          约10秒后应该会收到一条测试通知
        </p>
      )}
    </div>
  )
}
