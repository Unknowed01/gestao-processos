# Avaliação UX/UI — Versão 9 (iteração 2)

**Data:** 11 de Novembro de 2026
**Versão analisada:** `workspace-2d6dfcf8-...9.tar`
**Comparação:** vs versão 8 (avaliada anteriormente)
**Método:** Inspeção de código (diff v8→v9), runtime com Next.js 16.1.3, capturas em desktop 1440×900, tablet 768×1024 e mobile 390×844, scan `axe-core` 4.10 (WCAG 2.1 AA), análise visual VLM em 8 telas.

---

## Sumário executivo

A versão 9 introduz **3 mudanças estruturais importantes** e resolve **4 dos 5 itens de alta prioridade** que apontei na rodada anterior. A nota global sobe de **7,0 para 7,7**. Os itens pendentes (autocomplete de membros, adicionar ferramentas dentro de tarefas, lista de membros/ferramentas grande demais) são endereçados nas respostas directas abaixo.

### Mudanças detectadas (v8 → v9)

| Ficheiro | Tipo de mudança | Item resolvido |
|---|---|---|
| `src/app/globals.css` | `--primary` escurecido de `0.55` → `0.5`, `--muted-foreground` de `0.5` → `0.45`, `--border` de `0.92` → `0.9` | **4.1** Corrigir contraste WCAG |
| `src/app/page.tsx:488` | Badge do item nav activo: `bg-primary-foreground/20` → `bg-white/25 text-white` | **4.1** Corrigir contraste sidebar |
| `src/app/page.tsx:497` | Rodapé sidebar: `text-[10px] text-muted-foreground/60` → `text-xs text-muted-foreground` | **4.1** Corrigir contraste rodapé |
| `src/components/skeletons.tsx` | **NOVO** — `DashboardSkeleton`, `KpiSkeleton`, `AreaCardSkeleton`, `ListSkeleton`, `DetailSkeleton`, `GridSkeleton` | **4.2** Skeletons |
| `src/components/dashboard-view.tsx` | Loading com `DashboardSkeleton`, separação loading vs erro com CTA "Tentar novamente" | **4.2** + **4.8** Estado loading vs erro |
| `src/components/organograma-view.tsx` | Skeleton grid durante loading; empty state com `Limpar pesquisa` e eco do termo pesquisado | **4.2** + empty state melhorado |
| `src/components/drill-views.tsx` | `DetailSkeleton` em todos os `*DetailView`; hover reforçado (`hover:-translate-y-0.5`); `cursor-pointer` + `focus-visible:ring-2`; EntityMenu visível em mobile; avatar com fallback para nomes curtos; tabs sem `max-w-md` | **4.3** + **4.7** + **4.12** + **4.13** |
| `src/app/page.tsx:941-970` | `ActionMenu` migrado para `DropdownMenu` do shadcn/ui; SVGs inline removidos | **4.11** Padronizar ícones |
| `src/components/tree-sidebar.tsx` + `src/app/api/areas/[id]/tree/route.ts` | **NOVO** — Sidebar em árvore hierárquica no drill-down de área | Recurso estratégico (recomendação 5) |
| `src/components/drill-views.tsx:184-200` | Tab "Equipa" tem botão "Adicionar membro" e empty state com CTA | **Parcial**: abre `MembroFormDialog` (cria novo); não usa autocomplete |
| `src/app/page.tsx:660` | `MembroFormDialog` recebe `lockedAreaId` quando aberto dentro de área | Pré-requisito para autocomplete |
| `src/components/dashboard-view.tsx`, `dados-view.tsx`, `page.tsx` | Títulos `text-2xl sm:text-3xl` → `text-3xl sm:text-4xl` | **4.14** Títulos maiores |

### Pontuação comparada

| Critério | v8 | v9 | Δ |
|---|---|---|---|
| Usabilidade / UX | 7,5 | 8,0 | +0,5 |
| Interface visual / hierarquia | 7,5 | 8,0 | +0,5 |
| Consistência / design system | 8,0 | 8,5 | +0,5 |
| Acessibilidade (a11y) | 5,5 | 6,5 | +1,0 |
| Responsividade | 7,0 | 7,0 | 0 |
| Feedback / estados de interação | 6,5 | 8,0 | +1,5 |
| Clareza / carga cognitiva | 7,0 | 7,5 | +0,5 |
| Performance percebida | 6,5 | 7,5 | +1,0 |
| **Média** | **6,94** | **7,63** | **+0,69** |

