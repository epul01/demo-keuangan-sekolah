'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  FileSpreadsheet, Printer, CalendarIcon,
  TrendingUp, TrendingDown, Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from '@/components/ui/table'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { formatRupiah, formatDate, formatMonth } from '@/lib/format'

// Types
interface Pemasukan {
  id: string
  jenis: string
  nominal: number
  tanggal: string
  keterangan: string | null
}

interface Pengeluaran {
  id: string
  jenis: string
  nominal: number
  tanggal: string
  keterangan: string | null
}

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

type CombinedItem = {
  id: string
  tanggal: string
  jenis: string
  keterangan: string | null
  nominal: number
  tipe: 'pemasukan' | 'pengeluaran' | 'spp'
}

export default function LaporanPage() {
  // Filters
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>()
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>()
  const [reportType, setReportType] = useState('semua')
  const [startPickerOpen, setStartPickerOpen] = useState(false)
  const [endPickerOpen, setEndPickerOpen] = useState(false)

  // Fetch pemasukan
  const { data: pemasukanData, isLoading: pemasukanLoading } = useQuery({
    queryKey: ['pemasukan-report', filterStartDate, filterEndDate],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filterStartDate) params.set('startDate', filterStartDate.toISOString())
      if (filterEndDate) params.set('endDate', filterEndDate.toISOString())
      const res = await fetch(`/api/pemasukan?${params.toString()}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      return json.data as Pemasukan[]
    },
  })

  // Fetch pengeluaran
  const { data: pengeluaranData, isLoading: pengeluaranLoading } = useQuery({
    queryKey: ['pengeluaran-report', filterStartDate, filterEndDate],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filterStartDate) params.set('startDate', filterStartDate.toISOString())
      if (filterEndDate) params.set('endDate', filterEndDate.toISOString())
      const res = await fetch(`/api/pengeluaran?${params.toString()}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      return json.data as Pengeluaran[]
    },
  })

  // Fetch SPP
  const { data: sppData, isLoading: sppLoading } = useQuery({
    queryKey: ['spp-report', filterStartDate, filterEndDate],
    queryFn: async () => {
      const res = await fetch('/api/spp')
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      return json.data as SPP[]
    },
  })

  const pemasukanList = pemasukanData || []
  const pengeluaranList = pengeluaranData || []
  const sppList = sppData || []

  // Filter SPP by date range if needed (SPP API doesn't support date range directly)
  const filteredSppList = useMemo(() => {
    if (!filterStartDate && !filterEndDate) return sppList
    return sppList.filter(spp => {
      const sppDate = spp.tanggalBayar ? new Date(spp.tanggalBayar) : null
      if (!sppDate) return false
      if (filterStartDate && sppDate < filterStartDate) return false
      if (filterEndDate && sppDate > filterEndDate) return false
      return true
    })
  }, [sppList, filterStartDate, filterEndDate])

  // Summary calculations
  const totalPemasukan = useMemo(() => {
    const pemasukanTotal = pemasukanList.reduce((sum, p) => sum + p.nominal, 0)
    const sppLunasTotal = filteredSppList
      .filter(s => s.status === 'lunas')
      .reduce((sum, s) => sum + s.nominal, 0)
    return pemasukanTotal + sppLunasTotal
  }, [pemasukanList, filteredSppList])

  const totalPengeluaran = useMemo(() => {
    return pengeluaranList.reduce((sum, p) => sum + p.nominal, 0)
  }, [pengeluaranList])

  const saldo = totalPemasukan - totalPengeluaran

  // Combined data for "Semua" tab
  const combinedData = useMemo(() => {
    const items: CombinedItem[] = []
    pemasukanList.forEach(p => {
      items.push({
        id: p.id,
        tanggal: p.tanggal,
        jenis: p.jenis,
        keterangan: p.keterangan,
        nominal: p.nominal,
        tipe: 'pemasukan',
      })
    })
    pengeluaranList.forEach(p => {
      items.push({
        id: p.id,
        tanggal: p.tanggal,
        jenis: p.jenis,
        keterangan: p.keterangan,
        nominal: p.nominal,
        tipe: 'pengeluaran',
      })
    })
    filteredSppList.filter(s => s.status === 'lunas').forEach(s => {
      items.push({
        id: s.id,
        tanggal: s.tanggalBayar || '',
        jenis: `SPP - ${s.siswa.nama}`,
        keterangan: `${formatMonth(s.bulan)} ${s.tahun}`,
        nominal: s.nominal,
        tipe: 'spp',
      })
    })
    return items.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
  }, [pemasukanList, pengeluaranList, filteredSppList])

  // Export CSV
  const exportCSV = useCallback(() => {
    try {
      let csvContent = ''

      if (reportType === 'semua') {
        csvContent = 'Tanggal,Jenis,Tipe,Keterangan,Nominal\n'
        combinedData.forEach(item => {
          csvContent += `"${formatDate(item.tanggal)}","${item.jenis}","${item.tipe === 'pemasukan' || item.tipe === 'spp' ? 'Pemasukan' : 'Pengeluaran'}","${item.keterangan || '-'}","${item.nominal}"\n`
        })
      } else if (reportType === 'pemasukan') {
        csvContent = 'Tanggal,Jenis Pemasukan,Keterangan,Nominal\n'
        pemasukanList.forEach(item => {
          csvContent += `"${formatDate(item.tanggal)}","${item.jenis}","${item.keterangan || '-'}","${item.nominal}"\n`
        })
      } else if (reportType === 'pengeluaran') {
        csvContent = 'Tanggal,Jenis Pengeluaran,Keterangan,Nominal\n'
        pengeluaranList.forEach(item => {
          csvContent += `"${formatDate(item.tanggal)}","${item.jenis}","${item.keterangan || '-'}","${item.nominal}"\n`
        })
      } else if (reportType === 'spp') {
        csvContent = 'Nama Siswa,NIS,Bulan,Tahun,Nominal,Status,Tanggal Bayar\n'
        filteredSppList.forEach(item => {
          csvContent += `"${item.siswa.nama}","${item.siswa.nis}","${formatMonth(item.bulan)}","${item.tahun}","${item.nominal}","${item.status === 'lunas' ? 'Lunas' : 'Belum Bayar'}","${item.tanggalBayar ? formatDate(item.tanggalBayar) : '-'}"\n`
        })
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `laporan-keuangan-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('File CSV berhasil diunduh')
    } catch {
      toast.error('Gagal mengunduh file CSV')
    }
  }, [reportType, combinedData, pemasukanList, pengeluaranList, filteredSppList])

  // Print
  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const isLoading = pemasukanLoading || pengeluaranLoading || sppLoading

  return (
    <div className="space-y-4 print-area" id="laporan-print-area">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">Laporan Keuangan</h2>
        <div className="flex gap-2 no-print">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <FileSpreadsheet className="size-4" />
            Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="size-4" />
            Cetak
          </Button>
        </div>
      </div>

      {/* Print header - only visible when printing */}
      <div className="hidden print:block print:mb-6">
        <h1 className="text-2xl font-bold text-center">LAPORAN KEUANGAN</h1>
        <h2 className="text-lg text-center">SD Negeri 1 Contoh</h2>
        <p className="text-center text-sm mt-2">
          Periode: {filterStartDate ? format(filterStartDate, 'dd MMM yyyy') : 'Awal'} - {filterEndDate ? format(filterEndDate, 'dd MMM yyyy') : 'Sekarang'}
        </p>
      </div>

      {/* Filters */}
      <Card className="no-print">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    onSelect={(d) => { setFilterStartDate(d); setStartPickerOpen(false) }}
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
                    onSelect={(d) => { setFilterEndDate(d); setEndPickerOpen(false) }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="size-4 text-green-600" />
              Total Pemasukan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatRupiah(totalPemasukan)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="size-4 text-red-600" />
              Total Pengeluaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatRupiah(totalPengeluaran)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="size-4 text-primary" />
              Saldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatRupiah(saldo)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Type Tabs & Detail Table */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={reportType} onValueChange={setReportType}>
            <TabsList className="no-print mb-4">
              <TabsTrigger value="semua">Semua</TabsTrigger>
              <TabsTrigger value="pemasukan">Pemasukan</TabsTrigger>
              <TabsTrigger value="pengeluaran">Pengeluaran</TabsTrigger>
              <TabsTrigger value="spp">SPP</TabsTrigger>
            </TabsList>

            {/* Semua Tab */}
            <TabsContent value="semua">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : combinedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    combinedData.map((item, index) => (
                      <TableRow key={`${item.tipe}-${item.id}`}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{formatDate(item.tanggal)}</TableCell>
                        <TableCell className="font-medium">{item.jenis}</TableCell>
                        <TableCell>
                          {item.tipe === 'pemasukan' || item.tipe === 'spp' ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Pemasukan</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Pengeluaran</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.keterangan || '-'}</TableCell>
                        <TableCell className={`text-right font-medium ${item.tipe === 'pengeluaran' ? 'text-red-600' : 'text-green-600'}`}>
                          {item.tipe === 'pengeluaran' ? '-' : ''}{formatRupiah(item.nominal)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {combinedData.length > 0 && (
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={5} className="font-bold">Total Pemasukan</TableCell>
                      <TableCell className="text-right font-bold text-green-600">{formatRupiah(totalPemasukan)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={5} className="font-bold">Total Pengeluaran</TableCell>
                      <TableCell className="text-right font-bold text-red-600">{formatRupiah(totalPengeluaran)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={5} className="font-bold">Saldo</TableCell>
                      <TableCell className={`text-right font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatRupiah(saldo)}</TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </TabsContent>

            {/* Pemasukan Tab */}
            <TabsContent value="pemasukan">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Jenis Pemasukan</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : pemasukanList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Tidak ada data pemasukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    pemasukanList.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{formatDate(item.tanggal)}</TableCell>
                        <TableCell className="font-medium">{item.jenis}</TableCell>
                        <TableCell className="text-muted-foreground">{item.keterangan || '-'}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">{formatRupiah(item.nominal)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {pemasukanList.length > 0 && (
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={4} className="font-bold">Total Pemasukan</TableCell>
                      <TableCell className="text-right font-bold">{formatRupiah(pemasukanList.reduce((s, p) => s + p.nominal, 0))}</TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </TabsContent>

            {/* Pengeluaran Tab */}
            <TabsContent value="pengeluaran">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Jenis Pengeluaran</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : pengeluaranList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Tidak ada data pengeluaran
                      </TableCell>
                    </TableRow>
                  ) : (
                    pengeluaranList.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{formatDate(item.tanggal)}</TableCell>
                        <TableCell className="font-medium">{item.jenis}</TableCell>
                        <TableCell className="text-muted-foreground">{item.keterangan || '-'}</TableCell>
                        <TableCell className="text-right font-medium text-red-600">{formatRupiah(item.nominal)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {pengeluaranList.length > 0 && (
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={4} className="font-bold">Total Pengeluaran</TableCell>
                      <TableCell className="text-right font-bold">{formatRupiah(pengeluaranList.reduce((s, p) => s + p.nominal, 0))}</TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </TabsContent>

            {/* SPP Tab */}
            <TabsContent value="spp">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead>Bulan</TableHead>
                    <TableHead>Tahun</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal Bayar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : filteredSppList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Tidak ada data SPP
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSppList.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.siswa.nama}</TableCell>
                        <TableCell>{formatMonth(item.bulan)}</TableCell>
                        <TableCell>{item.tahun}</TableCell>
                        <TableCell className="text-right font-medium">{formatRupiah(item.nominal)}</TableCell>
                        <TableCell>
                          {item.status === 'lunas' ? (
                            <Badge className="bg-green-600 text-white hover:bg-green-700">Lunas</Badge>
                          ) : (
                            <Badge variant="destructive">Belum Bayar</Badge>
                          )}
                        </TableCell>
                        <TableCell>{item.tanggalBayar ? formatDate(item.tanggalBayar) : '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {filteredSppList.length > 0 && (
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={4} className="font-bold">Total SPP Lunas</TableCell>
                      <TableCell className="text-right font-bold">
                        {formatRupiah(filteredSppList.filter(s => s.status === 'lunas').reduce((s, p) => s + p.nominal, 0))}
                      </TableCell>
                      <TableCell colSpan={2} />
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
