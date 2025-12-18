import React, { useEffect, useRef, useState, useCallback } from 'react'
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api'
import { MapPin } from 'lucide-react'
import type { Vehicle, DeviceSnapshot } from '../types'
import { snapshotApi } from '../services/api'
import { vehicleApi } from '../services/api'

interface VehicleMapProps {
  onVehicleSelect: (vehicle: Vehicle) => void
}

const mapContainerStyle = {
  width: '100%',
  height: '600px'
}

const defaultCenter = {
  lat: 25.2048,
  lng: 55.2708
}

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ['places']

// Get Google Maps API key from environment variable
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''

interface VehicleWithSnapshot extends Vehicle {
  snapshot?: DeviceSnapshot
  status: 'active' | 'inactive' | 'alert'
}

export default function VehicleMap({ onVehicleSelect }: VehicleMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null)
  const [vehicles, setVehicles] = useState<VehicleWithSnapshot[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithSnapshot | null>(null)
  const [snapshots, setSnapshots] = useState<Record<number, DeviceSnapshot>>({})
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isLoaded, setIsLoaded] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load vehicles and their snapshots
  const fetchVehiclesAndSnapshots = useCallback(async () => {
    try {
      console.log('VehicleMap: Fetching vehicles and snapshots...')
      
      // Fetch all vehicles
      const vehiclesData = await vehicleApi.getAll()
      
      // Fetch latest snapshot for each vehicle
      const snapshotData: Record<number, DeviceSnapshot> = {}
      const vehiclesWithSnapshots: VehicleWithSnapshot[] = []
      
      for (const vehicle of vehiclesData) {
        try {
          const snapshot = await snapshotApi.getLatest(vehicle.id)
          if (snapshot) {
            snapshotData[vehicle.id] = snapshot
            
            // Determine status
            let status: 'active' | 'inactive' | 'alert' = 'inactive'
            if (snapshot.carState === 1) {
              status = 'active'
            }
            if (snapshot.error && snapshot.error.trim() !== '') {
              status = 'alert'
            }
            if (snapshot.ens160AqiIndoor && snapshot.ens160AqiIndoor > 100) {
              status = 'alert'
            }
            if (snapshot.ens160AqiOutdoor && snapshot.ens160AqiOutdoor > 100) {
              status = 'alert'
            }
            
            vehiclesWithSnapshots.push({
              ...vehicle,
              snapshot,
              status
            })
          } else {
            vehiclesWithSnapshots.push({
              ...vehicle,
              status: 'inactive'
            })
          }
        } catch (err) {
          console.warn(`VehicleMap: No snapshot for vehicle ${vehicle.id}:`, err)
          vehiclesWithSnapshots.push({
            ...vehicle,
            status: 'inactive'
          })
        }
      }
      
      setVehicles(vehiclesWithSnapshots)
      setSnapshots(snapshotData)
      setLastUpdate(new Date())
      console.log('VehicleMap: Loaded', vehiclesWithSnapshots.length, 'vehicles')
    } catch (err) {
      console.error('VehicleMap: Failed to fetch data:', err)
    }
  }, [])

  // Start polling for updates
  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    // Initial fetch
    fetchVehiclesAndSnapshots()
    
    // Set up polling every 5 seconds
    intervalRef.current = setInterval(() => {
      fetchVehiclesAndSnapshots()
    }, 5000)
    
    console.log('VehicleMap: Started polling every 5 seconds')
  }, [fetchVehiclesAndSnapshots])

  useEffect(() => {
    startPolling()
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [startPolling])

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
    setIsLoaded(true)
    
    // Fit bounds to show all markers
    if (vehicles.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      vehicles.forEach(vehicle => {
        if (vehicle.snapshot?.gpsLat && vehicle.snapshot?.gpsLon) {
          bounds.extend({
            lat: vehicle.snapshot.gpsLat,
            lng: vehicle.snapshot.gpsLon
          })
        }
      })
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds)
      }
    }
  }, [vehicles])

  const getMarkerIcon = (status: 'active' | 'inactive' | 'alert') => {
    const colors = {
      active: '#22c55e',
      inactive: '#6B7280',
      alert: '#ef4444'
    }
    
    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: colors[status],
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2
    }
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="relative w-full h-full flex items-center justify-center" style={{ minHeight: '600px' }}>
        <div className="text-center">
          <p className="text-gray-600 mb-2">Google Maps API Key not configured</p>
          <p className="text-sm text-gray-500">Please set REACT_APP_GOOGLE_MAPS_API_KEY in your .env file</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={libraries}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={defaultCenter}
          zoom={12}
          onLoad={onMapLoad}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true
          }}
        >
          {vehicles.map(vehicle => {
            if (!vehicle.snapshot?.gpsLat || !vehicle.snapshot?.gpsLon) return null
            
            return (
              <Marker
                key={vehicle.id}
                position={{
                  lat: vehicle.snapshot.gpsLat,
                  lng: vehicle.snapshot.gpsLon
                }}
                icon={getMarkerIcon(vehicle.status)}
                onClick={() => {
                  setSelectedVehicle(vehicle)
                  onVehicleSelect(vehicle)
                }}
              >
                {selectedVehicle?.id === vehicle.id && (
                  <InfoWindow
                    onCloseClick={() => setSelectedVehicle(null)}
                    position={{
                      lat: vehicle.snapshot.gpsLat!,
                      lng: vehicle.snapshot.gpsLon!
                    }}
                  >
                    <div style={{ padding: '8px', minWidth: '200px' }}>
                      <h3 style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#1F2937' }}>
                        {vehicle.name}
                      </h3>
                      <p style={{ margin: '0 0 4px 0', color: '#6B7280', fontSize: '14px' }}>
                        {vehicle.plate_no}
                      </p>
                      <p style={{ margin: '0 0 8px 0', color: '#6B7280', fontSize: '12px' }}>
                        Device ID: {vehicle.snapshot.deviceId}
                      </p>
                      <p style={{ margin: '0 0 8px 0', color: vehicle.status === 'alert' ? '#ef4444' : vehicle.status === 'active' ? '#22c55e' : '#6B7280', fontWeight: 'bold', textTransform: 'capitalize' }}>
                        {vehicle.status}
                      </p>
                      {vehicle.snapshot.carState !== undefined && (
                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6B7280' }}>
                          Car State: {vehicle.snapshot.carState === 1 ? 'ON' : 'OFF'}
                        </p>
                      )}
                      {vehicle.snapshot.error && vehicle.snapshot.error.trim() !== '' && (
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#ef4444' }}>
                          Error: {vehicle.snapshot.error}
                        </p>
                      )}
                      <button
                        onClick={() => {
                          onVehicleSelect(vehicle)
                          setSelectedVehicle(null)
                        }}
                        style={{
                          width: '100%',
                          marginTop: '8px',
                          padding: '6px 12px',
                          backgroundColor: '#3B82F6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </InfoWindow>
                )}
              </Marker>
            )
          })}
        </GoogleMap>
      </LoadScript>
      
      {/* Map Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Vehicle Status</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
            <span className="text-sm text-gray-700">Active</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm"></div>
            <span className="text-sm text-gray-700">Alert</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-400 rounded-full border-2 border-white shadow-sm"></div>
            <span className="text-sm text-gray-700">Inactive</span>
          </div>
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-10">
        <div className="text-xs text-gray-600 text-center">
          <div className="font-medium">Click vehicles for details</div>
          <div className="text-gray-500">
            {vehicles.length} vehicles loaded
          </div>
          <div className="flex items-center justify-center space-x-1 mt-2 text-gray-400">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live tracking</span>
          </div>
          <div className="text-gray-400 mt-1">
            Updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  )
}