### Scan `axe-core` comparado

| Tela | v8 (violações serious) | v9 (violações) | Estado |
|---|---|---|---|
| Dashboard | 1 (color-contrast, 2 nós) | **0** | Resolvido |
| Organograma | 1 (color-contrast, 5 nós) | 1 (color-contrast, 2 nós) — botão Comissão Executiva + `bg-white/25` | Parcial |
| Membros | 1 (color-contrast, 4 nós) | 1 (color-contrast, 1 nó) — `bg-white/25` | Parcial |
| Ferramentas | 1 (color-contrast, 4 nós) | 1 (color-contrast, 1 nó) — `bg-white/25` | Parcial |
| Dados | 1 (color-contrast, 2 nós) | **1 critical (button-name, 24 nós)** — checkboxes sem `aria-label` | Regrediu em critical |

**Resumo:** violações `color-contrast` caíram de 17 nós para 5, mas o `bg-white/25` (no badge "Comissão Executiva" do organograma e nos badges de contagem da sidebar) ainda falha AA. Em `Dados`, surgiu um novo problema **critical**: os 24 checkboxes de área não têm `aria-label` acessível.

---

## 1. O dashboard faz sentido?

**Sim, faz sentido e melhorou.** O dashboard funciona como ponto de entrada coerente, mas há 3 ajustes de impacto alto para o tornar realmente útil:

### O que está bem feito
- **Hierarquia visual** — KPIs (24, 38, 141, 432) com numeração dominante + label subordinada; título "Visão Geral" com `text-3xl sm:text-4xl` correctamente proeminente.
- **Distribuição** — KPIs em grid 2/3/6 colunas conforme breakpoint; cards de área em 2 colunas com metadados (processos/membros/ferramentas) legíveis.
- **Skeletons no SSR** — agora o HTML servido pelo Next.js traz `<Skeleton>` em vez da antiga mensagem "Não foi possível carregar o dashboard." — crawlers e SEO veem conteúdo estruturado.
- **Separação loading vs erro** — `if (loading) return <DashboardSkeleton/>; if (!data && !loading) return <ErrorState/>` com CTA "Tentar novamente".
- **Microcopy accionável** — "20 de 24 áreas com processos definidos (83%)" dá contexto de progresso.

### O que ainda não faz sentido (e como corrigir)

**1.1 KPIs são estáticos — não dizem o que fazer com eles**
- "432 Tarefas" é um número; não diz quantas vencem hoje, quantas estão atrasadas, quantas são minhas.
- **Sugestão:** adicionar micro-tendência (`↑ 12 esta semana`) e/ou tornar os KPIs navegáveis com chevron visível. Hoje só "Áreas" e "Membros" são clicáveis; "Processos", "Actividades", "Tarefas", "Ferramentas" não levam a lado nenhum.

**1.2 Card "Banca · 0 processos" aparece igual aos card com processos**
- Áreas com zero processos deviam ser visualmente diferenciadas (borda tracejada, opacidade reduzida) e ter CTA "Definir processos" inline. Hoje são "dead-ends" visuais.

**1.3 Coluna direita (Processos por Tipo + Frequência) deixa vazio abaixo**
- A lista de áreas estende-se abaixo da coluna lateral, gerando assimetria. Considerar tornar a coluna `sticky top-20` ou preencher o vazio com "Tarefas recentes" (que existe no `DashboardData` mas está abaixo da dobra).

**1.4 Ícones das áreas todos idênticos (`Building2`) — código de cor sem significado**
- Há 6 cores cíclicas para 24 áreas; a cor não codifica categoria. **Ou** se atribuem ícones semânticos (Corretagem = `$`, Jurídico = `Scale`, Recursos Humanos = `Users`, etc.) **ou** simplifica-se para 1–2 cores neutras.

