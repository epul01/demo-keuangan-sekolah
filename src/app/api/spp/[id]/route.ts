import { NextRequest, NextResponse } from 'next/server'
import { dbAdapter } from '@/lib/db-adapter'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { bulan, tahun, nominal, status, tanggalBayar } = body

    const existing = await dbAdapter.spp.findById(id)
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'SPP tidak ditemukan' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (bulan !== undefined) updateData.bulan = parseInt(bulan)
    if (tahun !== undefined) updateData.tahun = parseInt(tahun)
    if (nominal !== undefined) updateData.nominal = parseFloat(nominal)
    if (status !== undefined) updateData.status = status

    // Auto-set tanggalBayar when marking as paid
    if (status === 'lunas' && !tanggalBayar) {
      updateData.tanggalBayar = new Date().toISOString()
    } else if (tanggalBayar) {
      updateData.tanggalBayar = new Date(tanggalBayar).toISOString()
    } else if (status === 'belum') {
      updateData.tanggalBayar = null
    }

    const spp = await dbAdapter.spp.update(id, updateData)

    return NextResponse.json({
      success: true,
      message: 'SPP berhasil diperbarui',
      data: spp,
    })
  } catch (error) {
    console.error('Update SPP error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
