export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handle, ok, requirePermission } from '@/lib/api';
import { categorySchema } from '@/lib/validators';

export async function GET() {
  return handle(async () => {
    await requirePermission('product:view');
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return ok(categories);
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    await requirePermission('product:create');
    const data = categorySchema.parse(await req.json());
    const category = await prisma.category.create({ data });
    return ok(category, 201);
  });
}