'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  overscan?: number
  onEndReached?: () => void
  endReachedThreshold?: number
  loading?: boolean
  loadingComponent?: React.ReactNode
  emptyComponent?: React.ReactNode
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
  overscan = 5,
  onEndReached,
  endReachedThreshold = 0.8,
  loading = false,
  loadingComponent,
  emptyComponent
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0)
  const scrollElementRef = React.useRef<HTMLDivElement>(null)

  const totalHeight = items.length * itemHeight
  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2)

  const visibleItems = items.slice(startIndex, endIndex + 1)

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop
    setScrollTop(scrollTop)

    // Check if we're near the end for infinite loading
    if (onEndReached) {
      const scrollHeight = e.currentTarget.scrollHeight
      const clientHeight = e.currentTarget.clientHeight
      const scrollPosition = scrollTop + clientHeight
      const threshold = scrollHeight * endReachedThreshold

      if (scrollPosition >= threshold && !loading) {
        onEndReached()
      }
    }
  }, [onEndReached, loading, endReachedThreshold])

  // Smooth scrolling for mobile
  const scrollToIndex = React.useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    if (scrollElementRef.current) {
      const scrollTop = index * itemHeight
      scrollElementRef.current.scrollTo({
        top: scrollTop,
        behavior
      })
    }
  }, [itemHeight])

  // Expose scroll methods via ref (removed for now as it's not being used)
  // This would typically be used with forwardRef if needed

  if (items.length === 0 && !loading) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height: containerHeight }}>
        {emptyComponent || (
          <div className="text-center text-gray-500">
            <p>No items to display</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={scrollElementRef}
      className={cn('overflow-auto mobile-scroll', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${startIndex * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
              className="flex-shrink-0"
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          {loadingComponent || (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-sm text-gray-600">Loading...</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Optimized list item component with memoization
interface OptimizedListItemProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export const OptimizedListItem = React.memo<OptimizedListItemProps>(({ 
  children, 
  className, 
  onClick 
}) => {
  return (
    <div 
      className={cn('touch-target', className)}
      onClick={onClick}
    >
      {children}
    </div>
  )
})

OptimizedListItem.displayName = 'OptimizedListItem'

// Infinite scroll hook for mobile optimization
export function useInfiniteScroll<T>(
  fetchMore: () => Promise<T[]>,
  hasMore: boolean,
  threshold: number = 0.8
) {
  const [items, setItems] = React.useState<T[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const loadMore = React.useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    setError(null)

    try {
      const newItems = await fetchMore()
      setItems(prev => [...prev, ...newItems])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more items')
    } finally {
      setLoading(false)
    }
  }, [fetchMore, hasMore, loading])

  const reset = React.useCallback(() => {
    setItems([])
    setError(null)
    setLoading(false)
  }, [])

  return {
    items,
    loading,
    error,
    loadMore,
    reset,
    setItems
  }
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderCount = React.useRef(0)
  const startTime = React.useRef<number>(0)

  React.useEffect(() => {
    renderCount.current += 1
    startTime.current = performance.now()

    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime.current

      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`)
      }
    }
  })

  return {
    renderCount: renderCount.current
  }
}