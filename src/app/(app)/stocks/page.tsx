'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';
import { Card, Spinner, Field, Badge } from '@/components/ui';

interface Stock {
  id: string;
  code: string;
  name: string;
  location: string | null;
  active: boolean;
  _count: { products: number; movements: number };
}

export default function StocksPage() {
  const router = useRouter();
  const [stocks, setStocks] = useState<Stock[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', location: '', description: '' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setStocks(await api<Stock[]>('/stocks'));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/stocks', { method: 'POST', body: JSON.stringify(form) });
      setShowForm(false);
      setForm({ code: '', name: '', location: '', description: '' });
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function printQr(stock: Stock) {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>QR ${stock.code}</title></head>
      <body style="text-align:center;font-family:sans-serif;padding:40px">
        <h2>${stock.name}</h2>
        <p>${stock.location ?? ''}</p>
        <img src="/api/stocks/${stock.id}/qrcode" width="300" />
        <p style="font-family:monospace">${stock.code}</p>
        <p style="font-size:12px;color:#666">Escaneie para movimentar o estoque</p>
      </body></html>`);
    w.document.close();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Estoques & QR Codes</h1>
          <p className="text-sm text-slate-500">Cada estoque possui um QR Code para movimentação rápida</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowScanner((s) => !s)} className="btn-secondary">📷 Ler QR Code</button>
          <button onClick={() => setShowForm(true)} className="btn-primary">+ Novo Estoque</button>
        </div>
      </div>

      {showScanner && <QrScanner onClose={() => setShowScanner(false)} onResult={(code) => router.push(code)} />}

      {!stocks ? (
        <Spinner />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stocks.map((s) => (
            <Card key={s.id} className="flex flex-col items-center text-center">
              <img src={`/api/stocks/${s.id}/qrcode`} alt={`QR ${s.code}`} className="h-40 w-40 rounded-lg border border-slate-200 dark:border-slate-700" />
              <h3 className="mt-3 font-semibold">{s.name}</h3>
              <p className="font-mono text-xs text-slate-400">{s.code}</p>
              {s.location && <p className="text-xs text-slate-500">📍 {s.location}</p>}
              <div className="mt-2 flex gap-2">
                <Badge color="brand">{s._count.products} produtos</Badge>
                <Badge color="slate">{s._count.movements} mov.</Badge>
              </div>
              <div className="mt-3 flex gap-2">
                <a href={`/m/${s.code}`} className="btn-secondary px-3 py-1.5 text-xs">Abrir</a>
                <button onClick={() => printQr(s)} className="btn-secondary px-3 py-1.5 text-xs">Imprimir QR</button>
              </div>
            </Card>
          ))}
          {stocks.length === 0 && <p className="text-slate-400">Nenhum estoque cadastrado.</p>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={save} className="card w-full max-w-md space-y-3 p-6">
            <h2 className="text-lg font-bold">Novo Estoque</h2>
            <Field label="Código (embutido no QR) *">
              <input className="input" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </Field>
            <Field label="Nome *">
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Localização">
              <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </Field>
            <Field label="Descrição">
              <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="btn-primary">Salvar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function QrScanner({ onClose, onResult }: { onClose: () => void; onResult: (url: string) => void }) {
  const [error, setError] = useState('');

  useEffect(() => {
    let scanner: { clear: () => Promise<void> } | null = null;
    let active = true;
    (async () => {
      try {
        const { Html5QrcodeScanner } = await import('html5-qrcode');
        if (!active) return;
        scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 250 }, false) as unknown as {
          clear: () => Promise<void>;
          render: (a: (text: string) => void, b: (e: string) => void) => void;
        };
        (scanner as unknown as { render: (a: (t: string) => void, b: (e: string) => void) => void }).render(
          (text: string) => {
            try {
              const url = new URL(text);
              onResult(url.pathname);
            } catch {
              onResult(text.startsWith('/') ? text : `/m/${text}`);
            }
          },
          () => {},
        );
      } catch (e) {
        setError('Não foi possível iniciar a câmera: ' + (e as Error).message);
      }
    })();
    return () => {
      active = false;
      scanner?.clear?.().catch(() => {});
    };
  }, [onResult]);

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold">Leitor de QR Code</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
      </div>
      <div id="qr-reader" className="mx-auto max-w-sm" />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </Card>
  );
}
