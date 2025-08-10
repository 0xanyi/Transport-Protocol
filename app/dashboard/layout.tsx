'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardNav } from '@/components/ui/dashboard-nav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    // Simple auth check for MVP
    const isAdmin = sessionStorage.getItem('isAdmin')
    if (!isAdmin) {
      router.push('/auth/login')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}