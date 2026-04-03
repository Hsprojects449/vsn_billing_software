/**
 * Utility functions for exporting data to Excel format
 */

export interface ExportColumn {
  key: string
  label: string
  formatter?: (value: any) => string
}

const DEFAULT_CSV_CHUNK_SIZE = 1500
const DEFAULT_PDF_YIELD_EVERY = 250

function escapeCsvCell(value: unknown): string {
  const stringValue = String(value ?? '')
  return `"${stringValue.replace(/"/g, '""')}"`
}

function buildCsvRow(item: any, columns: ExportColumn[]): string {
  return columns
    .map(col => {
      let value = item[col.key]
      if (col.formatter) {
        value = col.formatter(value)
      }
      return escapeCsvCell(value)
    })
    .join(',')
}

function downloadBlob(blob: Blob, filename: string) {
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Revoke object URL to avoid memory growth after repeated exports
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function yieldToMainThread(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Export data array to CSV format (compatible with Excel)
 * @param data Array of objects to export
 * @param columns Column definitions with keys and labels
 * @param filename Name of the file to download
 */
export function exportToCSV(
  data: any[],
  columns: ExportColumn[],
  filename: string = 'export.csv'
) {
  if (data.length === 0) {
    return
  }

  const headers = columns.map(col => escapeCsvCell(col.label)).join(',')
  const rows = new Array<string>(data.length + 1)
  rows[0] = headers

  for (let i = 0; i < data.length; i++) {
    rows[i + 1] = buildCsvRow(data[i], columns)
  }

  const csv = rows.join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, filename)
}

/**
 * Export data array to CSV in chunks to keep the UI responsive for large datasets.
 */
export async function exportToCSVAsync(
  data: any[],
  columns: ExportColumn[],
  filename: string = 'export.csv',
  chunkSize: number = DEFAULT_CSV_CHUNK_SIZE,
) {
  if (data.length === 0) {
    return
  }

  const normalizedChunkSize = Math.max(200, chunkSize)
  const headers = columns.map(col => escapeCsvCell(col.label)).join(',')
  const rows: string[] = [headers]

  for (let i = 0; i < data.length; i++) {
    rows.push(buildCsvRow(data[i], columns))
    if ((i + 1) % normalizedChunkSize === 0) {
      await yieldToMainThread()
    }
  }

  const csv = rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, filename)
}

/**
 * Export data array to JSON format
 * @param data Array of objects to export
 * @param filename Name of the file to download
 */
export function exportToJSON(
  data: any[],
  filename: string = 'export.json'
) {
  if (data.length === 0) {
    return
  }

  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
  downloadBlob(blob, filename)
}

/**
 * Get current timestamp for filename
 */
export function getTimestamp(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Export data array to PDF using jsPDF
 */
export async function exportToPDF(
  data: any[],
  columns: ExportColumn[],
  title: string,
  filename: string = 'export.pdf'
) {
  if (data.length === 0) return

  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 12
  const usableWidth = pageWidth - margin * 2
  const colWidth = usableWidth / columns.length
  const rowHeight = 7

  let y = 18

  // Title
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(title, margin, y)
  y += 8

  // Header row background
  doc.setFillColor(220, 220, 220)
  doc.rect(margin, y - 5, usableWidth, rowHeight, 'F')

  // Header row text
  doc.setFontSize(8)
  columns.forEach((col, i) => {
    doc.text(col.label, margin + i * colWidth + 2, y)
  })
  y += rowHeight

  // Data rows
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)

  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const item = data[rowIndex]
    if (y + rowHeight > pageHeight - margin) {
      doc.addPage()
      y = 18
    }

    if (rowIndex % 2 === 0) {
      doc.setFillColor(248, 248, 248)
      doc.rect(margin, y - 5, usableWidth, rowHeight, 'F')
    }

    columns.forEach((col, i) => {
      let value = item[col.key]
      if (col.formatter) value = col.formatter(value)
      const str = String(value ?? '').substring(0, 38)
      doc.text(str, margin + i * colWidth + 2, y)
    })

    y += rowHeight

    if ((rowIndex + 1) % DEFAULT_PDF_YIELD_EVERY === 0) {
      await yieldToMainThread()
    }
  }

  // Bottom border line
  doc.setDrawColor(180, 180, 180)
  doc.line(margin, y, pageWidth - margin, y)

  doc.save(filename)
}
