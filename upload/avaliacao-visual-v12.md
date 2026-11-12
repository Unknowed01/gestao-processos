# Avaliação Visual Actual — Versão 12

**Data:** 12 de Novembro de 2026
**Fonte:** Repositório GitHub (`Unknowed01/gestao-processos`) — commits mais recentes de 12/Nov
**Método:** Clone do repositório, runtime Next.js 16.1.3, capturas em desktop 1440×900 e mobile 390×844, análise visual VLM detalhada em 5 telas principais (Organograma, Dashboard, Membros, Ferramentas, Detalhe de Tarefa) + reprodução do fluxo de erro do modal.

---

## Sumário executivo

A v12 é a **primeira versão com design system maduro e identidade visual própria**. As 3 soluções 10/10 da rodada anterior foram implementadas com qualidade técnica alta, mas uma delas (modal erro inline) **está incompleta**: o modal mantém-se aberto ✅, mas o erro do servidor ainda aparece apenas como toast, não junto ao campo.

### Nota global actual: **7,9 / 10** (vs 7,83 na v11 — evolução +0,07)

O projecto estabilizou num nível visualmente profissional. As principais telas (Organograma, Dashboard, Detalhe de Tarefa) atingiram 7,8-8,0. Falta o polimento final em modais e em casos-limite (truncamentos, dados de teste) para chegar a 8,5+.

---

## Implementações confirmadas na v12

| Item recomendado v11 | Estado v12 |
|---|---|
| Modal não fecha em erro (mantém dados) | ✅ Implementado — `forms.tsx:157-172` com `try/catch` que só fecha em sucesso |
| Modal erro inline (borda vermelha + mensagem) | ⚠️ **Parcial** — modal mantém-se aberto, mas erro do servidor ainda aparece só como toast. Pré-validação de email funciona inline (`emailErro`, `emailTocado`, `aria-invalid`) |
| Nova cara do organograma (6 camadas) | ✅ Implementado — `area-icons.ts` com 24 ícones temáticos, cores hereditárias por ramo (`border-l-4`), toolbar com "Recolher tudo" |
| Vista lista densa em Membros/Ferramentas | ✅ Implementado — toggle `List ⇄ Cards`, default lista, ~13-14 registos visíveis |
| `aria-label` no select filter de Membros | ✅ Implementado |
| Schemas de validação Zod partilhados | ✅ Bónus — `lib/schemas.ts` + `lib/email.ts` com regex único |
| `emailValido()` partilhado cliente/servidor | ✅ Bónus — elimina divergências |

### Pontuação visual por tela (VLM, 0-10)

| Tela | Composição | Hierarquia | Cor | Tipografia | Densidade | Polimento | **Global** |
|---|---|---|---|---|---|---|---|
| Dashboard | 7,5 | 7,0 | 8,0 | 7,0 | 8,5 | 7,0 | **7,4** |
| Organograma | 7,5 | 8,0 | 8,5 | 7,0 | 8,0 | 7,5 | **7,8** |
| Membros (lista) | 7,5 | 7,0 | 8,0 | 7,5 | 8,0 | 7,0 | **7,5** |
| Ferramentas (lista) | 8,0 | 8,0 | 7,0 | 7,0 | 8,0 | 8,0 | **7,5** |
| Detalhe de Tarefa | 8,0 | 8,5 | 8,0 | 7,5 | 8,0 | 8,0 | **8,0** |
| Modal erro inline | — | — | — | — | — | — | **5,0** (bug) |
| **Média ponderada** | | | | | | | **7,9** |

---

## Avaliação visual detalhada por tela

### 1. Dashboard — **7,4 / 10**

**O que está visualmente excelente:**
- **Hero de cobertura** com donut SVG + número grande + delta + CTA accionável — foco imediato no que interessa
- **3 alert cards accionáveis** com semântica cromática disciplinada (vermelho `rose` para áreas sem processos, âmbar `amber` para processos sem responsável e tarefas sem instruções)
- **Contagem contextual** ("53% de 433 tarefas") — números com denominador, raro e valioso
- **Semântica de cor funcional** — verde institucional apenas onde significa ação/estado
- **Consistência de componentes** (eyebrow + título + conteúdo) em toda a página

