import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';
import { handle, fail, requirePermission } from '@/lib/api';

interface Params {
  params: { id: string };
}

// GET /api/stocks/[id]/qrcode - gera o PNG do QR Code do estoque
export async function GET(req: NextRequest, { params }: Params) {
  return handle(async () => {
    await requirePermission('stock:view');
    const stock = await prisma.stock.findFirst({
      where: { OR: [{ id: params.id }, { code: params.id }] },
    });
    if (!stock) return fail('Estoque não encontrado.', 404);

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      req.nextUrl.origin ||
      'http://localhost:3000';
    // O QR aponta diretamente para a tela de movimentação do estoque
    const targetUrl = `${baseUrl}/m/${stock.code}`;

    const png = await QRCode.toBuffer(targetUrl, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'M',
    });

    return new NextResponse(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="qrcode-${stock.code}.png"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  });
}
