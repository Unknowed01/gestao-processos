# Avaliação UX/UI — Sistema de Gestão de Processos (Next.js 16)

**Data da avaliação:** 11 de Novembro de 2026
**Avaliador:** Especialista Sênior em UX/UI (UX Researcher + UI Designer + Product Designer + Accessibility Specialist)
**Destinatário:** Equipa de desenvolvimento (para implementação das melhorias)
**Próxima rodada:** Após implementação, reenviar `.tar` do projecto para reanálise

---

## Metodologia

Foram inspeccionados:

- **Código-fonte:** `src/app/page.tsx` (972 linhas), `src/app/layout.tsx`, `src/app/globals.css`, `src/components/dashboard-view.tsx`, `src/components/organograma-view.tsx`, `src/components/drill-views.tsx` (903 linhas), `src/components/forms.tsx` (898 linhas), `src/components/dados-view.tsx`, `src/components/ui/*` (shadcn/ui new-york), `src/lib/types.ts`, `src/lib/utils.ts`, `prisma/schema.prisma`, `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `components.json`.
- **Telas renderizadas em runtime:** Dashboard, Organograma, Membros, Ferramentas, Dados, drill-down completo (Área → Processo → Actividade → Tarefa), modal de criar área, modal de eliminar ferramenta, estado de loading e estado vazio de pesquisa.
- **Dispositivos testados:** Desktop 1440×900, Tablet 768×1024, Mobile 390×844 (com touch + isMobile).
- **Análise automatizada:** `axe-core` 4.10 com tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` executado em todas as telas principais.
- **Análise visual assistida por VLM** em cada screenshot (dashboard, organograma, membros, ferramentas, dados, modal criar, modal eliminar, loading, empty state, detalhe de tarefa).

**Stack detectada:**

- Next.js 16.1.3 (Turbopack, App Router, `output: "standalone"`, `reactStrictMode: false`, `typescript.ignoreBuildErrors: true`)
- React 19.0.0
- TypeScript 5
- Tailwind CSS 4 + `tailwindcss-animate` + `tw-animate-css`
- shadcn/ui (new-york) com Radix UI completo
- Prisma 6.11 (SQLite em `db/custom.db`)
- `@tanstack/react-query` 5 (instalado, mas **não usado** — estado gerido por `useState`)
- `sonner` (toasts) + `lucide-react` (ícones) + `framer-motion` (instalado, **não usado**)
- `next-themes` (instalado, **sem theme toggle visível**)
- `z-ai-web-dev-sdk` (instalado)

---

## 1. Nota Geral — 7,0 / 10

Sistema funcional, com arquitectura de informação sólida (hierarquia Área → Processo → Actividade → Tarefa bem traduzida em drill-down com breadcrumb), design system implícito consistente (raios, sombras, espaçamentos, paleta emerald) e bons empty states e microcopy. As principais limitações estão em acessibilidade técnica (violações `color-contrast` sérias em todas as telas), affordances ambíguas em cards e chips, ausência de skeletons (causa layout shift em navegação client-side) e dependência de cor/memória para ícones pequenos sem `aria-label`. É um produto acima de MVP mas ainda não "pronto para produção acessível".

---

## 2. Pontuação por Critério (0–10)

| Critério | Nota | Justificação resumida |
|---|---|---|
| Usabilidade / Experiência do usuário | **7,5** | Navegação drill-down fluida, breadcrumb sempre presente, microcopy orientativo. Falta caminho de retorno explícito (sem "Limpar pesquisa" no empty state) e atalhos de teclado. |
| Interface visual (UI) e hierarquia | **7,5** | Hierarquia tipográfica clara (H1→H2→cards), paleta emerald coerente, ícones contextuais. KPIs competem entre si sem indicar prioridade; ícone `Building2` repetido em todos os níveis. |
| Consistência e design system | **8,0** | shadcn/ui new-york + tokens CSS via `globals.css` com OKLCH; todos os componentes seguem o mesmo raio (0.75rem) e escala de espaçamento. Inconsistência: dois menus de acções distintos (`ActionMenu` em `page.tsx` vs `EntityMenu` em `drill-views.tsx`) com SVGs inline vs `lucide-react`. |
| Acessibilidade (a11y) | **5,5** | `axe-core` reporta 1 violação `serious` em todas as telas: `color-contrast` no botão nav activo (`text-primary-foreground/20` do badge) e no rodapé da sidebar (`text-muted-foreground/60`). Sem `role="tree"` no organograma, sem focus trap aparente nos modais, sem `aria-label` em ícones de contadores. |
| Responsividade e adaptação a dispositivos | **7,0** | Sidebar fixa em `lg:sticky` com overlay `lg:hidden` bem implementado; grid de KPIs colapsa de 6→3→2; tabs `grid-cols-3 max-w-md`. Em mobile, KPIs altos demais (desperdiçam vertical), header duplica título "Dashboard/Visão Geral". |
| Feedback e estados de interação | **6,5** | Toasts `sonner` em sucesso/erro; spinner `Loader2` em loading de listas e modais; empty states com ícone + CTA. Faltam skeletons (layout shift visível), estados hover nos cards são subtis e não há feedback visual durante selecção múltipla na tab Dados. |
| Clareza e redução de carga cognitiva | **7,0** | Tarefas têm estrutura Inputs/Outputs/Procedimentos numerados clara; banner de "instruções implementadas" bem explicado. Mas contadores `0` em todos os cards adicionam ruído; ícones de métricas (`Workflow`, `Users`, `Wrench` miniatura) exigem memorização. |
| Performance percebida e fluidez | **6,5** | Next.js 16 com Turbopack, server components nos endpoints, transições CSS `transition-all` curtas. Sem Suspense boundaries visíveis; navegação client-side sem prefetch perceptível; sem skeleton causa flash de "não foi possível carregar" em SSR inicial. |

