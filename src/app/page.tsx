'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  LayoutGrid, Building2, Users, Wrench, Database,
  Menu, Workflow, ListChecks, Activity,
  Mail, UserPlus, Search, Trash2, Plus, MoreVertical, Pencil,
  ChevronsLeft, ChevronsRight, List, BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  Area, AreaDetalhe, Membro, Processo, Actividade, Tarefa, Ferramenta, DashboardData
} from '@/lib/types'
import { DashboardView } from '@/components/dashboard-view'
import { OrganogramaView } from '@/components/organograma-view'
import { DadosView } from '@/components/dados-view'
import { InstrucoesView } from '@/components/instrucoes-view'
import { TreeSidebar } from '@/components/tree-sidebar'
import { ListSkeleton, GridSkeleton } from '@/components/skeletons'
import {
  AreaDetailView, ProcessoDetailView, ActividadeDetailView,
  TarefaDetailView, DrillBreadcrumb, BreadcrumbItem
} from '@/components/drill-views'
import {
  AreaFormDialog, MembroFormDialog, ProcessoFormDialog, ActividadeFormDialog,
  TarefaFormDialog, FerramentaFormDialog, DeleteConfirmDialog,
  AreaFormData, MembroFormData, MembroAssociarData, ProcessoFormData, ActividadeFormData, TarefaFormData, FerramentaFormData
} from '@/components/forms'

type ViewLevel = 'dashboard' | 'areas' | 'area' | 'processo' | 'actividade' | 'tarefa' | 'membros' | 'ferramentas' | 'dados' | 'instrucoes'

interface ViewState {
  level: ViewLevel
  areaId?: string
  processoId?: string
  actividadeId?: string
  tarefaId?: string
}

