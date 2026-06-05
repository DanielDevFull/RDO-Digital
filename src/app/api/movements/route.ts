export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handle, ok, requirePermission, getRequestContext } from '@/lib/api';
import { movementSchema } from '@/lib/validators';
import { createMovement } from '@/lib/services/movement.service';
import type { Prisma } from '@prisma/client';

// GET /api/movements - lista movimentações com filtros
export async function GET(req: NextRequest) {
  return handle(async () => {
    await requirePermission('movement:view');
    const { searchParams } = req.nextUrl;
    const productId = searchParams.get('productId');
    const stockId = searchParams.get('stockId');
    const omId = searchParams.get('omId');
    const type = searchParams.get('type');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const limit = Math.min(Number(searchParams.get('limit') ?? 100), 500);

    const where: Prisma.MovementWhereInput = {};
    if (productId) where.productId = productId;
    if (stockId) where.stockId = stockId;
    if (omId) where.omId = omId;
    if (type === 'ENTRADA' || type === 'SAIDA' || type === 'RETORNO')
      where.type = type;
    if (from || to) {
      where.occurredAt = {};
      if (from) where.occurredAt.gte = new Date(from);
      if (to) where.occurredAt.lte = new Date(to);
    }

    const movements = await prisma.movement.findMany({
      where,
      take: limit,
      orderBy: { occurredAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, internalCode: true } },
        responsible: { select: { id: true, name: true } },
        om: { select: { id: true, code: true, name: true } },
        stock: { select: { id: true, name: true } },
        authorization: { select: { id: true, status: true, reason: true } },
      },
    });

    return ok(movements);
  });
}

// POST /api/movements - registra movimentação
export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requirePermission('movement:create');
    const { ip, userAgent } = getRequestContext(req);
    const body = await req.json();
    const input = movementSchema.parse(body);

    const movement = await createMovement({ input, userId: user.sub, ip, userAgent });
    return ok(movement, 201);
  });
}