#!/usr/bin/env node
// Пересчитывает публичную витрину главной (site_stats): курсы, студенты, часы обучения.
// До появления серверного расширения запускайте вручную или по cron:  node directus/refresh-stats.mjs
import { connect } from './lib.mjs'

const dx = await connect({ envFile: process.argv.includes('--env') ? process.argv[process.argv.indexOf('--env') + 1] : '.env.audit', dryRun: false })
const count = async (path) => Number((await dx.get(path))?.[0]?.count ?? 0)

const courses = await count('/items/courses?aggregate[count]=*&filter[status][_eq]=published')
const students = await count('/users?aggregate[count]=*&filter[role][name][_eq]=student&filter[status][_eq]=active')
const done = await dx.get('/items/session_progress?filter[completed][_eq]=true&fields=lesson.duration_hours&limit=-1')
const hours = Math.round(done.reduce((sum, r) => sum + Number(r.lesson?.duration_hours ?? 0), 0))

await dx.write('PATCH', '/items/site_stats', { courses, students, hours, updated_at: new Date().toISOString() })
console.log(`site_stats: курсов ${courses}, студентов ${students}, часов ${hours}`)
