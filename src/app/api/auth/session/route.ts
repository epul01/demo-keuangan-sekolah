import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada sesi aktif', data: null },
        { status: 401 }
      )
    }

    const sessionData = JSON.parse(sessionCookie.value)

    return NextResponse.json({
      success: true,
      message: 'Sesi valid',
      data: sessionData,
    })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json(
      { success: false, message: 'Sesi tidak valid', data: null },
      { status: 401 }
    )
  }
}
