// Ограничения на загрузку файлов при сдаче работ (совпадают с PocketBase).

export const MAX_FILES = 3
export const MAX_FILE_MB = 10
export const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024

// Разрешённые расширения: документы, изображения, архивы, код, макеты.
export const ALLOWED_EXT = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'rtf', 'csv',
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'fig',
  'zip', 'rar', '7z',
  'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'py', 'java', 'sql',
]

export const ACCEPT_ATTR = ALLOWED_EXT.map((e) => '.' + e).join(',')

function ext(name: string): string {
  const m = name.split('.').pop()
  return (m || '').toLowerCase()
}

export interface ValidationResult {
  ok: File[]
  error: string | null
}

/** Проверяет список файлов: количество, размер, тип. Возвращает годные + первую ошибку. */
export function validateFiles(files: File[]): ValidationResult {
  if (files.length > MAX_FILES) {
    return { ok: files.slice(0, MAX_FILES), error: `Можно прикрепить не более ${MAX_FILES} файлов.` }
  }
  for (const f of files) {
    if (!ALLOWED_EXT.includes(ext(f.name))) {
      return { ok: [], error: `Недопустимый тип файла: ${f.name}. Разрешены документы, изображения, архивы и код.` }
    }
    if (f.size > MAX_FILE_BYTES) {
      return { ok: [], error: `Файл «${f.name}» больше ${MAX_FILE_MB} МБ.` }
    }
  }
  return { ok: files, error: null }
}
