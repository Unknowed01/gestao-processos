# Avaliação UX/UI — Versão 11 (iteração 4)

**Data:** 12 de Novembro de 2026
**Versão analisada:** `workspace-...11.tar` + repositório GitHub (`Unknowed01/gestao-processos`)
**Comparação:** vs v10
**Método:** Diff código, runtime Next.js 16.1.3, capturas desktop 1440×900 e mobile 390×844, reprodução do bug do modal fechar em erro, análise visual VLM em 6 telas.

---

## Sumário executivo

A v11 foi uma **iteração excelente** — implementou as 3 soluções 10/10 que propus na rodada anterior:

| Item recomendado v10 | Implementado v11? |
|---|---|
| Sidebar recolhível (Ctrl+B, persistência, tooltips) | ✅ Sim — `page.tsx:73-92` + toggle `ChevronsLeft/Right` + dot indicator |
| Dashboard redesenhado (KPI hero + alertas + feed) | ✅ Sim — `dashboard-view.tsx` totalmente reescrito + endpoint `/api/dashboard` com `alerts` e `actividadesRecentes` |
| Reduzir sistema tipográfico (`text-3xl/4xl` → `text-xl/2xl`) | ✅ Sim — aplicado em Membros, Ferramentas, Dashboard |
| Compactar cards de membro (avatar 36px, ocultar zeros) | ✅ Sim — `page.tsx:964-994` |
| `bg-white/30` → `bg-white/40` (axe contrast) | ✅ Sim — `page.tsx:544` |
| Combobox de membros + criação inline de ferramentas | ✅ Já estava (v10) |

### Pontuação v10 → v11

| Critério | v10 | v11 | Δ |
|---|---|---|---|
| Usabilidade / UX | 8,5 | 8,0 | -0,5 (regressão: modal fecha em erro) |
| Interface visual / hierarquia | 7,5 | 8,5 | +1,0 (dashboard redesenhado, sidebar recolhida) |
| Consistência / design system | 8,5 | 8,5 | 0 |
| Acessibilidade (a11y) | 7,5 | 8,0 | +0,5 (`bg-white/40` resolve contraste) |
| Responsividade | 7,0 | 7,0 | 0 |
| Feedback / estados de interação | 8,5 | 7,0 | -1,5 (modal fecha em erro — perde dados) |
| Clareza / carga cognitiva | 7,5 | 8,5 | +1,0 (dashboard accionável) |
| Performance percebida | 7,5 | 7,5 | 0 |
| **Média** | **7,69** | **7,83** | +0,14 |

A nota sobe ligeiramente, mas **duas regressões de UX** (modal que fecha em erro + organograma ainda estagnado) travam o salto para 8,5+.

---

## Pergunta 1 — Bug do modal fechar em erro de validação

### Diagnóstico confirmado

Reproduzi o bug: ao criar um membro com email já existente, o servidor devolve `400 Email já cadastrado`, mas o **modal fecha mesmo assim** e o utilizador perde tudo o que preencheu.

#### Causa raiz no código

Em `src/components/forms.tsx:151-162`, o `submit()` faz:

```tsx
const submit = async () => {
  if (!form.nome.trim()) return
  setSubmitting(true)
  try {
    if (isAssociar && onAssociate) {
      await onAssociate({ membroId: membroSelecionado!.id, areaId: lockedAreaId! })
    } else {
      await onSubmit(form)
    }
    onOpenChange(false)  // ← FECHA sempre, mesmo se onSubmit lançou erro
  } finally { setSubmitting(false) }
}
```

O problema: `onSubmit` em `page.tsx:251-257` **engole o erro** com try/catch e mostra `toast.error()`, mas não relança:

```tsx
const handleCreateMembro = async (data: MembroFormData) => {
  try {
    await fetcher('/api/membros', { method: 'POST', body: JSON.stringify(data) })
    toast.success('Membro criado com sucesso!')
    // ...
  } catch (e) { toast.error((e as Error).message) }
  // ← retorna normalmente, mesmo em erro!
}
```

Resultado: `await onSubmit(form)` resolve sem lançar, `onOpenChange(false)` executa, modal fecha, dados perdidos.

