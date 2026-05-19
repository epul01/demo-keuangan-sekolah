import { NextResponse } from 'next/server'
import { getDatabaseMode } from '@/lib/firebase'

export async function POST() {
  try {
    const mode = getDatabaseMode()
    
    if (mode !== 'firebase') {
      return NextResponse.json(
        { success: false, message: 'Set DATABASE_MODE=firebase untuk migrasi. Saat ini menggunakan Prisma/SQLite.' },
        { status: 400 }
      )
    }

    // Dynamic import to avoid loading Firebase when not needed
    const { seedService } = await import('@/lib/firebase-services')
    await seedService.migrateFromPrisma()

    return NextResponse.json({
      success: true,
      message: 'Data berhasil dimigrasikan dari SQLite ke Firebase Firestore!',
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { success: false, message: `Gagal migrasi: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

export async function GET() {
  const mode = getDatabaseMode()
  return NextResponse.json({
    success: true,
    data: {
      currentMode: mode,
      message: mode === 'firebase' 
        ? 'Database aktif: Firebase Firestore ☁️' 
        : 'Database aktif: Prisma/SQLite (lokal) 💾',
    },
  })
}
