/** 本地偏好（localStorage）。纯个人自用，不跨设备同步。 */

const DIGEST_KEY = 'jinian_digest_enabled'

/** 是否开启「每日汇总提醒」，默认关闭。 */
export function isDigestEnabled(): boolean {
  try {
    return localStorage.getItem(DIGEST_KEY) === '1'
  } catch {
    return false
  }
}

export function setDigestEnabled(on: boolean): void {
  try {
    localStorage.setItem(DIGEST_KEY, on ? '1' : '0')
  } catch {
    /* localStorage 不可用时静默忽略 */
  }
}

const MEMORIES_KEY = 'jinian_memories_expanded'

/** 首页「回忆」区是否展开，默认折叠。 */
export function isMemoriesExpanded(): boolean {
  try {
    return localStorage.getItem(MEMORIES_KEY) === '1'
  } catch {
    return false
  }
}

export function setMemoriesExpanded(on: boolean): void {
  try {
    localStorage.setItem(MEMORIES_KEY, on ? '1' : '0')
  } catch {
    /* localStorage 不可用时静默忽略 */
  }
}