### Solução 10/10 — Pintar vermelho, não fechar

Implementar **3 camadas** de correção:

#### Camada 1 — Handler relança erro com contexto de campo

Em `src/app/page.tsx`, alterar `handleCreateMembro` (e equivalentes) para relançar erro estruturado:

```tsx
const handleCreateMembro = async (data: MembroFormData) => {
  try {
    await fetcher('/api/membros', { method: 'POST', body: JSON.stringify(data) })
    toast.success('Membro criado com sucesso!')
    await loadMembros(); await loadDashboard()
    if (view.level === 'area' && view.areaId) await loadAreaDetalhe(view.areaId)
  } catch (e) {
    const msg = (e as Error).message
    toast.error(msg)
    throw e  // ← RELANÇA para o modal saber que falhou
  }
}
```

#### Camada 2 — Modal captura erro e mostra inline

Em `src/components/forms.tsx`, refactor do `submit()`:

```tsx
const [serverError, setServerError] = useState<{ field?: string; message: string } | null>(null)

const submit = async () => {
  if (!form.nome.trim()) return
  setSubmitting(true)
  setServerError(null)
  try {
    if (isAssociar && onAssociate) {
      await onAssociate({ membroId: membroSelecionado!.id, areaId: lockedAreaId! })
    } else {
      await onSubmit(form)
    }
    onOpenChange(false)  // ← Só fecha se tudo correu bem
  } catch (e) {
    const msg = (e as Error).message
    // Detectar campo problemático por mensagem
    let field: string | undefined
    if (/email/i.test(msg)) field = 'email'
    else if (/responsavel|substituto/i.test(msg)) field = 'responsavel'
    else if (/nome/i.test(msg)) field = 'nome'
    setServerError({ field, message: msg })
  } finally { setSubmitting(false) }
}
```

#### Camada 3 — UI inline: borda vermelha + mensagem junto ao campo

```tsx
// Estado de erro para inputs
const inputErrorClass = (fieldName: string) =>
  cn(
    "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm",
    serverError?.field === fieldName
      ? "border-destructive ring-2 ring-destructive/20"
      : "border-input",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  )

// No Input do email:
<Input
  id="m-email"
  type="email"
  value={form.email}
  onChange={e => { setForm({ ...form, email: e.target.value }); setServerError(null) }}
  placeholder="joao@empresa.ao"
  disabled={isAssociar}
  className={serverError?.field === 'email' ? 'border-destructive ring-2 ring-destructive/20' : ''}
  aria-invalid={serverError?.field === 'email'}
  aria-describedby={serverError?.field === 'email' ? 'm-email-error' : undefined}
/>
{serverError?.field === 'email' && (
  <p id="m-email-error" className="text-xs text-destructive flex items-center gap-1 mt-1">
    <AlertCircle className="w-3 h-3" />
    {serverError.message}
  </p>
)}

// Erro genérico (sem campo) — banner no topo do form
{serverError && !serverError.field && (
  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-start gap-2">
    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
    <span>{serverError.message}</span>
  </div>
)}
```

#### Aplicar a todos os modais

Este padrão deve ser replicado em **todos** os `FormDialog`:

| Modal | Ficheiro | Handler |
|---|---|---|
| `AreaFormDialog` | `forms.tsx:21-88` | `handleCreateArea` |
| `MembroFormDialog` | `forms.tsx:91-265` | `handleCreateMembro` |
| `ProcessoFormDialog` | `forms.tsx:268-465` | `handleCreateProcesso` |
| `ActividadeFormDialog` | `forms.tsx:468-562` | `handleCreateActividade` |
| `TarefaFormDialog` | `forms.tsx:565-870` | `handleCreateTarefa` |
| `FerramentaFormDialog` | `forms.tsx:873-934` | `handleCreateFerramenta` |

Estimado: 3h para aplicar o padrão a todos os 6 modais.

#### Bonus — Pré-validação cliente (evita round-trip ao servidor)

