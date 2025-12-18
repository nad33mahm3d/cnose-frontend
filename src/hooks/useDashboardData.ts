import { useState, useEffect, useCallback, useRef } from 'react'
import type { Vehicle, DeviceSnapshot, Alert } from '../types'
import { vehicleApi, snapshotApi, alertApi } from '../services/api'

interface DashboardData {
  vehicles: Vehicle[]
  snapshots: Record<number, DeviceSnapshot>
  alerts: Alert[]
  lastUpdate: Date
}

interface LoadingState {
  vehicles: boolean
  snapshots: boolean
  alerts: boolean
}

interface UseDashboardDataReturn {
  data: DashboardData
  loading: LoadingState
  error: string | null
  refreshData: () => Promise<void>
  refreshSnapshots: () => Promise<void>
  isInitialized: boolean
}

export function useDashboardData(refreshInterval: number = 10000): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardData>({
    vehicles: [],
    snapshots: {},
    alerts: [],
    lastUpdate: new Date()
  })
  
  const [loading, setLoading] = useState<LoadingState>({
    vehicles: true,
    snapshots: true,
    alerts: true
  })
  
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load vehicles data
  const loadVehicles = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(prev => ({ ...prev, vehicles: true }))
      setError(null)
      
      const vehiclesData = await vehicleApi.getAll()
      
      if (!signal?.aborted) {
        setData(prev => ({ ...prev, vehicles: vehiclesData }))
      }
    } catch (err) {
      if (!signal?.aborted) {
        console.error('Failed to load vehicles:', err)
        setError('Failed to load vehicles data')
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(prev => ({ ...prev, vehicles: false }))
      }
    }
  }, [])

  // Load alerts data
  const loadAlerts = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(prev => ({ ...prev, alerts: true }))
      setError(null)
      
      const alertsData = await alertApi.getAll()
      
      if (!signal?.aborted) {
        setData(prev => ({ ...prev, alerts: alertsData }))
      }
    } catch (err) {
      if (!signal?.aborted) {
        console.error('Failed to load alerts:', err)
        setError('Failed to load alerts data')
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(prev => ({ ...prev, alerts: false }))
      }
    }
  }, [])

  // Load snapshots data
  const loadSnapshots = useCallback(async (vehicles: Vehicle[], signal?: AbortSignal) => {
    try {
      console.log('loadSnapshots called with', vehicles.length, 'vehicles')
      setLoading(prev => ({ ...prev, snapshots: true }))
      setError(null)
      
      const snapshotData: Record<number, DeviceSnapshot> = {}
      
      // Load snapshots for all vehicles in parallel (using car_id)
      const snapshotPromises = vehicles.map(async vehicle => {
        try {
          console.log('Loading snapshot for vehicle', vehicle.id)
          const snapshot = await snapshotApi.getLatest(vehicle.id)
          if (snapshot && !signal?.aborted) {
            snapshotData[vehicle.id] = snapshot
            console.log('Snapshot loaded for vehicle', vehicle.id)
          }
        } catch (err) {
          console.warn(`No snapshot found for vehicle ${vehicle.id}`)
        }
      })
      
      console.log('Waiting for', snapshotPromises.length, 'snapshot promises')
      await Promise.all(snapshotPromises)
      
      if (!signal?.aborted) {
        console.log('Setting snapshots data:', Object.keys(snapshotData).length, 'snapshots')
        setData(prev => ({ ...prev, snapshots: snapshotData }))
      }
    } catch (err) {
      if (!signal?.aborted) {
        console.error('Failed to load snapshots:', err)
        setError('Failed to load sensor data')
      }
    } finally {
      if (!signal?.aborted) {
        console.log('Setting snapshots loading to false')
        setLoading(prev => ({ ...prev, snapshots: false }))
      }
    }
  }, [])

  // Refresh all data
  const refreshData = useCallback(async () => {
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    try {
      // Load vehicles and alerts in parallel
      const [vehiclesData, alertsData] = await Promise.all([
        vehicleApi.getAll(),
        alertApi.getAll()
      ])

      if (signal.aborted) return

      // Update vehicles and alerts
      setData(prev => ({ 
        ...prev, 
        vehicles: vehiclesData, 
        alerts: alertsData,
        lastUpdate: new Date()
      }))

      // Load snapshots for the new vehicles
      await loadSnapshots(vehiclesData, signal)

    } catch (err) {
      if (!signal.aborted) {
        console.error('Failed to refresh data:', err)
        setError('Failed to refresh dashboard data')
      }
    }
  }, [loadSnapshots])

  // Refresh only snapshots (for real-time updates)
  const refreshSnapshots = useCallback(async () => {
    if (data.vehicles.length === 0) return
    
    // Cancel any ongoing snapshot requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    try {
      await loadSnapshots(data.vehicles, signal)
      
      if (!signal.aborted) {
        setData(prev => ({ ...prev, lastUpdate: new Date() }))
      }
    } catch (err) {
      if (!signal.aborted) {
        console.error('Failed to refresh snapshots:', err)
      }
    }
  }, [data.vehicles, loadSnapshots])

  // Initialize data on mount
  useEffect(() => {
    console.log('Initializing dashboard data...')
    const initializeData = async () => {
      try {
        console.log('Loading vehicles and alerts...')
        // Load vehicles and alerts in parallel
        const [vehiclesData, alertsData] = await Promise.all([
          vehicleApi.getAll(),
          alertApi.getAll()
        ])

        console.log('Vehicles loaded:', vehiclesData.length)
        console.log('Alerts loaded:', alertsData.length)

        // Update vehicles and alerts
        setData(prev => ({ 
          ...prev, 
          vehicles: vehiclesData, 
          alerts: alertsData,
          lastUpdate: new Date()
        }))

        // Load snapshots for the vehicles
        console.log('Loading snapshots...')
        await loadSnapshots(vehiclesData)

        console.log('Data initialization complete')
        setIsInitialized(true)
      } catch (err) {
        console.error('Failed to initialize data:', err)
        setError('Failed to load dashboard data')
        setIsInitialized(true) // Still set as initialized to show error state
      }
    }

    initializeData()
  }, []) // Remove refreshData dependency

  // Set up refresh interval
  useEffect(() => {
    if (isInitialized && data.vehicles.length > 0) {
      intervalRef.current = setInterval(refreshSnapshots, refreshInterval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [isInitialized, data.vehicles.length, refreshSnapshots, refreshInterval])

  return {
    data,
    loading,
    error,
    refreshData,
    refreshSnapshots,
    isInitialized
  }
}
