import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { handle, ok, fail, requirePermission } from '@/lib/api';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'public/uploads';

// POST /api/uploads - upload de ficha FISPQ (PDF)
export async function POST(req: NextRequest) {
  return handle(async () => {
    await requirePermission('product:update');
    const form = await req.formData();
    const file = form.get('file');

    if (!file || !(file instanceof File)) {
      return fail('Arquivo não enviado.', 400);
    }
    if (file.type !== 'application/pdf') {
      return fail('Apenas arquivos PDF são aceitos para a FISPQ.', 415);
    }
    if (file.size > 10 * 1024 * 1024) {
      return fail('Arquivo excede o limite de 10MB.', 413);
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const safeName = `fispq-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    const dir = path.join(process.cwd(), UPLOAD_DIR);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, safeName), bytes);

    const url = `/uploads/${safeName}`;
    return ok({ url, filename: safeName });
  });
}
