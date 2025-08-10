'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, EyeOff, User, Lock, AlertCircle } from 'lucide-react'
import { AuthUser, LoginCredentials, UserRole } from '@/types'

export default function HomePage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  })
  const [rememberMe, setRememberMe] = useState(false)

  // Mock user database (in production, this would be in Supabase)
  const mockUsers: Record<string, { password: string; user: AuthUser }> = {
    'admin@stppl.org': {
      password: 'admin123',
      user: { id: '1', email: 'admin@stppl.org', name: 'Admin User', role: 'admin' }
    },
    'driver@stppl.org': {
      password: 'driver123',
      user: { id: '2', email: 'driver@stppl.org', name: 'Driver User', role: 'driver' }
    },
    'coordinator@stppl.org': {
      password: 'coord123',
      user: { id: '3', email: 'coordinator@stppl.org', name: 'Coordinator User', role: 'coordinator' }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      // Simple authentication check (MVP)
      const userRecord = mockUsers[credentials.email]
      
      if (userRecord && userRecord.password === credentials.password) {
        // Store authentication info
        sessionStorage.setItem('isAuthenticated', 'true')
        sessionStorage.setItem('currentUser', JSON.stringify(userRecord.user))
        
        router.push('/dashboard')
      } else {
        throw new Error('Invalid email or password')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <div className="text-center pt-16 pb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          STPPL UK 2025 - Transport Protocol
        </h1>
        <p className="text-lg text-gray-600">
          Transport & Protocol Management Portal
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="pt-8 pb-6 px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
            </div>

            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    value={credentials.email}
                    onChange={handleInputChange}
                    className="pl-10 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={credentials.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
                  Forgot password?
                </a>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              )}

             
              <Button 
                type="submit" 
                className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
            
              <Link href="/auth/register">
                <Button variant="outline" className="w-full h-12 text-blue-600 border-blue-600 hover:bg-blue-50">
                  Driver Onboarding
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-600">
            © 2025 STPPL UK & Europe Transport Protocol. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}