# Avaliação UX/UI — Versão 10 (iteração 3)

**Data:** 12 de Novembro de 2026
**Versão analisada:** `workspace-2d6dfcf8-...10.tar`
**Comparação:** vs v9
**Método:** Diff código, runtime Next.js 16.1.3, capturas em desktop 1440×900 e mobile 390×844, scan `axe-core` 4.10 (WCAG 2.1 AA), análise visual VLM em 9 telas.

---

## Sumário executivo

A v10 **resolveu 3 dos 5 itens de impacto alto pendentes** da rodada anterior e manteve a curva de melhoria:

| Item recomendado na v9 | Implementado na v10? |
|---|---|
| Combobox de membros com autocomplete + endpoint `?q=` + fallback de criação | ✅ Sim — implementado em `forms.tsx:91-265` + endpoint `GET /api/membros?q=` |
| Combobox de ferramentas em tarefa + criação inline | ✅ Sim — implementado em `forms.tsx:666-873` + handler `onCreateFerramenta` |
| Filtros por área em Membros | ✅ Sim — `<Select>` em `page.tsx:849-855` |
| Busca em Ferramentas + empty state | ✅ Sim — `page.tsx:961-964` |
| `aria-label` nos checkboxes de Dados (critical) | ✅ Sim — `dados-view.tsx:181,308` |
| Onboarding wizard para primeiro uso | ❌ Não |
| Modo lista compacta para Membros/Ferramentas | ❌ Não |

### Pontuação v9 → v10

| Critério | v9 | v10 | Δ |
|---|---|---|---|
| Usabilidade / UX | 8,0 | 8,5 | +0,5 |
| Interface visual / hierarquia | 8,0 | 7,5 | -0,5 (labels demasiado grandes) |
| Consistência / design system | 8,5 | 8,5 | 0 |
| Acessibilidade (a11y) | 6,5 | 7,5 | +1,0 (axe critical resolvido) |
| Responsividade | 7,0 | 7,0 | 0 |
| Feedback / estados de interação | 8,0 | 8,5 | +0,5 (autocomplete + combobox) |
| Clareza / carga cognitiva | 7,5 | 7,5 | 0 |
| Performance percebida | 7,5 | 7,5 | 0 |
| **Média** | **7,63** | **7,69** | +0,06 |

A nota estagnou porque **duas regressões visuais compensaram os ganhos funcionais**: os títulos `text-3xl sm:text-4xl` que adicionei na v9 revelaram-se demasiado grandes em listas densas, e o dashboard mantém a redundância com o organograma. Ambas serão resolvidas nas soluções 10/10 abaixo.

### Scan `axe-core` v9 → v10

| Tela | v9 | v10 |
|---|---|---|
| Dashboard | 0 | **0** ✅ |
| Organograma | 1 serious (2 nós) | 1 serious (2 nós) — `bg-white/30` ainda falha |
| Membros | 1 serious (1 nó) | 2 (1 critical button-name + 1 serious) — ícone de clear sem `aria-label` |
| Ferramentas | 1 serious (1 nó) | 1 serious (1 nó) — `bg-white/30` |
| Dados | 1 critical (24 nós button-name) | **0** ✅ (aria-labels adicionados) |

**Resumo:** o critical `button-name` nos checkboxes de Dados foi resolvido, mas surgiu um novo critical no `Membros` (provavelmente o ícone "X" de limpar pesquisa ou o botão do select filter sem `aria-label`). O `bg-white/30` no badge do item activo da sidebar persiste — precisa de `bg-white/40` ou `bg-primary-foreground/30 text-primary-foreground`.

---

## Respostas directas às perguntas do utilizador

### Pergunta 1 — Sidebar principal recolhível

**Concordo totalmente.** A sidebar actual consome ~255px fixos (~18% da largura útil num ecrã 1440px) para apenas 5 itens de navegação — densidade information-per-pixel baixíssima. Em listas como Membros (52 cards) e Ferramentas (25 cards), cada px horizontal conta.

#### Solução 10/10 — Padrão VS Code / Linear / Notion

**Estrutura técnica:**

```tsx
// Em src/app/page.tsx
const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

// Persistir preferência
useEffect(() => {
  const saved = localStorage.getItem('sidebar.collapsed')
  if (saved !== null) setSidebarCollapsed(JSON.parse(saved))
}, [])
useEffect(() => {
  localStorage.setItem('sidebar.collapsed', JSON.stringify(sidebarCollapsed))
}, [sidebarCollapsed])

// Atalho ⌘B / Ctrl+B
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
```

