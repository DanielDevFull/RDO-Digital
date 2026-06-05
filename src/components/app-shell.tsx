'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTheme } from './theme-provider';
import { ROLE_LABELS } from '@/lib/rbac';
import type { Permission } from '@/lib/rbac';
import type { UserRole } from '@prisma/client';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  permission: Permission;
}

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊', permission: 'dashboard:view' },
  { href: '/products', label: 'Produtos', icon: '🧪', permission: 'product:view' },
  { href: '/movements', label: 'Movimentações', icon: '🔄', permission: 'movement:view' },
  { href: '/stocks', label: 'Estoques / QR', icon: '🏷️', permission: 'stock:view' },
  { href: '/reports', label: 'Relatórios', icon: '📑', permission: 'report:view' },
  { href: '/users', label: 'Usuários', icon: '👥', permission: 'user:view' },
  { href: '/audit', label: 'Auditoria', icon: '🛡️', permission: 'audit:view' },
];

export interface ShellUser {
  name: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
}

export function AppShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  const items = NAV.filter((n) => user.permissions.includes(n.permission));

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5 dark:border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-black text-white">
            RDO
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">RDO Digital</p>
            <p className="text-[10px] text-slate-400">Estoque Químico</p>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                  active
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                )}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <button
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
          >
            ☰
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Alternar tema"
              title="Alternar tema claro/escuro"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <div className="text-right">
              <p className="text-sm font-medium leading-tight">{user.name}</p>
              <p className="text-[11px] text-slate-400">
                {ROLE_LABELS[user.role]}
              </p>
            </div>
            <button onClick={logout} className="btn-secondary px-3 py-1.5 text-xs">
              Sair
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
