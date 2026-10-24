import { describe, expect, it } from 'vitest'
import { ALLOWED_EXT, MAX_FILE_BYTES, MAX_FILES, validateFiles } from './upload'

const file = (name: string, size = 100) => new File([new Uint8Array(size)], name)

describe('валидация загрузок', () => {
  it('пропускает разрешённые файлы', () => {
    const r = validateFiles([file('report.pdf'), file('code.PY')])
    expect(r.error).toBeNull()
    expect(r.ok).toHaveLength(2)
  })

  it('отклоняет исполняемые и неизвестные типы', () => {
    for (const bad of ['virus.exe', 'run.bat', 'x.sh', 'noext', 'a.php', 'b.dll']) {
      expect(validateFiles([file(bad)]).error, bad).not.toBeNull()
    }
  })

  it('ограничивает размер и количество', () => {
    expect(validateFiles([file('big.zip', MAX_FILE_BYTES + 1)]).error).toMatch(/МБ/)
    const many = Array.from({ length: MAX_FILES + 1 }, (_, i) => file(`f${i}.txt`))
    const r = validateFiles(many)
    expect(r.error).not.toBeNull()
    expect(r.ok).toHaveLength(MAX_FILES)
  })

  it('в списке разрешённых нет опасных расширений', () => {
    for (const bad of ['exe', 'bat', 'cmd', 'sh', 'php', 'dll', 'msi', 'scr', 'jar']) {
      expect(ALLOWED_EXT).not.toContain(bad)
    }
  })
})
