import type { Institution } from './types'

/** Временный список — заменим запросом к коллекции `institutions` PocketBase. */
export const MOCK_INSTITUTIONS: Institution[] = [
  { id: 'clg-01', name: 'Политехнический колледж №1', shortName: 'ПК-1' },
  { id: 'clg-02', name: 'Колледж информационных технологий', shortName: 'КИТ' },
  { id: 'clg-03', name: 'Медицинский колледж', shortName: 'МедК' },
  { id: 'clg-04', name: 'Экономический колледж', shortName: 'ЭК' },
  { id: 'clg-05', name: 'Педагогический колледж', shortName: 'ПедК' },
]
