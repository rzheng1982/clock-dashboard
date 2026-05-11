export const QWEATHER_API_KEY = '995725a47cc546f097e1c75a8a46a876'
export const QWEATHER_API_HOST = 'k64d945tk8.re.qweatherapi.com'

export function mapLanguageToQWeather(language: string): string {
  return language.startsWith('en') ? 'en' : 'zh'
}

export function buildQWeatherUrl(path: string, params: Record<string, string | number | undefined>): string {
  const url = new URL(`https://${QWEATHER_API_HOST}${path}`)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })
  url.searchParams.set('key', QWEATHER_API_KEY)
  return url.toString()
}

export function assertQWeatherCode(data: { code?: string }, context: string) {
  if (data?.code !== '200') {
    throw new Error(`${context} error: code=${data?.code || 'unknown'}`)
  }
}
