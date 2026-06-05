import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { permissionsFor } from '@/lib/rbac';
import { AppShell } from '@/components/app-shell';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <AppShell
      user={{
        name: session.name,
        email: session.email,
        role: session.role,
        permissions: permissionsFor(session.role),
      }}
    >
      {children}
    </AppShell>
  );
}
