// Экспорт в стилизованную таблицу Excel без зависимостей.
// Генерируем HTML-таблицу с инлайновыми стилями и отдаём как .xls
// (Excel/LibreOffice открывают такой файл как книгу с форматированием).

export interface XlsColumn<T> {
  header: string
  value: (row: T) => string | number
  width?: number // в пикселях
}

interface XlsMeta {
  title: string
  subtitle?: string
  generatedAt?: string
}

function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Собирает HTML-книгу Excel со стилями NEON GRID (адаптировано под белый лист). */
export function buildStyledXls<T>(rows: T[], columns: XlsColumn<T>[], meta: XlsMeta): string {
  const head = columns
    .map(
      (c) =>
        `<th style="background:#0b0d12;color:#9fe8ff;border:1px solid #1c2230;padding:8px 12px;font-family:Consolas,monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;text-align:left;"${c.width ? ` width="${c.width}"` : ''}>${esc(c.header)}</th>`,
    )
    .join('')

  const body = rows
    .map((r, i) => {
      const bg = i % 2 === 0 ? '#ffffff' : '#f2f6fa'
      const cells = columns
        .map(
          (c) =>
            `<td style="background:${bg};border:1px solid #d7dee6;padding:6px 12px;font-family:Segoe UI,Arial,sans-serif;font-size:12px;color:#0b0d12;">${esc(c.value(r))}</td>`,
        )
        .join('')
      return `<tr>${cells}</tr>`
    })
    .join('')

  const colspan = columns.length
  const generated = meta.generatedAt ?? new Date().toLocaleString('ru-RU')

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"/>
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>${esc(meta.title)}</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
</head>
<body>
<table border="0" cellspacing="0" cellpadding="0">
<tr><td colspan="${colspan}" style="background:#0b0d12;color:#beef8d;padding:12px;font-family:Segoe UI,Arial,sans-serif;font-size:18px;font-weight:bold;">PROTOCOL · ${esc(meta.title)}</td></tr>
${meta.subtitle ? `<tr><td colspan="${colspan}" style="background:#11151d;color:#9fe8ff;padding:6px 12px;font-family:Consolas,monospace;font-size:11px;">${esc(meta.subtitle)}</td></tr>` : ''}
<tr><td colspan="${colspan}" style="background:#11151d;color:#7d8794;padding:6px 12px;font-family:Consolas,monospace;font-size:10px;">Сформировано: ${esc(generated)} · Записей: ${rows.length}</td></tr>
<tr>${head}</tr>
${body}
</table>
</body></html>`
}

/** Скачивает строку как файл в браузере. */
export function downloadFile(content: string, filename: string, mime: string): void {
  const bom = '﻿' // корректная кириллица в Excel
  const blob = new Blob([bom + content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function downloadXls(content: string, filename: string): void {
  downloadFile(content, filename.endsWith('.xls') ? filename : filename + '.xls', 'application/vnd.ms-excel')
}
