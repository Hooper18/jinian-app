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
- [ ] 登录（邮箱+密码）
- [ ] 新建三种类型日子各一条，首页/详情显示正确
- [ ] 「让提醒更准时」引导页识别出机型为 vivo
- [ ] 自启动 / 电池不受限 / 最近任务锁定 / 通知权限逐条打开
- [ ] 「发送测试提醒」锁屏/切后台约 10 秒后收到通知（图标应是心形而非灰方块）
- [ ] app 完全关闭（划掉最近任务）状态下，排程的提醒依然弹出
- [ ] 重启手机后，之前排程的通知依然存在
- [ ] 设置页开「每日汇总提醒」→ 次日早 9 点收到一条聚合通知（而非逐条）
- [ ] 详情页「存图」拉起系统分享面板，能存到相册（或经微信等落地）
- [ ] 系统切深色模式，app 内容与状态栏一起变深；切回浅色也跟随
结果：通过 / 失败（失败步骤 + 现象）
-->

## Release APK 构建与真机验证（需用户手动执行）

已完成、无需再做：Supabase 后端（搭车 schedule 项目，`.env` 已配）、Web 部署
（https://memory.tuchenguang.com ，Vercel git-connect 自动部署）、签名 keystore
（`android/key.properties` 本地已存在，指向 `jinian.jks`）。

剩余步骤在当前开发环境里无法完成（机器限制或需要真机）：

1. **gradle 必须在用户自己的交互终端跑**
   本机所有 gradle 构建都会因 Radmin VPN / LetsTAP 虚拟网卡触发 JDK 17 的
   `AF_UNIX` loopback bug（`Unable to establish loopback connection`），这是机器级
   问题，不是本项目代码问题。绕过办法：由用户在自己的交互终端执行 gradle
   命令（同一台机器上用户交互终端可以构建成功，自动化工具跑必现报错）。

2. **构建 release APK**
   ```powershell
   cd D:\VscodeProject\ClaudeCodeTest\jinian-app
   npm run build
   npx cap sync android
   cd android
   .\gradlew assembleRelease
   ```
   预期 `BUILD SUCCESSFUL`，产物在 `android/app/build/outputs/apk/release/app-release.apk`。
   注意：release 与之前的 debug APK 签名不同，真机上须先卸载 debug 版再装。

3. **真机验证**（vivo 优先，其次小米/华为）
   按上面「真机验证记录」的模板逐条走，结果追加记录到该章节。
   若某步骤失败，多半是 manifest 权限漏加或 vivo 系统设置未正确打开，
   需要回头排查本地通知/OEM 保活相关实现。
