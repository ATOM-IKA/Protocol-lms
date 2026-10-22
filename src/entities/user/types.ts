export type UserRole = 'student' | 'teacher' | 'admin' | 'superadmin'

export interface UserRecord {
  id: string
  email: string
  full_name: string
  student_id: string
  role: UserRole
  avatar?: string
  xp: number
  level: number
  student_tag?: string
  tag_emoji?: string
  total_study_hours?: number
  avg_grade?: number
  created: string
  updated: string
}