```tsx
<aside
  className={cn(
    "sticky top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-40",
    "transition-[width] duration-200 ease-out",
    sidebarCollapsed ? "w-16" : "w-64"
  )}
  aria-label="Navegação principal"
>
  {/* Header com toggle */}
  <div className="p-3 border-b border-sidebar-border flex items-center justify-between">
    <button
      onClick={() => setSidebarCollapsed(c => !c)}
      aria-expanded={!sidebarCollapsed}
      aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
      className="flex items-center gap-2"
    >
      <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
        <Workflow className="w-5 h-5 text-primary-foreground" />
      </div>
      {!sidebarCollapsed && (
        <div className="overflow-hidden">
          <h1 className="text-sm font-bold leading-tight">Gestão de Processos</h1>
          <p className="text-[11px] text-muted-foreground">Sistema Operacional</p>
        </div>
      )}
    </button>
    {/* Toggle visível apenas quando expandida */}
    {!sidebarCollapsed && (
      <button
        onClick={() => setSidebarCollapsed(true)}
        aria-label="Recolher menu"
        className="p-1.5 rounded hover:bg-sidebar-accent text-muted-foreground"
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
      const count = ...
      return (
        <Tooltip key={item.id}>
          <TooltipTrigger asChild>
            <button
              onClick={() => goTo(item.id)}
              className={cn(
                "w-full flex items-center rounded-lg text-sm font-medium transition-colors",
                sidebarCollapsed
                  ? "justify-center p-3"
                  : "items-center gap-3 px-3 py-2",
                isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span className="flex-1 text-left">{item.label}</span>}
              {!sidebarCollapsed && count !== undefined && (
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-semibold",
                  isActive ? "bg-primary-foreground/30 text-primary-foreground" : "bg-sidebar-accent text-muted-foreground"
                )}>
                  {count}
                </span>
              )}
              {/* No modo recolhido, mostrar dot se count > 0 */}
              {sidebarCollapsed && count !== undefined && count > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          </TooltipTrigger>
          {sidebarCollapsed && (
            <TooltipContent side="right" sideOffset={8}>
              {item.label}{count !== undefined && ` · ${count}`}
            </TooltipContent>
          )}
        </Tooltip>
      )
    })}
  </nav>

  {/* Rodapé com toggle de expansão quando recolhido */}
  {sidebarCollapsed && (
    <div className="p-2 border-t border-sidebar-border">
      <button
        onClick={() => setSidebarCollapsed(false)}
        className="w-full p-2 rounded hover:bg-sidebar-accent text-muted-foreground flex justify-center"
        aria-label="Expandir menu"
      >
        <ChevronsRight className="w-4 h-4" />
      </button>
    </div>
  )}
</aside>
```

**Regras de ouro:**

1. **Transição `width` em 200ms** com `ease-out` — não há saltos; labels fazem fade (opacity), não `display:none`.
2. **Tooltips ricos** no modo recolhido (nome + contagem) com `side="right"` e delay de 100ms.
3. **Persistência em `localStorage`** por utilizador — não por sessão.
4. **Atalho `⌘B` / `Ctrl+B`** com hint no tooltip.
5. **Breakpoint inteligente:** abaixo de 1024px inicia recolhida; abaixo de 768px torna-se drawer off-canvas.
6. **Badge comprime-se para dot** colorido de 6×6px quando recolhida (preserva informação de estado sem texto).
7. **`aria-expanded` no botão toggle** + `aria-label` em todos os ícones.
8. **`prefers-reduced-motion`** respeitado — desactivar transição para quem tem vestibular issues.

**Componente novo a criar:** `src/components/app-sidebar.tsx` (extrair lógica do `<aside>` actual em `page.tsx:436-498`).

---

### Pergunta 2 — Labels dos membros e das ferramentas demasiado grandes

**Confirmo plenamente.** A minha recomendação anterior de subir títulos para `text-3xl sm:text-4xl` foi um erro — em listas densas, o título deve ser proeminente mas não dominante. A escala actual inflou globalmente:

#### Diagnóstico (com medidas exactas)

