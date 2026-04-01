"use client"

import { SearchableSelect } from "@/components/ui/searchable-select"

interface FinancialYearSelectorProps {
  selectedYear: string
  onYearChange: (year: string) => void
}

// Financial year runs from April 1 to March 31
export function getFinancialYear(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = date.getMonth() // 0-indexed
  
  // If month is Jan, Feb, or Mar (0, 1, 2), we're in the previous FY
  if (month < 3) {
    return `${year - 1}-${year}`
  }
  
  return `${year}-${year + 1}`
}

export function getFinancialYearDateRange(fy: string): { start: string; end: string } {
  const [startYear, endYear] = fy.split('-').map(Number)
  return {
    start: `${startYear}-04-01`,
    end: `${endYear}-03-31`
  }
}

export function generateFinancialYears(count: number = 5): string[] {
  const currentFY = getFinancialYear()
  const [currentStartYear] = currentFY.split('-').map(Number)
  
  const years: string[] = []
  for (let i = 0; i < count; i++) {
    const startYear = currentStartYear - i
    years.push(`${startYear}-${startYear + 1}`)
  }
  
  return years
}

export function FinancialYearSelector({ selectedYear, onYearChange }: FinancialYearSelectorProps) {
  const financialYears = generateFinancialYears(10) // Last 10 years
  const yearOptions = financialYears.map((fy) => ({
    value: fy,
    label: `FY ${fy}`,
  }))
  
  return (
    <SearchableSelect
      value={selectedYear}
      onValueChange={onYearChange}
      options={yearOptions}
      placeholder="Select FY"
      searchPlaceholder="Type financial year..."
      triggerClassName="w-[180px]"
    />
  )
}
