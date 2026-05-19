'use client'

import { create } from 'zustand'

export type PageType = 'dashboard' | 'siswa' | 'spp' | 'pemasukan' | 'pengeluaran' | 'laporan' | 'firebase-setup'

interface AppState {
  currentPage: PageType
  sidebarOpen: boolean
  setCurrentPage: (page: PageType) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'dashboard',
  sidebarOpen: true,

  setCurrentPage: (page: PageType) => {
    set({ currentPage: page })
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }))
  },
}))
