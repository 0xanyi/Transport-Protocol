'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface FloatingActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  label?: string
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  showLabel?: boolean
}

export function FloatingActionButton({
  icon,
  label,
  position = 'bottom-right',
  size = 'md',
  variant = 'primary',
  showLabel = false,
  className,
  children,
  ...props
}: FloatingActionButtonProps) {
  const [isPressed, setIsPressed] = React.useState(false)

  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6 safe-bottom safe-right',
    'bottom-left': 'fixed bottom-6 left-6 safe-bottom safe-left',
    'bottom-center': 'fixed bottom-6 left-1/2 transform -translate-x-1/2 safe-bottom'
  }

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16'
  }

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white shadow-gray-200',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-green-200',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-yellow-200',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-red-200'
  }

  const iconSizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7'
  }

  return (
    <div className={positionClasses[position]}>
      {/* Label */}
      {showLabel && label && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <div className="bg-black/75 text-white px-3 py-1 rounded-lg text-sm">
            {label}
          </div>
        </div>
      )}

      {/* Button */}
      <button
        className={cn(
          'flex items-center justify-center rounded-full shadow-lg transition-all duration-200 z-50',
          'active:scale-95 hover:scale-105',
          'focus:outline-none focus:ring-4 focus:ring-opacity-50',
          sizeClasses[size],
          variantClasses[variant],
          isPressed && 'scale-95',
          className
        )}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        {...props}
      >
        <div className={iconSizeClasses[size]}>
          {icon}
        </div>
      </button>
    </div>
  )
}

// Quick check-in FAB specifically for drivers
interface QuickCheckinFABProps {
  onQuickCheckin: () => void
  disabled?: boolean
  isLoading?: boolean
}

export function QuickCheckinFAB({ onQuickCheckin, disabled = false, isLoading = false }: QuickCheckinFABProps) {
  return (
    <FloatingActionButton
      icon={
        isLoading ? (
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      }
      label="Quick Check-in"
      variant="success"
      onClick={onQuickCheckin}
      disabled={disabled || isLoading}
      showLabel={!isLoading}
    />
  )
}

// Emergency contact FAB
interface EmergencyContactFABProps {
  phoneNumber: string
  disabled?: boolean
}

export function EmergencyContactFAB({ phoneNumber, disabled = false }: EmergencyContactFABProps) {
  const handleCall = () => {
    window.location.href = `tel:${phoneNumber}`
  }

  return (
    <FloatingActionButton
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      }
      label="Emergency Call"
      variant="danger"
      position="bottom-left"
      onClick={handleCall}
      disabled={disabled}
      showLabel={true}
    />
  )
}