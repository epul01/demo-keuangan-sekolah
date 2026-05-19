'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Pencil, Trash2, ChevronLeft, ChevronRight, CalendarIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { formatRupiah, formatDate } from '@/lib/format'

// Types
interface Pemasukan {
  id: string
  jenis: string
  nominal: number
  tanggal: string
  keterangan: string | null
}

// Constants
const JENIS_PEMASUKAN = [
  'SPP Bulanan',
  'Dana BOS',
  'Donasi',
  'Kegiatan Siswa',
  'Sumbangan',
  'Lain-lain',
]
const ITEMS_PER_PAGE = 10

export default function PemasukanPage() {
  const queryClient = useQueryClient()

  // Filters
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>()
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>()
  const [filterJenis, setFilterJenis] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [startPickerOpen, setStartPickerOpen] = useState(false)
  const [endPickerOpen, setEndPickerOpen] = useState(false)

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Pemasukan | null>(null)
  const [deletingItem, setDeletingItem] = useState<Pemasukan | null>(null)

  // Form
  const [formJenis, setFormJenis] = useState('')
  const [formNominal, setFormNominal] = useState('')
  const [formTanggal, setFormTanggal] = useState<Date | undefined>(new Date())
  const [formKeterangan, setFormKeterangan] = useState('')

  // Fetch data
  const { data: pemasukanData, isLoading } = useQuery({
    queryKey: ['pemasukan', filterJenis, filterStartDate, filterEndDate],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filterJenis) params.set('jenis', filterJenis)
      if (filterStartDate) params.set('startDate', filterStartDate.toISOString())
      if (filterEndDate) params.set('endDate', filterEndDate.toISOString())
      const res = await fetch(`/api/pemasukan?${params.toString()}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      return json.data as Pemasukan[]
    },
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: { jenis: string; nominal: string; tanggal: string; keterangan: string }) => {
      const res = await fetch('/api/pemasukan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pemasukan'] })
      toast.success('Pemasukan berhasil ditambahkan')
      resetForm()
      setDialogOpen(false)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/pemasukan/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pemasukan'] })
      toast.success('Pemasukan berhasil diperbarui')
      resetForm()
      setDialogOpen(false)
      setEditingItem(null)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/pemasukan/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pemasukan'] })
      toast.success('Pemasukan berhasil dihapus')
      setDeleteDialogOpen(false)
      setDeletingItem(null)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const resetForm = useCallback(() => {
    setFormJenis('')
    setFormNominal('')
    setFormTanggal(new Date())
    setFormKeterangan('')
  }, [])

  const openAddDialog = () => {
    setEditingItem(null)
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (item: Pemasukan) => {
    setEditingItem(item)
    setFormJenis(item.jenis)
    setFormNominal(String(item.nominal))
    setFormTanggal(new Date(item.tanggal))
    setFormKeterangan(item.keterangan || '')
    setDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!formJenis || !formNominal || !formTanggal) {
      toast.error('Jenis, nominal, dan tanggal wajib diisi')
      return
    }
    const payload = {
      jenis: formJenis,
      nominal: formNominal,
      tanggal: format(formTanggal, 'yyyy-MM-dd'),
      keterangan: formKeterangan,
    }
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (item: Pemasukan) => {
    setDeletingItem(item)
    setDeleteDialogOpen(true)
  }

  // Data & pagination
  const pemasukanList = pemasukanData || []
  const totalNominal = pemasukanList.reduce((sum, p) => sum + p.nominal, 0)
  const totalPages = Math.ceil(pemasukanList.length / ITEMS_PER_PAGE)
  const paginatedData = pemasukanList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">Kas Masuk</h2>
        <Button onClick={openAddDialog}>
          <Plus className="size-4" />
          Tambah Pemasukan
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Start date */}
            <div className="space-y-1.5">
              <Label>Dari Tanggal</Label>
              <Popover open={startPickerOpen} onOpenChange={setStartPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon className="size-4 mr-2" />
                    {filterStartDate ? format(filterStartDate, 'dd MMM yyyy') : 'Pilih tanggal'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filterStartDate}
                    onSelect={(d) => { setFilterStartDate(d); setStartPickerOpen(false); setCurrentPage(1) }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End date */}
            <div className="space-y-1.5">
              <Label>Sampai Tanggal</Label>
              <Popover open={endPickerOpen} onOpenChange={setEndPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon className="size-4 mr-2" />
                    {filterEndDate ? format(filterEndDate, 'dd MMM yyyy') : 'Pilih tanggal'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filterEndDate}
                    onSelect={(d) => { setFilterEndDate(d); setEndPickerOpen(false); setCurrentPage(1) }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Jenis filter */}
            <div className="space-y-1.5">
              <Label>Jenis Pemasukan</Label>
              <Select value={filterJenis} onValueChange={(v) => { setFilterJenis(v === 'semua' ? '' : v); setCurrentPage(1) }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Jenis</SelectItem>
                  {JENIS_PEMASUKAN.map(j => (
                    <SelectItem key={j} value={j}>{j}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jenis Pemasukan</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="text-right">Nominal</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Tidak ada data pemasukan
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                    <TableCell>{formatDate(item.tanggal)}</TableCell>
                    <TableCell className="font-medium">{item.jenis}</TableCell>
                    <TableCell className="text-muted-foreground">{item.keterangan || '-'}</TableCell>
                    <TableCell className="text-right font-medium">{formatRupiah(item.nominal)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(item)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(item)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {pemasukanList.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold">{formatRupiah(totalNominal)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            )}
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Halaman {currentPage} dari {totalPages} ({pemasukanList.length} data)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <ChevronLeft className="size-4" />
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Selanjutnya
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { resetForm(); setEditingItem(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Pemasukan' : 'Tambah Pemasukan'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Perbarui data pemasukan' : 'Tambahkan data pemasukan baru'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Jenis */}
            <div className="space-y-1.5">
              <Label>Jenis Pemasukan *</Label>
              <Select value={formJenis} onValueChange={setFormJenis}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih jenis" />
                </SelectTrigger>
                <SelectContent>
                  {JENIS_PEMASUKAN.map(j => (
                    <SelectItem key={j} value={j}>{j}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nominal */}
            <div className="space-y-1.5">
              <Label>Nominal (Rp) *</Label>
              <Input
                type="number"
                value={formNominal}
                onChange={(e) => setFormNominal(e.target.value)}
                placeholder="Masukkan nominal"
              />
            </div>

            {/* Tanggal */}
            <div className="space-y-1.5">
              <Label>Tanggal *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon className="size-4 mr-2" />
                    {formTanggal ? format(formTanggal, 'dd MMM yyyy') : 'Pilih tanggal'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formTanggal}
                    onSelect={setFormTanggal}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Keterangan */}
            <div className="space-y-1.5">
              <Label>Keterangan</Label>
              <Input
                value={formKeterangan}
                onChange={(e) => setFormKeterangan(e.target.value)}
                placeholder="Keterangan tambahan (opsional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); setEditingItem(null) }}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pemasukan</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingItem && (
                <span>
                  Apakah Anda yakin ingin menghapus pemasukan{' '}
                  <strong>{deletingItem.jenis}</strong> sebesar{' '}
                  <strong>{formatRupiah(deletingItem.nominal)}</strong>?
                  Tindakan ini tidak dapat dibatalkan.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingItem && deleteMutation.mutate(deletingItem.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
