'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/client';
import { Card, Badge, Spinner, Field } from '@/components/ui';
import { formatDate, formatNumber } from '@/lib/utils';

interface Product {
  id: string;
  internalCode: string;
  name: string;
  brand: string | null;
  unit: string;
  currentQuantity: number;
  minStock: number;
  maxStock: number;
  casNumber: string | null;
  isChemical: boolean;
  isRestricted: boolean;
  requiresAuth: boolean;
  status: string;
  expirationDate: string | null;
  batchNumber: string | null;
  physicalLocation: string | null;
  category: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
}
interface Stock {
  id: string;
  name: string;
  code: string;
}

const UNITS = ['UN', 'L', 'ML', 'KG', 'G', 'MG', 'M3', 'CX', 'GL', 'FR'];

const emptyForm = {
  internalCode: '',
  name: '',
  description: '',
  brand: '',
  manufacturer: '',
  categoryId: '',
  unit: 'UN',
  minStock: 0,
  maxStock: 0,
  currentQuantity: 0,
  casNumber: '',
  isChemical: true,
  isRestricted: false,
  requiresAuth: false,
  fispqPdfUrl: '',
  expirationDate: '',
  batchNumber: '',
  physicalLocation: '',
  stockId: '',
  status: 'ATIVO',
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [q, setQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const data = await api<Product[]>(`/products${q ? `?q=${encodeURIComponent(q)}` : ''}`);
    setProducts(data);
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    api<Category[]>('/categories').then(setCategories).catch(() => {});
    api<Stock[]>('/stocks').then(setStocks).catch(() => {});
  }, []);

  function openCreate() {
    setForm({ ...emptyForm });
    setEditId(null);
    setError('');
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setForm({
      ...emptyForm,
      ...p,
      categoryId: p.category?.id ?? '',
      description: '',
      manufacturer: '',
      fispqPdfUrl: '',
      stockId: '',
      expirationDate: p.expirationDate ? p.expirationDate.slice(0, 10) : '',
      batchNumber: p.batchNumber ?? '',
      physicalLocation: p.physicalLocation ?? '',
      casNumber: p.casNumber ?? '',
      brand: p.brand ?? '',
    });
    setEditId(p.id);
    setError('');
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = { ...form };
      if (!payload.categoryId) payload.categoryId = null;
      if (!payload.stockId) payload.stockId = null;
      if (!payload.expirationDate) payload.expirationDate = null;
      await api(editId ? `/products/${editId}` : '/products', {
        method: editId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      setShowForm(false);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: Product) {
    if (!confirm(`Excluir/inativar "${p.name}"?`)) return;
    await api(`/products/${p.id}`, { method: 'DELETE' });
    load();
  }

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-sm text-slate-500">Cadastro e controle de produtos químicos</p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ Novo Produto</button>
      </div>

      <div className="flex gap-2">
        <input
          className="input max-w-sm"
          placeholder="Buscar por nome, código, marca, CAS..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <Card className="overflow-x-auto p-0">
        {!products ? (
          <Spinner />
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="th">Código</th>
                <th className="th">Produto</th>
                <th className="th">Categoria</th>
                <th className="th">Saldo</th>
                <th className="th">Validade</th>
                <th className="th">Flags</th>
                <th className="th">Status</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {products.map((p) => {
                const low = p.minStock > 0 && p.currentQuantity <= p.minStock;
                return (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="td font-mono text-xs">{p.internalCode}</td>
                    <td className="td font-medium">
                      {p.name}
                      {p.brand && <span className="block text-xs text-slate-400">{p.brand}</span>}
                    </td>
                    <td className="td">{p.category?.name ?? '—'}</td>
                    <td className="td">
                      <span className={low ? 'font-semibold text-red-600' : ''}>
                        {formatNumber(p.currentQuantity)} {p.unit}
                      </span>
                      {low && <Badge color="red">baixo</Badge>}
                    </td>
                    <td className="td">{formatDate(p.expirationDate)}</td>
                    <td className="td space-x-1">
                      {p.isChemical && <Badge color="brand">Químico</Badge>}
                      {p.isRestricted && <Badge color="purple">Restrito</Badge>}
                    </td>
                    <td className="td">
                      <Badge color={p.status === 'ATIVO' ? 'green' : 'slate'}>{p.status}</Badge>
                    </td>
                    <td className="td whitespace-nowrap text-right">
                      <button onClick={() => openEdit(p)} className="text-brand-600 hover:underline">Editar</button>
                      <button onClick={() => remove(p)} className="ml-3 text-red-600 hover:underline">Excluir</button>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr><td colSpan={8} className="td text-center text-slate-400 py-6">Nenhum produto cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <form onSubmit={save} className="card my-8 w-full max-w-3xl space-y-4 p-6">
            <h2 className="text-lg font-bold">{editId ? 'Editar' : 'Novo'} Produto</h2>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Código Interno *">
                <input className="input" required value={form.internalCode} onChange={(e) => set('internalCode', e.target.value)} />
              </Field>
              <Field label="Nome *">
                <input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} />
              </Field>
              <Field label="Categoria">
                <select className="input" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                  <option value="">—</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Marca">
                <input className="input" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
              </Field>
              <Field label="Fabricante">
                <input className="input" value={form.manufacturer} onChange={(e) => set('manufacturer', e.target.value)} />
              </Field>
              <Field label="Número CAS">
                <input className="input" value={form.casNumber} onChange={(e) => set('casNumber', e.target.value)} />
              </Field>
              <Field label="Unidade de Medida">
                <select className="input" value={form.unit} onChange={(e) => set('unit', e.target.value)}>
                  {UNITS.map((u) => <option key={u}>{u}</option>)}
                </select>
              </Field>
              <Field label="Estoque Mínimo">
                <input type="number" step="any" className="input" value={form.minStock} onChange={(e) => set('minStock', Number(e.target.value))} />
              </Field>
              <Field label="Estoque Máximo">
                <input type="number" step="any" className="input" value={form.maxStock} onChange={(e) => set('maxStock', Number(e.target.value))} />
              </Field>
              <Field label="Quantidade Atual">
                <input type="number" step="any" className="input" value={form.currentQuantity} onChange={(e) => set('currentQuantity', Number(e.target.value))} />
              </Field>
              <Field label="Número do Lote">
                <input className="input" value={form.batchNumber} onChange={(e) => set('batchNumber', e.target.value)} />
              </Field>
              <Field label="Data de Validade">
                <input type="date" className="input" value={form.expirationDate} onChange={(e) => set('expirationDate', e.target.value)} />
              </Field>
              <Field label="Localização Física">
                <input className="input" value={form.physicalLocation} onChange={(e) => set('physicalLocation', e.target.value)} />
              </Field>
              <Field label="Estoque (QR)">
                <select className="input" value={form.stockId} onChange={(e) => set('stockId', e.target.value)}>
                  <option value="">—</option>
                  {stocks.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo</option>
                </select>
              </Field>
              <Field label="Ficha FISPQ (PDF)">
                <input type="file" accept="application/pdf" className="input" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const fd = new FormData();
                  fd.append('file', file);
                  const res = await fetch('/api/uploads', { method: 'POST', body: fd });
                  const json = await res.json();
                  if (json.success) set('fispqPdfUrl', json.data.url);
                }} />
              </Field>
            </div>

            <Field label="Descrição completa">
              <textarea className="input" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
            </Field>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isChemical} onChange={(e) => set('isChemical', e.target.checked)} /> Produto químico
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isRestricted} onChange={(e) => set('isRestricted', e.target.checked)} /> Produto restrito
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.requiresAuth} onChange={(e) => set('requiresAuth', e.target.checked)} /> Necessita autorização p/ retirada
              </label>
            </div>

            {error && <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