**Média ponderada:** 6,94 ≈ **7,0**

---

## 3. Pontos Fortes

1. **Arquitectura de informação hierárquica bem executada** — Área → Processo → Actividade → Tarefa, com breadcrumb `DrillBreadcrumb` sempre presente, navegação por botão "←" e estado de view centralizado em `ViewState` (nível + IDs). Fluxo determinístico e previsível.
2. **Design tokens em OKLCH com paleta `emerald` coerente** — `globals.css` define todas as variáveis CSS (`--primary: oklch(0.55 0.13 155)`, `--sidebar-*`, `--chart-1..5`) incluindo variante `.dark`. Base consistente para escalar.
3. **Empty states accionáveis e honestos** — Em todas as listas (Membros sem registos, Área sem processos, Tarefa sem procedimentos) há ícone + título + descrição + CTA contextual ("Criar primeiro processo"). Microcopy específico por entidade ("As tarefas são as unidades operacionais com inputs, procedimentos e outputs").
4. **Modal de confirmação de eliminação com microcopy bem calibrado** — Título com ícone de lixeira vermelho, nome do item entre aspas ("Adobe Acrobat"), aviso de irreversibilidade, botão destrutivo vs cancelar com hierarquia visual correcta. Severidade percebida adequada ao risco.
5. **Sistema de cores semânticas para tipos e frequências** — `TIPO_COLORS` (Inbound=emerald, Outbound=orange, Gestão=violet) e `FREQ_COLORS` aplicados consistentemente em badges e dots; ajudam reconhecimento rápido.
6. **Formulários com validações inline e inter-dependências** — Selects de Responsável e Substituto filtram-se mutuamente (excluem a seleção do outro) e validam que `responsavelId ≠ substitutoId` com mensagem inline; mudança de área/processo limpa seleções inválidas.
7. **Persistência de selecção nos modais de edição** — `useEffect` em `forms.tsx` repõe o estado do formulário quando `open` muda ou `initial` muda; pre-selecção (`areaPreselecionada`, `processoPreselecionado`, `actividadePreselecionada`) reduz cliques.
8. **Dados com filtros por área e 3 formatos (JSON/CSV/XLSX)** — `DadosView` permite seleccionar áreas individuais para exportar, oferece 3 formatos com microcopy explicativo e opção "substituir dados" com aviso destacado em âmbar.

---

## 4. Pontos de Melhoria (Priorizados)

### 🔴 ALTO IMPACTO

#### 4.1 Violações `color-contrast` em todas as telas (WCAG 2.1 AA falha)

- **Problema:** `axe-core` detectou em **todas as 5 telas principais** falhas de contraste no botão de navegação activo (`bg-primary` + `text-primary-foreground/20` do badge) e no rodapé da sidebar (`text-muted-foreground/60`). O badge "20" branco a 20% de opacidade sobre verde emerald fica abaixo de 4.5:1.
- **Localização exacta:**
  - `src/app/page.tsx` linhas 480–485 (badge do item activo na sidebar)
  - `src/app/page.tsx` linha 494 (rodapé da sidebar com `${dashboard.counts.areas} áreas · ...`)
- **Impacto no usuário:** Utilizadores com baixa visão ou daltonismo não conseguem ler contadores; falha de conformidade legal (EN 301 549, RGAA, WCAG 2.1 AA).
- **Sugestão implementável:** Substituir `bg-primary-foreground/20` por `bg-primary-foreground/30 text-primary-foreground` (sem opacidade adicional) ou usar `bg-white/25`. Para o rodapé da sidebar, trocar `text-muted-foreground/60` por `text-muted-foreground` (sem `/60`). Validar com `axe-core` depois.

#### 4.2 Ausência de skeletons — layout shift em todas as navegações

- **Problema:** As views (`DashboardView`, `OrganogramaView`, etc.) mostram primeiro o spinner centralizado "A carregar..." substituindo bruscamente pela lista quando o fetch termina. Em SSR, o dashboard chega a renderizar `"Não foi possível carregar o dashboard."` antes do `useEffect` completar (visível no HTML servido pela primeira requisição).
- **Localização:** `src/components/dashboard-view.tsx` linhas 21–31, `src/components/organograma-view.tsx` linhas 114–127, `src/components/drill-views.tsx` linhas 92–102 e equivalentes em cada `*DetailView`.
- **Impacto no usuário:** Sensação de "tela vazia" intermitente, jump visual entre estados, baixa percepção de performance.
- **Sugestão implementável:** Criar um wrapper `Skeleton` (já existe em `components/ui/skeleton.tsx`, não usado) e usá-lo em cada view antes do fetch. No `DashboardView`, mostrar skeleton do mesmo formato dos KPI cards + lista de áreas. Para o problema de SSR, garantir que `dashboard` é `null` inicialmente mas com flag `loading: true` distinguindo "carregando" de "erro".

#### 4.3 Affordances ambíguas — chips, badges e cards parecem clicáveis mas não são

- **Problema:** No detalhe da Tarefa, o chip "Outlook" em "Ferramentas Utilizadas" tem estilo `Badge variant="secondary"` igual aos filtros clicáveis de outras telas, mas não é interactivo. Idem para o badge de frequência nos cards de Processo/Actividade. O ícone `⋮` (EntityMenu) só aparece em hover (`opacity-0 group-hover:opacity-100`), não sendo acessível por teclado ou em mobile touch.
- **Localização:** `src/components/drill-views.tsx` linhas 826–830 (chips em ferramentas), `src/components/drill-views.tsx` linhas 868–901 (EntityMenu), `src/components/ui/badge.tsx` (variantes semânticas).
- **Impacto no usuário:** Cliques frustrados, falha de descoberta de acções (eliminar/editar escondidas em hover em mobile touch).
- **Sugestão implementável:**
  - (a) Diferenciar visualmente chips informativos (borda sólida, sem hover) de chips accionáveis (borda dashed, cursor pointer)
  - (b) Tornar o `EntityMenu` visível por defeito em mobile: `opacity-100 lg:opacity-0 lg:group-hover:opacity-100`
  - (c) Garantir que todos os cards clicáveis têm `cursor-pointer` e `<button>` semântico (já é o caso em alguns, mas o card `MembroListCard` usa `<Card>` envolvendo botões)

