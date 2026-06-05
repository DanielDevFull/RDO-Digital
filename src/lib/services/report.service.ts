import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export type ReportType =
  | 'movimentacoes'
  | 'por-produto'
  | 'por-om'
  | 'por-usuario'
  | 'por-local'
  | 'vencidos'
  | 'a-vencer'
  | 'restritos';

export interface ReportFilters {
  type: ReportType;
  from?: Date;
  to?: Date;
  period?: 'diario' | 'semanal' | 'mensal' | 'anual';
}

export interface ReportResult {
  title: string;
  columns: string[];
  rows: (string | number)[][];
  generatedAt: string;
}

function dateRangeFromPeriod(period?: string): { from?: Date; to?: Date } {
  if (!period) return {};
  const to = new Date();
  const from = new Date();
  switch (period) {
    case 'diario':
      from.setHours(0, 0, 0, 0);
      break;
    case 'semanal':
      from.setDate(from.getDate() - 7);
      break;
    case 'mensal':
      from.setMonth(from.getMonth() - 1);
      break;
    case 'anual':
      from.setFullYear(from.getFullYear() - 1);
      break;
  }
  return { from, to };
}

export async function generateReport(filters: ReportFilters): Promise<ReportResult> {
  const periodRange = dateRangeFromPeriod(filters.period);
  const from = filters.from ?? periodRange.from;
  const to = filters.to ?? periodRange.to;
  const generatedAt = new Date().toISOString();

  const movementWhere: Prisma.MovementWhereInput = {};
  if (from || to) {
    movementWhere.occurredAt = {};
    if (from) movementWhere.occurredAt.gte = from;
    if (to) movementWhere.occurredAt.lte = to;
  }

  switch (filters.type) {
    case 'movimentacoes': {
      const data = await prisma.movement.findMany({
        where: movementWhere,
        orderBy: { occurredAt: 'desc' },
        include: {
          product: { select: { name: true, internalCode: true } },
          responsible: { select: { name: true } },
          om: { select: { code: true } },
        },
      });
      return {
        title: 'Relatório de Movimentações',
        columns: [
          'Data/Hora',
          'Tipo',
          'Produto',
          'Qtd',
          'Un',
          'OM',
          'Local',
          'Responsável',
          'Saldo Ant.',
          'Saldo Atual',
        ],
        rows: data.map((m) => [
          new Date(m.occurredAt).toLocaleString('pt-BR'),
          m.type,
          m.product.name,
          m.quantity,
          m.unit,
          m.om?.code ?? '—',
          m.applicationSite ?? '—',
          m.responsible.name,
          m.previousBalance,
          m.updatedBalance,
        ]),
        generatedAt,
      };
    }

    case 'por-produto': {
      const data = await prisma.$queryRaw<
        { name: string; entradas: number; saidas: number; retornos: number }[]
      >`
        SELECT p.name AS name,
          COALESCE(SUM(CASE WHEN m.type='ENTRADA' THEN m.quantity END),0)::float AS entradas,
          COALESCE(SUM(CASE WHEN m.type='SAIDA' THEN m.quantity END),0)::float AS saidas,
          COALESCE(SUM(CASE WHEN m.type='RETORNO' THEN m.quantity END),0)::float AS retornos
        FROM products p LEFT JOIN movements m ON m.product_id = p.id
        GROUP BY p.name ORDER BY saidas DESC`;
      return {
        title: 'Consumo por Produto',
        columns: ['Produto', 'Entradas', 'Saídas', 'Retornos'],
        rows: data.map((d) => [d.name, d.entradas, d.saidas, d.retornos]),
        generatedAt,
      };
    }

    case 'por-om': {
      const data = await prisma.$queryRaw<{ om: string; total: number }[]>`
        SELECT COALESCE(o.code,'Sem OM') AS om, COALESCE(SUM(m.quantity),0)::float AS total
        FROM movements m LEFT JOIN oms o ON o.id = m.om_id
        WHERE m.type='SAIDA' GROUP BY o.code ORDER BY total DESC`;
      return {
        title: 'Consumo por OM',
        columns: ['OM', 'Total Consumido'],
        rows: data.map((d) => [d.om, d.total]),
        generatedAt,
      };
    }

    case 'por-usuario': {
      const data = await prisma.$queryRaw<
        { usuario: string; movimentacoes: number }[]
      >`
        SELECT u.name AS usuario, COUNT(m.id)::int AS movimentacoes
        FROM users u LEFT JOIN movements m ON m.responsible_id = u.id
        GROUP BY u.name ORDER BY movimentacoes DESC`;
      return {
        title: 'Movimentações por Usuário',
        columns: ['Usuário', 'Total de Movimentações'],
        rows: data.map((d) => [d.usuario, d.movimentacoes]),
        generatedAt,
      };
    }

    case 'por-local': {
      const data = await prisma.$queryRaw<{ local: string; total: number }[]>`
        SELECT COALESCE(application_site,'Não informado') AS local,
               COALESCE(SUM(quantity),0)::float AS total
        FROM movements WHERE type='SAIDA'
        GROUP BY application_site ORDER BY total DESC`;
      return {
        title: 'Consumo por Local de Aplicação',
        columns: ['Local', 'Total Consumido'],
        rows: data.map((d) => [d.local, d.total]),
        generatedAt,
      };
    }

    case 'vencidos':
    case 'a-vencer': {
      const now = new Date();
      const limit = new Date();
      limit.setDate(now.getDate() + 30);
      const where: Prisma.ProductWhereInput =
        filters.type === 'vencidos'
          ? { expirationDate: { lt: now } }
          : { expirationDate: { gte: now, lte: limit } };
      const data = await prisma.product.findMany({
        where,
        orderBy: { expirationDate: 'asc' },
        select: {
          name: true,
          internalCode: true,
          batchNumber: true,
          currentQuantity: true,
          unit: true,
          expirationDate: true,
        },
      });
      return {
        title:
          filters.type === 'vencidos'
            ? 'Produtos Vencidos'
            : 'Produtos a Vencer (30 dias)',
        columns: ['Código', 'Produto', 'Lote', 'Qtd', 'Un', 'Validade'],
        rows: data.map((p) => [
          p.internalCode,
          p.name,
          p.batchNumber ?? '—',
          p.currentQuantity,
          p.unit,
          p.expirationDate
            ? new Date(p.expirationDate).toLocaleDateString('pt-BR')
            : '—',
        ]),
        generatedAt,
      };
    }

    case 'restritos': {
      const data = await prisma.restrictedAuthorization.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true } },
          requester: { select: { name: true } },
          approver: { select: { name: true } },
        },
      });
      return {
        title: 'Produtos Restritos Movimentados',
        columns: [
          'Data',
          'Produto',
          'Solicitante',
          'Autorizador',
          'Motivo',
          'Status',
        ],
        rows: data.map((a) => [
          new Date(a.createdAt).toLocaleString('pt-BR'),
          a.product.name,
          a.requester.name,
          a.approver?.name ?? '—',
          a.reason,
          a.status,
        ]),
        generatedAt,
      };
    }

    default:
      return { title: 'Relatório', columns: [], rows: [], generatedAt };
  }
}
