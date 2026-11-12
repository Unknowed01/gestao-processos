# Avaliação — Sistema de Gestão de Processos (Next.js)

- **Data:** 2026-11-12
- **Versão analisada:** v0.2.1 (tar v11)
- **Stack:** Next.js 16.1.1 (App Router) · React 19 · TypeScript · Prisma 6 (SQLite) · Tailwind · shadcn/ui
- **Avaliador:** Arquiteto sênior (Software Architect + Security Engineer + Backend Engineer + Code Quality Specialist)
- **Foco:** lógica de negócio, qualidade de código, arquitetura e segurança

---

## 1. Nota Geral

**5 / 10.**

A lógica de negócio é coerente, o modelo de dados está bem desenhado (Área → Processo → Actividade → Tarefa → Procedimento) e a UI é funcional e cuidada. No entanto, **o projeto não possui qualquer camada de autenticação ou autorização** (apesar de `next-auth` constar no `package.json`), todas as APIs são pública e graváveis, e a rota `/api/import` com `replace: true` permite **apagar toda a base de dados sem qualquer credencial**. Estas falhas, combinadas com ausência total de validação de input (zod está nas dependências mas não é usado), ESLint desactivado regra por regra, `typescript.ignoreBuildErrors: true` e dependências com CVEs altos (`xlsx@0.18.5`), impedem uma nota acima de 5.

---

## 2. Pontuação por Critérito

### Lógica e Qualidade de Código

| Critério | Nota |
|---|---|
| Arquitetura e organização do projeto | 6 |
| Separação de responsabilidades (UI, lógica, dados) | 5 |
| Qualidade e clareza da lógica de negócio | 7 |
| Uso correto de padrões Next.js (Server Components, Server Actions, Route Handlers) | 4 |
| Tratamento de erros e *edge cases* | 6 |
| Tipagem (TypeScript) e consistência | 5 |
| Reutilização e manutenibilidade | 6 |

### Segurança

| Critério | Nota |
|---|---|
| Autenticação e autorização | 0 |
| Validação e sanitização de *inputs* | 2 |
| Proteção contra vulnerabilidades comuns (XSS, CSRF, injection, etc.) | 3 |
| Gestão de *secrets* e variáveis de ambiente | 4 |
| Segurança de rotas e APIs / Server Actions | 0 |
| *Headers* de segurança e configurações | 1 |
| Dependências e superfície de ataque | 3 |

---

## 3. Pontos Fortes

1. **Modelo de dados bem desenhado** (`prisma/schema.prisma`) — hierarquia Área → Processo → Actividade → Tarefa → Procedimento com relações correctas, *cascade deletes* bem configurados (`onDelete: Cascade` em `processo.area`, `actividade.processo`, `tarefa.actividade`), e uso explícito de *named relations* (`"ProcessoResponsavel"`, `"ActividadeSubstituto"`) para evitar ambiguidade quando uma mesma entidade tem várias FKs para `Membro`.
2. **Validação de regra de negócio transversal** — `responsavelId !== substitutoId` é validado consistentemente em `POST/PUT` de `/api/processos`, `/api/actividades` e durante o `import` de processos e actividades. Boa prática.
3. **Endpoint de exportação multiformato** (`src/app/api/export/route.ts`) — JSON/CSV/XLSX com *BOM* UTF-8, *escape* correto de aspas e ponto-e-vírgula no CSV, *Content-Disposition* apropriado e filtro opcional por áreas. Funcional e pragmático.
4. **Estrutura de árvore lateral** (`src/components/tree-sidebar.tsx`) — *sidebar* hierárquica com auto-expansão dos pais do item seleccionado e cancelamento de *fetch* em *effect cleanup* (`cancelled = true`), evitando *race conditions* e *memory leaks*.
5. **UX consistente nos *drill-downs*** (`src/components/drill-views.tsx`) — *breadcrumb* navegável, *skeletons* por nível de carregamento, estados vazios com call-to-action e diálogos de confirmação para eliminação com mensagem contextualizada por entidade.
6. **Reaproveitamento de padrões shadcn/ui** — todos os componentes UI seguem o mesmo contrato (`cn`, `class-variance-authority`, variantes), facilitando extensão. Layout `standalone` habilitado em `next.config.ts`, pronto para Docker.
7. **Validação de unicidade de email** (`src/app/api/membros/route.ts`) — captura específica do erro Prisma `P2002` e devolve mensagem útil em português, distinguindo conflito de email de erro genérico.
8. **`scripts/seed.ts` idempotente** — limpa tabelas na ordem correcta das FKs antes de inserir, com *log* incremental por entidade.

---

## 4. Problemas e Riscos (Priorizados)