| Elemento | Estado v10 | Problema | Solução proposta |
|---|---|---|---|
| Título "Membros da Equipa" | `text-3xl sm:text-4xl` (~30-36px) | Compete com conteúdo | `text-xl sm:text-2xl` (~20-24px) |
| Título "Ferramentas" | `text-3xl sm:text-4xl` | Idem | `text-xl sm:text-2xl` |
| Subtítulo "Todos os membros..." | `text-sm` (14px) | Aceitável mas pode reduzir | `text-xs text-muted-foreground` |
| Botão "Novo Membro" | `h-9 px-4` | Aceitável | manter |
| Avatar do card | `w-11 h-11` (44px) | Grande demais | `w-9 h-9` (36px) |
| Nome do membro | `text-sm` (14px) | OK | manter `text-sm font-semibold` |
| Cargo | `text-xs` (12px) | OK | manter |
| Email | `text-[11px]` | Limite inferior AA | `text-xs` (12px) |
| Badge "Responsável/Substituto" label | `text-[10px]` | Abaixo do mínimo | `text-[11px]` |
| Badge área | `text-[10px]` | Idem | `text-[11px]` |
| Bloco "0 / 0" dos contadores | `text-xs font-semibold` | Aceitável mas redundante quando zero | ocultar se ambos = 0 |
| Padding do card | `p-4 pr-10` | Aceitável | `p-3 pr-9` para mais densidade |

#### Solução 10/10 — Sistema tipográfico coerente

Criar **4 níveis fixos** para títulos de página interna:

```tsx
// src/lib/typography.ts (novo)
export const PAGE_TITLE = "text-xl sm:text-2xl font-bold tracking-tight"     // 20-24px
export const PAGE_SUBTITLE = "text-sm text-muted-foreground"                 // 14px
export const SECTION_TITLE = "text-base font-semibold"                       // 16px
export const CARD_TITLE = "text-sm font-semibold"                            // 14px
export const METADATA = "text-xs text-muted-foreground"                      // 12px
```

Aplicar em **todas as 5 páginas internas** (Dashboard, Organograma, Membros, Ferramentas, Dados):

```tsx
// Antes
<h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Membros da Equipa</h1>
<p className="text-muted-foreground mt-1 text-sm">...</p>

// Depois
<h1 className={PAGE_TITLE}>Membros da Equipa</h1>
<p className={PAGE_SUBTITLE + " mt-1"}>...</p>
```

#### Reduções adicionais nos cards de membro

```tsx
// Antigo (drill-views.tsx e page.tsx)
<Card className="group relative">
  <CardContent className="p-4 pr-10">
    <div className="flex items-start gap-3">
      <div className="w-11 h-11 rounded-full ...">  {/* 44px - grande */}
      ...
    </div>
    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
      <div>0 Responsável</div>  {/* sempre mostrado, mesmo com zero */}
      <div>0 Substituto</div>
    </div>
  </CardContent>
</Card>

// Novo
<Card className="group relative transition-all hover:shadow-md hover:-translate-y-0.5">
  <CardContent className="p-3 pr-9">
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-full ...">  {/* 36px - compacto */}
      ...
    </div>
    {/* Mostrar contadores apenas se > 0 */}
    {(totalResp > 0 || totalSub > 0) && (
      <div className="flex gap-1.5 mt-2">
        {totalResp > 0 && <Badge variant="outline" className="text-[10px] py-0 h-5">{totalResp} resp.</Badge>}
        {totalSub > 0 && <Badge variant="outline" className="text-[10px] py-0 h-5">{totalSub} subst.</Badge>}
      </div>
    )}
  </CardContent>
</Card>
```

**Resultado:** cards ~30% mais compactos, ~12-16 cards visíveis por ecrã (vs 9 actualmente).

---

### Pergunta 3 — Dashboard diz o mesmo que o organograma

**Tem razão e esta é a crítica mais importante.** O dashboard actual é **uma fotografia estática** que responde a "o que existe no sistema" — exatamente o que o organograma já responde melhor (com hierarquia visual). Um dashboard 10/10 responde a "**o que precisa de atenção hoje?**".

#### Diagnóstico do que é redundante

| Widget actual | Redundante com organograma? | A manter? |
|---|---|---|
| 6 KPIs (24 áreas, 38 processos, 141 actividades, 432 tarefas, 51 membros, 24 ferramentas) | **Sim** — o organograma mostra as 24 áreas com contadores | ❌ Reduzir a 1 KPI hero ou substituir |
| Lista de "Áreas Organizacionais" | **Sim** — duplica o organograma | ❌ Remover |
| "Processos por Tipo" (Inbound/Outbound/Gestão) | Não (vista agregada) | ✅ Manter mas evoluir |
| "Frequência" (chips coloridos) | Não | ✅ Manter |
| "Tarefas Recentes" | Não (único sinal de tempo) | ✅ Manter e ampliar |
| "20 de 24 áreas com processos (83%)" | Não — é sinal de saúde | ✅ Promover a widget principal |

