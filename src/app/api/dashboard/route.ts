export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { handle, ok, requirePermission } from '@/lib/api';
import { EXPIRY_WARNING_DAYS } from '@/lib/utils';

export async function GET() {
  return handle(async () => {
    await requirePermission('dashboard:view');

    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(now.getDate() + EXPIRY_WARNING_DAYS);

    const periodStart = new Date();
    periodStart.setDate(now.getDate() - 180);

    const [
      totalProducts,
      chemicalProducts,
      restrictedProducts,
      expiredProducts,
      expiringSoon,
      activeProducts,
      recentMovements,
      lowStockRaw,
      movementsByType,
      consumptionRaw,
      byProductRaw,
      byOmRaw,
      bySiteRaw,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isChemical: true } }),
      prisma.product.count({ where: { isRestricted: true } }),
      prisma.product.count({
        where: { expirationDate: { lt: now, not: null } },
      }),
      prisma.product.count({
        where: { expirationDate: { gte: now, lte: warningDate } },
      }),
      prisma.product.count({ where: { status: 'ATIVO' } }),
      prisma.movement.findMany({
        take: 10,
        orderBy: { occurredAt: 'desc' },
        include: {
          product: { select: { name: true, internalCode: true } },
          responsible: { select: { name: true } },
          om: { select: { code: true } },
        },
      }),
      // Estoque baixo: currentQuantity <= minStock (minStock > 0)
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count FROM products
        WHERE min_stock > 0 AND current_quantity <= min_stock AND status = 'ATIVO'
      `,
      prisma.movement.groupBy({
        by: ['type'],
        _count: { _all: true },
        _sum: { quantity: true },
      }),
      // Consumo (SAIDA) por mês
      prisma.$queryRaw<{ month: string; total: number }[]>`
        SELECT to_char(date_trunc('month', occurred_at), 'YYYY-MM') AS month,
               COALESCE(SUM(quantity), 0)::float AS total
        FROM movements
        WHERE type = 'SAIDA' AND occurred_at >= ${periodStart}
        GROUP BY 1 ORDER BY 1
      `,
      // Consumo por produto (top 8)
      prisma.$queryRaw<{ name: string; total: number }[]>`
        SELECT p.name AS name, COALESCE(SUM(m.quantity), 0)::float AS total
        FROM movements m JOIN products p ON p.id = m.product_id
        WHERE m.type = 'SAIDA'
        GROUP BY p.name ORDER BY total DESC LIMIT 8
      `,
      // Consumo por OM
      prisma.$queryRaw<{ name: string; total: number }[]>`
        SELECT COALESCE(o.code, 'Sem OM') AS name, COALESCE(SUM(m.quantity), 0)::float AS total
        FROM movements m LEFT JOIN oms o ON o.id = m.om_id
        WHERE m.type = 'SAIDA'
        GROUP BY o.code ORDER BY total DESC LIMIT 8
      `,
      // Consumo por local de aplicação
      prisma.$queryRaw<{ name: string; total: number }[]>`
        SELECT COALESCE(application_site, 'Não informado') AS name,
               COALESCE(SUM(quantity), 0)::float AS total
        FROM movements
        WHERE type = 'SAIDA'
        GROUP BY application_site ORDER BY total DESC LIMIT 8
      `,
    ]);

    const lowStock = Number(lowStockRaw[0]?.count ?? 0);

    return ok({
      cards: {
        totalProducts,
        chemicalProducts,
        restrictedProducts,
        expiredProducts,
        expiringSoon,
        activeProducts,
        lowStock,
      },
      recentMovements,
      charts: {
        movementsByType: movementsByType.map((m) => ({
          type: m.type,
          count: m._count._all,
          quantity: m._sum.quantity ?? 0,
        })),
        consumptionByPeriod: consumptionRaw,
        byProduct: byProductRaw,
        byOm: byOmRaw,
        bySite: bySiteRaw,
      },
    });
  });
}