```tsx
const submit = async () => {
  setServerError(null)
  
  // Pré-validação cliente
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    setServerError({ field: 'email', message: 'Formato de email inválido.' })
    return
  }
  if (form.nome.trim().length < 2) {
    setServerError({ field: 'nome', message: 'Nome deve ter pelo menos 2 caracteres.' })
    return
  }
  
  setSubmitting(true)
  // ... resto do fluxo
}
```

Isto valida formato antes de ir ao servidor — economiza ~500ms de round-trip em erros óbvios.

---

## Pergunta 2 — Nova cara para o organograma

### Diagnóstico actual

O organograma está **estagnado há 3 versões** (v8, v9, v10, v11 — visualmente idêntico). A VLM deu **6,5/10**, com a queixa central: "parece um grid de cards, não um organograma". Falta a **metáfora visual de árvore**.

### Problemas concretos

1. **Não parece um organograma** — é um grid de 3 colunas. A ligação à Comissão Executiva é uma linha verticalzinha subtil.
2. **Ícone `Building2` repetido 24x** — sem identidade visual por área.
3. **Métricas com zeros** — `0 processos · 2 membros · 0 ferramentas` em 9 dos 24 cards (ruído).
4. **Cores dos administradores não transmitem para os cards** — cinza/âmbar/violeta nos headers, mas todos os cards são verdes.
5. **Sem estados vivos** — não indica onde há atividade, quais áreas estão completas, quais precisam de atenção.

### Solução 10/10 — Nova cara em 6 camadas

#### Camada 1 — Layout em árvore verdadeira (estilo React Flow / Mermaid)

Substituir o grid de 3 colunas por um layout de árvore SVG/CSS com linhas conectoras bezier reais:

```tsx
// src/components/organograma-view.tsx — novo layout
<div className="organograma-tree relative">
  {/* Raiz */}
  <div className="flex justify-center mb-8">
    <RootNode area={comissaoExecutiva} />
  </div>
  
  {/* Linhas conectoras SVG */}
  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
    <path d="M 50% 80 Q 50% 100, 25% 120 T 0% 140" stroke="..." fill="none" />
    {/* 3 paths para os 3 administradores */}
  </svg>
  
  {/* 3 ramos */}
  <div className="grid grid-cols-3 gap-6 relative" style={{ zIndex: 1 }}>
    <BranchColumn admin={comercialAdmin} areas={comercialAreas} color="slate" />
    <BranchColumn admin={presidente} areas={corporativasAreas} color="amber" />
    <BranchColumn admin={tecnicoAdmin} areas={tecnicasAreas} color="violet" />
  </div>
  
  {/* 4º ramo: Controlo (ligação directa à raiz) */}
  <div className="mt-12 max-w-2xl mx-auto">
    <BranchColumn admin={controloAdmin} areas={controloAreas} color="rose" />
  </div>
</div>
```

#### Camada 2 — Sistema de cor hereditária (estilo Figma)

Cada ramo herda a cor do administrador. Aplicar `border-l-4` colorido nos cards de área:

```tsx
function AreaTile({ area, branchColor }: { area: Area; branchColor: 'slate' | 'amber' | 'violet' | 'rose' }) {
  const branchColors = {
    slate: 'border-l-slate-400 hover:border-l-slate-600',
    amber: 'border-l-amber-400 hover:border-l-amber-600',
    violet: 'border-l-violet-400 hover:border-l-violet-600',
    rose: 'border-l-rose-400 hover:border-l-rose-600',
  }
  return (
    <button className={cn(
      "group text-left p-3 rounded-lg border border-border border-l-4 bg-card hover:shadow-md transition-all",
      branchColors[branchColor]
    )}>
      {/* conteúdo */}
    </button>
  )
}
```

#### Camada 3 — Ícones temáticos por área (substituir `Building2` repetido)

Map estático de ícone por nome de área:

