'use client'

import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { formatRupiah, formatDate } from '@/lib/format'

interface DashboardData {
  totalPemasukan: number
  totalPengeluaran: number
  saldo: number
  jumlahSiswa: number
  sppStats: {
    totalSPPLunas: number
    totalSPPPending: number
    jumlahSPPLunas: number
    jumlahSPPBelum: number
  }
  monthlyData: Array<{
    bulan: string
    bulanIndex: number
    tahun: number
    pemasukan: number
    pengeluaran: number
  }>
  recentTransactions: Array<{
    id: string
    jenis: string
    nominal: number
    tanggal: string
    keterangan: string | null
    tipe: 'pemasukan' | 'pengeluaran'
    createdAt: string
  }>
}

const chartConfig = {
  pemasukan: {
    label: 'Pemasukan',
    color: '#22c55e',
  },
  pengeluaran: {
    label: 'Pengeluaran',
    color: '#ef4444',
  },
} satisfies ChartConfig

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<{
    success: boolean
    data: DashboardData
  }>({
    queryKey: ['dashboard'],
    queryFn: () => fetch('/api/dashboard').then((res) => res.json()),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 w-20 rounded bg-muted" />
                      <div className="h-5 w-28 rounded bg-muted" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse h-64 rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !data?.data) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">
            Gagal memuat data dashboard. Silakan coba lagi.
          </p>
        </CardContent>
      </Card>
    )
  }

  const dashboard = data.data

  const statCards = [
    {
      title: 'Total Pemasukan',
      value: formatRupiah(dashboard.totalPemasukan),
      icon: TrendingUp,
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Total Pengeluaran',
      value: formatRupiah(dashboard.totalPengeluaran),
      icon: TrendingDown,
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    {
      title: 'Saldo Akhir',
      value: formatRupiah(dashboard.saldo),
      icon: Wallet,
      iconBg: 'bg-sky-100 dark:bg-sky-900/30',
      iconColor: 'text-sky-600 dark:text-sky-400',
    },
    {
      title: 'Jumlah Siswa',
      value: dashboard.jumlahSiswa.toString(),
      icon: Users,
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${card.iconBg}`}
                >
                  <card.icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="truncate text-xl font-bold">{card.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Section */}
      <Card>
        <CardHeader>
          <CardTitle>Pemasukan vs Pengeluaran per Bulan</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <BarChart data={dashboard.monthlyData} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="bulan"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: string) => value.substring(0, 3)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) =>
                  value >= 1000000
                    ? `${(value / 1000000).toFixed(1)}jt`
                    : value >= 1000
                      ? `${(value / 1000).toFixed(0)}rb`
                      : String(value)
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-muted-foreground text-xs">
                          {name === 'pemasukan'
                            ? 'Pemasukan'
                            : 'Pengeluaran'}
                        </span>
                        <span className="font-mono font-medium">
                          {formatRupiah(Number(value))}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar
                dataKey="pemasukan"
                fill="var(--color-pemasukan)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="pengeluaran"
                fill="var(--color-pengeluaran)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* SPP Stats Section */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">SPP Lunas</p>
                <p className="text-xl font-bold">
                  {formatRupiah(dashboard.sppStats.totalSPPLunas)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {dashboard.sppStats.jumlahSPPLunas} pembayaran
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">SPP Belum Bayar</p>
                <p className="text-xl font-bold">
                  {formatRupiah(dashboard.sppStats.totalSPPPending)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {dashboard.sppStats.jumlahSPPBelum} pembayaran
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transaksi Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="text-right">Nominal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboard.recentTransactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground"
                  >
                    Belum ada transaksi
                  </TableCell>
                </TableRow>
              ) : (
                dashboard.recentTransactions.map((tx) => (
                  <TableRow key={`${tx.tipe}-${tx.id}`}>
                    <TableCell className="text-sm">
                      {formatDate(tx.tanggal)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tx.tipe === 'pemasukan' ? 'default' : 'destructive'
                        }
                      >
                        {tx.tipe === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {tx.keterangan || tx.jenis}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        tx.tipe === 'pemasukan'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {tx.tipe === 'pemasukan' ? '+' : '-'}
                      {formatRupiah(tx.nominal)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
