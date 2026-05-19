'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import LoginPage from '@/components/login-page'
import AppLayout from '@/components/app-layout'
import Providers from '@/components/providers'
import { Skeleton } from '@/components/ui/skeleton'

function AppContent() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)
  const checkSession = useAuthStore((s) => s.checkSession)

  useEffect(() => {
    checkSession()
  }, [checkSession])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800">
        <div className="text-center space-y-4">
          <Skeleton className="h-16 w-16 rounded-2xl mx-auto bg-white/20" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 mx-auto bg-white/20" />
            <Skeleton className="h-4 w-32 mx-auto bg-white/20" />
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return <AppLayout />
}

export default function Home() {
  return (
    <Providers>
      <AppContent />
    </Providers>
  )
}
