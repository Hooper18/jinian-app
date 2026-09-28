export interface PingResult {
  ok: boolean
  status: number
  error?: string
}

type FetchLike = (input: string, init: { headers: Record<string, string> }) => Promise<Response>

/**
 * Supabase 免费版连续 7 天数据库活跃不足会自动暂停项目（连 DNS 一起撤）。
 * 定时用 anon key 发一次只读查询保活：RLS 下匿名读到 0 行，但查询确实
 * 在 Postgres 上执行，算作数据库活动。与 schedule-app 共用项目，一处保活两边受益。
 */
export async function pingDatabase(
  supabaseUrl: string,
  anonKey: string,
  fetchImpl: FetchLike = fetch,
): Promise<PingResult> {
  if (!supabaseUrl || !anonKey) {
    return { ok: false, status: 0, error: 'missing SUPABASE url or anon key' }
  }
  try {
    const res = await fetchImpl(`${supabaseUrl}/rest/v1/occasions?select=id&limit=1`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    })
    return { ok: res.ok, status: res.status }
  } catch (err) {
    return { ok: false, status: 0, error: err instanceof Error ? err.message : String(err) }
  }
}
