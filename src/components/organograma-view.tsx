'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Building2, ChevronRight, Search, Crown, Briefcase, Shield,
  Workflow, Users, Plus
} from 'lucide-react'
import { Area } from '@/lib/types'
import { cn } from '@/lib/utils'
import { getAreaIcon } from '@/lib/area-icons'

// Grupos de áreas conforme o organograma da empresa
interface GrupoOrganograma {
  id: string
  nome: string
  responsavel: string
  cargo: string
  icon: React.ComponentType<{ className?: string }>
  color: { bg: string; icon: string; text: string; border: string; accent: string }
  areaNomes: string[]
}

const GRUPOS: GrupoOrganograma[] = [
  {
    id: 'comercial',
    nome: 'Áreas Comerciais',
    responsavel: 'Administrador Comercial',
    cargo: 'Sob Administrador Comercial',
    icon: Briefcase,
    color: { bg: 'bg-slate-50', icon: 'bg-slate-600', text: 'text-slate-700', border: 'border-slate-200', accent: 'bg-slate-100' },
    areaNomes: ['Corretagem', 'Mediação', 'Banca', 'Directos e Institucionais', 'Inovação Comercial', 'Academia Comercial'],
  },
  {
    id: 'corporativas',
    nome: 'Áreas Corporativas',
    responsavel: 'Presidente',
    cargo: 'Sob Presidente',
    icon: Crown,
    color: { bg: 'bg-amber-50', icon: 'bg-amber-600', text: 'text-amber-700', border: 'border-amber-200', accent: 'bg-amber-100' },
    areaNomes: ['Jurídico e Legal', 'Gestão de Investimentos', 'Marketing e Comunicação', 'Org. Inf. Tecnologias', 'Recursos Humanos e Admin'],
  },
  {
    id: 'tecnicas',
    nome: 'Áreas Técnicas',
    responsavel: 'Administrador Técnico',
    cargo: 'Sob Administrador Técnico',
    icon: Workflow,
    color: { bg: 'bg-violet-50', icon: 'bg-violet-600', text: 'text-violet-700', border: 'border-violet-200', accent: 'bg-violet-100' },
    areaNomes: ['Subscrição e Gestão de Portfólio', 'Gestão de Operações', 'Gestão de Sinistros', 'Financeira e Cobranças', 'Contabilidade e Fiscalidade', 'Resseguro e Co-seguro', 'Actuariado, Plan e Reporting'],
  },
  {
    id: 'controlo',
    nome: 'Áreas de Controlo',
    responsavel: 'Comissão Executiva',
    cargo: 'Sob Comissão Executiva',
    icon: Shield,
    color: { bg: 'bg-rose-50', icon: 'bg-rose-600', text: 'text-rose-700', border: 'border-rose-200', accent: 'bg-rose-100' },
    areaNomes: ['Compliance Officer', 'Centro Reclamações / Conduta de Mercado', 'Provedor Cliente', 'Gestão de Riscos', 'Controlo Interno', 'Auditoria Interna'],
  },
]

