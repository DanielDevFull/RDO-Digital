'use client';

import { cn } from '@/lib/utils';

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('card p-4', className)}>{children}</div>;
}

export function StatCard({
  label,
  value,
  accent = 'brand',
  hint,
}: {
  label: string;
  value: number | string;
  accent?: 'brand' | 'green' | 'amber' | 'red' | 'slate' | 'purple';
  hint?: string;
}) {
  const colors: Record<string, string> = {
    brand: 'text-brand-600 dark:text-brand-400',
    green: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400',
    slate: 'text-slate-600 dark:text-slate-300',
    purple: 'text-purple-600 dark:text-purple-400',
  };
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <span className={cn('text-3xl font-bold', colors[accent])}>{value}</span>
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </Card>
  );
}

export function Badge({
  children,
  color = 'slate',
}: {
  children: React.ReactNode;
  color?: 'slate' | 'green' | 'amber' | 'red' | 'brand' | 'purple';
}) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    green:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    brand: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
    purple:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  };
  return <span className={cn('badge', colors[color])}>{children}</span>;
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

export function Toast({
  message,
  type = 'success',
}: {
  message: string;
  type?: 'success' | 'error';
}) {
  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg',
        type === 'success' ? 'bg-emerald-600' : 'bg-red-600',
      )}
    >
      {message}
    </div>
  );
}
