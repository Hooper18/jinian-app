import { test, expect } from '@playwright/test'

test('app shell 能渲染', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#root')).not.toBeEmpty()
})
