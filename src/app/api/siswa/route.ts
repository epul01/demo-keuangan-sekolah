import { NextRequest, NextResponse } from 'next/server'
import { dbAdapter } from '@/lib/db-adapter'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const kelas = searchParams.get('kelas') || ''

    const siswaList = await dbAdapter.siswa.findMany({ search, kelas })

    return NextResponse.json({
      success: true,
      data: siswaList,
    })
  } catch (error) {
    console.error('Get siswa error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nama, nis, kelas, namaWali, nomorHP } = body

    if (!nama || !nis || !kelas || !namaWali || !nomorHP) {
      return NextResponse.json(
        { success: false, message: 'Semua field wajib diisi' },
        { status: 400 }
      )
    }

    // Check if NIS already exists
    const existing = await dbAdapter.siswa.findByNis(nis)
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'NIS sudah terdaftar' },
        { status: 400 }
      )
    }

    const siswa = await dbAdapter.siswa.create({ nama, nis, kelas, namaWali, nomorHP })

    return NextResponse.json({
      success: true,
      message: 'Siswa berhasil ditambahkan',
      data: siswa,
    })
  } catch (error) {
    console.error('Create siswa error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