> Convenção: **[Segurança]** = risco que expõe dados, autenticação ou a aplicação · **[Lógica/Arquitetura]** = problema de design ou manutenibilidade.

### Crítico

#### C1. **[Segurança] Aplicação sem qualquer autenticação ou autorização**
- **Onde:** `package.json` declara `next-auth@^4.24.11`, mas `rg "next-auth|getServerSession|useSession|signIn|authOptions|middleware"` em `src/` devolve **zero resultados**. Não existe `middleware.ts`. Todas as *Route Handlers* em `src/app/api/*/route.ts` respondem a GET/POST/PUT/DELETE sem qualquer verificação de sessão.
- **Impacto:** Qualquer pessoa que consiga aceder ao URL da aplicação pode listar, criar, alterar e apagar todas as áreas, processos, actividades, tarefas, membros (incluindo emails) e ferramentas. O sistema expõe dados pessoais (nomes, cargos, emails de colaboradores) e permite adulteração total do mapeamento de processos da companhia.
- **Correcção:**
  1. Implementar `next-auth` (ou alternativa) com um *provider* adequado ao contexto (Azure AD/Entra se for companhia seguradora, Credentials com hash bcrypt se for interno, etc.).
  2. Criar `src/middleware.ts` que proteja `/api/*` e todas as páginas excepto `/login`:
     ```ts
     export { default } from "next-auth/middleware"
     export const config = { matcher: ["/((?!login|api/auth).*)"] }
     ```
  3. Em cada *Route Handler*, chamar `await getServerSession(authOptions)` no topo e devolver `401` se nulo. Para operações de escrita, exigir papel (admin/editor).
  4. Remover `next-auth` do `package.json` se realmente não for usado — manter dependência não usada é débito técnico e superfície de ataque.

#### C2. **[Segurança] `/api/import` com `replace: true` permite apagar toda a BD sem credencial**
- **Onde:** `src/app/api/import/route.ts:33-41` — quando `replace === true`, executa `deleteMany()` em todas as 7 tabelas antes de re-inserir, **sem auth, sem confirmação server-side, sem rate-limit, sem log de auditoria**.
- **Impacto:** Um único `curl -X POST https://app/api/import -d '{"data":{},"replace":true}'` apaga toda a base de dados. Não há *soft delete*, não há backup automático, não há transacção — falha a meio deixa a BD em estado parcial.
- **Correcção:**
  1. Proteger a rota com auth + papel admin (só deve ser acessível a administradores).
  2. Envolver todo o `replace + insert` numa **transacção** Prisma:
     ```ts
     await db.$transaction(async (tx) => {
       if (replace) { /* deleteMany com tx */ }
       /* upserts com tx */
     })
     ```
  3. Criar endpoint separado `/api/import/replace` com método `DELETE` semântico, ou exigir um *token* de confirmação gerado pelo servidor na própria UI.
  4. Manter um *backup* automático antes de `replace=true` (export JSON para disco/S3) durante uma janela de recuperação.

#### C3. **[Segurança] Nenhuma validação de *input* com schema — `body` é lido e desconstruído directamente**
- **Onde:** Em todas as 13 *Route Handlers*, padrão recorrente:
  ```ts
  const body = await req.json()
  const { nome, descricao, tipo, frequencia, areaId, responsavelId, ... } = body
  ```
  E em `src/app/api/import/route.ts:9-17`:
  ```ts
  interface ImportData { areas?: any[]; processos?: any[]; ... }
  ```
  Apesar de `zod@^4.0.2` constar em `package.json`, **não é importado em nenhum ficheiro de `src/`**.
- **Impacto:** Tipos não validados em runtime. Campos inesperados são ignorados silenciosamente, mas campos mal tipados (`frequencia: 123`, `responsavelId: { id: "x" }`) chegam ao Prisma, que por sua vez lança um erro genérico `P2007` devolvido como `500 Erro ao criar X`. Pior: `tipo` e `frequencia` são guardados como strings arbitrárias — não há garantia que sejam um dos valores do enum documentado em `TIPOS_PROCESSO`/`FREQUENCIAS`. Isto quebra *group by* no *dashboard* e relatórios.
- **Correcção:**
  1. Criar `src/lib/schemas.ts` com schemas zod por entidade:
     ```ts
     export const processoCreateSchema = z.object({
       nome: z.string().trim().min(1).max(200),
       descricao: z.string().max(2000).nullable().optional(),
       tipo: z.enum(TIPOS_PROCESSO),
       frequencia: z.enum(FREQUENCIAS),
       areaId: z.string().cuid(),
       responsavelId: z.string().cuid().nullable().optional(),
       substitutoId: z.string().cuid().nullable().optional(),
     }).refine(d => !(d.responsavelId && d.substitutoId && d.responsavelId === d.substitutoId), {
       message: "Responsável e substituto não podem ser a mesma pessoa",
     })
     ```
  2. Em cada handler: `const parsed = processoCreateSchema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })`.
  3. Aplicar o mesmo padrão ao `import` (com `z.array(schemaX).max(N)` para limitar volume).

