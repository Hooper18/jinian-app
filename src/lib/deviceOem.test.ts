import { describe, it, expect } from 'vitest'
import { detectOem } from './deviceOem'

describe('detectOem', () => {
  it('识别 vivo', () => {
    expect(detectOem('Mozilla/5.0 (Linux; Android 14; V2309A Build/UP1A.230722.107)')).toBe('vivo')
  })
  it('识别小米', () => {
    expect(detectOem('Mozilla/5.0 (Linux; Android 14; 23127PN0CC Build/UKQ1.230917.001) MiuiBrowser')).toBe(
      'xiaomi',
    )
  })
  it('识别华为', () => {
    expect(detectOem('Mozilla/5.0 (Linux; Android 12; HUAWEI Mate40 Build/HUAWEIMate40)')).toBe('huawei')
  })
  it('识别不出的机型归为 other', () => {
    expect(detectOem('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe('other')
  })
})