#### 4.4 Modais sem focus trap, sem `aria-modal`, sem fecho garantido por Esc

- **Problema:** Os `Dialog` do shadcn/ui (Radix) têm `role="dialog"` por defeito, mas o `DialogContent` não tem `aria-labelledby` nem `aria-describedby` configurados; o botão de fechar `X` é apenas visual. Não há indicação de foco preso (focus trap); o utilizador pode fazer Tab para fora do modal e interagir com o fundo.
- **Localização:** `src/components/forms.tsx` (todos os `Dialog` de Area, Membro, Processo, Actividade, Tarefa, Ferramenta), `src/components/ui/dialog.tsx`.
- **Impacto no usuário:** Utilizadores de leitor de ecrã perdem contexto; utilizadores de teclado podem submeter formulários do fundo acidentalmente.
- **Sugestão implementável:**
  - (a) Em todos os `Dialog` do `forms.tsx`, passar `aria-labelledby` apontando para o `DialogTitle` e `aria-describedby` para `DialogDescription` (Radix já faz parte disto se os componentes forem usados correctamente, mas validar)
  - (b) Adicionar handler `onKeyDown` para `Escape` fechar (Radix faz isto por defeito, mas o `DeleteConfirmDialog` deve confirmar)
  - (c) Mover o foco inicial para o botão "Cancelar" (acção segura) em modais destrutivos

---

### 🟡 MÉDIO IMPACTO

#### 4.5 Menu lateral com rodapé sobreposto ao avatar "N"

- **Problema:** O rodapé da sidebar (`page.tsx` linhas 493–497) usa `text-[10px] text-muted-foreground/60 text-center` com texto `${dashboard.counts.areas} áreas · ${dashboard.counts.processos} processos · ${dashboard.counts.tarefas} tarefas`. Nas capturas mobile, este texto fica parcialmente cortado pelo indicador "N" do Next.js dev tools — em produção o problema seria com qualquer indicador de status. Em desktop o texto é truncado se as contagens crescerem.
- **Impacto:** Perda de informação contextual (totalizações do sistema).
- **Sugestão:** Aumentar para `text-[11px]`, remover `/60` (ver 4.1), usar `truncate` ou `flex-wrap` para adaptar; considerar mover para um dropdown "info" no topo da sidebar.

#### 4.6 Lista de Áreas sem paginação nem scroll virtual com 24+ áreas

- **Problema:** `DashboardView` lista todas as áreas em `max-h-[420px] overflow-y-auto` — com 24 áreas gera scroll interno, mas sem indicador de "mais conteúdo abaixo". `OrganogramaView` distribui por 4 grupos de colunas; em mobile cada coluna vira secção vertical, gerando scroll longo sem TOC.
- **Localização:** `src/components/dashboard-view.tsx` linha 75 (grid com `max-h-[420px] overflow-y-auto`).
- **Impacto:** Utilizador não percebe total de áreas sem scrolling; descoberta baixa para áreas fora do topo.
- **Sugestão:**
  - (a) Adicionar contador "Mostrando X de Y áreas" acima da lista
  - (b) Implementar paginação ou "load more" para >30 áreas
  - (c) No organograma mobile, considerar abas colapsáveis por grupo (Comercial/Corporativas/Técnicas/Controlo)

#### 4.7 Hover states subtis demais em cards de área/processo

- **Problema:** `hover:shadow-md hover:border-primary/40 transition-all` em `ProcessoCard`, `ActividadeCard`, `AreaTile` é subtil — em capturas estáticas quase imperceptível. Sem `cursor-pointer` explícito em alguns casos (embora usem `<button>`).
- **Localização:** `src/components/drill-views.tsx` linhas 244, 503, 666, `src/components/organograma-view.tsx` linha 228.
- **Impacto:** Baixa affordance de clicabilidade; utilizador pode não perceber que pode clicar.
- **Sugestão:** Reforçar hover com `hover:-translate-y-0.5 hover:shadow-lg` (movimento micro), manter `cursor-pointer`, adicionar `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`.

#### 4.8 Erro de SSR "Não foi possível carregar o dashboard." na primeira renderização

- **Problema:** O HTML servido por `curl http://localhost:3000/` contém `<div class="text-center py-32 text-muted-foreground">Não foi possível carregar o dashboard.</div>` porque `dashboard` é `null` no SSR inicial e a condição `if (!data)` em `DashboardView` (linha 29–31) dispara. Apenas após `useEffect` + fetch + hydrate é que os dados reais chegam.
- **Impacto:** Motores de busca e crawlers vêem mensagem de erro; utilizador com JS desactivado ou conexão lenta vê erro intermitente.
- **Sugestão:** Distinguir `loading` de `error`: `if (loading) return <Skeleton/>; if (!data && !loading) return <ErrorState/>`. Em SSR, devolver `loading: true` inicial.

#### 4.9 `text-[10px]` e `text-[11px]` extensos — abaixo do mínimo legível

- **Problema:** Muitos `text-[10px]` (badges em cards de área, rodapé da sidebar, labels "Responsável"/"Substituto") e `text-[11px]` (breadcrumbs secundários). Estão abaixo do padrão de 12px (0.75rem) mínimo recomendado para corpo de texto.
- **Impacto:** Ilegibilidade em ecrãs de alta DPI; utilizadores com presbiopia têm dificuldade.
- **Sugestão:** Padronizar para `text-xs` (12px) mínimo em texto primário; reservar `text-[10px]` apenas para metadados puramente auxiliares (contadores discretos).

