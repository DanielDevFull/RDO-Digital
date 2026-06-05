export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { destroySession, getSession } from '@/lib/auth';
import { handle, ok, getRequestContext } from '@/lib/api';
import { audit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  return handle(async () => {
    const session = await getSession();
    const { ip, userAgent } = getRequestContext(req);
    if (session) {
      await audit({
        action: 'LOGOUT',
        userId: session.sub,
        description: `Logout de ${session.email}`,
        ip,
        userAgent,
      });
    }
    destroySession();
    return ok({ loggedOut: true });
  });
}