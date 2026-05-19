# Sistem Keuangan Sekolah

Aplikasi web untuk mengelola keuangan sekolah — mencatat pemasukan, pengeluaran, pembayaran SPP siswa, dan menghasilkan laporan keuangan.

## Fitur

- **Dashboard** — Ringkasan keuangan dengan grafik dan statistik
- **Manajemen Siswa** — Data siswa lengkap dengan info wali dan kelas
- **Pembayaran SPP** — Pencatatan pembayaran SPP per bulan per siswa
- **Pemasukan** — Pencatatan semua kas masuk selain SPP
- **Pengeluaran** — Pencatatan semua kas keluar
- **Laporan** — Laporan keuangan dengan filter tanggal dan ekspor data
- **Login** — Autentikasi admin dengan email dan password

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/USERNAME/keuangan-sekolah.git
cd keuangan-sekolah
npm install
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
```

Edit file `.env` dan isi dengan konfigurasi Anda (lihat `.env.example` untuk panduan).

### 3. Setup Database

**Opsi A: SQLite (lokal, tanpa Supabase)**
```bash
# Set DATABASE_MODE=prisma di .env
npx prisma db push
npm run dev
```

**Opsi B: Supabase Cloud (direkomendasikan untuk production)**
1. Buat akun di [supabase.com](https://supabase.com)
2. Buat project baru
3. Salin API Keys dari Settings → API ke file `.env`
4. Jalankan aplikasi dan ikuti panduan "Supabase Cloud" di sidebar

### 4. Jalankan Aplikasi

```bash
npm run dev
```

Buka `http://localhost:3000` di browser.

### 5. Login

- **Email**: `admin@sekolah.id`
- **Password**: `admin123`

## Deploy ke Vercel

1. Push kode ke GitHub
2. Buka [vercel.com](https://vercel.com) dan import repository
3. Tambahkan Environment Variables:
   - `DATABASE_MODE` = `supabase`
   - `NEXT_PUBLIC_SUPABASE_URL` = URL project Supabase Anda
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Anon key dari Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` = Service role key dari Supabase
4. Klik Deploy

> **Penting**: Vercel tidak mendukung SQLite. Pastikan menggunakan Supabase saat deploy ke Vercel.

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + React + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Prisma + SQLite (lokal) / Supabase PostgreSQL (cloud)
- **State Management**: Zustand
