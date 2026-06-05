'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/client';
import { Card, Badge, Spinner } from '@/components/ui';
import { MovementForm } from '@/components/movement-form';
import { formatDateTime, formatNumber } from '@/lib/utils';

interface Movement {
  id: string;
  type: string;
  quantity: number;
  unit: string;
  occurredAt: string;
  previousBalance: number;
  updatedBalance: number;
  applicationSite: string | null;
  product: { id: string; name: string; internalCode: string };
  responsible: { name: string };
  om: { code: string } | null;
  authorization: { status: string } | null;
}

interface ProductOption {
  id: string;
  name: string;
  internalCode: string;
  unit: string;
  currentQuantity: number;
  isRestricted: boolean;
  requiresAuth: boolean;
}

const TYPE_COLORS: Record<string, 'green' | 'red' | 'amber'> = {
  ENTRADA: 'green',
  SAIDA: 'red',
  RETORNO: 'amber',
};

export default function MovementsPage() {
  const [movements, setMovements] = useState<Movement[] | null>(null);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const data = await api<Movement[]>(`/movements${typeFilter ? `?type=${typeFilter}` : ''}`);
    setMovements(data);
  }, [typeFilter]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    api<ProductOption[]>('/products?status=ATIVO').then(setProducts).catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Movimentações</h1>
          <p className="text-sm text-slate-500">Entradas, saídas e retornos</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ Nova Movimentação</button>
      </div>

      <div className="flex gap-2">
        <select className="input max-w-xs" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">Todos os tipos</option>
          <option value="ENTRADA">Entrada</option>
          <option value="SAIDA">Saída</option>
          <option value="RETORNO">Retorno</option>
        </select>
      </div>

      <Card className="overflow-x-auto p-0">
        {!movements ? (
          <Spinner />
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="th">Data/Hora</th>
                <th className="th">Tipo</th>
                <th className="th">Produto</th>
                <th className="th">Qtd</th>
                <th className="th">Saldo Ant.</th>
                <th className="th">Saldo Atual</th>
                <th className="th">OM</th>
                <th className="th">Local</th>
                <th className="th">Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="td whitespace-nowrap">{formatDateTime(m.occurredAt)}</td>
                  <td className="td">
                    <Badge color={TYPE_COLORS[m.type]}>{m.type}</Badge>
                    {m.authorization && <Badge color="purple">restrito</Badge>}
                  </td>
                  <td className="td font-medium">{m.product.name}</td>
                  <td className="td">{formatNumber(m.quantity)} {m.unit}</td>
                  <td className="td">{formatNumber(m.previousBalance)}</td>
                  <td className="td font-semibold">{formatNumber(m.updatedBalance)}</td>
                  <td className="td">{m.om?.code ?? '—'}</td>
                  <td className="td">{m.applicationSite ?? '—'}</td>
                  <td className="td">{m.responsible.name}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr><td colSpan={9} className="td py-6 text-center text-slate-400">Nenhuma movimentação.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="card my-8 w-full max-w-lg p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Nova Movimentação</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <MovementForm
              products={products}
              onDone={() => {
                load();
                api<ProductOption[]>('/products?status=ATIVO').then(setProducts).catch(() => {});
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
