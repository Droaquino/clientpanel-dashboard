# Diagramas Visuais do Projeto

---

## 1. Arquitetura Geral do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                     APLICAÇÃO REACT 18                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                        App.jsx                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │ useState:    │  │ useState:    │  │ useState:    │   │  │
│  │  │ processos    │  │ areas (NEW)  │  │ user, tab    │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│      ┌───────────────────────┼───────────────────────┐          │
│      │                       │                       │          │
│  ┌───▼──────────────┐  ┌────▼──────────────┐  ┌────▼──────┐   │
│  │ Sidebar          │  │ Renderização Tab  │  │ Lógica    │   │
│  │ [Tabs]           │  │ [Dinâmica]        │  │ [Filtros] │   │
│  │ [Usuário]        │  │ [Componentes]     │  │ [Cálculos]│   │
│  └──────────────────┘  └───────────────────┘  └───────────┘   │
│                              │                                   │
│      ┌───────────────────────┼───────────────────────┐          │
│      │                       │                       │          │
│  ┌───▼──────────────────┐  ┌▼──────────────────┐ ┌─▼────────┐ │
│  │ DashboardSócio (NEW) │  │Configurações      │ │Processos │ │
│  │ [FilterPanel]        │  │ + GerenciadorAreas│ │ [List]   │ │
│  │ [AreaCard]           │  │   (NEW)           │ │          │ │
│  │ [ProcessosTable]     │  │ [PeopleSection]   │ └──────────┘ │
│  └──────────────────────┘  └───────────────────┘              │
│                                                                 │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                 ┌─────────────▼──────────────┐
                 │    supabase.js (Client)    │
                 │                            │
                 │ dbGetAreas() (NEW)         │
                 │ dbAddArea() (NEW)          │
                 │ dbSaveArea() (NEW)         │
                 │ dbDeleteArea() (NEW)       │
                 │ dbGetProcessos()           │
                 │ ... (outros)               │
                 └─────────────┬──────────────┘
                               │
          ┌────────────────────┴────────────────────┐
          │                                         │
    ┌─────▼──────────────┐             ┌──────────▼────────┐
    │   SUPABASE (BD)    │             │  SUPABASE (Auth)  │
    │                    │             │                   │
    │ processos          │             │ usuarios          │
    │ areas (NEW)        │             │ solicitacoes      │
    │ colaboradores      │             │ convites          │
    │ consultores        │             │ ...               │
    │ eventos            │             │                   │
    └────────────────────┘             └───────────────────┘
