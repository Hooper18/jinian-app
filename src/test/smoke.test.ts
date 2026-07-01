import { describe, it, expect } from 'vitest'

describe('测试基建', () => {
  it('vitest + jsdom 正常工作', () => {
    expect(typeof document).toBe('object')
  })
})
