import React, { useState, useEffect, useCallback } from 'react'
import { Bell, X, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'
import type { Alert } from '../types'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  duration?: number
}

interface RealTimeNotificationsProps {
  alerts: Alert[]
  onDismiss?: (notificationId: string) => void
}

export default function RealTimeNotifications({ alerts, onDismiss }: RealTimeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Convert alerts to notifications
  useEffect(() => {
    const newAlerts = alerts.filter(alert => !alert.isResolved)
    const newNotifications: Notification[] = newAlerts.map(alert => ({
      id: `alert-${alert.id}`,
      type: alert.severity === 'CRITICAL' ? 'error' : 
            alert.severity === 'HIGH' ? 'warning' : 'info',
      title: `${alert.severity} Alert`,
      message: alert.message,
      timestamp: new Date(alert.ts),
      duration: 5000
    }))

    // Add new notifications that don't already exist
    setNotifications(prev => {
      const existingIds = new Set(prev.map(n => n.id))
      const newOnes = newNotifications.filter(n => !existingIds.has(n.id))
      return [...prev, ...newOnes]
    })

    setUnreadCount(newAlerts.length)
  }, [alerts])

  // Auto-dismiss notifications after duration
  useEffect(() => {
    const timers: NodeJS.Timeout[] = []

    notifications.forEach(notification => {
      if (notification.duration) {
        const timer = setTimeout(() => {
          dismissNotification(notification.id)
        }, notification.duration)
        timers.push(timer)
      }
    })

    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [notifications])

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    onDismiss?.(id)
  }, [onDismiss])

  const dismissAll = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-danger-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning-600" />
      case 'info':
        return <Info className="w-5 h-5 text-info-600" />
    }
  }

  const getTypeStyles = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'border-success-200 bg-success-50 text-success-800'
      case 'error':
        return 'border-danger-200 bg-danger-50 text-danger-800'
      case 'warning':
        return 'border-warning-200 bg-warning-50 text-warning-800'
      case 'info':
        return 'border-info-200 bg-info-50 text-info-800'
    }
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                {notifications.length > 0 && (
                  <button
                    onClick={dismissAll}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="p-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`mb-2 p-3 rounded-lg border ${getTypeStyles(notification.type)}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <button
                            onClick={() => dismissNotification(notification.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-sm mt-1">{notification.message}</p>
                        <p className="text-xs mt-2 opacity-75">
                          {notification.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.slice(0, 3).map((notification) => (
          <div
            key={notification.id}
            className={`transform transition-all duration-300 ease-in-out ${
              notification.duration ? 'animate-slide-in' : ''
            }`}
          >
            <div className={`p-4 rounded-lg shadow-lg border ${getTypeStyles(notification.type)} max-w-sm`}>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-sm mt-1">{notification.message}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 