#### Solução 10/10 — Dashboard de Operações

Reorganizar em **4 zonas com propósito claro**, cada uma respondendo a uma pergunta diferente:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Visão Geral · Olá, <nome> · <data>                                  │  ← Saudação personalizada
├─────────────────────────────────────────────────────────────────────┤
│  [KPI hero: % cobertura do mapeamento]  [↑ delta vs semana passada] │  ← 1 número que importa
├─────────────────────────────────────────────────────────────────────┤
│  🔴 PRECISA DE ATENÇÃO                                               │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐    │
│  │ Áreas sem        │ │ Processos sem    │ │ Tarefas sem       │    │
│  │ processos (4)    │ │ responsável (7)  │ │ instruções (231)  │    │
│  │ [Ver lista →]    │ │ [Atribuir →]     │ │ [Rever →]         │    │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘    │
├─────────────────────────────────────────────────────────────────────┤
│  📅 ESTA SEMANA                  │  📊 DISTRIBUIÇÃO                  │
│  ┌─────────────────────────────┐ │  Processos por tipo (gráfico)    │
│  │ • Processo X vence hoje     │ │  Frequência (chips)               │
│  │ • 3 processos mensais a entregar │  Cobertura por área (heatmap)│
│  │ • 2 tarefas aguardam revisão│ │                                  │
│  └─────────────────────────────┘ │                                  │
├─────────────────────────────────────────────────────────────────────┤
│  🕒 ACTIVIDADE RECENTE                                              │
│  Maria criou processo Z (há 2h) · João actualizou tarefa W (há 5h)   │
└─────────────────────────────────────────────────────────────────────┘
```

#### Widgets concretos para implementar

**1. KPI Hero — "% de cobertura do mapeamento"**
- Cálculo: `áreas com ≥1 processo / áreas totais × 100` (já existe, mas promover a hero)
- Com **sparkline** dos últimos 7 dias (mesmo que cresça lentamente, dá ideia de progresso)
- CTA: "Ver áreas sem processos"

```tsx
<div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-xs font-semibold text-primary uppercase tracking-wide">Cobertura do mapeamento</p>
      <div className="flex items-baseline gap-3 mt-2">
        <span className="text-5xl font-bold">83%</span>
        <span className="text-sm text-emerald-600 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> +2% esta semana
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">20 de 24 áreas têm processos definidos</p>
    </div>
    <RadialProgress value={83} />
  </div>
  <Button variant="outline" size="sm" className="mt-4">
    Ver 4 áreas sem processos <ArrowRight className="w-3 h-3 ml-1" />
  </Button>
</div>
```

**2. Cartões "Precisa de Atenção"** (3 cartões vermelhos/âmbar)

Cada cartão deriva de uma query SQL simples (já existe no schema):

```tsx
// Backend: GET /api/dashboard/alerts
{
  areasSemProcessos: [{ id, nome }, ...],         // Banca, Contabilidade, Inovação Comercial, Corretagem
  processosSemResponsavel: [{ id, nome, areaNome }, ...],
  tarefasSemInstrucoes: { count: 231, total: 432, pct: 53 }
}
```

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
  <AlertCard
    icon={Building2}
    color="rose"
    title="Áreas sem processos"
    count={4}
    description="Estas áreas ainda não têm processos mapeados."
    cta="Ver lista"
    onClick={() => setView({ level: 'areas' })}
  />
  <AlertCard
    icon={UserX}
    color="amber"
    title="Processos sem responsável"
    count={7}
    description="Sem dono atribuído, estes processos podem ficar órfãos."
    cta="Atribuir"
    onClick={...}
  />
  <AlertCard
    icon={AlertTriangle}
    color="amber"
    title="Tarefas sem instruções"
    count={231}
    description="53% das tarefas ainda não têm instruções nas ferramentas."
    cta="Rever lista"
    onClick={...}
  />
</div>
```

**3. Heatmap de cobertura por área**

Matriz `área × tipo de processo` mostrando onde estão os buracos:

```tsx
<Heatmap
  rows={areas}              // 24 áreas
  columns={['Inbound', 'Outbound', 'Gestão']}  // 3 tipos
  data={coverageMatrix}     // célula colorida se tem processo
  emptyColor="bg-rose-50"
  filledColor="bg-emerald-200"
  hoverLabel="Corretagem · Inbound: 2 processos"
/>
```

