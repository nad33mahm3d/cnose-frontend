import React from 'react'
import { Car, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import type { Vehicle, DeviceSnapshot, Alert } from '../types'

interface VehicleCardsProps {
  vehicles: Vehicle[]
  snapshots: Record<number, DeviceSnapshot>
  alerts: Alert[]
  onVehicleSelect: (vehicle: Vehicle) => void
}

export default function VehicleCards({ vehicles, snapshots, alerts, onVehicleSelect }: VehicleCardsProps) {
  const getVehicleStatus = (vehicle: Vehicle): 'active' | 'inactive' | 'alert' => {
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
      case 'active': return <CheckCircle className="w-4 h-4 text-success-500" />
      case 'alert': return <AlertTriangle className="w-4 h-4 text-danger-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: 'active' | 'inactive' | 'alert') => {
    switch (status) {
      case 'active': return 'bg-success-100 text-success-800 border-success-200'
      case 'alert': return 'bg-danger-100 text-danger-800 border-danger-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
      {vehicles.map(vehicle => {
        const status = getVehicleStatus(vehicle)
        const snapshot = snapshots[vehicle.id]
        const vehicleAlerts = alerts.filter(a => a.carId === vehicle.id)
        
        return (
          <div 
            key={vehicle.id}
            className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 cursor-pointer transition-colors bg-white"
            onClick={() => onVehicleSelect(vehicle)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Car className="w-5 h-5 text-primary-600" />
                <h3 className="font-medium text-gray-900">{vehicle.name}</h3>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                {getStatusIcon(status)}
                <span className="ml-1 capitalize">{status}</span>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Plate:</span>
                <span className="font-medium">{vehicle.plate_no}</span>
              </div>
              <div className="flex justify-between">
                <span>Device ID:</span>
                <span className="font-medium">{snapshot?.deviceId || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Alerts:</span>
                <span className={`font-medium ${vehicleAlerts.length > 0 ? 'text-danger-600' : 'text-success-600'}`}>
                  {vehicleAlerts.length}
                </span>
              </div>
              {snapshot?.gpsLat && snapshot?.gpsLon && (
                <div className="flex justify-between text-xs">
                  <span>Location:</span>
                  <span className="font-mono">
                    {snapshot.gpsLat.toFixed(4)}, {snapshot.gpsLon.toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
