'use client'

import { useState, type ComponentType, type ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Building2, ChevronRight, ChevronDown, Search, Crown, Briefcase, Shield,
  Workflow, Users, Plus, ChevronsDownUp, ChevronsUpDown, X, Landmark,
} from 'lucide-react'
import { Area } from '@/lib/types'
import { cn } from '@/lib/utils'
import { getAreaIcon } from '@/lib/area-icons'

// ============== Estrutura do organograma ==============
// Comissão Executiva
//  ├─ Administrador Comercial → Áreas Comerciais
//  ├─ Presidente              → Áreas Corporativas
//  ├─ Administrador Técnico   → Áreas Técnicas
//  └─ Áreas de Controlo (reportam directamente à Comissão Executiva)

interface Tone {
  solid: string
  soft: string
  border: string
  text: string
  hover: string
}

interface Grupo {
  id: string
  titulo: string
  subtitulo: string
  icon: ComponentType<{ className?: string }>
  tone: Tone
  areaNomes: string[]
}

const TONES = {
  sky: {
    solid: 'bg-sky-600',
    soft: 'bg-sky-50 dark:bg-sky-950/40',
    border: 'border-sky-200 dark:border-sky-900',
    text: 'text-sky-700 dark:text-sky-300',
    hover: 'hover:border-sky-400 dark:hover:border-sky-600',
  },
  amber: {
    solid: 'bg-amber-600',
    soft: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-900',
    text: 'text-amber-700 dark:text-amber-300',
    hover: 'hover:border-amber-400 dark:hover:border-amber-600',
  },
  violet: {
    solid: 'bg-violet-600',
    soft: 'bg-violet-50 dark:bg-violet-950/40',
    border: 'border-violet-200 dark:border-violet-900',
    text: 'text-violet-700 dark:text-violet-300',
    hover: 'hover:border-violet-400 dark:hover:border-violet-600',
  },
  rose: {
    solid: 'bg-rose-600',
    soft: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-900',
    text: 'text-rose-700 dark:text-rose-300',
    hover: 'hover:border-rose-400 dark:hover:border-rose-600',
  },
  slate: {
    solid: 'bg-slate-500',
    soft: 'bg-slate-50 dark:bg-slate-900/40',
    border: 'border-slate-200 dark:border-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    hover: 'hover:border-slate-400 dark:hover:border-slate-600',
  },
} satisfies Record<string, Tone>

const GRUPOS: Grupo[] = [
  {
    id: 'comercial',
    titulo: 'Administrador Comercial',
    subtitulo: 'Áreas Comerciais',
    icon: Briefcase,
    tone: TONES.sky,
    areaNomes: ['Corretagem', 'Mediação', 'Banca', 'Directos e Institucionais', 'Inovação Comercial', 'Academia Comercial'],
  },
  {
    id: 'corporativas',
    titulo: 'Presidente',
    subtitulo: 'Áreas Corporativas',
    icon: Landmark,
    tone: TONES.amber,
    areaNomes: ['Jurídico e Legal', 'Gestão de Investimentos', 'Marketing e Comunicação', 'Org. Inf. Tecnologias', 'Recursos Humanos e Admin'],
  },
  {
    id: 'tecnicas',
    titulo: 'Administrador Técnico',
    subtitulo: 'Áreas Técnicas',
    icon: Workflow,
    tone: TONES.violet,
    areaNomes: ['Subscrição e Gestão de Portfólio', 'Gestão de Operações', 'Gestão de Sinistros', 'Financeira e Cobranças', 'Contabilidade e Fiscalidade', 'Resseguro e Co-seguro', 'Actuariado, Plan e Reporting'],
  },
  {
    id: 'controlo',
    titulo: 'Áreas de Controlo',
    subtitulo: 'Reportam à Comissão Executiva',
    icon: Shield,
    tone: TONES.rose,
    areaNomes: ['Compliance Officer', 'Centro Reclamações / Conduta de Mercado', 'Provedor Cliente', 'Gestão de Riscos', 'Controlo Interno', 'Auditoria Interna'],
  },
]

const LINE = 'bg-slate-300 dark:bg-slate-700'

// ============== Pesquisa (sem distinção de maiúsculas nem acentos) ==============
const norm = (s: string) => s.normalize('NFC').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

function Highlight({ text, query }: { text: string; query: string }): ReactNode {
  const q = norm(query.trim())
  if (!q) return text
  const idx = norm(text).indexOf(q)
  if (idx < 0) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-primary/20 px-0.5 text-foreground">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  )
}

