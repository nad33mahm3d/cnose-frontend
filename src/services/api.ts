import axios from 'axios'
import type { Vehicle, DeviceSnapshot, Alert } from '../types'

const API_BASE_URL = '' // Use relative URLs to go through proxy

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.config?.url, error.message)
    return Promise.reject(error)
  }
)

export const vehicleApi = {
  getAll: async (): Promise<Vehicle[]> => {
    const response = await api.get('/vehicles')
    return response.data
  },
  
  create: async (vehicle: { name: string; plate_no: string }): Promise<Vehicle> => {
    const response = await api.post('/vehicles', vehicle)
    return response.data
  }
}

export const snapshotApi = {
  getLatest: async (carId: number): Promise<DeviceSnapshot | null> => {
    try {
      const response = await api.get(`/snapshots/${carId}/latest`)
      return response.data
    } catch (error) {
      return null
    }
  },
  
  getHistory: async (carId: number, limit: number = 20): Promise<DeviceSnapshot[]> => {
    const response = await api.get(`/snapshots/${carId}/history?limit=${limit}`)
    return response.data
  }
}

export const alertApi = {
  getAll: async (): Promise<Alert[]> => {
    const response = await api.get('/alerts')
    return response.data
  },
  
  getByCar: async (carId: number): Promise<Alert[]> => {
    const response = await api.get(`/alerts/${carId}`)
    return response.data
  },
  
  resolve: async (alertId: number): Promise<Alert> => {
    const response = await api.patch(`/alerts/${alertId}/resolve`)
    return response.data
  }
} 