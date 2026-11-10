'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  LayoutGrid, Building2, Users, Wrench,
  ChevronRight, Menu, Workflow, ListChecks, Activity,
  Mail, UserPlus, Search, Trash2, Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  Area, AreaDetalhe, Membro, Processo, Actividade, Tarefa, Ferramenta, DashboardData
} from '@/lib/types'
import { DashboardView } from '@/components/dashboard-view'
import {
  AreasGridView, AreaDetailView, ProcessoDetailView, ActividadeDetailView,
  TarefaDetailView, DrillBreadcrumb, BreadcrumbItem
} from '@/components/drill-views'
import {
  AreaFormDialog, MembroFormDialog, ProcessoFormDialog, ActividadeFormDialog,
  TarefaFormDialog, FerramentaFormDialog
} from '@/components/forms'

type ViewLevel = 'dashboard' | 'areas' | 'area' | 'processo' | 'actividade' | 'tarefa' | 'membros' | 'ferramentas'

interface ViewState {
  level: ViewLevel
  areaId?: string
  processoId?: string
  actividadeId?: string
  tarefaId?: string
}

interface NavItem {
  id: 'dashboard' | 'areas' | 'membros' | 'ferramentas'
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'areas', label: 'Áreas', icon: Building2 },
  { id: 'membros', label: 'Membros', icon: Users },
  { id: 'ferramentas', label: 'Ferramentas', icon: Wrench },
]

const fetcher = async <T,>(url: string, opts?: RequestInit): Promise<T> => {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erro de rede')
  return data as T
}