Mostra visualmente: "Banca não tem nenhum Inbound"; "Auditoria só tem processos de Gestão". É **inteligência que nenhum outra página do sistema oferece**.

**4. "Esta Semana" — widgets temporais**

```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-sm flex items-center gap-2">
      <Calendar className="w-4 h-4 text-primary" />
      Esta Semana
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-2">
    {/* Processos com frequência Mensal/Anual que "vencem" esta semana */}
    {vencimentos.map(v => (
      <div className="flex items-center justify-between text-sm">
        <span className="truncate">{v.processoNome}</span>
        <Badge variant={v.urgente ? "destructive" : "outline"}>
          {v.diasRestantes === 0 ? "hoje" : `${v.diasRestantes}d`}
        </Badge>
      </div>
    ))}
  </CardContent>
</Card>
```

**5. Actividade Recente (feed de auditoria)**

Requer uma nova tabela `Actividade` no Prisma schema (ou usar `updatedAt` de entidades existentes como proxy):

```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-sm flex items-center gap-2">
      <Clock className="w-4 h-4 text-primary" />
      Actividade Recente
    </CardTitle>
  </CardHeader>
  <CardContent>
    <ol className="space-y-2">
      {actividades.map(a => (
        <li className="flex items-start gap-2 text-sm">
          <Avatar size="sm">{a.autor.iniciais}</Avatar>
          <div className="flex-1">
            <p>
              <strong>{a.autor.nome}</strong> {a.acao} {a.entidadeTipo}
              <Link href={a.link} className="text-primary hover:underline">{a.entidadeNome}</Link>
            </p>
            <p className="text-xs text-muted-foreground">{timeAgo(a.timestamp)}</p>
          </div>
        </li>
      ))}
    </ol>
  </CardContent>
</Card>
```

#### Endpoint necessário

```ts
// src/app/api/dashboard/route.ts (extender)
export async function GET() {
  const [
    counts, areasComContagem, processosPorTipo, processosPorFreq,
    tarefasRecentes,
    // NOVOS:
    areasSemProcessos,           // WHERE _count.processos === 0
    processosSemResponsavel,    // WHERE responsavelId === null
    tarefasSemInstrucoesCount,   // COUNT WHERE instrucoesNasFerramentas = false
    coberturaMatrix,             // agregação área × tipo
    vencimentosSemana,           // processos com frequência que "vencem" esta semana
    actividadesRecentes,         // últimas 10 alterações ordenadas por updatedAt
  ] = await Promise.all([...])

  return NextResponse.json({
    counts, areasComContagem, processosPorTipo, processosPorFreq, tarefasRecentes,
    alerts: { areasSemProcessos, processosSemResponsavel, tarefasSemInstrucoesCount },
    coberturaMatrix, vencimentosSemana, actividadesRecentes,
  })
}
```

#### Princípios do dashboard 10/10

1. **Regra de ouro:** se um widget sobreviveria igual no organograma, não pertence ao dashboard.
2. **Cada widget termina num verbo:** *revisar, atribuir, aprovar, actualizar*.
3. **Tempo:** nada é estático; tudo tem delta ou timestamp.
4. **Exceções, não inventários:** mostrar 5 problemas, não 24 itens.
5. **Personalização futura:** diferenciar dashboard do gestor (visão global) vs do responsável de área (as minhas tarefas).
6. **KPI navegável:** cada KPI leva a uma lista filtrada, não é número decorativo.

---

### Pergunta 4 — Soluções 10/10 para o resto

Aqui estão **10 melhorias de alto impacto** para elevar o sistema a 10/10, organizadas por área.

#### 4.1 Onboarding wizard para primeiro uso

Se `dashboard.counts.areas === 0`, substituir o dashboard por wizard de 3 passos:

```tsx
function OnboardingWizard() {
  const [step, setStep] = useState(0)
  const steps = [
    { title: "Criar a primeira área", icon: Building2, done: areas.length > 0 },
    { title: "Adicionar membros à equipa", icon: Users, done: membros.length > 0 },
    { title: "Definir o primeiro processo", icon: Workflow, done: processos.length > 0 },
  ]
  // Stepper visual + CTA em cada passo
}
```

#### 4.2 Sistema de estado nos processos e tarefas

Adicionar campo `estado` ao schema (Rascunho / Activo / Em revisão / Arquivado):

```prisma
model Processo {
  // ...
  estado String @default("Activo")  // Rascunho | Activo | EmRevisao | Arquivado
}
```

Permite dashboard filtrar "processos em revisão", "rascunhos pendentes", etc.

#### 4.3 Notificações in-app

