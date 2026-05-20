import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export type Authed = {
  userId: string
  role: 'ADMIN' | 'MEMBER'
  email: string | null
  name: string | null
}

export async function getAuthed(): Promise<Authed | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  return {
    userId: session.user.id,
    role: ((session.user as { role?: string }).role as 'ADMIN' | 'MEMBER') ?? 'MEMBER',
    email: session.user.email ?? null,
    name: session.user.name ?? null,
  }
}

export async function requireAuthed() {
  const auth = await getAuthed()
  if (!auth) {
    throw new ApiError('Unauthorized', 401)
  }
  return auth
}

export async function requireAdmin() {
  const auth = await requireAuthed()
  if (auth.role !== 'ADMIN') {
    throw new ApiError('Forbidden', 403)
  }
  return auth
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function handleApiError(err: unknown) {
  if (err instanceof ApiError) {
    return Response.json({ error: err.message }, { status: err.status })
  }
  console.error('[content-testing api]', err)
  return Response.json({ error: 'Internal server error' }, { status: 500 })
}
