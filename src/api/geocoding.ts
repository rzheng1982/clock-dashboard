import type { NominatimSearchResult, QWeatherCityLookupResponse } from './types'
import { assertQWeatherCode, buildQWeatherUrl, mapLanguageToQWeather } from './qweather'

export async function searchCities(query: string, limit: number = 3, language: string = 'zh-CN'): Promise<NominatimSearchResult[]> {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) {
    return []
  }

  const url = buildQWeatherUrl('/geo/v2/city/lookup', {
    location: trimmedQuery,
    number: Math.max(1, Math.min(10, limit)),
    lang: mapLanguageToQWeather(language),
  })
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`Geocoding API error: ${res.statusText}`)
  }

  const data = await res.json() as QWeatherCityLookupResponse
  assertQWeatherCode(data, 'QWeather geo lookup')
  const locations = data.location || []
  if (locations.length > 0) {
    return locations.map((item) => {
      const displayNameParts = [item.name, item.adm2, item.adm1, item.country].filter(Boolean)
      return {
        name: item.name,
        display_name: displayNameParts.join(', '),
        lat: item.lat,
        lon: item.lon,
        address: {
          aeroway: '',
          road: '',
          city: item.name || '',
          county: item.adm2 || '',
          state: item.adm1 || '',
          postcode: '',
          country: item.country || '',
          country_code: '',
        },
      }
    })
  }

  return []
}
