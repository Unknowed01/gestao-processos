'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  LayoutGrid, Users, Layers, Workflow, ListChecks, Wrench,
  ChevronRight, Menu, X, Plus, Trash2, Loader2, Mail, Briefcase,
  ArrowRight, ArrowDownToLine, ArrowUpFromLine, ListOrdered,
  Search, Building2, Activity, Calendar, UserCheck, UserPlus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  Area, Membro, Processo, Actividade, Tarefa, Ferramenta, DashboardData,
  TIPOS_PROCESSO, FREQUENCIAS, TIPO_COLORS, FREQ_COLORS
} from '@/lib/types'

type TabId = 'dashboard' | 'areas' | 'processos' | 'actividades' | 'tarefas' | 'membros' | 'ferramentas'

interface NavItem { id: TabId; label: string; icon: React.ComponentType<{ className?: string }>; description: string }

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, description: 'Visão geral' },
  { id: 'areas', label: 'Áreas', icon: Building2, description: 'Áreas organizacionais' },
  { id: 'processos', label: 'Processos', icon: Workflow, description: 'Processos por área' },
  { id: 'actividades', label: 'Actividades', icon: Activity, description: 'Actividades por processo' },
  { id: 'tarefas', label: 'Tarefas', icon: ListChecks, description: 'Tarefas das actividades' },
  { id: 'membros', label: 'Membros', icon: Users, description: 'Equipa' },
  { id: 'ferramentas', label: 'Ferramentas', icon: Wrench, description: 'Ferramentas de trabalho' },
]

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Estado de dados
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [areas, setAreas] = useState<Area[]>([])
  const [membros, setMembros] = useState<Membro[]>([])
  const [processos, setProcessos] = useState<Processo[]>([])
  const [actividades, setActividades] = useState<Actividade[]>([])
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([])
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const fetcher = useCallback(async <T,>(url: string, opts?: RequestInit): Promise<T> => {
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erro de rede')
    return data as T
  }, [])

  const setLoadingFor = (key: string, val: boolean) =>
    setLoading(prev => ({ ...prev, [key]: val }))

  // Carregadores
  const loadDashboard = useCallback(async () => {
    setLoadingFor('dashboard', true)
    try { setDashboard(await fetcher<DashboardData>('/api/dashboard')) }
    catch (e) { toast.error((e as Error).message) }
    finally { setLoadingFor('dashboard', false) }
  }, [fetcher])

  const loadAreas = useCallback(async () => {
    setLoadingFor('areas', true)
    try { setAreas(await fetcher<Area[]>('/api/areas')) }
    catch (e) { toast.error((e as Error).message) }
    finally { setLoadingFor('areas', false) }
  }, [fetcher])

  const loadMembros = useCallback(async () => {
    setLoadingFor('membros', true)
    try { setMembros(await fetcher<Membro[]>('/api/membros')) }
    catch (e) { toast.error((e as Error).message) }
    finally { setLoadingFor('membros', false) }
  }, [fetcher])

  const loadProcessos = useCallback(async () => {
    setLoadingFor('processos', true)
    try { setProcessos(await fetcher<Processo[]>('/api/processos')) }
    catch (e) { toast.error((e as Error).message) }
    finally { setLoadingFor('processos', false) }
  }, [fetcher])

  const loadActividades = useCallback(async () => {
    setLoadingFor('actividades', true)
    try { setActividades(await fetcher<Actividade[]>('/api/actividades')) }
    catch (e) { toast.error((e as Error).message) }
    finally { setLoadingFor('actividades', false) }
  }, [fetcher])

  const loadTarefas = useCallback(async () => {
    setLoadingFor('tarefas', true)
    try { setTarefas(await fetcher<Tarefa[]>('/api/tarefas')) }
    catch (e) { toast.error((e as Error).message) }
    finally { setLoadingFor('tarefas', false) }
  }, [fetcher])

  const loadFerramentas = useCallback(async () => {
    setLoadingFor('ferramentas', true)
    try { setFerramentas(await fetcher<Ferramenta[]>('/api/ferramentas')) }
    catch (e) { toast.error((e as Error).message) }
    finally { setLoadingFor('ferramentas', false) }
  }, [fetcher])

  // Carrega dados com base na aba activa
  useEffect(() => {
    if (activeTab === 'dashboard') loadDashboard()
    if (activeTab === 'areas') loadAreas()
    if (activeTab === 'membros') { loadMembros(); loadAreas() }
    if (activeTab === 'processos') { loadProcessos(); loadAreas(); loadMembros() }
    if (activeTab === 'actividades') { loadActividades(); loadProcessos(); loadMembros() }
    if (activeTab === 'tarefas') { loadTarefas(); loadActividades(); loadFerramentas() }
    if (activeTab === 'ferramentas') { loadFerramentas(); loadAreas() }
  }, [activeTab, loadDashboard, loadAreas, loadMembros, loadProcessos, loadActividades, loadTarefas, loadFerramentas])

  // Sempre carrega dashboard ao iniciar (para contadores da sidebar)
  useEffect(() => { loadDashboard() }, [loadDashboard])

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 h-screen w-72 bg-sidebar border-r border-sidebar-border flex flex-col z-40 transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <Workflow className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground leading-tight">Gestão de Processos</h1>
              <p className="text-xs text-muted-foreground">Sistema Operacional</p>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon
            const count =
              item.id === 'areas' ? dashboard?.counts.areas :
              item.id === 'processos' ? dashboard?.counts.processos :
              item.id === 'actividades' ? dashboard?.counts.actividades :
              item.id === 'tarefas' ? dashboard?.counts.tarefas :
              item.id === 'membros' ? dashboard?.counts.membros :
              item.id === 'ferramentas' ? dashboard?.counts.ferramentas : undefined

            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {count !== undefined && (
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-semibold",
                    activeTab === item.id
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-sidebar-accent text-muted-foreground"
                  )}>
                    {count}
                  </span>
                )}
                {activeTab === item.id && <ChevronRight className="w-4 h-4" />}
              </button>
            )
          })}
        </nav>

        {/* Rodapé da sidebar */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="rounded-lg bg-sidebar-accent/60 p-3">
            <p className="text-xs text-muted-foreground mb-1">Fluxo hierárquico</p>
            <div className="text-xs font-medium text-foreground leading-relaxed">
              Área → Processo → Actividade → Tarefa
            </div>
          </div>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Topbar mobile */}
        <header className="lg:hidden sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-muted"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-sm">
            {NAV.find(n => n.id === activeTab)?.label}
          </h2>
          <div className="w-9" />
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              data={dashboard}
              loading={!!loading.dashboard}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === 'areas' && (
            <AreasView areas={areas} loading={!!loading.areas} onRefresh={loadAreas} />
          )}
          {activeTab === 'membros' && (
            <MembrosView
              membros={membros}
              areas={areas}
              loading={!!loading.membros}
              onRefresh={loadMembros}
              onCreate={async (data) => {
                try {
                  await fetcher('/api/membros', { method: 'POST', body: JSON.stringify(data) })
                  toast.success('Membro criado com sucesso!')
                  await loadMembros()
                  await loadDashboard()
                } catch (e) { toast.error((e as Error).message) }
              }}
              onDelete={async (id) => {
                try {
                  await fetcher(`/api/membros/${id}`, { method: 'DELETE' })
                  toast.success('Membro eliminado')
                  await loadMembros()
                  await loadDashboard()
                } catch (e) { toast.error((e as Error).message) }
              }}
            />
          )}
          {activeTab === 'processos' && (
            <ProcessosView
              processos={processos}
              areas={areas}
              membros={membros}
              loading={!!loading.processos}
              onRefresh={loadProcessos}
              onCreate={async (data) => {
                try {
                  await fetcher('/api/processos', { method: 'POST', body: JSON.stringify(data) })
                  toast.success('Processo criado com sucesso!')
                  await loadProcessos()
                  await loadDashboard()
                } catch (e) { toast.error((e as Error).message) }
              }}
            />
          )}
          {activeTab === 'actividades' && (
            <ActividadesView
              actividades={actividades}
              processos={processos}
              membros={membros}
              loading={!!loading.actividades}
              onRefresh={loadActividades}
              onCreate={async (data) => {
                try {
                  await fetcher('/api/actividades', { method: 'POST', body: JSON.stringify(data) })
                  toast.success('Actividade criada com sucesso!')
                  await loadActividades()
                  await loadDashboard()
                } catch (e) { toast.error((e as Error).message) }
              }}
            />
          )}
          {activeTab === 'tarefas' && (
            <TarefasView
              tarefas={tarefas}
              actividades={actividades}
              ferramentas={ferramentas}
              loading={!!loading.tarefas}
              onRefresh={loadTarefas}
              onCreate={async (data) => {
                try {
                  await fetcher('/api/tarefas', { method: 'POST', body: JSON.stringify(data) })
                  toast.success('Tarefa criada com sucesso!')
                  await loadTarefas()
                  await loadDashboard()
                } catch (e) { toast.error((e as Error).message) }
              }}
              onDelete={async (id) => {
                try {
                  await fetcher(`/api/tarefas/${id}`, { method: 'DELETE' })
                  toast.success('Tarefa eliminada')
                  await loadTarefas()
                  await loadDashboard()
                } catch (e) { toast.error((e as Error).message) }
              }}
            />
          )}
          {activeTab === 'ferramentas' && (
            <FerramentasView
              ferramentas={ferramentas}
              areas={areas}
              loading={!!loading.ferramentas}
              onRefresh={loadFerramentas}
              onCreate={async (data) => {
                try {
                  await fetcher('/api/ferramentas', { method: 'POST', body: JSON.stringify(data) })
                  toast.success('Ferramenta criada com sucesso!')
                  await loadFerramentas()
                  await loadDashboard()
                } catch (e) { toast.error((e as Error).message) }
              }}
            />
          )}
        </div>
      </main>
    </div>
  )
}

