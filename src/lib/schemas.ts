import { z } from 'zod'
import { EMAIL_REGEX, normalizarEmail } from './email'

// ============== Schemas de validação (zod) ==============
// Todos os endpoints POST/PUT usam estes schemas para validar input.
// Isto resolve C3 (validação de input) e adiciona validação de email.

// Helpers
const cuid = z.string().min(1).max(50)
const stringOpcional = z.string().trim().max(2000).nullable().optional()
// Email opcional: vazio/espaços → null; caso contrário tem de ter formato válido.
// Usado tanto na criação como na edição de membros.
const emailSchema = z.preprocess(
  normalizarEmail,
  z.string().max(255, 'Email demasiado longo').regex(EMAIL_REGEX, 'Email inválido').nullable().optional()
)

// Campos opcionais vindos de formulários: "" / espaços equivalem a "não preenchido" (null).
const vazioParaNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v)
const idOpcional = z.preprocess(vazioParaNull, z.string().min(1).max(50).nullable().optional())
const cargoOpcional = z.preprocess(vazioParaNull, z.string().trim().max(200).nullable().optional())

// ============== Área ==============
export const areaCreateSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(200, 'Nome demasiado longo'),
  descricao: stringOpcional,
  objectivos: stringOpcional,
})

export const areaUpdateSchema = areaCreateSchema

// ============== Membro ==============
export const membroCreateSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(200, 'Nome demasiado longo'),
  email: emailSchema,
  cargo: cargoOpcional,
  areaId: idOpcional,
})

// Update: mesmas regras de email que a criação; todos os campos opcionais
// (a associação parcial a uma área envia apenas areaId).
export const membroUpdateSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(200, 'Nome demasiado longo').optional(),
  email: emailSchema,
  cargo: cargoOpcional,
  areaId: idOpcional,
})

// Associação parcial (apenas areaId)
export const membroAssociateSchema = z.object({
  membroId: cuid,
  areaId: cuid,
})

// ID opcional: string vazia → null (formulários enviam "" quando "Sem responsável")
const idOpcionalNull = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
  z.string().min(1).max(50).nullable().optional()
)

// ============== Processo ==============
export const processoCreateSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(200),
  descricao: stringOpcional,
  tipo: z.enum(['Inbound', 'Outbound', 'Gestão'], { message: 'Tipo deve ser Inbound, Outbound ou Gestão' }),
  frequencia: z.enum(['Diária', 'Semanal', 'Mensal', 'Trimestral', 'Semestral', 'Anual', 'Programada'], {
    message: 'Frequência inválida',
  }),
  kpis: z.string().trim().max(5000).nullable().optional(),
  obrigacoes: z.string().trim().max(5000).nullable().optional(),
  areaId: cuid,
  responsavelId: idOpcionalNull,
  substitutoId: idOpcionalNull,
}).refine(
  (data) => !(data.responsavelId && data.substitutoId && data.responsavelId === data.substitutoId),
  { message: 'O responsável e o substituto não podem ser a mesma pessoa', path: ['substitutoId'] }
)

// Update: mesmo schema mas sem refine (a validação de resp≠subst é feita na API)
export const processoUpdateSchema = z.object({
  nome: z.string().trim().min(1).max(200),
  descricao: stringOpcional,
  tipo: z.enum(['Inbound', 'Outbound', 'Gestão']),
  frequencia: z.enum(['Diária', 'Semanal', 'Mensal', 'Trimestral', 'Semestral', 'Anual', 'Programada']),
  kpis: z.string().trim().max(5000).nullable().optional(),
  obrigacoes: z.string().trim().max(5000).nullable().optional(),
  areaId: cuid,
  responsavelId: idOpcionalNull,
  substitutoId: idOpcionalNull,
})

// ============== Actividade ==============
export const actividadeCreateSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(200),
  descricao: stringOpcional,
  frequencia: z.enum(['Diária', 'Semanal', 'Mensal', 'Trimestral', 'Semestral', 'Anual', 'Programada'], {
    message: 'Frequência inválida',
  }),
  processoId: cuid,
  responsavelId: idOpcionalNull,
  substitutoId: idOpcionalNull,
}).refine(
  (data) => !(data.responsavelId && data.substitutoId && data.responsavelId === data.substitutoId),
  { message: 'O responsável e o substituto não podem ser a mesma pessoa', path: ['substitutoId'] }
)

// Update: mesmo schema sem refine
export const actividadeUpdateSchema = z.object({
  nome: z.string().trim().min(1).max(200),
  descricao: stringOpcional,
  frequencia: z.enum(['Diária', 'Semanal', 'Mensal', 'Trimestral', 'Semestral', 'Anual', 'Programada']),
  processoId: cuid,
  responsavelId: idOpcionalNull,
  substitutoId: idOpcionalNull,
})

// ============== Tarefa ==============
export const tarefaCreateSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(200),
  descricao: stringOpcional,
  inputs: z.string().trim().min(1, 'Inputs são obrigatórios').max(2000),
  outputs: z.string().trim().min(1, 'Outputs são obrigatórios').max(2000),
  instrucoesNasFerramentas: z.boolean().optional().default(false),
  actividadeId: cuid,
  ferramentaIds: z.union([z.array(z.string()), z.string()]).optional(),
  procedimentos: z.array(z.object({
    descricao: z.string().trim().min(1).max(2000),
  })).max(100, 'Máximo 100 procedimentos').optional().default([]),
})

export const tarefaUpdateSchema = z.object({
  nome: z.string().trim().min(1).max(200),
  descricao: stringOpcional,
  inputs: z.string().trim().min(1).max(2000),
  outputs: z.string().trim().min(1).max(2000),
  instrucoesNasFerramentas: z.boolean().optional(),
  actividadeId: cuid,
  ferramentaIds: z.union([z.array(z.string()), z.string()]).optional(),
  procedimentos: z.array(z.object({
    descricao: z.string().trim().min(1).max(2000),
  })).max(100).optional(),
})

// ============== Ferramenta ==============
export const ferramentaCreateSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(200),
  descricao: stringOpcional,
})

export const ferramentaUpdateSchema = ferramentaCreateSchema

// ============== Import ==============
export const importSchema = z.object({
  data: z.object({
    areas: z.array(z.any()).max(1000, 'Máximo 1000 áreas').optional(),
    processos: z.array(z.any()).max(5000, 'Máximo 5000 processos').optional(),
    actividades: z.array(z.any()).max(10000, 'Máximo 10000 actividades').optional(),
    tarefas: z.array(z.any()).max(50000, 'Máximo 50000 tarefas').optional(),
    membros: z.array(z.any()).max(5000, 'Máximo 5000 membros').optional(),
    ferramentas: z.array(z.any()).max(1000, 'Máximo 1000 ferramentas').optional(),
    procedimentos: z.array(z.any()).max(100000, 'Máximo 100000 procedimentos').optional(),
  }),
  replace: z.boolean().optional().default(false),
})

// ============== Helper: validar e devolver erro formatado ==============
export function validateOrError<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  // Formatar erros zod em mensagem legível
  const firstError = result.error.issues[0]
  const message = firstError
    ? `${firstError.path.join('.')}: ${firstError.message}`
    : 'Dados inválidos'
  return { success: false, error: message }
}
