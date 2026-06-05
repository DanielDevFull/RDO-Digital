import type { MovementType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import type { MovementInput } from '@/lib/validators';

interface CreateMovementParams {
  input: MovementInput;
  userId: string;
  ip?: string | null;
  userAgent?: string | null;
}

/** Calcula o novo saldo conforme o tipo de movimentação. */
export function computeBalance(
  type: MovementType,
  previous: number,
  quantity: number,
): number {
  switch (type) {
    case 'ENTRADA':
    case 'RETORNO':
      return previous + quantity;
    case 'SAIDA':
      return previous - quantity;
    default:
      return previous;
  }
}

/**
 * Cria uma movimentação de forma atômica:
 * - valida saldo (saídas não podem deixar saldo negativo);
 * - aplica regras de produto restrito (autorização obrigatória);
 * - atualiza a quantidade atual do produto;
 * - grava saldo anterior/atualizado;
 * - registra auditoria.
 */
export async function createMovement({
  input,
  userId,
  ip,
  userAgent,
}: CreateMovementParams) {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
  });

  if (!product) {
    throw new ApiError('Produto não encontrado.', 404);
  }
  if (product.status === 'INATIVO') {
    throw new ApiError('Produto inativo não pode ser movimentado.', 400);
  }

  // Regras de produto restrito / autorização para retirada
  const needsAuthorization =
    input.type === 'SAIDA' && (product.isRestricted || product.requiresAuth);

  if (needsAuthorization && !input.authorization) {
    throw new ApiError(
      'Produto restrito: autorização (motivo, assinatura e autorizador) é obrigatória para retirada.',
      403,
    );
  }

  // Valida o autorizador (precisa ser Supervisor ou Administrador)
  if (needsAuthorization && input.authorization) {
    const approver = await prisma.user.findUnique({
      where: { id: input.authorization.approverId },
    });
    if (
      !approver ||
      !approver.active ||
      !['SUPERVISOR', 'ADMINISTRADOR'].includes(approver.role)
    ) {
      throw new ApiError(
        'Responsável autorizador inválido: deve ser Supervisor ou Administrador ativo.',
        400,
      );
    }
  }

  const previousBalance = product.currentQuantity;
  const updatedBalance = computeBalance(
    input.type,
    previousBalance,
    input.quantity,
  );

  if (updatedBalance < 0) {
    throw new ApiError(
      `Saldo insuficiente. Saldo atual: ${previousBalance}, retirada solicitada: ${input.quantity}.`,
      400,
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const movement = await tx.movement.create({
      data: {
        type: input.type,
        unit: input.unit,
        quantity: input.quantity,
        productId: input.productId,
        stockId: input.stockId ?? product.stockId ?? null,
        omId: input.omId ?? null,
        applicationSite: input.applicationSite ?? null,
        notes: input.notes ?? null,
        batchNumber: input.batchNumber ?? product.batchNumber ?? null,
        expirationDate: input.expirationDate ?? product.expirationDate ?? null,
        previousBalance,
        updatedBalance,
        responsibleId: userId,
      },
    });

    await tx.product.update({
      where: { id: product.id },
      data: { currentQuantity: updatedBalance },
    });

    if (needsAuthorization && input.authorization) {
      await tx.restrictedAuthorization.create({
        data: {
          status: 'APROVADO',
          reason: input.authorization.reason,
          digitalSignature: input.authorization.digitalSignature,
          authorizedAt: new Date(),
          productId: product.id,
          requesterId: userId,
          approverId: input.authorization.approverId,
          movementId: movement.id,
        },
      });
    }

    return movement;
  });

  await audit({
    action: 'MOVIMENTACAO',
    userId,
    entity: 'Movement',
    entityId: result.id,
    description: `${input.type} de ${input.quantity} ${input.unit} - ${product.name}`,
    metadata: {
      productId: product.id,
      type: input.type,
      previousBalance,
      updatedBalance,
      restricted: needsAuthorization,
    },
    ip,
    userAgent,
  });

  if (needsAuthorization) {
    await audit({
      action: 'APROVACAO',
      userId,
      entity: 'RestrictedAuthorization',
      entityId: result.id,
      description: `Autorização de retirada de produto restrito: ${product.name}`,
      metadata: { approverId: input.authorization?.approverId },
      ip,
      userAgent,
    });
  }

  return result;
}
