import type { Role } from '../../../domain/promoters'

export const ROLE_LABEL: Record<Role, string> = {
  promoter: 'Promotor',
  dj: 'DJ',
  teacher: 'Professor',
  venue: 'Local',
  other: 'Outro',
}

export type RoleFilter = Role | 'all'