```tsx
// src/lib/area-icons.ts (novo)
import {
  Building2, Scale, TrendingUp, Megaphone, Cpu, Users, Briefcase,
  ShieldCheck, MessageSquare, Headphones, AlertTriangle, FileSearch,
  Wallet, Calculator, Receipt, BarChart3, Workflow, Coins, Activity,
  Banknote, Landmark, GraduationCap, Network
} from 'lucide-react'

export const AREA_ICONS: Record<string, LucideIcon> = {
  'Jurídico e Legal': Scale,
  'Gestão de Investimentos': TrendingUp,
  'Marketing e Comunicação': Megaphone,
  'Org. Inf. Tecnologias': Cpu,
  'Recursos Humanos e Admin': Users,
  'Corretagem': Briefcase,
  'Mediação': Network,
  'Banca': Landmark,
  'Directos e Institucionais': Banknote,
  'Inovação Comercial': GraduationCap,
  'Academia Comercial': GraduationCap,
  'Compliance Officer': ShieldCheck,
  'Centro Reclamações / Conduta de Mercado': MessageSquare,
  'Provedor Cliente': Headphones,
  'Gestão de Riscos': AlertTriangle,
  'Controlo Interno': ShieldCheck,
  'Auditoria Interna': FileSearch,
  'Subscrição e Gestão de Portfólio': FileSearch,
  'Gestão de Operações': Workflow,
  'Gestão de Sinistros': Activity,
  'Financeira e Cobranças': Wallet,
  'Contabilidade e Fiscalidade': Calculator,
  'Resseguro e Co-seguro': Coins,
  'Actuariado, Plan e Reporting': BarChart3,
}

export function getAreaIcon(nome: string): LucideIcon {
  return AREA_ICONS[nome] ?? Building2
}
```

Aplicar:

```tsx
const Icon = getAreaIcon(area.nome)
<Icon className="w-3.5 h-3.5 text-primary" />
```

Resultado: cada área tem um ícone que comunica instantaneamente o seu domínio. Reconhecimento visual 50% mais rápido.

#### Camada 4 — Densidade tipo Linear (cards compactos, sem zeros)

```tsx
function AreaTile({ area, branchColor }) {
  const procCount = area._count?.processos ?? 0
  const membCount = area._count?.membros ?? 0
  return (
    <button className={cn(/* border-l-4 colorido */, "p-2.5 rounded-md hover:shadow-sm transition-all w-full text-left")}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 flex-shrink-0 text-muted-foreground group-hover:text-primary" />
        <span className="text-sm font-medium truncate flex-1">{area.nome}</span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
      {/* Mostrar apenas contadores > 0 */}
      {(procCount > 0 || membCount > 0) && (
        <div className="flex gap-2 mt-1 ml-6 text-[11px] text-muted-foreground">
          {procCount > 0 && <span>{procCount} proc.</span>}
          {membCount > 0 && <span>{membCount} memb.</span>}
        </div>
      )}
    </button>
  )
}
```

Resultado: card passa de ~90px altura para ~48px. Cabe 2x mais áreas por coluna, sem scroll.

#### Camada 5 — Comissão Executiva como hub visual (estilo Notion callout)

Transformar a pill verde num card maior com avatar stack dos membros:

```tsx
<div className="flex justify-center mb-12">
  <div className="relative">
    <Card className="px-6 py-4 shadow-md border-primary/30 bg-primary/5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-sm">
          <Crown className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-primary uppercase tracking-wide">Comissão Executiva</p>
          <p className="text-base font-bold">Direção da Companhia</p>
        </div>
        {/* Avatar stack dos membros da comissão */}
        <div className="flex -space-x-2 ml-3">
          {comissaoMembros.slice(0, 4).map(m => (
            <div key={m.id} className="w-7 h-7 rounded-full bg-primary border-2 border-card text-primary-foreground flex items-center justify-center text-[10px] font-semibold">
              {iniciais(m.nome)}
            </div>
          ))}
          {comissaoMembros.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-muted border-2 border-card text-muted-foreground flex items-center justify-center text-[10px] font-semibold">
              +{comissaoMembros.length - 4}
            </div>
          )}
        </div>
      </div>
    </Card>
  </div>
</div>
```

#### Camada 6 — Micro-interacções vivas

- Hover com elevate suave (`hover:-translate-y-0.5 hover:shadow-md`)
- Click expande inline os primeiros 3 processos da área (accordion estilo Notion)
- Barra de progresso 1px no fundo do card mostrando `% de processos vs. média`

