import { test, expect } from '@playwright/test'

test('未登录访问首页会跳转到 /auth', async ({ page }) => {
  // 拦截 supabase auth 请求，模拟"未登录"（getSession 返回空 session）
  await page.route('**/auth/v1/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ session: null }) }),
  )
  await page.route('**/rest/v1/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )

  await page.goto('/')
  await expect(page).toHaveURL(/\/auth$/)
  await expect(page.getByLabel('邮箱')).toBeVisible()
})

test('/auth 页面本身可以直接访问，不受保护', async ({ page }) => {
  await page.route('**/auth/v1/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ session: null }) }),
  )
  await page.goto('/auth')
  await expect(page.getByLabel('邮箱')).toBeVisible()
})