#### 4.10 Conectores do organograma não se ligam visualmente aos administradores

- **Problema:** Em `OrganogramaView` (linhas 141–146), os `div` com `bg-border` formam linhas conectoras em `left-1/4 left-1/2 right-1/4` mas não chegam a tocar nos cabeçalhos dos administradores; em capturas parecem "pendentes soltos". Em mobile (`hidden sm:block`), desaparecem sem alternativa.
- **Impacto:** Hierarquia visual da árvore quebrada; utilizador não vê relação pai-filho.
- **Sugestão:** Usar `border-t` e `border-l` em wrappers `relative` com posições absolutas, ou SVG dedicado; em mobile, indentar visualmente com `border-l-2 border-border pl-3` por nível hierárquico.

---

### 🟢 BAIXO IMPACTO

#### 4.11 Dois sistemas de ícones (SVG inline vs lucide-react)

- **Problema:** Em `page.tsx` (linhas 951–970) existem `MoreVerticalIcon`, `PencilIcon`, `Trash2Icon` definidos como SVGs inline, enquanto `drill-views.tsx` usa `lucide-react` (`MoreVertical`, `Pencil`, `Trash2`). Componentes duplicados a fazer o mesmo.
- **Impacto:** Manutenção duplicada, inconsistência visual subtil (stroke width pode diferir).
- **Sugestão:** Remover SVGs inline de `page.tsx` e usar `lucide-react` em todos os sítios.

#### 4.12 Avatar com iniciais sem fallback para nomes curtos

- **Problema:** `iniciais = m.nome.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()` — se o nome tiver uma só palavra ou começar por espaço, `p[0]` é undefined e quebra. Se o nome for "Ana" (uma palavra), mostra só "A".
- **Localização:** `src/app/page.tsx` linha 795, `src/components/drill-views.tsx` linha 293.
- **Sugestão:** `m.nome.trim().split(/\s+/).map(p => p[0] || '').slice(0, 2).join('').toUpperCase() || '?'`.

#### 4.13 Tabs `max-w-md` em area detail — pode desperdiçar espaço em ecrãs largos

- **Problema:** `TabsList className="grid w-full grid-cols-3 max-w-md"` limita a largura do tab selector, mas o conteúdo abaixo não tem `max-w`, criando assimetria.
- **Localização:** `src/components/drill-views.tsx` linha 123.
- **Sugestão:** Alinhar tudo ao mesmo `max-w` ou remover `max-w-md`.

#### 4.14 `text-2xl font-bold` em títulos de página pode ser pequeno em desktop

- **Problema:** Todos os títulos de view ("Visão Geral", "Organograma", "Membros da Equipa") usam `text-2xl sm:text-3xl` — em desktop com `max-w-7xl` o título pode parecer pequeno face ao conteúdo.
- **Sugestão:** Considerar `text-3xl sm:text-4xl tracking-tight` para títulos de página; manter `text-2xl` para títulos de card.

---

## 5. Recomendações Estratégicas

1. **Estabelecer um guia de design system explícito** — Apesar dos tokens CSS existirem, não há documentação viva. Criar `docs/design-system.md` (ou Storybook) com: paleta de cores e uso semântico (emerald=primário, orange=Outbound, violet=Gestão, rose=Destrutivo, amber=Warning), escala tipográfica (12/14/16/20/24/30px), escala de espaçamento (4/8/12/16/24/32px), catálogo de componentes padrão (Card, KPI, Badge, EmptyState, FormModal, ConfirmDialog, Breadcrumb). Reduz duplicação (ActionMenu vs EntityMenu) e acelera desenvolvimento.

2. **Implementar `Suspense` boundaries + skeletons estruturais** — Migrar `loadDashboard`, `loadAreas`, etc. para React Query ou SWR (já instalado `@tanstack/react-query`) com `keepPreviousData: true` e `placeholderData`. Isto elimina layout shift, permite prefetch ao hover sobre cards da sidebar e melhora percepção de performance. Combinar com `<Suspense fallback={<Skeleton/>}>` em layouts de página.

3. **Adicionar camada de acessibilidade automatizada no CI** — Integrar `@axe-core/playwright` (ou `jest-axe`) nos testes existentes (directório `tests/` já existe) para falhar build em regressões WCAG AA. Hoje o `axe-core` detectou 5 violações que teriam sido apanhadas automaticamente.

4. **Refactor do `page.tsx` para reduzir acoplamento** — O ficheiro principal tem 972 linhas com estado global, handlers, loaders e sub-componentes (`MembrosListView`, `FerramentasListView`, `ActionMenu`, ícones SVG). Extrair para `components/membros-list-view.tsx`, `components/ferramentas-list-view.tsx`, `components/action-menu.tsx`, `components/icons.tsx`. Isto melhora testabilidade, tree-shaking e legibilidade. Considerar mover estado para um pequeno store Zustand (já instalado) em vez de 12 `useState`.

5. **Mover navegação para URL state** — Hoje a navegação (`view.level`, `view.areaId`, etc.) está em `useState`, sem deep-linking. Usar `next/navigation` `useSearchParams` ou um router custom para que cada nível tenha URL própria (`/areas/[id]`, `/areas/[id]/processos/[id]`, ...). Isto permite: bookmarks, partilha de links, navegação com botões do browser, SSR real dos detalhes (elimina o problema 4.8).

---

## 6. Próximos Passos

### Priorizar nesta próxima iteração (por impacto × esforço):

