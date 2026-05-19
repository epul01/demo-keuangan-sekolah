/**
 * Firebase Firestore Service Layer
 * 
 * Layanan CRUD untuk Firebase Firestore yang menyerupai API Prisma.
 * Setiap method mengembalikan data dalam format yang sama dengan Prisma,
 * sehingga API routes tidak perlu diubah saat berpindah database.
 * 
 * Struktur Collection di Firestore:
 * - admins     → { email, password, name, role, createdAt, updatedAt }
 * - siswa      → { nama, nis, kelas, namaWali, nomorHP, createdAt, updatedAt }
 * - spp        → { siswaId, bulan, tahun, nominal, status, tanggalBayar, createdAt, updatedAt }
 * - pemasukan  → { jenis, nominal, tanggal, keterangan, createdAt, updatedAt }
 * - pengeluaran → { jenis, nominal, tanggal, keterangan, createdAt, updatedAt }
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore'
import { getFirebaseDb } from './firebase'

// ============================================================
// Helper Functions
// ============================================================

/** Convert Firestore document to plain object with id */
function docToObj<T extends Record<string, unknown>>(snapshot: DocumentData): T & { id: string } {
  const data = snapshot.data()
  const result: Record<string, unknown> = { id: snapshot.id }

  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Timestamp) {
      result[key] = value.toDate().toISOString()
    } else {
      result[key] = value
    }
  }

  return result as T & { id: string }
}

/** Convert Date/string to Firestore Timestamp */
function toFirestoreValue(value: unknown): unknown {
  if (value instanceof Date) {
    return Timestamp.fromDate(value)
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) && !isNaN(Date.parse(value))) {
    return Timestamp.fromDate(new Date(value))
  }
  return value
}

/** Prepare data for Firestore - convert dates to Timestamps */
function prepareData(data: Record<string, unknown>): Record<string, unknown> {
  const prepared: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    prepared[key] = toFirestoreValue(value)
  }
  return prepared
}

// ============================================================
// Admin Service
// ============================================================

export const adminService = {
  async findByEmail(email: string) {
    const db = getFirebaseDb()
    const q = query(collection(db, 'admins'), where('email', '==', email), limit(1))
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    return docToObj(snapshot.docs[0])
  },

  async findById(id: string) {
    const db = getFirebaseDb()
    const docRef = doc(db, 'admins', id)
    const snapshot = await getDoc(docRef)
    if (!snapshot.exists()) return null
    return docToObj(snapshot)
  },

  async create(data: { email: string; password: string; name: string; role: string }) {
    const db = getFirebaseDb()
    const now = Timestamp.now()
    const docRef = await addDoc(collection(db, 'admins'), {
      ...data,
      createdAt: now,
      updatedAt: now,
    })
    const snapshot = await getDoc(docRef)
    return docToObj(snapshot)
  },
}

// ============================================================
// Siswa Service
// ============================================================

export const siswaService = {
  async findMany(options?: { search?: string; kelas?: string }) {
    const db = getFirebaseDb()
    const constraints: QueryConstraint[] = []
    
    if (options?.kelas) {
      constraints.push(where('kelas', '==', options.kelas))
    }
    
    constraints.push(orderBy('createdAt', 'desc'))
    
    const q = query(collection(db, 'siswa'), ...constraints)
    const snapshot = await getDocs(q)
    let results = snapshot.docs.map(d => docToObj(d))
    
    // Client-side search filter (Firestore doesn't support OR queries easily)
    if (options?.search) {
      const searchLower = options.search.toLowerCase()
      results = results.filter((s) =>
        (s.nama as string).toLowerCase().includes(searchLower) ||
        (s.nis as string).toLowerCase().includes(searchLower)
      )
    }
    
    return results
  },

  async findById(id: string) {
    const db = getFirebaseDb()
    const docRef = doc(db, 'siswa', id)
    const snapshot = await getDoc(docRef)
    if (!snapshot.exists()) return null
    return docToObj(snapshot)
  },

  async findByNis(nis: string) {
    const db = getFirebaseDb()
    const q = query(collection(db, 'siswa'), where('nis', '==', nis), limit(1))
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    return docToObj(snapshot.docs[0])
  },

  async create(data: { nama: string; nis: string; kelas: string; namaWali: string; nomorHP: string }) {
    const db = getFirebaseDb()
    const now = Timestamp.now()
    const docRef = await addDoc(collection(db, 'siswa'), {
      ...data,
      createdAt: now,
      updatedAt: now,
    })
    const snapshot = await getDoc(docRef)
    return docToObj(snapshot)
  },

  async update(id: string, data: Record<string, unknown>) {
    const db = getFirebaseDb()
    const docRef = doc(db, 'siswa', id)
    await updateDoc(docRef, {
      ...prepareData(data),
      updatedAt: Timestamp.now(),
    })
    const snapshot = await getDoc(docRef)
    return docToObj(snapshot)
  },

  async delete(id: string) {
    const db = getFirebaseDb()
    // Delete all related SPP records
    const sppSnapshot = await getDocs(query(collection(db, 'spp'), where('siswaId', '==', id)))
    for (const sppDoc of sppSnapshot.docs) {
      await deleteDoc(sppDoc.ref)
    }
    // Delete the siswa document
    await deleteDoc(doc(db, 'siswa', id))
  },
}