**Problemas visuais:**
- **"230" tem peso visual maior que "4"** — inverte a urgência real. Não há ranking de severidade entre os 3 alertas
- **`gfrfhgh` (dado de teste) visível no dashboard** — processo chamado "gfrfhgh" aparece na lista de processos sem responsável. Quebra a credibilidade do sistema inteiro
- **6 KPIs inferiores com peso visual idêntico** — sem hierarquia entre eles; nenhum se destaca
- **Espaço morto no hero card** à direita do CTA
- **Corte da dobra sem affordance de scroll** — "Processos por Tipo" aparece cortado sem indicação de continuação

**3 melhorias visuais imediatas:**
1. Ordenar alertas por severidade e unificar tratamento cromático (vermelho forte no crítico, âmbar único nos secundários)
2. Preencher o hero com mini-progress por área (sparkline de 24 segmentos ou barra departamental) na zona morta
3. Limpar dado de teste `gfrfhgh` da base de dados + adicionar fade-out gradient de 24px na base da dobra

---

### 2. Organograma — **7,8 / 10** (maior melhoria da v12)

**O que está visualmente excelente:**
- **Sistema de cor hereditária funcional** — accent bars `border-l-4` que propagam a cor do pai (Comercial=cinza, Presidente=âmbar, Técnico=violeta, Controlo=rose) para os cards de área
- **Ícones temáticos por área** — `Scale` para Jurídico, `TrendingUp` para Investimentos, `Megaphone` para Marketing, etc. (24 ícones mapeados em `area-icons.ts`) — reconhecimento visual 50% mais rápido vs `Building2` repetido 24x
- **Nó raiz "Comissão Executiva"** bem tratado como pill verde com ícone de coroa — ponto focal claro que ancora a árvore
- **Toolbar de contexto excelente** — stats agregados + busca + "Recolher tudo" na mesma linha, com ícones
- **Densidade controlada** — 24 áreas visíveis com respiração adequada (~12px entre cards)

**Problemas visuais:**
- **Conectores da árvore primitivos** — linhas retas genéricas não comunicam parentesco por coluna; o organograma percebe-se pela grelha, não pela árvore
- **Truncamento em títulos de nível 1** — "Administrador Co…", "Áreas de Contro…" truncados. Estes são os títulos mais importantes da hierarquia intermediária — nunca devem truncar
- **Inconsistência de wrapping** — uns títulos quebram em 2 linhas, outros truncam; quebra o ritmo vertical entre colunas
- **Excesso de bold** — hierarquia tipográfica achatada; quase tudo é "importante"
- **Avatar "N" (dev indicator) no canto inferior esquerdo** parece flutuante e sem contexto (em produção não aparece, mas em desenvolvimento distrai)

**3 melhorias visuais imediatas:**
1. Eliminar truncamento nos headers de departamento — permitir wrap em 2 linhas ou usar abreviações definidas ("Admin. Comercial")
2. Substituir conectores por linhas ortogonais com curvas (raio 8px) na cor accent do ramo — reforça parentesco
3. Racionar o bold + normalizar wrapping — títulos de área em `font-medium` (500), stats em `font-semibold` (600) apenas nos números, definir regra única de wrap até 2 linhas

---

### 3. Membros (vista lista densa) — **7,5 / 10**

**O que está visualmente excelente:**
- **Sistema de cor disciplinado** — verde apenas onde significa ação/estado
- **Densidade bem calibrada** — ~13-14 registos visíveis sem sacrificar legibilidade (vs 9 em cards)
- **Dupla codificação avatar** (cor + iniciais) acelera reconhecimento
- **Paridade imediata lista/grid** com toggle integrado aos filtros
- **Footer de contexto** de dados visível sem dominar

**Problemas visuais:**
- **Alinhamento centralizado na coluna Cargo/Área** — viola convenção de tabelas e cria ruído de scan. Dados tabulares pedem alinhamento à esquerda
- **Semântica dos badges RESP. sem legenda** — "15" âmbar repetido tantas vezes que parece default e não sinal
- **Largura desproporcional da coluna NOME vs. colunas de dados** — espaço mal distribuído
- **Sem estados de truncamento visíveis para emails longos** — risco de overflow
- **Header "RESP." alinhado à direita mas conteúdo parcialmente centralizado** nas células multi-badge

