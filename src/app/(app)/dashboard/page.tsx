'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { api } from '@/lib/client';
import { StatCard, Card, Spinner, Badge } from '@/components/ui';
import { formatDateTime, formatNumber } from '@/lib/utils';

interface DashboardData {
  cards: {
    totalProducts: number;
    chemicalProducts: number;
    restrictedProducts: number;
    expiredProducts: number;
    expiringSoon: number;
    lowStock: number;
  };
  recentMovements: Array<{
    id: string;
    type: string;
    quantity: number;
    unit: string;
    occurredAt: string;
    product: { name: string };
    responsible: { name: string };
    om: { code: string } | null;
  }>;
  charts: {
    consumptionByPeriod: { month: string; total: number }[];
    byProduct: { name: string; total: number }[];
    byOm: { name: string; total: number }[];
    bySite: { name: string; total: number }[];
  };
}

const PIE_COLORS = ['#1a5cf5', '#599fff', '#19378f', '#8ec2ff', '#142357', '#337bff', '#bcdaff', '#173bb6'];
const TYPE_COLORS: Record<string, 'green' | 'red' | 'amber'> = {
  ENTRADA: 'green',
  SAIDA: 'red',
  RETORNO: 'amber',
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<DashboardData>('/dashboard')
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-500">Visão geral do estoque</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Produtos" value={data.cards.totalProducts} accent="brand" />
        <StatCard label="Químicos" value={data.cards.chemicalProducts} accent="slate" />
        <StatCard label="Restritos" value={data.cards.restrictedProducts} accent="purple" />
        <StatCard label="A Vencer" value={data.cards.expiringSoon} accent="amber" hint="próx. 30 dias" />
        <StatCard label="Vencidos" value={data.cards.expiredProducts} accent="red" />
        <StatCard label="Estoque Baixo" value={data.cards.lowStock} accent="red" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-sm font-semibold">Consumo por Período</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.charts.consumptionByPeriod}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
              <XAxis dataKey="month" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#1a5cf5" strokeWidth={2} name="Saídas" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold">Consumo por Produto (Top 8)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.charts.byProduct} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
              <XAxis type="number" fontSize={11} />
              <YAxis type="category" dataKey="name" width={110} fontSize={10} />
              <Tooltip />
              <Bar dataKey="total" fill="#1a5cf5" radius={[0, 4, 4, 0]} name="Consumo" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold">Consumo por OM</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data.charts.byOm}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {data.charts.byOm.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend fontSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold">Consumo por Local de Aplicação</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.charts.bySite}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
              <XAxis dataKey="name" fontSize={10} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Bar dataKey="total" fill="#599fff" radius={[4, 4, 0, 0]} name="Consumo" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-semibold">Últimas Movimentações</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Data/Hora</th>
                <th className="th">Tipo</th>
                <th className="th">Produto</th>
                <th className="th">Qtd</th>
                <th className="th">OM</th>
                <th className="th">Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.recentMovements.map((m) => (
                <tr key={m.id}>
                  <td className="td">{formatDateTime(m.occurredAt)}</td>
                  <td className="td">
                    <Badge color={TYPE_COLORS[m.type]}>{m.type}</Badge>
                  </td>
                  <td className="td font-medium">{m.product.name}</td>
                  <td className="td">{formatNumber(m.quantity)} {m.unit}</td>
                  <td className="td">{m.om?.code ?? '—'}</td>
                  <td className="td">{m.responsible.name}</td>
                </tr>
              ))}
              {data.recentMovements.length === 0 && (
                <tr>
                  <td colSpan={6} className="td text-center text-slate-400">
                    Nenhuma movimentação registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