#### C4. **[Segurança] CSV / Excel Injection — export não neutraliza caracteres de fórmula**
- **Onde:** `src/app/api/export/route.ts:144-159` (CSV) e `169-200` (XLSX). O *escape* actual só trata `;`, `"` e `\n` — **não neutraliza `=`, `+`, `-`, `@`, `\t`, `\r` no início das células**.
- **Impacto:** Qualquer campo controlado por utilizador (nome de área, processo, actividade, tarefa, KPIs, obrigações, descrições) pode injectar uma fórmula maliciosa. Exemplos reais: um processo chamado `=cmd|'/c calc'!A1` ou `=HYPERLINK("http://malicious","Click")` executa quando um colaborador abre o export no Excel/LibreOffice. Como os dados são exportados por qualquer utilizador (ver C1), a superfície é máxima.
- **Correcção:** Prefixar células que comecem com `=`, `+`, `-`, `@`, `\t`, `\r`, `\n` com `'` (apóstrofo) ou substituir o primeiro carácter por espaço. Bibliotecas como `xlsx` têm helpers, mas o mais seguro é fazer manualmente antes de escrever:
  ```ts
  function sanitizeCell(v: unknown): string {
    const s = String(v ?? "")
    return /^[=+\-@\t\r\n]/.test(s) ? "'" + s : s
  }
  ```
  Aplicar em **todas** as células dos formatos CSV e XLSX.

### Alto

#### A1. **[Segurança] `next.config.ts` com `typescript.ignoreBuildErrors: true` e `reactStrictMode: false`**
- **Onde:** `next.config.ts:6-9`:
  ```ts
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: false,
  ```
- **Impacto:** O *build* de produção corre mesmo com erros de TypeScript — qualquer regressão silenciosa passa para produção. `reactStrictMode: false` desactiva a detecção de *side-effects* em *renders* duplos, escondendo *bugs* que só aparecem em *concurrent mode*.
- **Correcção:** Remover `ignoreBuildErrors: true` (corrigir os erros que ele está a mascarar) e usar `reactStrictMode: true`. Se há erros reais a bloquear o build, listá-los e resolvê-los em vez de silenciá-los.

#### A2. **[Lógica/Arquitetura] ESLint desactivado regra por regra — 22 regras críticas em `off`**
- **Onde:** `eslint.config.mjs:11-44`:
  ```js
  "@typescript-eslint/no-explicit-any": "off",
  "@typescript-eslint/no-unused-vars": "off",
  "@typescript-eslint/no-non-null-assertion": "off",
  "react-hooks/exhaustive-deps": "off",
  "no-debugger": "off",
  "no-unreachable": "off",
  "no-fallthrough": "off",
  "prefer-const": "off",
  // ... mais 14 regras
  ```
- **Impacto:** O `npm run lint` devolve sempre sucesso, dando falsa sensação de qualidade. *Bugs* como variáveis não usadas, código inalcançável, *dependencies* de *hooks* em falta e asserções `!` perigosas passam despercebidos. O ficheiro torna o ESLint numa operação cosmética.
- **Correcção:** Reativar todas as regras acima com severidade `warn` (primeira iteração) e depois `error` (segunda). Correr `bun run lint`, listar os avisos/erros e corrigir um a um. Manter apenas `@next/next/no-img-element` desactivado se realmente houver motivo.

