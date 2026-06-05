export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handle, ok, requirePermission, getRequestContext } from '@/lib/api';
import { audit } from '@/lib/audit';
import { productSchema } from '@/lib/validators';
import type { Prisma } from '@prisma/client';

// GET /api/products - lista produtos com filtros
export async function GET(req: NextRequest) {
  return handle(async () => {
    await requirePermission('product:view');
    const { searchParams } = req.nextUrl;
    const q = searchParams.get('q')?.trim();
    const status = searchParams.get('status');
    const categoryId = searchParams.get('categoryId');
    const onlyRestricted = searchParams.get('restricted') === 'true';
    const onlyChemical = searchParams.get('chemical') === 'true';

    const where: Prisma.ProductWhereInput = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { internalCode: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { casNumber: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (status === 'ATIVO' || status === 'INATIVO') where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (onlyRestricted) where.isRestricted = true;
    if (onlyChemical) where.isChemical = true;

    const products = await prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        stock: { select: { id: true, name: true, code: true } },
      },
      orderBy: { name: 'asc' },
    });

    return ok(products);
  });
}

// POST /api/products - cadastra produto
export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requirePermission('product:create');
    const { ip, userAgent } = getRequestContext(req);
    const body = await req.json();
    const data = productSchema.parse(body);

    const product = await prisma.product.create({
      data: { ...data, createdById: user.sub },
    });

    await audit({
      action: 'CRIACAO',
      userId: user.sub,
      entity: 'Product',
      entityId: product.id,
      description: `Produto cadastrado: ${product.name} (${product.internalCode})`,
      ip,
      userAgent,
    });

    return ok(product, 201);
  });
}