| Ordem | Item | Esforço estimado | Impacto |
|---|---|---|---|
| 1 | **Corrigir violações `color-contrast`** (4.1) | 30 min | Alto (legal) |
| 2 | **Adicionar skeletons** (4.2) | 2 h | Alto (UX) |
| 3 | **Distinguir estado de loading de erro em SSR** (4.8) | 1 h | Alto (SEO) |
| 4 | **Reforçar affordances em cards** (4.3) | 1 h | Médio (UX) |
| 5 | **Padronizar menu de acções (EntityMenu único)** (4.11) | 1 h | Médio (manutenção) |

**Total estimado:** ~5h30 para cobrir os 5 itens de maior impacto.

### Como apresentar o feedback após implementar:

- **Antes/depois em capturas de ecrã:** tirar screenshots das 5 telas principais (Dashboard, Organograma, Membros, Ferramentas, Dados) + 1 modal + 1 drill-down completo, nas mesmas dimensões (desktop 1440×900 e mobile 390×844). Comparar lado-a-lado para evidenciar ganhos visuais.
- **Relatório de `axe-core` antes/depois:** executar `npx playwright test` com `@axe-core/playwright` e anexar o diff de violações (deve passar de 5 violações `serious` para 0).
- **Métricas de perceived performance:** medir LCP (Largest Contentful Paint) no dashboard antes/depois dos skeletons, usando Lighthouse ou `next build && next start` + WebPageTest.
- **Teste de teclado manual:** gravar um GIF curto a navegar por Tab através do modal de criar tarefa, mostrando focus trap a funcionar.
- **Checklist de regressão:** confirmar que todos os fluxos principais continuam a funcionar (criar área → processo → actividade → tarefa; editar; eliminar; exportar JSON/CSV/XLSX; importar; pesquisar; navegar por breadcrumb).

---

## Anexo A — Resumo das Análises Visuais por Tela

### A.1 Dashboard (`/`)

**Pontos fortes observados:**
- Título "Visão Geral" em tipografia bold e tamanho elevado estabelece o nível 1 da hierarquia.
- KPIs numéricos (24, 38, 141, 432...) usam peso e escala tipográfica adequados para leitura scan-friendly.
- Padding generoso nos cards, margens consistentes entre os KPIs e bom respiro entre seção hero e conteúdo.

**Problemas observados:**
- Os KPIs do topo competem entre si: todos têm o mesmo peso visual, sem indicar qual métrica é prioritária.
- Os metadados dentro dos cards de área (ícones pequenos com números — processos, membros, ferramentas) usam apenas ícones sem tooltip visível/legenda: o significado depende de memória do usuário. Falha heurística "Recognition rather than recall" (Nielsen).
- A barra lateral tem "Dashboard" como único item sem badge; os badges (24, 51, 24) não comunicam se são contagens totais ou pendências.
- A lista "Áreas Organizacionais" repete o padrão de 6 cards visuais idênticos, exigindo muito scrolling. Não há paginação, busca ou filtro visível.
- Texto truncado com ellipsis ("Centro Reclamações / Conduta ...") sem indicação de tooltip — perda de informação sem mecanismo de recuperação.
- Ícones dos KPIs usam cores variadas (verde, laranja, roxo, azul, rosa, teal) sem lógica semântica perceptível — cor arbitrária corrói o significado de cor como codificação.
- Ícones nas áreas organizacionais repetem o mesmo ícone (`Building2`) para todas — redundante, desperdiça espaço cognitivo.
- Texto "Anual · 4" em rosa sobre fundo rosa-claro e "Diária · 9" em vermelho sobre vermelho-claro: contrastes provavelmente abaixo de 3:1, risco real de reprovação WCAG.
- "20 de 24 áreas com processos definidos (83%)" é um bom feedback agregado, mas sem barra de progresso visual ou link para as 4 áreas faltantes — feedback sem ação.

### A.2 Organograma (`Organograma`)

**Pontos fortes observados:**
- O título "Organograma" (H1) com subtítulo explicativo bem estabelecido.
- O nó "Comissão Executiva" tem destaque correto como raiz da hierarquia (cor sólida verde, centralizado, com conector vertical).
- Cards seguem grid uniforme de 3 colunas, espaçamento consistente, ícones padronizados.

**Problemas observados:**
- A hierarquia de 3 níveis (Comissão → Administradores → Áreas) está perceptualmente achatada. Os cabeçalhos dos três administradores têm peso visual quase idêntico aos cards de áreas abaixo deles. Só se distinguem por cor de fundo sutil.
- Agrupamento por proximidade é frágil: sem linhas conectoras dos administradores para as suas colunas de áreas, a relação pai-filho depende apenas do alinhamento em colunas.
- Os chips de métricas (ícones com números) competem com o título do card pela atenção — ícones pequenos e números não têm contraste suficiente para leitura rápida.
- Métricas zeradas ("0") em quase todos os cards adicionam ruído sem valor. Recomendação: omitir ou atenuar valores zero.
- O card cortado na parte inferior sem indicação de scroll/continuação é problemático — não há fade, sombra ou affordance de "mais conteúdo abaixo".
- O card do "Presidente" tem borda/fundo amarelado enquanto os outros dois headers usam tons frios — sem legenda ou convenção clara.
- Texto cinza do subtítulo do card ("Sub Administrador Comercial") provavelmente próximo do limite AA — validar contraste.
- A linha conectora vertical da "Comissão Executiva" desce apenas parcialmente e não se conecta visualmente aos três headers — fica um "pêndulo solto".

### A.3 Membros (`Membros`)

**Pontos fortes observados:**
- Identidade visual coerente (verde consistente em sidebar, badges e CTA).
- Breadcrumb claro e CTA "Novo Membro" bem posicionado e visível.
- Cards com boa separação (espaçamento, sombra suave, cantos arredondados).

