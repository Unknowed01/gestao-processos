'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, X, ArrowDownToLine, ArrowUpFromLine, ListOrdered, Wrench, Building2, UserPlus, Workflow, Activity, Trash2, Pencil, Target, Scale, Info } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { Area, Membro, Processo, Actividade, Ferramenta, TIPOS_PROCESSO, FREQUENCIAS } from '@/lib/types'
import { cn } from '@/lib/utils'

/* ============== Modal: Área (Criar/Editar) ============== */
export interface AreaFormData { nome: string; descricao: string; objectivos: string }

export function AreaFormDialog({
  open, onOpenChange, onSubmit, initial, mode = 'create'
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSubmit: (data: AreaFormData) => Promise<void>
  initial?: Area | null
  mode?: 'create' | 'edit'
}) {
  const [form, setForm] = useState<AreaFormData>({ nome: '', descricao: '', objectivos: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({
        nome: initial?.nome ?? '',
        descricao: initial?.descricao ?? '',
        objectivos: initial?.objectivos ?? '',
      })
    }
  }, [open, initial])

  const submit = async () => {
    if (!form.nome.trim()) return
    setSubmitting(true)
    try {
      await onSubmit(form)
      onOpenChange(false)
    } finally { setSubmitting(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            {mode === 'edit' ? 'Editar Área' : 'Nova Área'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'Actualize os dados da área.' : 'Crie uma nova área organizacional.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="area-nome">Nome *</Label>
            <Input id="area-nome" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Corretagem" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="area-desc">Descrição</Label>
            <Textarea id="area-desc" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="area-obj">Objectivos</Label>
            <Input id="area-obj" value={form.objectivos} onChange={e => setForm({ ...form, objectivos: e.target.value })} placeholder="Ex: Crescimento da produção" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={submit} disabled={submitting || !form.nome.trim()}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === 'edit' ? 'Guardar' : 'Criar Área'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ============== Modal: Membro (Criar/Editar) ============== */
export interface MembroFormData { nome: string; email: string; cargo: string; areaId: string }

export function MembroFormDialog({
  open, onOpenChange, onSubmit, areas, initial, mode = 'create', lockedAreaId
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSubmit: (data: MembroFormData) => Promise<void>
  areas: Area[]
  initial?: Membro | null
  mode?: 'create' | 'edit'
  lockedAreaId?: string // quando definido, área fica fixa e oculta
}) {
  const [form, setForm] = useState<MembroFormData>({ nome: '', email: '', cargo: '', areaId: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({
        nome: initial?.nome ?? '',
        email: initial?.email ?? '',
        cargo: initial?.cargo ?? '',
        areaId: initial?.areaId ?? lockedAreaId ?? '',
      })
    }
  }, [open, initial, lockedAreaId])

  const submit = async () => {
    if (!form.nome.trim()) return
    setSubmitting(true)
    try {
      await onSubmit(form)
      onOpenChange(false)
    } finally { setSubmitting(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            {mode === 'edit' ? 'Editar Membro' : 'Novo Membro da Equipa'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'Actualize os dados do membro.' : 'Adicione um membro que poderá ser atribuído como responsável ou substituto.'}
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
          {!lockedAreaId && (
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
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={submit} disabled={submitting || !form.nome.trim()}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === 'edit' ? 'Guardar' : 'Criar Membro'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ============== Modal: Processo (Criar/Editar) ============== */
export interface ProcessoFormData {
  nome: string; descricao: string; tipo: string; frequencia: string;
  kpis: string; obrigacoes: string;
  areaId: string; responsavelId: string; substitutoId: string;
}

export function ProcessoFormDialog({
  open, onOpenChange, onSubmit, areas, membros, initial, mode = 'create', areaPreselecionada
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSubmit: (data: ProcessoFormData) => Promise<void>
  areas: Area[]
  membros: Membro[]
  initial?: Processo | null
  mode?: 'create' | 'edit'
  areaPreselecionada?: string
}) {
  const [form, setForm] = useState<ProcessoFormData>({
    nome: '', descricao: '', tipo: 'Inbound', frequencia: 'Mensal',
    kpis: '', obrigacoes: '',
    areaId: '', responsavelId: '', substitutoId: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [erroValidacao, setErroValidacao] = useState('')

  useEffect(() => {
    if (open) {
      setForm({
        nome: initial?.nome ?? '',
        descricao: initial?.descricao ?? '',
        tipo: initial?.tipo ?? 'Inbound',
        frequencia: initial?.frequencia ?? 'Mensal',
        kpis: initial?.kpis ?? '',
        obrigacoes: initial?.obrigacoes ?? '',
        areaId: initial?.areaId ?? areaPreselecionada ?? '',
        responsavelId: initial?.responsavelId ?? '',
        substitutoId: initial?.substitutoId ?? '',
      })
      setErroValidacao('')
    }
  }, [open, initial, areaPreselecionada])

  // Filtra membros pela área seleccionada no formulário
  const membrosFiltrados = useMemo(() => {
    if (!form.areaId) return membros
    return membros.filter(m => m.areaId === form.areaId)
  }, [membros, form.areaId])

  // Lista de membros para o select de substituto (exclui o responsável seleccionado)
  const membrosParaSubstituto = useMemo(() => {
    return membrosFiltrados.filter(m => m.id !== form.responsavelId)
  }, [membrosFiltrados, form.responsavelId])

  // Lista de membros para o select de responsável (exclui o substituto seleccionado)
  const membrosParaResponsavel = useMemo(() => {
    return membrosFiltrados.filter(m => m.id !== form.substitutoId)
  }, [membrosFiltrados, form.substitutoId])

  const submit = async () => {
    if (!form.nome.trim() || !form.areaId) return
    // Validação: responsável ≠ substituto
    if (form.responsavelId && form.substitutoId && form.responsavelId === form.substitutoId) {
      setErroValidacao('O responsável e o substituto não podem ser a mesma pessoa.')
      return
    }
    setErroValidacao('')
    setSubmitting(true)
    try {
      await onSubmit(form)
      onOpenChange(false)
    } finally { setSubmitting(false) }
  }

  // Quando muda a área, limpa responsável/substituto se não pertencerem à área
  const handleAreaChange = (v: string) => {
    const newAreaId = v === 'none' ? '' : v
    setForm(f => ({
      ...f,
      areaId: newAreaId,
      responsavelId: f.responsavelId && !membros.some(m => m.id === f.responsavelId && m.areaId === newAreaId) ? '' : f.responsavelId,
      substitutoId: f.substitutoId && !membros.some(m => m.id === f.substitutoId && m.areaId === newAreaId) ? '' : f.substitutoId,
    }))
    setErroValidacao('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Workflow className="w-5 h-5 text-primary" />
            {mode === 'edit' ? 'Editar Processo' : 'Novo Processo'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'Actualize os dados do processo.' : 'Defina o processo, sua área, tipo, frequência, KPIs, obrigações regulamentares e responsáveis.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="p-nome">Nome do processo *</Label>
            <Input id="p-nome" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Processo de Corretagem" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-desc">Descrição</Label>
            <Textarea id="p-desc" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} rows={2} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Área *</Label>
              <Select value={form.areaId || 'none'} onValueChange={handleAreaChange}>
                <SelectTrigger><SelectValue placeholder="Seleccionar área" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                Tipo
                <InfoTipoProcesso />
              </Label>
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
              <Label>Responsável {form.areaId && membrosFiltrados.length === 0 && <span className="text-xs text-muted-foreground italic">(sem membros nesta área)</span>}</Label>
              <Select
                value={form.responsavelId || 'none'}
                onValueChange={v => { setForm({ ...form, responsavelId: v === 'none' ? '' : v }); setErroValidacao('') }}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar membro" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem responsável</SelectItem>
                  {membrosParaResponsavel.map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Substituto {form.responsavelId && <span className="text-xs text-muted-foreground italic">(não pode ser o mesmo do responsável)</span>}</Label>
            <Select
              value={form.substitutoId || 'none'}
              onValueChange={v => { setForm({ ...form, substitutoId: v === 'none' ? '' : v }); setErroValidacao('') }}
            >
              <SelectTrigger><SelectValue placeholder="Seleccionar substituto" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem substituto</SelectItem>
                {membrosParaSubstituto.map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* KPIs e Obrigações regulamentares */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
            <div className="space-y-2">
              <Label htmlFor="p-kpis" className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-primary" />
                KPIs do processo
              </Label>
              <Textarea
                id="p-kpis"
                value={form.kpis}
                onChange={e => setForm({ ...form, kpis: e.target.value })}
                rows={3}
                placeholder="Ex: Taxa de conversão de propostas; tempo médio de resposta; volume de produção mensal"
              />
              <p className="text-[11px] text-muted-foreground">Indicadores chave de desempenho específicos deste processo.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-obrig" className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-primary" />
                Obrigações regulamentares
              </Label>
              <Textarea
                id="p-obrig"
                value={form.obrigacoes}
                onChange={e => setForm({ ...form, obrigacoes: e.target.value })}
                rows={3}
                placeholder="Ex: Reporte mensal à ARSEG; conformidade com ISP; LGPD aplicável"
              />
              <p className="text-[11px] text-muted-foreground">Obrigações legais e regulamentares aplicáveis ao processo.</p>
            </div>
          </div>

          {erroValidacao && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {erroValidacao}
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={submit} disabled={submitting || !form.nome.trim() || !form.areaId}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === 'edit' ? 'Guardar' : 'Criar Processo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ============== Modal: Actividade (Criar/Editar) ============== */
export interface ActividadeFormData {
  nome: string; descricao: string; frequencia: string;
  processoId: string; responsavelId: string; substitutoId: string;
}

export function ActividadeFormDialog({
  open, onOpenChange, onSubmit, processos, membros, initial, mode = 'create', processoPreselecionado, areaIdFiltro
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSubmit: (data: ActividadeFormData) => Promise<void>
  processos: Processo[]
  membros: Membro[]
  initial?: Actividade | null
  mode?: 'create' | 'edit'
  processoPreselecionado?: string
  areaIdFiltro?: string // quando definido, filtra membros por esta área
}) {
  const [form, setForm] = useState<ActividadeFormData>({
    nome: '', descricao: '', frequencia: 'Mensal',
    processoId: '', responsavelId: '', substitutoId: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [erroValidacao, setErroValidacao] = useState('')

  useEffect(() => {
    if (open) {
      setForm({
        nome: initial?.nome ?? '',
        descricao: initial?.descricao ?? '',
        frequencia: initial?.frequencia ?? 'Mensal',
        processoId: initial?.processoId ?? processoPreselecionado ?? '',
        responsavelId: initial?.responsavelId ?? '',
        substitutoId: initial?.substitutoId ?? '',
      })
      setErroValidacao('')
    }
  }, [open, initial, processoPreselecionado])

  // Filtra membros pela área do processo seleccionado OU por areaIdFiltro
  const membrosFiltrados = useMemo(() => {
    const areaId = areaIdFiltro || processos.find(p => p.id === form.processoId)?.areaId
    if (!areaId) return membros
    return membros.filter(m => m.areaId === areaId)
  }, [membros, form.processoId, processos, areaIdFiltro])

  // Listas mutuamente exclusivas
  const membrosParaSubstituto = useMemo(() => membrosFiltrados.filter(m => m.id !== form.responsavelId), [membrosFiltrados, form.responsavelId])
  const membrosParaResponsavel = useMemo(() => membrosFiltrados.filter(m => m.id !== form.substitutoId), [membrosFiltrados, form.substitutoId])

  const submit = async () => {
    if (!form.nome.trim() || !form.processoId) return
    if (form.responsavelId && form.substitutoId && form.responsavelId === form.substitutoId) {
      setErroValidacao('O responsável e o substituto não podem ser a mesma pessoa.')
      return
    }
    setErroValidacao('')
    setSubmitting(true)
    try {
      await onSubmit(form)
      onOpenChange(false)
    } finally { setSubmitting(false) }
  }

  // Quando muda o processo, limpa responsável/substituto se não pertencerem à área
  const handleProcessoChange = (v: string) => {
    const newProcessoId = v === 'none' ? '' : v
    const proc = processos.find(p => p.id === newProcessoId)
    const areaId = proc?.areaId
    setForm(f => ({
      ...f,
      processoId: newProcessoId,
      responsavelId: f.responsavelId && areaId && !membros.some(m => m.id === f.responsavelId && m.areaId === areaId) ? '' : f.responsavelId,
      substitutoId: f.substitutoId && areaId && !membros.some(m => m.id === f.substitutoId && m.areaId === areaId) ? '' : f.substitutoId,
    }))
    setErroValidacao('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            {mode === 'edit' ? 'Editar Actividade' : 'Nova Actividade'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'Actualize os dados da actividade.' : 'Associe a actividade a um processo e defina responsáveis.'}
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
              <Select value={form.processoId || 'none'} onValueChange={handleProcessoChange}>
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
              <Label>Responsável {form.processoId && membrosFiltrados.length === 0 && <span className="text-xs text-muted-foreground italic">(sem membros nesta área)</span>}</Label>
              <Select value={form.responsavelId || 'none'} onValueChange={v => { setForm({ ...form, responsavelId: v === 'none' ? '' : v }); setErroValidacao('') }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem responsável</SelectItem>
                  {membrosParaResponsavel.map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Substituto {form.responsavelId && <span className="text-xs text-muted-foreground italic">(não pode ser o mesmo do responsável)</span>}</Label>
              <Select value={form.substitutoId || 'none'} onValueChange={v => { setForm({ ...form, substitutoId: v === 'none' ? '' : v }); setErroValidacao('') }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem substituto</SelectItem>
                  {membrosParaSubstituto.map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {erroValidacao && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {erroValidacao}
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={submit} disabled={submitting || !form.nome.trim() || !form.processoId}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === 'edit' ? 'Guardar' : 'Criar Actividade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ============== Modal: Tarefa (Criar/Editar) ============== */
export interface TarefaFormData {
  nome: string; descricao: string; inputs: string; outputs: string;
  instrucoesNasFerramentas: boolean;
  actividadeId: string; ferramentaIds: string[]; procedimentos: { descricao: string }[];
}

export function TarefaFormDialog({
  open, onOpenChange, onSubmit, actividades, ferramentas, initial, mode = 'create', actividadePreselecionada
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSubmit: (data: TarefaFormData) => Promise<void>
  actividades: Actividade[]
  ferramentas: Ferramenta[]
  initial?: (Tarefa & { procedimentos?: { id: string; passo: number; descricao: string }[] }) | null
  mode?: 'create' | 'edit'
  actividadePreselecionada?: string
}) {
  const [form, setForm] = useState<TarefaFormData>({
    nome: '', descricao: '', inputs: '', outputs: '',
    instrucoesNasFerramentas: false,
    actividadeId: '', ferramentaIds: [], procedimentos: [{ descricao: '' }]
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      const ferramentaIds = initial?.ferramentaIds ? initial.ferramentaIds.split(',').filter(Boolean) : []
      const procs = initial?.procedimentos?.length
        ? [...initial.procedimentos].sort((a, b) => a.passo - b.passo).map(p => ({ descricao: p.descricao }))
        : [{ descricao: '' }]
      setForm({
        nome: initial?.nome ?? '',
        descricao: initial?.descricao ?? '',
        inputs: initial?.inputs ?? '',
        outputs: initial?.outputs ?? '',
        instrucoesNasFerramentas: initial?.instrucoesNasFerramentas ?? false,
        actividadeId: initial?.actividadeId ?? actividadePreselecionada ?? '',
        ferramentaIds,
        procedimentos: procs,
      })
    }
  }, [open, initial, actividadePreselecionada])

  const addPasso = () => setForm(f => ({ ...f, procedimentos: [...f.procedimentos, { descricao: '' }] }))
  const removePasso = (i: number) => setForm(f => ({ ...f, procedimentos: f.procedimentos.filter((_, idx) => idx !== i) }))
  const updatePasso = (i: number, v: string) => setForm(f => ({
    ...f,
    procedimentos: f.procedimentos.map((p, idx) => idx === i ? { descricao: v } : p)
  }))
  const toggleFerramenta = (id: string) => setForm(f => ({
    ...f,
    ferramentaIds: f.ferramentaIds.includes(id) ? f.ferramentaIds.filter(x => x !== id) : [...f.ferramentaIds, id]
  }))

  const submit = async () => {
    if (!form.nome.trim() || !form.actividadeId || !form.inputs.trim() || !form.outputs.trim()) return
    setSubmitting(true)
    try {
      await onSubmit({ ...form, procedimentos: form.procedimentos.filter(p => p.descricao.trim()) })
      onOpenChange(false)
    } finally { setSubmitting(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-primary" />
            {mode === 'edit' ? 'Editar Tarefa' : 'Nova Tarefa'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'Actualize os dados da tarefa.' : 'Defina inputs, ferramentas, procedimentos (passos) e outputs.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-emerald-700">
                <ArrowDownToLine className="w-4 h-4" /> Inputs *
              </Label>
              <Textarea value={form.inputs} onChange={e => setForm({ ...form, inputs: e.target.value })} rows={3} placeholder="Ex.: Receber e-mail da ARSEG com pedido" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-orange-700">
                <ArrowUpFromLine className="w-4 h-4" /> Outputs *
              </Label>
              <Textarea value={form.outputs} onChange={e => setForm({ ...form, outputs: e.target.value })} rows={3} placeholder="Ex.: Resposta ao e-mail da ARSEG" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Wrench className="w-4 h-4" /> Ferramentas
            </Label>
            {ferramentas.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhuma ferramenta cadastrada.</p>
            ) : (
              <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-border bg-muted/30 max-h-32 overflow-y-auto">
                {ferramentas.map((f) => (
                  <button
                    key={f.id} type="button" onClick={() => toggleFerramenta(f.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                      form.ferramentaIds.includes(f.id) ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted border-border"
                    )}
                  >
                    {f.nome}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Checkbox: Instruções nas ferramentas */}
          <div className="p-3 rounded-lg border border-border bg-muted/20">
            <div className="flex items-start gap-3">
              <Checkbox
                id="t-instr-ferr"
                checked={form.instrucoesNasFerramentas}
                onCheckedChange={(checked) => setForm(f => ({ ...f, instrucoesNasFerramentas: !!checked }))}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label htmlFor="t-instr-ferr" className="text-sm font-medium cursor-pointer">
                  Instruções já estão implementadas nas ferramentas de trabalho
                </Label>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  Assinale se as instruções desta tarefa já se encontram disponíveis nas ferramentas onde o trabalho é executado
                  (ex.: no Pipefy, numa aba do ficheiro Excel actualizada diariamente, etc.). Este sistema serve apenas como mapeamento —
                  o objectivo é que as instruções estejam sempre nas ferramentas de trabalho.
                </p>
              </div>
            </div>
          </div>

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
                  <Input value={p.descricao} onChange={e => updatePasso(i, e.target.value)} placeholder={`Descreva o passo ${i + 1}...`} className="flex-1" />
                  {form.procedimentos.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="flex-shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removePasso(i)}>
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
          <Button onClick={submit} disabled={submitting || !form.nome.trim() || !form.actividadeId || !form.inputs.trim() || !form.outputs.trim()}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === 'edit' ? 'Guardar' : 'Criar Tarefa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ============== Modal: Ferramenta (Criar/Editar) ============== */
export interface FerramentaFormData { nome: string; descricao: string }

export function FerramentaFormDialog({
  open, onOpenChange, onSubmit, initial, mode = 'create'
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSubmit: (data: FerramentaFormData) => Promise<void>
  initial?: Ferramenta | null
  mode?: 'create' | 'edit'
}) {
  const [form, setForm] = useState<FerramentaFormData>({ nome: '', descricao: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({
        nome: initial?.nome ?? '',
        descricao: initial?.descricao ?? '',
      })
    }
  }, [open, initial])

  const submit = async () => {
    if (!form.nome.trim()) return
    setSubmitting(true)
    try {
      await onSubmit(form)
      onOpenChange(false)
    } finally { setSubmitting(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            {mode === 'edit' ? 'Editar Ferramenta' : 'Nova Ferramenta'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'Actualize os dados da ferramenta.' : 'Cadastre uma ferramenta de trabalho. As ferramentas são globais — podem ser usadas em qualquer área da companhia.'}
          </DialogDescription>
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
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={submit} disabled={submitting || !form.nome.trim()}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === 'edit' ? 'Guardar' : 'Criar Ferramenta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ============== Diálogo de confirmação de eliminação ============== */
export function DeleteConfirmDialog({
  open, onOpenChange, onConfirm, title, message, loading
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onConfirm: () => void
  title: string
  message: string
  loading?: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ============== Info icon para Tipo de Processo ============== */
function InfoTipoProcesso() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); setOpen(!open) }}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        className="text-muted-foreground hover:text-primary transition-colors"
        aria-label="Informação sobre tipos de processo"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute z-50 top-6 left-0 w-72 p-3 rounded-lg border border-border bg-popover shadow-md text-xs space-y-2">
          <div>
            <p className="font-semibold text-emerald-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Inbound
            </p>
            <p className="text-muted-foreground mt-0.5">Processos que recebem entradas externas — informação ou pedidos que chegam à companhia (ex.: recepção de e-mails, reclamações, propostas de clientes).</p>
          </div>
          <div>
            <p className="font-semibold text-orange-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500" /> Outbound
            </p>
            <p className="text-muted-foreground mt-0.5">Processos que enviam saídas para o exterior — respostas, relatórios ou entregas enviadas pela companhia (ex.: envio de relatórios à ARSEG, resposta a clientes).</p>
          </div>
          <div>
            <p className="font-semibold text-violet-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-violet-500" /> Gestão
            </p>
            <p className="text-muted-foreground mt-0.5">Processos internos de gestão e administração — actividades de coordenação, planeamento e controlo que não são nem inbound nem outbound.</p>
          </div>
        </div>
      )}
    </div>
  )
}
