import { db } from '../src/lib/db'
import { hash } from 'crypto'

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const existingAdmin = await db.admin.findFirst({ where: { email: 'admin@sekolah.id' } })
  if (!existingAdmin) {
    await db.admin.create({
      data: {
        email: 'admin@sekolah.id',
        password: 'admin123',
        name: 'Administrator',
        role: 'admin',
      },
    })
    console.log('✅ Admin user created')
  }

  // Create students
  const kelasList = ['7A', '7B', '8A', '8B', '9A', '9B']
  const namaList = [
    'Ahmad Fauzi', 'Siti Nurhaliza', 'Budi Santoso', 'Dewi Lestari', 'Rizky Pratama',
    'Putri Wulandari', 'Andi Setiawan', 'Rina Marlina', 'Eko Prasetyo', 'Fitri Handayani',
    'Hendra Gunawan', 'Yuni Astuti', 'Agus Riyanto', 'Lina Sari', 'Dedi Kurniawan',
    'Nia Ramadhani', 'Fajar Nugroho', 'Maya Sari', 'Bambang Hermawan', 'Indah Permatasari',
    'Wahyu Hidayat', 'Ratna Dewi', 'Surya Darma', 'Ayu Puspita', 'Dani Firmansyah',
    'Sri Wahyuni', 'Tommy Kurniawan', 'Winda Sari', 'Rudi Hartono', 'Dina Safitri',
  ]

  const existingSiswa = await db.siswa.count()
  if (existingSiswa === 0) {
    const siswaData = namaList.map((nama, i) => ({
      nama,
      nis: `2024${String(i + 1).padStart(3, '0')}`,
      kelas: kelasList[i % kelasList.length],
      namaWali: `Wali ${nama.split(' ')[0]}`,
      nomorHP: `0812${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
    }))

    const siswa = await db.siswa.createMany({ data: siswaData })
    console.log(`✅ ${siswa.count} students created`)

    // Create SPP records
    const allSiswa = await db.siswa.findMany()
    const sppData = []
    const bulanNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    
    for (const s of allSiswa) {
      for (let bulan = 1; bulan <= 6; bulan++) {
        const isLunas = Math.random() > 0.3
        sppData.push({
          siswaId: s.id,
          bulan,
          tahun: 2025,
          nominal: 350000,
          status: isLunas ? 'lunas' : 'belum',
          tanggalBayar: isLunas ? new Date(2025, bulan - 1, Math.floor(Math.random() * 28) + 1) : null,
        })
      }
    }

    const spp = await db.sPP.createMany({ data: sppData })
    console.log(`✅ ${spp.count} SPP records created`)
  }

  // Create pemasukan (income)
  const existingPemasukan = await db.pemasukan.count()
  if (existingPemasukan === 0) {
    const pemasukanData = [
      { jenis: 'SPP Bulanan', nominal: 10500000, tanggal: new Date(2025, 0, 5), keterangan: 'Pembayaran SPP bulan Januari' },
      { jenis: 'SPP Bulanan', nominal: 9800000, tanggal: new Date(2025, 1, 5), keterangan: 'Pembayaran SPP bulan Februari' },
      { jenis: 'SPP Bulanan', nominal: 11200000, tanggal: new Date(2025, 2, 5), keterangan: 'Pembayaran SPP bulan Maret' },
      { jenis: 'SPP Bulanan', nominal: 10150000, tanggal: new Date(2025, 3, 5), keterangan: 'Pembayaran SPP bulan April' },
      { jenis: 'SPP Bulanan', nominal: 10850000, tanggal: new Date(2025, 4, 5), keterangan: 'Pembayaran SPP bulan Mei' },
      { jenis: 'SPP Bulanan', nominal: 9450000, tanggal: new Date(2025, 5, 5), keterangan: 'Pembayaran SPP bulan Juni' },
      { jenis: 'Dana BOS', nominal: 50000000, tanggal: new Date(2025, 0, 15), keterangan: 'Dana BOS Triwulan 1' },
      { jenis: 'Dana BOS', nominal: 50000000, tanggal: new Date(2025, 3, 15), keterangan: 'Dana BOS Triwulan 2' },
      { jenis: 'Donasi', nominal: 5000000, tanggal: new Date(2025, 1, 20), keterangan: 'Donasi alumni untuk renovasi' },
      { jenis: 'Kegiatan Siswa', nominal: 3500000, tanggal: new Date(2025, 2, 10), keterangan: 'Hasil bazar kegiatan OSIS' },
      { jenis: 'Sumbangan', nominal: 2500000, tanggal: new Date(2025, 4, 12), keterangan: 'Sumbangan komite sekolah' },
      { jenis: 'Lain-lain', nominal: 1500000, tanggal: new Date(2025, 5, 18), keterangan: 'Pendapatan fotokopi dan kantine' },
    ]

    const pemasukan = await db.pemasukan.createMany({ data: pemasukanData })
    console.log(`✅ ${pemasukan.count} income records created`)
  }

  // Create pengeluaran (expenses)
  const existingPengeluaran = await db.pengeluaran.count()
  if (existingPengeluaran === 0) {
    const pengeluaranData = [
      { jenis: 'Guru & Karyawan', nominal: 25000000, tanggal: new Date(2025, 0, 1), keterangan: 'Gaji guru dan karyawan Januari' },
      { jenis: 'Guru & Karyawan', nominal: 25000000, tanggal: new Date(2025, 1, 1), keterangan: 'Gaji guru dan karyawan Februari' },
      { jenis: 'Guru & Karyawan', nominal: 25000000, tanggal: new Date(2025, 2, 1), keterangan: 'Gaji guru dan karyawan Maret' },
      { jenis: 'Guru & Karyawan', nominal: 25000000, tanggal: new Date(2025, 3, 1), keterangan: 'Gaji guru dan karyawan April' },
      { jenis: 'Guru & Karyawan', nominal: 25000000, tanggal: new Date(2025, 4, 1), keterangan: 'Gaji guru dan karyawan Mei' },
      { jenis: 'Guru & Karyawan', nominal: 25000000, tanggal: new Date(2025, 5, 1), keterangan: 'Gaji guru dan karyawan Juni' },
      { jenis: 'Operasional', nominal: 3500000, tanggal: new Date(2025, 0, 10), keterangan: 'Listrik dan air Januari' },
      { jenis: 'Operasional', nominal: 3200000, tanggal: new Date(2025, 1, 10), keterangan: 'Listrik dan air Februari' },
      { jenis: 'Operasional', nominal: 3800000, tanggal: new Date(2025, 2, 10), keterangan: 'Listrik dan air Maret' },
      { jenis: 'Operasional', nominal: 3400000, tanggal: new Date(2025, 3, 10), keterangan: 'Listrik dan air April' },
      { jenis: 'Operasional', nominal: 3600000, tanggal: new Date(2025, 4, 10), keterangan: 'Listrik dan air Mei' },
      { jenis: 'Operasional', nominal: 3900000, tanggal: new Date(2025, 5, 10), keterangan: 'Listrik dan air Juni' },
      { jenis: 'Pemeliharaan', nominal: 7500000, tanggal: new Date(2025, 1, 15), keterangan: 'Perbaikan atap ruang kelas' },
      { jenis: 'ATK & Perlengkapan', nominal: 2800000, tanggal: new Date(2025, 0, 20), keterangan: 'Alat tulis kantor' },
      { jenis: 'ATK & Perlengkapan', nominal: 3100000, tanggal: new Date(2025, 3, 20), keterangan: 'Alat tulis kantor' },
      { jenis: 'Kegiatan Siswa', nominal: 5000000, tanggal: new Date(2025, 2, 17), keterangan: 'Peringatan Hari Pendidikan' },
      { jenis: 'Kegiatan Siswa', nominal: 4500000, tanggal: new Date(2025, 4, 5), keterangan: 'Pentas seni akhir tahun' },
      { jenis: 'Lain-lain', nominal: 1200000, tanggal: new Date(2025, 4, 25), keterangan: 'Cetak rapor semester' },
    ]

    const pengeluaran = await db.pengeluaran.createMany({ data: pengeluaranData })
    console.log(`✅ ${pengeluaran.count} expense records created`)
  }

  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
