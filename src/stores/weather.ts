import type { CitySearchResult } from '../api/types'
import type { WeatherInfo } from '../types'
import { defineStore, storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import { searchCities as searchCitiesApi } from '../api/geocoding'
import { getCurrentPosition, reverseGeocode as reverseGeocodeApi } from '../api/location'
import { fetchAirQualityData, fetchWeatherData } from '../api/weather'
import { i18n } from '../i18n'
import { mapWmoCode } from '../utils/weather'
import { useConfigStore } from './config'

export type LocationMode = 'auto' | 'coords' | 'city'

export const useWeatherStore = defineStore('weather', () => {
  const configStore = useConfigStore()
  const { language } = storeToRefs(configStore)

  // --- Persistent State ---
  const locationMode = ref<LocationMode>('auto')
  const customLat = ref(39.9)
  const customLon = ref(116.4)
  const customCity = ref('北京市')
  const refreshInterval = ref(20)
  const showRainEffect = ref(true)
  const showThunderEffect = ref(true)
  const showSnowEffect = ref(true)

  // --- Runtime State ---
  const weatherData = ref<any>(null)
  const airQualityData = ref<any>(null)
  const loading = ref(false)
  const locationText = ref(i18n.global.t('weather.status.locating'))
  const weatherInfo = ref<WeatherInfo>({ text: i18n.global.t('weather.status.loading'), icon: mapWmoCode(-1).icon })
  const cachedCoords = ref<{ lat: number, lon: number, city: string } | null>(null)
  const resolvedCityQuery = ref('')

  async function fetchWeather(lat: number, lon: number) {
    try {
      const weatherPromise = fetchWeatherData(lat, lon)
        .then((wData) => {
          weatherData.value = wData
          weatherInfo.value = mapWmoCode(wData.current.weather_code, wData.current.is_day === 1)
        })
        .catch((error) => {
          console.error('Weather API error:', error)
          weatherInfo.value.text = i18n.global.t('weather.status.apiError')
          weatherInfo.value.icon = mapWmoCode(-1).icon
        })

      const aqiPromise = fetchAirQualityData(lat, lon)
        .then((aData) => {
          airQualityData.value = aData
        })
        .catch((error) => {
          console.error('Air Quality API error:', error)
        })

      await Promise.all([weatherPromise, aqiPromise])
    }
    catch (error) {
      console.error('Update weather failed:', error)
    }
    finally {
      loading.value = false
    }
  }

  function extractSimplifiedChinese(text: string): string {
    if (!text) return text
    const parts = text.split(';')
    if (parts.length > 1) {
      return parts[0].trim()
    }
    return text
  }

  function cleanDisplayName(displayName: string): string {
    if (!displayName) return displayName
    return displayName
      .split(',')
      .map(part => extractSimplifiedChinese(part))
      .join(', ')
  }

  function normalizeCityQuery(query: string): string {
    return extractSimplifiedChinese(query)
      .replace(/\s+/g, '')
      .toLowerCase()
      .trim()
  }

  function pickBestCityResult(results: CitySearchResult[], query: string): CitySearchResult {
    const normalizedQuery = normalizeCityQuery(query)
    const exactMatch = results.find(result => normalizeCityQuery(result.name) === normalizedQuery)
    if (exactMatch) {
      return exactMatch
    }

    const partialMatch = results.find((result) => {
      return normalizeCityQuery(result.displayName).includes(normalizedQuery)
    })
    if (partialMatch) {
      return partialMatch
    }

    return results[0]
  }

  async function searchCities(query: string): Promise<CitySearchResult[]> {
    try {
      const trimmedQuery = query.trim()
      if (!trimmedQuery) {
        return []
      }

      const results = await searchCitiesApi(trimmedQuery, 3, language.value)
      if (results.length > 0) {
        return results.map((r) => {
          const rawName = r.address?.city || ''
          const rawDisplayName = r.display_name || ''
          const cityName = extractSimplifiedChinese(rawName.split(',')[0] || rawName)
          const displayName = cleanDisplayName(rawDisplayName)

          return {
            name: cityName || trimmedQuery,
            displayName: displayName || cityName || trimmedQuery,
            latitude: Number.parseFloat(r.lat),
            longitude: Number.parseFloat(r.lon),
          }
        })
      }
      return []
    }
    catch (e) {
      return []
    }
  }

  async function resolveCityCoords(query: string): Promise<{ lat: number, lon: number, city: string } | null> {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) {
      return null
    }

    const results = await searchCities(trimmedQuery)
    if (results.length === 0) {
      return null
    }

    const bestResult = pickBestCityResult(results, trimmedQuery)
    customLat.value = bestResult.latitude
    customLon.value = bestResult.longitude
    resolvedCityQuery.value = normalizeCityQuery(trimmedQuery)

    return {
      lat: bestResult.latitude,
      lon: bestResult.longitude,
      city: bestResult.name,
    }
  }

  async function getCurrentCoords(): Promise<{ lat: number, lon: number }> {
    if (locationMode.value === 'coords') {
      return { lat: customLat.value, lon: customLon.value }
    }

    if (locationMode.value === 'city') {
      const normalizedCity = normalizeCityQuery(customCity.value)
      const hasValidCoords = Number.isFinite(customLat.value) && Number.isFinite(customLon.value)
      if (normalizedCity && (resolvedCityQuery.value !== normalizedCity || !hasValidCoords)) {
        const resolved = await resolveCityCoords(customCity.value)
        if (resolved) {
          return { lat: resolved.lat, lon: resolved.lon }
        }
      }
      return { lat: customLat.value, lon: customLon.value }
    }

    if (cachedCoords.value) {
      return { lat: cachedCoords.value.lat, lon: cachedCoords.value.lon }
    }

    return { lat: 39.9, lon: 116.4 }
  }

  async function reverseGeocode(lat: number, lon: number) {
    try {
      const data = await reverseGeocodeApi(lat, lon, language.value)
      const city = data.city || data.locality || data.principalSubdivision || i18n.global.t('weather.status.unknownCity')
      return city
    }
    catch (e) {
      return `${lon.toFixed(2)}, ${lat.toFixed(2)}`
    }
  }

  async function updateWeather() {
    loading.value = true
    weatherInfo.value.text = i18n.global.t('weather.status.loading')
    locationText.value = i18n.global.t('weather.status.locating')

    if (locationMode.value === 'coords') {
      cachedCoords.value = null
      const city = await reverseGeocode(customLat.value, customLon.value)
      locationText.value = city
      await fetchWeather(customLat.value, customLon.value)
      return
    }

    if (locationMode.value === 'city') {
      cachedCoords.value = null
      locationText.value = i18n.global.t('weather.status.locating')
      const trimmedCity = customCity.value.trim()
      if (!trimmedCity) {
        const cityEmptyText = i18n.global.t('weather.status.cityEmpty')
        locationText.value = cityEmptyText
        weatherInfo.value.text = cityEmptyText
        loading.value = false
        return
      }

      const normalizedCity = normalizeCityQuery(trimmedCity)
      const hasValidCoords = Number.isFinite(customLat.value) && Number.isFinite(customLon.value)
      const shouldResolve = !normalizedCity || resolvedCityQuery.value !== normalizedCity || !hasValidCoords
      const resolved = shouldResolve
        ? await resolveCityCoords(trimmedCity)
        : { lat: customLat.value, lon: customLon.value, city: trimmedCity }

      if (!resolved) {
        locationText.value = trimmedCity
        weatherInfo.value.text = i18n.global.t('weather.status.apiError')
        loading.value = false
        return
      }

      locationText.value = resolved.city
      await fetchWeather(resolved.lat, resolved.lon)
      return
    }

    // Auto mode
    if (locationMode.value === 'auto' && cachedCoords.value) {
      const { lat, lon } = cachedCoords.value
      locationText.value = cachedCoords.value.city
      await fetchWeather(lat, lon)
      return
    }
    try {
      const coords = await getCurrentPosition(5000, language.value)
      const locationData = await reverseGeocodeApi(coords.latitude, coords.longitude, language.value)
      const cityName = locationData.locality || locationData.city || locationData.principalSubdivision || i18n.global.t('weather.status.unknownCity')
      locationText.value = cityName
      cachedCoords.value = {
        lat: coords.latitude,
        lon: coords.longitude,
        city: cityName,
      }
      await fetchWeather(coords.latitude, coords.longitude)
    }
    catch (error) {
      try {
        locationText.value = i18n.global.t('weather.status.defaultCity')
        const defaultCity = i18n.global.t('weather.status.defaultCity')
        cachedCoords.value = {
          lat: 39.9,
          lon: 116.4,
          city: defaultCity,
        }
        await fetchWeather(39.9, 116.4)
      }
      catch (err) {
        weatherInfo.value.text = i18n.global.t('weather.status.updateTimeout')
        loading.value = false
      }
    }
  }

  // 模式切换同步清理
  watch(locationMode, (newMode) => {
    if (newMode !== 'city') {
      resolvedCityQuery.value = ''
    }
    if (newMode === 'auto') {
      cachedCoords.value = null
      locationText.value = i18n.global.t('weather.status.locating')
    }
  }, { flush: 'sync' })

  watch(() => i18n.global.locale.value, () => {
    if (weatherData.value?.current) {
      weatherInfo.value = mapWmoCode(weatherData.value.current.weather_code, weatherData.value.current.is_day === 1)
    }
    if (loading.value) {
      weatherInfo.value.text = i18n.global.t('weather.status.loading')
      locationText.value = i18n.global.t('weather.status.locating')
    }
  })

  return {
    // Persistent
    locationMode,
    customLat,
    customLon,
    customCity,
    refreshInterval,
    showRainEffect,
    showThunderEffect,
    showSnowEffect,
    // Runtime
    weatherData,
    loading,
    locationText,
    weatherInfo,
    airQualityData,
    // Actions
    updateWeather,
    searchCities,
    getCurrentCoords,
  }
}, {
  persist: {
    pick: [
      'locationMode',
      'customLat',
      'customLon',
      'customCity',
      'refreshInterval',
      'showRainEffect',
      'showThunderEffect',
      'showSnowEffect',
    ],
  },
})
