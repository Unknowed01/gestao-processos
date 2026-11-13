'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Building2, Workflow, Activity, ListChecks, Users, Wrench,
  ArrowRight, TrendingUp, Clock, ChevronRight, AlertTriangle, UserX,
  CircleAlert
} from 'lucide-react'
import { DashboardData, FREQ_COLORS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { DashboardSkeleton } from '@/components/skeletons'

const TIPO_GREENS: Record<string, string> = {
  Inbound: 'bg-emerald-500',
  Outbound: 'bg-emerald-600',
  'Gestão': 'bg-emerald-700',
}

export function DashboardView({
  data, loading, onOpenArea, onOpenProcesso, onOpenTarefa, onNavigateMembros
}: {
  data: DashboardData | null
  loading: boolean
  onOpenArea: (id: string) => void
  onOpenProcesso: (areaId: string, processoId: string) => void
  onOpenTarefa: (areaId: string, processoId: string, actividadeId: string, tarefaId: string) => void
  onNavigateMembros: () => void
}) {
  if (loading && !data) return <DashboardSkeleton />
  if (!data && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Building2 className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium mb-1">Não foi possível carregar o dashboard</p>
        <p className="text-xs text-muted-foreground mb-4">Verifique a ligação ao servidor e tente novamente.</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Tentar novamente</Button>
      </div>
    )
  }
  if (!data) return <DashboardSkeleton />

  const total = data.counts
  const totalProcessos = data.processosPorTipo.reduce((a, b) => a + b._count, 0) || 1
  const areasComProcessos = data.areasComContagem.filter(a => a._count.processos > 0).length
  const pctCoberto = total.areas > 0 ? Math.round((areasComProcessos / total.areas) * 100) : 0
  const pctTarefasSemInstr = total.tarefas > 0 ? Math.round((data.alerts.tarefasSemInstrucoes.count / total.tarefas) * 100) : 0

  // Tempo relativo
  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const h = Math.floor(diff / 3600000)
    if (h < 1) return 'há minutos'
    if (h < 24) return `há ${h}h`
    const d = Math.floor(h / 24)
    return `há ${d}d`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Visão Geral</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Estado do mapeamento de processos. Itens abaixo precisam de atenção.
        </p>
      </div>

      {/* KPI Hero — % cobertura */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 sm:p-5">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">Cobertura do mapeamento</p>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mt-1">
              <span className="text-4xl font-bold">{pctCoberto}%</span>
              <span className="text-sm text-emerald-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> {areasComProcessos} de {total.areas} áreas
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.alerts.areasSemProcessos.length > 0
                ? `${data.alerts.areasSemProcessos.length} áreas ainda sem processos definidos`
                : 'Todas as áreas têm processos definidos!'}
            </p>
          </div>
          {data.alerts.areasSemProcessos.length > 0 && (
            <Button variant="outline" size="sm" className="mt-4 min-h-11" onClick={() => onOpenArea(data.alerts.areasSemProcessos[0].id)}>
              Abrir primeira área sem processos
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Alertas — precisa de atenção */}
      <div>
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Precisa de atenção
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* Áreas sem processos */}
          <AlertCard
            icon={Building2}
            color="rose"
            title="Áreas sem processos"
            count={data.alerts.areasSemProcessos.length}
            items={data.alerts.areasSemProcessos.slice(0, 2).map(a => ({
              label: a.nome,
              onClick: () => onOpenArea(a.id),
            }))}
            cta="Abrir área"
            onClick={() => data.alerts.areasSemProcessos[0] && onOpenArea(data.alerts.areasSemProcessos[0].id)}
          />
          {/* Processos sem responsável */}
          <AlertCard
            icon={UserX}
            color="amber"
            title="Processos sem responsável"
            count={data.alerts.processosSemResponsavel.length}
            items={data.alerts.processosSemResponsavel.slice(0, 2).map(p => ({
              label: p.nome,
              onClick: () => onOpenProcesso(p.areaId, p.id),
            }))}
            cta="Atribuir responsáveis"
            onClick={() => {
              const processo = data.alerts.processosSemResponsavel[0]
              if (processo) onOpenProcesso(processo.areaId, processo.id)
            }}
          />
          {/* Tarefas sem instruções */}
          <AlertCard
            icon={CircleAlert}
            color="amber"
            title="Tarefas sem instruções"
            count={data.alerts.tarefasSemInstrucoes.count}
            extra={`${pctTarefasSemInstr}% de ${total.tarefas} tarefas`}
            items={data.alerts.tarefasSemInstrucoes.items.slice(0, 2).map(t => ({
              label: `${t.nome} · ${t.actividade.nome}`,
              onClick: () => onOpenTarefa(t.actividade.processo.areaId, t.actividade.processo.id, t.actividade.id, t.id),
            }))}
            cta="Rever tarefas"
            onClick={() => {
              const tarefa = data.alerts.tarefasSemInstrucoes.items[0]
              if (tarefa) onOpenTarefa(tarefa.actividade.processo.areaId, tarefa.actividade.processo.id, tarefa.actividade.id, tarefa.id)
            }}
          />
        </div>
      </div>

      {/* KPIs compactos */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <MiniKpi icon={Building2} label="Áreas" value={total.areas} onClick={() => onOpenArea('__areas__')} />
        <MiniKpi icon={Workflow} label="Processos" value={total.processos} />
        <MiniKpi icon={Activity} label="Actividades" value={total.actividades} />
        <MiniKpi icon={ListChecks} label="Tarefas" value={total.tarefas} />
        <MiniKpi icon={Users} label="Membros" value={total.membros} onClick={onNavigateMembros} />
        <MiniKpi icon={Wrench} label="Ferramentas" value={total.ferramentas} />
      </div>

      {/* Distribuição + Actividade recente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribuições */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Processos por Tipo
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {data.processosPorTipo.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Sem dados.</p>
              ) : (
                data.processosPorTipo.map((p) => {
                  const pct = Math.round((p._count / totalProcessos) * 100)
                  const tone = TIPO_GREENS[p.tipo] ?? 'bg-primary'
                  return (
                    <div key={p.tipo}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("w-2 h-2 rounded-full", tone)} />
                          <span className="text-xs font-medium">{p.tipo}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{p._count} · {pct}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", tone)}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Frequência
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {data.processosPorFreq.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Sem dados.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {data.processosPorFreq.map((f) => (
                    <Badge key={f.frequencia} variant="secondary" className={cn("text-xs", FREQ_COLORS[f.frequencia])}>
                      {f.frequencia} · {f._count}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actividade recente */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Actividade Recente
            </CardTitle>
            <CardDescription className="text-xs">Últimas alterações no sistema</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {data.actividadesRecentes.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Sem actividade recente.</p>
            ) : (
              <ol className="space-y-2">
                {data.actividadesRecentes.map((a, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      {a.tipo === 'área' ? <Building2 className="w-3 h-3 text-muted-foreground" /> :
                       a.tipo === 'processo' ? <Workflow className="w-3 h-3 text-muted-foreground" /> :
                       <ListChecks className="w-3 h-3 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate">
                        <span className="font-medium">{a.nome}</span>
                        <span className="text-muted-foreground"> · {a.tipo}</span>
                        {a.areaNome && <span className="text-muted-foreground"> · {a.areaNome}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{timeAgo(a.updatedAt)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ============== Alert Card ============== */
function AlertCard({
  icon: Icon, color, title, count, items, extra, cta, onClick
}: {
  icon: React.ComponentType<{ className?: string }>
  color: 'rose' | 'amber'
  title: string
  count: number
  items?: { label: string; onClick: () => void }[]
  extra?: string
  cta: string
  onClick: () => void
}) {
  const colors = {
    rose: { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'bg-rose-100 text-rose-600', count: 'text-rose-700' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-100 text-amber-600', count: 'text-amber-700' },
  }
  const c = colors[color]
  return (
    <Card className={cn(c.border, c.bg)}>
    <CardContent className="p-3">
        <div className="flex items-start gap-3 mb-2">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", c.icon)}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{title}</p>
            <p className={cn("text-2xl font-bold leading-none mt-1", c.count)}>{count}</p>
            {extra && <p className="text-xs text-muted-foreground mt-0.5">{extra}</p>}
          </div>
        </div>
        {items && items.length > 0 && (
          <ul className="text-xs text-muted-foreground space-y-0.5 mb-2 pl-1">
            {items.map((item, i) => (
              <li key={i} className="min-w-0">
                <button onClick={item.onClick} className="min-h-9 w-full truncate px-1 py-1.5 text-left hover:text-foreground hover:underline">
                  • {item.label}
                </button>
              </li>
            ))}
            {count > items.length && <li className="italic">+{count - items.length} outros</li>}
          </ul>
        )}
        <Button variant="ghost" size="sm" onClick={onClick} disabled={count === 0} className="min-h-9 px-2 text-xs">
          {cta} <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  )
}

/* ============== Mini KPI ============== */
function MiniKpi({
  icon: Icon, label, value, onClick
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  onClick?: () => void
}) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "text-left rounded-lg border border-border bg-card p-2.5 transition-all",
        onClick && "hover:border-primary/30 hover:bg-muted/30 cursor-pointer"
      )}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-lg font-bold leading-none">{value}</span>
      </div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </Comp>
  )
}
