import * as React from 'react'
import { cn } from '@/lib/utils'

interface TabsContextType {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextType | null>(null)

interface TabsProps {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
}

const Tabs = ({ children, value, onValueChange, defaultValue }: TabsProps) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '')
  
  const currentValue = value !== undefined ? value : internalValue
  const handleValueChange = onValueChange || setInternalValue

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      {children}
    </TabsContext.Provider>
  )
}

interface TabsListProps {
  children: React.ReactNode
  className?: string
}

const TabsList = ({ children, className }: TabsListProps) => {
  return (
    <div className={cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
      className
    )}>
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  children: React.ReactNode
  value: string
  className?: string
}

const TabsTrigger = ({ children, value, className }: TabsTriggerProps) => {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsTrigger must be used within Tabs')

  const isActive = context.value === value

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isActive 
          ? 'bg-background text-foreground shadow-sm' 
          : 'hover:bg-muted hover:text-foreground',
        className
      )}
      onClick={() => context.onValueChange(value)}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  children: React.ReactNode
  value: string
  className?: string
}

const TabsContent = ({ children, value, className }: TabsContentProps) => {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsContent must be used within Tabs')

  if (context.value !== value) return null

  return (
    <div className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}>
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }