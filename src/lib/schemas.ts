import { z } from 'zod'

// ============== Schemas de validação (zod) ==============
// Todos os endpoints POST/PUT usam estes schemas para validar input.
// Isto resolve C3 (validação de input) e adiciona validação de email.

// Helpers
const cuid = z.string().min(1).max(50)
const stringOpcional = z.string().trim().max(2000).nullable().optional()
const emailSchema = z.string().trim().email('Email inválido').max(255).nullable().optional()

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
  cargo: z.string().trim().max(200).nullable().optional(),
  areaId: z.string().min(1).nullable().optional(),
}).refine(
  (data) => !data.email || data.email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
  { message: 'Email inválido', path: ['email'] }
)

// Update: sem refine
export const membroUpdateSchema = z.object({
  nome: z.string().trim().min(1).max(200).optional(),
  email: emailSchema,
  cargo: z.string().trim().max(200).nullable().optional(),
  areaId: z.string().min(1).nullable().optional(),
})

// Associação parcial (apenas areaId)
export const membroAssociateSchema = z.object({
  membroId: cuid,
  areaId: cuid,
})

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
  responsavelId: z.string().min(1).nullable().optional(),
  substitutoId: z.string().min(1).nullable().optional(),
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
  responsavelId: z.string().min(1).nullable().optional(),
  substitutoId: z.string().min(1).nullable().optional(),
})

// ============== Actividade ==============
export const actividadeCreateSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(200),
  descricao: stringOpcional,
  frequencia: z.enum(['Diária', 'Semanal', 'Mensal', 'Trimestral', 'Semestral', 'Anual', 'Programada'], {
    message: 'Frequência inválida',
  }),
  processoId: cuid,
  responsavelId: z.string().min(1).nullable().optional(),
  substitutoId: z.string().min(1).nullable().optional(),
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
  responsavelId: z.string().min(1).nullable().optional(),
  substitutoId: z.string().min(1).nullable().optional(),
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
