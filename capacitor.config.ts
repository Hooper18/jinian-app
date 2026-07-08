import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.tuchenguang.jinian',
  appName: '纪念',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
  plugins: {
    LocalNotifications: {
      // 不配的话默认拿 launcher 自适应图标当小图标，状态栏里会渲染成灰方块
      smallIcon: 'ic_stat_jinian',
      iconColor: '#C96442',
    },
  },
}

export default config
