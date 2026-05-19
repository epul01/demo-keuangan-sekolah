'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import AppSidebar from '@/components/app-sidebar'
import { useAppStore, type PageType } from '@/store/app-store'
import DashboardPage from '@/components/pages/dashboard-page'
import SiswaPage from '@/components/pages/siswa-page'
import SppPage from '@/components/pages/spp-page'
import PemasukanPage from '@/components/pages/pemasukan-page'
import PengeluaranPage from '@/components/pages/pengeluaran-page'
import LaporanPage from '@/components/pages/laporan-page'
import FirebaseSetupPage from '@/components/pages/firebase-setup-page'

const PAGE_TITLES: Record<PageType, string> = {
  dashboard: 'Dashboard',
  siswa: 'Data Siswa',
  spp: 'Pembayaran SPP',
  pemasukan: 'Kas Masuk',
  pengeluaran: 'Kas Keluar',
  laporan: 'Laporan Keuangan',
  'firebase-setup': 'Setup Firebase Cloud',
}

const PAGE_COMPONENTS: Record<PageType, React.ComponentType> = {
  dashboard: DashboardPage,
  siswa: SiswaPage,
  spp: SppPage,
  pemasukan: PemasukanPage,
  pengeluaran: PengeluaranPage,
  laporan: LaporanPage,
  'firebase-setup': FirebaseSetupPage,
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="h-9 w-9 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export default function AppLayout() {
  const currentPage = useAppStore((s) => s.currentPage)
  const PageComponent = PAGE_COMPONENTS[currentPage]
  const pageTitle = PAGE_TITLES[currentPage]

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-14 items-center gap-2 border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 px-4 sticky top-0 z-30">
          <SidebarTrigger className="-ml-1 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" />
          <Separator orientation="vertical" className="h-6" />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {pageTitle}
          </h1>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          <PageComponent />
        </div>

        {/* Footer */}
        <footer className="border-t py-3 px-4 text-center text-sm text-muted-foreground bg-white/50 dark:bg-gray-900/50 mt-auto">
          &copy; 2025 Sistem Keuangan Sekolah
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}
