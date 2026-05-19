import { NextResponse } from 'next/server'
import { dbAdapter } from '@/lib/db-adapter'

export async function GET() {
  try {
    const data = await dbAdapter.dashboard.getStats()

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