**1.5 Ordenação da lista de áreas não é óbvia**
- Não é alfabética nem por nº de processos. Definir e comunicar a ordenação (ex.: "ordenadas por número de processos descendente").

---

## 2. Autocomplete de membros existentes — como implementar de forma sutil

**Esta é a melhoria de maior impacto pendente.** O utilizador tem razão: o fluxo actual obriga a criar um novo registo de `Membro` sempre que se adiciona alguém a uma área, mesmo que essa pessoa já exista no sistema. Com 51 membros e 24 áreas, há forte probabilidade de duplicação.

### Diagnóstico do que existe hoje

Em `src/components/drill-views.tsx:184-200`, o botão "Adicionar membro" na tab Equipa chama `onCreateMembro`, que abre `MembroFormDialog`. Esse modal (em `forms.tsx:93-177`) **sempre cria um novo registo** via `POST /api/membros` — não consulta membros existentes. O `lockedAreaId` (recém-adicionado em v9) apenas esconde o select de área, mas o problema de duplicação mantém-se.

### Padrão recomendado: Combobox com fallback de criação

A `cmdk` (já instalada no `package.json` v1.1.1) é a base usada pelo `Command` do shadcn/ui (já existe em `src/components/ui/command.tsx`). Implementar:

```tsx
// Em forms.tsx — substituir o campo "Nome" do MembroFormDialog por:
<Command shouldFilter={true} loop>
  <CommandInput
    placeholder="Pesquisar membro existente ou escrever novo nome..."
    value={nomeBusca}
    onValueChange={async (v) => {
      setNomeBusca(v)
      if (v.length >= 2) {
        const res = await fetch(`/api/membros?q=${encodeURIComponent(v)}`)
        const matches = await res.json()
        setSugestoes(matches)
      }
    }}
  />
  <CommandList>
    {sugestoes.length > 0 && (
      <CommandGroup heading="Membros existentes">
        {sugestoes.map(m => (
          <CommandItem
            key={m.id}
            value={m.id}
            onSelect={() => {
              setMembroSelecionado(m)
              setNomeBusca(m.nome)
            }}
          >
            <Avatar className="h-6 w-6 mr-2">{iniciais(m.nome)}</Avatar>
            <div className="flex-1">
              <p className="text-sm">{m.nome}</p>
              <p className="text-xs text-muted-foreground">
                {m.cargo} {m.area && `· ${m.area.nome}`}
              </p>
            </div>
            {m.areaId === lockedAreaId && (
              <Badge variant="outline" className="text-[10px]">já nesta área</Badge>
            )}
            {m.areaId && m.areaId !== lockedAreaId && (
              <Badge variant="secondary" className="text-[10px]">em {m.area.nome}</Badge>
            )}
          </CommandItem>
        ))}
      </CommandGroup>
    )}
    {/* Fallback de criação — sempre que o nome digitado não tem match exacto */}
    {nomeBusca.trim() && !membroSelecionado && (
      <CommandGroup heading="Criar novo">
        <CommandItem
          value={`novo-${nomeBusca}`}
          onSelect={() => setMembroSelecionado(null)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          <span>Criar "<strong>{nomeBusca}</strong>" como novo membro</span>
        </CommandItem>
      </CommandGroup>
    )}
  </CommandList>
</Command>
```

### UX da subtileza — 5 regras

1. **Combobox, não modal** — sugestões aparecem inline enquanto escreve, nunca como popup separado.
2. **Apenas 2 caracteres** gatilham a busca (evita incomodar quem escreve "An" para "Ana").
3. **Avatar + área actual** em cada sugestão — permite reconhecer a pessoa visualmente antes de confirmar.
4. **Badge de contexto** discreto: se o membro já está nesta área, mostrar "já nesta área" (desabilitar selecção); se está noutro, mostrar "em Marketing" (permitir associar).
5. **CTA muda consoante a selecção**:
   - Membro existente seleccionado → botão `Associar à área` (verde primário, sem criar duplicado)
   - Membro novo → botão `Criar membro` (outline secundário)

### Endpoint necessário