export default function Home() {
  const [view, setView] = useState<ViewState>({ level: 'dashboard' })
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Estado de dados
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [areas, setAreas] = useState<Area[]>([])
  const [areaDetalhe, setAreaDetalhe] = useState<AreaDetalhe | null>(null)
  const [processoDetalhe, setProcessoDetalhe] = useState<(Processo & { actividades?: Actividade[] }) | null>(null)
  const [actividadeDetalhe, setActividadeDetalhe] = useState<(Actividade & { tarefas?: Tarefa[] }) | null>(null)
  const [tarefaDetalhe, setTarefaDetalhe] = useState<Tarefa | null>(null)
  const [membros, setMembros] = useState<Membro[]>([])
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([])
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  // Modais
  const [areaModal, setAreaModal] = useState(false)
  const [membroModal, setMembroModal] = useState(false)
  const [processoModal, setProcessoModal] = useState(false)
  const [actividadeModal, setActividadeModal] = useState(false)
  const [tarefaModal, setTarefaModal] = useState(false)
  const [ferramentaModal, setFerramentaModal] = useState(false)

  const setLoadingFor = (key: string, val: boolean) =>
    setLoading(prev => ({ ...prev, [key]: val }))

  // Carregadores
  const loadDashboard = useCallback(async () => {
    setLoadingFor('dashboard', true)
    try { setDashboard(await fetcher<DashboardData>('/api/dashboard')) }
    catch (e) { toast.error((e as Error).message) }
    finally { setLoadingFor('dashboard', false) }
  }, [])

  const loadAreas = useCallback(async () => {
    setLoadingFor('areas', true)
    try { setAreas(await fetcher<Area[]>('/api/areas')) }
    catch (e) { toast.error((e as Error).message) }
    finally { setLoadingFor('areas', false) }
  }, [])

  const loadAreaDetalhe = useCallback(async (id: string) => {
    setLoadingFor('area', true)
    try { setAreaDetalhe(await fetcher<AreaDetalhe>(`/api/areas/${id}`)) }
    catch (e) { toast.error((e as Error).message) }
    finally { setLoadingFor('area', false) }
  }, [])

  const loadProcessoDetalhe = useCallback(async (id: string) => {
    setLoadingFor('processo', true)
    try { setProcessoDetalhe(await fetcher<Processo & { actividades: Actividade[] }>(`/api/processos/${id}`)) }
    catch (e) { toast.error((e as Error).message) }
    finally { setLoadingFor('processo', false) }
  }, [])

  const loadActividadeDetalhe = useCallback(async (id: string) => {
    setLoadingFor('actividade', true)
    try { setActividadeDetalhe(await fetcher<Actividade & { tarefas: Tarefa[] }>(`/api/actividades/${id}`)) }
    catch (e) { toast.error((e as Error).message) }
    finally { setLoadingFor('actividade', false) }
  }, [])

  const loadTarefaDetalhe = useCallback(async (id: string) => {
    setLoadingFor('tarefa', true)
    try { setTarefaDetalhe(await fetcher<Tarefa & { procedimentos: { id: string; passo: number; descricao: string }[] }>(`/api/tarefas/${id}`)) }
    catch (e) { toast.error((e as Error).message) }
    finally { setLoadingFor('tarefa', false) }
  }, [])

  const loadMembros = useCallback(async () => {
    setLoadingFor('membros', true)
    try { setMembros(await fetcher<Membro[]>('/api/membros')) }
    catch (e) { toast.error((e as Error).message) }
    finally { setLoadingFor('membros', false) }
  }, [])

  const loadFerramentas = useCallback(async () => {
    setLoadingFor('ferramentas', true)
    try { setFerramentas(await fetcher<Ferramenta[]>('/api/ferramentas')) }
    catch (e) { toast.error((e as Error).message) }
    finally { setLoadingFor('ferramentas', false) }
  }, [])

  // Carrega dados conforme a view
  useEffect(() => {
    if (view.level === 'dashboard') loadDashboard()
    if (view.level === 'areas') loadAreas()
    if (view.level === 'area' && view.areaId) loadAreaDetalhe(view.areaId)
    if (view.level === 'processo' && view.processoId) loadProcessoDetalhe(view.processoId)
    if (view.level === 'actividade' && view.actividadeId) loadActividadeDetalhe(view.actividadeId)
    if (view.level === 'tarefa' && view.tarefaId) loadTarefaDetalhe(view.tarefaId)
    if (view.level === 'membros') { loadMembros(); loadAreas() }
    if (view.level === 'ferramentas') { loadFerramentas(); loadAreas() }
  }, [view, loadDashboard, loadAreas, loadAreaDetalhe, loadProcessoDetalhe, loadActividadeDetalhe, loadTarefaDetalhe, loadMembros, loadFerramentas])

  // Sempre carrega dashboard para os contadores da sidebar
  useEffect(() => { loadDashboard() }, [loadDashboard])

  // Carrega areas, ferramentas e membros globais uma vez (necessários para os modais em qualquer vista)
  useEffect(() => {
    loadAreas()
    loadFerramentas()
    loadMembros()
  }, [loadAreas, loadFerramentas, loadMembros])

  // Navegação
  const goToDashboard = () => setView({ level: 'dashboard' })
  const goToAreas = () => setView({ level: 'areas' })
  const goToMembros = () => setView({ level: 'membros' })
  const goToFerramentas = () => setView({ level: 'ferramentas' })

  const openArea = (id: string) => {
    if (id === '__areas__') { goToAreas(); return }
    setView({ level: 'area', areaId: id })
  }
  const openProcesso = (id: string) => setView({ level: 'processo', areaId: view.areaId, processoId: id })
  const openActividade = (id: string) => setView({ level: 'actividade', areaId: view.areaId, processoId: view.processoId, actividadeId: id })
  const openTarefa = (id: string) => setView({ level: 'tarefa', areaId: view.areaId, processoId: view.processoId, actividadeId: view.actividadeId, tarefaId: id })

  // Breadcrumb dinâmico
  const breadcrumbs: BreadcrumbItem[] = []
  if (view.level !== 'dashboard') {
    breadcrumbs.push({ label: 'Dashboard', level: 'areas' })
  }
  if (view.level === 'membros') {
    breadcrumbs.push({ label: 'Membros', level: 'membros' })
  } else if (view.level === 'ferramentas') {
    breadcrumbs.push({ label: 'Ferramentas', level: 'ferramentas' })
  } else if (view.level === 'areas') {
    breadcrumbs.push({ label: 'Áreas', level: 'areas' })
  } else if (view.level === 'area') {
    breadcrumbs.push({ label: 'Áreas', level: 'areas' })
    breadcrumbs.push({ label: areaDetalhe?.nome || 'Área', level: 'area', id: view.areaId })
  } else if (view.level === 'processo') {
    breadcrumbs.push({ label: 'Áreas', level: 'areas' })
    if (areaDetalhe) breadcrumbs.push({ label: areaDetalhe.nome, level: 'area', id: view.areaId })
    breadcrumbs.push({ label: processoDetalhe?.nome || 'Processo', level: 'processo', id: view.processoId })
  } else if (view.level === 'actividade') {
    breadcrumbs.push({ label: 'Áreas', level: 'areas' })
    if (areaDetalhe) breadcrumbs.push({ label: areaDetalhe.nome, level: 'area', id: view.areaId })
    if (processoDetalhe) breadcrumbs.push({ label: processoDetalhe.nome, level: 'processo', id: view.processoId })
    breadcrumbs.push({ label: actividadeDetalhe?.nome || 'Actividade', level: 'actividade', id: view.actividadeId })
  } else if (view.level === 'tarefa') {
    breadcrumbs.push({ label: 'Áreas', level: 'areas' })
    if (areaDetalhe) breadcrumbs.push({ label: areaDetalhe.nome, level: 'area', id: view.areaId })
    if (processoDetalhe) breadcrumbs.push({ label: processoDetalhe.nome, level: 'processo', id: view.processoId })
    if (actividadeDetalhe) breadcrumbs.push({ label: actividadeDetalhe.nome, level: 'actividade', id: view.actividadeId })
    breadcrumbs.push({ label: tarefaDetalhe?.nome || 'Tarefa', level: 'tarefa', id: view.tarefaId })
  }

  const handleBreadcrumb = (item: BreadcrumbItem, index: number) => {
    const target = breadcrumbs[index]
    if (target.level === 'areas') goToAreas()
    else if (target.level === 'area') setView({ level: 'area', areaId: target.id })
    else if (target.level === 'processo') setView({ level: 'processo', areaId: view.areaId, processoId: target.id })
    else if (target.level === 'actividade') setView({ level: 'actividade', areaId: view.areaId, processoId: view.processoId, actividadeId: target.id })
  }

  // Verifica aba activa na sidebar
  const activeNav: 'dashboard' | 'areas' | 'membros' | 'ferramentas' =
    view.level === 'membros' ? 'membros' :
    view.level === 'ferramentas' ? 'ferramentas' :
    view.level === 'dashboard' ? 'dashboard' : 'areas'

  // Handlers de criação
  const handleCreateArea = async (data: { nome: string; descricao: string; objectivos: string }) => {
    try {
      await fetcher('/api/areas', { method: 'POST', body: JSON.stringify(data) })
      toast.success('Área criada com sucesso!')
      await loadAreas()
      await loadDashboard()
    } catch (e) { toast.error((e as Error).message) }
  }

  const handleCreateMembro = async (data: { nome: string; email: string; cargo: string; areaId: string }) => {
    try {
      await fetcher('/api/membros', { method: 'POST', body: JSON.stringify(data) })
      toast.success('Membro criado com sucesso!')
      await loadMembros()
      await loadDashboard()
      if (view.level === 'area' && view.areaId) await loadAreaDetalhe(view.areaId)
    } catch (e) { toast.error((e as Error).message) }
  }

  const handleCreateProcesso = async (data: { nome: string; descricao: string; tipo: string; frequencia: string; areaId: string; responsavelId: string; substitutoId: string }) => {
    try {
      await fetcher('/api/processos', { method: 'POST', body: JSON.stringify(data) })
      toast.success('Processo criado com sucesso!')
      await loadDashboard()
      if (view.level === 'area' && view.areaId) await loadAreaDetalhe(view.areaId)
    } catch (e) { toast.error((e as Error).message) }
  }

  const handleCreateActividade = async (data: { nome: string; descricao: string; frequencia: string; processoId: string; responsavelId: string; substitutoId: string }) => {
    try {
      await fetcher('/api/actividades', { method: 'POST', body: JSON.stringify(data) })
      toast.success('Actividade criada com sucesso!')
      await loadDashboard()
      if (view.processoId) await loadProcessoDetalhe(view.processoId)
    } catch (e) { toast.error((e as Error).message) }
  }

  const handleCreateTarefa = async (data: { nome: string; descricao: string; inputs: string; outputs: string; actividadeId: string; ferramentaIds: string[]; procedimentos: { descricao: string }[] }) => {
    try {
      await fetcher('/api/tarefas', { method: 'POST', body: JSON.stringify(data) })
      toast.success('Tarefa criada com sucesso!')
      await loadDashboard()
      if (view.actividadeId) await loadActividadeDetalhe(view.actividadeId)
    } catch (e) { toast.error((e as Error).message) }
  }

  const handleCreateFerramenta = async (data: { nome: string; descricao: string; areaId: string }) => {
    try {
      await fetcher('/api/ferramentas', { method: 'POST', body: JSON.stringify(data) })
      toast.success('Ferramenta criada com sucesso!')
      await loadFerramentas()
      await loadDashboard()
      if (view.level === 'area' && view.areaId) await loadAreaDetalhe(view.areaId)
    } catch (e) { toast.error((e as Error).message) }
  }

  const handleDeleteTarefa = async () => {
    if (!view.tarefaId) return
    try {
      await fetcher(`/api/tarefas/${view.tarefaId}`, { method: 'DELETE' })
      toast.success('Tarefa eliminada')
      await loadDashboard()
      if (view.actividadeId) {
        await loadActividadeDetalhe(view.actividadeId)
        setView({ level: 'actividade', areaId: view.areaId, processoId: view.processoId, actividadeId: view.actividadeId })
      }
    } catch (e) { toast.error((e as Error).message) }
  }

  // Membros para os selects (criação de processo/actividade)
  const membrosForSelect = view.level === 'area' ? (areaDetalhe?.membros ?? membros) : membros

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-40 transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-5 border-b border-sidebar-border">
          <button onClick={goToDashboard} className="flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Workflow className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight">Gestão de Processos</h1>
              <p className="text-[11px] text-muted-foreground">Sistema Operacional</p>
            </div>
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon
            const isActive = activeNav === item.id
            const count =
              item.id === 'areas' ? dashboard?.counts.areas :
              item.id === 'membros' ? dashboard?.counts.membros :
              item.id === 'ferramentas' ? dashboard?.counts.ferramentas : undefined
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'dashboard') goToDashboard()
                  else if (item.id === 'areas') goToAreas()
                  else if (item.id === 'membros') goToMembros()
                  else if (item.id === 'ferramentas') goToFerramentas()
                  setSidebarOpen(false)
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {count !== undefined && (
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-semibold",
                    isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-sidebar-accent text-muted-foreground"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Rodapé da sidebar - sutil */}
        <div className="p-3 border-t border-sidebar-border">
          <p className="text-[10px] text-muted-foreground/60 text-center">
            {dashboard ? `${dashboard.counts.areas} áreas · ${dashboard.counts.processos} processos · ${dashboard.counts.tarefas} tarefas` : '—'}
          </p>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Topbar mobile */}
        <header className="lg:hidden sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-muted" aria-label="Abrir menu">
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-sm">
            {view.level === 'dashboard' ? 'Dashboard' :
             view.level === 'areas' ? 'Áreas' :
             view.level === 'membros' ? 'Membros' :
             view.level === 'ferramentas' ? 'Ferramentas' :
             areaDetalhe?.nome || '—'}
          </h2>
          <div className="w-9" />
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Breadcrumb (exceto no dashboard) */}
          {view.level !== 'dashboard' && breadcrumbs.length > 0 && (
            <DrillBreadcrumb items={breadcrumbs} onNavigate={handleBreadcrumb} />
          )}

          {/* Renderização por nível */}
          {view.level === 'dashboard' && (
            <DashboardView
              data={dashboard}
              loading={!!loading.dashboard}
              onOpenArea={openArea}
              onNavigateMembros={goToMembros}
            />
          )}

          {view.level === 'areas' && (
            <AreasGridView
              areas={areas}
              loading={!!loading.areas}
              onOpenArea={openArea}
              onCreateArea={() => setAreaModal(true)}
              canCreate
            />
          )}

          {view.level === 'area' && view.areaId && (
            <AreaDetailView
              areaId={view.areaId}
              area={areaDetalhe}
              loading={!!loading.area}
              onOpenProcesso={openProcesso}
              onBack={goToAreas}
              onRefresh={() => loadAreaDetalhe(view.areaId!)}
            />
          )}

          {view.level === 'processo' && view.processoId && (
            <ProcessoDetailView
              processo={processoDetalhe}
              loading={!!loading.processo}
              onOpenActividade={openActividade}
              onBack={() => view.areaId && openArea(view.areaId)}
              areaName={areaDetalhe?.nome}
            />
          )}

          {view.level === 'actividade' && view.actividadeId && (
            <ActividadeDetailView
              actividade={actividadeDetalhe}
              loading={!!loading.actividade}
              onOpenTarefa={openTarefa}
              onBack={() => view.processoId && openProcesso(view.processoId)}
              processoName={processoDetalhe?.nome}
            />
          )}

          {view.level === 'tarefa' && view.tarefaId && (
            <TarefaDetailView
              tarefa={tarefaDetalhe}
              loading={!!loading.tarefa}
              onBack={() => view.actividadeId && openActividade(view.actividadeId)}
              ferramentas={ferramentas}
              onDelete={handleDeleteTarefa}
            />
          )}

          {view.level === 'membros' && (
            <MembrosListView
              membros={membros}
              areas={areas}
              loading={!!loading.membros}
              onRefresh={loadMembros}
              onCreate={() => setMembroModal(true)}
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

          {view.level === 'ferramentas' && (
            <FerramentasListView
              ferramentas={ferramentas}
              areas={areas}
              loading={!!loading.ferramentas}
              onRefresh={loadFerramentas}
              onCreate={() => setFerramentaModal(true)}
            />
          )}
        </div>

        {/* Floating action button para criar conforme o contexto */}
        {view.level === 'area' && (
          <button
            onClick={() => setProcessoModal(true)}
            className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center z-20"
            aria-label="Novo processo"
            title="Novo processo nesta área"
          >
            <Workflow className="w-5 h-5" />
          </button>
        )}
        {view.level === 'processo' && (
          <button
            onClick={() => setActividadeModal(true)}
            className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center z-20"
            aria-label="Nova actividade"
            title="Nova actividade neste processo"
          >
            <Activity className="w-5 h-5" />
          </button>
        )}
        {view.level === 'actividade' && (
          <button
            onClick={() => setTarefaModal(true)}
            className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center z-20"
            aria-label="Nova tarefa"
            title="Nova tarefa nesta actividade"
          >
            <ListChecks className="w-5 h-5" />
          </button>
        )}
      </main>

      {/* Modais */}
      <AreaFormDialog open={areaModal} onOpenChange={setAreaModal} onSubmit={handleCreateArea} />
      <MembroFormDialog open={membroModal} onOpenChange={setMembroModal} onSubmit={handleCreateMembro} areas={areas} />
      <ProcessoFormDialog
        open={processoModal}
        onOpenChange={setProcessoModal}
        onSubmit={handleCreateProcesso}
        areas={areas}
        membros={membrosForSelect}
        areaPreselecionada={view.areaId}
      />
      <ActividadeFormDialog
        open={actividadeModal}
        onOpenChange={setActividadeModal}
        onSubmit={handleCreateActividade}
        processos={areaDetalhe?.processos ?? (processoDetalhe ? [processoDetalhe] : [])}
        membros={membrosForSelect}
        processoPreselecionado={view.processoId}
      />
      <TarefaFormDialog
        open={tarefaModal}
        onOpenChange={setTarefaModal}
        onSubmit={handleCreateTarefa}
        actividades={actividadeDetalhe ? [actividadeDetalhe] : (processoDetalhe?.actividades ?? [])}
        ferramentas={ferramentas}
        actividadePreselecionada={view.actividadeId}
      />
      <FerramentaFormDialog open={ferramentaModal} onOpenChange={setFerramentaModal} onSubmit={handleCreateFerramenta} areas={areas} />
    </div>
  )
}

