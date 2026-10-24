import { describe, expect, it } from 'vitest'
import { asId, httpStatus, parseJson, relId, relNum, relStr } from './directus'

describe('помощники слоя Directus', () => {
  it('asId: числа — числом, uuid — строкой', () => {
    expect(asId('42')).toBe(42)
    expect(asId(7)).toBe(7)
    expect(asId('0b0e8400-e29b-41d4-a716-446655440000')).toBe(
      '0b0e8400-e29b-41d4-a716-446655440000',
    )
    expect(asId(null)).toBe('')
  })

  it('relId/relStr/relNum читают и id, и вложенный объект', () => {
    expect(relId(5)).toBe('5')
    expect(relId({ id: 'u1', full_name: 'Иван' })).toBe('u1')
    expect(relId(null)).toBe('')
    expect(relStr({ full_name: 'Иван' }, 'full_name')).toBe('Иван')
    expect(relStr(5, 'x')).toBe('')
    expect(relNum({ n: '3' }, 'n')).toBe(3)
    expect(relNum({ n: 'x' }, 'n', 9)).toBe(9)
  })

  it('parseJson: строка и готовый объект, мусор — запасное значение', () => {
    expect(parseJson('["a"]', [])).toEqual(['a'])
    expect(parseJson(['a'], [])).toEqual(['a'])
    expect(parseJson('{oops', { ok: 1 })).toEqual({ ok: 1 })
    expect(parseJson(null, 'fb')).toBe('fb')
  })

  it('httpStatus достаёт код из ошибки SDK', () => {
    expect(httpStatus({ response: { status: 401 } })).toBe(401)
    expect(httpStatus(new Error('network'))).toBeUndefined()
  })
})
