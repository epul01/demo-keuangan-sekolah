import { NextRequest, NextResponse } from 'next/server'
import { dbAdapter } from '@/lib/db-adapter'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const siswaId = searchParams.get('siswaId') || ''
    const status = searchParams.get('status') || ''
    const bulan = searchParams.get('bulan') || ''
    const tahun = searchParams.get('tahun') || ''

    const sppList = await dbAdapter.spp.findMany({
      siswaId: siswaId || undefined,
      status: status || undefined,
      bulan: bulan ? parseInt(bulan) : undefined,
      tahun: tahun ? parseInt(tahun) : undefined,
    })

    return NextResponse.json({
      success: true,
      data: sppList,
    })
  } catch (error) {
    console.error('Get SPP error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { siswaId, bulan, tahun, nominal, status } = body

    if (!siswaId || !bulan || !tahun || !nominal) {
      return NextResponse.json(
        { success: false, message: 'Semua field wajib diisi' },
        { status: 400 }
      )
    }

    // Check if siswa exists
    const siswa = await dbAdapter.siswa.findById(siswaId)
    if (!siswa) {
      return NextResponse.json(
        { success: false, message: 'Siswa tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check for duplicate SPP entry
    const existing = await dbAdapter.spp.findBySiswaBulanTahun(siswaId, parseInt(bulan), parseInt(tahun))
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'SPP untuk bulan dan tahun ini sudah ada' },
        { status: 400 }
      )
    }

    const spp = await dbAdapter.spp.create({
      siswaId,
      bulan: parseInt(bulan),
      tahun: parseInt(tahun),
      nominal: parseFloat(nominal),
      status: status || 'belum',
      tanggalBayar: status === 'lunas' ? new Date() : null,
    })

    return NextResponse.json({
      success: true,
      message: 'SPP berhasil ditambahkan',
      data: spp,
    })
  } catch (error) {
    console.error('Create SPP error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