**Problemas observados:**
- Nome vs. cargo pouco diferenciados: "Eufrazino" (bold) e "Tesoureiro" têm quase o mesmo peso visual. O cargo é informação funcional importante — aumentar contraste/tamanho da distinção.
- Contadores "Responsável/Substituto" dominam o card: os retângulos cinzas ocupam ~30% do card, mas "0" repetido 9 vezes é ruído. Considerar omitir ou mostrar apenas quando > 0.
- Alturas inconsistentes na mesma linha: o card do Eufrazino (sem badge) é mais curto que os vizinhos — a linha fica desalinhada. Definir altura mínima uniforme.
- Email truncado problemático: "@g.g.c" é ininteligível. Truncar com elipse (`text-overflow`) + tooltip com valor completo.
- Caixas de contadores parecem botões (retângulos com borda) mas não o são — affordance enganosa.
- Cards não indicam clicabilidade: falta hover state, cursor pointer ou indicação ("Ver detalhes →").
- Avatares com iniciais: garantir contraste suficiente do texto branco sobre verde e `alt`/`aria-label` adequados.
- Contadores sem contexto para leitores de ecrã: "0 Responsável 0 Substituto" lido isoladamente não faz sentido; usar marcação tipo "3 processos como responsável".

### A.4 Ferramentas (`Ferramentas`)

**Pontos fortes observados:**
- Grid de 4 colunas eficiente para visualização rápida.
- Cores distintivas para o ícone Wrench (teal).

**Problemas observados:**
- Mesmas questões de affordance dos cards (sem hover evidente, sem `cursor-pointer`).
- ActionMenu só visível em hover (touch desabilitado em mobile).
- Sem estado de empty state visível (a lista tem 24 itens; se vazia, comportamento não testado).

### A.5 Dados (`Dados`)

**Pontos fortes observados:**
- Excelente microcopy: "O JSON inclui toda a estrutura e permite re-importar. O CSV e Excel são melhores para análise e partilha" — orienta a decisão, não descreve apenas.
- Cards de formato com ícones coloridos distintos (JSON/CSV/Excel) facilitam reconhecimento rápido.
- Fluxo lógico em blocos sequenciais: Filtros → Formato → (ação). Hierarquia visual clara com cards separados.
- Tabs Exportar/Importar bem sinalizadas com ícones direcionais.
- Contadores nos checkboxes (1p, 2p, 3p, 4p) dão noção de volume de dados por área.

**Problemas observados:**
- Cards de formato cortados na dobra — só se veem ícones e títulos, sem a descrição completa.
- Falta indicação do que cada badge "1p" significa — "1p" = processos? O termo não é óbvio. Precisa de tooltip ou legenda.
- "Limpar selecção" desativado no estado inicial está correto, mas quando ativo deve distinguir-se melhor de "Seleccionar tudo".
- Checkbox dentro de card clicável? Não é claro se o clique em todo o card seleciona a área ou só o checkbox. Área de toque do checkbox é pequena para dedos.
- Badge "Todas as áreas" à direita parece botão mas parece ser apenas indicador de estado — affordance ambígua.
- Falta botão de ação de exportação visível nesta dobra — o utilizador não sabe onde "concluir".
- Sem feedback de seleção além do checkbox — card selecionado deveria mudar (borda verde, fundo tinted) para reforçar estado.
- Nenhum indicador de progresso/estado para exportação em curso.
- Lista de áreas sem busca/filtro — com scroll longo (15+ áreas), um campo de pesquisa seria essencial.

### A.6 Modal "Nova Área"

**Pontos fortes observados:**
- Estrutura lógica: título + subtítulo explicativo dão contexto imediato.
- Hierarquia visual clara: campos ordenados do essencial ao opcional (Nome → Descrição → Objectivos).
- Foco visível: o campo "Nome" tem anel de foco verde bem perceptível.
- Placeholders com exemplo ("Ex: Corretagem", "Ex: Crescimento da produção") ajudam a entender o formato esperado.
- Hierarquia dos botões correta: ação primária ("Criar Área", verde sólido) vs. secundária ("Cancelar", ghost).

**Problemas observados:**
- Zero validação visível: não há mensagens de erro inline, indicação de campos obrigatórios preenchidos, nem estados de erro (borda vermelha).
- Botão "Criar Área" com aparência desabilitada (verde pálido): se está desabilitado, falta tooltip/hint explicando por quê; se está habilitado, o baixo contraste confunde.
- Sem confirmação de sucesso ou feedback após criar (spinner, toast).
- Fechar com "×" precisa de `aria-label="Fechar"` — um "×" puro não é anunciado por leitores de tela.
- Sem suporte a Esc aparente para fechar.
- Asterisco `*` deve ser associado com `aria-required="true"` e não depender só da cor/símbolo.
- Botões desalinhados do grid do form: "Cancelar"/"Criar Área" parecem começar antes da margem esquerda dos campos.
- Espaçamento inconsistente: gap entre "Nome" e "Descrição" menor que entre "Descrição" e "Objectivos".

### A.7 Modal "Eliminar Ferramenta"

**Pontos fortes observados:**
- Título específico ("Eliminar Ferramenta") com ícone de lixeira vermelho — reforço visual imediato da natureza da ação.
- O nome do item ("Adobe Acrobat") está citado entre aspas — evita eliminação do item errado.
- "Esta acção não pode ser desfeita" comunica irreversibilidade de forma direta.
- Hierarquia visual correta: ação destrutiva (vermelho sólido) vs. ação segura (Cancelar com contorno neutro).

**Problemas observados:**
- Sem indicação de foco preso no modal. Garantir `role="dialog"`, `aria-modal="true"`, `aria-labelledby` no título.
- Foco inicial deve estar no botão "Cancelar" (ação segura), não em "Eliminar".
- Ícone decorativo da lixeira deve ter `aria-hidden="true"`.
- Considerar destacar "Adobe Acrobat" em bold.
- Botões podem ter altura < 44px — aumentar padding para targets de toque confortáveis.
- O `X` de fechar no canto é pequeno e ambíguo — deve ter tooltip e `aria-label="Fechar"`.