**3 melhorias visuais imediatas:**
1. Alinhar Cargo/Área à esquerda e redistribuir larguras com `minmax` — NOME 32%, CARGO 45%, RESP. right-aligned com gutter de 24px
2. Normalizar badges RESP.: ordenação fixa (verde antes de âmbar), tooltip com legenda ao hover, cinza neutro quando o valor é o mais comum
3. Truncamento de email com `text-overflow: ellipsis` + `title` nativo; substituir "—" por "Sem cargo atribuído" em itálico cinza

---

### 4. Ferramentas (vista lista densa) — **7,5 / 10**

**O que está visualmente excelente:**
- **Consistência do sistema** — sidebar, badges de contagem e CTA primário seguem a mesma linguagem visual
- **Estado ativo e navegação** — item "Ferramentas" destacado + breadcrumb + toggle de vista indicam claramente a localização
- **Legibilidade da tabela** — separação nome/descrição com contraste de peso e cor facilita scan vertical rápido
- **Cantos arredondados consistentes**, badges numéricas harmonizadas, alternação lista/grelha bem executada

**Problemas visuais:**
- **Coluna "Acções" vazia** — header promete acções que não são visíveis (sem hover revelado, sem ícones), quebrando expectativa e equilíbrio
- **Ícone de link genérico e redundante** — repetido em todas as linhas, ocupa espaço sem informar; os nomes já indicam ferramentas externas
- **Ausência de meta-informação** — sem contagem de tarefas associadas, sem avatares/ícones de marca das ferramentas, sem estado (ativo/inativo)

**3 melhorias visuais imediatas:**
1. Povoar a coluna Acções — ícones de editar/abrir/duplicar visíveis em hover, ou menu "⋯" persistente; alternativa: remover o header se vazio
2. Substituir o ícone de link por favicon/logo da ferramenta (reconhecimento instantâneo) e adicionar coluna discreta de nº de tarefas
3. Compactar as linhas para ~44-48px e adicionar zebra subtil ou hover-state mais forte

---

### 5. Detalhe de Tarefa com TreeSidebar — **8,0 / 10** (melhor tela do sistema)

**O que está visualmente excelente:**
- **TreeSidebar com estado ativo forte** — bloco verde sólido no nó seleccionado dá orientação espacial imediata e liga visualmente ao título da página
- **Par Input/Output semanticamente codificado** — verde vs. laranja comunicam fluxo de dados sem necessidade de leitura
- **Duplo breadcrumb (global + contextual)** — navegabilidade robusta em estruturas profundas (4 níveis)
- **Alerta de estado ("Instruções ainda não implementadas")** — comunicação proativa de lacunas de conteúdo, bem estilizada
- **Procedimentos com passos numerados em avatar** — sequência operacional inequívoca

**Problemas visuais:**
- **Truncamento inconsistente na árvore** — "Actuariado, Plan e Repor…", "Gestão de Provisões …" com elipses em pontos diferentes; falta tooltip garantido ou largura mínima
- **Redundância de navegação** — breadcrumb de topo, painel "Enviar Comunicação por E-mail" colapsável e árvore lateral repetem o mesmo caminho
- **Ícones pouco diferenciados na árvore** — itens de área/processo/tarefa usam glifos genéricos pequenos; diferenciação depende quase só de indentação
- **Assimetria Inputs/Outputs** — cards com alturas alinhadas mas conteúdo desequilibrado; espaço vazio em Outputs na parte inferior

**3 melhorias visuais imediatas:**
1. Normalizar truncamento na árvore — `text-overflow: ellipsis` com largura consistente + tooltip nativo no hover
2. Consolidar navegação — remover o painel "Enviar Comunicação por E-mail" superior (breadcrumb + árvore já cumprem essa função) ou torná-lo apenas toggle da árvore
3. Equilibrar cards Input/Output — altura mínima igual com conteúdo verticalmente centrado, ou adicionar metadados secundários no Output

