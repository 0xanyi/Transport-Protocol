'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { SkipLink, ScreenReaderOnly } from '@/components/ui/accessibility-helpers'
import { useReducedMotion } from '@/components/ui/accessibility-helpers'

interface MobileLayoutProps {
  children: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  navigation?: React.ReactNode
  className?: string
  showSkipLink?: boolean
  mainId?: string
}

export function MobileLayout({
  children,
  header,
  footer,
  navigation,
  className,
  showSkipLink = true,
  mainId = 'main-content'
}: MobileLayoutProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className={cn('min-h-screen bg-background flex flex-col', className)}>
      {/* Skip to content link for accessibility */}
      {showSkipLink && (
        <SkipLink href={`#${mainId}`}>
          Skip to main content
        </SkipLink>
      )}

      {/* Header */}
      {header && (
        <header className="flex-shrink-0 safe-top">
          {header}
        </header>
      )}

      {/* Navigation */}
      {navigation && (
        <nav className="flex-shrink-0" role="navigation" aria-label="Main navigation">
          {navigation}
        </nav>
      )}

      {/* Main content */}
      <main 
        id={mainId}
        className="flex-1 focus:outline-none"
        tabIndex={-1}
      >
        <ScreenReaderOnly>
          <h1>Main content</h1>
        </ScreenReaderOnly>
        {children}
      </main>

      {/* Footer */}
      {footer && (
        <footer className="flex-shrink-0 safe-bottom">
          {footer}
        </footer>
      )}
    </div>
  )
}

// Mobile-specific dashboard layout
interface MobileDashboardLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  actions?: React.ReactNode
  navigation?: React.ReactNode
  className?: string
}

export function MobileDashboardLayout({
  children,
  title,
  subtitle,
  actions,
  navigation,
  className
}: MobileDashboardLayoutProps) {
  return (
    <MobileLayout
      header={
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="mobile-padding">
            <div className="flex items-center justify-between min-h-[60px]">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-gray-600 mt-1 mobile-text truncate">
                    {subtitle}
                  </p>
                )}
              </div>
              {actions && (
                <div className="flex items-center space-x-2 ml-4">
                  {actions}
                </div>
              )}
            </div>
          </div>
        </div>
      }
      navigation={navigation}
      className={className}
    >
      <div className="mobile-padding py-4 sm:py-6">
        {children}
      </div>
    </MobileLayout>
  )
}

// Mobile card stack layout for lists
interface MobileCardStackProps {
  children: React.ReactNode
  spacing?: 'tight' | 'normal' | 'loose'
  className?: string
}

export function MobileCardStack({ 
  children, 
  spacing = 'normal', 
  className 
}: MobileCardStackProps) {
  const spacingClasses = {
    tight: 'space-y-2',
    normal: 'space-y-4',
    loose: 'space-y-6'
  }

  return (
    <div className={cn(spacingClasses[spacing], className)}>
      {children}
    </div>
  )
}

// Mobile bottom sheet layout
interface MobileBottomSheetProps {
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
  title?: string
  className?: string
}

export function MobileBottomSheet({
  children,
  isOpen,
  onClose,
  title,
  className
}: MobileBottomSheetProps) {
  const prefersReducedMotion = useReducedMotion()

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sheet */}
      <div 
        className={cn(
          'fixed bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-xl',
          'transform transition-transform duration-300 ease-out',
          'max-h-[90vh] overflow-hidden',
          prefersReducedMotion ? 'transition-none' : '',
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-8 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="px-4 pb-4 border-b border-gray-200">
            <h2 id="bottom-sheet-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto mobile-scroll p-4">
          {children}
        </div>
      </div>
    </div>
  )
}

// Mobile sticky header component
interface MobileStickyHeaderProps {
  children: React.ReactNode
  className?: string
  shadow?: boolean
}

export function MobileStickyHeader({ 
  children, 
  className, 
  shadow = true 
}: MobileStickyHeaderProps) {
  const [isSticky, setIsSticky] = React.useState(false)
  const headerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting)
      },
      { threshold: 1 }
    )

    if (headerRef.current) {
      observer.observe(headerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={headerRef}
      className={cn(
        'sticky top-0 z-40 bg-white transition-shadow duration-200',
        shadow && isSticky && 'shadow-sm border-b border-gray-200',
        className
      )}
    >
      {children}
    </div>
  )
}