'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

// Types
interface Siswa {
  id: string
  nama: string
  nis: string
  kelas: string
  namaWali: string
  nomorHP: string
  createdAt: string
  updatedAt: string
}

// Constants
const KELAS_OPTIONS = ['7A', '7B', '8A', '8B', '9A', '9B']
const ITEMS_PER_PAGE = 10

// Zod Schema
const siswaSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi'),
  nis: z
    .string()
    .min(1, 'NIS wajib diisi')
    .regex(/^[0-9]+$/, 'NIS harus berupa angka'),
  kelas: z.string().min(1, 'Kelas wajib dipilih'),
  namaWali: z.string().min(1, 'Nama wali wajib diisi'),
  nomorHP: z
    .string()
    .min(1, 'No HP wajib diisi')
    .regex(/^[0-9+\-() ]+$/, 'Format No HP tidak valid'),
})

type SiswaFormData = z.infer<typeof siswaSchema>

export default function SiswaPage() {
  const queryClient = useQueryClient()

  // State
  const [search, setSearch] = useState('')
  const [kelasFilter, setKelasFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null)

  // Form
  const addForm = useForm<SiswaFormData>({
    resolver: zodResolver(siswaSchema),
    defaultValues: {
      nama: '',
      nis: '',
      kelas: '',
      namaWali: '',
      nomorHP: '',
    },
  })

  const editForm = useForm<SiswaFormData>({
    resolver: zodResolver(siswaSchema),
    defaultValues: {
      nama: '',
      nis: '',
      kelas: '',
      namaWali: '',
      nomorHP: '',
    },
  })

  // Query
  const { data, isLoading } = useQuery<{
    success: boolean
    data: Siswa[]
  }>({
    queryKey: ['siswa', search, kelasFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (kelasFilter) params.set('kelas', kelasFilter)
      return fetch(`/api/siswa?${params.toString()}`).then((res) =>
        res.json()
      )
    },
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (formData: SiswaFormData) =>
      fetch('/api/siswa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      }).then((res) => res.json()),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Siswa berhasil ditambahkan')
        queryClient.invalidateQueries({ queryKey: ['siswa'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        setAddDialogOpen(false)
        addForm.reset()
      } else {
        toast.error(result.message || 'Gagal menambahkan siswa')
      }
    },
    onError: () => {
      toast.error('Terjadi kesalahan saat menambahkan siswa')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data: formData }: { id: string; data: SiswaFormData }) =>
      fetch(`/api/siswa/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      }).then((res) => res.json()),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Siswa berhasil diperbarui')
        queryClient.invalidateQueries({ queryKey: ['siswa'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        setEditDialogOpen(false)
        setSelectedSiswa(null)
        editForm.reset()
      } else {
        toast.error(result.message || 'Gagal memperbarui siswa')
      }
    },
    onError: () => {
      toast.error('Terjadi kesalahan saat memperbarui siswa')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/siswa/${id}`, { method: 'DELETE' }).then((res) =>
        res.json()
      ),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Siswa berhasil dihapus')
        queryClient.invalidateQueries({ queryKey: ['siswa'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        setDeleteDialogOpen(false)
        setSelectedSiswa(null)
      } else {
        toast.error(result.message || 'Gagal menghapus siswa')
      }
    },
    onError: () => {
      toast.error('Terjadi kesalahan saat menghapus siswa')
    },
  })

  // Handlers
  const handleAdd = useCallback(
    (formData: SiswaFormData) => {
      createMutation.mutate(formData)
    },
    [createMutation]
  )

  const handleEdit = useCallback(
    (formData: SiswaFormData) => {
      if (selectedSiswa) {
        updateMutation.mutate({ id: selectedSiswa.id, data: formData })
      }
    },
    [selectedSiswa, updateMutation]
  )

  const handleDelete = useCallback(() => {
    if (selectedSiswa) {
      deleteMutation.mutate(selectedSiswa.id)
    }
  }, [selectedSiswa, deleteMutation])

  const openEditDialog = useCallback(
    (siswa: Siswa) => {
      setSelectedSiswa(siswa)
      editForm.reset({
        nama: siswa.nama,
        nis: siswa.nis,
        kelas: siswa.kelas,
        namaWali: siswa.namaWali,
        nomorHP: siswa.nomorHP,
      })
      setEditDialogOpen(true)
    },
    [editForm]
  )

  const openDeleteDialog = useCallback((siswa: Siswa) => {
    setSelectedSiswa(siswa)
    setDeleteDialogOpen(true)
  }, [])

  // Pagination
  const siswaList = data?.data || []
  const totalPages = Math.max(1, Math.ceil(siswaList.length / ITEMS_PER_PAGE))
  const paginatedSiswa = siswaList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold">Data Siswa</h2>
        <Button
          onClick={() => {
            addForm.reset()
            setAddDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Siswa
        </Button>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau NIS..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={kelasFilter}
              onValueChange={(value) => {
                setKelasFilter(value === 'all' ? '' : value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Semua Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {KELAS_OPTIONS.map((kelas) => (
                  <SelectItem key={kelas} value={kelas}>
                    Kelas {kelas}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>NIS</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead className="hidden md:table-cell">
                  Nama Wali
                </TableHead>
                <TableHead className="hidden sm:table-cell">No HP</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedSiswa.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    {search || kelasFilter
                      ? 'Tidak ada siswa yang sesuai filter'
                      : 'Belum ada data siswa'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSiswa.map((siswa, index) => (
                  <TableRow key={siswa.id}>
                    <TableCell>{startIndex + index + 1}</TableCell>
                    <TableCell className="font-medium">{siswa.nama}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{siswa.nis}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{siswa.kelas}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {siswa.namaWali}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {siswa.nomorHP}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(siswa)}
                          title="Edit siswa"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(siswa)}
                          title="Hapus siswa"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {startIndex + 1}-
            {Math.min(startIndex + ITEMS_PER_PAGE, siswaList.length)} dari{' '}
            {siswaList.length} siswa
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setCurrentPage(page)}
                  className="h-9 w-9"
                >
                  {page}
                </Button>
              )
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Siswa</DialogTitle>
            <DialogDescription>
              Masukkan data siswa baru ke dalam sistem.
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAdd)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama lengkap siswa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="nis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIS</FormLabel>
                    <FormControl>
                      <Input placeholder="Nomor Induk Siswa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="kelas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kelas</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kelas" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {KELAS_OPTIONS.map((kelas) => (
                          <SelectItem key={kelas} value={kelas}>
                            Kelas {kelas}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="namaWali"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Wali</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama orang tua/wali" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="nomorHP"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No HP</FormLabel>
                    <FormControl>
                      <Input placeholder="Nomor HP wali" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAddDialogOpen(false)
                    addForm.reset()
                  }}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Siswa</DialogTitle>
            <DialogDescription>
              Perbarui data siswa dalam sistem.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama lengkap siswa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="nis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIS</FormLabel>
                    <FormControl>
                      <Input placeholder="Nomor Induk Siswa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="kelas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kelas</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kelas" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {KELAS_OPTIONS.map((kelas) => (
                          <SelectItem key={kelas} value={kelas}>
                            Kelas {kelas}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="namaWali"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Wali</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama orang tua/wali" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="nomorHP"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No HP</FormLabel>
                    <FormControl>
                      <Input placeholder="Nomor HP wali" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false)
                    setSelectedSiswa(null)
                    editForm.reset()
                  }}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Menyimpan...' : 'Perbarui'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Siswa</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus siswa{' '}
              <strong>{selectedSiswa?.nama}</strong>? Tindakan ini tidak dapat
              dibatalkan dan semua data SPP terkait juga akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false)
                setSelectedSiswa(null)
              }}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
