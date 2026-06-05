export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handle, ok, requirePermission, getRequestContext } from '@/lib/api';
import { stockSchema } from '@/lib/validators';
import { audit } from '@/lib/audit';

export async function GET() {
  return handle(async () => {
    await requirePermission('stock:view');
    const stocks = await prisma.stock.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true, movements: true } } },
    });
    return ok(stocks);
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requirePermission('stock:manage');
    const { ip, userAgent } = getRequestContext(req);
    const data = stockSchema.parse(await req.json());
    const stock = await prisma.stock.create({ data });
    await audit({
      action: 'CRIACAO',
      userId: user.sub,
      entity: 'Stock',
      entityId: stock.id,
      description: `Estoque criado: ${stock.name} (${stock.code})`,
      ip,
      userAgent,
    });
    return ok(stock, 201);
  });
}