// ============================================================
// SPP Service
// ============================================================

export const sppService = {
  async findMany(options?: { siswaId?: string; status?: string; bulan?: number; tahun?: number }) {
    const db = getFirebaseDb()
    const constraints: QueryConstraint[] = []
    
    if (options?.siswaId) constraints.push(where('siswaId', '==', options.siswaId))
    if (options?.status) constraints.push(where('status', '==', options.status))
    if (options?.bulan) constraints.push(where('bulan', '==', options.bulan))
    if (options?.tahun) constraints.push(where('tahun', '==', options.tahun))
    
    constraints.push(orderBy('tahun', 'desc'))
    constraints.push(orderBy('bulan', 'desc'))
    
    const q = query(collection(db, 'spp'), ...constraints)
    const snapshot = await getDocs(q)
    return snapshot.docs.map(d => docToObj(d))
  },

  async findById(id: string) {
    const db = getFirebaseDb()
    const docRef = doc(db, 'spp', id)
    const snapshot = await getDoc(docRef)
    if (!snapshot.exists()) return null
    return docToObj(snapshot)
  },

  async findBySiswaBulanTahun(siswaId: string, bulan: number, tahun: number) {
    const db = getFirebaseDb()
    const q = query(
      collection(db, 'spp'),
      where('siswaId', '==', siswaId),
      where('bulan', '==', bulan),
      where('tahun', '==', tahun),
      limit(1)
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    return docToObj(snapshot.docs[0])
  },

  async create(data: { siswaId: string; bulan: number; tahun: number; nominal: number; status: string; tanggalBayar?: Date | null }) {
    const db = getFirebaseDb()
    const now = Timestamp.now()
    const docRef = await addDoc(collection(db, 'spp'), {
      ...data,
      tanggalBayar: data.tanggalBayar ? Timestamp.fromDate(data.tanggalBayar) : null,
      createdAt: now,
      updatedAt: now,
    })
    const snapshot = await getDoc(docRef)
    return docToObj(snapshot)
  },

  async update(id: string, data: Record<string, unknown>) {
    const db = getFirebaseDb()
    const docRef = doc(db, 'spp', id)
    await updateDoc(docRef, {
      ...prepareData(data),
      updatedAt: Timestamp.now(),
    })
    const snapshot = await getDoc(docRef)
    return docToObj(snapshot)
  },
}

// ============================================================
// Pemasukan Service
// ============================================================

export const pemasukanService = {
  async findMany(options?: { jenis?: string; startDate?: Date; endDate?: Date }) {
    const db = getFirebaseDb()
    const constraints: QueryConstraint[] = []
    
    if (options?.jenis) constraints.push(where('jenis', '==', options.jenis))
    constraints.push(orderBy('tanggal', 'desc'))
    
    const q = query(collection(db, 'pemasukan'), ...constraints)
    const snapshot = await getDocs(q)
    let results = snapshot.docs.map(d => docToObj(d))
    
    // Client-side date range filter
    if (options?.startDate) {
      const startMs = options.startDate.getTime()
      results = results.filter(r => new Date(r.tanggal as string).getTime() >= startMs)
    }
    if (options?.endDate) {
      const endMs = options.endDate.getTime()
      results = results.filter(r => new Date(r.tanggal as string).getTime() <= endMs)
    }
    
    return results
  },

  async findById(id: string) {
    const db = getFirebaseDb()
    const docRef = doc(db, 'pemasukan', id)
    const snapshot = await getDoc(docRef)
    if (!snapshot.exists()) return null
    return docToObj(snapshot)
  },

  async create(data: { jenis: string; nominal: number; tanggal: string; keterangan?: string | null }) {
    const db = getFirebaseDb()
    const now = Timestamp.now()
    const docRef = await addDoc(collection(db, 'pemasukan'), {
      ...data,
      tanggal: Timestamp.fromDate(new Date(data.tanggal)),
      createdAt: now,
      updatedAt: now,
    })
    const snapshot = await getDoc(docRef)
    return docToObj(snapshot)
  },

  async update(id: string, data: Record<string, unknown>) {
    const db = getFirebaseDb()
    const docRef = doc(db, 'pemasukan', id)
    await updateDoc(docRef, {
      ...prepareData(data),
      updatedAt: Timestamp.now(),
    })
    const snapshot = await getDoc(docRef)
    return docToObj(snapshot)
  },

  async delete(id: string) {
    const db = getFirebaseDb()
    await deleteDoc(doc(db, 'pemasukan', id))
  },
}

// ============================================================
// Pengeluaran Service
// ============================================================

export const pengeluaranService = {
  async findMany(options?: { jenis?: string; startDate?: Date; endDate?: Date }) {
    const db = getFirebaseDb()
    const constraints: QueryConstraint[] = []
    
    if (options?.jenis) constraints.push(where('jenis', '==', options.jenis))
    constraints.push(orderBy('tanggal', 'desc'))
    
    const q = query(collection(db, 'pengeluaran'), ...constraints)
    const snapshot = await getDocs(q)
    let results = snapshot.docs.map(d => docToObj(d))
    
    // Client-side date range filter
    if (options?.startDate) {
      const startMs = options.startDate.getTime()
      results = results.filter(r => new Date(r.tanggal as string).getTime() >= startMs)
    }
    if (options?.endDate) {
      const endMs = options.endDate.getTime()
      results = results.filter(r => new Date(r.tanggal as string).getTime() <= endMs)
    }
    
    return results
  },

  async findById(id: string) {
    const db = getFirebaseDb()
    const docRef = doc(db, 'pengeluaran', id)
    const snapshot = await getDoc(docRef)
    if (!snapshot.exists()) return null
    return docToObj(snapshot)
  },

  async create(data: { jenis: string; nominal: number; tanggal: string; keterangan?: string | null }) {
    const db = getFirebaseDb()
    const now = Timestamp.now()
    const docRef = await addDoc(collection(db, 'pengeluaran'), {
      ...data,
      tanggal: Timestamp.fromDate(new Date(data.tanggal)),
      createdAt: now,
      updatedAt: now,
    })
    const snapshot = await getDoc(docRef)
    return docToObj(snapshot)
  },

  async update(id: string, data: Record<string, unknown>) {
    const db = getFirebaseDb()
    const docRef = doc(db, 'pengeluaran', id)
    await updateDoc(docRef, {
      ...prepareData(data),
      updatedAt: Timestamp.now(),
    })
    const snapshot = await getDoc(docRef)
    return docToObj(snapshot)
  },

  async delete(id: string) {
    const db = getFirebaseDb()
    await deleteDoc(doc(db, 'pengeluaran', id))
  },
}

// ============================================================
// Dashboard Service (Aggregated Data)
// ============================================================

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export const dashboardService = {
  async getStats() {
    const [pemasukanList, pengeluaranList, sppList, siswaList] = await Promise.all([
      pemasukanService.findMany(),
      pengeluaranService.findMany(),
      sppService.findMany(),
      siswaService.findMany(),
    ])

    const jumlahSiswa = siswaList.length

    // Calculate totals
    const totalPemasukanOther = pemasukanList.reduce((sum: number, p: Record<string, unknown>) => sum + (p.nominal as number), 0)
    const totalSPPLunas = sppList
      .filter((s: Record<string, unknown>) => s.status === 'lunas')
      .reduce((sum: number, s: Record<string, unknown>) => sum + (s.nominal as number), 0)
    const totalPemasukan = totalPemasukanOther + totalSPPLunas
    const totalPengeluaran = pengeluaranList.reduce((sum: number, p: Record<string, unknown>) => sum + (p.nominal as number), 0)
    const saldo = totalPemasukan - totalPengeluaran

    // SPP Stats
    const totalSPPPending = sppList
      .filter((s: Record<string, unknown>) => s.status === 'belum')
      .reduce((sum: number, s: Record<string, unknown>) => sum + (s.nominal as number), 0)

    // Monthly data for charts
    const currentYear = new Date().getFullYear()
    const monthlyData: Array<{
      bulan: string
      bulanIndex: number
      tahun: number
      pemasukan: number
      pengeluaran: number
    }> = []

    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, new Date().getMonth() - i, 1)
      const month = date.getMonth()
      const year = date.getFullYear()

      const monthPemasukan = pemasukanList
        .filter((p: Record<string, unknown>) => {
          const d = new Date(p.tanggal as string)
          return d.getMonth() === month && d.getFullYear() === year
        })
        .reduce((sum: number, p: Record<string, unknown>) => sum + (p.nominal as number), 0)

      const monthSPP = sppList
        .filter((s: Record<string, unknown>) => {
          if (s.status !== 'lunas' || !s.tanggalBayar) return false
          const d = new Date(s.tanggalBayar as string)
          return d.getMonth() === month && d.getFullYear() === year
        })
        .reduce((sum: number, s: Record<string, unknown>) => sum + (s.nominal as number), 0)

      const monthPengeluaran = pengeluaranList
        .filter((p: Record<string, unknown>) => {
          const d = new Date(p.tanggal as string)
          return d.getMonth() === month && d.getFullYear() === year
        })
        .reduce((sum: number, p: Record<string, unknown>) => sum + (p.nominal as number), 0)

      monthlyData.push({
        bulan: MONTH_NAMES[month],
        bulanIndex: month,
        tahun: year,
        pemasukan: monthPemasukan + monthSPP,
        pengeluaran: monthPengeluaran,
      })
    }

    // Recent transactions
    const recentPemasukan = pemasukanList.slice(0, 5).map((p: Record<string, unknown>) => ({
      id: p.id,
      jenis: p.jenis,
      nominal: p.nominal,
      tanggal: p.tanggal,
      keterangan: p.keterangan,
      tipe: 'pemasukan' as const,
      createdAt: p.createdAt,
    }))

    const recentPengeluaran = pengeluaranList.slice(0, 5).map((p: Record<string, unknown>) => ({
      id: p.id,
      jenis: p.jenis,
      nominal: p.nominal,
      tanggal: p.tanggal,
      keterangan: p.keterangan,
      tipe: 'pengeluaran' as const,
      createdAt: p.createdAt,
    }))

    const recentTransactions = [...recentPemasukan, ...recentPengeluaran]
      .sort((a, b) => new Date(b.tanggal as string).getTime() - new Date(a.tanggal as string).getTime())
      .slice(0, 10)

    return {
      totalPemasukan,
      totalPengeluaran,
      saldo,
      jumlahSiswa,
      sppStats: {
        totalSPPLunas,
        totalSPPPending,
        jumlahSPPLunas: sppList.filter((s: Record<string, unknown>) => s.status === 'lunas').length,
        jumlahSPPBelum: sppList.filter((s: Record<string, unknown>) => s.status === 'belum').length,
      },
      monthlyData,
      recentTransactions,
    }
  },
}

