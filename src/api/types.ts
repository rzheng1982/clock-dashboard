export interface WeatherApiResponse {
  current: {
    time: string
    temperature_2m: number
    rain: number
    wind_speed_10m: number
    is_day: number
    apparent_temperature: number
    showers: number
    relative_humidity_2m: number
    precipitation: number
    weather_code: number
  }
  hourly: {
    time: string[]
    precipitation_probability: number[]
    uv_index: number[]
    temperature_2m: number[]
  }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_probability_max: number[]
  }
  timezone?: string
  current_hour_index?: number
}

export interface QWeatherNowResponse {
  code: string
  updateTime?: string
  now?: {
    obsTime: string
    temp: string
    feelsLike: string
    icon: string
    humidity: string
    precip: string
    windSpeed: string
    cloud?: string
    text?: string
    isDay?: string
  }
}

export interface QWeatherHourlyResponse {
  code: string
  hourly?: Array<{
    fxTime: string
    temp: string
    icon: string
    humidity: string
    pop?: string
    precip?: string
    windSpeed?: string
    uvIndex?: string
  }>
}

export interface QWeatherDailyResponse {
  code: string
  daily?: Array<{
    fxDate: string
    tempMax: string
    tempMin: string
    iconDay: string
    pop?: string
    precip?: string
    uvIndex?: string
  }>
}

export interface QWeatherAirResponse {
  code: string
  now?: {
    aqi?: string
  }
}

export interface QWeatherCityLookupResponse {
  code: string
  location?: Array<{
    name: string
    id?: string
    lat: string
    lon: string
    adm1?: string
    adm2?: string
    country?: string
    tz?: string
  }>
}

export interface AirQualityApiResponse {
  current: {
    us_aqi: number
  }
}

export interface NominatimSearchResult {
  name: string
  display_name: string
  lat: string
  lon: string
  address: {
    aeroway: string
    road: string
    city: string
    county: string
    state: string
    postcode: string
    country: string
    country_code: string
  }
}

export interface BigDataCloudLocationResponse {
  city?: string
  locality?: string
  principalSubdivision?: string
  latitude?: number
  longitude?: number
}

export interface CitySearchResult {
  name: string
  displayName: string
  latitude: number
  longitude: number
}

export interface HAEntityState {
  entity_id: string
  state: string
  attributes: Record<string, any>
  last_changed: string
  last_updated: string
}

export interface HAServiceCallParams {
  entity_id: string
  [key: string]: any
}

export interface Coordinates {
  latitude: number
  longitude: number
}
