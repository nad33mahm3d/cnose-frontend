import React, { useState, useCallback } from 'react'
import { 
  Car, 
  MapPin, 
  AlertTriangle, 
  Activity, 
  RefreshCw,
  Users,
  Shield,
  Bell,
  Settings,
  Wifi,
  WifiOff
} from 'lucide-react'
import type { Vehicle } from '../types'
import { useDashboardData } from '../hooks/useDashboardData'
import VehicleMap from './VehicleMap'
import VehicleCards from './VehicleCards'
import AnalyticsDashboard from './AnalyticsDashboard'
import VehicleDetails from './VehicleDetails'
import RealTimeNotifications from './RealTimeNotifications'
import SystemHealth from './SystemHealth'

export default function Dashboard() {
  const { data, loading, error, refreshData, isInitialized } = useDashboardData(10000)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)

  console.log('Dashboard render:', {
    isInitialized,
    vehiclesCount: data.vehicles.length,
    alertsCount: data.alerts.length,
    snapshotsCount: Object.keys(data.snapshots).length,
    loading,
    error
  })

  const handleVehicleSelect = useCallback((vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
  }, [])

  const handleCloseVehicleDetails = useCallback(() => {
    setSelectedVehicle(null)
  }, [])

  const handleNotificationDismiss = useCallback((notificationId: string) => {
    // Handle notification dismissal if needed
    console.log('Notification dismissed:', notificationId)
  }, [])

  const getVehicleStatus = (vehicle: Vehicle): 'active' | 'inactive' | 'alert' => {
    const snapshot = data.snapshots[vehicle.id]
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

  const activeVehicles = data.vehicles.filter(v => getVehicleStatus(v) === 'active').length
  const activeAlerts = data.alerts.filter(a => !a.isResolved).length
  const onlineVehicles = data.vehicles.filter(v => data.snapshots[v.id] && data.snapshots[v.id].carState === 1).length

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Car className="w-8 h-8 text-primary-600" />
                <h1 className="text-2xl font-bold text-gray-900">VEM Dashboard</h1>
              </div>
              <div className="hidden md:flex items-center space-x-6 text-sm text-gray-500">
                <span>Last updated: {data.lastUpdate.toLocaleTimeString()}</span>
                <button 
                  onClick={refreshData}
                  disabled={loading.vehicles || loading.alerts || loading.snapshots}
                  className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${(loading.vehicles || loading.alerts || loading.snapshots) ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                {error && (
                  <span className="text-danger-600 text-xs bg-danger-50 px-2 py-1 rounded">
                    {error}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <RealTimeNotifications 
                alerts={data.alerts}
                onDismiss={handleNotificationDismiss}
              />
              <div className="flex items-center space-x-2 text-gray-500">
                <Settings className="w-5 h-5" />
                <span className="hidden md:block">Settings</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                <p className="text-3xl font-bold text-gray-900">{data.vehicles.length}</p>
              </div>
              <div className="p-3 bg-primary-100 rounded-full">
                <Car className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Vehicles</p>
                <p className="text-3xl font-bold text-success-600">{activeVehicles}</p>
              </div>
              <div className="p-3 bg-success-100 rounded-full">
                <Activity className="w-6 h-6 text-success-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Online Vehicles</p>
                <p className="text-3xl font-bold text-blue-600">{onlineVehicles}</p>
                <p className="text-xs text-gray-500">{data.vehicles.length} total</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Wifi className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-3xl font-bold text-danger-600">{activeAlerts}</p>
              </div>
              <div className="p-3 bg-danger-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-danger-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <p className="text-3xl font-bold text-success-600">Online</p>
                <p className="text-xs text-gray-500">All systems operational</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* System Health Section */}
        <div className="mb-8">
          <SystemHealth 
            vehicles={data.vehicles}
            snapshots={data.snapshots}
          />
        </div>

        {/* Map Section - Full Width */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Vehicle Locations</h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live tracking</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                    <span>Active</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-danger-500 rounded-full"></div>
                    <span>Alert</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span>Inactive</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <VehicleMap 
                onVehicleSelect={handleVehicleSelect}
              />
            </div>
          </div>
        </div>

        {/* Vehicle Cards Section */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-success-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Vehicle Status</h2>
                </div>
                <span className="text-sm text-gray-500">{data.vehicles.length} vehicles</span>
              </div>
            </div>
            <div className="p-6">
              <VehicleCards 
                vehicles={data.vehicles}
                snapshots={data.snapshots}
                alerts={data.alerts}
                onVehicleSelect={handleVehicleSelect}
              />
            </div>
          </div>
        </div>

        {/* Vehicle Details Section - Expandable */}
        {selectedVehicle && (
          <div className="mb-8">
            <VehicleDetails 
              vehicle={selectedVehicle}
              snapshots={data.snapshots}
              alerts={data.alerts.filter(a => a.carId === selectedVehicle.id)}
              onClose={handleCloseVehicleDetails}
            />
          </div>
        )}

        {/* Enhanced Analytics Dashboard */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Analytics & Sensor Data</h2>
                {loading.snapshots && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    <span>Updating sensor data...</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6">
              <AnalyticsDashboard 
                vehicles={data.vehicles}
                snapshots={data.snapshots}
                alerts={data.alerts}
                selectedVehicle={selectedVehicle}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 