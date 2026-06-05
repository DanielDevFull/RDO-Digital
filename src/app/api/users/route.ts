export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handle, ok, fail, requirePermission, getRequestContext } from '@/lib/api';
import { createUserSchema } from '@/lib/validators';
import { hashPassword } from '@/lib/auth';
import { audit } from '@/lib/audit';

export async function GET() {
  return handle(async () => {
    await requirePermission('user:view');
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        rank: true,
        registration: true,
        active: true,
        lastLoginAt: true,
        createdAt: true,
        om: { select: { id: true, code: true } },
      },
    });
    return ok(users);
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const actor = await requirePermission('user:manage');
    const { ip, userAgent } = getRequestContext(req);
    const data = createUserSchema.parse(await req.json());

    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return fail('Já existe um usuário com este e-mail.', 409);

    const { password, ...rest } = data;
    const user = await prisma.user.create({
      data: { ...rest, passwordHash: await hashPassword(password) },
      select: { id: true, name: true, email: true, role: true, active: true },
    });

    await audit({
      action: 'CRIACAO',
      userId: actor.sub,
      entity: 'User',
      entityId: user.id,
      description: `Usuário criado: ${user.email} (${user.role})`,
      ip,
      userAgent,
    });

    return ok(user, 201);
  });
}