import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

// 与 index.css 的 --bg-primary 两套取值保持一致
const LIGHT_BG = '#FAF9F7'
const DARK_BG = '#1E1E1E'

function apply(isDark: boolean): void {
  void StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(() => {})
  void StatusBar.setBackgroundColor({ color: isDark ? DARK_BG : LIGHT_BG }).catch(() => {})
}

/**
 * 原生端让状态栏跟随系统深浅色：页面内容已随 prefers-color-scheme 切换，
 * 但 Android 状态栏颜色不会自己变，需要用插件同步一次并监听切换。
 * web 端无状态栏，直接跳过。
 */
export function initStatusBarSync(): void {
  if (!Capacitor.isNativePlatform()) return
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  apply(mq.matches)
  mq.addEventListener('change', (e) => apply(e.matches))
}
