export interface HAConfig {
  url: string
  token: string
  entities: HAEntity[]
}

export interface HAEntity {
  id: string
  name: string
}

export interface WeatherInfo {
  text: string
  icon?: string
}

export interface LunarInfo {
  month: string // 正月、冬月、闰二月
  date: string // 初一、十五
  year: string // 乙巳
  yearShengxiao: string // 蛇
  monthGanzhi: string // 己丑
  dayGanzhi: string // 乙酉
  isFestival: boolean
  festival?: string
  holiday?: string // 如：休、班
  yi?: string[] // 宜
  ji?: string[] // 忌
  chong?: string // 冲
  sha?: string // 煞
  wuxing?: string // 五行
  pengzu?: string[] // 彭祖百忌
  hours?: {
    hour: string // 时辰 (如: 子时)
    ganzhi: string // 干支 (如: 甲子)
    luck: string // 吉凶 (如: 吉/凶)
    tianShen: string // 天神 (如: 青龙)
    js: string // 宜
    xs: string // 忌
  }[]
}
