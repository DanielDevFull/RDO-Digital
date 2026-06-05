'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/client';
import { Card, Badge, Spinner, Field } from '@/components/ui';
import { ROLE_LABELS } from '@/lib/rbac';
import { formatDateTime } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  rank: string | null;
  registration: string | null;
  active: boolean;
  lastLoginAt: string | null;
}

const ROLES = ['ADMINISTRADOR', 'SUPERVISOR', 'OPERADOR', 'CONSULTA'];
const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'OPERADOR',
  rank: '',
  registration: '',
  active: true,
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setUsers(await api<User[]>('/users'));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setForm({ ...emptyForm });
    setEditId(null);
    setError('');
    setShowForm(true);
  }
  function openEdit(u: User) {
    setForm({ ...emptyForm, ...u, password: '', rank: u.rank ?? '', registration: u.registration ?? '' });
    setEditId(u.id);
    setError('');
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const payload: Record<string, unknown> = { ...form };
      if (editId && !payload.password) delete payload.password;
      await api(editId ? `/users/${editId}` : '/users', {
        method: editId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      setShowForm(false);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function toggle(u: User) {
    if (u.active && !confirm(`Desativar ${u.name}?`)) return;
    if (u.active) {
      await api(`/users/${u.id}`, { method: 'DELETE' });
    } else {
      await api(`/users/${u.id}`, { method: 'PUT', body: JSON.stringify({ active: true }) });
    }
    load();
  }

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-sm text-slate-500">Gestão de usuários e perfis (RBAC)</p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ Novo Usuário</button>
      </div>

      <Card className="overflow-x-auto p-0">
        {!users ? (
          <Spinner />
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="th">Nome</th>
                <th className="th">E-mail</th>
                <th className="th">Perfil</th>
                <th className="th">Posto/Grad.</th>
                <th className="th">Último Login</th>
                <th className="th">Status</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="td font-medium">{u.name}</td>
                  <td className="td">{u.email}</td>
                  <td className="td"><Badge color="brand">{ROLE_LABELS[u.role as keyof typeof ROLE_LABELS]}</Badge></td>
                  <td className="td">{u.rank ?? '—'}</td>
                  <td className="td">{formatDateTime(u.lastLoginAt)}</td>
                  <td className="td"><Badge color={u.active ? 'green' : 'red'}>{u.active ? 'Ativo' : 'Inativo'}</Badge></td>
                  <td className="td whitespace-nowrap text-right">
                    <button onClick={() => openEdit(u)} className="text-brand-600 hover:underline">Editar</button>
                    <button onClick={() => toggle(u)} className="ml-3 text-red-600 hover:underline">{u.active ? 'Desativar' : 'Ativar'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={save} className="card w-full max-w-md space-y-3 p-6">
            <h2 className="text-lg font-bold">{editId ? 'Editar' : 'Novo'} Usuário</h2>
            <Field label="Nome *"><input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
            <Field label="E-mail *"><input type="email" className="input" required value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
            <Field label={editId ? 'Senha (deixe em branco para manter)' : 'Senha *'}>
              <input type="password" className="input" required={!editId} value={form.password} onChange={(e) => set('password', e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Perfil">
                <select className="input" value={form.role} onChange={(e) => set('role', e.target.value)}>
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r as keyof typeof ROLE_LABELS]}</option>)}
                </select>
              </Field>
              <Field label="Posto/Graduação"><input className="input" value={form.rank} onChange={(e) => set('rank', e.target.value)} /></Field>
            </div>
            <Field label="Identidade/Matrícula"><input className="input" value={form.registration} onChange={(e) => set('registration', e.target.value)} /></Field>
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