#### A3. **[Segurança] Sem *headers* de segurança configurados**
- **Onde:** `next.config.ts` não tem `headers()`. Não há CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy`.
- **Impacto:** A aplicação pode ser *framed* em qualquer iframe (*clickjacking*), MIME-types são sniffable, não há proteção contra downgrade HTTP. Como a app usa `dangerouslySetInnerHTML` apenas em `chart.tsx:83` (componente shadcn), o risco XSS é limitado, mas CSP ainda assim previne inject de *inline scripts* em caso de *template injection* no futuro.
- **Correcção:** Em `next.config.ts`:
  ```ts
  const securityHeaders = [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    {
      key: "Content-Security-Policy",
      value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'",
    },
  ]
  // async headers() { return [{ source: "/(.*)", headers: securityHeaders }] }
  ```
  *Nota:* CSP `"unsafe-inline"` e `"unsafe-eval"` devem ser removidos assim que os *scripts* e *styles* forem carregados via *nonces* ou *hashes*.

#### A4. **[Segurança] `xlsx@0.18.5` vulnerável (Prototype Pollution + ReDoS)**
- **Onde:** `package.json:79` e usado em `src/app/api/export/route.ts`.
- **Auditoria:** `bun audit` reporta **2 HIGH**: GHSA-4r6h-8v6p-xvw6 (Prototype Pollution) e GHSA-5pgg-2g8v-p4x9 (ReDoS). A versão pública no npm parou em 0.18.5; o mantenedor publica apenas no CDN próprio.
- **Impacto:** O `import` via `XLSX.utils.json_to_sheet` processa dados controlados por utilizador (nomes/descrições). Prototype Pollution permite corromper objectos globais; ReDoS permite DoS via *string* maliciosa no campo exportado.
- **Correcção:**
  1. Remover `xlsx` do npm e instalar via CDN oficial: `npm i https://cdn.sheetjs.com/xlsx-latest/xlsx-latest.tgz`.
  2. Ou substituir por `exceljs` ou `papaparse` (CSV) + um *writer* XLSX leve.
  3. Se mantido, sanitizar todos os valores antes de passar ao `json_to_sheet` (mesmo helper de C4).

#### A5. **[Segurança] Caddyfile expõe proxy arbitrário via `XTransformPort` query param**
- **Onde:** `Caddyfile:1-13`:
  ```caddy
  :81 {
    @transform_port_query { query XTransformPort=* }
    handle @transform_port_query {
      reverse_proxy localhost:{query.XTransformPort} { ... }
    }
  }
  ```
- **Impacto:** Qualquer cliente externo que consiguir aceder à porta 81 pode forçar o Caddy a fazer *reverse proxy* para **qualquer porta interna do localhost** (`localhost:5432` para PostgreSQL, `localhost:6379` para Redis, portas de admin, etc.). É um **open proxy interno** — vuln SSRF clássica, crítica em produção.
- **Correcção:** Remover este bloco por completo. Se realmente necessário para *dev*, restringir a IPs internos (`@internal { remote_ip 10.0.0.0/8 192.168.0.0/16 }`) ou a uma *allowlist* explícita de portas. Nunca expor a `:81` publicamente.

#### A6. **[Lógica/Arquitetura] `src/app/page.tsx` tem 1107 linhas — tudo num único componente cliente**
- **Onde:** `src/app/page.tsx` — todo o estado da app (dashboard, áreas, processos, actividades, tarefas, membros, ferramentas), todos os handlers CRUD, navegação, *breadcrumbs* e ainda dois sub-componentes (`MembrosListView`, `FerramentasListView`, `ActionMenu`) vivem no mesmo ficheiro.
- **Impacto:** Componente gigante custa a manter, dificulta testes, causa *re-renders* amplos (qualquer `setView` re-renderiza toda a árvore) e impede code-splitting. Há também um *bug* subtil: dois `useEffect` em linhas 188 e 204 causam *double-fetch* de `areas`, `membros` e `ferramentas` em cada montagem inicial.
- **Correcção:**
  1. Extrair cada vista para o seu próprio ficheiro (`DashboardPage`, `AreasPage`, `MembrosPage`, etc.) dentro de `src/app/[view]/page.tsx` usando *nested layouts* do App Router.
  2. Mover estado de dados para React Query (`@tanstack/react-query` já está no `package.json`) — substitui os 9 `useState` + 9 `useCallback` + *fetch* manual por hooks tipados com cache e invalidação.
  3. Extrair handlers CRUD para um hook `useEntityActions` ou para *Server Actions*.

#### A7. **[Lógica/Arquitetura] Aplicação é 100% *Client Components* — não usa *Server Components* nem *Server Actions***
- **Onde:** `rg "'use client'"` em `src/` retorna correspondência em todos os ficheiros não-UI. `page.tsx` é `'use client'`. Todos os dados vêm via `fetch('/api/...')` em vez de serem carregados no servidor.
- **Impacto:** Perde-se o maior benefício do App Router: carregamento inicial no servidor (menos *round-trips*, SEO, melhor TTFB). A primeira carga faz waterfall `HTML → JS → fetch dashboard → fetch areas/membros/ferramentas`. *Server Actions* reduziriam o *boilerplate* de `fetch` + `JSON.stringify` + toast.
- **Correcção:**
  1. Converter `DashboardView`, `OrganogramaView`, `MembrosListView`, `FerramentasListView` em Server Components que fazem `db.area.findMany(...)` directamente (sem passar pela API).
  2. Manter componentes interativos (forms, sidebar, drill-downs) como `'use client'`.
  3. Substituir `POST /api/areas` por uma *Server Action* `'use server' async function createArea(formData)`. Reduz superficie de API pública.

