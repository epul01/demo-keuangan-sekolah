import { NextRequest, NextResponse } from 'next/server'
import { dbAdapter } from '@/lib/db-adapter'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nama, nis, kelas, namaWali, nomorHP } = body

    const existing = await dbAdapter.siswa.findById(id)
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Siswa tidak ditemukan' },
        { status: 404 }
      )
    }

    // If NIS is being changed, check for duplicates
    if (nis && nis !== existing.nis) {
      const duplicate = await dbAdapter.siswa.findByNis(nis)
      if (duplicate) {
        return NextResponse.json(
          { success: false, message: 'NIS sudah digunakan' },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (nama !== undefined) updateData.nama = nama
    if (nis !== undefined) updateData.nis = nis
    if (kelas !== undefined) updateData.kelas = kelas
    if (namaWali !== undefined) updateData.namaWali = namaWali
    if (nomorHP !== undefined) updateData.nomorHP = nomorHP

    const siswa = await dbAdapter.siswa.update(id, updateData)

    return NextResponse.json({
      success: true,
      message: 'Siswa berhasil diperbarui',
      data: siswa,
    })
  } catch (error) {
    console.error('Update siswa error:', error)
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

    const existing = await dbAdapter.siswa.findById(id)
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Siswa tidak ditemukan' },
        { status: 404 }
      )
    }

    await dbAdapter.siswa.delete(id)

    return NextResponse.json({
      success: true,
      message: 'Siswa berhasil dihapus',
    })
  } catch (error) {
    console.error('Delete siswa error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