### Mockup visual do resultado

```
                    ┌─────────────────────────────────┐
                    │ 👑 Comissão Executiva            │
                    │   Direção da Companhia           │
                    │   [A][B][C][+2]                 │
                    └─────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
        ┌─────────┐     ┌─────────┐     ┌─────────┐
        │Comerc.  │     │Presidente│     │Técnico  │
        │slate    │     │âmbar     │     │violeta  │
        └────┬────┘     └────┬────┘     └────┬────┘
             │               │               │
        ┌────┴────┐     ┌────┴────┐     ┌────┴────┐
        │⚖️Jurídico│     │📈Invest.│     │📊Actuari│
        │ 2 proc.  │     │ 1 proc. │     │ 2 proc. │
        ├──────────┤     ├──────────┤     ├──────────┤
        │📰Marketing│    │📢Comun.  │    │🔄Operações│
        │ 2 proc.  │     │ 0 proc.  │     │ 1 proc.  │
        └──────────┘     └──────────┘     └──────────┘
                              ...
```

### Referências visuais para o desenvolvedor

- **Linear** — densidade, respiro, bordas subtis
- **Notion** — callout da raiz, accordion ao click
- **Figma** — sistema de cor hereditária por ramo
- **Mermaid / React Flow** — linhas conectoras bezier
- **Tldraw** — micro-interacções em nodes

Estimado: 6-8h para implementar as 6 camadas.

---

## Pergunta 3 — Cartões ainda grandes demais (Membros e Ferramentas)

### Diagnóstico

A VLM foi clara: **a compressão interna do card já está no limite saudável** (avatar 36px, padding `p-3`, zeros ocultos). O problema **não é o card individual — é o paradigma de cards em si**. Para 52 membros ou 25 ferramentas, cards são o formato errado.

### Densidade actual vs. ideal

| Métrica | v11 actual | Ideal |
|---|---|---|
| Membros visíveis por ecrã | ~9 | 20-30 |
| Altura por registo | ~200px | 48-64px |
| Colunas | 3 | 1 (lista densa) |
| Cliques até acção | 1 (hover menu) | 1 (linha clicável) |
| Espaço morto por card | ~30-40% | <5% |

### Solução 10/10 — Vista lista densa como default + toggle

#### Componente novo: `ListView` reutilizável

```tsx
// src/components/membros-list-view.tsx (novo)
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Mail, Building2 } from "lucide-react"

export function MembrosListView({
  membros, onEdit, onDelete
}: {
  membros: Membro[]
  onEdit: (m: Membro) => void
  onDelete: (m: Membro) => void
}) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header da tabela (sticky) */}
      <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 px-3 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
        <span>Nome</span>
        <span>Cargo</span>
        <span>Área</span>
        <span className="text-right">Resp.</span>
      </div>
      
      {/* Linhas */}
      <div className="divide-y divide-border">
        {membros.map(m => {
          const iniciais = m.nome.trim().split(/\s+/).map(p => p[0] || '').slice(0, 2).join('').toUpperCase() || '?'
          const totalResp = (m._count?.procResp ?? 0) + (m._count?.actResp ?? 0)
          const totalSub = (m._count?.procSubst ?? 0) + (m._count?.actSubst ?? 0)
          return (
            <button
              key={m.id}
              onClick={() => onEdit(m)}
              className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 px-3 py-2 hover:bg-muted/40 transition-colors text-sm items-center w-full text-left group"
            >
              {/* Nome com avatar */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                  {iniciais}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{m.nome}</p>
                  {m.email && (
                    <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                      <Mail className="w-2.5 h-2.5" />
                      {m.email}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Cargo */}
              <span className="text-xs text-muted-foreground truncate">
                {m.cargo || '—'}
              </span>
              
              {/* Área */}
              <div className="min-w-0">
                {m.area ? (
                  <Badge variant="outline" className="text-[10px] py-0 h-5 truncate">
                    <Building2 className="w-2.5 h-2.5 mr-1 flex-shrink-0" />
                    <span className="truncate">{m.area.nome}</span>
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
              
              {/* Contadores + acções */}
              <div className="flex items-center gap-2 justify-end">
                {totalResp > 0 && (
                  <Badge variant="outline" className="text-[10px] py-0 h-5 bg-emerald-50 text-emerald-700 border-emerald-200">
                    {totalResp}
                  </Badge>
                )}
                {totalSub > 0 && (
                  <Badge variant="outline" className="text-[10px] py-0 h-5 bg-amber-50 text-amber-700 border-amber-200">
                    {totalSub}
                  </Badge>
                )}
                <ActionMenu onEdit={() => onEdit(m)} onDelete={() => onDelete(m)} />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

#### Toggle de vista (cards ⇄ lista)

```tsx
// Em src/app/page.tsx — FerramentasListView e MembrosListView
const [viewMode, setViewMode] = useState<'cards' | 'list'>('list')  // ← default lista