#### A8. **[Segurança] `db.ts` com `log: ['query']` em todos os ambientes**
- **Onde:** `src/lib/db.ts:9-11`:
  ```ts
  new PrismaClient({ log: ['query'] })
  ```
- **Impacto:** Em produção, todas as queries (com parâmetros) vão para *stdout* — inclui nomes, emails e IDs de colaboradores. Volumes grandes de log degradam performance e custam armazenamento.
- **Correcção:**
  ```ts
  new PrismaClient({
    log: process.env.NODE_ENV === 'production'
      ? ['error', 'warn']
      : ['query', 'error', 'warn'],
  })
  ```

### Médio

#### M1. **[Lógica/Arquitetura] `import` e `PUT /api/tarefas/[id]` não usam transacções**
- **Onde:** `src/app/api/import/route.ts:32-242` — sequência de 7 `deleteMany` + 7 ciclos de `upsert` sem `$transaction`. `src/app/api/tarefas/[id]/route.ts:33-58` — `deleteMany` dos procedimentos seguido de `update` da tarefa (com `create` de novos procedimentos) sem transacção.
- **Impacto:** Falha a meio (timeout, erro de FK, *crash*) deixa a BD inconsistente. No `import` com `replace`, pode resultar em BD vazia sem nada importado.
- **Correcção:** Envolver em `db.$transaction(async (tx) => { ... })` e usar `tx.area.upsert` etc. em vez de `db.area.upsert`.

#### M2. **[Lógica/Arquitetura] Duplicação de tipos entre `src/lib/types.ts` e o Prisma**
- **Onde:** `src/lib/types.ts` redefine manualmente todas as interfaces (`Area`, `Processo`, `Actividade`, etc.) com campos opcionais `_count` que o Prisma já gera.
- **Impacto:** Os tipos podem *drift* do schema Prisma. Manutenção dupla. Bug clássico: campo adicionado no schema mas esquecido no `types.ts` → tipo não反映 a realidade.
- **Correcção:** Importar directamente de `@prisma/client`:
  ```ts
  import { Area, Processo, Membro } from '@prisma/client'
  ```
  Para projecções específicas (sem `_count`), usar `Prisma.AreaGetPayload<{ select: {...} }>` ou `Pick<Area, ...>`.

#### M3. **[Lógica/Arquitetura] `ferramentaIds` guardado como *string* separada por vírgulas**
- **Onde:** `prisma/schema.prisma:69` — `ferramentaIds String  // IDs separados por vírgula (SQLite não suporta listas)`. Lógica de *split/join* replicada em `route.ts:53`, `route.ts:45`, `export/route.ts:119-124, 180`.
- **Impacto:** Não há integridade referencial — uma ferramenta apagada fica referenciada em *string*. Não se pode fazer `count` ou `join` eficiente. Lógica de serialização duplicada em 5 sítios.
- **Correcção:** Criar tabela de junção `TarefaFerramenta` (m-n):
  ```prisma
  model TarefaFerramenta {
    tarefaId    String
    ferramentaId String
    tarefa      Tarefa      @relation(fields: [tarefaId], references: [id], onDelete: Cascade)
    ferramenta  Ferramenta  @relation(fields: [ferramentaId], references: [id], onDelete: Cascade)
    @@id([tarefaId, ferramentaId])
  }
  ```
  Mesmo em SQLite, m-n funciona. Migração de dados: ler todos os `ferramentaIds`, fazer *split* e inserir na nova tabela.

#### M4. **[Lógica/Arquitetura] Sem paginação em todos os endpoints de lista**
- **Onde:** `/api/areas`, `/api/processos`, `/api/actividades`, `/api/tarefas`, `/api/membros`, `/api/ferramentas`, `/api/dashboard` — todos devolvem a coleção inteira sem `take/skip` nem cursor.
- **Impacto:** Com crescimento da base (centenas de processos, milhares de tarefas), cada GET fica pesado, o *dashboard* (que já faz 8 *queries* paralelas) fica lento, e o frontend (que renderiza tudo de uma vez) começa a *lag*.
- **Correcção:** Adicionar `?page=1&pageSize=50` ou *cursor pagination* (`?cursor=xxx&take=50`). No frontend, usar *infinite scroll* ou paginação explícita com `@tanstack/react-query` (`useInfiniteQuery`).

#### M5. **[Segurança] Sem rate limiting**
- **Onde:** Nenhuma rota tem *throttle*. `/api/import` (que faz N *upserts*), `/api/membros?q=...` (faz `contains` em duas colunas sem índice), `/api/export` (carrega tudo para memória) são especialmente sensíveis.
- **Impacto:** Qualquer cliente pode chamar `/api/import` 1000x e esgotar a BD, ou `/api/membros?q=a` 1000x e saturar a CPU. Como não há auth, o limite é por IP via middleware.
- **Correcção:**
  - Para volume baixo: usar `@upstash/ratelimit` + middleware.
  - Para volume alto: rate-limit no Caddyfile com `rate_limit`.
  - Adicionar índices em `Membro.email`, `Membro.nome`, `Area.nome`.

