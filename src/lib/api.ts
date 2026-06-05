import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getSession, type SessionUser } from './auth';
import { hasPermission, type Permission } from './rbac';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function ok(data: unknown, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(message: string, status = 400, details?: unknown): NextResponse {
  return NextResponse.json(
    { success: false, error: message, details },
    { status },
  );
}

/** Extrai IP e User-Agent da requisição para auditoria. */
export function getRequestContext(req: NextRequest): {
  ip: string | null;
  userAgent: string | null;
} {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded
    ? forwarded.split(',')[0].trim()
    : req.headers.get('x-real-ip') || null;
  return { ip, userAgent: req.headers.get('user-agent') };
}

/** Garante que há um usuário autenticado; lança ApiError 401 caso contrário. */
export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new ApiError('Não autenticado.', 401);
  }
  return session;
}

/** Garante usuário autenticado E com a permissão informada. */
export async function requirePermission(
  permission: Permission,
): Promise<SessionUser> {
  const user = await requireUser();
  if (!hasPermission(user.role, permission)) {
    throw new ApiError('Acesso negado para esta operação.', 403);
  }
  return user;
}

/** Wrapper que padroniza o tratamento de erros das rotas. */
export async function handle(
  fn: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError) {
      return fail(err.message, err.status);
    }
    if (err instanceof ZodError) {
      return fail('Dados inválidos.', 422, err.flatten());
    }
    console.error('[API ERROR]', err);
    return fail('Erro interno do servidor.', 500);
  }
}