export function OrganogramaView({
  areas, loading, onOpenArea, onCreateArea
}: {
  areas: Area[]
  loading: boolean
  onOpenArea: (id: string) => void
  onCreateArea: () => void
}) {
  const [search, setSearch] = useState('')

  // Para cada grupo, encontra as áreas correspondentes
  const gruposComAreas = GRUPOS.map(g => ({
    ...g,
    areas: g.areaNomes
      .map(nome => areas.find(a => a.nome === nome))
      .filter((a): a is Area => !!a)
      .filter(a => !search || a.nome.toLowerCase().includes(search.toLowerCase())),
  }))

  const totalFiltrado = gruposComAreas.reduce((acc, g) => acc + g.areas.length, 0)
  const areasSemGrupo = areas.filter(a =>
    !GRUPOS.some(g => g.areaNomes.includes(a.nome)) &&
    (!search || a.nome.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Organograma</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Estrutura organizacional da companhia. Clique numa área para ver os seus processos.
          </p>
        </div>
        <Button onClick={onCreateArea}>
          <Plus className="w-4 h-4 mr-2" /> Nova Área
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Pesquisar área..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-9 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {loading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="w-full h-24 rounded-lg" />
            ))}
          </div>
        </div>
      ) : totalFiltrado === 0 && areasSemGrupo.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-semibold text-sm">Nenhuma área encontrada{search && ` para "${search}"`}</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Verifique a ortografia ou tente um termo mais geral.</p>
            {search && (
              <Button variant="outline" size="sm" onClick={() => setSearch('')}>
                Limpar pesquisa
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Topo: Comissão Executiva */}
          <div className="flex justify-center">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white shadow-md">
                <Crown className="w-4 h-4" />
                <span className="text-sm font-semibold">Comissão Executiva</span>
              </div>
              <div className="w-px h-6 bg-border mx-auto mt-1" />
            </div>
          </div>

          {/* Ligações para os 3 administradores */}
          <div className="relative -mt-4 mb-2 hidden sm:block">
            <div className="absolute left-1/4 right-1/4 top-0 h-px bg-border" />
            <div className="absolute left-1/4 top-0 w-px h-4 bg-border" />
            <div className="absolute left-1/2 top-0 w-px h-4 bg-border" />
            <div className="absolute right-1/4 top-0 w-px h-4 bg-border" />
          </div>

          {/* Grupos em grid de 3 colunas (Comercial | Presidente | Técnico) + Controlo em baixo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {gruposComAreas.filter(g => g.id !== 'controlo').map(grupo => (
              <GrupoColumn key={grupo.id} grupo={grupo} onOpenArea={onOpenArea} />
            ))}
          </div>

          {/* Controlo - ligação directa à Comissão Executiva */}
          <div className="relative">
            <div className="hidden sm:block w-px h-6 bg-border mx-auto -mt-4 mb-2" />
            <div className="flex justify-center mb-2">
              <span className="text-[11px] text-muted-foreground italic">reporta directamente à Comissão Executiva</span>
            </div>
            {(() => {
              const grupoControlo = gruposComAreas.find(g => g.id === 'controlo')!
              return <GrupoColumn grupo={grupoControlo} onOpenArea={onOpenArea} fullWidth />
            })()}
          </div>

          {/* Áreas sem grupo (criadas pelo utilizador, fora do organograma padrão) */}
          {areasSemGrupo.length > 0 && (
            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Outras Áreas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {areasSemGrupo.map(area => (
                  <AreaTile key={area.id} area={area} onClick={() => onOpenArea(area.id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function GrupoColumn({
  grupo, onOpenArea, fullWidth
}: {
  grupo: GrupoOrganograma & { areas: Area[] }
  onOpenArea: (id: string) => void
  fullWidth?: boolean
}) {
  const Icon = grupo.icon
  return (
    <div className={cn("flex flex-col", fullWidth && "max-w-3xl mx-auto w-full")}>
      {/* Cabeçalho do grupo (Administrador) */}
      <div className={cn("rounded-lg border p-3 flex items-center gap-2.5 mb-3", grupo.color.border, grupo.color.bg)}>
        <div className={cn("w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0", grupo.color.icon)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className={cn("text-xs font-semibold truncate", grupo.color.text)}>{grupo.responsavel}</p>
          <p className="text-[10px] text-muted-foreground">{grupo.cargo}</p>
        </div>
      </div>

      {/* Áreas do grupo */}
      {grupo.areas.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-2">Sem áreas</p>
      ) : (
        <div className={cn(
          "grid gap-2",
          fullWidth ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1"
        )}>
          {grupo.areas.map((area, idx) => (
            <AreaTile key={area.id} area={area} onClick={() => onOpenArea(area.id)} index={idx} borderColor={grupo.color.border} />
          ))}
        </div>
      )}
    </div>
  )
}

function AreaIcon({ name, className }: { name: string; className?: string }) {
  const IconComp = getAreaIcon(name)
  // eslint-disable-next-line react-hooks/static-components
  return <IconComp className={className} />
}

function AreaTile({ area, onClick, index = 0, borderColor }: { area: Area; onClick: () => void; index?: number; borderColor?: string }) {
  const procCount = area._count?.processos ?? 0
  const membCount = area._count?.membros ?? 0
  // Mapear cores do grupo para classes de border-l
  const borderClass = borderColor?.includes('slate') ? 'border-l-slate-400'
    : borderColor?.includes('amber') ? 'border-l-amber-400'
    : borderColor?.includes('violet') ? 'border-l-violet-400'
    : borderColor?.includes('rose') ? 'border-l-rose-400'
    : 'border-l-primary'
  return (
    <button
      onClick={onClick}
      className={cn("group text-left p-2.5 rounded-lg border border-border border-l-4 bg-card hover:shadow-md hover:-translate-y-0.5 transition-all", borderClass)}
    >
      <div className="flex items-center gap-2">
        <AreaIcon name={area.nome} className="w-4 h-4 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="text-sm font-medium truncate flex-1">{area.nome}</span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </div>
      {(procCount > 0 || membCount > 0) && (
        <div className="flex gap-2 mt-1 ml-6 text-[11px] text-muted-foreground">
          {procCount > 0 && <span className="flex items-center gap-0.5"><Workflow className="w-2.5 h-2.5" />{procCount}</span>}
          {membCount > 0 && <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" />{membCount}</span>}
        </div>
      )}
    </button>
  )
}