#### M6. **[Segurança] `.env` enviado dentro do `.tar`**
- **Onde:** Raiz do projecto tem `.env` com `DATABASE_URL=file:/home/z/my-project/db/custom.db`.
- **Impacto:** Embora o valor em si seja inofensivo (caminho SQLite local), a prática é má: *secrets* reais (NEXTAUTH_SECRET, SMTP, etc.) acabam por ser commitados. `.gitignore` tem `.env*` mas o ficheiro foi empacotado.
- **Correcção:** Não incluir `.env` no tar. Fornecer `.env.example` com placeholders. Carregar *secrets* via gestor de segredos (Vault, AWS Secrets Manager, Doppler) em produção.

#### M7. **[Lógica/Arquitetura] `tsconfig.json` com `noImplicitAny: false`**
- **Onde:** `tsconfig.json:13`.
- **Impacto:** Permite `function foo(x) { ... }` sem tipar `x` — `x` fica `any` implícito. Reduz a eficácia do TypeScript como rede de segurança. Combinado com `@typescript-eslint/no-explicit-any: off` (A2), a tipagem fica puramente cosmética.
- **Correcção:** Mudar para `noImplicitAny: true`. Os erros que aparecerem são exactamente os sítios onde a tipagem precisa de atenção.

#### M8. **[Lógica/Arquitetura] `useEffect` duplicado causa *double-fetch* de dados globais**
- **Onde:** `src/app/page.tsx:188-198` (carrega consoante a *view*) e `src/app/page.tsx:204-208` (carrega sempre `areas`, `ferramentas`, `membros`). Ambos correm na montagem inicial.
- **Impacto:** Na primeira carga, `loadAreas`, `loadMembros` e `loadFerramentas` são chamados **duas vezes** cada. Tráfego desnecessário, race conditions possíveis.
- **Correcção:** Remover o `useEffect` das linhas 204-208 e mover a lógica para dentro do de 188-198, ou usar React Query com `staleTime` que evita refetch automático.

### Baixo

#### B1. **[Lógica/Arquitetura] `dataRevisao` confuso entre `@default(now())` e atribuição manual**
- **Onde:** `prisma/schema.prisma:70` define `dataRevisao DateTime @default(now())`. Mas `src/app/api/tarefas/[id]/route.ts:48` define `dataRevisao: new Date()` explicitamente no PUT. Comentário no código (linhas 46-47) reconhece a confusão.
- **Impacto:** A semântica de `@default(now())` só se aplica no *create*. No *update*, sem `@updatedAt`, o Prisma **não** actualiza automaticamente. A atribuição manual funciona, mas o nome do campo e o comentário mostram que a intenção não está clara.
- **Correcção:** Renomear para `ultimaRevisaoEm` ou usar um *trigger* / *middleware* Prisma (`Prisma.$extends`) que actualize `dataRevisao` em qualquer *update* de `Tarefa`:
  ```ts
  db.$extends({
    query: { tarefa: { async update({ model, operation, args, query }) {
      args.data = { ...args.data, dataRevisao: new Date() }
      return query(args)
    }}}
  })
  ```

#### B2. **[Lógica/Arquitetura] `console.error` disperso em todas as rotas (41 ocorrências)**
- **Onde:** Padrão `console.error('Erro ao criar X:', error)` em todas as *Route Handlers*.
- **Impacto:** Sem estrutura (sem nível, sem correlation ID, sem timestamp), difícil de filtrar em *log aggregators* (Datadog, Loki). Erros sensíveis (P2002 com email) ficam expostos em *stdout*.
- **Correcção:** Centralizar via `src/lib/logger.ts` com `pino` ou `winston`, com níveis e redação de campos sensíveis. Helper `withErrorHandler(handler)` que envolve cada *Route Handler*.

#### B3. **[Lógica/Arquitetura] Componentes shadcn/ui não usados importados no *bundle***
- **Onde:** `src/components/ui/` tem 47 ficheiros (`carousel.tsx`, `command.tsx`, `navigation-menu.tsx`, `input-otp.tsx`, `menubar.tsx`, `hover-card.tsx`, etc.) — a maioria não é importada em lado nenhum do código de negócio.
- **Impacto:** Cada componente shadcn importa Radix, framer-motion, etc. Mesmo com *tree-shaking*, *dev builds* ficam mais lentos. Ruído na base de código.
- **Correcção:** Apagar ficheiros não usados. Re-adicionar apenas quando um componente for realmente necessário.

