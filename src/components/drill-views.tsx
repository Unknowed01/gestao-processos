'use client'

import {
  ChevronRight, Plus, Trash2, Loader2, Mail, Building2, Workflow,
  Activity, ListChecks, Users, Wrench, Target, ArrowLeft, UserCheck,
  ArrowDownToLine, ArrowUpFromLine, ListOrdered, Calendar, CircleDot,
  Pencil, MoreVertical, Scale, CheckCircle2, Circle, Clock
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
  Area, AreaDetalhe, Membro, Processo, Actividade, Tarefa, Ferramenta,
  TIPO_COLORS, TIPO_DOT, FREQ_COLORS, formatDataRevisao
} from '@/lib/types'
import { cn } from '@/lib/utils'

/* ============== Breadcrumb de drill-down ============== */
export interface BreadcrumbItem {
  label: string
  level: 'areas' | 'area' | 'processo' | 'actividade' | 'tarefa'
  id?: string
}

export function DrillBreadcrumb({
  items, onNavigate
}: {
  items: BreadcrumbItem[]
  onNavigate: (item: BreadcrumbItem, index: number) => void
}) {
  return (
    <nav className="flex items-center gap-1 text-sm flex-wrap mb-6">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1
        return (
          <div key={idx} className="flex items-center gap-1">
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />}
            <button
              onClick={() => !isLast && onNavigate(item, idx)}
              disabled={isLast}
              className={cn(
                "px-2 py-1 rounded-md transition-colors",
                isLast
                  ? "font-semibold text-foreground bg-muted/60 cursor-default"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {item.label}
            </button>
          </div>
        )
      })}
    </nav>
  )
}

