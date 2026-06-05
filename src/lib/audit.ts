import type { AuditAction, Prisma } from '@prisma/client';
import { prisma } from './prisma';

interface AuditInput {
  action: AuditAction;
  userId?: string | null;
  entity?: string;
  entityId?: string;
  description?: string;
  metadata?: Prisma.InputJsonValue;
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Registra um evento de auditoria. Nunca lança erro para o fluxo principal:
 * falhas de auditoria são logadas no console mas não interrompem a operação.
 */
export async function audit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        userId: input.userId ?? null,
        entity: input.entity,
        entityId: input.entityId,
        description: input.description,
        metadata: input.metadata,
        ipAddress: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (err) {
    console.error('[AUDIT ERROR]', err);
  }
}
