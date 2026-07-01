export type OemBrand = 'vivo' | 'xiaomi' | 'huawei' | 'other'

export function detectOem(userAgent: string = navigator.userAgent): OemBrand {
  const ua = userAgent.toLowerCase()
  if (ua.includes('vivo') || /\bv\d{4}[a-z]\b/.test(ua)) return 'vivo'
  if (ua.includes('miui') || ua.includes('xiaomi') || ua.includes('redmi')) return 'xiaomi'
  if (ua.includes('huawei') || ua.includes('honor')) return 'huawei'
  return 'other'
}
