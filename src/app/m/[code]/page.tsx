'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/client';
import { Spinner } from '@/components/ui';
import { MovementForm } from '@/components/movement-form';

interface StockData {
  id: string;
  code: string;
  name: string;
  location: string | null;
  products: Array<{
    id: string;
    name: string;
    internalCode: string;
    unit: string;
    currentQuantity: number;
    isRestricted: boolean;
    requiresAuth: boolean;
  }>;
}

export default function QrMovementPage() {
  const { code } = useParams<{ code: string }>();
  const [stock, setStock] = useState<StockData | null>(null);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    api<StockData>(`/stocks/${code}`)
      .then(setStock)
      .catch((e) => setError(e.message));
  }, [code, reloadKey]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="bg-brand-700 px-4 py-4 text-white">
        <div className="mx-auto max-w-lg">
          <p className="text-xs text-brand-200">RDO Digital — Movimentação de Estoque</p>
          <h1 className="text-lg font-bold">{stock ? stock.name : 'Carregando...'}</h1>
          {stock?.location && <p className="text-xs text-brand-200">📍 {stock.location}</p>}
          {stock && <p className="text-xs text-brand-200">Código: {stock.code}</p>}
        </div>
      </header>

      <main className="mx-auto max-w-lg p-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        {!stock && !error && <Spinner />}
        {stock && (
          <div className="card p-5">
            <MovementForm
              stockId={stock.id}
              products={stock.products}
              onDone={() => setReloadKey((k) => k + 1)}
            />
          </div>
        )}
        <p className="mt-4 text-center text-xs text-slate-400">
          Data e hora são registradas automaticamente. Todas as ações são auditadas.
        </p>
      </main>
    </div>
  );
}
