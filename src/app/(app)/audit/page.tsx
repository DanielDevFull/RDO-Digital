'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/client';
import { Card, Badge, Spinner } from '@/components/ui';
import { formatDateTime } from '@/lib/utils';

interface Log {
  id: string;
  action: string;
  entity: string | null;
  description: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { name: string; email: string } | null;
}

const ACTIONS = [
  'LOGIN', 'LOGOUT', 'LOGIN_FALHA', 'CRIACAO', 'ALTERACAO',
  'EXCLUSAO', 'MOVIMENTACAO', 'APROVACAO', 'REJEICAO', 'EXPORTACAO',
];

const ACTION_COLORS: Record<string, 'green' | 'red' | 'amber' | 'brand' | 'slate' | 'purple'> = {
  LOGIN: 'green',
  LOGOUT: 'slate',
  LOGIN_FALHA: 'red',
  CRIACAO: 'brand',
  ALTERACAO: 'amber',
  EXCLUSAO: 'red',
  MOVIMENTACAO: 'brand',
  APROVACAO: 'purple',
  REJEICAO: 'red',
  EXPORTACAO: 'slate',
};

export default function AuditPage() {
  const [logs, setLogs] = useState<Log[] | null>(null);
  const [action, setAction] = useState('');

  const load = useCallback(async () => {
    setLogs(await api<Log[]>(`/audit${action ? `?action=${action}` : ''}`));
  }, [action]);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Auditoria</h1>
        <p className="text-sm text-slate-500">Registro completo de eventos do sistema (IP, dispositivo, usuário)</p>
      </div>

      <select className="input max-w-xs" value={action} onChange={(e) => setAction(e.target.value)}>
        <option value="">Todas as ações</option>
        {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
      </select>

      <Card className="overflow-x-auto p-0">
        {!logs ? (
          <Spinner />
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="th">Data/Hora</th>
                <th className="th">Ação</th>
                <th className="th">Usuário</th>
                <th className="th">Descrição</th>
                <th className="th">IP</th>
                <th className="th">Dispositivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="td whitespace-nowrap">{formatDateTime(l.createdAt)}</td>
                  <td className="td"><Badge color={ACTION_COLORS[l.action] ?? 'slate'}>{l.action}</Badge></td>
                  <td className="td">{l.user?.name ?? '—'}</td>
                  <td className="td">{l.description ?? '—'}</td>
                  <td className="td font-mono text-xs">{l.ipAddress ?? '—'}</td>
                  <td className="td max-w-xs truncate text-xs text-slate-400" title={l.userAgent ?? ''}>{l.userAgent ?? '—'}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={6} className="td py-6 text-center text-slate-400">Nenhum log encontrado.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
