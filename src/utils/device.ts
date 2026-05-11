export enum DeviceType {
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop',
}

export function detectDevice(): DeviceType {
  const ua = navigator.userAgent.toLowerCase()

  // 检测是否为移动设备
  const isMobile = /iphone|ipod|android.*mobile|windows.*phone|blackberry.*mobile/i.test(ua)

  // 检测是否为平板
  const isTablet = /ipad|android(?!.*mobile)|tablet|kindle|silk/i.test(ua)

  if (isTablet) return DeviceType.TABLET
  if (isMobile) return DeviceType.MOBILE
  return DeviceType.DESKTOP
}

export function isIpadIOS15OrLower(): boolean {
  const ua = navigator.userAgent
  if (!/iPad/.test(ua)) return false
  const match = ua.match(/OS (\d+)[._]/)
  if (!match) return false
  return Number(match[1]) <= 15
}
