# 纪念（jinian-app）

纯自用的纪念日 App。记录对人重要的日子——每年循环的生日/周年、
从某天开始累加的天数、倒数到未来某个日子。到点靠手机本地通知提醒
（尤其针对 vivo 做了适配），不依赖系统日历订阅或服务器推送。

设计文档：`docs/superpowers/specs/2026-07-01-anniversary-app-design.md`
（在主工作区仓库里，本仓库是从那份 spec 拆出的独立实现）。

## 开发

```bash
npm install
cp .env.example .env   # 填入 Supabase 项目的 URL/anon key
npm run dev
```

## 测试

```bash
npm test          # vitest 单元/组件测试
npm run test:e2e  # playwright 冒烟测试
npm run lint
```

## Android

```bash
npm run build
npx cap sync android
npx cap open android   # 用 Android Studio 打开，或用 ./gradlew assembleDebug/assembleRelease 命令行构建
```

Release 构建需要本地 `android/key.properties`（已 gitignore，不在仓库里，见下方「上线前用户需完成」）。

## 真机验证记录

（每次真机验证后在这里追加一条：日期 + 机型 + 系统版本 + 通过/失败的步骤）

<!--
模板：
### 2026-XX-XX vivo XXXX（原生系统版本 X）
- [ ] 登录（magic-link）
- [ ] 新建三种类型日子各一条，首页/详情显示正确
- [ ] 「让提醒更准时」引导页识别出机型为 vivo
- [ ] 自启动 / 电池不受限 / 最近任务锁定 / 通知权限逐条打开
- [ ] 「发送测试提醒」锁屏/切后台后收到通知
- [ ] app 完全关闭（划掉最近任务）状态下，排程的提醒依然弹出
- [ ] 重启手机后，之前排程的通知依然存在
结果：通过 / 失败（失败步骤 + 现象）
-->

## 上线前用户需完成

以下步骤在当前开发环境里无法完成（机器限制或需要账号/真机），需要用户在自己的环境里手动执行：

1. **解决 gradle 构建被阻塞的问题**
   当前机器上所有 gradle 构建都会因 JDK 17 的 `AF_UNIX` loopback bug 被卡住/失败，这是机器级问题，不是本项目代码问题。需要先关闭 Radmin VPN / LetsTAP 等虚拟网卡，或换一台机器/换 JDK 版本构建，才能跑 `./gradlew assembleRelease`。

2. **创建 Supabase 项目并初始化数据库**
   - 新建 Supabase 项目。
   - 在 SQL editor 里执行 `supabase/migrations/001_initial_schema.sql`。
   - 打开 Email（magic-link）登录方式，并限制注册/登录邮箱为本人邮箱（这是纯自用 App，不对外开放注册）。
   - 把 Project URL 和 anon key 填进本地 `.env`（对照 `.env.example`），以及 Vercel 项目的环境变量。

3. **生成签名 keystore**
   ```bash
   keytool -genkeypair -v -keystore "C:/Users/TuChenguang/.android/keystores/jinian.jks" -alias android -keyalg RSA -keysize 2048 -validity 10000
   ```
   生成后备份一份到仓库外的 `.keystores-backup/jinian.jks`（与 `billiards.jks`/`ledger.jks`/`schedule.jks` 等并列），并创建 `jinian-app/android/key.properties`（本地文件，已 gitignore，不会被提交）：
   ```properties
   storeFile=C:/Users/TuChenguang/.android/keystores/jinian.jks
   storePassword=<刚才设置的密码>
   keyAlias=android
   keyPassword=<刚才设置的密码>
   ```

4. **构建 release APK**
   ```bash
   npm run build
   npx cap sync android
   cd android
   ./gradlew assembleRelease
   ```
   预期 `BUILD SUCCESSFUL`，产物在 `android/app/build/outputs/apk/release/app-release.apk`。

5. **真机验证**（vivo 优先，其次小米/华为，结果记录到上面的「真机验证记录」章节）
   - 安装 APK，正常登录（magic-link 邮箱验证码）。
   - 新建三种类型的日子各一条（每年循环/累加/倒数），首页/详情显示正确。
   - 进入「让提醒更准时」引导页，确认识别出的机型正确。
   - 按引导逐条打开：自启动、电池不受限、最近任务锁定、通知权限。
   - 点击「发送测试提醒」，锁屏/切后台，等待约 10 秒，确认收到系统通知。
   - **关键验证**：完全关闭 app（从最近任务划掉），设一条 1-2 分钟后触发的提醒，等待，确认 app 完全关闭状态下依然弹出通知。
   - 重启手机，确认之前排程的通知在重启后依然存在。
   - 若某步骤失败，多半是 manifest 权限漏加或 vivo 系统设置未正确打开，需要回头排查本地通知/OEM 保活相关实现。

6. **Web 部署**
   - 在 Vercel 新建项目，指向 `jinian-app` 目录。
   - 配置环境变量 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` / `VITE_PUBLIC_BASE_URL`（`VITE_PUBLIC_BASE_URL` 填 Vercel 分配或自定义子域名的完整 origin，用于 magic-link 的 `emailRedirectTo`）。
   - 绑定子域名（如 `jinian.tuchenguang.com`）：Cloudflare 添加 CNAME（灰云）→ vercel-dns，与其它 app 一致。
