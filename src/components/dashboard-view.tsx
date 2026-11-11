'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Building2, Workflow, Activity, ListChecks, Users, Wrench,
  ArrowRight, TrendingUp, Clock, ChevronRight
} from 'lucide-react'
import { DashboardData, TIPO_COLORS, TIPO_DOT, FREQ_COLORS, getAreaColor } from '@/lib/types'
import { cn } from '@/lib/utils'
import { DashboardSkeleton } from '@/components/skeletons'

export function DashboardView({
  data, loading, onOpenArea, onNavigateMembros
}: {
  data: DashboardData | null
  loading: boolean
  onOpenArea: (id: string) => void
  onNavigateMembros: () => void
}) {
  // Skeleton durante carregamento (sem flash de erro)
  if (loading && !data) {
    return <DashboardSkeleton />
  }
  // Estado de erro (apenas quando não está a carregar)
  if (!data && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Building2 className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium mb-1">Não foi possível carregar o dashboard</p>
        <p className="text-xs text-muted-foreground mb-4">Verifique a ligação ao servidor e tente novamente.</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Tentar novamente
        </Button>
      </div>
    )
  }
  if (!data) return <DashboardSkeleton />

  const total = data.counts
  const totalProcessos = data.processosPorTipo.reduce((a, b) => a + b._count, 0) || 1

  // Calcula % de completude da hierarquia (quantas áreas têm pelo menos 1 tarefa)
  const areasComTarefas = data.areasComContagem.filter(a => a._count.processos > 0).length
  const pctCoberto = total.areas > 0 ? Math.round((areasComTarefas / total.areas) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Visão Geral</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Bem-vindo ao sistema de gestão de processos. Clique numa área abaixo para ver os seus processos, ou use o menu lateral para navegar.
        </p>
      </div>

      {/* KPIs principais - layout elegante em grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard icon={Building2} label="Áreas" value={total.areas} color="emerald" onClick={() => onOpenArea('__areas__')} />
        <KpiCard icon={Workflow} label="Processos" value={total.processos} color="orange" />
        <KpiCard icon={Activity} label="Actividades" value={total.actividades} color="violet" />
        <KpiCard icon={ListChecks} label="Tarefas" value={total.tarefas} color="sky" />
        <KpiCard icon={Users} label="Membros" value={total.membros} color="rose" onClick={onNavigateMembros} />
        <KpiCard icon={Wrench} label="Ferramentas" value={total.ferramentas} color="teal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Áreas (maior parte do espaço) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Áreas Organizacionais
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {areasComTarefas} de {total.areas} áreas com processos definidos ({pctCoberto}%)
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
              {data.areasComContagem.map((area, idx) => {
                const color = getAreaColor(idx)
                return (
                  <button
                    key={area.id}
                    onClick={() => onOpenArea(area.id)}
                    className="group flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/40 transition-all text-left"
                  >
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", color.icon)}>
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{area.nome}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Workflow className="w-3 h-3" />{area._count.processos}</span>
                        <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{area._count.membros}</span>
                        <span className="flex items-center gap-0.5"><Wrench className="w-3 h-3" />{area._count.ferramentas}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Coluna lateral - distribuições */}
        <div className="space-y-6">
          {/* Distribuição por tipo */}
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
                  return (
                    <div key={p.tipo}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("w-2 h-2 rounded-full", TIPO_DOT[p.tipo])} />
                          <span className="text-xs font-medium">{p.tipo}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{p._count} · {pct}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            p.tipo === 'Inbound' && 'bg-emerald-500',
                            p.tipo === 'Outbound' && 'bg-orange-500',
                            p.tipo === 'Gestão' && 'bg-violet-500'
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Distribuição por frequência */}
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
      </div>

      {/* Tarefas recentes */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-primary" />
            Tarefas Recentes
          </CardTitle>
          <CardDescription className="text-xs">Últimas tarefas criadas no sistema</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {data.tarefasRecentes.length === 0 ? (
            <div className="text-center py-8">
              <ListChecks className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma tarefa criada ainda.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {data.tarefasRecentes.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <ListChecks className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.nome}</p>
                    <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                      {t.actividade.processo?.area?.nome}
                      <ChevronRight className="w-2.5 h-2.5" />
                      {t.actividade.processo?.nome}
                      <ChevronRight className="w-2.5 h-2.5" />
                      {t.actividade.nome}
                    </p>
                  </div>
                  {t.actividade.processo?.tipo && (
                    <Badge variant="outline" className={cn("text-[10px] py-0 hidden sm:inline-flex", TIPO_COLORS[t.actividade.processo.tipo])}>
                      {t.actividade.processo.tipo}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function KpiCard({
  icon: Icon, label, value, color, onClick
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  color: 'emerald' | 'orange' | 'violet' | 'sky' | 'rose' | 'teal'
  onClick?: () => void
}) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-500',
    orange: 'bg-orange-500',
    violet: 'bg-violet-500',
    sky: 'bg-sky-500',
    rose: 'bg-rose-500',
    teal: 'bg-teal-500',
  }
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "text-left rounded-xl border border-border bg-card p-4 transition-all",
        onClick && "hover:shadow-md hover:border-primary/30 cursor-pointer"
      )}
    >
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2.5", colors[color])}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="text-2xl font-bold leading-none">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1.5">{label}</div>
    </Comp>
  )
}