Adicionar em `src/app/api/membros/route.ts` (GET existente) suporte a query string `?q=`:

```ts
// GET /api/membros?q=ana
const q = url.searchParams.get('q')
const membros = await db.membro.findMany({
  where: q ? {
    OR: [
      { nome: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ]
  } : undefined,
  select: { id: true, nome: true, email: true, cargo: true, areaId: true, area: { select: { nome: true } } },
  take: 5,
})
```

### Regra de ouro

> **Botão primário do modal = "Associar membro existente". Botão secundário = "Criar novo membro" (link, só aparece quando não há matches).**

Isto inverte a fricção: hoje é mais fácil duplicar do que evitar duplicação.

---

## 3. O programa está bom para pessoas que nunca tiveram contacto?

**Razoavelmente bom, mas com 4 barreiras críticas para first-time users.**

### O que está bom para iniciantes
- **Linguagem clara** — "Bem-vindo ao sistema de gestão de processos. Clique numa área abaixo..." explica o que fazer sem jargão.
- **Empty states accionáveis** — quando não há processos, há CTA "Criar primeiro processo" no contexto certo.
- **TreeSidebar** — dá noção de "onde estou na hierarquia" sem precisar de voltar atrás.
- **Microcopy explicativa** — "As tarefas são as unidades operacionais com inputs, procedimentos e outputs" ajuda a perceber a estrutura.
- **Validações inline** — responsável ≠ substituto é validado com mensagem específica.

### Barreiras críticas para first-time users

**3.1 Onboarding inexistente**
- Não há tutorial, walkthrough, tooltip inicial nem estado "vazio real" (quando `dashboard.counts.areas === 0`, devia haver wizard "Comece por criar a sua primeira área").
- **Sugestão:** se `dashboard.counts.areas === 0`, mostrar ecrã de boas-vindas com 3 passos: 1) Criar área → 2) Adicionar membros → 3) Criar processo. Com CTAs directos.

**3.2 Hierarquia conceptual Área → Processo → Actividade → Tarefa não é óbvia**
- Um novo utilizador não sabe distinguir "processo" de "actividade" de "tarefa" sem treino.
- **Sugestão:** adicionar tooltip/info icon junto aos títulos das tabs e dos botões "Criar X" com definição curta: "Processo = conjunto de actividades de uma área". O `InfoTipoProcesso` em `forms.tsx:860` é um bom padrão a replicar.

**3.3 Ícones de metadados pequenos exigem memorização**
- `Workflow 4 · Users 2 · Wrench 0` nos cards de área: o que é cada ícone? Não há legenda, tooltip visível nem primeira-pessoa.
- **Sugestão:** adicionar `title` em cada `<span>` (ex.: `title="4 processos"`) — já feito em `organograma-view.tsx:238-245`, mas não em `dashboard-view.tsx:90-93`.

**3.4 Estado "Instruções não implementadas" pode confundir**
- O banner âmbar "Instruções ainda não implementadas nas ferramentas de trabalho" em tarefas é jargão interno — um iniciante não sabe o que são "ferramentas de trabalho" neste contexto.
- **Sugestão:** reformular para "Esta tarefa ainda não tem procedimentos. Defina os passos para a tornar executável." — foco na acção, não no estado.

### Para um utilizador de idade avançada ou baixa literacia digital
- Os `text-[10px]` e `text-[11px]` (que persistem em vários pontos) são demasiado pequenos.
- A navegação drill-down com 4 níveis pode desorientar — considerar mostrar " breadcrumbs mais visíveis em vez do back arrow isolado.

---

## 4. O organograma está visualmente bonito?

**Sim, melhorou claramente.** Estética limpa, paleta coerente, mas ainda há 3 questões visuais.

### O que está bonito
- **Hierarquia de cores semântica** — Comissão Executiva (verde emerald sólido, raiz), Administradores em 3 tons distintos (cinza/slate para Comercial, âmbar para Presidente, violeta para Técnico), Controlo (rose) em baixo.
- **Cards de área com cantos arredondados**, sombras subtis, padding generoso.
- **Conectores "pendentes soltos" resolvidos** — agora há uma linha vertical curta + linha horizontal sutil acima dos administradores.

