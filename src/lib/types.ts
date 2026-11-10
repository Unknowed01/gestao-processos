// Tipos partilhados pelo sistema

export interface Area {
  id: string
  nome: string
  descricao?: string | null
  objectivos?: string | null
  createdAt: string
  updatedAt: string
  _count?: { processos: number; membros: number; ferramentas: number }
}

export interface Membro {
  id: string
  nome: string
  email?: string | null
  cargo?: string | null
  areaId?: string | null
  area?: { id: string; nome: string } | null
  createdAt: string
  updatedAt: string
  _count?: {
    procResp: number
    procSubst: number
    actResp: number
    actSubst: number
  }
}

export interface Processo {
  id: string
  nome: string
  descricao?: string | null
  tipo: string
  frequencia: string
  areaId: string
  area?: { id: string; nome: string } | null
  responsavelId?: string | null
  responsavel?: { id: string; nome: string } | null
  substitutoId?: string | null
  substituto?: { id: string; nome: string } | null
  createdAt: string
  updatedAt: string
  _count?: { actividades: number }
}

export interface Actividade {
  id: string
  nome: string
  descricao?: string | null
  frequencia: string
  processoId: string
  processo?: {
    id: string
    nome: string
    area: { id: string; nome: string } | null
  } | null
  responsavelId?: string | null
  responsavel?: { id: string; nome: string } | null
  substitutoId?: string | null
  substituto?: { id: string; nome: string } | null
  createdAt: string
  updatedAt: string
  _count?: { tarefas: number }
}

export interface Procedimento {
  id: string
  passo: number
  descricao: string
  tarefaId: string
}

export interface Tarefa {
  id: string
  nome: string
  descricao?: string | null
  inputs: string
  outputs: string
  ferramentaIds: string
  actividadeId: string
  actividade?: {
    id: string
    nome: string
    processo: {
      id: string
      nome: string
      area: { id: string; nome: string } | null
    } | null
  } | null
  procedimentos?: Procedimento[]
  createdAt: string
  updatedAt: string
}

export interface Ferramenta {
  id: string
  nome: string
  descricao?: string | null
  areaId?: string | null
  area?: { id: string; nome: string } | null
  createdAt: string
}

export interface DashboardData {
  counts: {
    areas: number
    processos: number
    actividades: number
    tarefas: number
    membros: number
    ferramentas: number
  }
  tarefasRecentes: Array<{
    id: string
    nome: string
    inputs: string
    outputs: string
    createdAt: string
    actividade: {
      nome: string
      processo: {
        nome: string
        area: { nome: string } | null
      } | null
    }
  }>
  processosPorTipo: Array<{ tipo: string; _count: number }>
}

export const TIPOS_PROCESSO = ['Inbound', 'Outbound', 'Gestão'] as const
export const FREQUENCIAS = ['Diária', 'Semanal', 'Mensal', 'Trimestral', 'Semestral', 'Anual', 'Programada'] as const

export const TIPO_COLORS: Record<string, string> = {
  Inbound: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Outbound: 'bg-orange-100 text-orange-800 border-orange-200',
  'Gestão': 'bg-violet-100 text-violet-800 border-violet-200',
}

export const FREQ_COLORS: Record<string, string> = {
  'Diária': 'bg-rose-100 text-rose-800',
  'Semanal': 'bg-amber-100 text-amber-800',
  'Mensal': 'bg-sky-100 text-sky-800',
  'Trimestral': 'bg-violet-100 text-violet-800',
  'Semestral': 'bg-teal-100 text-teal-800',
  'Anual': 'bg-fuchsia-100 text-fuchsia-800',
  'Programada': 'bg-slate-100 text-slate-800',
}
