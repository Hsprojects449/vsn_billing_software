"use client"

import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

interface MonthYearPickerProps {
  currentYear: number
  currentMonth: number // 1-indexed
}

export function MonthYearPicker({ currentYear, currentMonth }: MonthYearPickerProps) {
  const router = useRouter()
  const today = new Date()

  // Generate years: 3 years back up to current year
  const years = Array.from(
    { length: today.getFullYear() - (today.getFullYear() - 3) + 1 },
    (_, i) => today.getFullYear() - 3 + i,
  )

  const navigate = (year: number, month: number) => {
    router.push(`/dashboard/reports?year=${year}&month=${month}`)
  }

  const handleMonthChange = (value: string) => {
    navigate(currentYear, parseInt(value))
  }

  const handleYearChange = (value: string) => {
    const newYear = parseInt(value)
    // If selected year is current year and month is in the future, clamp to current month
    const clampedMonth =
      newYear === today.getFullYear() && currentMonth > today.getMonth() + 1
        ? today.getMonth() + 1
        : currentMonth
    navigate(newYear, clampedMonth)
  }

  // Months available for the selected year
  const availableMonths = MONTHS.map((name, i) => {
    const monthNum = i + 1
    const isFuture =
      currentYear === today.getFullYear() && monthNum > today.getMonth() + 1
    return { name, monthNum, disabled: isFuture }
  })

  return (
    <div className="flex items-center gap-2">
      <Select value={String(currentMonth)} onValueChange={handleMonthChange}>
        <SelectTrigger className="w-[130px] h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableMonths.map(({ name, monthNum, disabled }) => (
            <SelectItem
              key={monthNum}
              value={String(monthNum)}
              disabled={disabled}
            >
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={String(currentYear)} onValueChange={handleYearChange}>
        <SelectTrigger className="w-[90px] h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
