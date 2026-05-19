import { NextRequest, NextResponse } from 'next/server'
import { dbAdapter } from '@/lib/db-adapter'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await dbAdapter.pengeluaran.findById(id)
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Pengeluaran tidak ditemukan' },
        { status: 404 }
      )
    }

    const pengeluaran = await dbAdapter.pengeluaran.update(id, body)

    return NextResponse.json({
      success: true,
      message: 'Pengeluaran berhasil diperbarui',
      data: pengeluaran,
    })
  } catch (error) {
    console.error('Update pengeluaran error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await dbAdapter.pengeluaran.findById(id)
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Pengeluaran tidak ditemukan' },
        { status: 404 }
      )
    }

    await dbAdapter.pengeluaran.delete(id)

    return NextResponse.json({
      success: true,
      message: 'Pengeluaran berhasil dihapus',
    })
  } catch (error) {
    console.error('Delete pengeluaran error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
