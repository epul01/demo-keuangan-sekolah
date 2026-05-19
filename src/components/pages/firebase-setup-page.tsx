'use client'

import { useState } from 'react'
import {
  Cloud, Database, ArrowRight, CheckCircle, AlertCircle,
  ChevronDown, ChevronUp, Copy, Check, ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'

const STEP_ITEMS = [
  {
    step: 1,
    title: 'Buat Project Firebase',
    description: 'Buka Firebase Console dan buat project baru',
    details: [
      'Buka https://console.firebase.google.com/',
      'Klik "Create a project" atau "Add project"',
      'Beri nama project (misal: "keuangan-sekolah")',
      'Aktifkan Google Analytics (opsional)',
      'Tunggu hingga project selesai dibuat',
    ],
  },
  {
    step: 2,
    title: 'Daftarkan Aplikasi Web',
    description: 'Tambahkan aplikasi web ke project Firebase',
    details: [
      'Di halaman project overview, klik ikon Web (</>)',
      'Beri nama aplikasi (misal: "Keuangan Sekolah")',
      'Centang "Firebase Hosting" (opsional)',
      'Klik "Register app"',
      'Salin konfigurasi firebaseConfig yang muncul',
    ],
  },
  {
    step: 3,
    title: 'Aktifkan Firestore Database',
    description: 'Buat database Firestore untuk menyimpan data',
    details: [
      'Di sidebar, klik "Firestore Database"',
      'Klik "Create database"',
      'Pilih "Start in test mode" (untuk development)',
      'Pilih lokasi server (us-central1 atau asia-southeast1)',
      'Klik "Done"',
    ],
  },
  {
    step: 4,
    title: 'Salin Konfigurasi ke .env.local',
    description: 'Masukkan konfigurasi Firebase ke environment variables',
    details: [
      'Buka file .env.local di root project',
      'Salin setiap nilai dari firebaseConfig',
      'Isi environment variables yang sesuai',
      'Ubah DATABASE_MODE=firebase',
      'Restart development server',
    ],
  },
  {
    step: 5,
    title: 'Migrasi Data ke Firebase',
    description: 'Pindahkan data dari SQLite lokal ke Firebase Firestore',
    details: [
      'Pastikan Firebase sudah terkonfigurasi dengan benar',
      'Buka halaman ini dan klik tombol "Migrasi Data"',
      'Tunggu hingga proses migrasi selesai',
      'Refresh aplikasi untuk melihat data dari Firebase',
    ],
  },
]

const ENV_TEMPLATE = `# Database Configuration
DATABASE_URL=file:./db/custom.db
DATABASE_MODE=firebase

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456`

export default function FirebaseSetupGuide() {
  const [expandedSteps, setExpandedSteps] = useState<number[]>([1])
  const [copied, setCopied] = useState(false)
  const [firebaseConfig, setFirebaseConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  })

  const toggleStep = (step: number) => {
    setExpandedSteps((prev) =>
      prev.includes(step) ? prev.filter((s) => s !== step) : [...prev, step]
    )
  }

  const copyEnvTemplate = () => {
    navigator.clipboard.writeText(ENV_TEMPLATE)
    setCopied(true)
    toast.success('Template .env berhasil disalin!')
    setTimeout(() => setCopied(false), 2000)
  }

  const generateEnvFile = () => {
    const env = `# Database Configuration
DATABASE_URL=file:./db/custom.db
DATABASE_MODE=firebase

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=${firebaseConfig.apiKey}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${firebaseConfig.authDomain}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${firebaseConfig.projectId}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${firebaseConfig.storageBucket}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${firebaseConfig.messagingSenderId}
NEXT_PUBLIC_FIREBASE_APP_ID=${firebaseConfig.appId}`

    navigator.clipboard.writeText(env)
    toast.success('Konfigurasi .env berhasil disalin ke clipboard!')
  }

  const handleMigrate = async () => {
    try {
      const res = await fetch('/api/migrate', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Gagal melakukan migrasi. Pastikan Firebase sudah dikonfigurasi.')
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <Cloud className="h-8 w-8 text-emerald-600" />
          <h1 className="text-3xl font-bold">Setup Firebase Cloud Database</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Panduan lengkap untuk menyimpan data ke Google Firebase Cloud
        </p>
      </div>

      {/* Current Status */}
      <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20">
        <Database className="h-4 w-4 text-emerald-600" />
        <AlertTitle className="text-emerald-800 dark:text-emerald-300">Database Saat Ini: SQLite Lokal</AlertTitle>
        <AlertDescription className="text-emerald-700 dark:text-emerald-400">
          Data tersimpan di server lokal. Untuk menyimpan di cloud, ikuti langkah-langkah di bawah.
        </AlertDescription>
      </Alert>

      {/* Architecture Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Arsitektur Database Adapter
          </CardTitle>
          <CardDescription>
            Aplikasi menggunakan Database Adapter Pattern yang memungkinkan perpindahan database tanpa mengubah kode
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 p-4 rounded-lg border-2 border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/20 text-center">
              <Database className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
              <p className="font-bold">Prisma + SQLite</p>
              <p className="text-sm text-muted-foreground">Database Lokal</p>
              <Badge variant="outline" className="mt-2">Default</Badge>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ArrowRight className="h-6 w-6 text-muted-foreground hidden md:block" />
              <div className="md:hidden text-muted-foreground text-sm">↓</div>
              <p className="text-xs text-muted-foreground font-medium">DATABASE_MODE</p>
            </div>
            <div className="flex-1 p-4 rounded-lg border-2 border-sky-200 bg-sky-50/50 dark:border-sky-800 dark:bg-sky-900/20 text-center">
              <Cloud className="h-8 w-8 mx-auto text-sky-600 mb-2" />
              <p className="font-bold">Firebase Firestore</p>
              <p className="text-sm text-muted-foreground">Database Cloud</p>
              <Badge variant="outline" className="mt-2">Cloud ☁️</Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Cukup ubah <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">DATABASE_MODE=firebase</code> di file <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">.env.local</code> untuk beralih
          </p>
        </CardContent>
      </Card>

      {/* Step-by-step Guide */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold">📋 Langkah-langkah Setup</h2>
        {STEP_ITEMS.map((item) => (
          <Card key={item.step} className={expandedSteps.includes(item.step) ? 'ring-2 ring-emerald-200 dark:ring-emerald-800' : ''}>
            <CardContent className="p-4">
              <button
                className="w-full flex items-center gap-3 text-left"
                onClick={() => toggleStep(item.step)}
              >
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold text-sm shrink-0">
                  {item.step}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                {expandedSteps.includes(item.step) ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
              </button>
              {expandedSteps.includes(item.step) && (
                <div className="mt-3 ml-11 space-y-2">
                  {item.details.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Firebase Config Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⚙️ Konfigurasi Firebase
          </CardTitle>
          <CardDescription>
            Masukkan konfigurasi Firebase dari Firebase Console, lalu salin ke file .env.local
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                placeholder="AIzaSy..."
                value={firebaseConfig.apiKey}
                onChange={(e) => setFirebaseConfig({ ...firebaseConfig, apiKey: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Auth Domain</Label>
              <Input
                placeholder="your-project.firebaseapp.com"
                value={firebaseConfig.authDomain}
                onChange={(e) => setFirebaseConfig({ ...firebaseConfig, authDomain: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Project ID</Label>
              <Input
                placeholder="your-project-id"
                value={firebaseConfig.projectId}
                onChange={(e) => setFirebaseConfig({ ...firebaseConfig, projectId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Storage Bucket</Label>
              <Input
                placeholder="your-project.appspot.com"
                value={firebaseConfig.storageBucket}
                onChange={(e) => setFirebaseConfig({ ...firebaseConfig, storageBucket: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Messaging Sender ID</Label>
              <Input
                placeholder="123456789"
                value={firebaseConfig.messagingSenderId}
                onChange={(e) => setFirebaseConfig({ ...firebaseConfig, messagingSenderId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>App ID</Label>
              <Input
                placeholder="1:123456789:web:abcdef123456"
                value={firebaseConfig.appId}
                onChange={(e) => setFirebaseConfig({ ...firebaseConfig, appId: e.target.value })}
              />
            </div>
          </div>

          <Separator />

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={generateEnvFile} className="bg-emerald-600 hover:bg-emerald-700">
              <Copy className="h-4 w-4 mr-2" />
              Salin Konfigurasi .env
            </Button>
            <Button variant="outline" onClick={copyEnvTemplate}>
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? 'Tersalin!' : 'Salin Template .env'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Environment Variables Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>📁 Struktur File yang Dibuat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm font-mono">
            <div className="p-3 rounded bg-muted">
              <p className="text-emerald-600 dark:text-emerald-400 font-bold">src/lib/firebase.ts</p>
              <p className="text-muted-foreground">→ Konfigurasi Firebase & inisialisasi</p>
            </div>
            <div className="p-3 rounded bg-muted">
              <p className="text-emerald-600 dark:text-emerald-400 font-bold">src/lib/firebase-services.ts</p>
              <p className="text-muted-foreground">→ Layanan CRUD Firestore (admin, siswa, spp, pemasukan, pengeluaran)</p>
            </div>
            <div className="p-3 rounded bg-muted">
              <p className="text-emerald-600 dark:text-emerald-400 font-bold">src/lib/db-adapter.ts</p>
              <p className="text-muted-foreground">→ Database adapter (auto-switch Prisma ↔ Firebase)</p>
            </div>
            <div className="p-3 rounded bg-muted">
              <p className="text-emerald-600 dark:text-emerald-400 font-bold">src/app/api/migrate/route.ts</p>
              <p className="text-muted-foreground">→ API endpoint migrasi data dari SQLite ke Firebase</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Firestore Collections */}
      <Card>
        <CardHeader>
          <CardTitle>🗄️ Struktur Collection Firestore</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'admins', fields: ['email', 'password', 'name', 'role', 'createdAt', 'updatedAt'] },
              { name: 'siswa', fields: ['nama', 'nis', 'kelas', 'namaWali', 'nomorHP', 'createdAt', 'updatedAt'] },
              { name: 'spp', fields: ['siswaId', 'bulan', 'tahun', 'nominal', 'status', 'tanggalBayar', 'createdAt', 'updatedAt'] },
              { name: 'pemasukan', fields: ['jenis', 'nominal', 'tanggal', 'keterangan', 'createdAt', 'updatedAt'] },
              { name: 'pengeluaran', fields: ['jenis', 'nominal', 'tanggal', 'keterangan', 'createdAt', 'updatedAt'] },
            ].map((col) => (
              <div key={col.name} className="p-3 rounded border">
                <p className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">{col.name}</p>
                <div className="flex flex-wrap gap-1.5">
                  {col.fields.map((field) => (
                    <Badge key={field} variant="outline" className="text-xs">{field}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800 dark:text-amber-300">⚠️ Catatan Penting</AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-400 space-y-2">
          <p>• <strong>Test Mode:</strong> Firestore dalam test mode terbuka untuk semua baca/tulis. Untuk produksi, atur Security Rules.</p>
          <p>• <strong>Security Rules:</strong> Untuk produksi, tambahkan aturan keamanan di Firebase Console → Firestore → Rules:</p>
          <pre className="bg-amber-100 dark:bg-amber-900/40 p-2 rounded text-xs mt-1 overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`}
          </pre>
          <p>• <strong>Backup:</strong> Selalu backup data sebelum migrasi. Firebase menyediakan export/import otomatis.</p>
          <p>• <strong>Quota:</strong> Firestore gratis menyediakan 50.000 baca dan 20.000 tulis per hari.</p>
        </AlertDescription>
      </Alert>

      {/* Helpful Links */}
      <Card>
        <CardHeader>
          <CardTitle>🔗 Link Penting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Firebase Console', url: 'https://console.firebase.google.com/' },
              { label: 'Firestore Documentation', url: 'https://firebase.google.com/docs/firestore' },
              { label: 'Firebase Hosting', url: 'https://firebase.google.com/docs/hosting' },
              { label: 'Security Rules', url: 'https://firebase.google.com/docs/rules' },
            ].map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded border hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-sm font-medium">{link.label}</span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
