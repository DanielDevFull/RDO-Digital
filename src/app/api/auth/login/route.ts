export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSession } from '@/lib/auth';
import { loginSchema } from '@/lib/validators';
import { handle, ok, fail, getRequestContext } from '@/lib/api';
import { audit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  return handle(async () => {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);
    const { ip, userAgent } = getRequestContext(req);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.active) {
      await audit({
        action: 'LOGIN_FALHA',
        description: `Tentativa de login para ${email}`,
        ip,
        userAgent,
      });
      return fail('Credenciais inválidas.', 401);
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await audit({
        action: 'LOGIN_FALHA',
        userId: user.id,
        description: `Senha incorreta para ${email}`,
        ip,
        userAgent,
      });
      return fail('Credenciais inválidas.', 401);
    }

    await createSession(user);
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await audit({
      action: 'LOGIN',
      userId: user.id,
      description: `Login efetuado por ${user.email}`,
      ip,
      userAgent,
    });

    return ok({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  });
}