/* ============== Lista de Membros (visão global) ============== */
function MembrosListView({
  membros, areas, loading, onRefresh, onCreate, onDelete
}: {
  membros: Membro[]
  areas: Area[]
  loading: boolean
  onRefresh: () => void
  onCreate: () => void
  onDelete: (id: string) => void
}) {
  const [search, setSearch] = useState('')

  const filtered = membros.filter((m: Membro) =>
    m.nome.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase()) ||
    m.cargo?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Membros da Equipa</h1>
          <p className="text-muted-foreground mt-1 text-sm">Todos os membros cadastrados no sistema.</p>
        </div>
        <Button onClick={onCreate}><UserPlus className="w-4 h-4 mr-2" /> Novo Membro</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Pesquisar membro..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-muted-foreground">A carregar membros...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <UserPlus className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-semibold text-sm">Nenhum membro encontrado</h3>
            <p className="text-xs text-muted-foreground mt-1">Adicione o primeiro membro da equipa.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((m) => {
            const iniciais = m.nome.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
            return (
              <Card key={m.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center font-semibold text-sm flex-shrink-0">
                      {iniciais}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{m.nome}</h3>
                      {m.cargo && <p className="text-xs text-muted-foreground truncate">{m.cargo}</p>}
                      {m.area && (
                        <Badge variant="outline" className="mt-1 text-[10px] py-0">
                          <Building2 className="w-2.5 h-2.5 mr-1" />{m.area.nome}
                        </Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(m.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {m.email && (
                    <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" /><span className="truncate">{m.email}</span>
                    </div>
                  )}
                  <Separator className="my-3" />
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center p-1.5 rounded-md bg-muted/50">
                      <div className="font-semibold">{(m._count?.procResp ?? 0) + (m._count?.actResp ?? 0)}</div>
                      <div className="text-muted-foreground text-[10px]">Responsável</div>
                    </div>
                    <div className="text-center p-1.5 rounded-md bg-muted/50">
                      <div className="font-semibold">{(m._count?.procSubst ?? 0) + (m._count?.actSubst ?? 0)}</div>
                      <div className="text-muted-foreground text-[10px]">Substituto</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ============== Lista de Ferramentas (visão global) ============== */
function FerramentasListView({
  ferramentas, areas, loading, onCreate
}: {
  ferramentas: Ferramenta[]
  areas: Area[]
  loading: boolean
  onRefresh: () => void
  onCreate: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Ferramentas</h1>
          <p className="text-muted-foreground mt-1 text-sm">Ferramentas de trabalho usadas nas tarefas.</p>
        </div>
        <Button onClick={onCreate}><Plus className="w-4 h-4 mr-2" /> Nova Ferramenta</Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-muted-foreground">A carregar ferramentas...</p>
        </div>
      ) : ferramentas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Wrench className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-semibold text-sm">Nenhuma ferramenta cadastrada</h3>
            <p className="text-xs text-muted-foreground mt-1">Cadastre ferramentas para usar nas tarefas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {ferramentas.map((f) => (
            <Card key={f.id}>
              <CardContent className="p-4">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center mb-3">
                  <Wrench className="w-5 h-5 text-teal-600" />
                </div>
                <h3 className="font-medium text-sm truncate">{f.nome}</h3>
                {f.descricao && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{f.descricao}</p>}
                {f.area && (
                  <Badge variant="outline" className="mt-2 text-[10px] py-0">
                    <Building2 className="w-2.5 h-2.5 mr-1" />{f.area.nome}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
