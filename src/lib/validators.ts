import { z } from 'zod';

const unitEnum = z.enum([
  'UN',
  'L',
  'ML',
  'KG',
  'G',
  'MG',
  'M3',
  'CX',
  'GL',
  'FR',
]);

// ----------------------------------------------------------------------------
// Autenticação
// ----------------------------------------------------------------------------

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(1, 'Senha obrigatória.'),
});

// ----------------------------------------------------------------------------
// Usuários
// ----------------------------------------------------------------------------

export const createUserSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório.'),
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(6, 'A senha deve ter ao menos 6 caracteres.'),
  role: z.enum(['ADMINISTRADOR', 'SUPERVISOR', 'OPERADOR', 'CONSULTA']),
  rank: z.string().optional(),
  registration: z.string().optional(),
  omId: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

export const updateUserSchema = createUserSchema.partial().extend({
  password: z
    .string()
    .min(6, 'A senha deve ter ao menos 6 caracteres.')
    .optional(),
});

// ----------------------------------------------------------------------------
// Produtos
// ----------------------------------------------------------------------------

export const productSchema = z.object({
  internalCode: z.string().min(1, 'Código interno obrigatório.'),
  name: z.string().min(2, 'Nome obrigatório.'),
  description: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  unit: unitEnum.default('UN'),
  minStock: z.coerce.number().min(0).default(0),
  maxStock: z.coerce.number().min(0).default(0),
  currentQuantity: z.coerce.number().min(0).default(0),
  casNumber: z.string().optional().nullable(),
  isChemical: z.boolean().default(true),
  isRestricted: z.boolean().default(false),
  requiresAuth: z.boolean().default(false),
  fispqPdfUrl: z.string().optional().nullable(),
  expirationDate: z.coerce.date().optional().nullable(),
  batchNumber: z.string().optional().nullable(),
  physicalLocation: z.string().optional().nullable(),
  stockId: z.string().optional().nullable(),
  status: z.enum(['ATIVO', 'INATIVO']).default('ATIVO'),
});

export const updateProductSchema = productSchema.partial();

// ----------------------------------------------------------------------------
// Movimentações
// ----------------------------------------------------------------------------

export const movementSchema = z.object({
  type: z.enum(['ENTRADA', 'SAIDA', 'RETORNO']),
  productId: z.string().min(1, 'Produto obrigatório.'),
  stockId: z.string().optional().nullable(),
  unit: unitEnum,
  quantity: z.coerce.number().positive('Quantidade deve ser maior que zero.'),
  omId: z.string().optional().nullable(),
  applicationSite: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  batchNumber: z.string().optional().nullable(),
  expirationDate: z.coerce.date().optional().nullable(),
  // Campos de autorização (apenas para produtos restritos)
  authorization: z
    .object({
      reason: z.string().min(3, 'Motivo da retirada obrigatório.'),
      digitalSignature: z.string().min(2, 'Assinatura digital obrigatória.'),
      approverId: z.string().min(1, 'Responsável autorizador obrigatório.'),
    })
    .optional(),
});

// ----------------------------------------------------------------------------
// Estoques (Stock) e OMs e Categorias
// ----------------------------------------------------------------------------

export const stockSchema = z.object({
  code: z.string().min(1, 'Código do estoque obrigatório.'),
  name: z.string().min(2, 'Nome obrigatório.'),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  active: z.boolean().default(true),
});

export const omSchema = z.object({
  code: z.string().min(1, 'Sigla obrigatória.'),
  name: z.string().min(2, 'Nome obrigatório.'),
  active: z.boolean().default(true),
});

export const categorySchema = z.object({
  name: z.string().min(2, 'Nome obrigatório.'),
  description: z.string().optional().nullable(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type MovementInput = z.infer<typeof movementSchema>;
