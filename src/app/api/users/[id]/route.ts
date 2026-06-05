import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handle, ok, fail, requirePermission, getRequestContext } from '@/lib/api';
import { updateUserSchema } from '@/lib/validators';
import { hashPassword } from '@/lib/auth';
import { audit } from '@/lib/audit';

interface Params {
  params: { id: string };
}

export async function PUT(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const actor = await requirePermission('user:manage');
    const { ip, userAgent } = getRequestContext(req);
    const data = updateUserSchema.parse(await req.json());

    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) return fail('Usuário não encontrado.', 404);

    const { password, ...rest } = data;
    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(password ? { passwordHash: await hashPassword(password) } : {}),
      },
      select: { id: true, name: true, email: true, role: true, active: true },
    });

    await audit({
      action: 'ALTERACAO',
      userId: actor.sub,
      entity: 'User',
      entityId: user.id,
      description: `Usuário alterado: ${user.email}`,
      ip,
      userAgent,
    });

    return ok(user);
  });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const actor = await requirePermission('user:manage');
    const { ip, userAgent } = getRequestContext(req);
    if (actor.sub === params.id) {
      return fail('Você não pode desativar o próprio usuário.', 400);
    }
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { active: false },
      select: { id: true, email: true },
    });
    await audit({
      action: 'ALTERACAO',
      userId: actor.sub,
      entity: 'User',
      entityId: user.id,
      description: `Usuário desativado: ${user.email}`,
      ip,
      userAgent,
    });
    return ok({ deactivated: true });
  });
}