### O que ainda não está bonito (e como corrigir)

**4.1 Conectores desaparecem abaixo dos administradores**
- As áreas abaixo de cada administrador não têm linha conectora descendente visível; a relação pai-filho depende 100% do alinhamento em colunas.
- **Sugestão:** adicionar `border-l-2 border-border/40 ml-3 pl-3` por coluna (discreto, contínuo).

**4.2 Rodapé da sidebar sobreposto**
- "24 áreas · 38 processos · 432 tarefas" ainda é parcialmente cortado em mobile quando o dev tools indicator do Next.js aparece (em produção não haverá sobreposição, mas o tamanho do texto ainda pode truncar com áreas crescentes).
- **Sugestão:** usar `flex flex-wrap justify-center gap-1` em vez de `text-center` para permitir quebra natural.

**4.3 Card "Presidente" com fundo âmbar quebra simetria**
- O destaque amarelo não é explicado — por que razão o Presidente é visualmente diferente dos outros dois administradores?
- **Sugestão:** ou alinhar os 3 administradores visualmente, ou adicionar legenda "Presidente tem hierarquia superior".

**4.4 Métricas com zero aparecem iguais às com valor**
- `0 processos · 2 membros · 0 ferramentas` e `4 processos · 3 membros · 1 ferramenta` têm o mesmo peso visual.
- **Sugestão:** omitir métricas zeradas ou atenuá-las com `opacity-50`.

---

## 5. A lista de membros e ferramentas está grande demais?

**Sim, para o padrão actual de cards. Não, se reorganizada.** O problema não é o volume (51 membros e 24 ferramentas são perfeitamente geríveis) mas o formato de visualização.

### Membros (51 itens)

**Diagnóstico:**
- Com 3 colunas e cards de ~180px de altura, vê-se apenas ~9 membros por ecrã — são necessários 6 scrolls para ver todos.
- Não há filtros nem ordenação, só pesquisa textual.
- Métricas "0 Responsável · 0 Substituto" aparecem em 9 dos 9 cards visíveis — ruído sem valor.

**Recomendações (por ordem de impacto):**

1. **Adicionar filtros por área** — dropdown `Select` com as 24 áreas; 51 membros facilmente reduzidos a 2-3 por área.
2. **Adicionar filtros por função** — chips "Responsável por processo", "Substituto", "Sem responsabilidade".
3. **Adicionar ordenação** — por nome (A-Z), por nº de responsabilidades (mais carregado primeiro), por área.
4. **Modo de vista alternativo** — toggle entre "Cards" e "Lista compacta" (tabela densa, 1 linha por membro: avatar + nome + cargo + área + nº resp.). Para localização rápida, lista supera cards.
5. **Esconder métricas zeradas** — se `(procResp + actResp + procSubst + actSubst) === 0`, mostrar badge "Sem responsabilidades" em vez de "0 / 0".
6. **Adicionar `aria-live`** ao contador de resultados quando filtrado ("A mostrar 12 de 51 membros").

### Ferramentas (24 itens)

**Diagnóstico:**
- 4 colunas com cards grandes (`p-4 pr-10` + ícone 40×40px + 2 linhas de texto) — vê-se 8-12 por ecrã, exigindo 2-3 scrolls.
- O ícone `Wrench` é **idêntico em todos os 24 cards** — ocupa ~50% do card e transmite zero informação.
- Sem busca nem filtros.

**Recomendações:**

1. **Adicionar barra de pesquisa** — mesmo padrão do organograma (`Search` icon + `Input`).
2. **Substituir ícone genérico por logotipos reais** — para ferramentas conhecidas (Outlook, Excel, Pipefy, Jira, Slack), usar favicon oficial ou ícone de marca; isso torna o card instantaneamente reconhecível.
3. **Agrupar por categoria** — Comunicação (Outlook, Slack, Teams), Documentos (Excel, Word, Acrobat), Gestão (Pipefy, Jira, Trello), Análise (Power BI, Tableau). Categorias como abas ou secções colapsáveis.
4. **Adicionar metadado "usada em N tarefas"** — `Badge variant="secondary"` no canto do card com "12 tarefas" torna o card "vivo".
5. **Modo lista compacta** — para 24+ ferramentas, 1 linha por ferramenta (ícone 24px + nome + descrição truncada + counter) é mais eficiente que 4 colunas de cards.

