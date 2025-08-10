import * as React from 'react'
import { cn } from '@/lib/utils'

interface AlertDialogContextType {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AlertDialogContext = React.createContext<AlertDialogContextType | null>(null)

interface AlertDialogProps {
  children: React.ReactNode
}

const AlertDialog = ({ children }: AlertDialogProps) => {
  const [open, setOpen] = React.useState(false)

  return (
    <AlertDialogContext.Provider value={{ open, onOpenChange: setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  )
}

interface AlertDialogTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

const AlertDialogTrigger = ({ children, asChild }: AlertDialogTriggerProps) => {
  const context = React.useContext(AlertDialogContext)
  if (!context) throw new Error('AlertDialogTrigger must be used within AlertDialog')

  const handleClick = () => {
    context.onOpenChange(true)
  }

  if (
    asChild &&
    React.isValidElement<{ onClick?: React.MouseEventHandler<any> }>(children)
  ) {
    const child = children
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e)
        handleClick()
      }
    })
  }

  return (
    <button onClick={handleClick}>
      {children}
    </button>
  )
}

interface AlertDialogContentProps {
  children: React.ReactNode
  className?: string
}

const AlertDialogContent = ({ children, className }: AlertDialogContentProps) => {
  const context = React.useContext(AlertDialogContext)
  if (!context) throw new Error('AlertDialogContent must be used within AlertDialog')

  if (!context.open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50"
        onClick={() => context.onOpenChange(false)}
      />
      <div className={cn(
        'relative bg-white rounded-lg shadow-lg p-6 w-full max-w-lg mx-4',
        className
      )}>
        {children}
      </div>
    </div>
  )
}

interface AlertDialogHeaderProps {
  children: React.ReactNode
  className?: string
}

const AlertDialogHeader = ({ children, className }: AlertDialogHeaderProps) => {
  return (
    <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)}>
      {children}
    </div>
  )
}

interface AlertDialogTitleProps {
  children: React.ReactNode
  className?: string
}

const AlertDialogTitle = ({ children, className }: AlertDialogTitleProps) => {
  return (
    <h2 className={cn('text-lg font-semibold', className)}>
      {children}
    </h2>
  )
}

interface AlertDialogDescriptionProps {
  children: React.ReactNode
  className?: string
}

const AlertDialogDescription = ({ children, className }: AlertDialogDescriptionProps) => {
  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      {children}
    </p>
  )
}

interface AlertDialogFooterProps {
  children: React.ReactNode
  className?: string
}

const AlertDialogFooter = ({ children, className }: AlertDialogFooterProps) => {
  return (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6', className)}>
      {children}
    </div>
  )
}

interface AlertDialogActionProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

const AlertDialogAction = ({ children, onClick, className }: AlertDialogActionProps) => {
  const context = React.useContext(AlertDialogContext)
  if (!context) throw new Error('AlertDialogAction must be used within AlertDialog')

  const handleClick = () => {
    onClick?.()
    context.onOpenChange(false)
  }

  return (
    <button
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      onClick={handleClick}
    >
      {children}
    </button>
  )
}

interface AlertDialogCancelProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

const AlertDialogCancel = ({ children, onClick, className }: AlertDialogCancelProps) => {
  const context = React.useContext(AlertDialogContext)
  if (!context) throw new Error('AlertDialogCancel must be used within AlertDialog')

  const handleClick = () => {
    onClick?.()
    context.onOpenChange(false)
  }

  return (
    <button
      className={cn(
        'mt-2 inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:mt-0',
        className
      )}
      onClick={handleClick}
    >
      {children}
    </button>
  )
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel
}