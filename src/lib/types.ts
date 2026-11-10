// Tipos partilhados pelo sistema

export interface Area {
  id: string
  nome: string
  descricao?: string | null
  objectivos?: string | null
  createdAt: string
  updatedAt: string
  _count?: { processos: number; membros: number }
}

// Área com detalhes completos (visão de detalhe)
export interface AreaDetalhe extends Area {
  processos?: Processo[]
  membros?: Membro[]
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
  kpis?: string | null
  obrigacoes?: string | null
  areaId: string
  area?: { id: string; nome: string } | null
  responsavelId?: string | null
  responsavel?: { id: string; nome: string; cargo?: string | null } | null
  substitutoId?: string | null
  substituto?: { id: string; nome: string; cargo?: string | null } | null
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
    tipo?: string
    frequencia?: string
    area: { id: string; nome: string } | null
  } | null
  responsavelId?: string | null
  responsavel?: { id: string; nome: string; cargo?: string | null } | null
  substitutoId?: string | null
  substituto?: { id: string; nome: string; cargo?: string | null } | null
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
  instrucoesNasFerramentas: boolean
  ferramentaIds: string
  actividadeId: string
  actividade?: {
    id: string
    nome: string
    processo: {
      id: string
      nome: string
      tipo?: string
      area: { id: string; nome: string } | null
    } | null
  } | null
  procedimentos?: Procedimento[]
  _count?: { procedimentos: number }
  dataRevisao: string
  createdAt: string
  updatedAt: string
}

export interface Ferramenta {
  id: string
  nome: string
  descricao?: string | null
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
    instrucoesNasFerramentas: boolean
    createdAt: string
    actividade: {
      id: string
      nome: string
      processo: {
        id: string
        nome: string
        tipo: string
        area: { id: string; nome: string } | null
      } | null
    }
  }>
  processosPorTipo: Array<{ tipo: string; _count: number }>
  processosPorFreq: Array<{ frequencia: string; _count: number }>
  areasComContagem: Array<{
    id: string
    nome: string
    objectivos?: string | null
    _count: { processos: number; membros: number; ferramentas: number }
  }>
}

export const TIPOS_PROCESSO = ['Inbound', 'Outbound', 'Gestão'] as const
export const FREQUENCIAS = ['Diária', 'Semanal', 'Mensal', 'Trimestral', 'Semestral', 'Anual', 'Programada'] as const

export const TIPO_COLORS: Record<string, string> = {
  Inbound: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Outbound: 'bg-orange-100 text-orange-800 border-orange-200',
  'Gestão': 'bg-violet-100 text-violet-800 border-violet-200',
}

export const TIPO_DOT: Record<string, string> = {
  Inbound: 'bg-emerald-500',
  Outbound: 'bg-orange-500',
  'Gestão': 'bg-violet-500',
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

// Cores para as áreas (palette elegante)
export const AREA_COLORS = [
  { bg: 'bg-emerald-50', icon: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200' },
  { bg: 'bg-orange-50', icon: 'bg-orange-500', text: 'text-orange-700', border: 'border-orange-200' },
  { bg: 'bg-violet-50', icon: 'bg-violet-500', text: 'text-violet-700', border: 'border-violet-200' },
  { bg: 'bg-sky-50', icon: 'bg-sky-500', text: 'text-sky-700', border: 'border-sky-200' },
  { bg: 'bg-rose-50', icon: 'bg-rose-500', text: 'text-rose-700', border: 'border-rose-200' },
  { bg: 'bg-teal-50', icon: 'bg-teal-500', text: 'text-teal-700', border: 'border-teal-200' },
  { bg: 'bg-amber-50', icon: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-200' },
  { bg: 'bg-fuchsia-50', icon: 'bg-fuchsia-500', text: 'text-fuchsia-700', border: 'border-fuchsia-200' },
]

export function getAreaColor(index: number) {
  return AREA_COLORS[index % AREA_COLORS.length]
}

// Formata data de revisão de forma subtil e relativa
export function formatDataRevisao(dataIso: string): string {
  const data = new Date(dataIso)
  return data.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