### TamanhoLimite sugerido

| Item | Limite actual | Recomendação |
|---|---|---|
| Cards visíveis por ecrã (1440×900) | 9 membros / 8 ferramentas | ≥15 com vista compacta |
| Filtros disponíveis | 0 | ≥2 (área + função para membros; categoria para ferramentas) |
| Ordenação | 0 | 2-3 opções |
| Busca | só membros | ambos |

---

## 6. Adicionar ferramentas dentro das tarefas — respeitando o que já existe

**Hoje isto já é possível, mas o fluxo é frágil.** Verifiquei o código:

### O que existe hoje

Em `src/components/forms.tsx:571-757` (`TarefaFormDialog`), as ferramentas são seleccionadas por **chips clicáveis** num container com scroll:

```tsx
<div className="flex flex-wrap gap-2 p-3 rounded-lg border border-border bg-muted/30 max-h-32 overflow-y-auto">
  {ferramentas.map((f) => (
    <button onClick={() => toggleFerramenta(f.id)} className={...}>
      {f.nome}
    </button>
  ))}
</div>
```

### Problemas do padrão actual

- **`max-h-32` (128px) com overflow scroll** — com 24 ferramentas, o utilizador só vê ~6-8 sem fazer scroll; muitas ficam escondidas.
- **Sem busca** — encontrar "Outlook" entre 24 chips exige varrer visualmente.
- **Sem criar nova ferramenta inline** — se a ferramenta não existe, o utilizador tem de cancelar o modal, ir a "Ferramentas" no menu, criar, voltar à tarefa, reabrir o modal e seleccionar.
- **Sem feedback de quantas estão seleccionadas** — não há contador "3 de 24 seleccionadas".

### Recomendação: mesmo padrão do autocomplete de membros

Aplicar a mesma solução `Combobox` (cmdk) já sugerida para membros:

```tsx
<Command shouldFilter={true}>
  <CommandInput placeholder="Pesquisar ferramenta ou criar nova..." />
  <CommandList>
    <CommandGroup heading="Ferramentas existentes">
      {ferramentas.map(f => (
        <CommandItem key={f.id} onSelect={() => toggleFerramenta(f.id)}>
          <Wrench className="h-4 w-4" />
          <span className="flex-1">{f.nome}</span>
          {form.ferramentaIds.includes(f.id) && <Check className="h-4 w-4 text-primary" />}
        </CommandItem>
      ))}
    </CommandGroup>
    {/* Fallback de criação */}
    {busca.trim() && !ferramentas.some(f => f.nome.toLowerCase() === busca.toLowerCase()) && (
      <CommandGroup heading="Criar nova">
        <CommandItem onSelect={() => criarFerramentaInline(busca)}>
          <Plus className="h-4 w-4" />
          Criar "<strong>{busca}</strong>"
        </CommandItem>
      </CommandGroup>
    )}
  </CommandList>
</Command>
```

### Criação inline — UX detalhada

1. **Ao seleccionar "Criar nova"** — mostrar mini-formulário inline (nome + descrição opcional) dentro do mesmo modal, sem fechar o `TarefaFormDialog`.
2. **Chamada à API** — `POST /api/ferramentas` com `{ nome: busca }`, receber o novo `Ferramenta` criado, adicionar automaticamente a `ferramentaIds` e mostrar toast "Ferramenta 'X' criada e associada".
3. **Sem perder contexto** — o utilizador nunca sai do modal de tarefa; a ferramenta fica criada no sistema global e imediatamente seleccionada nesta tarefa.
4. **Feedback visual** — chip da nova ferramenta aparece em destaque (badge "nova" âmbar) durante alguns segundos.

### Respeitar o que já existe

