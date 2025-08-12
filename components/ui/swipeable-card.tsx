'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SwipeAction {
  icon: React.ReactNode
  label: string
  action: () => void
  color: 'red' | 'green' | 'blue' | 'yellow' | 'purple'
  side: 'left' | 'right'
}

interface SwipeableCardProps {
  children: React.ReactNode
  actions?: SwipeAction[]
  className?: string
  disabled?: boolean
  swipeThreshold?: number
}

export function SwipeableCard({
  children,
  actions = [],
  className,
  disabled = false,
  swipeThreshold = 80
}: SwipeableCardProps) {
  const [translateX, setTranslateX] = React.useState(0)
  const [isDragging, setIsDragging] = React.useState(false)
  const [startX, setStartX] = React.useState(0)
  const [currentX, setCurrentX] = React.useState(0)
  const cardRef = React.useRef<HTMLDivElement>(null)

  const leftActions = actions.filter(action => action.side === 'left')
  const rightActions = actions.filter(action => action.side === 'right')

  const colorClasses = {
    red: 'bg-red-500 text-white',
    green: 'bg-green-500 text-white',
    blue: 'bg-blue-500 text-white',
    yellow: 'bg-yellow-500 text-white',
    purple: 'bg-purple-500 text-white'
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return
    
    setIsDragging(true)
    setStartX(e.touches[0].clientX)
    setCurrentX(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled) return

    setCurrentX(e.touches[0].clientX)
    const deltaX = currentX - startX
    
    // Limit swipe distance
    const maxSwipe = Math.min(actions.length * 80, 200)
    const clampedDelta = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX))
    
    setTranslateX(clampedDelta)
  }

  const handleTouchEnd = () => {
    if (!isDragging || disabled) return

    setIsDragging(false)
    const deltaX = currentX - startX
    const absDistance = Math.abs(deltaX)

    // Check if swipe threshold is met
    if (absDistance >= swipeThreshold) {
      const direction = deltaX > 0 ? 'right' : 'left'
      const relevantActions = direction === 'right' ? leftActions : rightActions
      
      if (relevantActions.length > 0) {
        // Execute the first action for the swipe direction
        relevantActions[0].action()
      }
    }

    // Reset position
    setTranslateX(0)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return
    
    setIsDragging(true)
    setStartX(e.clientX)
    setCurrentX(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || disabled) return

    setCurrentX(e.clientX)
    const deltaX = currentX - startX
    
    const maxSwipe = Math.min(actions.length * 80, 200)
    const clampedDelta = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX))
    
    setTranslateX(clampedDelta)
  }

  const handleMouseUp = () => {
    if (!isDragging || disabled) return

    setIsDragging(false)
    const deltaX = currentX - startX
    const absDistance = Math.abs(deltaX)

    if (absDistance >= swipeThreshold) {
      const direction = deltaX > 0 ? 'right' : 'left'
      const relevantActions = direction === 'right' ? leftActions : rightActions
      
      if (relevantActions.length > 0) {
        relevantActions[0].action()
      }
    }

    setTranslateX(0)
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Left actions (revealed when swiping right) */}
      {leftActions.length > 0 && (
        <div className="absolute left-0 top-0 bottom-0 flex items-center">
          {leftActions.map((action, index) => (
            <div
              key={`left-${index}`}
              className={cn(
                'flex items-center justify-center w-20 h-full transition-opacity duration-200',
                colorClasses[action.color],
                translateX > swipeThreshold ? 'opacity-100' : 'opacity-60'
              )}
              onClick={action.action}
            >
              <div className="flex flex-col items-center space-y-1">
                <div className="w-6 h-6">
                  {action.icon}
                </div>
                <span className="text-xs font-medium">{action.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Right actions (revealed when swiping left) */}
      {rightActions.length > 0 && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center">
          {rightActions.map((action, index) => (
            <div
              key={`right-${index}`}
              className={cn(
                'flex items-center justify-center w-20 h-full transition-opacity duration-200',
                colorClasses[action.color],
                translateX < -swipeThreshold ? 'opacity-100' : 'opacity-60'
              )}
              onClick={action.action}
            >
              <div className="flex flex-col items-center space-y-1">
                <div className="w-6 h-6">
                  {action.icon}
                </div>
                <span className="text-xs font-medium">{action.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main card content */}
      <div
        ref={cardRef}
        className={cn(
          'relative bg-white transition-transform duration-200 ease-out',
          isDragging ? 'duration-0' : 'duration-200',
          className
        )}
        style={{
          transform: `translateX(${translateX}px)`,
          zIndex: 10
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {children}
      </div>

      {/* Swipe hint */}
      {actions.length > 0 && !isDragging && translateX === 0 && (
        <div className="absolute top-2 right-2 opacity-30">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  )
}