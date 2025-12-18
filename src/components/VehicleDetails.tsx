import React, { useState } from 'react'
import { 
  Car, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Thermometer, 
  Droplets, 
  Gauge, 
  Activity,
  Battery,
  Signal,
  BarChart3,
  History,
  Bell,
  Shield
} from 'lucide-react'
import type { Vehicle, DeviceSnapshot, Alert } from '../types'

interface VehicleDetailsProps {
  vehicle: Vehicle
  snapshots: Record<number, DeviceSnapshot>
  alerts: Alert[]
  onClose: () => void
}

export default function VehicleDetails({ vehicle, snapshots, alerts, onClose }: VehicleDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'sensors' | 'alerts' | 'history'>('overview')

  const getVehicleStatus = (): 'active' | 'inactive' | 'alert' => {
    const snapshot = snapshots[vehicle.id]
    if (!snapshot) return 'inactive'
    
    const isActive = snapshot.carState === 1
    
    const hasAlert = (
      (snapshot.error && snapshot.error.trim() !== '') ||
      (snapshot.ens160AqiIndoor && snapshot.ens160AqiIndoor > 100) ||
      (snapshot.ens160AqiOutdoor && snapshot.ens160AqiOutdoor > 100) ||
      (snapshot.sgp30Eco2Indoor && snapshot.sgp30Eco2Indoor > 1000) ||
      (snapshot.sgp30Eco2Outdoor && snapshot.sgp30Eco2Outdoor > 1000) ||
      (snapshot.ze27O3Indoor && snapshot.ze27O3Indoor > 80) ||
      (snapshot.ze27O3Outdoor && snapshot.ze27O3Outdoor > 80)
    )

    if (hasAlert) return 'alert'
    return isActive ? 'active' : 'inactive'
  }

  const getStatusIcon = (status: 'active' | 'inactive' | 'alert') => {
    switch (status) {
      case 'active': return <CheckCircle className="w-5 h-5 text-success-500" />
      case 'alert': return <AlertTriangle className="w-5 h-5 text-danger-500" />
      default: return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: 'active' | 'inactive' | 'alert') => {
    switch (status) {
      case 'active': return 'bg-success-100 text-success-800 border-success-200'
      case 'alert': return 'bg-danger-100 text-danger-800 border-danger-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatValue = (value: number | undefined, unit: string) => {
    if (value === undefined || value === null) return 'N/A'
    return `${value.toFixed(2)} ${unit}`
  }

  const getLatestSnapshot = (): DeviceSnapshot | null => {
    return snapshots[vehicle.id] || null
  }

  const status = getVehicleStatus()

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Car className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-bold text-gray-900">{vehicle.name}</h2>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(status)}`}>
              {getStatusIcon(status)}
              <span className="ml-1 capitalize">{status}</span>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
            <span className="ml-2 text-sm text-gray-600">Close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button 
            className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview' 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Overview</span>
          </button>
          <button 
            className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'sensors' 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('sensors')}
          >
            <Thermometer className="w-4 h-4" />
            <span>Sensors</span>
          </button>
          <button 
            className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'alerts' 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('alerts')}
          >
            <Bell className="w-4 h-4" />
            <span>Alerts</span>
            {alerts.length > 0 && (
              <span className="bg-danger-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                {alerts.length}
              </span>
            )}
          </button>
          <button 
            className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'history' 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('history')}
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </button>
        </div>

        {/* Content */}
        <>
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Location</h3>
                </div>
                <div className="space-y-2">
                  {(() => {
                    const snapshot = getLatestSnapshot()
                    return (
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">Device ID: {snapshot?.deviceId || 'N/A'}</div>
                        {snapshot?.gpsLat && snapshot?.gpsLon ? (
                          <div className="text-gray-500 font-mono text-xs mt-2">
                            {snapshot.gpsLat.toFixed(4)}, {snapshot.gpsLon.toFixed(4)}
                          </div>
                        ) : (
                          <div className="text-gray-400 text-xs mt-2">No GPS data</div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Shield className="w-5 h-5 text-success-600" />
                  <h3 className="font-semibold text-gray-900">System Status</h3>
                </div>
                <div className="space-y-2">
                  {(() => {
                    const snapshot = getLatestSnapshot()
                    return (
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">Device ID: {snapshot?.deviceId || 'N/A'}</div>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            snapshot?.carState === 1 ? 'bg-success-100 text-success-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {snapshot?.carState === 1 ? 'Online' : 'Offline'}
                          </span>
                          <span className="text-gray-600">LED: {snapshot?.ledState || 'N/A'}</span>
                        </div>
                        {snapshot?.error && snapshot.error.trim() !== '' && (
                          <div className="text-red-600 text-xs mt-2">Error: {snapshot.error}</div>
                        )}
                        <div className="text-gray-600 mt-2">Alerts: {alerts.length}</div>
                      </div>
                    )
                  })()}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Quick Stats</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Device ID:</span>
                    <span className="font-medium">{getLatestSnapshot()?.deviceId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Alerts:</span>
                    <span className="font-medium text-danger-600">{alerts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plate Number:</span>
                    <span className="font-medium">{vehicle.plate_no}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Update:</span>
                    <span className="font-medium">
                      {getLatestSnapshot()?.ts 
                        ? new Date(getLatestSnapshot()!.ts).toLocaleTimeString()
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'sensors' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(() => {
                const snapshot = getLatestSnapshot()
                
                return (
                  <>
                    {/* Indoor Sensors */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Indoor Sensors</h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          INDOOR
                        </span>
                      </div>
                      
                      {snapshot ? (
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">BME688</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center space-x-2">
                                <Thermometer className="w-4 h-4 text-red-500" />
                                <div>
                                  <div className="text-sm text-gray-600">Temperature</div>
                                  <div className="font-medium">{formatValue(snapshot.bme688TempIndoor, '°C')}</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Droplets className="w-4 h-4 text-blue-500" />
                                <div>
                                  <div className="text-sm text-gray-600">Humidity</div>
                                  <div className="font-medium">{formatValue(snapshot.bme688HumiIndoor, '%')}</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Gauge className="w-4 h-4 text-purple-500" />
                                <div>
                                  <div className="text-sm text-gray-600">Pressure</div>
                                  <div className="font-medium">{formatValue(snapshot.bme688PressIndoor, 'hPa')}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Air Quality</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center space-x-2">
                                <Activity className="w-4 h-4 text-orange-500" />
                                <div>
                                  <div className="text-sm text-gray-600">ENS160 AQI</div>
                                  <div className="font-medium">{formatValue(snapshot.ens160AqiIndoor, '')}</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Activity className="w-4 h-4 text-success-500" />
                                <div>
                                  <div className="text-sm text-gray-600">SGP30 CO₂</div>
                                  <div className="font-medium">{formatValue(snapshot.sgp30Eco2Indoor, 'ppm')}</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <AlertTriangle className="w-4 h-4 text-pink-500" />
                                <div>
                                  <div className="text-sm text-gray-600">ZE27 O₃</div>
                                  <div className="font-medium">{formatValue(snapshot.ze27O3Indoor, 'ppb')}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p>No sensor data available</p>
                        </div>
                      )}
                    </div>

                    {/* Outdoor Sensors */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Outdoor Sensors</h3>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          OUTDOOR
                        </span>
                      </div>
                      
                      {snapshot ? (
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">BME688</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center space-x-2">
                                <Thermometer className="w-4 h-4 text-red-500" />
                                <div>
                                  <div className="text-sm text-gray-600">Temperature</div>
                                  <div className="font-medium">{formatValue(snapshot.bme688TempOutdoor, '°C')}</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Droplets className="w-4 h-4 text-blue-500" />
                                <div>
                                  <div className="text-sm text-gray-600">Humidity</div>
                                  <div className="font-medium">{formatValue(snapshot.bme688HumiOutdoor, '%')}</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Gauge className="w-4 h-4 text-purple-500" />
                                <div>
                                  <div className="text-sm text-gray-600">Pressure</div>
                                  <div className="font-medium">{formatValue(snapshot.bme688PressOutdoor, 'hPa')}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Air Quality</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center space-x-2">
                                <Activity className="w-4 h-4 text-orange-500" />
                                <div>
                                  <div className="text-sm text-gray-600">ENS160 AQI</div>
                                  <div className="font-medium">{formatValue(snapshot.ens160AqiOutdoor, '')}</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Activity className="w-4 h-4 text-success-500" />
                                <div>
                                  <div className="text-sm text-gray-600">SGP30 CO₂</div>
                                  <div className="font-medium">{formatValue(snapshot.sgp30Eco2Outdoor, 'ppm')}</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <AlertTriangle className="w-4 h-4 text-pink-500" />
                                <div>
                                  <div className="text-sm text-gray-600">ZE27 O₃</div>
                                  <div className="font-medium">{formatValue(snapshot.ze27O3Outdoor, 'ppb')}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">System</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center space-x-2">
                                <Battery className="w-4 h-4 text-yellow-500" />
                                <div>
                                  <div className="text-sm text-gray-600">Car Status</div>
                                  <div className={`font-medium ${snapshot.carState === 1 ? 'text-success-600' : 'text-gray-600'}`}>
                                    {snapshot.carState === 1 ? 'ON' : 'OFF'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Signal className="w-4 h-4 text-blue-500" />
                                <div>
                                  <div className="text-sm text-gray-600">LED Status</div>
                                  <div className="font-medium">{snapshot.ledState || 'N/A'}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p>No sensor data available</p>
                        </div>
                      )}
                    </div>
                  </>
                )
              })()}
            </div>
          )}
          {activeTab === 'alerts' && (
            <div>
              {alerts.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-success-500" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Alerts</h3>
                  <p className="text-gray-600">All systems are operating normally</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map(alert => (
                    <div key={alert.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-danger-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-gray-900">{alert.sensorCode}</h4>
                            <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <span>Value: {alert.value}</span>
                              <span>{new Date(alert.ts).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            alert.severity === 'CRITICAL' ? 'bg-danger-100 text-danger-800' :
                            alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                            alert.severity === 'MEDIUM' ? 'bg-warning-100 text-warning-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {alert.severity}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            alert.isResolved ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'
                          }`}>
                            {alert.isResolved ? 'Resolved' : 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'history' && (
            <div className="text-center py-12">
              <History className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">History</h3>
              <p className="text-gray-600">Historical data view coming soon</p>
            </div>
          )}
        </>
      </div>
  )
}
