const BULAN_INDONESIA = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

const BULAN_SINGKAT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]

export function formatRupiah(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString('id-ID')
  const prefix = amount < 0 ? '-Rp ' : 'Rp '
  return `${prefix}${formatted}`
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const day = d.getDate().toString().padStart(2, '0')
  const month = BULAN_SINGKAT[d.getMonth()]
  const year = d.getFullYear()
  return `${day} ${month} ${year}`
}

export function formatMonth(month: number): string {
  if (month < 1 || month > 12) return ''
  return BULAN_INDONESIA[month - 1]
}

export function getMonthName(month: number): string {
  if (month < 0 || month > 11) return ''
  return BULAN_INDONESIA[month]
}
