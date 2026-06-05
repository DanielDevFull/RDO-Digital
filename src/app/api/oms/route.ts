export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handle, ok, requirePermission } from '@/lib/api';
import { omSchema } from '@/lib/validators';

export async function GET() {
  return handle(async () => {
    await requirePermission('movement:view');
    const oms = await prisma.om.findMany({ orderBy: { code: 'asc' } });
    return ok(oms);
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    await requirePermission('stock:manage');
    const data = omSchema.parse(await req.json());
    const om = await prisma.om.create({ data });
    return ok(om, 201);
  });
}