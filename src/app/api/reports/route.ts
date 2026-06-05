export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { handle, ok, requirePermission, getRequestContext } from '@/lib/api';
import { audit } from '@/lib/audit';
import {
  generateReport,
  type ReportType,
  type ReportFilters,
} from '@/lib/services/report.service';

function buildCsv(columns: string[], rows: (string | number)[][]): string {
  const escape = (v: string | number) => {
    const s = String(v ?? '');
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map(escape).join(';');
  const body = rows.map((r) => r.map(escape).join(';')).join('\n');
  return `${header}\n${body}`;
}

export async function GET(req: NextRequest) {
  return handle(async () => {
    const user = await requirePermission('report:view');
    const { ip, userAgent } = getRequestContext(req);
    const { searchParams } = req.nextUrl;

    const type = (searchParams.get('type') ?? 'movimentacoes') as ReportType;
    const format = (searchParams.get('format') ?? 'json').toLowerCase();
    const filters: ReportFilters = {
      type,
      period: (searchParams.get('period') as ReportFilters['period']) ?? undefined,
      from: searchParams.get('from')
        ? new Date(searchParams.get('from')!)
        : undefined,
      to: searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined,
    };

    const report = await generateReport(filters);

    // Exportações exigem permissão extra
    if (format !== 'json') {
      await requirePermission('report:export');
      await audit({
        action: 'EXPORTACAO',
        userId: user.sub,
        entity: 'Report',
        description: `Exportação de relatório "${report.title}" em ${format.toUpperCase()}`,
        ip,
        userAgent,
      });
    }

    const filename = `relatorio-${type}-${Date.now()}`;

    if (format === 'csv') {
      const csv = buildCsv(report.columns, report.rows);
      return new NextResponse('﻿' + csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    }

    if (format === 'excel' || format === 'xlsx') {
      const ws = XLSX.utils.aoa_to_sheet([report.columns, ...report.rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      return new NextResponse(buf, {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
        },
      });
    }

    if (format === 'pdf') {
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(14);
      doc.text('RDO Digital — ' + report.title, 14, 16);
      doc.setFontSize(9);
      doc.text(
        `Gerado em: ${new Date(report.generatedAt).toLocaleString('pt-BR')}`,
        14,
        22,
      );
      autoTable(doc, {
        head: [report.columns],
        body: report.rows.map((r) => r.map(String)),
        startY: 28,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [26, 92, 245] },
      });
      const buf = new Uint8Array(doc.output('arraybuffer') as ArrayBuffer);
      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}.pdf"`,
        },
      });
    }

    return ok(report);
  });
}