// ============== Vista principal ==============
export function OrganogramaView({
  areas, loading, onOpenArea, onCreateArea
}: {
  areas: Area[]
  loading: boolean
  onOpenArea: (id: string) => void
  onCreateArea: () => void
}) {
  const [search, setSearch] = useState('')
  const [recolhidos, setRecolhidos] = useState<Set<string>>(new Set())
  const pesquisa = search.trim()

  const matches = (a: Area) => !pesquisa || norm(a.nome).includes(norm(pesquisa))

  const grupos = GRUPOS.map(g => {
    const todas = g.areaNomes
      .map(nome => areas.find(a => a.nome === nome))
      .filter((a): a is Area => !!a)
    return {
      ...g,
      todas,
      areas: todas.filter(matches),
      processos: todas.reduce((n, a) => n + (a._count?.processos ?? 0), 0),
      membros: todas.reduce((n, a) => n + (a._count?.membros ?? 0), 0),
    }
  })

  const nomesPadrao = new Set(GRUPOS.flatMap(g => g.areaNomes))
  const areasSemGrupo = areas.filter(a => !nomesPadrao.has(a.nome) && matches(a))

  const visiveis = grupos.filter(g => (pesquisa ? g.areas.length > 0 : true))
  const totalEncontrado = grupos.reduce((n, g) => n + g.areas.length, 0) + areasSemGrupo.length

  const totais = {
    areas: areas.length,
    processos: areas.reduce((n, a) => n + (a._count?.processos ?? 0), 0),
    membros: areas.reduce((n, a) => n + (a._count?.membros ?? 0), 0),
  }

  const todosRecolhidos = visiveis.length > 0 && visiveis.every(g => recolhidos.has(g.id))
  const alternar = (id: string) => setRecolhidos(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })
  const alternarTodos = () => setRecolhidos(todosRecolhidos ? new Set() : new Set(GRUPOS.map(g => g.id)))

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Organograma</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Estrutura organizacional da companhia. Clique numa área para ver os seus processos.
          </p>
        </div>
        <Button onClick={onCreateArea}>
          <Plus className="w-4 h-4 mr-2" /> Nova Área
        </Button>
      </div>

      {/* Resumo + pesquisa */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative w-full lg:max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar área..."
            aria-label="Pesquisar área"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-9 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Limpar pesquisa"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <Stat icon={Building2} label="áreas" value={totais.areas} />
          <Stat icon={Workflow} label="processos" value={totais.processos} />
          <Stat icon={Users} label="membros" value={totais.membros} />
          {!pesquisa && visiveis.length > 0 && (
            <Button variant="outline" size="sm" onClick={alternarTodos} className="h-8">
              {todosRecolhidos
                ? <><ChevronsUpDown className="w-3.5 h-3.5 mr-1.5" />Expandir tudo</>
                : <><ChevronsDownUp className="w-3.5 h-3.5 mr-1.5" />Recolher tudo</>}
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <TreeSkeleton />
      ) : totalEncontrado === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-semibold text-sm">Nenhuma área encontrada{pesquisa && ` para "${pesquisa}"`}</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Verifique a ortografia ou tente um termo mais geral.</p>
            {pesquisa && (
              <Button variant="outline" size="sm" onClick={() => setSearch('')}>Limpar pesquisa</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Árvore */}
          <div className="overflow-x-auto pb-2">
            <div className="md:min-w-[960px]">
              {/* Raiz: Comissão Executiva */}
              <div className="flex flex-col items-center">
                <div className="inline-flex items-center gap-2.5 rounded-xl bg-emerald-600 px-6 py-3 text-white shadow-md ring-4 ring-emerald-600/10">
                  <Crown className="w-5 h-5" />
                  <span className="text-sm font-semibold tracking-wide">Comissão Executiva</span>
                </div>
                <div className={cn('h-6 md:h-8 w-px', LINE)} />
              </div>

              {/* Ramos */}
              <div className="grid grid-cols-1 md:grid-cols-[repeat(var(--cols),minmax(0,1fr))]"
                   style={{ ['--cols' as string]: visiveis.length }}>
                {visiveis.map((g, i) => (
                  <Ramo
                    key={g.id}
                    grupo={g}
                    posicao={visiveis.length === 1 ? 'unico' : i === 0 ? 'primeiro' : i === visiveis.length - 1 ? 'ultimo' : 'meio'}
                    expandido={!!pesquisa || !recolhidos.has(g.id)}
                    onToggle={() => alternar(g.id)}
                    pesquisa={pesquisa}
                    onOpenArea={onOpenArea}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Áreas fora do organograma padrão */}
          {areasSemGrupo.length > 0 && (
            <section className="rounded-xl border border-dashed border-border p-4">
              <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold">
                <Building2 className="w-4 h-4 text-muted-foreground" /> Outras Áreas
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{areasSemGrupo.length}</span>
              </h3>
              <p className="mb-3 text-xs text-muted-foreground">Áreas criadas fora da estrutura padrão do organograma.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {areasSemGrupo.map(area => (
                  <AreaNode key={area.id} area={area} tone={TONES.slate} pesquisa={pesquisa} onClick={() => onOpenArea(area.id)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

// ============== Ramo (responsável + áreas) ==============
type GrupoVista = Grupo & { todas: Area[]; areas: Area[]; processos: number; membros: number }

function Ramo({
  grupo, posicao, expandido, onToggle, pesquisa, onOpenArea,
}: {
  grupo: GrupoVista
  posicao: 'unico' | 'primeiro' | 'meio' | 'ultimo'
  expandido: boolean
  onToggle: () => void
  pesquisa: string
  onOpenArea: (id: string) => void
}) {
  const Icon = grupo.icon
  const { tone } = grupo

  return (
    <div className="relative px-0 py-2 md:px-2 md:pt-10 md:pb-0">
      {/* Conectores até à raiz (apenas em ecrãs médios ou maiores) */}
      <span aria-hidden className={cn('absolute left-1/2 top-0 hidden h-10 w-px md:block', LINE)} />
      {posicao !== 'unico' && (
        <span
          aria-hidden
          className={cn(
            'absolute top-0 hidden h-px md:block', LINE,
            posicao === 'primeiro' && 'left-1/2 right-0',
            posicao === 'ultimo' && 'left-0 right-1/2',
            posicao === 'meio' && 'left-0 right-0',
          )}
        />
      )}

      {/* Nó do responsável */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expandido}
        disabled={!!pesquisa}
        className={cn(
          'group flex w-full items-center gap-3 rounded-xl border p-3 text-left shadow-xs transition-shadow hover:shadow-md disabled:cursor-default disabled:hover:shadow-xs',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          tone.soft, tone.border,
        )}
      >
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white shadow-sm', tone.solid)}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn('block truncate text-sm font-semibold', tone.text)}>{grupo.titulo}</span>
          <span className="block truncate text-[11px] text-muted-foreground">{grupo.subtitulo}</span>
          <span className="mt-1 flex items-center gap-2.5 text-[10px] text-muted-foreground tabular-nums">
            <span title="Áreas">{grupo.todas.length} áreas</span>
            <span aria-hidden>·</span>
            <span title="Processos">{grupo.processos} proc.</span>
            <span aria-hidden>·</span>
            <span title="Membros">{grupo.membros} memb.</span>
          </span>
        </span>
        {!pesquisa && (
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', !expandido && '-rotate-90')} />
        )}
      </button>

      {/* Áreas do ramo, ligadas por uma linha vertical */}
      {expandido && (
        grupo.areas.length === 0 ? (
          <p className="ml-7 py-2 pl-6 text-xs italic text-muted-foreground">Sem áreas</p>
        ) : (
          <ul className="ml-[30px]">
            {grupo.areas.map(area => (
              <li
                key={area.id}
                className={cn(
                  'relative pl-6 pt-2.5',
                  "before:absolute before:left-0 before:top-0 before:h-full before:w-px before:content-['']",
                  "before:bg-slate-300 dark:before:bg-slate-700 last:before:h-[1.875rem]",
                  "after:absolute after:left-0 after:top-[1.875rem] after:h-px after:w-5 after:content-['']",
                  'after:bg-slate-300 dark:after:bg-slate-700',
                )}
              >
                <AreaNode area={area} tone={tone} pesquisa={pesquisa} onClick={() => onOpenArea(area.id)} />
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  )
}

// ============== Nó de área (com ícone temático) ==============
function AreaNode({
  area, tone, pesquisa, onClick,
}: { area: Area; tone: Tone; pesquisa: string; onClick: () => void }) {
  const processos = area._count?.processos ?? 0
  const membros = area._count?.membros ?? 0
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative w-full overflow-hidden rounded-lg border border-border bg-card py-2.5 pl-4 pr-3 text-left shadow-xs transition-all',
        'hover:-translate-y-px hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        tone.hover,
      )}
    >
      <span aria-hidden className={cn('absolute inset-y-0 left-0 w-1', tone.solid)} />
      <span className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium leading-snug">
          <AreaIcon name={area.nome} className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
          <Highlight text={area.nome} query={pesquisa} />
        </span>
        <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
      </span>
      <span className="mt-1.5 flex items-center gap-3 text-[11px] tabular-nums text-muted-foreground">
        <span
          className={cn('flex items-center gap-1', processos === 0 && 'opacity-60')}
          title={processos === 0 ? 'Sem processos registados' : 'Processos'}
        >
          <Workflow className="h-3 w-3" />{processos}
        </span>
        <span className={cn('flex items-center gap-1', membros === 0 && 'opacity-60')} title="Membros">
          <Users className="h-3 w-3" />{membros}
        </span>
      </span>
    </button>
  )
}

function AreaIcon({ name, className }: { name: string; className?: string }) {
  const IconComp = getAreaIcon(name)
  // eslint-disable-next-line react-hooks/static-components
  return <IconComp className={className} />
}

// ============== Peças auxiliares ==============
function Stat({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      <strong className="font-semibold tabular-nums text-foreground">{value}</strong> {label}
    </span>
  )
}

function TreeSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center">
        <Skeleton className="h-12 w-56 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, c) => (
          <div key={c} className="space-y-2.5">
            <Skeleton className="h-[72px] w-full rounded-xl" />
            {Array.from({ length: 3 + (c % 3) }).map((_, i) => (
              <Skeleton key={i} className="ml-6 h-16 w-[calc(100%-1.5rem)] rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
