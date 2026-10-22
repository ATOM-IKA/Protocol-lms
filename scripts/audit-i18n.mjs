import fs from 'fs'
import path from 'path'

const ru = JSON.parse(fs.readFileSync('src/shared/i18n/locales/ru.json', 'utf8'))
function keys(o, p = '') {
  let r = new Set()
  for (const k in o) {
    const kk = p ? p + '.' + k : k
    if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) for (const x of keys(o[k], kk)) r.add(x)
    else r.add(kk)
  }
  return r
}
const K = keys(ru)
const files = []
;(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f)
    const s = fs.statSync(p)
    if (s.isDirectory()) walk(p)
    else if (/\.(ts|tsx)$/.test(f)) files.push(p)
  }
})('src')

const staticRe = /\bt\(\s*['"`]([a-zA-Z0-9_.]+)['"`]\s*[),]/g
const dynRe = /\bt\(\s*['"`]([a-zA-Z0-9_.]+)['"`]\s*\+/g
const missing = new Set()
const dynamic = new Set()
for (const f of files) {
  const c = fs.readFileSync(f, 'utf8')
  let m
  while ((m = staticRe.exec(c))) {
    if (!K.has(m[1])) missing.add(m[1] + '   (' + path.basename(f) + ')')
  }
  while ((m = dynRe.exec(c))) dynamic.add(m[1] + "* (" + path.basename(f) + ')')
}
console.log('MISSING STATIC KEYS (' + missing.size + '):')
;[...missing].sort().forEach((x) => console.log('  ' + x))
console.log('\nDYNAMIC PREFIXES (check manually):')
;[...dynamic].sort().forEach((x) => console.log('  ' + x))
