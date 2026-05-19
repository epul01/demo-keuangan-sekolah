import { NextRequest, NextResponse } from 'next/server'
import { dbAdapter } from '@/lib/db-adapter'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jenis = searchParams.get('jenis') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    const pemasukanList = await dbAdapter.pemasukan.findMany({
      jenis: jenis || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    })

    return NextResponse.json({
      success: true,
      data: pemasukanList,
    })
  } catch (error) {
    console.error('Get pemasukan error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jenis, nominal, tanggal, keterangan } = body

    if (!jenis || !nominal || !tanggal) {
      return NextResponse.json(
        { success: false, message: 'Jenis, nominal, dan tanggal wajib diisi' },
        { status: 400 }
      )
    }

    const pemasukan = await dbAdapter.pemasukan.create({
      jenis,
      nominal: parseFloat(nominal),
      tanggal,
      keterangan: keterangan || null,
    })

    return NextResponse.json({
      success: true,
      message: 'Pemasukan berhasil ditambahkan',
      data: pemasukan,
    })
  } catch (error) {
    console.error('Create pemasukan error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