#### B4. **[Lógica/Arquitetura] Ortografia inconsistente pt-PT/pt-BR**
- **Onde:** Mistura de "Actu" (pt-PT, e.g. `Actividade`, `actualizada`) com "Obj" (pt-PT "objectivos") — tudo pt-PT — mas algumas *strings* da UI usam `Seleccion` (pt-PT) enquanto outras usam `selecionado` (pt-BR). Erros de API usam "Erro ao actualizar" (pt-PT) mas o comentário em `dados-view.tsx:152` diz "Seleccione".
- **Impacto:** Inconsistência visual; pode confundir utilizadores; torna *search* no código menos eficaz.
- **Correcção:** Padronizar num padrão (recomendo pt-PT, dado que a app claramente usa "Actividade", "Actu", "Objectivos"). Configurar `cspell` ou dicionário no CI.

#### B5. **[Lógica/Arquitetura] `db:push --accept-data-loss` no `package.json`**
- **Onde:** `package.json:10`:
  ```json
  "db:push": "prisma db push --accept-data-loss"
  ```
- **Impacto:** `--accept-data-loss` força *push* do schema mesmo quando há *breaking changes* que causam perda de dados. Perigoso em produção se alguém correr por engano.
- **Correcção:** Remover `--accept-data-loss` do script default. Para *dev*, criar `db:push:dev` separado.

---

## 5. Recomendações Estratégicas

### R1. Implementar camada de AuthN/AuthZ antes de qualquer outra melhoria
Sem auth, **todas as outras melhorias são cosméticas** — a aplicação é pública e gravável. Escolher entre:
- **NextAuth.js com Azure AD/Entra** se for companhia seguradora com Office 365 (provável dado o organograma) — *provider* `AzureADProvider`, sessão JWT, *roles* via *claims*.
- **NextAuth.js com Credentials** se for interno sem SSO — bcrypt para hash de passwords, `authOptions` em `src/lib/auth.ts`, `middleware.ts` para proteger `/api/*`.

Aplicar autorização por papel: `admin` (tudo), `editor` (CRUD em processos), `viewer` (só GET). Aplicar *server-side* em cada Route Handler via helper `requireRole('admin')`.

### R2. Adicionar camada de validação com zod em todas as APIs
Criar `src/lib/schemas.ts` com schemas por entidade (create/update/import), aplicar `safeParse` em cada handler. Limitar `tipo` e `frequencia` a enums. Sanitizar strings (trim, max length). Rejeitar IDs que não sejam `cuid()`. Isto resolve C3 e reduz drasticamente os erros 500 genéricos.

### R3. Refactorar para usar capacidades nativas do App Router
Converter `DashboardView`, `OrganogramaView`, listas globais em **Server Components** que chamam `db.*` directamente. Substituir *Route Handlers* de escrita por **Server Actions** com `revalidatePath`/`revalidateTag` para cache invalidation. Isto reduz a base de código em ~40% e tira partido do cache do Next.js.

Adoptar **React Query** (já no `package.json`) para estado de dados no cliente — substitui 9 `useState` + 9 `useCallback` + *fetch* manual no `page.tsx`, com cache, *retry*, *stale-while-revalidate* grátis.

### R4. Configurar pipeline de qualidade que efectivamente bloqueia
- Reativar todas as regras ESLint (A2) com `error`.
- Remover `typescript.ignoreBuildErrors: true` (A1) e `noImplicitAny: false` (M7).
- Adicionar `pre-commit` com `lint-staged` + `tsc --noEmit`.
- Adicionar CI step `bun run lint && bun run tsc --noEmit && bun audit --throw-on-issue`.
- Adicionar testes (não há nenhum teste actualmente) — começar com testes das *Server Actions* usando Vitest.

### R5. Substituir `xlsx` por alternativa segura e sanitizar todos os exports
- Remover `xlsx@0.18.5` e instalar `exceljs` (mantido, sem CVEs conhecidos) ou a versão CDN do SheetJS.
- Implementar `sanitizeCell(v)` (C4) e aplicar em **todos** os exports CSV/XLSX.
- Considerar separar exports grandes para um *job queue* (BullMQ) se o volume crescer.

### R6. Migrar de SQLite para PostgreSQL antes de produção
SQLite é adequado para *dev* e protótipo, mas em produção com múltiplos utilizadores concorrentes, o *file lock* causa contenção. PostgreSQL dá: ROW-level locking, *JSON* nativo (útil para KPIs/Obrigações), *full-text search* (para `/api/membros?q=...`), tipos enum nativos (resolve a falta de validação de `tipo`/`frequencia` em DB). Migração via `prisma migrate`.

---

## 6. Checklist de Segurança Rápido