/* ===================== Dashboard ===================== */

function DashboardView({
  data, loading, onNavigate
}: {
  data: DashboardData | null
  loading: boolean
  onNavigate: (t: TabId) => void
}) {
  if (loading && !data) return <LoadingState />
  if (!data) return <EmptyState title="Sem dados" message="Não foi possível carregar o dashboard." />

  const stats = [
    { id: 'areas' as TabId, label: 'Áreas', value: data.counts.areas, icon: Building2, color: 'bg-emerald-500' },
    { id: 'processos' as TabId, label: 'Processos', value: data.counts.processos, icon: Workflow, color: 'bg-orange-500' },
    { id: 'actividades' as TabId, label: 'Actividades', value: data.counts.actividades, icon: Activity, color: 'bg-violet-500' },
    { id: 'tarefas' as TabId, label: 'Tarefas', value: data.counts.tarefas, icon: ListChecks, color: 'bg-sky-500' },
    { id: 'membros' as TabId, label: 'Membros', value: data.counts.membros, icon: Users, color: 'bg-rose-500' },
    { id: 'ferramentas' as TabId, label: 'Ferramentas', value: data.counts.ferramentas, icon: Wrench, color: 'bg-teal-500' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do sistema de gestão de processos.</p>
      </div>

      {/* Hierarquia visual */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row items-center gap-3 lg:gap-2 text-center lg:text-left">
            <HierarchyNode icon={Building2} label="Área" color="bg-emerald-500" />
            <HierarchyArrow />
            <HierarchyNode icon={Workflow} label="Processo" color="bg-orange-500" />
            <HierarchyArrow />
            <HierarchyNode icon={Activity} label="Actividade" color="bg-violet-500" />
            <HierarchyArrow />
            <HierarchyNode icon={ListChecks} label="Tarefa" color="bg-sky-500" />
            <div className="lg:ml-6 lg:pl-6 lg:border-l border-border text-xs text-muted-foreground max-w-sm">
              Cada nível contém o seguinte. As tarefas têm inputs, ferramentas, procedimentos e outputs.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <button
              key={s.id}
              onClick={() => onNavigate(s.id)}
              className="text-left group"
            >
              <Card className="hover:shadow-md hover:border-primary/30 transition-all">
                <CardContent className="p-4">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", s.color)}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 group-hover:text-primary transition-colors">
                    {s.label} →
                  </div>
                </CardContent>
              </Card>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tarefas recentes */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Tarefas Recentes</CardTitle>
              <CardDescription className="text-xs">Últimas tarefas criadas</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('tarefas')}>
              Ver todas <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.tarefasRecentes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma tarefa criada ainda.</p>
            ) : (
              data.tarefasRecentes.map((t) => (
                <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <ListChecks className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.nome}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {t.actividade.processo?.area?.nome} → {t.actividade.processo?.nome} → {t.actividade.nome}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Distribuição por tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Processos por Tipo</CardTitle>
            <CardDescription className="text-xs">Distribuição Inbound / Outbound / Gestão</CardDescription>
          </CardHeader>
          <CardContent>
            {data.processosPorTipo.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Nenhum processo criado.</p>
            ) : (
              <div className="space-y-3">
                {data.processosPorTipo.map((p) => {
                  const total = data.processosPorTipo.reduce((a, b) => a + b._count, 0)
                  const pct = Math.round((p._count / total) * 100)
                  return (
                    <div key={p.tipo}>
                      <div className="flex items-center justify-between mb-1.5">
                        <Badge variant="outline" className={cn("font-medium", TIPO_COLORS[p.tipo])}>
                          {p.tipo}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{p._count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            p.tipo === 'Inbound' && 'bg-emerald-500',
                            p.tipo === 'Outbound' && 'bg-orange-500',
                            p.tipo === 'Gestão' && 'bg-violet-500'
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function HierarchyNode({ icon: Icon, label, color }: { icon: React.ComponentType<{ className?: string }>; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-sm", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-xs font-medium">{label}</span>
    </div>
  )
}
function HierarchyArrow() {
  return (
    <>
      <ArrowRight className="w-4 h-4 text-muted-foreground hidden lg:block flex-shrink-0" />
      <ArrowDownToLine className="w-4 h-4 text-muted-foreground lg:hidden flex-shrink-0 rotate-[-90deg]" />
    </>
  )
}

/* ===================== Áreas ===================== */

function AreasView({ areas, loading, onRefresh }: { areas: Area[]; loading: boolean; onRefresh: () => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ nome: '', descricao: '', objectivos: '' })
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/areas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Área criada com sucesso!')
      setForm({ nome: '', descricao: '', objectivos: '' })
      setOpen(false)
      onRefresh()
    } catch (e) { toast.error((e as Error).message) }
    finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Áreas"
        description="Áreas organizacionais que agrupam processos, equipas e ferramentas."
        action={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Nova Área</Button>}
      />
      {loading ? <LoadingState /> : areas.length === 0 ? (
        <EmptyState
          title="Nenhuma área criada"
          message="Crie a primeira área para começar a organizar processos."
          action={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Nova Área</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {areas.map((a) => (
            <Card key={a.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
                <CardTitle className="text-base mt-2">{a.nome}</CardTitle>
                {a.descricao && <CardDescription className="text-xs line-clamp-2">{a.descricao}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-3">
                {a.objectivos && (
                  <div className="text-xs">
                    <span className="font-medium text-muted-foreground">Objectivos: </span>
                    <span className="text-foreground">{a.objectivos}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  <Badge variant="secondary" className="text-xs">{a._count?.processos ?? 0} processos</Badge>
                  <Badge variant="secondary" className="text-xs">{a._count?.membros ?? 0} membros</Badge>
                  <Badge variant="secondary" className="text-xs">{a._count?.ferramentas ?? 0} ferramentas</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Área</DialogTitle>
            <DialogDescription>Crie uma nova área organizacional.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="area-nome">Nome *</Label>
              <Input id="area-nome" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Corretagem" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area-desc">Descrição</Label>
              <Textarea id="area-desc" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Breve descrição da área" rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area-obj">Objectivos</Label>
              <Input id="area-obj" value={form.objectivos} onChange={e => setForm({ ...form, objectivos: e.target.value })} placeholder="Ex: ABC123XYZ" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={submit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Criar Área
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ===================== Membros de Equipa ===================== */

interface MembroForm { nome: string; email: string; cargo: string; areaId: string }

function MembrosView({
  membros, areas, loading, onRefresh, onCreate, onDelete
}: {
  membros: Membro[]
  areas: Area[]
  loading: boolean
  onRefresh: () => void
  onCreate: (data: MembroForm) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<MembroForm>({ nome: '', email: '', cargo: '', areaId: '' })
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')

  const submit = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return }
    setSubmitting(true)
    try {
      await onCreate(form)
      setForm({ nome: '', email: '', cargo: '', areaId: '' })
      setOpen(false)
    } finally { setSubmitting(false) }
  }

  const filtered = membros.filter(m =>
    m.nome.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase()) ||
    m.cargo?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Membros da Equipa"
        description="Gestão dos membros da equipa — podem ser responsáveis ou substitutos por processos e actividades."
        action={<Button onClick={() => setOpen(true)}><UserPlus className="w-4 h-4 mr-2" /> Novo Membro</Button>}
      />

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por nome, email ou cargo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? <LoadingState /> : filtered.length === 0 ? (
        <EmptyState
          title={search ? "Nenhum membro encontrado" : "Nenhum membro criado"}
          message={search ? "Tente outro termo de pesquisa." : "Adicione o primeiro membro da equipa."}
          action={!search && <Button onClick={() => setOpen(true)}><UserPlus className="w-4 h-4 mr-2" /> Novo Membro</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => {
            const iniciais = m.nome.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
            return (
              <Card key={m.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center font-semibold text-sm flex-shrink-0">
                      {iniciais}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{m.nome}</h3>
                      {m.cargo && <p className="text-xs text-muted-foreground truncate">{m.cargo}</p>}
                      {m.area && (
                        <Badge variant="outline" className="mt-1 text-[10px] py-0">
                          <Building2 className="w-3 h-3 mr-1" />{m.area.nome}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(m.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {m.email && (
                    <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{m.email}</span>
                    </div>
                  )}

                  <Separator className="my-3" />

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center p-2 rounded-md bg-muted/50">
                      <div className="font-semibold text-foreground">{(m._count?.procResp ?? 0) + (m._count?.actResp ?? 0)}</div>
                      <div className="text-muted-foreground text-[10px]">Responsável</div>
                    </div>
                    <div className="text-center p-2 rounded-md bg-muted/50">
                      <div className="font-semibold text-foreground">{(m._count?.procSubst ?? 0) + (m._count?.actSubst ?? 0)}</div>
                      <div className="text-muted-foreground text-[10px]">Substituto</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal criar membro */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" /> Novo Membro da Equipa
            </DialogTitle>
            <DialogDescription>
              Adicione um novo membro que poderá ser atribuído como responsável ou substituto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="m-nome">Nome completo *</Label>
              <Input id="m-nome" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: João Silva" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="m-email">Email</Label>
                <Input id="m-email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="joao@empresa.ao" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-cargo">Cargo / Função</Label>
                <Input id="m-cargo" value={form.cargo} onChange={e => setForm({ ...form, cargo: e.target.value })} placeholder="Ex: Analista" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-area">Área</Label>
              <Select value={form.areaId || 'none'} onValueChange={v => setForm({ ...form, areaId: v === 'none' ? '' : v })}>
                <SelectTrigger id="m-area"><SelectValue placeholder="Seleccionar área (opcional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem área específica</SelectItem>
                  {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={submit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Criar Membro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ===================== Processos ===================== */

interface ProcessoForm {
  nome: string; descricao: string; tipo: string; frequencia: string;
  areaId: string; responsavelId: string; substitutoId: string;
}

function ProcessosView({
  processos, areas, membros, loading, onRefresh, onCreate
}: {
  processos: Processo[]
  areas: Area[]
  membros: Membro[]
  loading: boolean
  onRefresh: () => void
  onCreate: (data: ProcessoForm) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<ProcessoForm>({
    nome: '', descricao: '', tipo: 'Inbound', frequencia: 'Mensal',
    areaId: '', responsavelId: '', substitutoId: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return }
    if (!form.areaId) { toast.error('Área é obrigatória'); return }
    setSubmitting(true)
    try {
      await onCreate(form)
      setForm({ nome: '', descricao: '', tipo: 'Inbound', frequencia: 'Mensal', areaId: '', responsavelId: '', substitutoId: '' })
      setOpen(false)
    } finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Processos"
        description="Processos organizados por área, com tipo (Inbound/Outbound/Gestão) e frequência."
        action={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Novo Processo</Button>}
      />

      {loading ? <LoadingState /> : processos.length === 0 ? (
        <EmptyState
          title="Nenhum processo criado"
          message="Crie o primeiro processo associado a uma área."
          action={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Novo Processo</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {processos.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="outline" className={cn("text-xs", TIPO_COLORS[p.tipo])}>{p.tipo}</Badge>
                      <Badge variant="secondary" className={cn("text-xs", FREQ_COLORS[p.frequencia])}>{p.frequencia}</Badge>
                    </div>
                    <CardTitle className="text-base truncate">{p.nome}</CardTitle>
                    {p.area && (
                      <CardDescription className="text-xs flex items-center gap-1 mt-1">
                        <Building2 className="w-3 h-3" />{p.area.nome}
                      </CardDescription>
                    )}
                  </div>
                  <Workflow className="w-5 h-5 text-orange-500 flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {p.descricao && <p className="text-xs text-muted-foreground line-clamp-2">{p.descricao}</p>}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] text-muted-foreground">Responsável</div>
                      <div className="font-medium truncate">{p.responsavel?.nome || '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] text-muted-foreground">Substituto</div>
                      <div className="font-medium truncate">{p.substituto?.nome || '—'}</div>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Actividades</span>
                  <Badge variant="secondary">{p._count?.actividades ?? 0}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal criar processo */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Workflow className="w-5 h-5 text-primary" /> Novo Processo
            </DialogTitle>
            <DialogDescription>
              Defina o processo, sua área, tipo, frequência e responsáveis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="p-nome">Nome do processo *</Label>
              <Input id="p-nome" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Processo de Corretagem" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-desc">Descrição</Label>
              <Textarea id="p-desc" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} rows={2} placeholder="Descrição do processo" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Área *</Label>
                <Select value={form.areaId || 'none'} onValueChange={v => setForm({ ...form, areaId: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar área" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_PROCESSO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Frequência</Label>
                <Select value={form.frequencia} onValueChange={v => setForm({ ...form, frequencia: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREQUENCIAS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select value={form.responsavelId || 'none'} onValueChange={v => setForm({ ...form, responsavelId: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar membro" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem responsável</SelectItem>
                    {membros.map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Substituto</Label>
              <Select value={form.substitutoId || 'none'} onValueChange={v => setForm({ ...form, substitutoId: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar substituto" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem substituto</SelectItem>
                  {membros.map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={submit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Criar Processo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ===================== Actividades ===================== */

interface ActividadeForm {
  nome: string; descricao: string; frequencia: string;
  processoId: string; responsavelId: string; substitutoId: string;
}

function ActividadesView({
  actividades, processos, membros, loading, onRefresh, onCreate
}: {
  actividades: Actividade[]
  processos: Processo[]
  membros: Membro[]
  loading: boolean
  onRefresh: () => void
  onCreate: (data: ActividadeForm) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<ActividadeForm>({
    nome: '', descricao: '', frequencia: 'Mensal',
    processoId: '', responsavelId: '', substitutoId: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return }
    if (!form.processoId) { toast.error('Processo é obrigatório'); return }
    setSubmitting(true)
    try {
      await onCreate(form)
      setForm({ nome: '', descricao: '', frequencia: 'Mensal', processoId: '', responsavelId: '', substitutoId: '' })
      setOpen(false)
    } finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Actividades"
        description="Actividades dentro de processos, com responsáveis e frequência própria."
        action={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Nova Actividade</Button>}
      />

      {loading ? <LoadingState /> : actividades.length === 0 ? (
        <EmptyState
          title="Nenhuma actividade criada"
          message="Crie a primeira actividade associada a um processo."
          action={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Nova Actividade</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actividades.map((a) => (
            <Card key={a.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Badge variant="secondary" className={cn("text-xs mb-1", FREQ_COLORS[a.frequencia])}>{a.frequencia}</Badge>
                    <CardTitle className="text-base truncate">{a.nome}</CardTitle>
                    {a.processo && (
                      <CardDescription className="text-xs mt-1 truncate">
                        {a.processo.area?.nome} → {a.processo.nome}
                      </CardDescription>
                    )}
                  </div>
                  <Activity className="w-5 h-5 text-violet-500 flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {a.descricao && <p className="text-xs text-muted-foreground line-clamp-2">{a.descricao}</p>}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="min-w-0">
                    <div className="text-[10px] text-muted-foreground">Responsável</div>
                    <div className="font-medium truncate">{a.responsavel?.nome || '—'}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-muted-foreground">Substituto</div>
                    <div className="font-medium truncate">{a.substituto?.nome || '—'}</div>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Tarefas</span>
                  <Badge variant="secondary">{a._count?.tarefas ?? 0}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal criar actividade */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Nova Actividade
            </DialogTitle>
            <DialogDescription>
              Associe a actividade a um processo e defina responsáveis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="a-nome">Nome da actividade *</Label>
              <Input id="a-nome" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Responder e-mails ARSEG" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-desc">Descrição</Label>
              <Textarea id="a-desc" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Processo *</Label>
                <Select value={form.processoId || 'none'} onValueChange={v => setForm({ ...form, processoId: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar processo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {processos.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.area?.nome} → {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frequência</Label>
                <Select value={form.frequencia} onValueChange={v => setForm({ ...form, frequencia: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREQUENCIAS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select value={form.responsavelId || 'none'} onValueChange={v => setForm({ ...form, responsavelId: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem responsável</SelectItem>
                    {membros.map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Substituto</Label>
                <Select value={form.substitutoId || 'none'} onValueChange={v => setForm({ ...form, substitutoId: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem substituto</SelectItem>
                    {membros.map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={submit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Criar Actividade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ===================== Tarefas ===================== */

interface TarefaForm {
  nome: string
  descricao: string
  inputs: string
  outputs: string
  actividadeId: string
  ferramentaIds: string[]
  procedimentos: { descricao: string }[]
}

function TarefasView({
  tarefas, actividades, ferramentas, loading, onRefresh, onCreate, onDelete
}: {
  tarefas: Tarefa[]
  actividades: Actividade[]
  ferramentas: Ferramenta[]
  loading: boolean
  onRefresh: () => void
  onCreate: (data: TarefaForm) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Tarefa | null>(null)
  const [form, setForm] = useState<TarefaForm>({
    nome: '', descricao: '', inputs: '', outputs: '',
    actividadeId: '', ferramentaIds: [], procedimentos: [{ descricao: '' }]
  })
  const [submitting, setSubmitting] = useState(false)

  const addPasso = () => setForm(f => ({ ...f, procedimentos: [...f.procedimentos, { descricao: '' }] }))
  const removePasso = (i: number) => setForm(f => ({ ...f, procedimentos: f.procedimentos.filter((_, idx) => idx !== i) }))
  const updatePasso = (i: number, v: string) => setForm(f => ({
    ...f,
    procedimentos: f.procedimentos.map((p, idx) => idx === i ? { descricao: v } : p)
  }))

  const toggleFerramenta = (id: string) => setForm(f => ({
    ...f,
    ferramentaIds: f.ferramentaIds.includes(id)
      ? f.ferramentaIds.filter(x => x !== id)
      : [...f.ferramentaIds, id]
  }))

  const resetForm = () => setForm({
    nome: '', descricao: '', inputs: '', outputs: '',
    actividadeId: '', ferramentaIds: [], procedimentos: [{ descricao: '' }]
  })

  const submit = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return }
    if (!form.actividadeId) { toast.error('Actividade é obrigatória'); return }
    if (!form.inputs.trim()) { toast.error('Inputs são obrigatórios'); return }
    if (!form.outputs.trim()) { toast.error('Outputs são obrigatórios'); return }
    setSubmitting(true)
    try {
      await onCreate({
        ...form,
        procedimentos: form.procedimentos.filter(p => p.descricao.trim()),
      })
      resetForm()
      setOpen(false)
    } finally { setSubmitting(false) }
  }

  // Helpers de exibição
  const getFerramentaNames = (ids: string) =>
    ids.split(',').filter(Boolean).map(id => ferramentas.find(f => f.id === id)?.nome).filter(Boolean) as string[]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tarefas"
        description="Tarefas operacionais com inputs, ferramentas, procedimentos e outputs."
        action={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Nova Tarefa</Button>}
      />

      {loading ? <LoadingState /> : tarefas.length === 0 ? (
        <EmptyState
          title="Nenhuma tarefa criada"
          message="Crie a primeira tarefa associada a uma actividade."
          action={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Nova Tarefa</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tarefas.map((t) => {
            const ferramentaNames = getFerramentaNames(t.ferramentaIds)
            return (
              <Card key={t.id} className="group hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelected(t)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ListChecks className="w-4 h-4 text-sky-500 flex-shrink-0" />
                        <span className="truncate">{t.nome}</span>
                      </CardTitle>
                      {t.actividade && (
                        <CardDescription className="text-xs mt-1 truncate">
                          {t.actividade.processo?.area?.nome} → {t.actividade.processo?.nome} → {t.actividade.nome}
                        </CardDescription>
                      )}
                    </div>
                    <Button
                      variant="ghost" size="icon"
                      className="opacity-0 group-hover:opacity-100 h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); onDelete(t.id) }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 uppercase">
                        <ArrowDownToLine className="w-3 h-3" /> Inputs
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{t.inputs || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-orange-700 uppercase">
                        <ArrowUpFromLine className="w-3 h-3" /> Outputs
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{t.outputs || '—'}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px] py-0">
                        <ListOrdered className="w-3 h-3 mr-1" />{t.procedimentos?.length ?? 0} passos
                      </Badge>
                      {ferramentaNames.slice(0, 2).map((n, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] py-0">{n}</Badge>
                      ))}
                      {ferramentaNames.length > 2 && (
                        <Badge variant="secondary" className="text-[10px] py-0">+{ferramentaNames.length - 2}</Badge>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal criar tarefa - fluxo completo */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-primary" /> Nova Tarefa
            </DialogTitle>
            <DialogDescription>
              Defina inputs, ferramentas, procedimentos (passos) e outputs da tarefa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Identificação */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="t-nome">Nome da tarefa *</Label>
                <Input id="t-nome" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Responder e-mail da ARSEG" />
              </div>
              <div className="space-y-2">
                <Label>Actividade *</Label>
                <Select value={form.actividadeId || 'none'} onValueChange={v => setForm({ ...form, actividadeId: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar actividade" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {actividades.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.processo?.area?.nome} → {a.processo?.nome} → {a.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Inputs e Outputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-emerald-700">
                  <ArrowDownToLine className="w-4 h-4" /> Inputs *
                </Label>
                <Textarea
                  value={form.inputs}
                  onChange={e => setForm({ ...form, inputs: e.target.value })}
                  rows={3}
                  placeholder="Ex.: Receber e-mail da ARSEG com pedido de informação"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-orange-700">
                  <ArrowUpFromLine className="w-4 h-4" /> Outputs *
                </Label>
                <Textarea
                  value={form.outputs}
                  onChange={e => setForm({ ...form, outputs: e.target.value })}
                  rows={3}
                  placeholder="Ex.: Resposta ao e-mail da ARSEG com a informação solicitada"
                />
              </div>
            </div>

            {/* Ferramentas */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Wrench className="w-4 h-4" /> Ferramentas
              </Label>
              {ferramentas.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhuma ferramenta cadastrada. Crie ferramentas na aba respectiva.</p>
              ) : (
                <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-border bg-muted/30 max-h-32 overflow-y-auto">
                  {ferramentas.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleFerramenta(f.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                        form.ferramentaIds.includes(f.id)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card hover:bg-muted border-border"
                      )}
                    >
                      {f.nome}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Procedimentos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <ListOrdered className="w-4 h-4" /> Procedimentos (passos)
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addPasso}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar passo
                </Button>
              </div>
              <div className="space-y-2">
                {form.procedimentos.map((p, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-1">
                      {i + 1}
                    </div>
                    <Input
                      value={p.descricao}
                      onChange={e => updatePasso(i, e.target.value)}
                      placeholder={`Descreva o passo ${i + 1}...`}
                      className="flex-1"
                    />
                    {form.procedimentos.length > 1 && (
                      <Button
                        type="button" variant="ghost" size="icon"
                        className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removePasso(i)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={submit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Criar Tarefa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de detalhe da tarefa */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-primary" /> {selected.nome}
                </DialogTitle>
                <DialogDescription>
                  {selected.actividade?.processo?.area?.nome} → {selected.actividade?.processo?.nome} → {selected.actividade?.nome}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {selected.descricao && <p className="text-sm">{selected.descricao}</p>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-1">
                      <ArrowDownToLine className="w-3.5 h-3.5" /> INPUTS
                    </div>
                    <p className="text-sm text-emerald-900">{selected.inputs}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-orange-200 bg-orange-50">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-700 mb-1">
                      <ArrowUpFromLine className="w-3.5 h-3.5" /> OUTPUTS
                    </div>
                    <p className="text-sm text-orange-900">{selected.outputs}</p>
                  </div>
                </div>

                {/* Ferramentas */}
                {getFerramentaNames(selected.ferramentaIds).length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5" /> Ferramentas
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {getFerramentaNames(selected.ferramentaIds).map((n, i) => (
                        <Badge key={i} variant="secondary">{n}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Procedimentos */}
                {selected.procedimentos && selected.procedimentos.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
                      <ListOrdered className="w-3.5 h-3.5" /> Procedimentos
                    </h4>
                    <ol className="space-y-2">
                      {selected.procedimentos.map((p) => (
                        <li key={p.id} className="flex items-start gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {p.passo}
                          </span>
                          <span className="text-sm pt-0.5">{p.descricao}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ===================== Ferramentas ===================== */

function FerramentasView({
  ferramentas, areas, loading, onRefresh, onCreate
}: {
  ferramentas: Ferramenta[]
  areas: Area[]
  loading: boolean
  onRefresh: () => void
  onCreate: (data: { nome: string; descricao: string; areaId: string }) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ nome: '', descricao: '', areaId: '' })
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return }
    setSubmitting(true)
    try {
      await onCreate(form)
      setForm({ nome: '', descricao: '', areaId: '' })
      setOpen(false)
    } finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ferramentas"
        description="Ferramentas de trabalho usadas nas tarefas (ex.: Outlook, Copilot, Pipefy)."
        action={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Nova Ferramenta</Button>}
      />

      {loading ? <LoadingState /> : ferramentas.length === 0 ? (
        <EmptyState
          title="Nenhuma ferramenta criada"
          message="Cadastre ferramentas que serão usadas nas tarefas."
          action={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Nova Ferramenta</Button>}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {ferramentas.map((f) => (
            <Card key={f.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center mb-3">
                  <Wrench className="w-5 h-5 text-teal-600" />
                </div>
                <h3 className="font-medium text-sm truncate">{f.nome}</h3>
                {f.descricao && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{f.descricao}</p>}
                {f.area && (
                  <Badge variant="outline" className="mt-2 text-[10px] py-0">
                    <Building2 className="w-3 h-3 mr-1" />{f.area.nome}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary" /> Nova Ferramenta
            </DialogTitle>
            <DialogDescription>Cadastre uma ferramenta de trabalho.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="f-nome">Nome *</Label>
              <Input id="f-nome" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Outlook" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="f-desc">Descrição</Label>
              <Textarea id="f-desc" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Área</Label>
              <Select value={form.areaId || 'none'} onValueChange={v => setForm({ ...form, areaId: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar área (opcional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem área específica</SelectItem>
                  {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={submit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Criar Ferramenta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ===================== Componentes auxiliares ===================== */

function PageHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1 text-sm max-w-2xl">{description}</p>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Loader2 className="w-8 h-8 animate-spin mb-3" />
      <p className="text-sm">A carregar...</p>
    </div>
  )
}

function EmptyState({ title, message, action }: { title: string; message: string; action?: React.ReactNode }) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <X className="w-5 h-5 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">{message}</p>
        {action && <div className="mt-4 flex justify-center">{action}</div>}
      </CardContent>
    </Card>
  )
}