interface NavItem {
  id: 'dashboard' | 'areas' | 'membros' | 'ferramentas' | 'dados' | 'instrucoes'
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'areas', label: 'Organograma', icon: Building2 },
  { id: 'membros', label: 'Membros', icon: Users },
  { id: 'ferramentas', label: 'Ferramentas', icon: Wrench },
  { id: 'dados', label: 'Dados', icon: Database },
  { id: 'instrucoes', label: 'Instruções', icon: BookOpen },
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Persistir preferência da sidebar
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('sidebar.collapsed') : null
    if (saved !== null) setSidebarCollapsed(JSON.parse(saved))
  }, [])
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('sidebar.collapsed', JSON.stringify(sidebarCollapsed))
  }, [sidebarCollapsed])

  // Atalho Ctrl+B / Cmd+B para recolher/expandir sidebar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        setSidebarCollapsed(c => !c)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Estado de dados
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [areas, setAreas] = useState<Area[]>([])
  const [areaDetalhe, setAreaDetalhe] = useState<AreaDetalhe | null>(null)
  const [processoDetalhe, setProcessoDetalhe] = useState<(Processo & { actividades?: Actividade[] }) | null>(null)
  const [actividadeDetalhe, setActividadeDetalhe] = useState<(Actividade & { tarefas?: Tarefa[] }) | null>(null)
  const [tarefaDetalhe, setTarefaDetalhe] = useState<Tarefa | null>(null)
  const [membros, setMembros] = useState<Membro[]>([])
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([])
  const [loading, setLoading] = useState<Record<string, boolean>>({ dashboard: true, areas: true, membros: true, ferramentas: true })

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
    if (view.level === 'processo' && view.processoId) {
      loadProcessoDetalhe(view.processoId)
      if (view.areaId) loadAreaDetalhe(view.areaId)
    }
    if (view.level === 'actividade' && view.actividadeId) loadActividadeDetalhe(view.actividadeId)
    if (view.level === 'tarefa' && view.tarefaId) {
      loadTarefaDetalhe(view.tarefaId)
      if (view.areaId) loadAreaDetalhe(view.areaId)
      if (view.processoId) loadProcessoDetalhe(view.processoId)
      if (view.actividadeId) loadActividadeDetalhe(view.actividadeId)
    }
    if (view.level === 'membros') { loadMembros(); loadAreas() }
    if (view.level === 'ferramentas') { loadFerramentas(); loadAreas() }
    if (view.level === 'dados') loadAreas()
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
  const goToDados = () => setView({ level: 'dados' })
  const goToInstrucoes = () => setView({ level: 'instrucoes' })
  const navigateToSection = (section: 'dashboard' | 'areas' | 'membros' | 'ferramentas' | 'dados') =>
    setView({ level: section })

  const openArea = (id: string) => {
    if (id === '__areas__') { goToAreas(); return }
    setView({ level: 'area', areaId: id })
  }
  const openProcesso = (id: string) => setView({ level: 'processo', areaId: view.areaId, processoId: id })
  const openDashboardProcesso = (areaId: string, processoId: string) =>
    setView({ level: 'processo', areaId, processoId })
  const openActividade = (id: string) => setView({ level: 'actividade', areaId: view.areaId, processoId: view.processoId, actividadeId: id })
  const openTarefa = (id: string) => setView({ level: 'tarefa', areaId: view.areaId, processoId: view.processoId, actividadeId: view.actividadeId, tarefaId: id })
  const openDashboardTarefa = (areaId: string, processoId: string, actividadeId: string, tarefaId: string) =>
    setView({ level: 'tarefa', areaId, processoId, actividadeId, tarefaId })

  // Breadcrumb
  const breadcrumbs: BreadcrumbItem[] = []
  if (view.level !== 'dashboard') {
    breadcrumbs.push({ label: 'Início', level: 'areas' })
  }
  if (view.level === 'membros') {
    breadcrumbs.push({ label: 'Membros', level: 'areas' })
  } else if (view.level === 'ferramentas') {
    breadcrumbs.push({ label: 'Ferramentas', level: 'areas' })
  } else if (view.level === 'instrucoes') {
    breadcrumbs.push({ label: 'Instruções', level: 'areas' })
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

  const activeNav: 'dashboard' | 'areas' | 'membros' | 'ferramentas' | 'dados' | 'instrucoes' =
    view.level === 'membros' ? 'membros' :
    view.level === 'ferramentas' ? 'ferramentas' :
    view.level === 'dados' ? 'dados' :
    view.level === 'instrucoes' ? 'instrucoes' :
    view.level === 'dashboard' ? 'dashboard' : 'areas'

  // ===== Handlers de criação =====
  const handleCreateArea = async (data: AreaFormData) => {
    try {
      await fetcher('/api/areas', { method: 'POST', body: JSON.stringify(data) })
      toast.success('Área criada com sucesso!')
      await loadAreas(); await loadDashboard()
    } catch (e) { toast.error((e as Error).message); throw e }
  }

  const handleCreateMembro = async (data: MembroFormData) => {
    try {
      await fetcher('/api/membros', { method: 'POST', body: JSON.stringify(data) })
      toast.success('Membro criado com sucesso!')
      await loadMembros(); await loadDashboard()
      if (view.level === 'area' && view.areaId) await loadAreaDetalhe(view.areaId)
    } catch (e) { toast.error((e as Error).message); throw e }
  }

  const handleAssociateMembro = async (data: MembroAssociarData) => {
    try {
      // PUT /api/membros/[id] para actualizar o areaId
      await fetcher(`/api/membros/${data.membroId}`, {
        method: 'PUT',
        body: JSON.stringify({ areaId: data.areaId }),
      })
      toast.success('Membro associado à área com sucesso!')
      await loadMembros(); await loadDashboard()
      if (view.level === 'area' && view.areaId) await loadAreaDetalhe(view.areaId)
    } catch (e) { toast.error((e as Error).message); throw e }
  }

  const handleCreateProcesso = async (data: ProcessoFormData) => {
    try {
      await fetcher('/api/processos', { method: 'POST', body: JSON.stringify(data) })
      toast.success('Processo criado com sucesso!')
      await loadDashboard()
      if (view.level === 'area' && view.areaId) await loadAreaDetalhe(view.areaId)
    } catch (e) { toast.error((e as Error).message); throw e }
  }

  const handleCreateActividade = async (data: ActividadeFormData) => {
    try {
      await fetcher('/api/actividades', { method: 'POST', body: JSON.stringify(data) })
      toast.success('Actividade criada com sucesso!')
      await loadDashboard()
      if (view.processoId) await loadProcessoDetalhe(view.processoId)
    } catch (e) { toast.error((e as Error).message); throw e }
  }

  const handleCreateTarefa = async (data: TarefaFormData) => {
    try {
      await fetcher('/api/tarefas', { method: 'POST', body: JSON.stringify(data) })
      toast.success('Tarefa criada com sucesso!')
      await loadDashboard()
      if (view.actividadeId) await loadActividadeDetalhe(view.actividadeId)
    } catch (e) { toast.error((e as Error).message); throw e }
  }

  const handleCreateFerramenta = async (data: FerramentaFormData) => {
    try {
      await fetcher('/api/ferramentas', { method: 'POST', body: JSON.stringify(data) })
      toast.success('Ferramenta criada com sucesso!')
      await loadFerramentas(); await loadDashboard()
      if (view.level === 'area' && view.areaId) await loadAreaDetalhe(view.areaId)
    } catch (e) { toast.error((e as Error).message); throw e }
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
    } catch (e) { toast.error((e as Error).message); throw e }
  }

  const handleEditMembro = async (data: MembroFormData) => {
    if (!editMembro) return
    try {
      await fetcher(`/api/membros/${editMembro.id}`, { method: 'PUT', body: JSON.stringify(data) })
      toast.success('Membro actualizado!')
      setEditMembro(null)
      await loadMembros(); await loadDashboard()
      if (view.level === 'area' && view.areaId) await loadAreaDetalhe(view.areaId)
    } catch (e) { toast.error((e as Error).message); throw e }
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
    } catch (e) { toast.error((e as Error).message); throw e }
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
    } catch (e) { toast.error((e as Error).message); throw e }
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
    } catch (e) { toast.error((e as Error).message); throw e }
  }

  const handleEditFerramenta = async (data: FerramentaFormData) => {
    if (!editFerramenta) return
    try {
      await fetcher(`/api/ferramentas/${editFerramenta.id}`, { method: 'PUT', body: JSON.stringify(data) })
      toast.success('Ferramenta actualizada!')
      setEditFerramenta(null)
      await loadFerramentas(); await loadDashboard()
      if (view.level === 'area' && view.areaId) await loadAreaDetalhe(view.areaId)
    } catch (e) { toast.error((e as Error).message); throw e }
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
    } catch (e) { toast.error((e as Error).message); throw e }
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

      {/* Sidebar recolhível */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-40 transition-all duration-200 ease-out",
          sidebarCollapsed ? "w-16" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        aria-label="Navegação principal"
      >
        {/* Header com toggle */}
        <div className="p-3 border-b border-sidebar-border flex items-center justify-between">
          <button
            onClick={goToDashboard}
            className="flex items-center gap-2.5 text-left overflow-hidden"
            aria-label="Ir para Dashboard"
          >
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-sm flex-shrink-0">
              <Workflow className="w-5 h-5 text-primary-foreground" />
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-sm font-bold text-foreground leading-tight whitespace-nowrap">Gestão de Processos</h1>
                <p className="text-xs text-muted-foreground whitespace-nowrap">Sistema Operacional</p>
              </div>
            )}
          </button>
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              aria-label="Recolher menu"
              title="Recolher menu (Ctrl+B)"
              className="p-1.5 rounded hover:bg-sidebar-accent text-muted-foreground flex-shrink-0"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
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
                  else if (item.id === 'dados') goToDados()
                  else if (item.id === 'instrucoes') goToInstrucoes()
                  setSidebarOpen(false)
                }}
                title={sidebarCollapsed ? `${item.label}${count !== undefined ? ` (${count})` : ''}` : undefined}
                className={cn(
                  "w-full flex items-center rounded-lg text-sm font-medium transition-colors relative",
                  sidebarCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2",
                  isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!sidebarCollapsed && <span className="flex-1 text-left">{item.label}</span>}
                {!sidebarCollapsed && count !== undefined && (
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-semibold",
                    isActive ? "bg-white/40 text-white" : "bg-sidebar-accent text-muted-foreground"
                  )}>
                    {count}
                  </span>
                )}
                {/* Dot indicator quando recolhido */}
                {sidebarCollapsed && count !== undefined && count > 0 && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Rodapé */}
        <div className="p-2 border-t border-sidebar-border">
          {sidebarCollapsed ? (
            <button
              onClick={() => setSidebarCollapsed(false)}
              aria-label="Expandir menu"
              title="Expandir menu (Ctrl+B)"
              className="w-full p-2 rounded hover:bg-sidebar-accent text-muted-foreground flex justify-center"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          ) : (
            <p className="text-xs text-muted-foreground text-center px-1">
              {dashboard ? `${dashboard.counts.areas} áreas · ${dashboard.counts.processos} processos · ${dashboard.counts.tarefas} tarefas` : '—'}
            </p>
          )}
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
             view.level === 'dados' ? 'Dados' :
             view.level === 'instrucoes' ? 'Instruções' :
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
              onOpenProcesso={openDashboardProcesso}
              onOpenTarefa={openDashboardTarefa}
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

          {view.level === 'instrucoes' && (
            <InstrucoesView onNavigate={navigateToSection} />
          )}

          {/* === Encapsulamento: árvore + conteúdo quando dentro de uma área === */}
          {['area', 'processo', 'actividade', 'tarefa'].includes(view.level) && view.areaId && (
            <div className="flex gap-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
              {/* Árvore lateral */}
              <aside className="hidden lg:block w-64 flex-shrink-0 border border-border rounded-lg bg-card overflow-hidden max-h-[calc(100vh-8rem)] sticky top-20 self-start">
                <TreeSidebar
                  areaId={view.areaId}
                  selectedLevel={view.level as 'area' | 'processo' | 'actividade' | 'tarefa'}
                  selectedProcessoId={view.processoId}
                  selectedActividadeId={view.actividadeId}
                  selectedTarefaId={view.tarefaId}
                  onSelectArea={() => openArea(view.areaId!)}
                  onSelectProcesso={(pid) => openProcesso(pid)}
                  onSelectActividade={(pid, aid) => setView({ level: 'actividade', areaId: view.areaId, processoId: pid, actividadeId: aid })}
                  onSelectTarefa={(pid, aid, tid) => setView({ level: 'tarefa', areaId: view.areaId, processoId: pid, actividadeId: aid, tarefaId: tid })}
                />
              </aside>

              {/* Conteúdo principal */}
              <div className="flex-1 min-w-0">
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
                    onCreateProcesso={() => setProcessoModal(true)}
                    onCreateMembro={() => setMembroModal(true)}
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
                    onCreateActividade={() => setActividadeModal(true)}
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
                    onCreateTarefa={() => setTarefaModal(true)}
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
              </div>
            </div>
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

          {view.level === 'dados' && (
            <DadosView areas={areas} />
          )}
        </div>
      </main>

      {/* Modais - Criar */}
      <AreaFormDialog open={areaModal} onOpenChange={setAreaModal} onSubmit={handleCreateArea} />
      <MembroFormDialog
        open={membroModal}
        onOpenChange={setMembroModal}
        onSubmit={handleCreateMembro}
        onAssociate={handleAssociateMembro}
        areas={areas}
        lockedAreaId={view.level === 'area' ? view.areaId : undefined}
      />
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
        onCreateFerramenta={async (nome: string) => {
          try {
            const res = await fetch('/api/ferramentas', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ nome }),
            })
            const nova = await res.json()
            if (!res.ok) throw new Error(nova.error)
            await loadFerramentas()
            return nova as Ferramenta
          } catch (e) {
            toast.error((e as Error).message)
            return null
          }
        }}
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
          onCreateFerramenta={async (nome: string) => {
            try {
              const res = await fetch('/api/ferramentas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome }),
              })
              const nova = await res.json()
              if (!res.ok) throw new Error(nova.error)
              await loadFerramentas()
              return nova as Ferramenta
            } catch (e) {
              toast.error((e as Error).message)
              return null
            }
          }}
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
  const [areaFilter, setAreaFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list')
  const filtered = membros.filter(m => {
    const matchSearch = m.nome.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.cargo?.toLowerCase().includes(search.toLowerCase())
    const matchArea = areaFilter === 'all' || m.areaId === areaFilter
    return matchSearch && matchArea
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Membros da Equipa</h1>
          <p className="text-muted-foreground mt-1 text-sm">Todos os membros cadastrados no sistema. {filtered.length !== membros.length && `A mostrar ${filtered.length} de ${membros.length}.`}</p>
        </div>
        <Button onClick={onCreate}><UserPlus className="w-4 h-4 mr-2" /> Novo Membro</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Pesquisar membro..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger className="w-full sm:w-56" aria-label="Filtrar por área"><SelectValue placeholder="Filtrar por área" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as áreas</SelectItem>
            {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        {/* Toggle vista */}
        <div className="flex border border-border rounded-md overflow-hidden">
          <button onClick={() => setViewMode('list')} className={cn("px-3 py-1.5 text-xs font-medium", viewMode === 'list' ? "bg-primary text-primary-foreground" : "hover:bg-muted")} aria-label="Vista lista">
            <List className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setViewMode('cards')} className={cn("px-3 py-1.5 text-xs font-medium", viewMode === 'cards' ? "bg-primary text-primary-foreground" : "hover:bg-muted")} aria-label="Vista cards">
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {loading ? (
        <ListSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <UserPlus className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-semibold text-sm">Nenhum membro encontrado</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Adicione o primeiro membro da equipa para começar a atribuir responsabilidades.</p>
            <Button onClick={onCreate} size="sm">
              <UserPlus className="w-4 h-4 mr-1.5" /> Adicionar membro
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        /* Vista lista densa */
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-3 px-3 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
            <span>Nome</span>
            <span>Cargo / Área</span>
            <span className="text-right">Resp.</span>
          </div>
          <div className="divide-y divide-border">
            {filtered.map(m => {
              const iniciais = m.nome.trim().split(/\s+/).map(p => p[0] || '').slice(0, 2).join('').toUpperCase() || '?'
              const totalResp = (m._count?.procResp ?? 0) + (m._count?.actResp ?? 0)
              const totalSub = (m._count?.procSubst ?? 0) + (m._count?.actSubst ?? 0)
              return (
                <div key={m.id} className="group grid grid-cols-[1fr_1fr_auto] gap-3 px-3 py-2 hover:bg-muted/40 transition-colors text-sm items-center">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center text-[10px] font-semibold flex-shrink-0">{iniciais}</div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{m.nome}</p>
                      {m.email && <p className="text-[11px] text-muted-foreground truncate">{m.email}</p>}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs truncate">{m.cargo || '—'}</p>
                    {m.area && <p className="text-[11px] text-muted-foreground truncate">{m.area.nome}</p>}
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    {totalResp > 0 && <Badge variant="outline" className="text-[10px] py-0 h-5 bg-emerald-50 text-emerald-700 border-emerald-200">{totalResp}R</Badge>}
                    {totalSub > 0 && <Badge variant="outline" className="text-[10px] py-0 h-5 bg-amber-50 text-amber-700 border-amber-200">{totalSub}S</Badge>}
                    <ActionMenu onEdit={() => onEdit(m)} onDelete={() => onDelete(m)} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((m) => {
            const iniciais = m.nome.trim().split(/\s+/).map(p => p[0] || '').slice(0, 2).join('').toUpperCase() || '?'
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
  const totalResp = (membro._count?.procResp ?? 0) + (membro._count?.actResp ?? 0)
  const totalSub = (membro._count?.procSubst ?? 0) + (membro._count?.actSubst ?? 0)
  return (
    <Card className="group relative transition-all hover:shadow-md hover:-translate-y-0.5">
      <CardContent className="p-3 pr-9">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center font-semibold text-xs flex-shrink-0">
            {iniciais}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{membro.nome}</h3>
            {membro.cargo && <p className="text-xs text-muted-foreground truncate">{membro.cargo}</p>}
            {membro.area && (
              <Badge variant="outline" className="mt-0.5 text-[10px] py-0">
                <Building2 className="w-2.5 h-2.5 mr-1" />{membro.area.nome}
              </Badge>
            )}
          </div>
        </div>
        {membro.email && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <Mail className="w-3 h-3" /><span className="truncate">{membro.email}</span>
          </div>
        )}
        {(totalResp > 0 || totalSub > 0) && (
          <div className="flex gap-1.5 mt-2">
            {totalResp > 0 && <Badge variant="outline" className="text-[10px] py-0 h-5 bg-emerald-50 text-emerald-700 border-emerald-200">{totalResp} resp.</Badge>}
            {totalSub > 0 && <Badge variant="outline" className="text-[10px] py-0 h-5 bg-amber-50 text-amber-700 border-amber-200">{totalSub} subst.</Badge>}
          </div>
        )}
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
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list')
  const filtered = ferramentas.filter(f =>
    f.nome.toLowerCase().includes(search.toLowerCase()) ||
    f.descricao?.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Ferramentas</h1>
          <p className="text-muted-foreground mt-1 text-sm">Ferramentas de trabalho usadas nas tarefas. {filtered.length !== ferramentas.length && `A mostrar ${filtered.length} de ${ferramentas.length}.`}</p>
        </div>
        <Button onClick={onCreate}><Plus className="w-4 h-4 mr-2" /> Nova Ferramenta</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Pesquisar ferramenta..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex border border-border rounded-md overflow-hidden">
          <button onClick={() => setViewMode('list')} className={cn("px-3 py-1.5 text-xs font-medium", viewMode === 'list' ? "bg-primary text-primary-foreground" : "hover:bg-muted")} aria-label="Vista lista">
            <List className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setViewMode('cards')} className={cn("px-3 py-1.5 text-xs font-medium", viewMode === 'cards' ? "bg-primary text-primary-foreground" : "hover:bg-muted")} aria-label="Vista cards">
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {loading ? (
        <GridSkeleton cols={4} count={8} />
      ) : ferramentas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Wrench className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-semibold text-sm">Nenhuma ferramenta cadastrada</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">As ferramentas são globais — usadas em qualquer área. Cadastre as ferramentas de trabalho da companhia.</p>
            <Button onClick={onCreate} size="sm">
              <Plus className="w-4 h-4 mr-1.5" /> Adicionar ferramenta
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <Wrench className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium">Nenhuma ferramenta encontrada para "{search}"</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Verifique a ortografia ou tente um termo mais geral.</p>
            <Button variant="outline" size="sm" onClick={() => setSearch('')}>Limpar pesquisa</Button>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        /* Vista lista densa */
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-3 px-3 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
            <span>Nome</span>
            <span>Descrição</span>
            <span className="text-right">Acções</span>
          </div>
          <div className="divide-y divide-border">
            {filtered.map(f => (
              <div key={f.id} className="group grid grid-cols-[1fr_1fr_auto] gap-3 px-3 py-2 hover:bg-muted/40 transition-colors text-sm items-center">
                <div className="flex items-center gap-2 min-w-0">
                  <Wrench className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium truncate">{f.nome}</span>
                </div>
                <span className="text-xs text-muted-foreground truncate">{f.descricao || '—'}</span>
                <div className="flex justify-end">
                  <ActionMenu onEdit={() => onEdit(f)} onDelete={() => onDelete(f)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((f) => (
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

/* ============== Menu de acções para listas globais (usa DropdownMenu do shadcn) ============== */
function ActionMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Mais acções"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="w-4 h-4" />
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
