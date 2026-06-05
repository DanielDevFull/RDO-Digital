import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  handle,
  ok,
  fail,
  requirePermission,
  getRequestContext,
} from '@/lib/api';
import { audit } from '@/lib/audit';
import { updateProductSchema } from '@/lib/validators';

interface Params {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: Params) {
  return handle(async () => {
    await requirePermission('product:view');
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        stock: true,
        movements: {
          take: 20,
          orderBy: { occurredAt: 'desc' },
          include: { responsible: { select: { name: true } } },
        },
      },
    });
    if (!product) return fail('Produto não encontrado.', 404);
    return ok(product);
  });
}

export async function PUT(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const user = await requirePermission('product:update');
    const { ip, userAgent } = getRequestContext(req);
    const body = await req.json();
    const data = updateProductSchema.parse(body);

    const existing = await prisma.product.findUnique({
      where: { id: params.id },
    });
    if (!existing) return fail('Produto não encontrado.', 404);

    const product = await prisma.product.update({
      where: { id: params.id },
      data,
    });

    await audit({
      action: 'ALTERACAO',
      userId: user.sub,
      entity: 'Product',
      entityId: product.id,
      description: `Produto alterado: ${product.name}`,
      metadata: { before: existing, after: product },
      ip,
      userAgent,
    });

    return ok(product);
  });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  return handle(async () => {
    const user = await requirePermission('product:delete');
    const { ip, userAgent } = getRequestContext(req);

    const existing = await prisma.product.findUnique({
      where: { id: params.id },
      include: { _count: { select: { movements: true } } },
    });
    if (!existing) return fail('Produto não encontrado.', 404);

    // Produtos com histórico são apenas inativados (preserva rastreabilidade)
    if (existing._count.movements > 0) {
      const product = await prisma.product.update({
        where: { id: params.id },
        data: { status: 'INATIVO' },
      });
      await audit({
        action: 'ALTERACAO',
        userId: user.sub,
        entity: 'Product',
        entityId: product.id,
        description: `Produto inativado (possui movimentações): ${product.name}`,
        ip,
        userAgent,
      });
      return ok({ inactivated: true });
    }

    await prisma.product.delete({ where: { id: params.id } });
    await audit({
      action: 'EXCLUSAO',
      userId: user.sub,
      entity: 'Product',
      entityId: params.id,
      description: `Produto excluído: ${existing.name}`,
      ip,
      userAgent,
    });
    return ok({ deleted: true });
  });
}