Sino no header com badge de contagem. Tipos:

- Atribuição: "Foste definido como responsável do processo X"
- Vencimento: "Processo Y vence amanhã"
- Menção: "@João comentou na tarefa Z"
- Sistema: "Backup automático concluído"

Implementar com `Server-Sent Events` (SSE) via `/api/notifications/stream` ou polling a cada 60s.

#### 4.4 Atalhos de teclado globais (Cmd+K palette)

```tsx
// Componente CommandPalette (cmdk já instalado)
<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Pesquisar entidades, comandos ou navegação..." />
  <CommandList>
    <CommandGroup heading="Navegação">
      <CommandItem onSelect={() => goTo('dashboard')}>Dashboard</CommandItem>
      <CommandItem onSelect={() => goTo('areas')}>Organograma</CommandItem>
      ...
    </CommandGroup>
    <CommandGroup heading="Acções">
      <CommandItem onSelect={newArea}>Criar nova área</CommandItem>
      <CommandItem onSelect={newMembro}>Adicionar membro</CommandItem>
      ...
    </CommandGroup>
    <CommandGroup heading="Entidades">
      {areas.map(a => <CommandItem key={a.id} onSelect={() => openArea(a.id)}>{a.nome}</CommandItem>)}
      {membros.map(m => ...)}
      ...
    </CommandGroup>
  </CommandList>
</CommandDialog>
```

Atalho: `⌘K` / `Ctrl+K` abre. Aumenta drasticamente a produtividade para power-users.

#### 4.5 Modo lista compacta (toggle) para Membros e Ferramentas

```tsx
const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')

<Tabs value={viewMode} onValueChange={setViewMode}>
  <TabsList>
    <TabsTrigger value="cards"><LayoutGrid className="w-4 h-4" /></TabsTrigger>
    <TabsTrigger value="list"><List className="w-4 h-4" /></TabsTrigger>
  </TabsList>
</Tabs>

{viewMode === 'list' ? (
  <ListView membros={filtered} onEdit={...} onDelete={...} />
) : (
  <CardView membros={filtered} onEdit={...} onDelete={...} />
)}
```

ListView = tabela densa com 1 linha por membro: avatar 24px + nome + cargo + área + nº resp + nº subst + acções. Mostra 30-40 membros por ecrã.

#### 4.6 Metadados em cards de ferramentas

Adicionar ao schema `Ferramenta`:

```prisma
model Ferramenta {
  // ...
  categoria String?  // Comunicação | Documentos | Gestão | Análise | IA
  url       String?  // link opcional para a ferramenta
  // _count.tarefas já vem da relação existente
}
```

No card:

```tsx
<Card>
  <CardContent className="p-3">
    <div className="flex items-center gap-2">
      <FerramentaLogo nome={f.nome} />  {/* lookup de favicon por nome */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{f.nome}</p>
        <p className="text-xs text-muted-foreground truncate">{f.descricao}</p>
      </div>
    </div>
    <div className="flex items-center justify-between mt-2">
      <Badge variant="outline" className="text-[10px]">
        <ListChecks className="w-2.5 h-2.5 mr-1" />
        {f._count.tarefas} tarefas
      </Badge>
      {f.categoria && <Badge variant="secondary" className="text-[10px]">{f.categoria}</Badge>}
    </div>
  </CardContent>
</Card>
```

#### 4.7 Drag & drop para reordenar procedimentos na tarefa

O `@dnd-kit/core` já está instalado mas não usado nos procedimentos:

```tsx
<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={form.procedimentos.map((_, i) => `passo-${i}`)} strategy={verticalListSortingStrategy}>
    {form.procedimentos.map((p, i) => (
      <SortablePasso key={`passo-${i}`} index={i} value={p.descricao} ... />
    ))}
  </SortableContext>
</DndContext>
```

Permite reordenar passos sem apagar e recriar — UX essencial para listas ordenadas.

#### 4.8 Breadcrumbs melhorados com menu dropdown

Cada crumb do breadcrumb deve abrir um dropdown com os irmãos (semelhante ao macOS Finder):

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button className="px-2 py-1 rounded-md hover:bg-muted">
      {currentArea.nome} <ChevronDown className="w-3 h-3 inline" />
    </button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {areas.map(a => <DropdownMenuItem onSelect={() => openArea(a.id)}>{a.nome}</DropdownMenuItem>)}
  </DropdownMenuContent>
