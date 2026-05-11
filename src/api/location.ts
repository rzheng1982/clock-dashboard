import type { BigDataCloudLocationResponse, Coordinates, QWeatherCityLookupResponse } from './types'
import { assertQWeatherCode, buildQWeatherUrl, mapLanguageToQWeather } from './qweather'

function normalizeQWeatherLocation(data: QWeatherCityLookupResponse): BigDataCloudLocationResponse | null {
  const location = data.location?.[0]
  if (!location) {
    return null
  }
  return {
    city: location.name,
    locality: location.adm2 || location.name,
    principalSubdivision: location.adm1,
    latitude: Number.parseFloat(location.lat),
    longitude: Number.parseFloat(location.lon),
  }
}

async function lookupCityByQWeatherLocation(location: string, language: string): Promise<BigDataCloudLocationResponse | null> {
  const url = buildQWeatherUrl('/geo/v2/city/lookup', {
    location,
    lang: mapLanguageToQWeather(language),
    number: 1,
  })
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`QWeather location lookup API error: ${response.statusText}`)
  }
  const data = await response.json() as QWeatherCityLookupResponse
  assertQWeatherCode(data, 'QWeather location lookup')
  return normalizeQWeatherLocation(data)
}

export async function reverseGeocode(lat: number, lon: number, language: string): Promise<BigDataCloudLocationResponse> {
  try {
    const normalized = await lookupCityByQWeatherLocation(`${lon},${lat}`, language)
    if (normalized) {
      return normalized
    }
  }
  catch {
  }

  const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=${language}`)
  if (!response.ok) {
    throw new Error(`Reverse geocoding API error: ${response.statusText}`)
  }
  return await response.json() as BigDataCloudLocationResponse
}

export async function getLocationByIp(language: string): Promise<BigDataCloudLocationResponse> {
  const qweatherIpCandidates = ['auto_ip', 'auto:ip', 'ip']
  for (const candidate of qweatherIpCandidates) {
    try {
      const normalized = await lookupCityByQWeatherLocation(candidate, language)
      if (normalized?.latitude && normalized?.longitude) {
        return normalized
      }
    }
    catch {
    }
  }

  const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=${language}`)
  if (!res.ok) {
    throw new Error(`IP location API error: ${res.statusText}`)
  }

  return await res.json() as BigDataCloudLocationResponse
}

export async function getCurrentPosition(timeout: number = 5000, language: string): Promise<Coordinates> {
  if (!navigator.geolocation) {
    const ipLocation = await getLocationByIp(language)
    if (ipLocation.latitude && ipLocation.longitude) {
      return {
        latitude: ipLocation.latitude,
        longitude: ipLocation.longitude,
      }
    }
    throw new Error('Geolocation is not supported and IP location failed')
  }

  try {
    return await new Promise<Coordinates>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (error) => {
          reject(error)
        },
        { timeout },
      )
    })
  }
  catch (error) {
    const ipLocation = await getLocationByIp(language)
    if (ipLocation.latitude && ipLocation.longitude) {
      return {
        latitude: ipLocation.latitude,
        longitude: ipLocation.longitude,
      }
    }
    throw new Error('Geolocation failed and IP location failed')
  }
}
