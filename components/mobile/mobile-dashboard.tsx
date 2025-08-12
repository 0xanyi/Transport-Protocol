'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MobileDashboardLayout, MobileCardStack } from '@/components/layouts/mobile-layout'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { FloatingActionButton, QuickCheckinFAB } from '@/components/ui/floating-action-button'
import { SwipeableCard } from '@/components/ui/swipeable-card'
import { LazyAvatar } from '@/components/ui/lazy-image'
import { StatusAnnouncement } from '@/components/ui/accessibility-helpers'
import { AuthUser } from '@/types'
import { 
  RefreshCw, 
  Bell, 
  Settings, 
  User, 
  Car, 
  Navigation,
  Clock,
  CheckCircle,
  AlertTriangle,
  Phone
} from 'lucide-react'

interface MobileDashboardProps {
  currentUser: AuthUser | null
  onRefresh?: () => Promise<void>
  onQuickCheckin?: () => void
  children?: React.ReactNode
}

export function MobileDashboard({ 
  currentUser, 
  onRefresh, 
  onQuickCheckin,
  children 
}: MobileDashboardProps) {
  const [refreshing, setRefreshing] = React.useState(false)
  const [statusMessage, setStatusMessage] = React.useState('')

  const handleRefresh = React.useCallback(async () => {
    if (!onRefresh) return
    
    setRefreshing(true)
    setStatusMessage('Refreshing dashboard...')
    
    try {
      await onRefresh()
      setStatusMessage('Dashboard updated successfully')
    } catch (error) {
      setStatusMessage('Failed to refresh dashboard')
    } finally {
      setRefreshing(false)
      // Clear status message after 3 seconds
      setTimeout(() => setStatusMessage(''), 3000)
    }
  }, [onRefresh])

  const handleQuickCheckin = React.useCallback(() => {
    if (onQuickCheckin) {
      setStatusMessage('Processing check-in...')
      onQuickCheckin()
    }
  }, [onQuickCheckin])

  return (
    <MobileDashboardLayout
      title="Dashboard"
      subtitle={currentUser ? `Welcome, ${currentUser.name}` : 'Transport Protocol'}
      actions={
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="touch-target">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="touch-target">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      }
    >
      <PullToRefresh onRefresh={handleRefresh} disabled={refreshing}>
        <MobileCardStack spacing="normal">
          {/* Status announcement for screen readers */}
          {statusMessage && (
            <StatusAnnouncement message={statusMessage} priority="polite" />
          )}

          {/* User profile card */}
          {currentUser && (
            <SwipeableCard
              actions={[
                {
                  icon: <User className="w-4 h-4" />,
                  label: 'Profile',
                  action: () => console.log('View profile'),
                  color: 'blue',
                  side: 'right'
                },
                {
                  icon: <Settings className="w-4 h-4" />,
                  label: 'Settings',
                  action: () => console.log('Open settings'),
                  color: 'blue',
                  side: 'right'
                }
              ]}
            >
              <Card className="mobile-card">
                <CardContent className="mobile-padding">
                  <div className="flex items-center space-x-4">
                    <LazyAvatar
                      alt={currentUser.name}
                      size="lg"
                      fallback={currentUser.name.charAt(0)}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {currentUser.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {currentUser.role.replace('_', ' ')}
                        </Badge>
                        {currentUser.department && (
                          <Badge variant="secondary" className="text-xs">
                            {currentUser.department}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mb-1"></div>
                      <span className="text-xs text-gray-500">Online</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </SwipeableCard>
          )}

          {/* Quick stats */}
          <Card className="mobile-card">
            <CardHeader className="mobile-padding pb-2">
              <CardTitle className="text-lg">Today's Overview</CardTitle>
            </CardHeader>
            <CardContent className="mobile-padding pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full mx-auto mb-2">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">12</p>
                  <p className="text-xs text-blue-800">Completed</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 bg-yellow-600 rounded-full mx-auto mb-2">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">3</p>
                  <p className="text-xs text-yellow-800">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card className="mobile-card">
            <CardHeader className="mobile-padding pb-2">
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Latest updates and check-ins</CardDescription>
            </CardHeader>
            <CardContent className="mobile-padding pt-0">
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Navigation className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        Check-in completed
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        Arrived at Events Venue - Terminal 2
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        2 minutes ago
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom content */}
          {children}

          {/* Spacer for floating action button */}
          <div className="h-20" />
        </MobileCardStack>
      </PullToRefresh>

      {/* Floating action buttons */}
      {currentUser?.role === 'driver' && onQuickCheckin && (
        <QuickCheckinFAB 
          onQuickCheckin={handleQuickCheckin}
          disabled={refreshing}
        />
      )}

      {/* Emergency contact FAB for drivers */}
      {currentUser?.role === 'driver' && (
        <FloatingActionButton
          icon={<Phone className="w-5 h-5" />}
          label="Emergency"
          variant="danger"
          position="bottom-left"
          onClick={() => window.location.href = 'tel:+441234567890'}
        />
      )}
    </MobileDashboardLayout>
  )
}

// Mobile-specific quick action component
interface MobileQuickActionsProps {
  actions: Array<{
    icon: React.ReactNode
    label: string
    onClick: () => void
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
    disabled?: boolean
  }>
  className?: string
}

export function MobileQuickActions({ actions, className }: MobileQuickActionsProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    green: 'bg-green-50 text-green-600 hover:bg-green-100',
    red: 'bg-red-50 text-red-600 hover:bg-red-100',
    yellow: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100',
    purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100'
  }

  return (
    <Card className={`mobile-card ${className}`}>
      <CardHeader className="mobile-padding pb-2">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="mobile-padding pt-0">
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`
                flex flex-col items-center justify-center p-4 rounded-lg transition-colors touch-target
                ${colorClasses[action.color || 'blue']}
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <div className="w-8 h-8 mb-2">
                {action.icon}
              </div>
              <span className="text-sm font-medium text-center">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}