// ============================================================
// Seed / Migration Helper
// ============================================================

export const seedService = {
  /** Migrate data from Prisma/SQLite to Firebase Firestore */
  async migrateFromPrisma() {
    const { db: prismaDb } = await import('@/lib/db')
    
    console.log('🔄 Migrating data from Prisma to Firebase...')
    
    // Migrate admins
    const admins = await prismaDb.admin.findMany()
    for (const admin of admins) {
      await adminService.create({
        email: admin.email,
        password: admin.password,
        name: admin.name,
        role: admin.role,
      })
    }
    console.log(`✅ Migrated ${admins.length} admins`)

    // Migrate siswa
    const siswaList = await prismaDb.siswa.findMany()
    const siswaIdMap = new Map<string, string>() // old ID -> new ID
    for (const siswa of siswaList) {
      const newSiswa = await siswaService.create({
        nama: siswa.nama,
        nis: siswa.nis,
        kelas: siswa.kelas,
        namaWali: siswa.namaWali,
        nomorHP: siswa.nomorHP,
      })
      siswaIdMap.set(siswa.id, newSiswa.id)
    }
    console.log(`✅ Migrated ${siswaList.length} siswa`)

    // Migrate SPP
    const sppList = await prismaDb.sPP.findMany()
    for (const spp of sppList) {
      const newSiswaId = siswaIdMap.get(spp.siswaId) || spp.siswaId
      await sppService.create({
        siswaId: newSiswaId,
        bulan: spp.bulan,
        tahun: spp.tahun,
        nominal: spp.nominal,
        status: spp.status,
        tanggalBayar: spp.tanggalBayar,
      })
    }
    console.log(`✅ Migrated ${sppList.length} SPP records`)

    // Migrate pemasukan
    const pemasukanList = await prismaDb.pemasukan.findMany()
    for (const p of pemasukanList) {
      await pemasukanService.create({
        jenis: p.jenis,
        nominal: p.nominal,
        tanggal: p.tanggal.toISOString().split('T')[0],
        keterangan: p.keterangan,
      })
    }
    console.log(`✅ Migrated ${pemasukanList.length} pemasukan`)

    // Migrate pengeluaran
    const pengeluaranList = await prismaDb.pengeluaran.findMany()
    for (const p of pengeluaranList) {
      await pengeluaranService.create({
        jenis: p.jenis,
        nominal: p.nominal,
        tanggal: p.tanggal.toISOString().split('T')[0],
        keterangan: p.keterangan,
      })
    }
    console.log(`✅ Migrated ${pengeluaranList.length} pengeluaran`)

    console.log('🎉 Migration complete!')
  },
}
