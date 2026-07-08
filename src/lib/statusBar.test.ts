import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { initStatusBarSync } from './statusBar'

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn(() => false) },
}))
vi.mock('@capacitor/status-bar', () => ({
  StatusBar: {
    setStyle: vi.fn(async () => {}),
    setBackgroundColor: vi.fn(async () => {}),
  },
  Style: { Dark: 'DARK', Light: 'LIGHT', Default: 'DEFAULT' },
}))

/** 可控的 matchMedia 假实现：能设定初始 matches、手动触发 change。 */
function fakeMatchMedia(initialDark: boolean) {
  let listener: ((e: { matches: boolean }) => void) | null = null
  const mql = {
    matches: initialDark,
    addEventListener: (_type: string, cb: (e: { matches: boolean }) => void) => {
      listener = cb
    },
  }
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mql as unknown as MediaQueryList),
  )
  return { fire: (matches: boolean) => listener?.({ matches }) }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('initStatusBarSync', () => {
  it('web 平台什么都不做', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
    fakeMatchMedia(false)

    initStatusBarSync()

    expect(StatusBar.setStyle).not.toHaveBeenCalled()
    expect(StatusBar.setBackgroundColor).not.toHaveBeenCalled()
  })

  it('原生浅色：状态栏浅底深字、背景暖白', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    fakeMatchMedia(false)

    initStatusBarSync()

    expect(StatusBar.setStyle).toHaveBeenCalledWith({ style: Style.Light })
    expect(StatusBar.setBackgroundColor).toHaveBeenCalledWith({ color: '#FAF9F7' })
  })

  it('原生深色：状态栏深底浅字、背景深灰', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    fakeMatchMedia(true)

    initStatusBarSync()

    expect(StatusBar.setStyle).toHaveBeenCalledWith({ style: Style.Dark })
    expect(StatusBar.setBackgroundColor).toHaveBeenCalledWith({ color: '#1E1E1E' })
  })

  it('系统主题切换时跟着重新应用', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    const mm = fakeMatchMedia(false)

    initStatusBarSync()
    mm.fire(true)

    expect(StatusBar.setStyle).toHaveBeenLastCalledWith({ style: Style.Dark })
    expect(StatusBar.setBackgroundColor).toHaveBeenLastCalledWith({ color: '#1E1E1E' })
  })
})
