'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileSelectProps {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  label?: string
  error?: string
  placeholder?: string
}

const MobileSelect = ({ 
  children, 
  value = '', 
  onValueChange = () => {}, 
  label,
  error,
  placeholder = 'Select an option...'
}: MobileSelectProps) => {
  const [open, setOpen] = React.useState(false)
  const [displayValue, setDisplayValue] = React.useState('')

  // Extract options from children to find display value
  React.useEffect(() => {
    if (value && React.Children.count(children) > 0) {
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
          const childProps = child.props as any
          if (childProps.value === value) {
            setDisplayValue(childProps.children)
          }
        }
      })
    } else {
      setDisplayValue('')
    }
  }, [value, children])

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mobile-text">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          className={cn(
            'mobile-input w-full flex items-center justify-between',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            !displayValue && 'text-gray-500'
          )}
          onClick={() => setOpen(!open)}
        >
          <span className="truncate">
            {displayValue || placeholder}
          </span>
          <ChevronDown className={cn(
            "h-5 w-5 transition-transform duration-200 flex-shrink-0",
            open && "rotate-180"
          )} />
        </button>
        
        {open && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40 bg-black/20" 
              onClick={() => setOpen(false)}
            />
            
            {/* Options */}
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto mobile-scroll">
              {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                  const childProps = child.props as any
                  return React.cloneElement(child as any, {
                    onClick: () => {
                      onValueChange(childProps.value)
                      setOpen(false)
                    },
                    isSelected: childProps.value === value
                  })
                }
                return child
              })}
            </div>
          </>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

interface MobileSelectItemProps {
  children: React.ReactNode
  value: string
  onClick?: () => void
  isSelected?: boolean
}

const MobileSelectItem = ({ 
  children, 
  value, 
  onClick,
  isSelected = false 
}: MobileSelectItemProps) => {
  return (
    <div
      className={cn(
        'px-4 py-3 cursor-pointer transition-colors touch-target',
        'hover:bg-gray-50 active:bg-gray-100',
        isSelected && 'bg-blue-50 text-blue-700 font-medium'
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export { MobileSelect, MobileSelectItem }