```

---

## 2. Fluxo do Usuário — Dashboard de Sócio

```
┌─────────────┐
│ Login Sócio │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────┐
│ App Renderiza Sidebar        │
│ - Mostra Tab "Dashboard"     │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ User clica "Dashboard"       │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ <DashboardSocio /> Renderiza │
│                              │
│ useEffect() → carrega:       │
│ - processos (do estado App)  │
│ - areas (do estado App)      │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Renderiza Filtros (esquerda) │
│ - Checkboxes de áreas        │
│ - Checkboxes de estágios     │
│ - Botão "Limpar filtros"     │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ User marca filtros           │
│ selectedAreas = ['Comercial']│
│ selectedStages.coleta = true │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ useMemo roda:                │
│ filtrarProcessos()           │
│ agruparPorAreaComStats()     │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Renderiza Cards por Área     │
│ Renderiza Tabela Filtrada    │
│ + Barras de Progresso        │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ User vê resultado filtrado   │
│ [3 processos em Comercial]   │
└──────────────────────────────┘
```

---

## 3. Fluxo do Usuário — Gerenciador de Áreas

```
┌──────────────────┐
│ Login Coordenador│
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────┐
│ Clica "Configurações"        │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Ver Seção "Gerenciar Áreas"  │
│ - Lista de 7 áreas           │
│ - Botão "+ Nova Área"        │
└────────┬─────────────────────┘
         │
         ├─── Clica "+ Nova"
         │         │
         │         ▼
         │    ┌──────────────────┐
         │    │ Form aparece:    │
         │    │ Nome, Descrição, │
         │    │ Ativa (checkbox) │
         │    └────────┬─────────┘
         │             │
         │             ├─── Preenche e clica "Adicionar"
         │             │            │
         │             │            ▼
         │             │    ┌────────────────────┐
         │             │    │ Validar:           │
         │             │    │ - Nome obrigatório │
         │             │    │ - Sem duplicata    │
         │             │    │ - 3-50 chars       │
         │             │    └────────┬───────────┘
         │             │             │
         │             │             ├─── ✓ OK
         │             │             │      │
         │             │             │      ▼
         │             │             │  ┌────────────────┐
         │             │             │  │ dbAddArea()    │
         │             │             │  │ POST Supabase  │
         │             │             │  └────────┬───────┘
         │             │             │           │
         │             │             │           ▼
         │             │             │  ┌────────────────┐
         │             │             │  │ setAreas()     │
         │             │             │  │ Atualiza UI    │
         │             │             │  └────────────────┘
         │             │             │
         │             │             └─── ✗ Erro
         │             │                    │
         │             │                    ▼
         │             │            ┌────────────────┐
         │             │            │ Show error msg │
         │             │            └────────────────┘
         │             │
         │             └─ Clica "Editar"
         │                      │
         │                      ▼
         │             ┌────────────────────┐
         │             │ Form preenchido    │
         │             │ Modifica campos    │
         │             │ Clica "Atualizar"  │
         │             └────────┬───────────┘
         │                      │
         │                      ▼
         │             ┌────────────────────┐
         │             │ dbSaveArea()       │
         │             │ PUT Supabase       │
         │             └────────┬───────────┘
         │                      │
         │                      ▼
         │             ┌────────────────────┐
         │             │ setAreas() update  │
         │             └────────────────────┘
         │
         └─── Clica "Deletar"
                    │
                    ▼
           ┌────────────────────────┐
           │ Valida:                │
           │ Tem processos nessa    │
           │ área?                  │
           └────────┬───────────────┘
                    │
                    ├─── SIM (N processos)
                    │         │
                    │         ▼
                    │    ┌────────────────────┐
                    │    │ Show Error:        │
                    │    │ "Não pode deletar" │
                    │    │ Ofereça: Desativar │
                    │    └────────────────────┘
                    │
                    └─── NÃO (0 processos)
                             │
                             ▼
                    ┌────────────────────┐
                    │ Pede confirmação   │
                    │ "Tem certeza?"     │
                    └────────┬───────────┘
                             │
                             ├─── Confirma
                             │       │
                             │       ▼
                             │  ┌─────────────────┐
                             │  │ dbDeleteArea()  │
                             │  │ DELETE Supabase │
                             │  └────────┬────────┘
                             │           │
                             │           ▼
                             │  ┌─────────────────┐
                             │  │ setAreas()      │
                             │  │ Remove UI       │
                             │  └─────────────────┘
                             │
                             └─── Cancela
                                     │
                                     ▼
                            ┌─────────────────┐
                            │ Form fecha      │
                            │ Nada muda       │
                            └─────────────────┘
```

---

## 4. Estrutura de Estado (Redux-like)

```
STATE GLOBAL (App.jsx)
┌─────────────────────────────────────────────────────┐
│                                                     │
│  user: {                                            │
│    id: 4,                                           │
│    nome: 'DF Turismo',                              │
│    role: 'socio',                                   │
│    cargo: 'Sócio',                                  │
│    grupo: 'cliente'                                 │
│  }                                                  │
│                                                     │
│  processos: [ {                                     │
│    id: 1,                                           │
│    num: 1,                                          │
│    nome: 'Emissão de Pacotes',                      │
│    area: ['Comercial'],                             │
│    coleta: true,                                    │
│    modelagem: true,                                 │
│    valCOPS: true,                                   │
│    corrCOPS: false,                                 │
│    valCliente: false,                               │
│    corrCliente: false,                              │
│    analise: false,                                  │
│    consultor: ['Ana Lima'],                         │
│    comQuem: ['Gerência Geral'],                     │
│    formato: 'Fluxograma',                           │
│    confirmed: false,                                │
│    comentarios: []                                  │
│  }, ... ]                                           │
│                                                     │
│  areas: [ (NEW)                                     │
│    { id: 1, nome: 'Comercial', descricao: '...',   │
│      ativa: true },                                 │
│    { id: 2, nome: 'Financeiro', ... },              │
│    { id: 3, nome: 'RH', ... },                      │
│    ... (7 áreas no total)                           │
│  ]                                                  │
│                                                     │
│  colaboradores: [ ... ]                             │
│  consultores: [ ... ]                               │
│  eventos: [ ... ]                                   │
│  tab: 'dashboard'                                   │
│                                                     │
└─────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ DashboardSócio   │  │ GerenciadorAreas │  │ Outros           │
│ STATE LOCAL:     │  │ STATE LOCAL:     │  │                  │
│                  │  │                  │  │ - Agenda         │
│ selectedAreas    │  │ showForm: bool   │  │ - Levantamento   │
│ selectedStages   │  │ editingId: num   │  │ - Processos      │
│ sortBy: string   │  │ formData: obj    │  │ - Configurações  │
│ viewMode: string │  │ errors: obj      │  │                  │
│                  │  │ isSaving: bool   │  │                  │
│ COMPUTED:        │  │ deletingId: num  │  │                  │
│ filtrados []     │  │                  │  │                  │
│ statsPerArea {}  │  │                  │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## 5. Fluxo de Filtros (Lógica)