- O endpoint `POST /api/ferramentas` já existe em `src/app/api/ferramentas/route.ts`.
- O tipo `Ferramenta` já está definido em `src/lib/types.ts`.
- A função `handleCreateFerramenta` já está em `page.tsx:286-293`.
- Basta extrair para um `FerramentaCombobox` reutilizável e chamá-lo dentro do `TarefaFormDialog`.

---

## 7. Resposta directa às perguntas do utilizador

| Pergunta | Resposta curta |
|---|---|
| O dashboard faz sentido? | **Sim**, melhorou muito. Ainda precisa: KPIs navegáveis, áreas zeradas diferenciadas, preencher coluna direita abaixo da dobra. |
| Autocomplete de membros? | **Sim, é a melhoria de maior impacto pendente.** Implementar com `cmdk` + endpoint `GET /api/membros?q=` + CTA primário "Associar" vs secundário "Criar novo". |
| Bom para pessoas sem contacto? | **Razoavelmente**, mas falta onboarding, definições nos termos (Processo/Actividade/Tarefa), legendas nos ícones e reformular jargão ("instruções nas ferramentas"). |
| Organograma bonito? | **Sim, evoluiu bem.** Conectores soltos resolvidos. Ainda falta: conector descendente por coluna, explicar o destaque âmbar do Presidente, omitir zeros. |
| Lista de membros grande demais? | **Sim para o padrão actual (cards).** Solução: filtros (área, função), ordenação, modo lista compacta, esconder zeros. |
| Lista de ferramentas grande demais? | **Sim.** Solução: busca, agrupar por categoria, ícones de marca, metadado "usada em N tarefas". |
| Adicionar ferramentas dentro das tarefas? | **Já é possível, mas o fluxo é frágil.** Recomendar o mesmo padrão combobox + criação inline sem sair do modal. |

---

## 8. Próximos passos priorizados

| # | Item | Esforço | Impacto | Responde a |
|---|---|---|---|---|
| 1 | **Combobox de membros** em `MembroFormDialog` com endpoint `?q=` e fallback de criação | 4 h | 🔴 Alto | Pergunta 2 |
| 2 | **Combobox de ferramentas** em `TarefaFormDialog` com criação inline | 3 h | 🔴 Alto | Pergunta 6 |
| 3 | **Filtros por área + função** na lista de Membros | 3 h | 🔴 Alto | Pergunta 5 |
| 4 | **Busca + agrupamento por categoria** na lista de Ferramentas | 2 h | 🟡 Médio | Pergunta 5 |
| 5 | **Resolver `bg-white/25`** restante (5 nós) — substituir por `bg-white/30` ou `bg-primary-foreground/30` | 15 min | 🔴 Alto (a11y) | Scan axe |
| 6 | **`aria-label` nos 24 checkboxes** de `DadosView` (áreas) | 30 min | 🔴 Alto (critical) | Scan axe |
| 7 | **Onboarding wizard** quando `dashboard.counts.areas === 0` | 4 h | 🟡 Médio | Pergunta 3 |
| 8 | **Modo lista compacta** (toggle) para Membros e Ferramentas | 4 h | 🟡 Médio | Pergunta 5 |
| 9 | **Conector descendente** por coluna no organograma | 1 h | 🟢 Baixo | Pergunta 4 |
| 10 | **Legendas/tooltips** em ícones de metadados + `title` em todos os `<span>` de contadores | 1 h | 🟢 Baixo | Pergunta 3 |

**Total:** ~22h30 para cobrir todos os 10 itens.

---

## 9. Como apresentar o feedback após a próxima iteração

Para validar os ganhos de forma objectiva, depois de implementar os itens 1-6 (impacto alto):

1. **Capturas antes/depois** do modal de adicionar membro dentro de uma área, mostrando o combobox a filtrar 51 membros e a evitar duplicação.
2. **Capturas antes/depois** do modal de criar tarefa, mostrando a busca de ferramentas e a criação inline de "Outlook" sem sair do modal.
3. **GIF curto** (10s) do fluxo completo: criar área → adicionar membro existente via autocomplete → criar processo → adicionar ferramenta inline na tarefa.
4. **Relatório `axe-core`** — deve passar de 5 violações `serious` + 1 `critical` para 0 em todas as telas.
5. **Checklist de regressão** — confirmar que criação/edição/eliminação continua a funcionar para todas as entidades e que o `TreeSidebar` continua a expandir/colapsar correctamente.