### A.8 Detalhe de Tarefa

**Pontos fortes observados:**
- Título "Atualizar Estado do Processo" bem dominante, com subtítulo descritivo e metadado de revisão.
- O alerta (amarelo) posicionado acima dos cards aparece antes que o utilizador consuma o resto — ordem de leitura correta para conteúdo de estado/aviso.
- Separação clara Inputs / Outputs lado a lado é a decisão certa: permite comparação directa do "antes → depois".
- "Nenhum procedimento definido" em itálico é um empty state honesto.
- O alerta explica porquê e dá exemplo de destino ("Pipefy, Excel") — bom microcopy accionável.

**Problemas observados:**
- Redundância: a informação "Actuariado, Plan e Reporting · Relatório de Solvência · Validação de Dados de Entrada · Tarefa" aparece duas vezes em 60px verticais (breadcrumb + linha acima do título).
- O banner amarelo é o elemento mais alto da dobra superior, mas é metainformação, não conteúdo da tarefa. Para o executor, interpõe-se entre o título e os Inputs. Sugestão: colapsar para um callout compacto de uma linha com ícone ⓘ.
- Badge "Atualizar Estado do Processo" sob o breadcrumb: parece clicável mas é só um rótulo?
- Chip "Outlook" em "Ferramentas Utilizadas": parece um botão. Se pode abrir/deep-link para a ferramenta, deve parecer accionável; se é apenas etiqueta, o estilo actual induz cliques frustrados.
- Ícone de reticências (⋮) no canto superior direito sem tooltip — que ações contém?
- Seta de voltar (←): área de clique aparentemente pequena; deve ter hit area ≥ 44px.
- Empty state de Procedimentos perde oportunidade: "Nenhum procedimento definido" informa mas não acciona. Sugestão: adicionar CTA contextual ("Definir procedimentos").
- Contraste do texto cinzento claro ("Última revisão: 10/11/2026", breadcrumb, "Nenhum procedimento definido") — verificar ≥ 4.5:1.
- Alerta amarelo: o estado é comunicado só pela cor do fundo. O ícone ⊘ ajuda, mas garantir que o texto do alerta é anunciado como `role="alert"` ou `aria-live`.

### A.9 Estado de Loading

**Problemas observados:**
- Não há skeleton screens, spinner, barra de progresso nem qualquer indicador de carregamento visível na região da lista.
- O botão "Nova Área" está totalmente ativo durante o carregamento — o usuário pode clicar antes de entender a estrutura existente.
- A busca ("Pesquisar área...") também não indica se está operacional ou aguardando dados.
- Risco de CLS alto: os espaços dos cards já estão ocupados por conteúdo — se o loading for substituído por dados de tamanho diferente, haverá saltos visuais.

### A.10 Empty State (Pesquisa sem resultados)

**Pontos fortes observados:**
- Ícone + título + subtítulo, centralizado e bem espaçado. Hierarquia visual clara.
- O ícone (prédio/organograma) é contextual e coerente com o domínio da página.
- Borda tracejada do cartão sinaliza bem que é um estado transitório/vazio.
- "Nenhuma área encontrada" é específico (não genérico tipo "Sem resultados") e menciona a entidade correta.
- O termo pesquisado permanece visível no campo de busca — o usuário não perde o que digitou.

**Problemas observados:**
- Falta botão "Limpar pesquisa" — a ação mais natural após busca sem resultado é limpar o filtro.
- Microcopy não repete o termo pesquisado. Versão mais útil: `Nenhuma área encontrada para "zzzznotfound"`.
- Sem sugestões concretas — "Verifique a ortografia ou tente um termo mais geral".
- O cartão do empty state fica colado ao topo, deixando ~45% da tela vazios abaixo.
- O badge "24" no menu lateral e o rodapé "24 áreas · 38 processos" dizem que existem 24 áreas, mas a tela mostra nenhuma — não comunica que a pesquisa filtra.
- Ícone monocromático e apagado, baixo contraste.
- Sem acesso à ação primária no vazio — considerar "Não encontrou? Criar nova área" como ação secundária.

### A.11 Vista Mobile (390×844)

**Pontos fortes observados:**
- Grid de 2 colunas para os KPI cards funciona bem em 390px; nenhum elemento aparenta overflow ou quebra de texto.
- Tipografia escalonada com hierarquia clara.
- Padrão visual uniforme nos cards: ícone colorido arredondado → número → label.
- Cards grandes (~160px de altura) ultrapassam confortavelmente o mínimo de 44×44px.

**Problemas observados:**
- Os cards KPI são altos demais para a informação que contêm. Muito espaço vazio entre ícone e número. Em mobile, o scroll inicial só revela ~4 cards antes da dobra.
- Sugestão: layout horizontal compacto (ícone à esquerda, número+label à direita) reduziria ~40% da altura.
- Números soltos (24, 38, 141, 432) sem tendência (↑↓), sem comparação temporal.
- O texto diz "Clique numa área abaixo", mas não fica claro se os 6 cards de métricas são clicáveis. Falta chevron ">" ou elevação.
- O ícone de "Áreas" (edifício verde) repete-se 3 vezes: card KPI, título da seção e card da "Academia Comercial". Cria confusão entre nível de navegação e item de lista.
- Header só com o hamburger à esquerda, muito espaço morto lateralmente. O título "Dashboard" duplica a função do "Visão Geral" logo abaixo — redundância em mobile.
- No card "Academia Comercial", os ícones com contadores têm ~16px — abaixo do alvo de toque e difíceis de interpretar sem labels.

---

## Anexo B — Resumo do Scan `axe-core`

**Configuração:** `axe-core` 4.10 com tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, executado via Playwright em viewport 1440×900.

