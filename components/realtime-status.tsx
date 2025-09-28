'use client'

import { useRealtime } from '@/contexts/realtime-context'
import { cn } from '@/lib/utils'

interface RealtimeStatusProps {
  className?: string
  showText?: boolean
}

export function RealtimeStatus({ className, showText = false }: RealtimeStatusProps) {
  const { isConnected, connectionStatus } = useRealtime()

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500'
      case 'connecting':
        return 'bg-yellow-500 animate-pulse'
      case 'error':
        return 'bg-red-500'
      case 'disconnected':
      default:
        return 'bg-gray-400'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Live'
      case 'connecting':
        return 'Connecting...'
      case 'error':
        return 'Connection Error'
      case 'disconnected':
      default:
        return 'Offline'
    }
  }

  const getStatusTitle = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Real-time updates are active'
      case 'connecting':
        return 'Connecting to real-time updates...'
      case 'error':
        return 'Failed to connect to real-time updates'
      case 'disconnected':
      default:
        return 'Real-time updates are offline'
    }
  }

  return (
    <div 
      className={cn(
        "flex items-center gap-2",
        className
      )}
      title={getStatusTitle()}
    >
      <div 
        className={cn(
          "w-2 h-2 rounded-full",
          getStatusColor()
        )}
      />
      {showText && (
        <span className={cn(
          "text-xs font-medium",
          connectionStatus === 'connected' ? 'text-green-600' :
          connectionStatus === 'connecting' ? 'text-yellow-600' :
          connectionStatus === 'error' ? 'text-red-600' :
          'text-gray-500'
        )}>
          {getStatusText()}
        </span>
      )}
    </div>
  )
}

/**
 * Compact realtime status indicator for headers/navigation
 */
export function RealtimeStatusCompact({ className }: { className?: string }) {
  return <RealtimeStatus className={className} showText={false} />
}

/**
 * Full realtime status indicator with text
 */
export function RealtimeStatusFull({ className }: { className?: string }) {
  return <RealtimeStatus className={className} showText={true} />
}
