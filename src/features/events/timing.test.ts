import { describe, expect, it } from 'vitest'
import { eventTiming } from './timing'

const event = { start: new Date('2026-11-19T20:00:00Z'), end: new Date('2026-11-19T23:00:00Z'), allDay: false }

describe('eventTiming', () => {
  it('antes, durante e depois', () => {
    expect(eventTiming(event, Date.parse('2026-11-19T19:59:00Z'))).toBe('upcoming')
    expect(eventTiming(event, Date.parse('2026-11-19T20:00:00Z'))).toBe('live')
    expect(eventTiming(event, Date.parse('2026-11-19T23:00:00Z'))).toBe('ended')
  })
  it('dia inteiro não tem selo', () => {
    expect(eventTiming({ ...event, allDay: true }, Date.parse('2026-11-19T21:00:00Z'))).toBe('upcoming')
  })
})
