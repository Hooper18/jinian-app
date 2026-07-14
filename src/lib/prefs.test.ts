import { describe, it, expect, beforeEach } from 'vitest'
import {
  isDigestEnabled,
  setDigestEnabled,
  isMemoriesExpanded,
  setMemoriesExpanded,
} from './prefs'

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

describe('prefs — 回忆区展开状态', () => {
  beforeEach(() => localStorage.clear())

  it('默认折叠', () => {
    expect(isMemoriesExpanded()).toBe(false)
  })

  it('set true / false 可读回', () => {
    setMemoriesExpanded(true)
    expect(isMemoriesExpanded()).toBe(true)
    setMemoriesExpanded(false)
    expect(isMemoriesExpanded()).toBe(false)
  })
})
