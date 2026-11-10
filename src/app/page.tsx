'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  LayoutGrid, Building2, Users, Wrench,
  Menu, Workflow, ListChecks, Activity,
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
import { OrganogramaView } from '@/components/organograma-view'
import {
  AreaDetailView, ProcessoDetailView, ActividadeDetailView,
  TarefaDetailView, DrillBreadcrumb, BreadcrumbItem
} from '@/components/drill-views'
import {
  AreaFormDialog, MembroFormDialog, ProcessoFormDialog, ActividadeFormDialog,
  TarefaFormDialog, FerramentaFormDialog, DeleteConfirmDialog,
  AreaFormData, MembroFormData, ProcessoFormData, ActividadeFormData, TarefaFormData, FerramentaFormData
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
  { id: 'areas', label: 'Organograma', icon: Building2 },
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

  // Modais - criar
  const [areaModal, setAreaModal] = useState(false)
  const [membroModal, setMembroModal] = useState(false)
  const [processoModal, setProcessoModal] = useState(false)
  const [actividadeModal, setActividadeModal] = useState(false)
  const [tarefaModal, setTarefaModal] = useState(false)
  const [ferramentaModal, setFerramentaModal] = useState(false)

  // Modais - editar
  const [editArea, setEditArea] = useState<Area | null>(null)
  const [editMembro, setEditMembro] = useState<Membro | null>(null)
  const [editProcesso, setEditProcesso] = useState<Processo | null>(null)
  const [editActividade, setEditActividade] = useState<Actividade | null>(null)
  const [editTarefa, setEditTarefa] = useState<(Tarefa & { procedimentos?: { id: string; passo: number; descricao: string }[] }) | null>(null)
  const [editFerramenta, setEditFerramenta] = useState<Ferramenta | null>(null)

  // Modais - eliminar
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string; message: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  // Sempre carrega dashboard
  useEffect(() => { loadDashboard() }, [loadDashboard])

  // Carrega dados globais uma vez (necessários para os modais)
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

  // Breadcrumb
  const breadcrumbs: BreadcrumbItem[] = []
  if (view.level !== 'dashboard') {
    breadcrumbs.push({ label: 'Dashboard', level: 'areas' })
  }
  if (view.level === 'membros') {
    breadcrumbs.push({ label: 'Membros', level: 'areas' })
  } else if (view.level === 'ferramentas') {
    breadcrumbs.push({ label: 'Ferramentas', level: 'areas' })
  } else if (view.level === 'areas') {
    breadcrumbs.push({ label: 'Organograma', level: 'areas' })
  } else if (view.level === 'area') {
    breadcrumbs.push({ label: 'Organograma', level: 'areas' })
    breadcrumbs.push({ label: areaDetalhe?.nome || 'Área', level: 'area', id: view.areaId })
  } else if (view.level === 'processo') {
    breadcrumbs.push({ label: 'Organograma', level: 'areas' })
    if (areaDetalhe) breadcrumbs.push({ label: areaDetalhe.nome, level: 'area', id: view.areaId })
    breadcrumbs.push({ label: processoDetalhe?.nome || 'Processo', level: 'processo', id: view.processoId })
  } else if (view.level === 'actividade') {
    breadcrumbs.push({ label: 'Organograma', level: 'areas' })
    if (areaDetalhe) breadcrumbs.push({ label: areaDetalhe.nome, level: 'area', id: view.areaId })
    if (processoDetalhe) breadcrumbs.push({ label: processoDetalhe.nome, level: 'processo', id: view.processoId })
    breadcrumbs.push({ label: actividadeDetalhe?.nome || 'Actividade', level: 'actividade', id: view.actividadeId })
  } else if (view.level === 'tarefa') {
    breadcrumbs.push({ label: 'Organograma', level: 'areas' })
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

  const activeNav: 'dashboard' | 'areas' | 'membros' | 'ferramentas' =
    view.level === 'membros' ? 'membros' :
    view.level === 'ferramentas' ? 'ferramentas' :
    view.level === 'dashboard' ? 'dashboard' : 'areas'

  // ===== Handlers de criação =====
  const handleCreateArea = async (data: AreaFormData) => {
    try {
      await fetcher('/api/areas', { method: 'POST', body: JSON.stringify(data) })
      toast.success('Área criada com sucesso!')
      await loadAreas(); await loadDashboard()
    } catch (e) { toast.error((e as Error).message) }
  }

  const handleCreateMembro = async (data: MembroFormData) => {
    try {
      await fetcher('/api/membros', { method: 'POST', body: JSON.stringify(data) })
      toast.success('Membro criado com sucesso!')
      await loadMembros(); await loadDashboard()
      if (view.level === 'area' && view.areaId) await loadAreaDetalhe(view.areaId)
    } catch (e) { toast.error((e as Error).message) }
  }

  const handleCreateProcesso = async (data: ProcessoFormData) => {
    try {
      await fetcher('/api/processos', { method: 'POST', body: JSON.stringify(data) })
      toast.success('Processo criado com sucesso!')
      await loadDashboard()
      if (view.level === 'area' && view.areaId) await loadAreaDetalhe(view.areaId)
    } catch (e) { toast.error((e as Error).message) }
  }

  const handleCreateActividade = async (data: ActividadeFormData) => {
    try {
      await fetcher('/api/actividades', { method: 'POST', body: JSON.stringify(data) })
      toast.success('Actividade criada com sucesso!')
      await loadDashboard()
      if (view.processoId) await loadProcessoDetalhe(view.processoId)
    } catch (e) { toast.error((e as Error).message) }
  }

  const handleCreateTarefa = async (data: TarefaFormData) => {
    try {
      await fetcher('/api/tarefas', { method: 'POST', body: JSON.stringify(data) })
      toast.success('Tarefa criada com sucesso!')
      await loadDashboard()
      if (view.actividadeId) await loadActividadeDetalhe(view.actividadeId)
    } catch (e) { toast.error((e as Error).message) }
  }

  const handleCreateFerramenta = async (data: FerramentaFormData) => {
    try {
      await fetcher('/api/ferramentas', { method: 'POST', body: JSON.stringify(data) })
      toast.success('Ferramenta criada com sucesso!')
      await loadFerramentas(); await loadDashboard()
      if (view.level === 'area' && view.areaId) await loadAreaDetalhe(view.areaId)
    } catch (e) { toast.error((e as Error).message) }
  }

  // ===== Handlers de edição =====
  const handleEditArea = async (data: AreaFormData) => {
    if (!editArea) return
    try {
      await fetcher(`/api/areas/${editArea.id}`, { method: 'PUT', body: JSON.stringify(data) })
      toast.success('Área actualizada!')
      setEditArea(null)
      await loadAreas(); await loadDashboard()
      if (view.level === 'area' && view.areaId) await loadAreaDetalhe(view.areaId)
    } catch (e) { toast.error((e as Error).message) }
  }

  const handleEditMembro = async (data: MembroFormData) => {
    if (!editMembro) return
    try {
      await fetcher(`/api/membros/${editMembro.id}`, { method: 'PUT', body: JSON.stringify(data) })
      toast.success('Membro actualizado!')
      setEditMembro(null)
      await loadMembros(); await loadDashboard()
      if (view.level === 'area' && view.areaId) await loadAreaDetalhe(view.areaId)
    } catch (e) { toast.error((e as Error).message) }
  }

  const handleEditProcesso = async (data: ProcessoFormData) => {
    if (!editProcesso) return
    try {
      await fetcher(`/api/processos/${editProcesso.id}`, { method: 'PUT', body: JSON.stringify(data) })
      toast.success('Processo actualizado!')
      setEditProcesso(null)
      await loadDashboard()
      if (view.level === 'area' && view.areaId) await loadAreaDetalhe(view.areaId)
      if (view.processoId) await loadProcessoDetalhe(view.processoId)
    } catch (e) { toast.error((e as Error).message) }
  }

  const handleEditActividade = async (data: ActividadeFormData) => {
    if (!editActividade) return
    try {
      await fetcher(`/api/actividades/${editActividade.id}`, { method: 'PUT', body: JSON.stringify(data) })
      toast.success('Actividade actualizada!')
      setEditActividade(null)
      await loadDashboard()
      if (view.processoId) await loadProcessoDetalhe(view.processoId)
      if (view.actividadeId) await loadActividadeDetalhe(view.actividadeId)
    } catch (e) { toast.error((e as Error).message) }
  }

  const handleEditTarefa = async (data: TarefaFormData) => {
    if (!editTarefa) return
    try {
      // PUT envia todos os campos, incluindo procedimentos (a API elimina os antigos e cria os novos)
      await fetcher(`/api/tarefas/${editTarefa.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nome: data.nome,
          descricao: data.descricao,
          inputs: data.inputs,
          outputs: data.outputs,
          instrucoesNasFerramentas: data.instrucoesNasFerramentas,
          actividadeId: data.actividadeId,
          ferramentaIds: data.ferramentaIds,
          procedimentos: data.procedimentos,
        })
      })
      toast.success('Tarefa actualizada!')
      setEditTarefa(null)
      await loadDashboard()
      if (view.actividadeId) await loadActividadeDetalhe(view.actividadeId)
      if (view.tarefaId) await loadTarefaDetalhe(view.tarefaId)
    } catch (e) { toast.error((e as Error).message) }
  }

  const handleEditFerramenta = async (data: FerramentaFormData) => {
    if (!editFerramenta) return
    try {
      await fetcher(`/api/ferramentas/${editFerramenta.id}`, { method: 'PUT', body: JSON.stringify(data) })
      toast.success('Ferramenta actualizada!')
      setEditFerramenta(null)
      await loadFerramentas(); await loadDashboard()
      if (view.level === 'area' && view.areaId) await loadAreaDetalhe(view.areaId)
    } catch (e) { toast.error((e as Error).message) }
  }

  // ===== Handlers de eliminação =====
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const endpoint =
        deleteTarget.type === 'area' ? `/api/areas/${deleteTarget.id}` :
        deleteTarget.type === 'membro' ? `/api/membros/${deleteTarget.id}` :
        deleteTarget.type === 'processo' ? `/api/processos/${deleteTarget.id}` :
        deleteTarget.type === 'actividade' ? `/api/actividades/${deleteTarget.id}` :
        deleteTarget.type === 'tarefa' ? `/api/tarefas/${deleteTarget.id}` :
        `/api/ferramentas/${deleteTarget.id}`

      await fetcher(endpoint, { method: 'DELETE' })
      toast.success(`${deleteTarget.type.charAt(0).toUpperCase() + deleteTarget.type.slice(1)} eliminad${deleteTarget.type.endsWith('a') ? 'a' : 'o'}`)
      setDeleteTarget(null)

      // Navega para trás se eliminou a entidade actual
      if (deleteTarget.type === 'area' && view.level === 'area') {
        goToAreas()
      } else if (deleteTarget.type === 'processo' && view.level === 'processo') {
        if (view.areaId) openArea(view.areaId)
      } else if (deleteTarget.type === 'actividade' && view.level === 'actividade') {
        if (view.processoId) openProcesso(view.processoId)
      } else if (deleteTarget.type === 'tarefa' && view.level === 'tarefa') {
        if (view.actividadeId) openActividade(view.actividadeId)
      } else {
        // Recarrega apenas os dados
        await loadDashboard()
        await loadAreas(); await loadMembros(); await loadFerramentas()
        if (view.level === 'area' && view.areaId) await loadAreaDetalhe(view.areaId)
        if (view.processoId) await loadProcessoDetalhe(view.processoId)
        if (view.actividadeId) await loadActividadeDetalhe(view.actividadeId)
      }
    } catch (e) { toast.error((e as Error).message) }
    finally { setDeleting(false) }
  }

  // Membros para os selects — quando numa área, usa membros da área; senão usa todos
  const membrosForSelect = view.level === 'area' && areaDetalhe?.membros
    ? areaDetalhe.membros
    : membros

  // Helper para abrir modal de eliminar
  const askDelete = (type: string, id: string, name: string, message?: string) => {
    setDeleteTarget({
      type, id, name,
      message: message || `Tem a certeza que pretende eliminar "${name}"? Esta acção não pode ser desfeita.`
    })
  }

  return (
    <div className="min-h-screen flex bg-background">
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
                  isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-sidebar-foreground hover:bg-sidebar-accent"
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

        <div className="p-3 border-t border-sidebar-border">
          <p className="text-[10px] text-muted-foreground/60 text-center">
            {dashboard ? `${dashboard.counts.areas} áreas · ${dashboard.counts.processos} processos · ${dashboard.counts.tarefas} tarefas` : '—'}
          </p>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-muted" aria-label="Abrir menu">
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-sm">
            {view.level === 'dashboard' ? 'Dashboard' :
             view.level === 'areas' ? 'Organograma' :
             view.level === 'membros' ? 'Membros' :
             view.level === 'ferramentas' ? 'Ferramentas' :
             areaDetalhe?.nome || '—'}
          </h2>
          <div className="w-9" />
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {view.level !== 'dashboard' && breadcrumbs.length > 0 && (
            <DrillBreadcrumb items={breadcrumbs} onNavigate={handleBreadcrumb} />
          )}

          {view.level === 'dashboard' && (
            <DashboardView
              data={dashboard}
              loading={!!loading.dashboard}
              onOpenArea={openArea}
              onNavigateMembros={goToMembros}
            />
          )}

          {view.level === 'areas' && (
            <OrganogramaView
              areas={areas}
              loading={!!loading.areas}
              onOpenArea={openArea}
              onCreateArea={() => setAreaModal(true)}
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
              onEditArea={() => setEditArea(areaDetalhe)}
              onDeleteArea={() => areaDetalhe && askDelete('area', areaDetalhe.id, areaDetalhe.nome, 'Tem a certeza? Todos os processos, actividades e tarefas associadas serão eliminados.')}
              onEditProcesso={(p) => setEditProcesso(p)}
              onDeleteProcesso={(p) => askDelete('processo', p.id, p.nome, 'Tem a certeza? Todas as actividades e tarefas associadas serão eliminadas.')}
              onEditMembro={(m) => setEditMembro(m)}
              onDeleteMembro={(m) => askDelete('membro', m.id, m.nome)}
            />
          )}

          {view.level === 'processo' && view.processoId && (
            <ProcessoDetailView
              processo={processoDetalhe}
              loading={!!loading.processo}
              onOpenActividade={openActividade}
              onBack={() => view.areaId && openArea(view.areaId)}
              areaName={areaDetalhe?.nome}
              onEdit={() => setEditProcesso(processoDetalhe)}
              onDelete={() => processoDetalhe && askDelete('processo', processoDetalhe.id, processoDetalhe.nome, 'Tem a certeza? Todas as actividades e tarefas associadas serão eliminadas.')}
              onEditActividade={(a) => setEditActividade(a)}
              onDeleteActividade={(a) => askDelete('actividade', a.id, a.nome, 'Tem a certeza? Todas as tarefas associadas serão eliminadas.')}
            />
          )}

          {view.level === 'actividade' && view.actividadeId && (
            <ActividadeDetailView
              actividade={actividadeDetalhe}
              loading={!!loading.actividade}
              onOpenTarefa={openTarefa}
              onBack={() => view.processoId && openProcesso(view.processoId)}
              processoName={processoDetalhe?.nome}
              onEdit={() => setEditActividade(actividadeDetalhe)}
              onDelete={() => actividadeDetalhe && askDelete('actividade', actividadeDetalhe.id, actividadeDetalhe.nome, 'Tem a certeza? Todas as tarefas associadas serão eliminadas.')}
              onEditTarefa={(t) => setEditTarefa(t)}
              onDeleteTarefa={(t) => askDelete('tarefa', t.id, t.nome)}
            />
          )}

          {view.level === 'tarefa' && view.tarefaId && (
            <TarefaDetailView
              tarefa={tarefaDetalhe}
              loading={!!loading.tarefa}
              onBack={() => view.actividadeId && openActividade(view.actividadeId)}
              ferramentas={ferramentas}
              onEdit={() => setEditTarefa(tarefaDetalhe)}
              onDelete={() => tarefaDetalhe && askDelete('tarefa', tarefaDetalhe.id, tarefaDetalhe.nome)}
            />
          )}

          {view.level === 'membros' && (
            <MembrosListView
              membros={membros}
              areas={areas}
              loading={!!loading.membros}
              onRefresh={loadMembros}
              onCreate={() => setMembroModal(true)}
              onEdit={(m) => setEditMembro(m)}
              onDelete={(m) => askDelete('membro', m.id, m.nome)}
            />
          )}

          {view.level === 'ferramentas' && (
            <FerramentasListView
              ferramentas={ferramentas}
              areas={areas}
              loading={!!loading.ferramentas}
              onRefresh={loadFerramentas}
              onCreate={() => setFerramentaModal(true)}
              onEdit={(f) => setEditFerramenta(f)}
              onDelete={(f) => askDelete('ferramenta', f.id, f.nome)}
            />
          )}
        </div>

        {/* FAB contextuais */}
        {view.level === 'area' && (
          <button
            onClick={() => setProcessoModal(true)}
            className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center z-20"
            aria-label="Novo processo" title="Novo processo nesta área"
          >
            <Workflow className="w-5 h-5" />
          </button>
        )}
        {view.level === 'processo' && (
          <button
            onClick={() => setActividadeModal(true)}
            className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center z-20"
            aria-label="Nova actividade" title="Nova actividade neste processo"
          >
            <Activity className="w-5 h-5" />
          </button>
        )}
        {view.level === 'actividade' && (
          <button
            onClick={() => setTarefaModal(true)}
            className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center z-20"
            aria-label="Nova tarefa" title="Nova tarefa nesta actividade"
          >
            <ListChecks className="w-5 h-5" />
          </button>
        )}
      </main>

      {/* Modais - Criar */}
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
        areaIdFiltro={view.areaId}
      />
      <TarefaFormDialog
        open={tarefaModal}
        onOpenChange={setTarefaModal}
        onSubmit={handleCreateTarefa}
        actividades={actividadeDetalhe ? [actividadeDetalhe] : (processoDetalhe?.actividades ?? [])}
        ferramentas={ferramentas}
        actividadePreselecionada={view.actividadeId}
      />
      <FerramentaFormDialog
        open={ferramentaModal}
        onOpenChange={setFerramentaModal}
        onSubmit={handleCreateFerramenta}
      />

      {/* Modais - Editar */}
      {editArea && (
        <AreaFormDialog
          open={true}
          onOpenChange={(o) => !o && setEditArea(null)}
          onSubmit={handleEditArea}
          initial={editArea}
          mode="edit"
        />
      )}
      {editMembro && (
        <MembroFormDialog
          open={true}
          onOpenChange={(o) => !o && setEditMembro(null)}
          onSubmit={handleEditMembro}
          areas={areas}
          initial={editMembro}
          mode="edit"
        />
      )}
      {editProcesso && (
        <ProcessoFormDialog
          open={true}
          onOpenChange={(o) => !o && setEditProcesso(null)}
          onSubmit={handleEditProcesso}
          areas={areas}
          membros={membros}
          initial={editProcesso}
          mode="edit"
        />
      )}
      {editActividade && (
        <ActividadeFormDialog
          open={true}
          onOpenChange={(o) => !o && setEditActividade(null)}
          onSubmit={handleEditActividade}
          processos={processoDetalhe ? [processoDetalhe] : (areaDetalhe?.processos ?? [])}
          membros={membros}
          initial={editActividade}
          mode="edit"
          areaIdFiltro={editActividade.processo?.area?.id || view.areaId}
        />
      )}
      {editTarefa && (
        <TarefaFormDialog
          open={true}
          onOpenChange={(o) => !o && setEditTarefa(null)}
          onSubmit={handleEditTarefa}
          actividades={actividadeDetalhe ? [actividadeDetalhe] : []}
          ferramentas={ferramentas}
          initial={editTarefa}
          mode="edit"
        />
      )}
      {editFerramenta && (
        <FerramentaFormDialog
          open={true}
          onOpenChange={(o) => !o && setEditFerramenta(null)}
          onSubmit={handleEditFerramenta}
          initial={editFerramenta}
          mode="edit"
        />
      )}

      {/* Modal - Eliminar */}
      {deleteTarget && (
        <DeleteConfirmDialog
          open={true}
          onOpenChange={(o) => !o && setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          title={`Eliminar ${deleteTarget.type === 'area' ? 'Área' : deleteTarget.type === 'membro' ? 'Membro' : deleteTarget.type === 'processo' ? 'Processo' : deleteTarget.type === 'actividade' ? 'Actividade' : deleteTarget.type === 'tarefa' ? 'Tarefa' : 'Ferramenta'}`}
          message={deleteTarget.message}
          loading={deleting}
        />
      )}
    </div>
  )
}

/* ============== Lista de Membros (visão global) ============== */
function MembrosListView({
  membros, areas, loading, onRefresh, onCreate, onEdit, onDelete
}: {
  membros: Membro[]
  areas: Area[]
  loading: boolean
  onRefresh: () => void
  onCreate: () => void
  onEdit: (m: Membro) => void
  onDelete: (m: Membro) => void
}) {
  const [search, setSearch] = useState('')
  const filtered = membros.filter(m =>
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
        <Input placeholder="Pesquisar membro..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
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
            const iniciais = m.nome.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
            return (
              <MembroListCard key={m.id} membro={m} iniciais={iniciais} onEdit={() => onEdit(m)} onDelete={() => onDelete(m)} />
            )
          })}
        </div>
      )}
    </div>
  )
}

function MembroListCard({
  membro, iniciais, onEdit, onDelete
}: {
  membro: Membro
  iniciais: string
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Card className="group relative">
      <CardContent className="p-4 pr-10">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center font-semibold text-sm flex-shrink-0">
            {iniciais}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{membro.nome}</h3>
            {membro.cargo && <p className="text-xs text-muted-foreground truncate">{membro.cargo}</p>}
            {membro.area && (
              <Badge variant="outline" className="mt-1 text-[10px] py-0">
                <Building2 className="w-2.5 h-2.5 mr-1" />{membro.area.nome}
              </Badge>
            )}
          </div>
        </div>
        {membro.email && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
            <Mail className="w-3 h-3" /><span className="truncate">{membro.email}</span>
          </div>
        )}
        <Separator className="my-3" />
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center p-1.5 rounded-md bg-muted/50">
            <div className="font-semibold">{(membro._count?.procResp ?? 0) + (membro._count?.actResp ?? 0)}</div>
            <div className="text-muted-foreground text-[10px]">Responsável</div>
          </div>
          <div className="text-center p-1.5 rounded-md bg-muted/50">
            <div className="font-semibold">{(membro._count?.procSubst ?? 0) + (membro._count?.actSubst ?? 0)}</div>
            <div className="text-muted-foreground text-[10px]">Substituto</div>
          </div>
        </div>
      </CardContent>
      <div className="absolute top-2 right-2 z-10">
        <ActionMenu onEdit={onEdit} onDelete={onDelete} />
      </div>
    </Card>
  )
}

/* ============== Lista de Ferramentas (visão global) ============== */
function FerramentasListView({
  ferramentas, areas, loading, onCreate, onEdit, onDelete
}: {
  ferramentas: Ferramenta[]
  areas: Area[]
  loading: boolean
  onRefresh: () => void
  onCreate: () => void
  onEdit: (f: Ferramenta) => void
  onDelete: (f: Ferramenta) => void
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
            <Card key={f.id} className="group relative">
              <CardContent className="p-4 pr-10">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center mb-3">
                  <Wrench className="w-5 h-5 text-teal-600" />
                </div>
                <h3 className="font-medium text-sm truncate">{f.nome}</h3>
                {f.descricao && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{f.descricao}</p>}
              </CardContent>
              <div className="absolute top-2 right-2 z-10">
                <ActionMenu onEdit={() => onEdit(f)} onDelete={() => onDelete(f)} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

/* ============== Menu de acções para listas globais ============== */
function ActionMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        aria-label="Mais acções"
      >
        <MoreVerticalIcon />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-36 rounded-md border border-border bg-popover shadow-md py-1 text-sm">
            <button
              className="w-full text-left px-3 py-1.5 hover:bg-muted flex items-center gap-2"
              onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit() }}
            >
              <PencilIcon /> Editar
            </button>
            <div className="h-px bg-border my-1" />
            <button
              className="w-full text-left px-3 py-1.5 hover:bg-muted flex items-center gap-2 text-destructive"
              onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete() }}
            >
              <Trash2Icon /> Eliminar
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function MoreVerticalIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
    </svg>
  )
}
function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  )
}
function Trash2Icon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}
