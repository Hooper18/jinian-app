import { describe, it, expect, vi } from 'vitest'
import { pingDatabase } from './keepAlive'

const URL_ = 'https://proj.supabase.co'
const KEY = 'anon-key'

describe('pingDatabase', () => {
  it('用 anon key 对 occasions 发一次只读查询（真正走到 Postgres，才算数据库活跃）', async () => {
    const fetchImpl = vi.fn(async () => new Response('[]', { status: 200 }))

    const result = await pingDatabase(URL_, KEY, fetchImpl)

    expect(result).toEqual({ ok: true, status: 200 })
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://proj.supabase.co/rest/v1/occasions?select=id&limit=1',
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
    )
  })

  it('后端返回非 2xx 时 ok=false 并带回状态码', async () => {
    const fetchImpl = vi.fn(async () => new Response('paused', { status: 540 }))

    expect(await pingDatabase(URL_, KEY, fetchImpl)).toEqual({ ok: false, status: 540 })
  })

  it('网络层失败（如项目已暂停、DNS 被撤）不抛异常，status=0', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('fetch failed')
    })

    expect(await pingDatabase(URL_, KEY, fetchImpl)).toEqual({
      ok: false,
      status: 0,
      error: 'fetch failed',
    })
  })

  it('缺少 URL 或 key 时直接判失败，不发请求', async () => {
    const fetchImpl = vi.fn()

    expect(await pingDatabase('', KEY, fetchImpl)).toEqual({
      ok: false,
      status: 0,
      error: 'missing SUPABASE url or anon key',
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
