'use client'

import { GraduationCap, LayoutDashboard, Users, CreditCard, TrendingUp, TrendingDown, FileText, LogOut, Database, Cloud } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useAppStore, type PageType } from '@/store/app-store'
import { useAuthStore } from '@/store/auth-store'

const NAV_ITEMS: { page: PageType; label: string; icon: React.ComponentType<{ className?: string }>; highlight?: boolean }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'siswa', label: 'Data Siswa', icon: Users },
  { page: 'spp', label: 'Pembayaran SPP', icon: CreditCard },
  { page: 'pemasukan', label: 'Kas Masuk', icon: TrendingUp },
  { page: 'pengeluaran', label: 'Kas Keluar', icon: TrendingDown },
  { page: 'laporan', label: 'Laporan', icon: FileText },
  { page: 'firebase-setup', label: 'Firebase Cloud', icon: Cloud, highlight: true },
]

export default function AppSidebar() {
  const currentPage = useAppStore((s) => s.currentPage)
  const setCurrentPage = useAppStore((s) => s.setCurrentPage)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = async () => {
    await logout()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-emerald-100 dark:border-emerald-900/50">
      <SidebarHeader className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                <GraduationCap className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold text-emerald-700 dark:text-emerald-400">SKeuangan</span>
                <span className="truncate text-xs text-muted-foreground">Sekolah</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <Separator className="bg-emerald-100 dark:bg-emerald-900/50" />

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive = currentPage === item.page
                return (
                  <SidebarMenuItem key={item.page}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setCurrentPage(item.page)}
                      tooltip={item.label}
                      className={
                        isActive
                          ? item.highlight
                            ? 'bg-sky-100 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/40 dark:text-sky-400 dark:hover:bg-sky-900/40 font-medium'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400 dark:hover:bg-emerald-900/40 font-medium'
                          : item.highlight
                            ? 'hover:bg-sky-50 dark:hover:bg-sky-900/20 text-sky-600 dark:text-sky-400'
                            : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                      }
                    >
                      <item.icon className={isActive ? (item.highlight ? 'text-sky-600 dark:text-sky-400' : 'text-emerald-600 dark:text-emerald-400') : ''} />
                      <span>{item.label}</span>
                      {item.highlight && <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400">☁️</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        {/* Database mode indicator */}
        <div className="mx-2 mb-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-xs">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <Database className="size-3.5" />
            <span className="font-medium">SQLite Lokal</span>
          </div>
          <p className="text-muted-foreground mt-0.5 ml-5.5">Data tersimpan di server lokal</p>
        </div>
        <Separator className="mb-2 bg-emerald-100 dark:bg-emerald-900/50" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs dark:bg-emerald-900/40 dark:text-emerald-400">
                  {user?.name ? getInitials(user.name) : 'AD'}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.name || 'Admin'}</span>
                <span className="truncate text-xs text-muted-foreground">{user?.email || 'admin@sekolah.id'}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Keluar"
              className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
            >
              <LogOut />
              <span>Keluar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
