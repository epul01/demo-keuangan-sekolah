# Sistem Keuangan Sekolah - Qur'anic School of Dewan Da'wah Cirebon

Aplikasi manajemen keuangan sekolah berbasis web yang dibangun dengan Next.js, Prisma, dan PostgreSQL.

## ✨ Fitur

- 📊 **Dashboard** - Ringkasan keuangan dengan grafik bulanan
- 👨‍🎓 **Manajemen Siswa** - CRUD data siswa
- 💰 **Pemasukan** - 7 jenis: SPP Bulanan, Pendaftaran, Buku, Biaya Ujian, Infaq, Uang Kegiatan, Lainnya
- 📤 **Pengeluaran** - 6 kategori: ATK, Gaji Guru, Listrik, Air, Maintenance, Lainnya
- 📋 **Laporan** - Export PDF & Excel
- 🔔 **Notifikasi** - Pengingat SPP belum dibayar
- 📈 **Monitoring Pembayaran** - Cek progres pembayaran setiap siswa
- 🔐 **Autentikasi** - Login dengan role Admin & Bendahara

## 🛠️ Tech Stack

| Teknologi | Keterangan |
|-----------|------------|
| Next.js 16 | Framework React full-stack |
| TypeScript | Bahasa pemrograman |
| PostgreSQL | Database (via Vercel Postgres) |
| Prisma | ORM untuk database |
| Tailwind CSS | Styling |
| shadcn/ui | Komponen UI |
| Recharts | Grafik & chart |
| jsPDF + xlsx | Export PDF & Excel |

## 📦 Setup Lokal

### Prasyarat
- Node.js 18+ atau Bun
- Database PostgreSQL (lokal atau cloud)

### Langkah Installasi

1. **Clone repository**
   ```bash
   git clone https://github.com/USERNAME/keuangan-sekolah.git
   cd keuangan-sekolah
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` dan isi dengan connection string database Anda.

4. **Setup database**
   ```bash
   npx prisma db push
   ```

5. **Jalankan development server**
   ```bash
   npm run dev
   ```

6. **Isi data awal (seed)**
   Buka browser: `http://localhost:3000/api/seed`

7. **Login**
   - 👑 Admin: `admin@sekolah.id` / `password123`
   - 📝 Bendahara: `bendahara@sekolah.id` / `password123`

## 🚀 Deploy ke Vercel

### Langkah 1: Upload ke GitHub
1. Buat repository baru di [github.com/new](https://github.com/new)
2. Pilih **Private** (rekomendasi)
3. Upload semua file project

### Langkah 2: Buat Database PostgreSQL
1. Buka [vercel.com/dashboard](https://vercel.com/dashboard)
2. Pilih project → tab **Storage**
3. Klik **Create Database** → pilih **Postgres (Neon)**
4. Salin connection strings yang muncul

### Langkah 3: Import Project di Vercel
1. Buka [vercel.com/new](https://vercel.com/new)
2. Import repository GitHub Anda
3. Di **Settings → Environment Variables**, tambahkan:

| Variable | Nilai |
|----------|-------|
| `DATABASE_URL` | Connection string dengan `?pgbouncer=true` |
| `DIRECT_URL` | Connection string tanpa pgbouncer |
| `JWT_SECRET` | Secret key acak (min 32 karakter) |

4. Klik **Deploy**

### Langkah 4: Buat Tabel & Seed Data
Setelah deploy berhasil:
1. Buka tab **Storage** → database Anda
2. Atau kunjungi: `https://NAMA-PROJECT.vercel.app/api/seed`

## 📁 Struktur Folder

```
├── prisma/
│   └── schema.prisma          # Database schema
├── public/
│   └── logo-sekolah.jpeg      # Logo sekolah
├── src/
│   ├── app/
│   │   ├── (auth)/            # Halaman login
│   │   ├── (dashboard)/       # Halaman dashboard & fitur
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── layout/            # Sidebar, Header
│   │   └── ui/                # shadcn/ui components
│   └── lib/
│       ├── constants.ts       # Tipe pemasukan/pengeluaran
│       ├── db.ts              # Prisma client
│       ├── format.ts          # Format rupiah, tanggal
│       └── auth-jwt.ts        # JWT authentication
├── .env.example               # Template env variables
├── .gitignore                 # File yang di-exclude dari Git
└── package.json               # Dependencies & scripts
```

## 🔒 Keamanan

- ⚠️ **JANGAN** upload file `.env` atau `.env.local` ke GitHub
- ⚠️ **JANGAN** upload file database (`*.db`) ke GitHub
- Ganti `JWT_SECRET` dengan key yang kuat di production
- Ganti password default setelah deploy pertama kali
