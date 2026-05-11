import { createI18n } from 'vue-i18n'
import enUS from './locales/en-US.json'
import zhCN from './locales/zh-CN.json'
import zhTW from './locales/zh-TW.json'

export const SUPPORTED_LOCALES = ['zh-CN', 'zh-TW', 'en-US'] as const
export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

export function normalizeLocale(locale?: string): SupportedLocale {
  if (!locale) return 'zh-CN'
  const normalized = locale.toLowerCase()
  if (normalized.startsWith('zh-tw') || normalized.startsWith('zh-hk')) return 'zh-TW'
  if (normalized.startsWith('zh')) return 'zh-CN'
  if (normalized.startsWith('en')) return 'en-US'
  return 'zh-CN'
}

const messages = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'en-US': enUS,
} as const

export const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages,
})