| Item | Status | Notas |
|---|---|---|
| Autenticação | **Crítico** | Nenhuma implementada. `next-auth` em deps mas não usado. |
| Autorização | **Crítico** | Todas as rotas pública-graváveis. Sem papéis. |
| Validação de *inputs* | **Crítico** | Sem schemas. `body` directo do `req.json()`. `any[]` no import. |
| *Secrets* e `.env` | **Atenção** | `.env` enviado no tar. `DATABASE_URL` inofensiva mas prática má. |
| Protecção de rotas sensíveis | **Crítico** | Sem `middleware.ts`. `/api/import?replace=true` é público. |
| Server Actions / API Routes | **Crítico** | Sem auth, sem rate limit, sem validação. |
| *Headers* de segurança | **Crítico** | Nenhum configurado em `next.config.ts`. |
| Dependências vulneráveis | **Atenção** | `bun audit`: 108 vulns (5 críticas, 59 altas). Críticas runtime: `xlsx@0.18.5`, `sharp<0.35`. |

---

## 7. Próximos Passos (ordem recomendada)

> Começar sempre pelos **riscos de segurança críticos** — as melhorias de lógica só devem ser feitas depois da base segura.

### Iteração 12 — Segurança (bloqueante para produção)

1. **C1** — Implementar NextAuth com `middleware.ts`, proteger todas as `/api/*` e rotas de UI. Definir papéis (admin/editor/viewer).
2. **C2** — Envolver `/api/import` em auth + papel admin + transacção. Adicionar `replace=true` separado e auditado.
3. **C3** — Criar `src/lib/schemas.ts` com zod. Aplicar `safeParse` em todas as 13 *Route Handlers*.
4. **C4** — Implementar `sanitizeCell()` e aplicar em CSV + XLSX. Sanitizar também `JSON` export se for re-importado (validar IDs `cuid`).
5. **A1** — Remover `ignoreBuildErrors: true` e `reactStrictMode: false` em `next.config.ts`. Corrigir erros que aparecerem.
6. **A3** — Adicionar *headers* de segurança (`X-Frame-Options`, CSP, `HSTS`, etc.).
7. **A4** — Substituir `xlsx@0.18.5` por `exceljs` ou CDN SheetJS.
8. **A5** — Remover bloco `XTransformPort` do `Caddyfile`.
9. **A8** — Mudar `log: ['query']` para condicional por `NODE_ENV`.
10. **M5** — Adicionar rate limiting em `/api/import`, `/api/membros?q=`, `/api/export`.
11. **M6** — Remover `.env` do tar; criar `.env.example`.

### Iteração 13 — Qualidade e arquitectura

1. **A2** — Reativar regras ESLint. Correr `bun run lint`, corrigir warnings.
2. **A6 + A7** — Refactorar `page.tsx` em múltiplos componentes. Converter vistas estáticas em Server Components. Adicionar React Query.
3. **M1** — Envolver `import` e `PUT /api/tarefas/[id]` em `$transaction`.
4. **M2** — Substituir `src/lib/types.ts` por tipos do Prisma.
5. **M3** — Criar `TarefaFerramenta` m-n. Migrar dados existentes.
6. **M4** — Adicionar paginação nos endpoints de lista.
7. **M7** — Activar `noImplicitAny: true`.
8. **M8** — Remover `useEffect` duplicado.

### Iteração 14 — Débito técnico de baixo risco

1. **B1** — Clarificar semântica de `dataRevisao` (middleware Prisma).
2. **B2** — Centralizar *logging* com `pino` + correlation ID.
3. **B3** — Apagar componentes shadcn não usados.
4. **B4** — Padronizar ortografia (pt-PT).
5. **B5** — Remover `--accept-data-loss` do script `db:push`.

### Como apresentar o feedback após as correções

1. Para cada item corrigido (C1, C2, A1, etc.), enviar um **diff ou resumo** com:
   - Ficheiro(s) alterado(s) e linhas.
   - Antes / depois do código.
   - Como foi testado (manual, unit test, screenshot).
2. Para itens **não corrigidos**, justificar: decisão técnica, prioridade diferente, ou dúvida — e propor alternativa.
3. Re-enviar o `.tar` como `workspace-XXX (12).tar` com a mesma estrutura.
4. Incluir no cabeçalho da mensagem: `Iteração 12 — foco em segurança crítica (C1-C4, A1-A8).`

---

**Pronto para receber a próxima versão do projecto (iteração 12) com as melhorias aplicadas.**
Avaliação será focada, nesta ordem, em: (1) os itens C1–C4 continuam resolvidos, (2) os itens A1–A8, (3) os de média prioridade que tiverem sido atacados, (4) regressões introduzidas.
