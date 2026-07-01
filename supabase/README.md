# Supabase Schema

新建一个 Supabase 项目后，去 Dashboard → SQL Editor，把
`migrations/001_initial_schema.sql` 整份贴进去执行一次即可。

之后把项目的 `Project URL` 和 `anon public key`（Settings → API）
填进 `jinian-app/.env`（参考 `.env.example`）。

登录方式为 magic-link（邮箱验证码），需在 Dashboard → Authentication →
Providers → Email 里确认已开启；纯自用建议在 Authentication → Settings
里关闭"Allow new users to sign up"或改用邮箱 allowlist，只放行自己的邮箱。
