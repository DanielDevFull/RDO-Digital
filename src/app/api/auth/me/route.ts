export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { handle, ok, requireUser } from '@/lib/api';
import { permissionsFor } from '@/lib/rbac';

export async function GET() {
  return handle(async () => {
    const session = await requireUser();
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        rank: true,
        registration: true,
        om: { select: { id: true, code: true, name: true } },
      },
    });
    return ok({ ...user, permissions: permissionsFor(session.role) });
  });
}