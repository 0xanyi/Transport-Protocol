'use client'

import * as React from 'react'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void> | void
  disabled?: boolean
  threshold?: number
  className?: string
}

export function PullToRefresh({ 
  children, 
  onRefresh, 
  disabled = false, 
  threshold = 80,
  className 
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = React.useState(false)
  const [pullDistance, setPullDistance] = React.useState(0)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const startY = React.useRef<number>(0)
  const currentY = React.useRef<number>(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return
    
    const container = containerRef.current
    if (!container || container.scrollTop > 0) return

    startY.current = e.touches[0].clientY
    currentY.current = e.touches[0].clientY
    setIsPulling(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return

    const container = containerRef.current
    if (!container || container.scrollTop > 0) {
      setIsPulling(false)
      setPullDistance(0)
      return
    }

    currentY.current = e.touches[0].clientY
    const deltaY = currentY.current - startY.current

    if (deltaY > 0) {
      e.preventDefault()
      const distance = Math.min(deltaY * 0.5, threshold * 1.5) // Damping effect
      setPullDistance(distance)
    }
  }

  const handleTouchEnd = async () => {
    if (!isPulling || disabled || isRefreshing) return

    setIsPulling(false)

    if (pullDistance >= threshold) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } catch (error) {
        console.error('Refresh failed:', error)
      } finally {
        setIsRefreshing(false)
      }
    }

    setPullDistance(0)
  }

  const getRefreshIndicatorStyle = () => {
    const opacity = Math.min(pullDistance / threshold, 1)
    const scale = Math.min(0.5 + (pullDistance / threshold) * 0.5, 1)
    const rotation = isRefreshing ? 360 : (pullDistance / threshold) * 180

    return {
      opacity,
      transform: `scale(${scale}) rotate(${rotation}deg)`,
      transition: isRefreshing ? 'transform 1s linear' : 'none'
    }
  }

  const getContainerStyle = () => {
    if (isRefreshing) {
      return {
        transform: `translateY(${threshold}px)`,
        transition: 'transform 0.3s ease-out'
      }
    }
    
    if (isPulling && pullDistance > 0) {
      return {
        transform: `translateY(${pullDistance}px)`,
        transition: 'none'
      }
    }

    return {
      transform: 'translateY(0)',
      transition: 'transform 0.3s ease-out'
    }
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Pull to refresh indicator */}
      <div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full z-10 flex items-center justify-center h-16 w-16"
        style={{
          transform: `translateX(-50%) translateY(${Math.max(-64 + pullDistance, -64)}px)`
        }}
      >
        <div 
          className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full shadow-lg"
          style={getRefreshIndicatorStyle()}
        >
          <RefreshCw 
            className={cn(
              'w-4 h-4 text-white',
              isRefreshing && 'animate-spin'
            )} 
          />
        </div>
      </div>

      {/* Content container */}
      <div
        ref={containerRef}
        className="relative"
        style={getContainerStyle()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>

      {/* Status text */}
      {(isPulling || isRefreshing) && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-black/75 text-white px-3 py-1 rounded-full text-xs">
            {isRefreshing 
              ? 'Refreshing...' 
              : pullDistance >= threshold 
                ? 'Release to refresh' 
                : 'Pull to refresh'
            }
          </div>
        </div>
      )}
    </div>
  )
}