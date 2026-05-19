/**
 * Database Adapter Pattern
 * 
 * Modul ini menyediakan antarmuka database yang seragam.
 * Aplikasi secara otomatis menggunakan Firebase atau Prisma
 * berdasarkan environment variable DATABASE_MODE.
 * 
 * Penggunaan:
 *   DATABASE_MODE=prisma    → Gunakan SQLite lokal (default)
 *   DATABASE_MODE=firebase  → Gunakan Firebase Firestore cloud
 * 
 * Cukup import dari modul ini di API routes:
 *   import { dbAdapter } from '@/lib/db-adapter'
 *   const siswa = await dbAdapter.siswa.findMany()
 */

import { getDatabaseMode } from './firebase'
import { db } from './db'

// Import Firebase services
import {
  adminService,
  siswaService,
  sppService,
  pemasukanService,
  pengeluaranService,
  dashboardService,
  seedService,
} from './firebase-services'

// ============================================================
// Prisma Adapter Implementation
// ============================================================

const prismaAdapter = {
  admin: {
    findByEmail: async (email: string) => {
      return db.admin.findUnique({ where: { email } })
    },
    findById: async (id: string) => {
      return db.admin.findUnique({ where: { id } })
    },
    create: async (data: { email: string; password: string; name: string; role: string }) => {
      return db.admin.create({ data })
    },
  },

  siswa: {
    findMany: async (options?: { search?: string; kelas?: string }) => {
      const where: Record<string, unknown> = {}
      if (options?.search) {
        where.OR = [
          { nama: { contains: options.search } },
          { nis: { contains: options.search } },
        ]
      }
      if (options?.kelas) {
        where.kelas = options.kelas
      }
      const list = await db.siswa.findMany({
        where,
        include: { spp: { orderBy: [{ tahun: 'desc' }, { bulan: 'desc' }] } },
        orderBy: { createdAt: 'desc' },
      })
      return list.map(s => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        spp: s.spp.map(sp => ({
          ...sp,
          tanggalBayar: sp.tanggalBayar ? sp.tanggalBayar.toISOString() : null,
          createdAt: sp.createdAt.toISOString(),
          updatedAt: sp.updatedAt.toISOString(),
        })),
      }))
    },
    findById: async (id: string) => {
      const siswa = await db.siswa.findUnique({ where: { id } })
      if (!siswa) return null
      return {
        ...siswa,
        createdAt: siswa.createdAt.toISOString(),
        updatedAt: siswa.updatedAt.toISOString(),
      }
    },
    findByNis: async (nis: string) => {
      return db.siswa.findUnique({ where: { nis } })
    },
    create: async (data: { nama: string; nis: string; kelas: string; namaWali: string; nomorHP: string }) => {
      const siswa = await db.siswa.create({ data })
      return {
        ...siswa,
        createdAt: siswa.createdAt.toISOString(),
        updatedAt: siswa.updatedAt.toISOString(),
      }
    },
    update: async (id: string, data: Record<string, unknown>) => {
      const siswa = await db.siswa.update({ where: { id }, data })
      return {
        ...siswa,
        createdAt: siswa.createdAt.toISOString(),
        updatedAt: siswa.updatedAt.toISOString(),
      }
    },
    delete: async (id: string) => {
      await db.siswa.delete({ where: { id } })
    },
  },

  spp: {
    findMany: async (options?: { siswaId?: string; status?: string; bulan?: number; tahun?: number }) => {
      const where: Record<string, unknown> = {}
      if (options?.siswaId) where.siswaId = options.siswaId
      if (options?.status) where.status = options.status
      if (options?.bulan) where.bulan = options.bulan
      if (options?.tahun) where.tahun = options.tahun

      const list = await db.sPP.findMany({
        where,
        include: { siswa: { select: { id: true, nama: true, nis: true, kelas: true } } },
        orderBy: [{ tahun: 'desc' }, { bulan: 'desc' }],
      })
      return list.map(s => ({
        ...s,
        tanggalBayar: s.tanggalBayar ? s.tanggalBayar.toISOString() : null,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      }))
    },
    findById: async (id: string) => {
      const spp = await db.sPP.findUnique({ where: { id } })
      if (!spp) return null
      return {
        ...spp,
        tanggalBayar: spp.tanggalBayar ? spp.tanggalBayar.toISOString() : null,
        createdAt: spp.createdAt.toISOString(),
        updatedAt: spp.updatedAt.toISOString(),
      }
    },
    findBySiswaBulanTahun: async (siswaId: string, bulan: number, tahun: number) => {
      return db.sPP.findFirst({ where: { siswaId, bulan, tahun } })
    },
    create: async (data: { siswaId: string; bulan: number; tahun: number; nominal: number; status: string; tanggalBayar?: Date | null }) => {
      const spp = await db.sPP.create({
        data: {
          siswaId: data.siswaId,
          bulan: data.bulan,
          tahun: data.tahun,
          nominal: data.nominal,
          status: data.status,
          tanggalBayar: data.tanggalBayar || undefined,
        },
        include: { siswa: { select: { id: true, nama: true, nis: true, kelas: true } } },
      })
      return {
        ...spp,
        tanggalBayar: spp.tanggalBayar ? spp.tanggalBayar.toISOString() : null,
        createdAt: spp.createdAt.toISOString(),
        updatedAt: spp.updatedAt.toISOString(),
      }
    },
    update: async (id: string, data: Record<string, unknown>) => {
      const spp = await db.sPP.update({
        where: { id },
        data,
        include: { siswa: { select: { id: true, nama: true, nis: true, kelas: true } } },
      })
      return {
        ...spp,
        tanggalBayar: spp.tanggalBayar ? spp.tanggalBayar.toISOString() : null,
        createdAt: spp.createdAt.toISOString(),
        updatedAt: spp.updatedAt.toISOString(),
      }
    },
  },

  pemasukan: {
    findMany: async (options?: { jenis?: string; startDate?: Date; endDate?: Date }) => {
      const where: Record<string, unknown> = {}
      if (options?.jenis) where.jenis = options.jenis
      if (options?.startDate || options?.endDate) {
        where.tanggal = {}
        if (options?.startDate) (where.tanggal as Record<string, unknown>).gte = options.startDate
        if (options?.endDate) (where.tanggal as Record<string, unknown>).lte = options.endDate
      }
      const list = await db.pemasukan.findMany({ where, orderBy: { tanggal: 'desc' } })
      return list.map(p => ({
        ...p,
        tanggal: p.tanggal.toISOString(),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }))
    },
    findById: async (id: string) => {
      const p = await db.pemasukan.findUnique({ where: { id } })
      if (!p) return null
      return {
        ...p,
        tanggal: p.tanggal.toISOString(),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }
    },
    create: async (data: { jenis: string; nominal: number; tanggal: string; keterangan?: string | null }) => {
      const p = await db.pemasukan.create({
        data: {
          jenis: data.jenis,
          nominal: data.nominal,
          tanggal: new Date(data.tanggal),
          keterangan: data.keterangan,
        },
      })
      return {
        ...p,
        tanggal: p.tanggal.toISOString(),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }
    },
    update: async (id: string, data: Record<string, unknown>) => {
      if (data.tanggal && typeof data.tanggal === 'string') {
        data.tanggal = new Date(data.tanggal)
      }
      const p = await db.pemasukan.update({ where: { id }, data })
      return {
        ...p,
        tanggal: p.tanggal.toISOString(),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }
    },
    delete: async (id: string) => {
      await db.pemasukan.delete({ where: { id } })
    },
  },

  pengeluaran: {
    findMany: async (options?: { jenis?: string; startDate?: Date; endDate?: Date }) => {
      const where: Record<string, unknown> = {}
      if (options?.jenis) where.jenis = options.jenis
      if (options?.startDate || options?.endDate) {
        where.tanggal = {}
        if (options?.startDate) (where.tanggal as Record<string, unknown>).gte = options.startDate
        if (options?.endDate) (where.tanggal as Record<string, unknown>).lte = options.endDate
      }
      const list = await db.pengeluaran.findMany({ where, orderBy: { tanggal: 'desc' } })
      return list.map(p => ({
        ...p,
        tanggal: p.tanggal.toISOString(),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }))
    },
    findById: async (id: string) => {
      const p = await db.pengeluaran.findUnique({ where: { id } })
      if (!p) return null
      return {
        ...p,
        tanggal: p.tanggal.toISOString(),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }
    },
    create: async (data: { jenis: string; nominal: number; tanggal: string; keterangan?: string | null }) => {
      const p = await db.pengeluaran.create({
        data: {
          jenis: data.jenis,
          nominal: data.nominal,
          tanggal: new Date(data.tanggal),
          keterangan: data.keterangan,
        },
      })
      return {
        ...p,
        tanggal: p.tanggal.toISOString(),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }
    },
    update: async (id: string, data: Record<string, unknown>) => {
      if (data.tanggal && typeof data.tanggal === 'string') {
        data.tanggal = new Date(data.tanggal)
      }
      const p = await db.pengeluaran.update({ where: { id }, data })
      return {
        ...p,
        tanggal: p.tanggal.toISOString(),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }
    },
    delete: async (id: string) => {
      await db.pengeluaran.delete({ where: { id } })
    },
  },

  dashboard: {
    getStats: async () => {
      const [pemasukanList, pengeluaranList, sppList, jumlahSiswa] = await Promise.all([
        db.pemasukan.findMany({ orderBy: { tanggal: 'desc' } }),
        db.pengeluaran.findMany({ orderBy: { tanggal: 'desc' } }),
        db.sPP.findMany({ include: { siswa: { select: { nama: true, nis: true } } } }),
        db.siswa.count(),
      ])

      const totalPemasukanOther = pemasukanList.reduce((sum, p) => sum + p.nominal, 0)
      const totalSPPLunas = sppList.filter(s => s.status === 'lunas').reduce((sum, s) => sum + s.nominal, 0)
      const totalPemasukan = totalPemasukanOther + totalSPPLunas
      const totalPengeluaran = pengeluaranList.reduce((sum, p) => sum + p.nominal, 0)
      const saldo = totalPemasukan - totalPengeluaran
      const totalSPPPending = sppList.filter(s => s.status === 'belum').reduce((sum, s) => sum + s.nominal, 0)

      const currentYear = new Date().getFullYear()
      const monthlyData: Array<{ bulan: string; bulanIndex: number; tahun: number; pemasukan: number; pengeluaran: number }> = []
      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentYear, new Date().getMonth() - i, 1)
        const month = date.getMonth()
        const year = date.getFullYear()
        const monthPemasukan = pemasukanList.filter(p => { const d = new Date(p.tanggal); return d.getMonth() === month && d.getFullYear() === year }).reduce((s, p) => s + p.nominal, 0)
        const monthSPP = sppList.filter(s => { if (s.status !== 'lunas' || !s.tanggalBayar) return false; const d = new Date(s.tanggalBayar); return d.getMonth() === month && d.getFullYear() === year }).reduce((s, sp) => s + sp.nominal, 0)
        const monthPengeluaran = pengeluaranList.filter(p => { const d = new Date(p.tanggal); return d.getMonth() === month && d.getFullYear() === year }).reduce((s, p) => s + p.nominal, 0)
        monthlyData.push({ bulan: ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][month], bulanIndex: month, tahun: year, pemasukan: monthPemasukan + monthSPP, pengeluaran: monthPengeluaran })
      }

      const recentPemasukan = pemasukanList.slice(0, 5).map(p => ({ id: p.id, jenis: p.jenis, nominal: p.nominal, tanggal: p.tanggal.toISOString(), keterangan: p.keterangan, tipe: 'pemasukan' as const, createdAt: p.createdAt.toISOString() }))
      const recentPengeluaran = pengeluaranList.slice(0, 5).map(p => ({ id: p.id, jenis: p.jenis, nominal: p.nominal, tanggal: p.tanggal.toISOString(), keterangan: p.keterangan, tipe: 'pengeluaran' as const, createdAt: p.createdAt.toISOString() }))
      const recentTransactions = [...recentPemasukan, ...recentPengeluaran].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).slice(0, 10)

      return { totalPemasukan, totalPengeluaran, saldo, jumlahSiswa, sppStats: { totalSPPLunas, totalSPPPending, jumlahSPPLunas: sppList.filter(s => s.status === 'lunas').length, jumlahSPPBelum: sppList.filter(s => s.status === 'belum').length }, monthlyData, recentTransactions }
    },
  },
}

// ============================================================
// Firebase Adapter Implementation
// ============================================================

const firebaseAdapter = {
  admin: adminService,
  siswa: siswaService,
  spp: sppService,
  pemasukan: pemasukanService,
  pengeluaran: pengeluaranService,
  dashboard: dashboardService,
}

// ============================================================
// Auto-switching Adapter
// ============================================================

function createAdapter() {
  const mode = getDatabaseMode()
  
  if (mode === 'firebase') {
    console.log('🔥 Using Firebase Firestore as database')
    return firebaseAdapter
  }
  
  // Default: Prisma/SQLite
  return prismaAdapter
}

// Export singleton adapter
export const dbAdapter = createAdapter()

// Export for convenience
export { seedService }
export type DatabaseMode = 'prisma' | 'firebase'
