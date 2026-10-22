import { getItems, createRec, deleteRec, asId, parseJson, uploadFile, assetUrl } from '@/shared/api/directus'
export type ItemStatus = 'ok' | 'bad' | 'na' | 'none'
export interface QaItemReport { id: string; text: string; status: ItemStatus; add: string; improve: string; problems: string }
export interface QaSectionSummary { role: string; title: string; ok: number; bad: number; na: number; total: number; note: string; items: QaItemReport[] }
export interface QaReport { id: string; reporterId: string; name: string; role: string; score: number; problems: number; sections: QaSectionSummary[]; created: string }
export interface QaShot { item: string; url: string }
export interface NewQaReport { reporterId: string; name: string; role: string; score: number; problems: number; sections: QaSectionSummary[] }
export async function submitQaReport(input: NewQaReport): Promise<string> {
  const rec = await createRec<{ id: unknown }>('qa_reports', { reporter: asId(input.reporterId), name: input.name, role: input.role, score: input.score, problems: input.problems, payload: { sections: input.sections }, created: new Date().toISOString() })
  return String(rec.id)
}
/** NB: в PB файл шёл прямо в запись; в Directus сначала грузим в directus_files, потом link. */
export async function uploadQaScreenshot(reportId: string, item: string, file: File): Promise<void> {
  const fileId = await uploadFile(file)
  await createRec('qa_screenshots', { report: asId(reportId), item, image: fileId, created: new Date().toISOString() })
}
interface Rec { id: unknown; reporter?: unknown; name?: string; role?: string; score?: number; problems?: number; payload?: unknown; created?: string }
interface ShotRec { id: unknown; report?: unknown; item?: string; image?: unknown }
export async function fetchQaReports(): Promise<QaReport[]> {
  const list = await getItems<Rec>('qa_reports', { sort: '-created', fields: ['*'] })
  return list.map((r) => {
    const payload = parseJson<{ sections?: QaSectionSummary[] }>(r.payload, {})
    return { id: String(r.id), reporterId: String(typeof r.reporter === 'object' && r.reporter ? (r.reporter as { id?: unknown }).id : r.reporter ?? ''), name: r.name ?? '', role: r.role ?? '', score: r.score ?? 0, problems: r.problems ?? 0, sections: payload.sections ?? [], created: r.created ?? '' }
  })
}
export async function fetchQaScreenshots(reportId: string): Promise<QaShot[]> {
  const list = await getItems<ShotRec>('qa_screenshots', { filter: { report: { _eq: asId(reportId) } }, fields: ['*'] })
  return list.filter((s) => s.image).map((s) => ({ item: s.item ?? '', url: assetUrl(String(typeof s.image === 'object' ? (s.image as { id?: unknown }).id : s.image)) }))
}
export const deleteQaReport = (id: string) => deleteRec('qa_reports', id)