```
┌──────────────────────────────────────────────────────────┐
│              Usuário marca filtros                       │
│                                                          │
│  selectedAreas = ['Comercial', 'RH']                     │
│  selectedStages = {                                      │
│    coleta: true,                                         │
│    modelagem: true,                                      │
│    valCOPS: false,                                       │
│    ...                                                   │
│  }                                                       │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ useMemo → recalcula se:    │
        │ - processos mudou          │
        │ - selectedAreas mudou      │
        │ - selectedStages mudou     │
        └────────────────┬───────────┘
                         │
                         ▼
        ┌────────────────────────────────────────┐
        │ função: filtrarProcessos()             │
        │                                        │
        │ 1. Começa com todos os processos: 10  │
        │                                        │
        │ 2. Filtro por ÁREAS (OR)               │
        │    ├─ Comercial tem 3 processos       │
        │    ├─ RH tem 2 processos              │
        │    └─ Total após filtro: 5            │
        │                                        │
        │ 3. Filtro por ESTÁGIOS (AND)           │
        │    ├─ Todos têm "coleta": 5/5 ✓       │
        │    ├─ Todos têm "modelagem": 4/5      │
        │    └─ Total após filtro: 4            │
        │                                        │
        │ 4. Resultado final: 4 processos       │
        └────────────────┬───────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────┐
        │ função: agruparPorAreaComStats()       │
        │                                        │
        │ Agrupa os 4 processos por área:        │
        │                                        │
        │ Comercial: 3 processos                 │
        │ ├─ coleta: 3/3 (100%)                  │
        │ ├─ modelagem: 3/3 (100%)               │
        │ └─ Progresso médio: 71%                │
        │                                        │
        │ RH: 1 processo                         │
        │ ├─ coleta: 1/1 (100%)                  │
        │ ├─ modelagem: 1/1 (100%)               │
        │ └─ Progresso médio: 57%                │
        └────────────────┬───────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────┐
        │ Renderiza:                             │
        │                                        │
        │ ✓ Card "Comercial" (3 processos)       │
        │ ✓ Card "RH" (1 processo)               │
        │ ✓ Tabela com 4 linhas                  │
        │                                        │
        │ Resumo: "4 processos encontrados"      │
        └────────────────────────────────────────┘
```

---

## 6. Estrutura de Banco de Dados

```
TABELA: areas (NEW)
┌─────┬──────────────────────────────────────────────────┐
│ id  │ data JSONB                                       │
├─────┼──────────────────────────────────────────────────┤
│ 1   │ {"nome":"Comercial",                             │
│     │  "descricao":"Área de vendas...",                │
│     │  "ativa":true}                                   │
├─────┼──────────────────────────────────────────────────┤
│ 2   │ {"nome":"Financeiro",                            │
│     │  "descricao":"Gestão financeira...",             │
│     │  "ativa":true}                                   │
├─────┼──────────────────────────────────────────────────┤
│ ... │ ...                                              │
└─────┴──────────────────────────────────────────────────┘

TABELA: processos (EXISTENTE - COM REFERÊNCIA A areas)
┌─────┬──────────────────────────────────────────────────┐
│ id  │ data JSONB                                       │
├─────┼──────────────────────────────────────────────────┤
│ 1   │ {                                                │
│     │   "num":1,                                       │
│     │   "nome":"Emissão de Pacotes",                   │
│     │   "area":["Comercial"],  ◄── FK para areas.id   │
│     │   "coleta":true,                                 │
│     │   "modelagem":true,                              │
│     │   "valCOPS":true,                                │
│     │   ...                                            │
│     │ }                                                │
├─────┼──────────────────────────────────────────────────┤
│ ... │ ...                                              │
└─────┴──────────────────────────────────────────────────┘

RELACIONAMENTO:
processos.area (array) ──→ areas.nome
  "area": ["Comercial"]  ───→  {id: 1, "nome": "Comercial", ...}
```