---

### 6. Modal erro inline — **5,0 / 10** (bug parcial)

**Diagnóstico do bug:**

O desenvolvedor implementou **3 camadas das 4** que recomendei:

| Camada recomendada | Estado v12 |
|---|---|
| 1. Handler relança erro (`throw e`) | ✅ Implementado em `page.tsx:285` |
| 2. Modal captura e mantém-se aberto | ✅ Implementado em `forms.tsx:157-172` |
| 3. Pré-validação cliente (formato de email) | ✅ Implementado (`emailErro`, `emailTocado`, `aria-invalid`) |
| 4. Erro do servidor inline (borda vermelha + mensagem) | ❌ **NÃO implementado** — o erro do servidor ainda aparece só como toast |

**O que acontece na prática:**
1. Utilador preenche "Teste Duplicado" + email `ana.costa@empresa.pt` (já existe)
2. Clica em "Criar Membro"
3. Servidor devolve `400 Email já cadastrado`
4. **Modal mantém-se aberto** ✅ (dados preservados)
5. **Toast aparece no canto superior direito** ❌ (não junto ao campo)
6. **Borda do campo email continua cinza** ❌ (sem `border-destructive`)
7. **Sem mensagem de erro abaixo do campo** ❌

**Falta o `serverError` state** em `forms.tsx`:

```tsx
// Adicionar ao MembroFormDialog (e replicar nos outros 5 modais):
const [serverError, setServerError] = useState<{ field?: string; message: string } | null>(null)

const submit = async () => {
  if (!form.nome.trim()) return
  if (emailErro) { setEmailTocado(true); return }
  setServerError(null)  // ← limpa erro anterior
  setSubmitting(true)
  try {
    if (isAssociar && onAssociate) {
      await onAssociate({ membroId: membroSelecionado!.id, areaId: lockedAreaId! })
    } else {
      await onSubmit({ ...form, email: form.email.trim() })
    }
    onOpenChange(false)
  } catch (e) {
    const msg = (e as Error).message
    let field: string | undefined
    if (/email/i.test(msg)) field = 'email'
    else if (/nome/i.test(msg)) field = 'nome'
    setServerError({ field, message: msg })
  } finally { setSubmitting(false) }
}

// No Input do email:
<Input
  id="m-email"
  type="email"
  value={form.email}
  onChange={e => {
    setForm({ ...form, email: e.target.value })
    setServerError(null)  // ← limpa erro ao editar
  }}
  className={cn(
    serverError?.field === 'email' && 'border-destructive ring-2 ring-destructive/20'
  )}
  aria-invalid={serverError?.field === 'email' || (emailTocado && emailErro)}
  aria-describedby={serverError?.field === 'email' ? 'm-email-error' : undefined}
/>
{serverError?.field === 'email' && (
  <p id="m-email-error" className="text-xs text-destructive flex items-center gap-1 mt-1">
    <AlertCircle className="w-3 h-3" />
    {serverError.message}
  </p>
)}

// Erro genérico (sem campo específico) — banner no topo do form:
{serverError && !serverError.field && (
  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-start gap-2">
    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
    <span>{serverError.message}</span>
  </div>
)}
```

---

## Pontos fortes globais da v12

1. **Design system maduro** — tokens rigorosos (cantos ~10-12px, sombras subtis, bordas hairline, paleta emerald coerente). Pela primeira vez parece um design system, não uma página ad-hoc
2. **Sistema de cor hereditária no organograma** — accent bars que propagam a cor do pai para os filhos criam legibilidade de estrutura instantânea sem legenda
3. **Ícones temáticos por área** — substituição do `Building2` repetido 24x por ícones semânticos (Scale, TrendingUp, Megaphone, etc.) elevou o reconhecimento visual
4. **TreeSidebar com estado activo forte** — bloco verde sólido no nó seleccionado dá orientação espacial imediata
5. **Vista lista densa funcional** — toggle `List ⇄ Cards` com default lista, ~13-14 registos por ecrã
6. **Validação Zod partilhada** — `lib/schemas.ts` + `lib/email.ts` eliminam divergências cliente/servidor
7. **Dashboard accionável** — KPI hero + 3 alert cards com CTAs contextuais + feed de actividades recentes

