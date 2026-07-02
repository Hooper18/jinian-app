import { describe, it, expect, beforeEach } from 'vitest'
import { isDigestEnabled, setDigestEnabled } from './prefs'

describe('prefs — 每日汇总开关', () => {
  beforeEach(() => localStorage.clear())

  it('默认关闭', () => {
    expect(isDigestEnabled()).toBe(false)
  })

  it('set true / false 可读回', () => {
    setDigestEnabled(true)
    expect(isDigestEnabled()).toBe(true)
    setDigestEnabled(false)
    expect(isDigestEnabled()).toBe(false)
  })
})
