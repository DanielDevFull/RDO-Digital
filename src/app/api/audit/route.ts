export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handle, ok, requirePermission } from '@/lib/api';
import type { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  return handle(async () => {
    await requirePermission('audit:view');
    const { searchParams } = req.nextUrl;
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const limit = Math.min(Number(searchParams.get('limit') ?? 100), 500);

    const where: Prisma.AuditLogWhereInput = {};
    if (action) where.action = action as Prisma.AuditLogWhereInput['action'];
    if (userId) where.userId = userId;

    const logs = await prisma.auditLog.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    });

    return ok(logs);
  });
}