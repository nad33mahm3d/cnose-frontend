import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, Legend
} from 'recharts'
import { 
  Thermometer, Droplets, Activity, AlertTriangle, 
  TrendingUp, TrendingDown, Clock, MapPin,
  Car, Shield, Bell, Users
} from 'lucide-react'
import type { Vehicle, DeviceSnapshot, Alert } from '../types'
import { snapshotApi } from '../services/api'

interface AnalyticsDashboardProps {
  vehicles: Vehicle[]
  snapshots: Record<number, DeviceSnapshot>
  alerts: Alert[]
  selectedVehicle?: Vehicle | null
}

interface ChartData {
  timestamp: string
  value: number
  time: string
  date: string
}

interface SensorMetrics {
  sensor: string
  current: number
  average: number
  min: number
  max: number
  trend: 'up' | 'down' | 'stable'
}

interface VehicleAnalytics {
  vehicleId: number
  vehicleName: string
  totalAlerts: number
  activeTime: number
  avgTemperature: number
  avgHumidity: number
  avgCO2: number
  avgTVOC: number
}

export default function AnalyticsDashboard({ 
  vehicles, 
  snapshots, 
  alerts, 
  selectedVehicle 
}: AnalyticsDashboardProps) {
  const [chartData, setChartData] = useState<Record<string, ChartData[]>>({})
  const [selectedSensor, setSelectedSensor] = useState<string>('bme688TempIndoor')
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h')
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'charts' | 'analytics' | 'overview'>('overview')

  const sensorConfigs = useMemo(() => ({
    // BME688 Indoor
    bme688TempIndoor: {
      label: 'Temp Indoor',
      unit: '°C',
      icon: Thermometer,
      color: '#ef4444',
      alertThreshold: 35,
      gradient: ['#fef2f2', '#fecaca', '#f87171', '#ef4444']
    },
    bme688HumiIndoor: {
      label: 'Humidity Indoor',
      unit: '%',
      icon: Droplets,
      color: '#3b82f6',
      alertThreshold: 80,
      gradient: ['#eff6ff', '#bfdbfe', '#60a5fa', '#3b82f6']
    },
    bme688PressIndoor: {
      label: 'Pressure Indoor',
      unit: 'hPa',
      icon: Activity,
      color: '#8b5cf6',
      alertThreshold: 1100,
      gradient: ['#faf5ff', '#e9d5ff', '#c084fc', '#8b5cf6']
    },
    // BME688 Outdoor
    bme688TempOutdoor: {
      label: 'Temp Outdoor',
      unit: '°C',
      icon: Thermometer,
      color: '#f97316',
      alertThreshold: 35,
      gradient: ['#fff7ed', '#ffedd5', '#fdba74', '#f97316']
    },
    bme688HumiOutdoor: {
      label: 'Humidity Outdoor',
      unit: '%',
      icon: Droplets,
      color: '#06b6d4',
      alertThreshold: 80,
      gradient: ['#ecfeff', '#cffafe', '#67e8f9', '#06b6d4']
    },
    // ENS160 Indoor
    ens160AqiIndoor: {
      label: 'AQI Indoor',
      unit: '',
      icon: AlertTriangle,
      color: '#f59e0b',
      alertThreshold: 100,
      gradient: ['#fffbeb', '#fed7aa', '#fbbf24', '#f59e0b']
    },
    ens160TvocIndoor: {
      label: 'TVOC Indoor',
      unit: 'ppb',
      icon: Activity,
      color: '#10b981',
      alertThreshold: 30000,
      gradient: ['#ecfdf5', '#d1fae5', '#6ee7b7', '#10b981']
    },
    ens160Eco2Indoor: {
      label: 'eCO₂ Indoor',
      unit: 'ppm',
      icon: Activity,
      color: '#14b8a6',
      alertThreshold: 1000,
      gradient: ['#f0fdfa', '#ccfbf1', '#5eead4', '#14b8a6']
    },
    // ENS160 Outdoor
    ens160AqiOutdoor: {
      label: 'AQI Outdoor',
      unit: '',
      icon: AlertTriangle,
      color: '#f97316',
      alertThreshold: 100,
      gradient: ['#fff7ed', '#ffedd5', '#fdba74', '#f97316']
    },
    // SGP30 Indoor
    sgp30TvocIndoor: {
      label: 'SGP30 TVOC Indoor',
      unit: 'ppb',
      icon: Activity,
      color: '#22c55e',
      alertThreshold: 500,
      gradient: ['#f0fdf4', '#bbf7d0', '#4ade80', '#22c55e']
    },
    sgp30Eco2Indoor: {
      label: 'SGP30 CO₂ Indoor',
      unit: 'ppm',
      icon: Activity,
      color: '#16a34a',
      alertThreshold: 1000,
      gradient: ['#f0fdf4', '#bbf7d0', '#4ade80', '#16a34a']
    },
    // SGP30 Outdoor
    sgp30Eco2Outdoor: {
      label: 'SGP30 CO₂ Outdoor',
      unit: 'ppm',
      icon: Activity,
      color: '#15803d',
      alertThreshold: 1000,
      gradient: ['#f0fdf4', '#bbf7d0', '#4ade80', '#15803d']
    },
    // ZE27 O3
    ze27O3Indoor: {
      label: 'O₃ Indoor',
      unit: 'ppb',
      icon: AlertTriangle,
      color: '#a855f7',
      alertThreshold: 80,
      gradient: ['#faf5ff', '#e9d5ff', '#c084fc', '#a855f7']
    },
    ze27O3Outdoor: {
      label: 'O₃ Outdoor',
      unit: 'ppb',
      icon: AlertTriangle,
      color: '#9333ea',
      alertThreshold: 80,
      gradient: ['#faf5ff', '#e9d5ff', '#c084fc', '#9333ea']
    },
    // GM702B CO
    gm702bCoIndoor: {
      label: 'CO Indoor',
      unit: 'ppm',
      icon: AlertTriangle,
      color: '#dc2626',
      alertThreshold: 50,
      gradient: ['#fee2e2', '#fecaca', '#f87171', '#dc2626']
    },
    gm702bCoOutdoor: {
      label: 'CO Outdoor',
      unit: 'ppm',
      icon: AlertTriangle,
      color: '#b91c1c',
      alertThreshold: 50,
      gradient: ['#fee2e2', '#fecaca', '#f87171', '#b91c1c']
    }
  }), [])

  const timeRangeConfig = useMemo(() => ({
    '1h': { label: '1 Hour', dataPoints: 60 },
    '6h': { label: '6 Hours', dataPoints: 72 },
    '24h': { label: '24 Hours', dataPoints: 144 },
    '7d': { label: '7 Days', dataPoints: 168 }
  }), [])

  const loadChartData = useCallback(async () => {
    if (!selectedVehicle) return
    
    setLoading(true)
    const newChartData: Record<string, ChartData[]> = {}

    try {
      const snapshots = await snapshotApi.getHistory(selectedVehicle.id, timeRangeConfig[selectedTimeRange].dataPoints)
      
      Object.keys(sensorConfigs).forEach(sensorKey => {
        if (!newChartData[sensorKey]) {
          newChartData[sensorKey] = []
        }

        snapshots.forEach(snapshot => {
          // Use sensor key directly as it now matches the actual field names
          const value = snapshot[sensorKey as keyof DeviceSnapshot] as number
          if (value !== undefined && value !== null && !isNaN(value)) {
            const time = new Date(snapshot.ts)
            newChartData[sensorKey].push({
              timestamp: time.toLocaleTimeString(),
              time: time.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              date: time.toLocaleDateString(),
              value
            })
          }
        })
      })
      
      // Sort by timestamp
      Object.keys(newChartData).forEach(key => {
        newChartData[key].sort((a, b) => 
          new Date('1970/01/01 ' + a.timestamp).getTime() - 
          new Date('1970/01/01 ' + b.timestamp).getTime()
        )
      })
      
      setChartData(newChartData)
    } catch (error) {
      console.error('Failed to load chart data:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedVehicle, sensorConfigs, timeRangeConfig, selectedTimeRange])

  useEffect(() => {
    if (selectedVehicle) {
      loadChartData()
    }
  }, [selectedVehicle, loadChartData])

  // Calculate sensor metrics
  const sensorMetrics = useMemo((): SensorMetrics[] => {
    return Object.entries(sensorConfigs).map(([key, config]) => {
      const data = chartData[key] || []
      const values = data.map(d => d.value).filter((v): v is number => v !== null && v !== undefined)
      
      if (values.length === 0) {
        return {
          sensor: key,
          current: 0,
          average: 0,
          min: 0,
          max: 0,
          trend: 'stable' as const
        }
      }

      const current = values[values.length - 1]
      const average = values.reduce((a, b) => a + b, 0) / values.length
      const min = Math.min(...values)
      const max = Math.max(...values)
      
      // Calculate trend
      const recentValues = values.slice(-5)
      const trend = recentValues.length >= 2 
        ? recentValues[recentValues.length - 1] > recentValues[0] ? 'up' : 'down'
        : 'stable'

      return {
        sensor: key,
        current,
        average,
        min,
        max,
        trend
      }
    })
  }, [chartData, sensorConfigs])

  // Calculate vehicle analytics
  const vehicleAnalytics = useMemo((): VehicleAnalytics[] => {
    return vehicles.map(vehicle => {
      const snapshot = snapshots[vehicle.id]
      const vehicleAlerts = alerts.filter(alert => alert.carId === vehicle.id)

      const temperatures = snapshot ? [
        snapshot.bme688TempIndoor,
        snapshot.bme688TempOutdoor
      ].filter((temp): temp is number => temp !== undefined && temp !== null) : []
      
      const humidities = snapshot ? [
        snapshot.bme688HumiIndoor,
        snapshot.bme688HumiOutdoor
      ].filter((humidity): humidity is number => humidity !== undefined && humidity !== null) : []
      
      const co2Levels = snapshot ? [
        snapshot.sgp30Eco2Indoor,
        snapshot.sgp30Eco2Outdoor
      ].filter((co2): co2 is number => co2 !== undefined && co2 !== null) : []
      
      const tvocLevels = snapshot ? [
        snapshot.ens160AqiIndoor,
        snapshot.ens160AqiOutdoor
      ].filter((tvoc): tvoc is number => tvoc !== undefined && tvoc !== null) : []

      return {
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        totalAlerts: vehicleAlerts.length,
        activeTime: snapshot && snapshot.carState === 1 ? 1 : 0,
        avgTemperature: temperatures.length > 0 ? temperatures.reduce((a: number, b: number) => a + b, 0) / temperatures.length : 0,
        avgHumidity: humidities.length > 0 ? humidities.reduce((a: number, b: number) => a + b, 0) / humidities.length : 0,
        avgCO2: co2Levels.length > 0 ? co2Levels.reduce((a: number, b: number) => a + b, 0) / co2Levels.length : 0,
        avgTVOC: tvocLevels.length > 0 ? tvocLevels.reduce((a: number, b: number) => a + b, 0) / tvocLevels.length : 0
      }
    })
  }, [vehicles, snapshots, alerts])

  // Alert distribution data for pie chart
  const alertDistribution = useMemo(() => {
    const severityCounts = alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(severityCounts).map(([severity, count]) => ({
      name: severity,
      value: count,
      color: severity === 'CRITICAL' ? '#ef4444' : 
             severity === 'HIGH' ? '#f59e0b' : 
             severity === 'MEDIUM' ? '#3b82f6' : '#6b7280'
    }))
  }, [alerts])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const config = sensorConfigs[selectedSensor as keyof typeof sensorConfigs]
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-sm">{label}</p>
          <p style={{ color: payload[0].color }} className="text-sm">
            {config.label}: {payload[0].value.toFixed(2)} {config.unit}
          </p>
        </div>
      )
    }
    return null
  }

  if (!selectedVehicle && viewMode === 'charts') {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Vehicle Selected</h3>
          <p className="text-gray-500 text-sm">Select a vehicle to view detailed charts</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'overview' 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewMode('analytics')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'analytics' 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setViewMode('charts')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'charts' 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Charts
          </button>
        </div>

        {viewMode === 'charts' && selectedVehicle && (
          <div className="flex items-center space-x-4">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {Object.entries(timeRangeConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Overview Mode */}
      {viewMode === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                  <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
                </div>
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Car className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                  <p className="text-2xl font-bold text-danger-600">{alerts.filter(a => !a.isResolved).length}</p>
                </div>
                <div className="p-2 bg-danger-100 rounded-lg">
                  <Bell className="w-6 h-6 text-danger-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {vehicles.length}
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Vehicles</p>
                  <p className="text-2xl font-bold text-success-600">
                    {vehicles.filter(v => 
                      snapshots[v.id]?.carState === 1
                    ).length}
                  </p>
                </div>
                <div className="p-2 bg-success-100 rounded-lg">
                  <Activity className="w-6 h-6 text-success-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Alert Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={alertDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {alertDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Vehicle Performance */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={vehicleAnalytics.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="vehicleName" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalAlerts" fill="#ef4444" name="Alerts" />
                  <Bar dataKey="activeTime" fill="#22c55e" name="Active Time" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Mode */}
      {viewMode === 'analytics' && (
        <div className="space-y-6">
          {/* Sensor Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-96 overflow-y-auto">
            {sensorMetrics.map((metric) => {
              const config = sensorConfigs[metric.sensor as keyof typeof sensorConfigs]
              const IconComponent = config.icon
              const hasAlert = metric.current > config.alertThreshold
              
              return (
                <div 
                  key={metric.sensor}
                  className={`bg-white rounded-lg border-2 p-4 ${
                    hasAlert ? 'border-danger-200 bg-danger-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-lg ${hasAlert ? 'bg-danger-100' : 'bg-primary-100'}`}>
                        <IconComponent className={`w-5 h-5 ${hasAlert ? 'text-danger-600' : 'text-primary-600'}`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{config.label}</h4>
                        <p className="text-sm text-gray-500">{config.unit}</p>
                      </div>
                    </div>
                    {metric.trend === 'up' && <TrendingUp className="w-4 h-4 text-success-600" />}
                    {metric.trend === 'down' && <TrendingDown className="w-4 h-4 text-danger-600" />}
                  </div>

                  <div className="space-y-2">
                    <div className="text-center">
                      <span className="text-2xl font-bold text-gray-900">
                        {metric.current.toFixed(1)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <p className="text-gray-500">Avg</p>
                        <p className="font-medium">{metric.average.toFixed(1)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500">Min</p>
                        <p className="font-medium">{metric.min.toFixed(1)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500">Max</p>
                        <p className="font-medium">{metric.max.toFixed(1)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Radar Chart for Vehicle Comparison */}
          {selectedVehicle && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Sensor Overview</h3>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={sensorMetrics}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="sensor" />
                  <PolarRadiusAxis />
                  <Radar
                    name="Current Values"
                    dataKey="current"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Charts Mode */}
      {viewMode === 'charts' && selectedVehicle && (
        <div className="space-y-6">
          {/* Multi-Sensor Overview Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-primary-600" />
                <h4 className="text-lg font-semibold text-gray-900">
                  All Sensors Overview - {timeRangeConfig[selectedTimeRange].label}
                </h4>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Multiple sensor readings</span>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                  <p className="text-gray-500">Loading chart data...</p>
                </div>
              </div>
            ) : (() => {
              // Combine all sensor data into a single dataset
              const combinedData: Record<string, any>[] = []
              const allTimestamps = new Set<string>()
              
              // Collect all unique timestamps
              Object.values(chartData).forEach(sensorData => {
                sensorData.forEach(point => {
                  allTimestamps.add(point.timestamp)
                })
              })
              
              // Create combined data points
              Array.from(allTimestamps).sort((a, b) => 
                new Date('1970/01/01 ' + a).getTime() - new Date('1970/01/01 ' + b).getTime()
              ).forEach(timestamp => {
                const dataPoint: Record<string, any> = { timestamp, time: timestamp }
                
                Object.entries(chartData).forEach(([sensorKey, sensorData]) => {
                  const point = sensorData.find(p => p.timestamp === timestamp)
                  dataPoint[sensorKey] = point ? point.value : null
                })
                
                combinedData.push(dataPoint)
              })

              return combinedData.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={combinedData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                <p className="font-semibold text-sm mb-2">{label}</p>
                                {payload.map((entry, index) => {
                                  const config = sensorConfigs[entry.dataKey as keyof typeof sensorConfigs]
                                  if (!config || entry.value === null) return null
                                  const numericValue = typeof entry.value === 'number' ? entry.value : parseFloat(entry.value as string)
                                  return (
                                    <p key={index} style={{ color: entry.color }} className="text-sm">
                                      {config.label}: {!isNaN(numericValue) ? numericValue.toFixed(2) : 'N/A'} {config.unit}
                                    </p>
                                  )
                                })}
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Legend />
                      {Object.entries(sensorConfigs).map(([key, config]) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stroke={config.color}
                          strokeWidth={2}
                          dot={{ fill: config.color, strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5, fill: config.color }}
                          connectNulls={false}
                          name={config.label}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                  
                  {/* Sensor Legend with Current Values */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-h-64 overflow-y-auto">
                    {Object.entries(sensorConfigs).map(([key, config]) => {
                      const currentValue = sensorMetrics.find(m => m.sensor === key)?.current || 0
                      const hasAlert = currentValue > config.alertThreshold
                      const IconComponent = config.icon
                      
                      return (
                        <div 
                          key={key}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            hasAlert 
                              ? 'border-danger-200 bg-danger-50' 
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: config.color }}
                              />
                              <IconComponent className={`w-4 h-4 ${hasAlert ? 'text-danger-600' : 'text-gray-600'}`} />
                            </div>
                            {hasAlert && <AlertTriangle className="w-3 h-3 text-danger-500" />}
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-gray-900">{config.label}</h5>
                            <p className="text-lg font-bold text-gray-900">
                              {currentValue.toFixed(1)} {config.unit}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No sensor data available</p>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Individual Sensor Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-primary-600" />
                <h4 className="text-lg font-semibold text-gray-900">Individual Sensor Analysis</h4>
              </div>
            </div>

            {/* Sensor Selection */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-6 max-h-96 overflow-y-auto">
              {Object.entries(sensorConfigs).map(([key, config]) => {
                const currentValue = sensorMetrics.find(m => m.sensor === key)?.current || 0
                const hasAlert = currentValue > config.alertThreshold
                const IconComponent = config.icon
                
                return (
                  <div 
                    key={key}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                      selectedSensor === key 
                        ? 'border-primary-500 shadow-lg bg-primary-50' 
                        : hasAlert 
                          ? 'border-danger-200 bg-danger-50' 
                          : 'border-gray-200 bg-white'
                    }`}
                    onClick={() => setSelectedSensor(key)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-lg ${hasAlert ? 'bg-danger-100' : 'bg-primary-100'}`}>
                          <IconComponent className={`w-5 h-5 ${hasAlert ? 'text-danger-600' : 'text-primary-600'}`} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{config.label}</h4>
                          <p className="text-sm text-gray-500">{config.unit}</p>
                        </div>
                      </div>
                      {hasAlert && <AlertTriangle className="w-4 h-4 text-danger-500" />}
                    </div>

                    <div className="text-center">
                      <span className="text-2xl font-bold text-gray-900">
                        {currentValue.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Individual Sensor Chart */}
            {chartData[selectedSensor] && chartData[selectedSensor].length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData[selectedSensor]}>
                  <defs>
                    <linearGradient id={`gradient-${selectedSensor}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={sensorConfigs[selectedSensor as keyof typeof sensorConfigs]?.color} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={sensorConfigs[selectedSensor as keyof typeof sensorConfigs]?.color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={sensorConfigs[selectedSensor as keyof typeof sensorConfigs]?.color || '#3b82f6'} 
                    strokeWidth={2}
                    fill={`url(#gradient-${selectedSensor})`}
                    dot={{ fill: sensorConfigs[selectedSensor as keyof typeof sensorConfigs]?.color || '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: sensorConfigs[selectedSensor as keyof typeof sensorConfigs]?.color || '#3b82f6' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No data available for {sensorConfigs[selectedSensor as keyof typeof sensorConfigs]?.label}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 