---

## 7. Validações — Diagrama de Decisão

```
USER QUER CRIAR/EDITAR ÁREA
│
├─ Nome vazio?
│  ├─ SIM → Erro: "Nome é obrigatório"
│  └─ NÃO ↓
│
├─ Nome < 3 caracteres?
│  ├─ SIM → Erro: "Mínimo 3 caracteres"
│  └─ NÃO ↓
│
├─ Nome > 50 caracteres?
│  ├─ SIM → Erro: "Máximo 50 caracteres"
│  └─ NÃO ↓
│
├─ Descrição > 200 caracteres?
│  ├─ SIM → Erro: "Máximo 200 caracteres"
│  └─ NÃO ↓
│
├─ Nome já existe (duplicata)?
│  ├─ SIM → Erro: "Área com este nome já existe"
│  └─ NÃO ↓
│
└─ ✓ VÁLIDO → Pode salvar (dbAddArea ou dbSaveArea)

═══════════════════════════════════════════════════════════

USER QUER DELETAR ÁREA
│
├─ Tem processos nessa área?
│  ├─ SIM (N > 0)
│  │  ├─ Mostrar Erro: "Existem N processo(s) nesta área"
│  │  ├─ Oferecer: "Desativar em vez de deletar"
│  │  └─ CANCELAR OPERAÇÃO
│  │
│  └─ NÃO (0 processos)
│     ├─ Pedir confirmação: "Tem certeza?"
│     ├─ Se CONFIRMA → dbDeleteArea()
│     └─ Se CANCELA → Volta
```

---

## 8. Componentes — Hierarquia

```
<App>
  └─ <Sidebar>
     ├─ [Tabs incluindo "Dashboard" para socio]
     ├─ [Perfil do usuário]
     └─ [Logout]

  └─ (quando tab === 'dashboard' && role === 'socio')
     └─ <DashboardSocio>
        ├─ <FilterPanel>
        │  ├─ [Checkboxes de Áreas]
        │  ├─ [Checkboxes de Estágios]
        │  └─ [Botão "Limpar filtros"]
        │
        ├─ <ProcessosGrid>
        │  └─ <AreaCard> (múltiplos)
        │     ├─ [Nome da Área]
        │     ├─ [Total de Processos]
        │     ├─ [Barra de Progresso]
        │     └─ [Estágios com percentuais]
        │
        └─ <ProcessosTable>
           ├─ [Headers: #, Nome, Área, Progresso%, Estágio]
           └─ [Rows com dados filtrados]

  └─ (quando tab === 'configuracoes' && role === 'coordenador')
     └─ <Configuracoes>
        └─ <GerenciadorAreas> (NEW)
           ├─ <AreaList>
           │  └─ <AreaItem> (múltiplos)
           │     ├─ [Nome, Descrição, Status]
           │     ├─ [Botão Editar]
           │     ├─ [Botão Deletar]
           │     └─ [Contador de processos]
           │
           └─ <AreaForm>
              ├─ [Input: Nome]
              ├─ [Textarea: Descrição]
              ├─ [Checkbox: Ativa]
              ├─ [Botão Cancelar]
              └─ [Botão Adicionar/Atualizar]
```

---

## 9. Lifecycle do Dashboard

