export interface Vehicle {
  id: number
  name: string
  plate_no: string
  snapshots?: DeviceSnapshot[]
}

export interface DeviceSnapshot {
  id: number
  carId: number
  deviceId: number
  ts: string
  gpsLat?: number
  gpsLon?: number
  carState?: number
  error?: string
  ledState?: string
  
  // BME688 Indoor
  bme688TempIndoor?: number
  bme688HumiIndoor?: number
  bme688PressIndoor?: number
  bme688GasResIndoor?: number

  // BME688 Outdoor
  bme688TempOutdoor?: number
  bme688HumiOutdoor?: number
  bme688PressOutdoor?: number
  bme688GasResOutdoor?: number

  // ENS160 Indoor
  ens160TvocIndoor?: number
  ens160Eco2Indoor?: number
  ens160AqiIndoor?: number

  // ENS160 Outdoor
  ens160TvocOutdoor?: number
  ens160Eco2Outdoor?: number
  ens160AqiOutdoor?: number

  // SGP30 Indoor
  sgp30TvocIndoor?: number
  sgp30Eco2Indoor?: number

  // SGP30 Outdoor
  sgp30TvocOutdoor?: number
  sgp30Eco2Outdoor?: number

  // GM Series Indoor
  gm102bNo2Indoor?: number
  gm202bSmokeIndoor?: number
  gm302bAlcIndoor?: number
  gm502bTvocIndoor?: number
  gm512bH2sIndoor?: number
  gm602bH2sIndoor?: number
  gm702bCoIndoor?: number

  // GM Series Outdoor
  gm102bNo2Outdoor?: number
  gm202bSmokeOutdoor?: number
  gm302bAlcOutdoor?: number
  gm502bTvocOutdoor?: number
  gm512bH2sOutdoor?: number
  gm602bH2sOutdoor?: number
  gm702bCoOutdoor?: number

  // SMD1001 Indoor/Outdoor
  smd1001HchoIndoor?: number
  smd1001HchoOutdoor?: number

  // ZE Series Indoor
  ze08bHchoIndoor?: number
  ze40bTvocIndoor?: number
  ze510HcohIndoor?: number
  ze510H2sIndoor?: number
  ze27O3Indoor?: number

  // ZE Series Outdoor
  ze08bHchoOutdoor?: number
  ze40bTvocOutdoor?: number
  ze510HcohOutdoor?: number
  ze510H2sOutdoor?: number
  ze27O3Outdoor?: number

  // MICS4514 Indoor/Outdoor
  mics4514RedIndoor?: number
  mics4514OxdIndoor?: number
  mics4514RedOutdoor?: number
  mics4514OxdOutdoor?: number

  vehicle?: Vehicle
}

export interface Alert {
  id: number
  carId: number
  deviceId: number
  ts: string
  sensorCode: string
  value: number
  message: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  isResolved: boolean
  resolvedAt?: string
  vehicle?: Vehicle
}
