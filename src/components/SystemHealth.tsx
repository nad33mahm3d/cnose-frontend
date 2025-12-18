import React, { useState, useEffect, useMemo } from 'react'
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Server, 
  Cpu, 
  HardDrive,
  Network,
  CheckCircle,
  AlertTriangle,
  XCircle,
  MemoryStick
} from 'lucide-react'
import type { Vehicle, DeviceSnapshot } from '../types'

interface SystemHealthProps {
  vehicles: Vehicle[]
  snapshots: Record<number, DeviceSnapshot>
}

interface HealthMetric {
  name: string
  value: number
  unit: string
  status: 'healthy' | 'warning' | 'critical'
  icon: React.ComponentType<any>
  description: string
}

export default function SystemHealth({ vehicles, snapshots }: SystemHealthProps) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Update timestamp every second
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const healthMetrics = useMemo((): HealthMetric[] => {
    const totalVehicles = vehicles.length
    const onlineVehicles = vehicles.filter(v => snapshots[v.id] && snapshots[v.id].carState === 1).length
    const offlineVehicles = totalVehicles - onlineVehicles
    const connectivityRate = totalVehicles > 0 ? (onlineVehicles / totalVehicles) * 100 : 0

    // Calculate average sensor values
    const allSnapshots = Object.values(snapshots)
    const temperatures = allSnapshots.flatMap(s => [
      s.bme688TempIndoor,
      s.bme688TempOutdoor
    ]).filter((temp): temp is number => temp !== undefined && temp !== null)
    const humidities = allSnapshots.flatMap(s => [
      s.bme688HumiIndoor,
      s.bme688HumiOutdoor
    ]).filter((humidity): humidity is number => humidity !== undefined && humidity !== null)
    const co2Levels = allSnapshots.flatMap(s => [
      s.sgp30Eco2Indoor,
      s.sgp30Eco2Outdoor
    ]).filter((co2): co2 is number => co2 !== undefined && co2 !== null)
    
    const avgTemperature = temperatures.length > 0 
      ? temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length 
      : 0
    const avgHumidity = humidities.length > 0 
      ? humidities.reduce((sum, humidity) => sum + humidity, 0) / humidities.length 
      : 0
    const avgCO2 = co2Levels.length > 0 
      ? co2Levels.reduce((sum, co2) => sum + co2, 0) / co2Levels.length 
      : 0

    // Calculate system load (simulated)
    const systemLoad = Math.random() * 100
    const memoryUsage = 45 + Math.random() * 30
    const diskUsage = 60 + Math.random() * 20
    const networkLatency = 20 + Math.random() * 80

    return [
      {
        name: 'Device Connectivity',
        value: connectivityRate,
        unit: '%',
        status: connectivityRate > 90 ? 'healthy' : connectivityRate > 70 ? 'warning' : 'critical',
        icon: connectivityRate > 90 ? Wifi : WifiOff,
        description: `${onlineVehicles}/${totalVehicles} vehicles online`
      },
      {
        name: 'System Load',
        value: systemLoad,
        unit: '%',
        status: systemLoad < 70 ? 'healthy' : systemLoad < 90 ? 'warning' : 'critical',
        icon: Cpu,
        description: 'CPU utilization'
      },
      {
        name: 'Memory Usage',
        value: memoryUsage,
        unit: '%',
        status: memoryUsage < 80 ? 'healthy' : memoryUsage < 95 ? 'warning' : 'critical',
        icon: MemoryStick,
        description: 'RAM utilization'
      },
      {
        name: 'Disk Usage',
        value: diskUsage,
        unit: '%',
        status: diskUsage < 85 ? 'healthy' : diskUsage < 95 ? 'warning' : 'critical',
        icon: HardDrive,
        description: 'Storage utilization'
      },
      {
        name: 'Network Latency',
        value: networkLatency,
        unit: 'ms',
        status: networkLatency < 50 ? 'healthy' : networkLatency < 100 ? 'warning' : 'critical',
        icon: Network,
        description: 'Average response time'
      },
      {
        name: 'Avg Temperature',
        value: avgTemperature,
        unit: '°C',
        status: avgTemperature < 30 ? 'healthy' : avgTemperature < 35 ? 'warning' : 'critical',
        icon: Activity,
        description: 'System temperature'
      }
    ]
  }, [vehicles, snapshots])

  const overallStatus = useMemo(() => {
    const criticalCount = healthMetrics.filter(m => m.status === 'critical').length
    const warningCount = healthMetrics.filter(m => m.status === 'warning').length

    if (criticalCount > 0) return { status: 'critical', label: 'Critical Issues', icon: XCircle }
    if (warningCount > 0) return { status: 'warning', label: 'Warnings', icon: AlertTriangle }
    return { status: 'healthy', label: 'All Systems Operational', icon: CheckCircle }
  }, [healthMetrics])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-success-600 bg-success-50 border-success-200'
      case 'warning': return 'text-warning-600 bg-warning-50 border-warning-200'
      case 'critical': return 'text-danger-600 bg-danger-50 border-danger-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />
      case 'warning': return <AlertTriangle className="w-4 h-4" />
      case 'critical': return <XCircle className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Server className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
            <p className="text-sm text-gray-500">Real-time system monitoring</p>
          </div>
        </div>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(overallStatus.status)}`}>
          <overallStatus.icon className="w-4 h-4" />
          <span className="text-sm font-medium">{overallStatus.label}</span>
        </div>
      </div>

      {/* Health Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {healthMetrics.map((metric) => {
          const IconComponent = metric.icon
          return (
            <div
              key={metric.name}
              className={`p-4 rounded-lg border-2 transition-all ${getStatusColor(metric.status)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <IconComponent className="w-5 h-5" />
                  <span className="font-medium text-sm">{metric.name}</span>
                </div>
                {getStatusIcon(metric.status)}
              </div>
              
              <div className="mb-2">
                <span className="text-2xl font-bold">
                  {metric.value.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500 ml-1">{metric.unit}</span>
              </div>
              
              <p className="text-xs text-gray-500">{metric.description}</p>
              
              {/* Progress bar */}
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    metric.status === 'healthy' ? 'bg-success-500' :
                    metric.status === 'warning' ? 'bg-warning-500' : 'bg-danger-500'
                  }`}
                  style={{ width: `${Math.min(metric.value, 100)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* System Status Summary */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-3 h-3 text-success-500" />
              <span>{healthMetrics.filter(m => m.status === 'healthy').length} Healthy</span>
            </div>
            <div className="flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3 text-warning-500" />
              <span>{healthMetrics.filter(m => m.status === 'warning').length} Warnings</span>
            </div>
            <div className="flex items-center space-x-1">
              <XCircle className="w-3 h-3 text-danger-500" />
              <span>{healthMetrics.filter(m => m.status === 'critical').length} Critical</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 