| Tela | Violações | Severidade | Regra falhada | Nº de nós |
|---|---|---|---|---|
| Dashboard | 1 | serious | `color-contrast` | 2 |
| Organograma | 1 | serious | `color-contrast` | 5 |
| Membros | 1 | serious | `color-contrast` | 4 |
| Ferramentas | 1 | serious | `color-contrast` | 4 |
| Dados | 1 | serious | `color-contrast` | 2 |
| **TOTAL** | **5** | — | — | **17 nós** |

**Selectores afectados (mais frequentes):**

- `.bg-primary.text-primary-foreground.px-3 > .text-left.flex-1` (label do botão nav activo na sidebar)
- `.bg-primary-foreground\/20` (badge de contagem do botão activo)
- `.text-muted-foreground\/60` (rodapé da sidebar com totalizações)

**Tags WCAG violadas:** `wcag2aa`, `wcag143`, `TTv5`, `TT13.c`, `EN-301-549`, `EN-9.1.4.3`, `RGAAv4`, `RGAA-3.2.1`.

**Nota:** Apenas 1 regra está a falhar (`color-contrast`), mas em 17 nós distintos. Isto significa que a correção é localizada e rápida —集中 em 2 ficheiros (`page.tsx` e `globals.css`).

---

## Anexo C — Checklist de Implementação

Marcar cada item conforme for concluído:

- [ ] **4.1** Corrigir `color-contrast` no badge do botão nav activo (`page.tsx:480-485`)
- [ ] **4.1** Corrigir `color-contrast` no rodapé da sidebar (`page.tsx:494`)
- [ ] **4.2** Implementar skeleton no `DashboardView` (`dashboard-view.tsx:21-31`)
- [ ] **4.2** Implementar skeleton no `OrganogramaView` (`organograma-view.tsx:114-127`)
- [ ] **4.2** Implementar skeleton nos `*DetailView` (`drill-views.tsx:92-102`)
- [ ] **4.2** Implementar skeleton no `MembrosListView` e `FerramentasListView` (`page.tsx`)
- [ ] **4.3** Diferenciar chips informativos de accionáveis (variante de `Badge`)
- [ ] **4.3** Tornar `EntityMenu` visível em mobile (`opacity-100 lg:opacity-0 lg:group-hover:opacity-100`)
- [ ] **4.3** Adicionar `cursor-pointer` + `focus-visible:ring-2` a todos os cards clicáveis
- [ ] **4.4** Validar `aria-labelledby` e `aria-describedby` em todos os `Dialog` de `forms.tsx`
- [ ] **4.4** Mover foco inicial para "Cancelar" em modais destrutivos (`DeleteConfirmDialog`)
- [ ] **4.5** Aumentar `text-[10px]` para `text-[11px]` no rodapé da sidebar; remover `/60`
- [ ] **4.6** Adicionar contador "Mostrando X de Y áreas" no `DashboardView`
- [ ] **4.7** Reforçar hover: `hover:-translate-y-0.5 hover:shadow-lg` em cards
- [ ] **4.8** Distinguir `loading` de `error` em `DashboardView` (e outras views)
- [ ] **4.9** Padronizar `text-xs` (12px) mínimo em texto primário
- [ ] **4.10** Refazer conectores do organograma (SVG ou borders absolutas)
- [ ] **4.11** Remover SVGs inline (`MoreVerticalIcon`, `PencilIcon`, `Trash2Icon`) de `page.tsx`
- [ ] **4.12** Adicionar fallback em `iniciais` para nomes curtos (`page.tsx:795`, `drill-views.tsx:293`)
- [ ] **4.13** Alinhar `TabsList` com conteúdo no `AreaDetailView`
- [ ] **4.14** Aumentar títulos de página para `text-3xl sm:text-4xl`

---

## Anexo D — Fluxos Principais para Teste de Regressão

Após implementar as melhorias, validar que estes fluxos continuam a funcionar:

1. **Criar entidade completa:** Dashboard → Organograma → "Nova Área" → Criar → Abrir área → "Criar processo" → Criar → Abrir processo → "Criar actividade" → Criar → Abrir actividade → "Criar tarefa" com 3 procedimentos → Criar.
2. **Editar entidade:** Em cada nível, abrir menu `⋮` → Editar → Modificar nome → Guardar → Verificar toast "actualizado".
3. **Eliminar entidade (com cascata):** Eliminar processo → Confirmar aviso de cascata → Verificar actividades e tarefas associadas são removidas.
4. **Pesquisar:** Em `OrganogramaView`, pesquisar por termo parcial → Verificar filtro → Pesquisar termo inexistente → Verificar empty state → Limpar pesquisa.
5. **Exportar:** Dados → Seleccionar 3 áreas → Exportar JSON → Exportar CSV → Exportar XLSX → Validar conteúdo de cada ficheiro.
6. **Importar:** Dados → Importar ficheiro JSON exportado → Verificar contadores de importação.
7. **Navegação por breadcrumb:** Em detalhe de tarefa, clicar em cada nível do breadcrumb → Verificar retorno ao nível correcto.
8. **Navegação por teclado:** Tab através da sidebar → Enter em "Membros" → Tab até card de membro → Enter para abrir (se aplicável) → Shift+Tab para voltar → Esc para fechar modal.
9. **Mobile:** Abrir em 390px → Abrir sidebar via hamburger → Navegar para cada view → Verificar não há overflow horizontal.
10. **Toasts:** Triggerar erro de rede (desligar backend) → Verificar toast de erro aparece e desaparece.

---

**Fim da avaliação.**

Estou pronto para receber a próxima versão do projecto com as melhorias implementadas. À medida que envia as iterações, pode especificar quais itens do plano foram corrigidos (ex.: "corrigi 4.1, 4.2, 4.8 e 4.11") para eu focar a próxima rodada nos restantes e validar de forma objectiva os ganhos.
