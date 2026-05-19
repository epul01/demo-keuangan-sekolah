'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Search, CreditCard, Printer, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
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
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { formatRupiah, formatDate, formatMonth } from '@/lib/format'

// Types
interface Siswa {
  id: string
  nama: string
  nis: string
  kelas: string
}

interface SPP {
  id: string
  siswaId: string
  bulan: number
  tahun: number
  nominal: number
  status: string
  tanggalBayar: string | null
  siswa: Siswa
}

// Constants
const BULAN_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1)
const CURRENT_YEAR = new Date().getFullYear()
const TAHUN_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i)
const ITEMS_PER_PAGE = 10

export default function SppPage() {
  const queryClient = useQueryClient()

  // Filters
  const [filterSiswaId, setFilterSiswaId] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterBulan, setFilterBulan] = useState('')
  const [filterTahun, setFilterTahun] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [selectedSpp, setSelectedSpp] = useState<SPP | null>(null)
  const [siswaSearchOpen, setSiswaSearchOpen] = useState(false)

  // Add form
  const [formSiswaId, setFormSiswaId] = useState('')
  const [formBulan, setFormBulan] = useState('')
  const [formTahun, setFormTahun] = useState(String(CURRENT_YEAR))
  const [formNominal, setFormNominal] = useState('350000')

  // Fetch SPP data
  const { data: sppData, isLoading: sppLoading } = useQuery({
    queryKey: ['spp', filterSiswaId, filterStatus, filterBulan, filterTahun],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filterSiswaId) params.set('siswaId', filterSiswaId)
      if (filterStatus) params.set('status', filterStatus)
      if (filterBulan) params.set('bulan', filterBulan)
      if (filterTahun) params.set('tahun', filterTahun)
      const res = await fetch(`/api/spp?${params.toString()}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      return json.data as SPP[]
    },
  })

  // Fetch siswa list for dropdown
  const { data: siswaData } = useQuery({
    queryKey: ['siswa-list'],
    queryFn: async () => {
      const res = await fetch('/api/siswa')
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      return json.data as Siswa[]
    },
  })

  // Create SPP mutation
  const createMutation = useMutation({
    mutationFn: async (data: {
      siswaId: string; bulan: string; tahun: string; nominal: string
    }) => {
      const res = await fetch('/api/spp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spp'] })
      toast.success('SPP berhasil ditambahkan')
      resetForm()
      setAddDialogOpen(false)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Pay SPP mutation
  const payMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/spp/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'lunas' }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spp'] })
      toast.success('Pembayaran berhasil dicatat')
      setPayDialogOpen(false)
      setSelectedSpp(null)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const resetForm = useCallback(() => {
    setFormSiswaId('')
    setFormBulan('')
    setFormTahun(String(CURRENT_YEAR))
    setFormNominal('350000')
  }, [])

  const handleAddSubmit = () => {
    if (!formSiswaId || !formBulan || !formTahun || !formNominal) {
      toast.error('Semua field wajib diisi')
      return
    }
    createMutation.mutate({
      siswaId: formSiswaId,
      bulan: formBulan,
      tahun: formTahun,
      nominal: formNominal,
    })
  }

  const handlePay = (spp: SPP) => {
    setSelectedSpp(spp)
    setPayDialogOpen(true)
  }

  const handlePrint = (spp: SPP) => {
    const printContent = `
      <html>
        <head>
          <title>Kwitansi Pembayaran SPP</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 16px; margin-bottom: 24px; }
            .header h1 { margin: 0; font-size: 20px; }
            .header p { margin: 4px 0 0; color: #555; }
            .receipt { max-width: 500px; margin: 0 auto; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .label { font-weight: bold; }
            .amount { text-align: center; font-size: 20px; font-weight: bold; margin: 24px 0; padding: 12px; border: 2px solid #000; }
            .signature { margin-top: 48px; text-align: right; }
            .signature-line { width: 200px; border-top: 1px solid #000; margin-top: 60px; margin-left: auto; padding-top: 4px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>SD Negeri 1 Contoh</h1>
              <p>Kwitansi Pembayaran SPP</p>
            </div>
            <div class="row"><span class="label">Nama Siswa</span><span>${spp.siswa.nama}</span></div>
            <div class="row"><span class="label">NIS</span><span>${spp.siswa.nis}</span></div>
            <div class="row"><span class="label">Bulan</span><span>${formatMonth(spp.bulan)}</span></div>
            <div class="row"><span class="label">Tahun</span><span>${spp.tahun}</span></div>
            <div class="row"><span class="label">Tanggal Bayar</span><span>${spp.tanggalBayar ? formatDate(spp.tanggalBayar) : '-'}</span></div>
            <div class="amount">${formatRupiah(spp.nominal)}</div>
            <div class="signature">
              <p>Admin,</p>
              <div class="signature-line">(..........................)</div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
    }
  }

  // Pagination
  const sppList = sppData || []
  const totalPages = Math.ceil(sppList.length / ITEMS_PER_PAGE)
  const paginatedData = sppList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const selectedSiswaName = siswaData?.find(s => s.id === formSiswaId)?.nama || ''

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">Pembayaran SPP</h2>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="size-4" />
          Tambah Pembayaran
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Siswa filter - searchable */}
            <div className="space-y-1.5">
              <Label>Siswa</Label>
              <Popover open={siswaSearchOpen} onOpenChange={setSiswaSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start font-normal"
                  >
                    <Search className="size-4 mr-2 shrink-0 opacity-50" />
                    {filterSiswaId
                      ? siswaData?.find(s => s.id === filterSiswaId)?.nama || 'Pilih siswa...'
                      : 'Pilih siswa...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Cari siswa..." />
                    <CommandList>
                      <CommandEmpty>Siswa tidak ditemukan</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="semua"
                          onSelect={() => {
                            setFilterSiswaId('')
                            setSiswaSearchOpen(false)
                            setCurrentPage(1)
                          }}
                        >
                          Semua Siswa
                        </CommandItem>
                        {siswaData?.map(siswa => (
                          <CommandItem
                            key={siswa.id}
                            value={`${siswa.nama} ${siswa.nis}`}
                            onSelect={() => {
                              setFilterSiswaId(siswa.id)
                              setSiswaSearchOpen(false)
                              setCurrentPage(1)
                            }}
                          >
                            {siswa.nama} - {siswa.nis}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Status filter */}
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v === 'semua' ? '' : v); setCurrentPage(1) }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Status</SelectItem>
                  <SelectItem value="lunas">Lunas</SelectItem>
                  <SelectItem value="belum">Belum Bayar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulan filter */}
            <div className="space-y-1.5">
              <Label>Bulan</Label>
              <Select value={filterBulan} onValueChange={(v) => { setFilterBulan(v === 'semua' ? '' : v); setCurrentPage(1) }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua Bulan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Bulan</SelectItem>
                  {BULAN_OPTIONS.map(b => (
                    <SelectItem key={b} value={String(b)}>{formatMonth(b)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tahun filter */}
            <div className="space-y-1.5">
              <Label>Tahun</Label>
              <Select value={filterTahun} onValueChange={(v) => { setFilterTahun(v === 'semua' ? '' : v); setCurrentPage(1) }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua Tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Tahun</SelectItem>
                  {TAHUN_OPTIONS.map(t => (
                    <SelectItem key={t} value={String(t)}>{t}</SelectItem>
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
                <TableHead>Nama Siswa</TableHead>
                <TableHead>NIS</TableHead>
                <TableHead>Bulan</TableHead>
                <TableHead>Tahun</TableHead>
                <TableHead>Nominal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal Bayar</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sppLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Tidak ada data SPP
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((spp, index) => (
                  <TableRow key={spp.id}>
                    <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                    <TableCell className="font-medium">{spp.siswa.nama}</TableCell>
                    <TableCell>{spp.siswa.nis}</TableCell>
                    <TableCell>{formatMonth(spp.bulan)}</TableCell>
                    <TableCell>{spp.tahun}</TableCell>
                    <TableCell>{formatRupiah(spp.nominal)}</TableCell>
                    <TableCell>
                      {spp.status === 'lunas' ? (
                        <Badge className="bg-green-600 text-white hover:bg-green-700">Lunas</Badge>
                      ) : (
                        <Badge variant="destructive">Belum Bayar</Badge>
                      )}
                    </TableCell>
                    <TableCell>{spp.tanggalBayar ? formatDate(spp.tanggalBayar) : '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {spp.status === 'belum' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePay(spp)}
                          >
                            <CreditCard className="size-3.5" />
                            Bayar
                          </Button>
                        )}
                        {spp.status === 'lunas' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrint(spp)}
                          >
                            <Printer className="size-3.5" />
                            Cetak
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Halaman {currentPage} dari {totalPages} ({sppList.length} data)
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

      {/* Add Payment Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pembayaran SPP</DialogTitle>
            <DialogDescription>Tambahkan data pembayaran SPP baru</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Select Siswa */}
            <div className="space-y-1.5">
              <Label>Siswa *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <Search className="size-4 mr-2 shrink-0 opacity-50" />
                    {formSiswaId ? selectedSiswaName : 'Pilih siswa...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Cari siswa..." />
                    <CommandList>
                      <CommandEmpty>Siswa tidak ditemukan</CommandEmpty>
                      <CommandGroup>
                        {siswaData?.map(siswa => (
                          <CommandItem
                            key={siswa.id}
                            value={`${siswa.nama} ${siswa.nis}`}
                            onSelect={() => setFormSiswaId(siswa.id)}
                          >
                            {siswa.nama} - {siswa.nis}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Bulan */}
            <div className="space-y-1.5">
              <Label>Bulan *</Label>
              <Select value={formBulan} onValueChange={setFormBulan}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
                  {BULAN_OPTIONS.map(b => (
                    <SelectItem key={b} value={String(b)}>{formatMonth(b)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tahun */}
            <div className="space-y-1.5">
              <Label>Tahun *</Label>
              <Select value={formTahun} onValueChange={setFormTahun}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih tahun" />
                </SelectTrigger>
                <SelectContent>
                  {TAHUN_OPTIONS.map(t => (
                    <SelectItem key={t} value={String(t)}>{t}</SelectItem>
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
                placeholder="350000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddDialogOpen(false); resetForm() }}>
              Batal
            </Button>
            <Button onClick={handleAddSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Confirmation Dialog */}
      <AlertDialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pembayaran</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedSpp && (
                <span>
                  Apakah Anda yakin ingin mencatat pembayaran SPP atas nama{' '}
                  <strong>{selectedSpp.siswa.nama}</strong> untuk bulan{' '}
                  <strong>{formatMonth(selectedSpp.bulan)} {selectedSpp.tahun}</strong>{' '}
                  sebesar <strong>{formatRupiah(selectedSpp.nominal)}</strong>?
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedSpp && payMutation.mutate(selectedSpp.id)}
              disabled={payMutation.isPending}
            >
              {payMutation.isPending ? 'Memproses...' : 'Ya, Bayar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
