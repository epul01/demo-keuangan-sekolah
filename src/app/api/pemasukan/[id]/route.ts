import { NextRequest, NextResponse } from 'next/server'
import { dbAdapter } from '@/lib/db-adapter'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await dbAdapter.pemasukan.findById(id)
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Pemasukan tidak ditemukan' },
        { status: 404 }
      )
    }

    const pemasukan = await dbAdapter.pemasukan.update(id, body)

    return NextResponse.json({
      success: true,
      message: 'Pemasukan berhasil diperbarui',
      data: pemasukan,
    })
  } catch (error) {
    console.error('Update pemasukan error:', error)
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

    const existing = await dbAdapter.pemasukan.findById(id)
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Pemasukan tidak ditemukan' },
        { status: 404 }
      )
    }

    await dbAdapter.pemasukan.delete(id)

    return NextResponse.json({
      success: true,
      message: 'Pemasukan berhasil dihapus',
    })
  } catch (error) {
    console.error('Delete pemasukan error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
