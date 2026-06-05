'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { Field, Badge } from '@/components/ui';
import { formatNumber } from '@/lib/utils';

interface ProductOption {
  id: string;
  name: string;
  internalCode: string;
  unit: string;
  currentQuantity: number;
  isRestricted: boolean;
  requiresAuth: boolean;
}
interface Om {
  id: string;
  code: string;
  name: string;
}
interface Approver {
  id: string;
  name: string;
  role: string;
}

export function MovementForm({
  stockId,
  products,
  onDone,
}: {
  stockId?: string;
  products: ProductOption[];
  onDone?: () => void;
}) {
  const [type, setType] = useState<'ENTRADA' | 'SAIDA' | 'RETORNO'>('SAIDA');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [omId, setOmId] = useState('');
  const [applicationSite, setApplicationSite] = useState('');
  const [notes, setNotes] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  // Autorização (restritos)
  const [reason, setReason] = useState('');
  const [signature, setSignature] = useState('');
  const [approverId, setApproverId] = useState('');

  const [oms, setOms] = useState<Om[]>([]);
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    api<Om[]>('/oms').then(setOms).catch(() => {});
    api<Approver[]>('/users')
      .then((u) => setApprovers(u.filter((x) => ['SUPERVISOR', 'ADMINISTRADOR'].includes(x.role))))
      .catch(() => {});
  }, []);

  const product = products.find((p) => p.id === productId);
  const needsAuth = type === 'SAIDA' && product && (product.isRestricted || product.requiresAuth);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const payload: Record<string, unknown> = {
        type,
        productId,
        stockId: stockId ?? null,
        unit: product?.unit ?? 'UN',
        quantity: Number(quantity),
        omId: omId || null,
        applicationSite: applicationSite || null,
        notes: notes || null,
        batchNumber: batchNumber || null,
        expirationDate: expirationDate || null,
      };
      if (needsAuth) {
        payload.authorization = { reason, digitalSignature: signature, approverId };
      }
      await api('/movements', { method: 'POST', body: JSON.stringify(payload) });
      setMsg({ type: 'ok', text: 'Movimentação registrada com sucesso!' });
      setQuantity('');
      setReason('');
      setSignature('');
      setNotes('');
      onDone?.();
    } catch (err) {
      setMsg({ type: 'err', text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {(['ENTRADA', 'SAIDA', 'RETORNO'] as const).map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => setType(t)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
              type === t
                ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'
            }`}
          >
            {t === 'ENTRADA' ? '⬇️ Entrada' : t === 'SAIDA' ? '⬆️ Saída' : '↩️ Retorno'}
          </button>
        ))}
      </div>

      <Field label="Produto *">
        <select className="input" required value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">Selecione...</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({formatNumber(p.currentQuantity)} {p.unit})
            </option>
          ))}
        </select>
      </Field>

      {product && (
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/50">
          <span>Saldo atual: <strong>{formatNumber(product.currentQuantity)} {product.unit}</strong></span>
          {product.isRestricted && <Badge color="purple">Restrito</Badge>}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Quantidade *">
          <input type="number" step="any" min="0" className="input" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </Field>
        <Field label="OM (Organização Militar)">
          <select className="input" value={omId} onChange={(e) => setOmId(e.target.value)}>
            <option value="">—</option>
            {oms.map((o) => <option key={o.id} value={o.id}>{o.code} — {o.name}</option>)}
          </select>
        </Field>
        <Field label="Local de Aplicação">
          <input className="input" value={applicationSite} onChange={(e) => setApplicationSite(e.target.value)} />
        </Field>
        <Field label="Número do Lote">
          <input className="input" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} />
        </Field>
        <Field label="Data de Validade">
          <input type="date" className="input" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} />
        </Field>
      </div>

      <Field label="Observações">
        <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      {needsAuth && (
        <div className="space-y-3 rounded-lg border border-purple-300 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
          <p className="flex items-center gap-2 text-sm font-semibold text-purple-800 dark:text-purple-300">
            🔒 Produto restrito — autenticação adicional obrigatória
          </p>
          <Field label="Responsável Autorizador *">
            <select className="input" required value={approverId} onChange={(e) => setApproverId(e.target.value)}>
              <option value="">Selecione (Supervisor/Administrador)...</option>
              {approvers.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}
            </select>
          </Field>
          <Field label="Motivo da Retirada *">
            <textarea className="input" rows={2} required value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <Field label="Assinatura Digital do Solicitante *">
            <input className="input" required placeholder="Digite seu nome completo como assinatura" value={signature} onChange={(e) => setSignature(e.target.value)} />
          </Field>
          <p className="text-xs text-purple-700 dark:text-purple-400">
            Data e hora da autorização serão registradas automaticamente.
          </p>
        </div>
      )}

      {msg && (
        <div className={`rounded-lg px-3 py-2 text-sm ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      <button type="submit" disabled={saving || !productId} className="btn-primary w-full">
        {saving ? 'Registrando...' : 'Registrar Movimentação'}
      </button>
    </form>
  );
}
