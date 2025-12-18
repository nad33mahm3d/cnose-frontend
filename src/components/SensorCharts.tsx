import React, { useState, useEffect, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Thermometer, Droplets, Activity, AlertTriangle } from 'lucide-react'
import type { Vehicle, DeviceSnapshot } from '../types'
import { snapshotApi } from '../services/api'

interface SensorChartsProps {
  vehicles: Vehicle[]
  selectedVehicle?: Vehicle | null
}

interface ChartData {
  timestamp: string
  value: number
  time: string
}

export default function SensorCharts({ selectedVehicle }: SensorChartsProps) {
  const [chartData, setChartData] = useState<Record<string, ChartData[]>>({})
  const [selectedSensor, setSelectedSensor] = useState<string>('bme688TempIndoor')
  const [loading, setLoading] = useState(false)

  const sensorConfigs = React.useMemo(() => ({
    // BME688 Indoor
    bme688TempIndoor: {
      label: 'Temp Indoor',
      unit: '°C',
      icon: Thermometer,
      color: '#ef4444',
      alertThreshold: 35
    },
    bme688HumiIndoor: {
      label: 'Humidity Indoor',
      unit: '%',
      icon: Droplets,
      color: '#3b82f6',
      alertThreshold: 80
    },
    bme688PressIndoor: {
      label: 'Pressure Indoor',
      unit: 'hPa',
      icon: Activity,
      color: '#8b5cf6',
      alertThreshold: 1100
    },
    // BME688 Outdoor
    bme688TempOutdoor: {
      label: 'Temp Outdoor',
      unit: '°C',
      icon: Thermometer,
      color: '#f97316',
      alertThreshold: 35
    },
    bme688HumiOutdoor: {
      label: 'Humidity Outdoor',
      unit: '%',
      icon: Droplets,
      color: '#06b6d4',
      alertThreshold: 80
    },
    // ENS160 Indoor
    ens160AqiIndoor: {
      label: 'AQI Indoor',
      unit: '',
      icon: AlertTriangle,
      color: '#f59e0b',
      alertThreshold: 100
    },
    ens160TvocIndoor: {
      label: 'TVOC Indoor',
      unit: 'ppb',
      icon: Activity,
      color: '#10b981',
      alertThreshold: 30000
    },
    ens160Eco2Indoor: {
      label: 'eCO₂ Indoor',
      unit: 'ppm',
      icon: Activity,
      color: '#14b8a6',
      alertThreshold: 1000
    },
    // ENS160 Outdoor
    ens160AqiOutdoor: {
      label: 'AQI Outdoor',
      unit: '',
      icon: AlertTriangle,
      color: '#f97316',
      alertThreshold: 100
    },
    // SGP30 Indoor
    sgp30TvocIndoor: {
      label: 'SGP30 TVOC Indoor',
      unit: 'ppb',
      icon: Activity,
      color: '#22c55e',
      alertThreshold: 500
    },
    sgp30Eco2Indoor: {
      label: 'SGP30 CO₂ Indoor',
      unit: 'ppm',
      icon: Activity,
      color: '#16a34a',
      alertThreshold: 1000
    },
    // SGP30 Outdoor
    sgp30Eco2Outdoor: {
      label: 'SGP30 CO₂ Outdoor',
      unit: 'ppm',
      icon: Activity,
      color: '#15803d',
      alertThreshold: 1000
    },
    // ZE27 O3
    ze27O3Indoor: {
      label: 'O₃ Indoor',
      unit: 'ppb',
      icon: AlertTriangle,
      color: '#a855f7',
      alertThreshold: 80
    },
    ze27O3Outdoor: {
      label: 'O₃ Outdoor',
      unit: 'ppb',
      icon: AlertTriangle,
      color: '#9333ea',
      alertThreshold: 80
    },
    // GM702B CO
    gm702bCoIndoor: {
      label: 'CO Indoor',
      unit: 'ppm',
      icon: AlertTriangle,
      color: '#dc2626',
      alertThreshold: 50
    },
    gm702bCoOutdoor: {
      label: 'CO Outdoor',
      unit: 'ppm',
      icon: AlertTriangle,
      color: '#b91c1c',
      alertThreshold: 50
    }
  }), [])

  const loadChartData = useCallback(async () => {
    if (!selectedVehicle) return
    
    setLoading(true)
    const newChartData: Record<string, ChartData[]> = {}

    try {
      const snapshots = await snapshotApi.getHistory(selectedVehicle.id, 20)
      
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
  }, [selectedVehicle, sensorConfigs])

  useEffect(() => {
    if (selectedVehicle) {
      loadChartData()
    }
  }, [selectedVehicle, loadChartData])

  const getCurrentValue = (sensorKey: string): number | null => {
    const data = chartData[sensorKey]
    return data && data.length > 0 ? data[data.length - 1].value : null
  }

  const getAlertStatus = (sensorKey: string): boolean => {
    const currentValue = getCurrentValue(sensorKey)
    const config = sensorConfigs[sensorKey as keyof typeof sensorConfigs]
    return currentValue !== null && currentValue > config.alertThreshold
  }

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

  if (!selectedVehicle) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Vehicle Selected</h3>
          <p className="text-gray-500 text-sm">Select a vehicle to view sensor charts</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sensor Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-h-96 overflow-y-auto">
        {Object.entries(sensorConfigs).map(([key, config]) => {
          const currentValue = getCurrentValue(key)
          const hasAlert = getAlertStatus(key)
          const IconComponent = config.icon
          
          return (
            <div 
              key={key}
              className={`p-4 bg-white rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                selectedSensor === key 
                  ? 'border-primary-500 shadow-lg' 
                  : hasAlert 
                    ? 'border-danger-200 bg-danger-50' 
                    : 'border-gray-200'
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
                  {currentValue !== null ? currentValue.toFixed(1) : 'N/A'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {(() => {
              const IconComponent = sensorConfigs[selectedSensor as keyof typeof sensorConfigs]?.icon
              return IconComponent ? <IconComponent className="w-5 h-5 text-primary-600" /> : null
            })()}
            <h4 className="text-lg font-semibold text-gray-900">
              {sensorConfigs[selectedSensor as keyof typeof sensorConfigs]?.label} - Line Chart
            </h4>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
              <p className="text-gray-500">Loading chart data...</p>
            </div>
          </div>
        ) : chartData[selectedSensor] && chartData[selectedSensor].length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData[selectedSensor]}>
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
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={sensorConfigs[selectedSensor as keyof typeof sensorConfigs]?.color || '#3b82f6'} 
                strokeWidth={2}
                dot={{ fill: sensorConfigs[selectedSensor as keyof typeof sensorConfigs]?.color || '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: sensorConfigs[selectedSensor as keyof typeof sensorConfigs]?.color || '#3b82f6' }}
              />
            </LineChart>
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
  )
} 