---

## Anexo A — Capturas analisadas (v9)

| Tela | Ficheiro | Nota VLM |
|---|---|---|
| Dashboard desktop | `01-dashboard.png` | 7,5/10 — KPIs melhorados, contraste OK, mas coluna direita desequilibrada |
| Loading skeleton (SSR) | `02-loading-skeleton.png` | Skeleton visível em SSR (resolve item 4.8) |
| Organograma | `03-organograma.png` | 8/10 estética — conectores resolvidos, mas ainda faltam conectores descendentes |
| Empty state com "Limpar pesquisa" | `04-empty-state.png` | Boa melhoria — eco do termo + CTA limpar |
| Área com TreeSidebar | `05-area-with-tree.png` | Tree útil, mas subaproveitada (sem expansão até tarefas na captura) |
| Processo + Tree | `06-processo-with-tree.png` | Tree expande correctamente, navegação lateral fluida |
| Actividade + Tree | `07-actividade-with-tree.png` | Estado seleccionado exemplar |
| Tarefa + Tree | `08-tarefa-with-tree.png` | 7,8/10 — layout em 2 colunas, árvore com seleção forte, mas truncamentos |
| Membros | `09-membros.png` | 51 cards — precisa de filtros |
| Ferramentas | `10-ferramentas.png` | 24 cards com ícone idêntico — precisa de busca e ícones de marca |
| Dados | `11-dados.png` | 24 checkboxes sem `aria-label` (critical) |
| Modal Nova Área | `12-modal-area.png` | Sem validação inline, sem autocomplete |
| Dashboard mobile | `13-dashboard-mobile.png` | 6/10 — KPIs altos demais para mobile, sem CTA primário |
| Sidebar mobile | `14-mobile-sidebar.png` | Funcional, mas sem avatar/logotipo |
| Organograma mobile | `15-organograma-mobile.png` | Quebra para 1 coluna — ok, mas sem TOC |
| Área mobile | `16-area-detail-mobile.png` | TreeSidebar escondida em mobile — sem alternativa (drawer?) |

---

## Anexo B — Itens resolvidos vs pendentes (vs v8)

### Resolvidos na v9
- ✅ **4.1** Color-contrast (parcial — 12 de 17 nós corrigidos)
- ✅ **4.2** Skeletons em todas as views
- ✅ **4.3** Affordances (cursor-pointer + focus-visible + hover reforçado)
- ✅ **4.7** Hover states reforçados (`hover:-translate-y-0.5 hover:shadow-lg`)
- ✅ **4.8** Distinção loading vs erro em SSR
- ✅ **4.11** Padronização do menu de acções (DropdownMenu único)
- ✅ **4.12** Avatar com fallback para nomes curtos
- ✅ **4.13** Tabs sem `max-w-md`
- ✅ **4.14** Títulos maiores (`text-3xl sm:text-4xl`)

### Parcialmente resolvidos
- 🟡 **4.1** Restam 5 nós com `bg-white/25` (organograma + membros + ferramentas)
- 🟡 **4.5** Rodapé da sidebar melhorado mas ainda pode truncar

### Não resolvidos (pendentes)
- ⏳ **4.4** Focus trap em modais (ainda não validado)
- ⏳ **4.6** Lista de Áreas sem paginação nem scroll virtual
- ⏳ **4.9** `text-[10px]` e `text-[11px]` extensos ainda presentes em badges
- ⏳ **4.10** Conectores do organograma não descem até às áreas

### Novos problemas introduzidos na v9
- 🆕 **Dados**: 24 checkboxes sem `aria-label` (violacão `critical` `button-name`)
- 🆕 **TreeSidebar**: truncamentos sem tooltip (problema visual, não a11y)

---

**Fim da avaliação v9.**

Estou pronto para receber a próxima versão (v10) com os itens priorizados implementados. Recomendo focar nos itens 1-6 da tabela da secção 8 (impacto alto, ~13h de trabalho) antes de avançar para os restantes.
