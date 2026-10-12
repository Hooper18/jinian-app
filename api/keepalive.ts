// Vercel Function 按原生 ESM 运行（package.json type=module），相对导入必须带 .js 扩展名
import { pingDatabase } from '../src/lib/keepAlive.js'

// Vercel Cron 每日调用（见 vercel.json 的 crons）。失败时回 502，Vercel 日志里可见。
export async function GET(): Promise<Response> {
  const result = await pingDatabase(
    process.env.VITE_SUPABASE_URL ?? '',
    process.env.VITE_SUPABASE_ANON_KEY ?? '',
  )
  return Response.json(result, { status: result.ok ? 200 : 502 })
}