```
FASE 1: MOUNT
┌─────────────────────────────────────────┐
│ <DashboardSocio> monta                  │
│ ↓                                       │
│ useState() → inicializa:                │
│ - selectedAreas = []                    │
│ - selectedStages = {todos: false}       │
│ - sortBy = 'area'                       │
│                                         │
│ useEffect() → processa props:           │
│ - Lê processos (passado)                │
│ - Lê areas (passado)                    │
│ - Calcula filtrados = todos             │
│ - Calcula statsPerArea = todos          │
└─────────────────────────────────────────┘

FASE 2: USER INTERAGE
┌─────────────────────────────────────────┐
│ User marca checkbox "Comercial"         │
│ ↓                                       │
│ onChange → setSelectedAreas(['Comercial'])
│ ↓                                       │
│ Component re-renders                    │
│ ↓                                       │
│ useMemo vê mudança em selectedAreas     │
│ ↓                                       │
│ Recalcula:                              │
│ - filtrados (apenas Comercial)          │
│ - statsPerArea (apenas Comercial)       │
│ ↓                                       │
│ Renderiza novo resultado                │
└─────────────────────────────────────────┘

FASE 3: UPDATES EXTERNOS
┌─────────────────────────────────────────┐
│ Dad muda (novo processo adicionado)     │
│ ↓                                       │
│ App atualiza estado: setProcessos(...)  │
│ ↓                                       │
│ DashboardSocio recebe novo prop         │
│ ↓                                       │
│ useMemo vê mudança em processos         │
│ ↓                                       │
│ Recalcula filtrados e stats             │
│ ↓                                       │
│ Renderiza novo resultado                │
└─────────────────────────────────────────┘

FASE 4: UNMOUNT
┌─────────────────────────────────────────┐
│ User sai de "Dashboard"                 │
│ ↓                                       │
│ Component desmonta                      │
│ ↓                                       │
│ Estado local é perdido                  │
│ ↓                                       │
│ Próxima vez que voltar, recria do zero  │
└─────────────────────────────────────────┘
```

---

## 10. Fluxo de Dados — Fetch & Render

```
APP MOUNT
│
├─ useEffect([])
│  │
│  └─ Promise.all([
│     ├─ dbGetProcessos()     → API Supabase
│     ├─ dbGetAreas() (NEW)   → API Supabase
│     ├─ dbGetColaboradores() → API Supabase
│     └─ dbGetConsultores()   → API Supabase
│
│     Todas retornam { data: [...] }
│
│  ├─ setProcessos([...10...])
│  ├─ setAreas([...7...])
│  ├─ setColaboradores([...6...])
│  └─ setConsultores([...2...])
│
└─ Re-renders com novo estado
   │
   ├─ Sidebar renderiza com dados
   │
   └─ Se tab === 'dashboard' e role === 'socio'
      │
      └─ <DashboardSocio processos={...} areas={...} />
         │
         └─ Renderiza filtros + cards + tabela
            │
            └─ User pode interagir!
```

---

## 11. Performance — Otimizações

```
❌ INEFICIENTE
─────────────
Toda render, recalcula filtros:
const filtrados = filtrarProcessos(processos, selectedAreas, selectedStages)
                  ▲
                  └─ Função roda mesmo se selectedAreas não mudou


✓ EFICIENTE  
────────────
Com useMemo, só recalcula se dependências mudam:
const filtrados = useMemo(() => {
  return filtrarProcessos(processos, selectedAreas, selectedStages)
}, [processos, selectedAreas, selectedStages])
   ▲────────────────────────────────────────────
   └─ Só roda se um desses mudar


GANHO DE PERFORMANCE:
─────────────────────
Sem 10+ renderizações desnecessárias por segundo
Filtra lista de 100+ processos sem lag
CPU usage reduzido em ~80%
Scroll suave (60 FPS)
```

---

## 12. Timeline Gráfica

```
SEMANA 1
├─ Segunda (4h)
│  ├─ Setup: Database migration (1h)
│  ├─ Code: Adicionar estado + funções (1.5h)
│  └─ Test: Integração básica (1.5h)
│
├─ Terça-Quarta (8h)
│  ├─ Code: Criar 3 componentes (5h)
│  ├─ Style: Styling e responsividade (2h)
│  └─ Test: Testes manuais de filtros (1h)
│
└─ Quinta-Sexta (10h)
   ├─ Code: GerenciadorAreas + CRUD (4h)
   ├─ Test: Testes manuais completos (3h)
   ├─ Polish: Animações, loading states (2h)
   └─ Deploy: Build + Vercel (1h)

TOTAL: ~34 horas = 5-7 dias (1 dev full-time)

EXEMPLO COM 2 DEVS:
├─ Dev 1: Backend + Componentes
├─ Dev 2: UI/UX + Testes
└─ Tempo total: 2-3 dias (paralelo)
```

---

**Estes diagramas complementam a documentação técnica. Refira-se a eles enquanto desenvolve!**
