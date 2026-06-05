import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handle, ok, fail, requirePermission } from '@/lib/api';

interface Params {
  params: { id: string };
}

// GET /api/stocks/[id] - dados do estoque + produtos (usado pela tela do QR Code)
export async function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    await requirePermission('stock:view');
    const stock = await prisma.stock.findFirst({
      where: { OR: [{ id: params.id }, { code: params.id }] },
      include: {
        products: {
          where: { status: 'ATIVO' },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            internalCode: true,
            name: true,
            unit: true,
            currentQuantity: true,
            minStock: true,
            isRestricted: true,
            requiresAuth: true,
            batchNumber: true,
            expirationDate: true,
          },
        },
      },
    });
    if (!stock) return fail('Estoque não encontrado.', 404);
    return ok(stock);
  });
}