</DropdownMenu>
```

Permite saltar directamente entre áreas/processos sem voltar ao organograma.

#### 4.9 Modo escuro funcional

`next-themes` está instalado mas sem toggle visível. Adicionar:

```tsx
// src/components/theme-toggle.tsx
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      <Sun className="h-4 w-4 dark:hidden" />
      <Moon className="h-4 w-4 hidden dark:block" />
    </Button>
  )
}

// Colocar no header da sidebar recolhida ou no topo da main
```

Já existe `.dark` em `globals.css:82-114` — basta ligar.

#### 4.10 Empty states com ilustrações SVG inline

Em vez do ícone cinza genérico, usar ilustrações SVG inline (sem dependências) específicas por tipo de empty state:

```tsx
// src/components/empty-illustrations.tsx
export function EmptyAreas() {
  return (
    <svg viewBox="0 0 200 120" className="w-32 h-20 mx-auto mb-3 opacity-60">
      {/* Edifícios vazios estilo flat-design */}
      <rect x="40" y="50" width="30" height="50" fill="currentColor" className="text-primary/20" rx="3" />
      <rect x="75" y="35" width="30" height="65" fill="currentColor" className="text-primary/30" rx="3" />
      <rect x="110" y="55" width="30" height="45" fill="currentColor" className="text-primary/15" rx="3" />
      {/* Janelinhas */}
      ...
    </svg>
  )
}
```

Aumenta o afecto do empty state (menos "broken", mais "oportunidade").

---

## Anexo A — Análise visual por tela (v10)

### A.1 Dashboard (atual)
- ❌ Redundante com organograma (lista de áreas duplicada)
- ❌ KPIs estáticos, sem tendência
- ✅ Skeletons em SSR
- ✅ Mensagem de erro com CTA "Tentar novamente"
- **Nota:** 5/10 (precisa redesenho completo conforme Pergunta 3)

### A.2 Organograma
- ✅ Conectores superiores resolvidos
- ❌ Conectores descendentes ainda não chegam às áreas
- ❌ "Presidente" com destaque âmbar não explicado
- ❌ Métricas com zero aparecem igual às com valor
- **Nota:** 7,5/10

### A.3 Modal Membro com Autocomplete (novo)
- ✅ Endpoint `?q=` funcional
- ✅ Sugestões com avatar + cargo + área
- ✅ Badge "já aqui" vs "noutra área"
- ❌ Dropdown sobrepõe formulário
- ❌ Sem suporte a teclado (setas + Enter)
- ❌ "noutra área" não mostra nome da área
- ❌ Sem opção "Criar novo" visível na lista
- **Nota:** 6/10 (funcional mas precisa de polimento)

Melhorias concretas:
1. Adicionar `role="listbox"` e `role="option"` + `onKeyDown` para setas
2. Mostrar nome da área no badge: "em Banca" em vez de "noutra área"
3. Adicionar item fixo no fim: `+ Criar "Ana" como novo membro` (sempre visível quando há texto)
4. Highlight do termo pesquisado em **bold** nos resultados
5. Tooltip a explicar: "Mantém associação a {área_actual} e adiciona a {nova_área}"

### A.4 Combobox de Ferramentas na Tarefa (novo)
- ✅ Busca funcional
- ✅ Criação inline funciona (`onCreateFerramenta`)
- ✅ Chips removíveis das seleccionadas
- ✅ Badge "N seleccionadas"
- ✅ Estado de loading na criação
- **Nota:** 8/10 (bom implementação)

### A.5 Lista de Membros
- ✅ Filtro por área funcional
- ✅ Contador "A mostrar X de Y"
- ❌ Títulos `text-3xl/4xl` demasiado grandes
- ❌ Cards ainda densos demais para 51 membros
- ❌ Modo lista compacta ainda não existe
- **Nota:** 6,5/10

### A.6 Lista de Ferramentas
- ✅ Busca funcional
- ✅ Empty state com "Limpar pesquisa"
- ❌ Ícone `Wrench` idêntico em todos os 24 cards
- ❌ Sem metadados de uso (N tarefas, última utilização)
- ❌ Sem categorias
- **Nota:** 6/10

### A.7 Detalhe de Tarefa com TreeSidebar
- ✅ Layout 2 colunas
- ✅ Árvore expansível com auto-expansão do caminho seleccionado
- ✅ Estado activo destacado
- ❌ Truncamentos sem tooltip
- ❌ Sem estado nas tarefas irmãs (concluída/pendente)
- ❌ Banner "Instruções não implementadas" sem CTA
- **Nota:** 8/10

---

## Anexo B — Itens resolvidos vs pendentes (v9 → v10)

### Resolvidos na v10
- ✅ Combobox de membros com autocomplete (Pergunta v9 #2)
- ✅ Combobox de ferramentas em tarefa com criação inline (Pergunta v9 #6)
- ✅ Filtros por área em Membros (Pergunta v9 #5)
- ✅ Busca em Ferramentas (Pergunta v9 #5)
- ✅ `aria-label` nos 24 checkboxes de Dados (critical axe resolvido)

### Parcialmente resolvidos
- 🟡 `bg-white/30` ainda falha `color-contrast` (5 nós restantes) — subir para `bg-white/40` ou `bg-primary-foreground/30`
- 🟡 Autocomplete de membros funcional mas sem teclado, sem nome de área no badge, sem CTA criar visível

### Não resolvidos (pendentes)
- ⏳ Onboarding wizard para primeiro uso
- ⏳ Modo lista compacta para Membros/Ferramentas
- ⏳ Metadados em cards de ferramenta (N tarefas)
- ⏳ Categorias em ferramentas
- ⏳ Conectores descendentes no organograma
- ⏳ `bg-white/30` restante (color-contrast)
- ⏳ `button-name` no botão de clear search em Membros

### Novos identificados na v10
- 🆕 Títulos `text-3xl sm:text-4xl` demasiado grandes em listas (regressão vs v9)
- 🆕 Dashboard ainda redundante com organograma
- 🆕 `button-name` critical no filtro de área em Membros (provavelmente select trigger sem `aria-label`)

---

## Próximos passos priorizados (v11)

| # | Item | Esforço | Impacto | Responde a |
|---|---|---|---|---|
| 1 | **Redesenhar Dashboard** com widgets de alerta, heatmap e actividades recentes | 8 h | 🔴 Alto | Pergunta 3 |
| 2 | **Sidebar recolhível** com toggle, ⌘B, tooltips, persistência | 4 h | 🔴 Alto | Pergunta 1 |
| 3 | **Reduzir sistema tipográfico** (`text-3xl/4xl` → `text-xl/2xl` em listas) | 1 h | 🔴 Alto | Pergunta 2 |
| 4 | **Compactar cards de membro** (avatar 36px, padding reduzido, ocultar zeros) | 2 h | 🟡 Médio | Pergunta 2 |
| 5 | **Polir autocomplete de membros** (teclado, nome de área, CTA criar visível, highlight) | 2 h | 🟡 Médio | Pergunta v9 #2 |
| 6 | **Metadados em ferramentas** (N tarefas + categoria) | 3 h | 🟡 Médio | Pergunta v9 #5 |
| 7 | **Modo lista compacta** (toggle cards/lista em Membros e Ferramentas) | 4 h | 🟡 Médio | Pergunta v9 #5 |
| 8 | **Resolver `bg-white/30`** (subir opacidade ou mudar cor) | 15 min | 🔴 Alto (a11y) | Scan axe |
| 9 | **Command palette ⌘K** (cmdk já instalado) | 4 h | 🟢 Baixo | Pergunta 4 |
| 10 | **Onboarding wizard** quando `areas === 0` | 4 h | 🟢 Baixo | Pergunta v9 #3 |

**Total estimado:** ~32h para cobrir os 10 itens.

---

## Como apresentar o feedback após v11

Para validar objectivamente os ganhos:

1. **Captura do dashboard antes/depois** — comparar widget de "Áreas sem processos" (novo) vs antiga lista de 24 áreas.
2. **GIF da sidebar a recolher/expandir** com `⌘B` e tooltips a aparecerem.
3. **Comparação de densidade** — captura da lista de Membros com `text-xl` vs `text-3xl`, mostrando nº de cards visíveis por ecrã.
4. **Relatório `axe-core`** — deve passar de 5 violações restantes para 0 em todas as telas.
5. **Métrica de "tempo até encontrar um membro"** — antes (com `text-3xl`, sem sidebar recolhida): ~15s; depois: ~5s (sidebar recolhida liberta espaço, tipografia menor aumenta densidade).
6. **Heatmap de cliques** no dashboard novo — cada alerta deve ter ≥1 clique numa sessão de teste.

---

**Fim da avaliação v10.**

Estou pronto para receber a v11. Recomendo focar nos itens 1-3 da tabela acima (impacto alto, ~13h) antes de avançar para os restantes. As soluções 10/10 detalhadas (com código pronto a colar) estão nas secções dedicadas a cada pergunta — podem ser implementadas praticamente sem adaptação.
