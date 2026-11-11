'use client'

import { useState, useEffect } from 'react'
import {
  Building2, Workflow, Activity, ListChecks, ChevronRight, ChevronDown,
  Loader2, CircleDot
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TIPO_DOT } from '@/lib/types'

export interface TreeNode {
  id: string
  nome: string
  tipo?: string
  frequencia?: string
  instrucoesNasFerramentas?: boolean
  actividades?: TreeNode[]
  tarefas?: TreeNode[]
}

export interface AreaTree {
  id: string
  nome: string
  descricao?: string | null
  objectivos?: string | null
  processos: TreeNode[]
  membros: { id: string; nome: string; cargo?: string | null }[]
  _count: { processos: number; membros: number }
}

interface TreeSidebarProps {
  areaId: string
  selectedLevel: 'area' | 'processo' | 'actividade' | 'tarefa'
  selectedProcessoId?: string
  selectedActividadeId?: string
  selectedTarefaId?: string
  onSelectArea: () => void
  onSelectProcesso: (id: string) => void
  onSelectActividade: (processoId: string, actividadeId: string) => void
  onSelectTarefa: (processoId: string, actividadeId: string, tarefaId: string) => void
}

export function TreeSidebar({
  areaId, selectedLevel, selectedProcessoId, selectedActividadeId, selectedTarefaId,
  onSelectArea, onSelectProcesso, onSelectActividade, onSelectTarefa
}: TreeSidebarProps) {
  const [tree, setTree] = useState<AreaTree | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Carrega a árvore quando areaId muda
  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    fetch(`/api/areas/${areaId}/tree`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          setTree(data)
          setLoading(false)
        }
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [areaId])

  // Um nó é expandido se o utilizador o expandiu manualmente OU se é pai do item seleccionado
  const isExpanded = (key: string): boolean => {
    if (expanded.has(key)) return true
    // Auto-expande pais do item seleccionado
    if (selectedProcessoId && key === `proc-${selectedProcessoId}`) return true
    if (selectedActividadeId && key === `act-${selectedActividadeId}`) return true
    return false
  }

  const toggle = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!tree) {
    return <div className="text-xs text-muted-foreground text-center py-4">Erro ao carregar</div>
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho da árvore */}
      <div className="px-3 py-2.5 border-b border-border">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Hierarquia</p>
      </div>

      {/* Árvore */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 text-sm">
        {/* Nó raiz: Área */}
        <TreeItem
          icon={Building2}
          label={tree.nome}
          level={0}
          active={selectedLevel === 'area'}
          onClick={onSelectArea}
          bold
        />

        {/* Processos */}
        {tree.processos.map(proc => {
          const procKey = `proc-${proc.id}`
          const procExpanded = isExpanded(procKey)
          const isProcActive = selectedLevel === 'processo' && selectedProcessoId === proc.id
          return (
            <div key={proc.id}>
              <TreeItem
                icon={Workflow}
                label={proc.nome}
                level={1}
                active={isProcActive}
                hasChildren={(proc.actividades?.length ?? 0) > 0}
                expanded={procExpanded}
                onToggle={() => toggle(procKey)}
                onClick={() => onSelectProcesso(proc.id)}
                dotColor={proc.tipo ? TIPO_DOT[proc.tipo] : undefined}
              />
              {procExpanded && proc.actividades?.map(act => {
                const actKey = `act-${act.id}`
                const actExpanded = isExpanded(actKey)
                const isActActive = selectedLevel === 'actividade' && selectedActividadeId === act.id
                return (
                  <div key={act.id}>
                    <TreeItem
                      icon={Activity}
                      label={act.nome}
                      level={2}
                      active={isActActive}
                      hasChildren={(act.tarefas?.length ?? 0) > 0}
                      expanded={actExpanded}
                      onToggle={() => toggle(actKey)}
                      onClick={() => onSelectActividade(proc.id, act.id)}
                    />
                    {actExpanded && act.tarefas?.map(t => {
                      const isTarefaActive = selectedLevel === 'tarefa' && selectedTarefaId === t.id
                      return (
                        <TreeItem
                          key={t.id}
                          icon={ListChecks}
                          label={t.nome}
                          level={3}
                          active={isTarefaActive}
                          onClick={() => onSelectTarefa(proc.id, act.id, t.id)}
                          showInstrucoes={t.instrucoesNasFerramentas}
                        />
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )
        })}

        {tree.processos.length === 0 && (
          <p className="text-xs text-muted-foreground italic px-3 py-2">Sem processos. Crie o primeiro na aba "Processos".</p>
        )}
      </div>
    </div>
  )
}

/* ============== Item da árvore ============== */
function TreeItem({
  icon: Icon, label, level, active, hasChildren, expanded, onToggle, onClick,
  bold, dotColor, showInstrucoes
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  level: number
  active: boolean
  hasChildren?: boolean
  expanded?: boolean
  onToggle?: () => void
  onClick: () => void
  bold?: boolean
  dotColor?: string
  showInstrucoes?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors group",
        active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
        level > 0 && "ml-3"
      )}
      style={{ paddingLeft: `${0.5 + level * 1.1}rem` }}
      onClick={onClick}
    >
      {/* Toggle expand/collapse */}
      {hasChildren ? (
        <button
          onClick={(e) => { e.stopPropagation(); onToggle?.() }}
          className={cn(
            "flex-shrink-0 w-4 h-4 flex items-center justify-center",
            active ? "text-primary-foreground" : "text-muted-foreground"
          )}
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      ) : (
        <span className="w-4 flex-shrink-0" />
      )}

      {/* Icon */}
      <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", active ? "text-primary-foreground" : "text-muted-foreground")} />

      {/* Dot color (para tipo de processo) */}
      {dotColor && (
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dotColor)} />
      )}

      {/* Label */}
      <span className={cn(
        "truncate flex-1 text-xs",
        bold && "font-semibold",
        !active && "text-foreground"
      )}>
        {label}
      </span>

      {/* Indicador de instruções nas ferramentas */}
      {showInstrucoes && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full flex-shrink-0",
            "bg-emerald-500"
          )}
          title="Instruções nas ferramentas"
        />
      )}
    </div>
  )
}
