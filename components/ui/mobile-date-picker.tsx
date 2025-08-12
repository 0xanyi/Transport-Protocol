'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'
import { Calendar } from 'lucide-react'

export interface MobileDatePickerProps {
  value?: string
  onChange?: (value: string) => void
  label?: string
  error?: string
  min?: string
  max?: string
  placeholder?: string
  className?: string
}

const MobileDatePicker = React.forwardRef<HTMLInputElement, MobileDatePickerProps>(
  ({ 
    value = '', 
    onChange = () => {}, 
    label, 
    error, 
    min, 
    max, 
    placeholder = 'Select date',
    className,
    ...props 
  }, ref) => {
    const [isNativeSupported, setIsNativeSupported] = React.useState(true)

    React.useEffect(() => {
      // Check if the browser supports native date input
      const input = document.createElement('input')
      input.type = 'date'
      setIsNativeSupported(input.type === 'date')
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
    }

    const formatDisplayDate = (dateString: string) => {
      if (!dateString) return placeholder
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      } catch {
        return dateString
      }
    }

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mobile-text">
            {label}
          </label>
        )}
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
            <Calendar className="w-5 h-5" />
          </div>
          
          {isNativeSupported ? (
            <input
              ref={ref}
              type="date"
              value={value}
              onChange={handleChange}
              min={min}
              max={max}
              className={cn(
                'mobile-input w-full pl-12',
                error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
                className
              )}
              {...props}
            />
          ) : (
            // Fallback for browsers that don't support date input
            <div className="relative">
              <input
                ref={ref}
                type="text"
                value={value ? formatDisplayDate(value) : ''}
                placeholder={placeholder}
                readOnly
                className={cn(
                  'mobile-input w-full pl-12 cursor-pointer',
                  error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
                  className
                )}
                onClick={() => {
                  // For fallback, we could implement a custom date picker
                  // For now, we'll use a simple text input that accepts YYYY-MM-DD format
                  const input = document.createElement('input')
                  input.type = 'date'
                  input.value = value
                  input.onchange = (e) => {
                    onChange((e.target as HTMLInputElement).value)
                  }
                  input.click()
                }}
                {...props}
              />
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

MobileDatePicker.displayName = 'MobileDatePicker'

export { MobileDatePicker }