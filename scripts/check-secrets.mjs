#!/usr/bin/env node
// Защита от утечки секретов: пароли, токены, ключи не должны попадать ни в git, ни в собранный сайт.
//
//   node scripts/check-secrets.mjs --staged   файлы, подготовленные к коммиту (git-хук pre-commit)
//   node scripts/check-secrets.mjs --all      все отслеживаемые git файлы
//   node scripts/check-secrets.mjs --dist     собранный сайт (папка dist) — запускается после npm run build
//
// Намеренно «ненастоящее» значение (тестовая заглушка) помечается комментарием  secret-scan:ignore  в той же строке.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const mode = process.argv.includes('--dist')
  ? 'dist'
  : process.argv.includes('--all')
    ? 'all'
    : 'staged'

const RULES = [
  { id: 'приватный ключ', re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/ },
  { id: 'JWT-токен', re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { id: 'токен GitHub', re: /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b/ },
  { id: 'ключ AWS', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { id: 'заголовок Bearer с токеном', re: /Bearer\s+[A-Za-z0-9._~+/-]{24,}=*/ },
  {
    id: 'логин:пароль в адресе',
    re: /\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/'"`]+:[^\s@/'"`]{3,}@[^\s/'"`]+/i,
  },
  {
    id: 'секрет присвоен литералом',
    re: /(?:\bpass(?:word|wd)?|\bpwd|secret|token|api[_-]?key|private[_-]?key)['"]?\s*[:=]\s*['"][^'"\s$`{}]{8,}['"]/i,
  },
  {
    id: 'значение секретной переменной окружения',
    re: /\b[A-Z][A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|API_KEY|PRIVATE_KEY)\s*=\s*['"]?[A-Za-z0-9_\-+/=.]{12,}/,
  },
]
// заглушки и шаблоны — не секреты
const PLACEHOLDER =
  /\benv\.|\.\.\.|<[^>]+>|xxxx|changeme|example|placeholder|your[-_ ]|process\.env|import\.meta\.env|\$\{|\$[A-Z_]{3,}|\*{4,}/i

// имена файлов, которых в git быть не должно
const FORBIDDEN_NAME = [
  /^\.env(\.|$)(?!example$|production$)/,
  /(^|\/)\.env\.audit$/,
  /\.pem$/,
  /\.p12$/,
  /(^|\/)id_(rsa|dsa|ed25519|ecdsa)(\.pub)?$/,
  /\.(sqlite3?|db)$/,
  /(^|\/)(credentials|secrets?)\.(json|ya?ml)$/i,
]
const SKIP_PATH =
  /(^|\/)(node_modules|\.git)\/|package-lock\.json$|(^|\/)project_(bundle|tree)\.txt$|src\/shared\/i18n\/locales\//
const SKIP_EXT = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.mp4',
  '.webm',
  '.zip',
  '.pdf',
  '.xlsx',
])

function listFiles() {
  if (mode === 'dist') {
    const out = []
    const walk = (dir) => {
      if (!existsSync(dir)) return
      for (const name of readdirSync(dir)) {
        const p = join(dir, name)
        statSync(p).isDirectory() ? walk(p) : out.push(p)
      }
    }
    walk('dist')
    if (!out.length) {
      console.error('✖ папка dist пуста или не найдена — сначала npm run build')
      process.exit(2)
    }
    return out
  }
  const args =
    mode === 'staged'
      ? ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z']
      : ['ls-files', '-z']
  return execFileSync('git', args, { encoding: 'utf8' }).split('\0').filter(Boolean)
}

const findings = []
for (const file of listFiles()) {
  const norm = file.replace(/\\/g, '/')
  if (mode !== 'dist' && FORBIDDEN_NAME.some((re) => re.test(norm))) {
    findings.push({
      file: norm,
      line: 0,
      rule: 'файл с секретами нельзя хранить в git',
      sample: '',
    })
    continue
  }
  if (SKIP_PATH.test(norm) || SKIP_EXT.has(extname(norm).toLowerCase())) continue
  if (mode !== 'dist' && /^dist\//.test(norm)) continue // сборка проверяется отдельным режимом --dist
  let text
  try {
    if (statSync(file).size > 3_000_000) continue
    text = readFileSync(file, 'utf8')
  } catch {
    continue
  }
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.length > 4000 && mode !== 'dist') continue // минифицированные вложения
    if (line.includes('secret-scan:ignore')) continue
    for (const rule of RULES) {
      const m = line.match(rule.re)
      if (!m || PLACEHOLDER.test(m[0])) continue
      // password:"Password" — подпись в интерфейсе, а не пароль: настоящие секреты почти всегда содержат цифры/символы
      if (rule.id === 'секрет присвоен литералом' && /['"][A-Za-zА-Яа-яЁё ]+['"]$/.test(m[0]))
        continue
      findings.push({
        file: norm,
        line: i + 1,
        rule: rule.id,
        sample: m[0].slice(0, 6) + '…' + `(${m[0].length} симв.)`,
      })
      break
    }
  }
}

if (!findings.length) {
  console.log(
    `✓ секретов не найдено (${mode === 'dist' ? 'сборка' : mode === 'all' ? 'весь репозиторий' : 'подготовленные к коммиту файлы'})`,
  )
  process.exit(0)
}
console.error(`\n✖ найдено возможных секретов: ${findings.length}\n`)
for (const f of findings)
  console.error(
    `  ${f.file}${f.line ? ':' + f.line : ''} — ${f.rule}${f.sample ? ' [' + f.sample + ']' : ''}`,
  )
console.error(
  '\nУберите значение из кода (используйте переменные окружения / файл .env.audit, он игнорируется git).',
)
console.error(
  'Если это заведомо ненастоящая заглушка — добавьте в строку комментарий  secret-scan:ignore',
)
process.exit(1)