/* ============== Detalhe de Área ============== */
export function AreaDetailView({
  areaId, area, loading, onOpenProcesso, onBack, onRefresh,
  onEditArea, onDeleteArea, onEditProcesso, onDeleteProcesso,
  onEditMembro, onDeleteMembro
}: {
  areaId: string
  area: AreaDetalhe | null
  loading: boolean
  onOpenProcesso: (id: string) => void
  onBack: () => void
  onRefresh: () => void
  onEditArea: () => void
  onDeleteArea: () => void
  onEditProcesso: (p: Processo) => void
  onDeleteProcesso: (p: Processo) => void
  onEditMembro: (m: Membro) => void
  onDeleteMembro: (m: Membro) => void
}) {
  const [search, setSearch] = useState('')
  const processos = area?.processos ?? []
  const membros = area?.membros ?? []

  const filteredProcessos = processos.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  )

  if (loading && !area) {
    return (
      <div className="flex flex-col items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">A carregar área...</p>
      </div>
    )
  }
  if (!area) {
    return <div className="text-center py-20 text-muted-foreground">Área não encontrada.</div>
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da área */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>Área Organizacional</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{area.nome}</h1>
          {area.descricao && <p className="text-muted-foreground mt-1 text-sm max-w-3xl">{area.descricao}</p>}
        </div>
        <EntityMenu onEdit={onEditArea} onDelete={onDeleteArea} />
      </div>

      <Tabs defaultValue="processos">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="processos" className="text-xs sm:text-sm">
            <Workflow className="w-3.5 h-3.5 mr-1.5" />Processos
            <Badge variant="secondary" className="ml-1.5 text-[10px] py-0">{processos.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="equipa" className="text-xs sm:text-sm">
            <Users className="w-3.5 h-3.5 mr-1.5" />Equipa
            <Badge variant="secondary" className="ml-1.5 text-[10px] py-0">{membros.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="objectivos" className="text-xs sm:text-sm">
            <Target className="w-3.5 h-3.5 mr-1.5" />Objectivos
          </TabsTrigger>
        </TabsList>

        {/* Processos */}
        <TabsContent value="processos" className="space-y-4 mt-4">
          {processos.length > 0 && (
            <div className="relative max-w-md">
              <Input
                placeholder="Pesquisar processo nesta área..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          )}
          {filteredProcessos.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <Workflow className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {processos.length === 0 ? "Nenhum processo nesta área ainda." : "Nenhum processo encontrado."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredProcessos.map((p) => (
                <ProcessoCard
                  key={p.id}
                  processo={p}
                  onClick={() => onOpenProcesso(p.id)}
                  onEdit={() => onEditProcesso(p)}
                  onDelete={() => onDeleteProcesso(p)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Equipa */}
        <TabsContent value="equipa" className="mt-4">
          {membros.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum membro associado a esta área.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {membros.map((m) => (
                <MembroCard
                  key={m.id}
                  membro={m}
                  onEdit={() => onEditMembro(m)}
                  onDelete={() => onDeleteMembro(m)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Objectivos */}
        <TabsContent value="objectivos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Objectivos da Área
              </CardTitle>
              <CardDescription className="text-xs">Metas e objectivos estratégicos desta área.</CardDescription>
            </CardHeader>
            <CardContent>
              {area.objectivos ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{area.objectivos}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Nenhum objectivo definido para esta área.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* ============== Card de Processo ============== */
function ProcessoCard({
  processo, onClick, onEdit, onDelete
}: {
  processo: Processo
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="group relative">
      <button onClick={onClick} className="group/card text-left w-full">
        <Card className="h-full hover:shadow-md hover:border-primary/40 transition-all">
          <CardHeader className="pb-2 pr-10">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="outline" className={cn("text-[10px] py-0", TIPO_COLORS[processo.tipo])}>
                  <span className={cn("w-1.5 h-1.5 rounded-full mr-1", TIPO_DOT[processo.tipo])} />
                  {processo.tipo}
                </Badge>
                <Badge variant="secondary" className={cn("text-[10px] py-0", FREQ_COLORS[processo.frequencia])}>
                  <Calendar className="w-2.5 h-2.5 mr-0.5" />{processo.frequencia}
                </Badge>
              </div>
            </div>
            <CardTitle className="text-sm mt-2 leading-tight">{processo.nome}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {processo.descricao && (
              <p className="text-xs text-muted-foreground line-clamp-2">{processo.descricao}</p>
            )}
            <Separator />
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <UserCheck className="w-3 h-3" />
                  <span className="truncate max-w-[80px]">{processo.responsavel?.nome || '—'}</span>
                </div>
              </div>
              <Badge variant="secondary" className="text-[10px] py-0">
                {processo._count?.actividades ?? 0} act.
              </Badge>
            </div>
          </CardContent>
        </Card>
      </button>
      <div className="absolute top-2 right-2 z-10">
        <EntityMenu onEdit={onEdit} onDelete={onDelete} small />
      </div>
    </div>
  )
}

/* ============== Card de Membro ============== */
function MembroCard({
  membro, onEdit, onDelete
}: {
  membro: Membro
  onEdit: () => void
  onDelete: () => void
}) {
  const iniciais = membro.nome.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
  const totalResp = (membro._count?.procResp ?? 0) + (membro._count?.actResp ?? 0)
  const totalSub = (membro._count?.procSubst ?? 0) + (membro._count?.actSubst ?? 0)
  return (
    <Card className="group relative">
      <CardContent className="p-4 pr-10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center font-semibold text-xs flex-shrink-0">
            {iniciais}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{membro.nome}</h3>
            {membro.cargo && <p className="text-xs text-muted-foreground truncate">{membro.cargo}</p>}
            {membro.email && (
              <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
                <Mail className="w-3 h-3" />
                <span className="truncate">{membro.email}</span>
              </div>
            )}
            {(totalResp > 0 || totalSub > 0) && (
              <div className="flex items-center gap-2 mt-2 text-[10px]">
                {totalResp > 0 && (
                  <Badge variant="outline" className="text-[10px] py-0 bg-emerald-50">
                    <UserCheck className="w-2.5 h-2.5 mr-0.5" />{totalResp} resp.
                  </Badge>
                )}
                {totalSub > 0 && (
                  <Badge variant="outline" className="text-[10px] py-0 bg-amber-50">
                    {totalSub} substit.
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <div className="absolute top-2 right-2 z-10">
        <EntityMenu onEdit={onEdit} onDelete={onDelete} small />
      </div>
    </Card>
  )
}

/* ============== Detalhe de Processo ============== */
export function ProcessoDetailView({
  processo, loading, onOpenActividade, onBack, areaName,
  onEdit, onDelete, onEditActividade, onDeleteActividade
}: {
  processo: (Processo & { actividades?: Actividade[] }) | null
  loading: boolean
  onOpenActividade: (id: string) => void
  onBack: () => void
  areaName?: string
  onEdit: () => void
  onDelete: () => void
  onEditActividade: (a: Actividade) => void
  onDeleteActividade: (a: Actividade) => void
}) {
  const actividades = processo?.actividades ?? []

  if (loading && !processo) {
    return (
      <div className="flex flex-col items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">A carregar processo...</p>
      </div>
    )
  }
  if (!processo) {
    return <div className="text-center py-20 text-muted-foreground">Processo não encontrado.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <CircleDot className="w-3.5 h-3.5" />
            <span>{areaName || processo.area?.nome} · Processo</span>
          </div>
          <div className="flex items-start gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{processo.nome}</h1>
            <Badge variant="outline" className={cn("mt-1.5", TIPO_COLORS[processo.tipo])}>
              <span className={cn("w-1.5 h-1.5 rounded-full mr-1", TIPO_DOT[processo.tipo])} />
              {processo.tipo}
            </Badge>
            <Badge variant="secondary" className={cn("mt-1.5", FREQ_COLORS[processo.frequencia])}>
              <Calendar className="w-3 h-3 mr-1" />{processo.frequencia}
            </Badge>
          </div>
          {processo.descricao && <p className="text-muted-foreground mt-2 text-sm max-w-3xl">{processo.descricao}</p>}
        </div>
        <EntityMenu onEdit={onEdit} onDelete={onDelete} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Responsável</p>
              <p className="text-sm font-medium truncate">{processo.responsavel?.nome || 'Não atribuído'}</p>
              {processo.responsavel?.cargo && <p className="text-xs text-muted-foreground truncate">{processo.responsavel.cargo}</p>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Substituto</p>
              <p className="text-sm font-medium truncate">{processo.substituto?.nome || 'Não atribuído'}</p>
              {processo.substituto?.cargo && <p className="text-xs text-muted-foreground truncate">{processo.substituto.cargo}</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPIs e Obrigações regulamentares */}
      {(processo.kpis || processo.obrigacoes) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {processo.kpis && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-primary">
                  <Target className="w-4 h-4" />
                  KPIs do Processo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{processo.kpis}</p>
              </CardContent>
            </Card>
          )}
          {processo.obrigacoes && (
            <Card className="border-rose-200 bg-rose-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-rose-700">
                  <Scale className="w-4 h-4" />
                  Obrigações Regulamentares
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{processo.obrigacoes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Actividades do Processo
          </h2>
          <Badge variant="secondary">{actividades.length}</Badge>
        </div>
        {actividades.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center">
              <Activity className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma actividade neste processo.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {actividades.map((a) => (
              <ActividadeCard
                key={a.id}
                actividade={a}
                onClick={() => onOpenActividade(a.id)}
                onEdit={() => onEditActividade(a)}
                onDelete={() => onDeleteActividade(a)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ============== Card de Actividade ============== */
function ActividadeCard({
  actividade, onClick, onEdit, onDelete
}: {
  actividade: Actividade
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="group relative">
      <button onClick={onClick} className="group/card text-left w-full">
        <Card className="h-full hover:shadow-md hover:border-primary/40 transition-all">
          <CardHeader className="pb-2 pr-10">
            <div className="flex items-start justify-between gap-2">
              <Badge variant="secondary" className={cn("text-[10px] py-0", FREQ_COLORS[actividade.frequencia])}>
                <Calendar className="w-2.5 h-2.5 mr-0.5" />{actividade.frequencia}
              </Badge>
            </div>
            <CardTitle className="text-sm mt-2 leading-tight">{actividade.nome}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {actividade.descricao && (
              <p className="text-xs text-muted-foreground line-clamp-2">{actividade.descricao}</p>
            )}
            <Separator />
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1 text-muted-foreground min-w-0">
                <UserCheck className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{actividade.responsavel?.nome || '—'}</span>
              </div>
              <Badge variant="secondary" className="text-[10px] py-0">
                {actividade._count?.tarefas ?? 0} tarefas
              </Badge>
            </div>
          </CardContent>
        </Card>
      </button>
      <div className="absolute top-2 right-2 z-10">
        <EntityMenu onEdit={onEdit} onDelete={onDelete} small />
      </div>
    </div>
  )
}

/* ============== Detalhe de Actividade ============== */
export function ActividadeDetailView({
  actividade, loading, onOpenTarefa, onBack, processoName,
  onEdit, onDelete, onEditTarefa, onDeleteTarefa
}: {
  actividade: (Actividade & { tarefas?: Tarefa[] }) | null
  loading: boolean
  onOpenTarefa: (id: string) => void
  onBack: () => void
  processoName?: string
  onEdit: () => void
  onDelete: () => void
  onEditTarefa: (t: Tarefa) => void
  onDeleteTarefa: (t: Tarefa) => void
}) {
  const tarefas = actividade?.tarefas ?? []

  if (loading && !actividade) {
    return (
      <div className="flex flex-col items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">A carregar actividade...</p>
      </div>
    )
  }
  if (!actividade) {
    return <div className="text-center py-20 text-muted-foreground">Actividade não encontrada.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Activity className="w-3.5 h-3.5" />
            <span>{processoName || actividade.processo?.nome} · Actividade</span>
          </div>
          <div className="flex items-start gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{actividade.nome}</h1>
            <Badge variant="secondary" className={cn("mt-1.5", FREQ_COLORS[actividade.frequencia])}>
              <Calendar className="w-3 h-3 mr-1" />{actividade.frequencia}
            </Badge>
          </div>
          {actividade.descricao && <p className="text-muted-foreground mt-2 text-sm max-w-3xl">{actividade.descricao}</p>}
        </div>
        <EntityMenu onEdit={onEdit} onDelete={onDelete} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Responsável</p>
              <p className="text-sm font-medium truncate">{actividade.responsavel?.nome || 'Não atribuído'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Substituto</p>
              <p className="text-sm font-medium truncate">{actividade.substituto?.nome || 'Não atribuído'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-primary" />
            Tarefas da Actividade
          </h2>
          <Badge variant="secondary">{tarefas.length}</Badge>
        </div>
        {tarefas.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center">
              <ListChecks className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma tarefa nesta actividade.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {tarefas.map((t) => (
              <TarefaCard
                key={t.id}
                tarefa={t}
                onClick={() => onOpenTarefa(t.id)}
                onEdit={() => onEditTarefa(t)}
                onDelete={() => onDeleteTarefa(t)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ============== Card de Tarefa ============== */
function TarefaCard({
  tarefa, onClick, onEdit, onDelete
}: {
  tarefa: Tarefa
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const numPassos = tarefa.procedimentos?.length ?? tarefa._count?.procedimentos ?? 0
  return (
    <div className="group relative">
      <button onClick={onClick} className="group/card text-left w-full">
        <Card className="h-full hover:shadow-md hover:border-primary/40 transition-all">
          <CardHeader className="pb-2 pr-10">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-sm flex items-center gap-2 leading-tight">
                <ListChecks className="w-4 h-4 text-sky-500 flex-shrink-0" />
                <span className="truncate">{tarefa.nome}</span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 uppercase mb-0.5">
                  <ArrowDownToLine className="w-3 h-3" /> Inputs
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{tarefa.inputs || '—'}</p>
              </div>
              <div>
                <div className="flex items-center gap-1 text-[10px] font-semibold text-orange-700 uppercase mb-0.5">
                  <ArrowUpFromLine className="w-3 h-3" /> Outputs
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{tarefa.outputs || '—'}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-2 text-[11px] flex-wrap">
              <Badge variant="outline" className="text-[10px] py-0">
                <ListOrdered className="w-2.5 h-2.5 mr-1" />{numPassos} passos
              </Badge>
              {tarefa.instrucoesNasFerramentas ? (
                <Badge variant="outline" className="text-[10px] py-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                  <CheckCircle2 className="w-2.5 h-2.5 mr-1" />Instruções nas ferramentas
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] py-0 bg-amber-50 text-amber-700 border-amber-200">
                  <Circle className="w-2.5 h-2.5 mr-1" />Instruções pendentes
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </button>
      <div className="absolute top-2 right-2 z-10">
        <EntityMenu onEdit={onEdit} onDelete={onDelete} small />
      </div>
    </div>
  )
}

/* ============== Detalhe de Tarefa ============== */
export function TarefaDetailView({
  tarefa, loading, onBack, ferramentas, onEdit, onDelete
}: {
  tarefa: (Tarefa & { procedimentos?: { id: string; passo: number; descricao: string }[] }) | null
  loading: boolean
  onBack: () => void
  ferramentas: Ferramenta[]
  onEdit: () => void
  onDelete: () => void
}) {
  if (loading && !tarefa) {
    return (
      <div className="flex flex-col items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">A carregar tarefa...</p>
      </div>
    )
  }
  if (!tarefa) {
    return <div className="text-center py-20 text-muted-foreground">Tarefa não encontrada.</div>
  }

  const ferramentaIds = tarefa.ferramentaIds.split(',').filter(Boolean)
  const ferramentasUsadas = ferramentas.filter(f => ferramentaIds.includes(f.id))

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <ListChecks className="w-3.5 h-3.5" />
            <span>
              {tarefa.actividade?.processo?.area?.nome} · {tarefa.actividade?.processo?.nome} · {tarefa.actividade?.nome} · Tarefa
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{tarefa.nome}</h1>
          {tarefa.descricao && <p className="text-muted-foreground mt-2 text-sm max-w-3xl">{tarefa.descricao}</p>}
          {/* Data de revisão subtil */}
          <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground/60">
            <Clock className="w-3 h-3" />
            <span>Última revisão: {formatDataRevisao(tarefa.dataRevisao)}</span>
          </div>
        </div>
        <EntityMenu onEdit={onEdit} onDelete={onDelete} />
      </div>

      {/* Estado das instruções nas ferramentas */}
      <div className={cn(
        "p-4 rounded-lg border flex items-start gap-3",
        tarefa.instrucoesNasFerramentas
          ? "border-emerald-200 bg-emerald-50/50"
          : "border-amber-200 bg-amber-50/50"
      )}>
        {tarefa.instrucoesNasFerramentas ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        ) : (
          <Circle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <p className={cn("text-sm font-medium", tarefa.instrucoesNasFerramentas ? "text-emerald-900" : "text-amber-900")}>
            {tarefa.instrucoesNasFerramentas
              ? "Instruções implementadas nas ferramentas de trabalho"
              : "Instruções ainda não implementadas nas ferramentas de trabalho"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tarefa.instrucoesNasFerramentas
              ? "As instruções desta tarefa já se encontram disponíveis nas ferramentas onde o trabalho é executado. Este sistema serve como mapeamento."
              : "As instruções existem apenas neste sistema de mapeamento. O objectivo é que sejam implementadas nas ferramentas de trabalho (ex.: Pipefy, Excel, etc.)."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-emerald-700">
              <ArrowDownToLine className="w-4 h-4" />
              Inputs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-emerald-900 whitespace-pre-wrap">{tarefa.inputs || '—'}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-orange-700">
              <ArrowUpFromLine className="w-4 h-4" />
              Outputs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-900 whitespace-pre-wrap">{tarefa.outputs || '—'}</p>
          </CardContent>
        </Card>
      </div>

      {ferramentasUsadas.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary" />
              Ferramentas Utilizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {ferramentasUsadas.map((f) => (
                <Badge key={f.id} variant="secondary" className="py-1">
                  <Wrench className="w-3 h-3 mr-1" />{f.nome}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-primary" />
            Procedimentos
          </CardTitle>
          <CardDescription className="text-xs">Passos a executar para completar a tarefa</CardDescription>
        </CardHeader>
        <CardContent>
          {!tarefa.procedimentos || tarefa.procedimentos.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Nenhum procedimento definido.</p>
          ) : (
            <ol className="space-y-3">
              {tarefa.procedimentos.map((p) => (
                <li key={p.id} className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {p.passo}
                  </span>
                  <div className="flex-1 pt-1">
                    <p className="text-sm">{p.descricao}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ============== Menu de acções (Editar/Eliminar) ============== */
function EntityMenu({
  onEdit, onDelete, small
}: {
  onEdit: () => void
  onDelete: () => void
  small?: boolean
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
            small ? "w-7 h-7 opacity-0 group-hover:opacity-100" : "w-9 h-9"
          )}
          aria-label="Mais acções"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className={small ? "w-3.5 h-3.5" : "w-4 h-4"} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="w-3.5 h-3.5 mr-2" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="w-3.5 h-3.5 mr-2" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
