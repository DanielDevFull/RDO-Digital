'use client';

import { useState } from 'react';
import { api, downloadReport } from '@/lib/client';
import { Card, Field, Spinner } from '@/components/ui';

const REPORT_TYPES = [
  { value: 'movimentacoes', label: 'Movimentações' },
  { value: 'por-produto', label: 'Por Produto' },
  { value: 'por-om', label: 'Por OM' },
  { value: 'por-usuario', label: 'Por Usuário' },
  { value: 'por-local', label: 'Por Local de Aplicação' },
  { value: 'vencidos', label: 'Produtos Vencidos' },
  { value: 'a-vencer', label: 'Produtos a Vencer' },
  { value: 'restritos', label: 'Restritos Movimentados' },
];

const PERIODS = [
  { value: '', label: 'Todo o período' },
  { value: 'diario', label: 'Diário' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'anual', label: 'Anual' },
];

interface Report {
  title: string;
  columns: string[];
  rows: (string | number)[][];
  generatedAt: string;
}

export default function ReportsPage() {
  const [type, setType] = useState('movimentacoes');
  const [period, setPeriod] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);

  function buildParams(extra: Record<string, string> = {}) {
    const p: Record<string, string> = { type, ...extra };
    if (period) p.period = period;
    if (from) p.from = from;
    if (to) p.to = to;
    return p;
  }

  async function preview() {
    setLoading(true);
    try {
      const qs = new URLSearchParams(buildParams()).toString();
      setReport(await api<Report>(`/reports?${qs}`));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-sm text-slate-500">Geração e exportação em PDF, Excel e CSV</p>
      </div>

      <Card className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Tipo de Relatório">
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              {REPORT_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Field>
          <Field label="Período">
            <select className="input" value={period} onChange={(e) => setPeriod(e.target.value)}>
              {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </Field>
          <Field label="De">
            <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="Até">
            <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={preview} className="btn-primary">🔍 Visualizar</button>
          <button onClick={() => downloadReport(buildParams({ format: 'pdf' }))} className="btn-secondary">📄 PDF</button>
          <button onClick={() => downloadReport(buildParams({ format: 'excel' }))} className="btn-secondary">📊 Excel</button>
          <button onClick={() => downloadReport(buildParams({ format: 'csv' }))} className="btn-secondary">📋 CSV</button>
        </div>
      </Card>

      {loading && <Spinner />}

      {report && !loading && (
        <Card className="overflow-x-auto">
          <h3 className="mb-1 font-semibold">{report.title}</h3>
          <p className="mb-3 text-xs text-slate-400">
            Gerado em {new Date(report.generatedAt).toLocaleString('pt-BR')} — {report.rows.length} registros
          </p>
          <table className="w-full">
            <thead className="border-b border-slate-200 dark:border-slate-800">
              <tr>{report.columns.map((c) => <th key={c} className="th">{c}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {report.rows.map((row, i) => (
                <tr key={i}>{row.map((cell, j) => <td key={j} className="td">{cell}</td>)}</tr>
              ))}
              {report.rows.length === 0 && (
                <tr><td colSpan={report.columns.length} className="td py-6 text-center text-slate-400">Sem dados.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