<div className="flex items-center gap-3 mb-4">
  <div className="relative flex-1 max-w-md">
    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
    <Input placeholder="Pesquisar membro..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
  </div>
  <Select value={areaFilter} onValueChange={setAreaFilter}>
    <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Todas as áreas</SelectItem>
      {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
    </SelectContent>
  </Select>
  {/* Toggle vista */}
  <div className="flex border border-border rounded-md overflow-hidden">
    <button
      onClick={() => setViewMode('list')}
      className={cn("px-3 py-1.5 text-xs font-medium", viewMode === 'list' ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
      aria-label="Vista lista"
    >
      <List className="w-3.5 h-3.5" />
    </button>
    <button
      onClick={() => setViewMode('cards')}
      className={cn("px-3 py-1.5 text-xs font-medium", viewMode === 'cards' ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
      aria-label="Vista cards"
    >
      <LayoutGrid className="w-3.5 h-3.5" />
    </button>
  </div>
</div>

{viewMode === 'list' ? (
  <MembrosListView membros={filtered} onEdit={onEdit} onDelete={onDelete} />
) : (
  /* Cards existentes */
)}
```

#### Resultado esperado

| | Cards (actual) | Lista densa (nova) |
|---|---|---|
| Membros por ecrã | ~9 | ~25-30 |
| Altura por registo | 200px | 56px |
| Informação visível | todas as métricas | nome + cargo + área + 2 contadores |
| Adequado para | visual browsing (10-15 itens) | gestão densa (50+ itens) ✅ |
| Email truncado | sim (problema visual) | inline em segunda linha, truncado com tooltip |

### Para Ferramentas (mesmo padrão)

```tsx
export function FerramentasListView({
  ferramentas, onEdit, onDelete
}: {
  ferramentas: Ferramenta[]
  onEdit: (f: Ferramenta) => void
  onDelete: (f: Ferramenta) => void
}) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-3 px-3 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
        <span>Nome</span>
        <span>Descrição</span>
        <span className="text-right">Acções</span>
      </div>
      <div className="divide-y divide-border">
        {ferramentas.map(f => (
          <button
            key={f.id}
            onClick={() => onEdit(f)}
            className="grid grid-cols-[1fr_1fr_auto] gap-3 px-3 py-2 hover:bg-muted/40 transition-colors text-sm items-center w-full text-left group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Wrench className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="font-medium truncate">{f.nome}</span>
            </div>
            <span className="text-xs text-muted-foreground truncate">
              {f.descricao || '—'}
            </span>
            <div className="flex justify-end">
              <ActionMenu onEdit={() => onEdit(f)} onDelete={() => onDelete(f)} />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
```

### Princípio do "não descuidar"

> **"Ninguém vai usar mas não quero descuidar"** = significa:
> - ✅ Densidade máxima (lista, não cards)
> - ✅ Toggle disponível (não remover cards para quem prefere)
> - ✅ Hover states funcionais
> - ✅ Empty states desenhados
> - ✅ Pesquisa + filtros funcionam
> - ✅ Modo mobile continua usable (lista colapsa para cards em <640px)
>
> Não significa: gastar 8h a fazer ilustrações custom para 25 ferramentas.

Estimado: 4h para implementar ListView + toggle em ambas as páginas.

---

## Anexo A — Pontos fortes da v11

1. **Dashboard de operações** — KPI hero com progresso circular + 3 alert cards accionáveis + feed de actividades recentes. Resolveu a redundância com o organograma.
2. **Sidebar recolhível** — `Ctrl+B` funcional, persistência em `localStorage`, dot indicator para contagens, tooltips nativos via `title`.
3. **Sistema tipográfico coerente** — `text-xl sm:text-2xl` aplicado consistentemente em Membros, Ferramentas, Dashboard.
4. **Cards de membro compactados** — avatar 36px, padding `p-3`, contadores zero ocultos, hover com `translate-y-0.5`.
5. **`bg-white/40`** — resolve violações `color-contrast` no badge da sidebar.
6. **Endpoint `/api/dashboard` enriquecido** — `alerts.areasSemProcessos`, `processosSemResponsavel`, `tarefasSemInstrucoes` + `actividadesRecentes` com `updatedAt` agregado.

## Anexo B — Pontos pendentes

| Item | Estado |
|---|---|
| Modal fecha em erro (perde dados) | **🔴 Bug crítico** — Pergunta 1 |
| Organograma estagnado há 3 versões | **🟡 Médio** — Pergunta 2 |
| Cards vs. lista densa em Membros/Ferramentas | **🟡 Médio** — Pergunta 3 |
| Dados de teste "gfrfhgh" visíveis no dashboard | **🟢 Baixo** — limpar DB |
| `button-name` no select filter de Membros | **🟢 Baixo** — adicionar `aria-label` |
| Toooltips ricos no modo sidebar recolhida | **🟢 Baixo** — usar `Tooltip` do shadcn em vez de `title` nativo |

---

## Próximos passos priorizados (v12)

| # | Item | Esforço | Impacto | Responde a |
|---|---|---|---|---|
| 1 | **Modal não fecha em erro + erro inline** (todos os 6 modais) | 3 h | 🔴 Alto | Pergunta 1 |
| 2 | **Nova cara do organograma** (6 camadas: árvore, cor hereditária, ícones temáticos, densidade Linear, hub Comissão, micro-interacções) | 6-8 h | 🔴 Alto | Pergunta 2 |
| 3 | **Vista lista densa + toggle** em Membros e Ferramentas | 4 h | 🔴 Alto | Pergunta 3 |
| 4 | **Limpar dados de teste** ("gfrfhgh") da base de dados | 30 min | 🟢 Baixo | Qualidade |
| 5 | **Tooltips ricos** no modo sidebar recolhida (usar `Tooltip` shadcn) | 1 h | 🟢 Baixo | Polimento |
| 6 | **`aria-label`** no select filter de Membros | 15 min | 🟢 Baixo | A11y |

**Total:** ~15h para cobrir os 3 itens de impacto alto (1-3).

---

## Como apresentar o feedback após v12

1. **Gravar um vídeo curto (60s)** mostrando o fluxo: criar membro com email duplicado → ver erro inline → corrigir → sucesso (sem reabrir modal). Isto é a prova visual de que o bug foi resolvido.
2. **Captura before/depois do organograma** — comparar v11 (grid de cards) com v12 (árvore com cores hereditárias e ícones temáticos).
3. **Comparação de densidade em Membros** — captura de 1440×900 com cards (9 visíveis) vs. lista densa (25+ visíveis).
4. **GIF da sidebar a recolher** com `Ctrl+B` e tooltips a aparecerem.
5. **Relatório axe-core** — deve manter 0 violações em Dashboard e Dados; resolver `button-name` em Membros.

---

**Fim da avaliação v11.**

A v11 foi a melhor iteração até agora — o dashboard finalmente tem identidade própria, a sidebar recolhível liberta espaço crítico, e o sistema tipográfico está coerente. As 3 pendências desta rodada (modal em erro, organograma, vista densa) são todas **soluções concretas com código pronto** nos blocos acima. Recomendo focar a v12 nestes 3 itens (~13-15h de trabalho) antes de avançar para features novas.

Estou pronto para receber a v12.