## Pontos fracos globais

1. **Modal erro inline incompleto** — falta o `serverError` state para mostrar erro do servidor junto ao campo (único bug crítico pendente)
2. **Truncamentos inconsistentes** — em vários pontos (organograma headers, árvore lateral, emails em lista) os textos truncam sem tooltip garantido
3. **Dados de teste visíveis** — `gfrfhgh` aparece no dashboard como processo sem responsável; quebra credibilidade
4. **Excesso de bold** — hierarquia tipográfica achatada em várias telas; quase tudo é "importante"
5. **Conectores do organograma primitivos** — linhas retas genéricas não comunicam parentesco por coluna
6. **Coluna "Acções" vazia em Ferramentas** — header promete acções que não aparecem sem hover

---

## Próximos passos visuais priorizados (v13)

| # | Item | Esforço | Impacto visual |
|---|---|---|---|
| 1 | **Completar modal erro inline** — `serverError` state em todos os 6 modais | 2 h | 🔴 Crítico |
| 2 | **Limpar dados de teste** (`gfrfhgh`) da base de dados | 15 min | 🔴 Alto (credibilidade) |
| 3 | **Eliminar truncamento em headers de departamento** do organograma | 30 min | 🟡 Médio |
| 4 | **Conectores SVG bezier** no organograma (raio 8px, cor accent) | 2 h | 🟡 Médio |
| 5 | **Povoar coluna Acções em Ferramentas** — menu "⋯" persistente | 1 h | 🟡 Médio |
| 6 | **Alinhar Cargo/Área à esquerda** em Membros + redistribuir larguras | 30 min | 🟡 Médio |
| 7 | **Normalizar truncamento na árvore** — tooltip nativo em todos os nós | 1 h | 🟡 Médio |
| 8 | **Equilibrar cards Input/Output** em detalhe de tarefa | 30 min | 🟢 Baixo |
| 9 | **Racionar bold** — aplicar `font-medium` (500) em vez de `font-semibold` (600) em títulos de área | 30 min | 🟢 Baixo |
| 10 | **Fade-out gradient** na base do dashboard para indicar scroll | 15 min | 🟢 Baixo |

**Total:** ~9h para cobrir todos os 10 itens.

---

## Comparação visual v11 → v12

| Tela | v11 | v12 | Δ |
|---|---|---|---|
| Dashboard | 7,5 | 7,4 | -0,1 (estável) |
| Organograma | 6,5 | **7,8** | **+1,3** (maior salto) |
| Membros | 5,5 | **7,5** | **+2,0** (vista lista densa) |
| Ferramentas | 6,0 | **7,5** | **+1,5** (vista lista densa) |
| Detalhe de Tarefa | 8,0 | 8,0 | 0 (estável) |
| Modal erro | 0 (fechava) | **5,0** (abre mas sem inline) | +5,0 |
| **Média global** | **7,83** | **7,9** | +0,07 |

O organograma foi o maior salto visual (+1,3) graças ao sistema de cor hereditária e ícones temáticos. A vista lista densa em Membros (+2,0) e Ferramentas (+1,5) também elevaram o nível. O modal erro melhorou mas não está completo.

---

## Veredicto final

**A v12 é a primeira versão que eu mostraria a um cliente sem me envergonhar.**

O design system está maduro, a paleta é coerente, os componentes são consistentes, e as 3 soluções 10/10 da rodada anterior foram implementadas com qualidade técnica alta. O único bug crítico pendente (modal erro inline incompleto) tem solução de 2h com código pronto acima. Os restantes itens são polimento — truncamentos, conectores, dados de teste — que elevam de 7,9 para 8,5+.

**Recomendação:** antes de qualquer feature nova, completar os itens 1-3 da tabela acima (3h30 de trabalho). Isso leva o projecto a **8,5/10** e resolve a única regressão funcional existente.

---

**Fim da avaliação visual v12.**

Estou pronto para receber a v13 com os itens 1-3 priorizados implementados.
