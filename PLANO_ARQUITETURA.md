# Plano Arquitetural: Sistema de Mapeamento de Processos

**Data:** 2026-06-26  
**Versão:** 1.0  
**Status:** Planejamento

---

## 1. VISÃO GERAL

Adicionar funcionalidades de dashboard analítico para Sócio e gestão de áreas para Coordenador em um sistema React 18 + Vite + Supabase com armazenamento JSONB.

### Objetivos
- Fornecer visibilidade de processos por área e estágio para sócios
- Permitir coordenadores gerenciarem áreas da empresa
- Implementar filtros e estatísticas em tempo real
- Manter compatibilidade com stack atual

---

## 2. ANÁLISE DO ESTADO ATUAL

### 2.1 Arquitetura Existente

**Stack:**
- Frontend: React 18 + Vite
- UI: Styled components (inline styles)
- Database: Supabase (PostgreSQL)
- Storage: JSONB columns

**Estrutura de Tabelas:**
```
- eventos          → JSONB (reuniões/agenda)
- processos        → JSONB (mapeamento)
- colaboradores    → JSONB (atores)
- consultores      → JSONB (responsáveis)
- solicitacoes     → Relacional (cadastros pendentes)
- usuarios         → Relacional (auth)
- convites         → Relacional (convites)
```

**Roles e Permissões:**
```
coordenador  → Dashboard, Agenda, Levantamento, Processos, Configurações
consultor    → Dashboard, Agenda, Levantamento, Processos
socio        → Processos
cliente      → Processos (read-only)
```

### 2.2 Estrutura de Dados (Processos)

Cada processo contém:
```json
{
  "num": 1,
  "nome": "string",
  "area": ["string"],           ← CRÍTICO para filtros
  "comQuem": ["string"],        ← Colaboradores
  "consultor": ["string"],      ← Consultores
  "formato": "string",
  "coleta": boolean,            ← Estágios (7 no total)
  "modelagem": boolean,
  "valCOPS": boolean,
  "corrCOPS": boolean,
  "valCliente": boolean,
  "corrCliente": boolean,
  "analise": boolean,
  "confirmed": boolean,
  "comentarios": []
}
```

**Estágios Mapeados (em ordem):**
1. Coleta
2. Modelagem  
3. Validação COPS
4. Correção COPS
5. Validação Cliente
6. Correção Cliente
7. Análise Crítica

---

## 3. MUDANÇAS NO BANCO DE DADOS

### 3.1 Tabela: areas (NOVA)

**Propósito:** Armazenar áreas da empresa gerenciáveis pelo coordenador.

```sql
CREATE TABLE IF NOT EXISTS areas (
  id BIGSERIAL PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE areas DISABLE ROW LEVEL SECURITY;

-- Estrutura do JSONB
-- {
--   "nome": "string",
--   "descricao": "string (opcional)",
--   "ativa": boolean
-- }

-- Seed inicial (exemplos do data atual)
INSERT INTO areas (data) VALUES
  ('{"nome":"Comercial","descricao":"Área de vendas e atendimento ao cliente","ativa":true}'),
  ('{"nome":"Financeiro","descricao":"Gestão financeira e contábil","ativa":true}'),
  ('{"nome":"RH","descricao":"Recursos Humanos","ativa":true}'),
  ('{"nome":"Compras","descricao":"Gestão de fornecedores e compras","ativa":true}'),
  ('{"nome":"Marketing","descricao":"Marketing e comunicação","ativa":true}'),
  ('{"nome":"Operações","descricao":"Operações gerais","ativa":true}'),
  ('{"nome":"Gerência","descricao":"Gerência geral","ativa":true}');
```

### 3.2 Alterações na Tabela: processos

**Mudança:** Adicionar campo `empresa_id` para suportar múltiplas empresas no futuro.

```sql
-- Adicionar coluna (opcional para MVP, altamente recomendado para escalabilidade)
ALTER TABLE processos ADD COLUMN empresa_id TEXT DEFAULT 'default';

-- Os dados atuais já possuem o campo "area" (array) que referencia áreas
-- Não é necessário alterar a estrutura JSONB
```

**Nota:** O campo `area` já existe como array e pode ser validado contra a tabela `areas` no frontend.

### 3.3 Seed de Áreas

As áreas devem ser criadas com base nos dados existentes de processos:
- Comercial, Financeiro, Compras, RH, Marketing, Gerência, Operações

---

## 4. COMPONENTES FRONTEND

### 4.1 Novo Componente: Dashboard de Sócio

**Localização:** `src/App.jsx` → Função `DashboardSocio`

**Funcionalidades:**

1. **Filtros Estáticos (Left Sidebar)**
   - Filtrar por Área (multi-select)
   - Filtrar por Estágio (checkbox group)
   
2. **Visualização Principal (Cards Grid)**
   - Card por área com KPIs
   - Exibir: Total de processos, % por estágio
   - Cores por estágio

3. **Tabela de Processos (Bottom)**
   - Listagem completa com filtros aplicados
   - Colunas: #, Nome, Área, Estágio Atual, % Completo

**Props:**
```javascript
{
  processos,      // array de processos
  areas,          // array de áreas
  user           // usuário logado (sócio)
}
```

**Estado Local:**
```javascript
const [selectedAreas, setSelectedAreas] = useState([])
const [selectedStages, setSelectedStages] = useState({})
const [sortBy, setSortBy] = useState('area')
```

### 4.2 Novo Componente: Gerenciador de Áreas

**Localização:** `src/App.jsx` → Função `GerenciadorAreas` (dentro de Configurações)

**Funcionalidades:**

1. **Lista de Áreas (Read)**
   - Exibir áreas cadastradas
   - Indicador de "ativa/inativa"
   - Badge com contagem de processos por área

2. **Formulário de Área (Create/Edit)**
   - Nome (obrigatório)
   - Descrição (opcional)
   - Ativa (toggle/checkbox)

3. **Ações**
   - Editar área
   - Deletar área (com validação: não permitir se houver processos)
   - Ativar/Desativar

**Props:**
```javascript
{
  areas,          // array de áreas
  processos,      // array de processos (para validar exclusão)
  user           // apenas coordenador
}
```

**Estado Local:**
```javascript
const [showForm, setShowForm] = useState(false)
const [editingId, setEditingId] = useState(null)
const [formData, setFormData] = useState({ nome: '', descricao: '', ativa: true })
```

### 4.3 Componente: AreaCard (Sub-componente)

**Uso:** Dashboard de Sócio

Exibe:
- Nome da área
- Total de processos
- Progresso visual por estágio (barras stacked)
- Percentual de conclusão

### 4.4 Componente: FilterPanel (Sub-componente)

**Uso:** Dashboard de Sócio

Renderiza:
- Checkboxes de áreas
- Checkboxes de estágios
- Botão "Limpar filtros"

---

## 5. CAMADA DE DADOS

### 5.1 Funções Supabase (src/supabase.js)

```javascript
// ─── Áreas ─────────────────────────────────────────────────────
export const dbGetAreas      = ()        => getAll('areas')
export const dbAddArea       = obj       => addOne('areas', obj)
export const dbSaveArea      = (id, obj) => saveOne('areas', id, obj)
export const dbDeleteArea    = id        => delOne('areas', id)
```

**Nota:** Usar funções genéricas `getAll`, `addOne`, `saveOne`, `delOne` já existentes.

### 5.2 Funções de Lógica de Negócio

Adicionar em `src/App.jsx` ou novo arquivo `src/logic.js`:

```javascript
// Calcular percentual de conclusão de um processo
function calcularPct(processo) {
  const STAGE_KEYS = ['coleta', 'modelagem', 'valCOPS', 'corrCOPS', 'valCliente', 'corrCliente', 'analise']
  return Math.round(STAGE_KEYS.filter(s => processo[s]).length / STAGE_KEYS.length * 100)
}

// Contar processos por estágio
function contarPorEstágio(processos, estágio) {
  return processos.filter(p => p[estágio]).length
}

// Filtrar processos por área(s)
function filtrarPorAreas(processos, areas) {
  if (!areas.length) return processos
  return processos.filter(p => 
    p.area && p.area.some(a => areas.includes(a))
  )
}

// Filtrar processos por estágio(s)
function filtrarPorEstágios(processos, estágios) {
  const stagesToFilter = Object.entries(estágios)
    .filter(([_, selected]) => selected)
    .map(([stage]) => stage)
  
  if (!stagesToFilter.length) return processos
  
  return processos.filter(p => 
    stagesToFilter.every(s => p[s])
  )
}

// Agrupar processos por área com estatísticas
function agruparPorAreaComStats(processos, áreas) {
  const grupos = {}
  áreas.forEach(a => {
    grupos[a.nome] = {
      nome: a.nome,
      processos: processos.filter(p => p.area?.includes(a.nome)),
      total: 0,
      porEstágio: {}
    }
  })
  
  // Calcular estatísticas
  Object.values(grupos).forEach(g => {
    g.total = g.processos.length
    STAGE_KEYS.forEach(s => {
      g.porEstágio[s] = contarPorEstágio(g.processos, s)
    })
  })
  
  return grupos
}
```

---

## 6. FLUXO DE DADOS

### 6.1 Inicialização (App.jsx → useEffect)

```
App monta
  ↓
useEffect([])
  ↓
  Promise.all([
    dbGetProcessos(),    // Carrega processos
    dbGetAreas(),        // Carrega áreas
    dbGetColaboradores(), 
    dbGetConsultores()
  ])
  ↓
setState({ processos, areas, ... })
```

### 6.2 Dashboard de Sócio

```
User logado (role: 'socio')
  ↓
Tab 'dashboard' selected
  ↓
Renderizar DashboardSocio
  ├─ Filtros (estado local: selectedAreas, selectedStages)
  ├─ onFilterChange → atualizar estado
  ├─ useCallback filtrarProcessos()
  ├─ Renderizar AreaCards
  ├─ Renderizar tabela filtrada
```

### 6.3 Gerenciador de Áreas

```
User logado (role: 'coordenador')
  ↓
Tab 'configuracoes' selected
  ↓
Nova seção 'Gerenciador de Áreas' exibida
  ├─ Lista áreas (áreas do estado App)
  ├─ Novo / Editar área
  ├─ onSave → dbAddArea ou dbSaveArea
  ├─ Atualizar estado App
  └─ Validar exclusão (contarProcessosPorArea)
```

---

## 7. PRIORIZAÇÃO E ROADMAP

### Fase 1: Foundation (Sprint 1 — 2-3 dias)

1. **Database Setup**
   - Criar tabela `areas`
   - Seed de áreas baseado em dados atuais
   - Adicionar funções ao `supabase.js`

2. **Backend Logic**
   - Funções de cálculo (percentual, contagem, filtros)
   - Validações de regra de negócio

3. **Gerenciador de Áreas (MVP)**
   - Form simples (nome, descrição, ativa)
   - CRUD básico
   - Integrado em Configurações
   - Teste manual

### Fase 2: Dashboard de Sócio (Sprint 2 — 3-4 dias)

1. **Componentes UI**
   - FilterPanel
   - AreaCard (visualização)
   - Tabela de processos

2. **Lógica de Filtros**
   - Integração com estado
   - Performance (useMemo para filtros)

3. **Testes e Polimento**
   - Testar filtros combinados
   - Responsividade
   - Validações edge cases

### Fase 3: Polish & Deployment (Sprint 3 — 1-2 dias)

1. **Melhorias UX**
   - Animações suaves
   - Loading states
   - Error handling

2. **Documentação**
   - Guia de uso (tooltip, ajuda)
   - Documentação técnica

3. **Deploy**
   - Vercel build
   - Testes em produção

---

## 8. ESPECIFICAÇÕES DETALHADAS

### 8.1 Dashboard de Sócio — Layout

```
┌─────────────────────────────────────────────────────────┐
│  Painel de Controle → Dashboard                         │
│  Visualizar status dos processos por área               │
├─────────────────────────────────────────────────────────┤
│ [Filtros]         │ [Cards Grid]                        │
│ ┌──────────────┐  │ ┌────────┬────────┬────────┐      │
│ │ ÁREAS        │  │ │Commercial│Financial│RH     │      │
│ │ ☑ Comercial  │  │ │   3 proc │ 2 proc │ 2 proc│      │
│ │ ☐ Financeiro │  │ └────────┴────────┴────────┘      │
│ │ ☐ RH         │  │ ┌────────┬────────┬────────┐      │
│ │ ☐ Compras    │  │ │Compras  │Marketing│Operations│      │
│ │ ☐ Marketing  │  │ │ 1 proc  │ 1 proc  │ 1 proc │      │
│ └──────────────┘  │ └────────┴────────┴────────┘      │
│ ┌──────────────┐  │                                     │
│ │ ESTÁGIOS     │  │ [Tabela de Processos Filtrados]   │
│ │ ☐ Coleta     │  │ # │ Nome │ Área │ Progr. │ Estágio│
│ │ ☐ Modelagem  │  │ 1 │ ... │ ... │ 71% │ Corr COPS│
│ │ ☑ Val. COPS  │  │ 2 │ ... │ ... │ 100% │ Análise │
│ │ ☐ Corr. COPS │  │ 3 │ ... │ ... │ 28% │ Coleta │
│ │ ☐ Val. Cli   │  └────────────────────────────────┘
│ │ ☐ Corr. Cli  │  
│ │ ☑ Análise    │  
│ ├──────────────┤
│ │ Limpar       │
│ └──────────────┘
└─────────────────────────────────────────────────────────┘
```

### 8.2 AreaCard — Detalhes

```
┌────────────────────────┐
│ Comercial              │
│ 3 processos            │
│                        │
│ [████████░░░░░░░░] 71% │
│                        │
│ Coleta        ✓✓       │
│ Modelagem     ✓✓✓      │
│ Val. COPS     ✓✓       │
│ Corr. COPS    ✓        │
│ Val. Cliente  ░░░      │
│ Corr. Cliente ░░░      │
│ Análise       ░░░      │
└────────────────────────┘
```

**Legenda:**
- ✓ = processo neste estágio
- ░ = processo não atingiu este estágio

### 8.3 Gerenciador de Áreas — Form

```
┌──────────────────────────────────────────┐
│ Gerenciar Áreas da Empresa               │
├──────────────────────────────────────────┤
│ [+ Novo]                    Total: 7     │
├──────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐ │
│ │ Comercial (3 processos) ... ✓        │ │
│ │ Área de vendas e atendimento         │ │
│ │ [editar] [deletar]                   │ │
│ └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ │
│ │ Financeiro (2 processos) ... ✓       │ │
│ │ Gestão financeira e contábil         │ │
│ │ [editar] [deletar]                   │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ === NOVO / EDITAR ===                   │
│ Nome                                    │
│ [_____________________]                 │
│ Descrição (opcional)                    │
│ [_____________________]                 │
│ ☑ Ativa                                 │
│ [Cancelar] [Salvar]                     │
└──────────────────────────────────────────┘
```

### 8.4 Validações

**Criar Área:**
- Nome: obrigatório, mín 3 chars, máx 50 chars
- Descrição: máx 200 chars
- Não permitir duplicatas (mesmo nome)

**Editar Área:**
- Mesmas validações acima
- Validar se há processos antes de desativar

**Deletar Área:**
- Verificar se há processos associados
- Se houver, exibir erro: "Não é possível deletar. Existem N processos nesta área."
- Oferecer opção de "Desativar" em vez de deletar

**Filtros Dashboard:**
- Se nenhuma área selecionada: mostrar todos
- Se nenhum estágio selecionado: mostrar todos
- Combinação lógica: AND entre filtros de estágio, OR entre áreas

---

## 9. PADRÕES DE CÓDIGO

### 9.1 Nomeação

```javascript
// Estado
const [selectedAreas, setSelectedAreas] = useState([])
const [isEditingArea, setIsEditingArea] = useState(false)

// Funções
function handleAreaAdd(area) {}
function onFilterChange(filterType, value) {}
function calcularProgressoPorArea(area, processos) {}

// Constantes
const ESTÁGIOS = ['coleta', 'modelagem', 'valCOPS', 'corrCOPS', 'valCliente', 'corrCliente', 'analise']
const ESTÁGIO_LABELS = { coleta: 'Coleta', modelagem: 'Modelagem', ... }
```

### 9.2 Estrutura de Componente

```javascript
function ComponenteName({ prop1, prop2, onCallback }) {
  // Estado
  const [state, setState] = useState(null)
  
  // Effects
  useEffect(() => {}, [])
  
  // Funções internas
  function handleClick() {}
  
  // Lógica de renderização
  const filtered = useMemo(() => {}, [dep1, dep2])
  
  // Render
  return (
    <div>...</div>
  )
}
```

### 9.3 Tratamento de Erros

```javascript
async function handleSave() {
  try {
    setError('')
    setLoading(true)
    await dbAddArea(formData)
    // Success
    setFormData(emptyArea)
    refreshAreas()
  } catch(e) {
    setError('Erro ao salvar. Tente novamente.')
    console.error(e)
  } finally {
    setLoading(false)
  }
}
```

---

## 10. CHECKLIST DE IMPLEMENTAÇÃO

### Banco de Dados
- [ ] Criar tabela `areas`
- [ ] Seed de áreas
- [ ] Testar queries básicas no Supabase
- [ ] Adicionar funções ao `supabase.js`

### Componentes
- [ ] `DashboardSocio` (função principal)
- [ ] `FilterPanel` (sub-componente)
- [ ] `AreaCard` (sub-componente)
- [ ] `GerenciadorAreas` (integrado em Configurações)
- [ ] `AreaForm` (create/edit)
- [ ] `AreaList` (visualização)

### Lógica de Negócio
- [ ] Funções de cálculo (pct, contagem)
- [ ] Funções de filtro
- [ ] Funções de agrupamento
- [ ] Validações de regra

### Integração
- [ ] Integrar filtros ao App
- [ ] Integrar gerenciador ao tab Configurações
- [ ] Adicionar rota/tab Dashboard para sócio
- [ ] Testar auth para cada role

### Testes
- [ ] Testes manuais de filtros
- [ ] Testes de CRUD de áreas
- [ ] Testes de validação
- [ ] Testes de responsividade
- [ ] Testes de performance

### Documentação
- [ ] Documentar schema SQL
- [ ] Documentar componentes
- [ ] Documentar funções de lógica
- [ ] Atualizar README

---

## 11. DEPENDÊNCIAS E RISCOS

### Dependências
- ✓ Stack React/Supabase já existente
- ✓ Padrões de componente já estabelecidos
- ✓ Dados de processos já estruturados
- ✗ Migração de dados (se mudança no schema)

### Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Performance com muitos processos | Alto | Usar `useMemo` para filtros, paginar tabela |
| Inconsistência de áreas | Médio | Validar áreas ao salvar processo |
| Deletar área com processos | Alto | Implementar validação antes de deletar |
| Feedback visual lento | Médio | Adicionar loading states, debounce |

---

## 12. EXEMPLOS DE CÓDIGO

### 12.1 Função de Cálculo

```javascript
function calcularPct(processo) {
  const STAGE_KEYS = ['coleta', 'modelagem', 'valCOPS', 'corrCOPS', 'valCliente', 'corrCliente', 'analise']
  const completados = STAGE_KEYS.filter(s => processo[s]).length
  return Math.round((completados / STAGE_KEYS.length) * 100)
}

// Uso
const pct = calcularPct(processo) // 71%
```

### 12.2 Função de Filtro

```javascript
function filtrarProcessos(processos, selectedAreas, selectedStages) {
  let resultado = processos
  
  // Filtrar por área
  if (selectedAreas.length > 0) {
    resultado = resultado.filter(p =>
      p.area && p.area.some(a => selectedAreas.includes(a))
    )
  }
  
  // Filtrar por estágio (AND — todas as selecionadas)
  const stagesToFilter = Object.entries(selectedStages)
    .filter(([_, selected]) => selected)
    .map(([stage]) => stage)
  
  if (stagesToFilter.length > 0) {
    resultado = resultado.filter(p =>
      stagesToFilter.every(s => p[s])
    )
  }
  
  return resultado
}

// Uso
const filtrados = filtrarProcessos(processos, ['Comercial', 'RH'], { coleta: true, modelagem: true })
```

### 12.3 Componente DashboardSocio (skeleton)

```javascript
function DashboardSocio({ processos, areas }) {
  const [selectedAreas, setSelectedAreas] = useState([])
  const [selectedStages, setSelectedStages] = useState({})
  
  const filtrados = useMemo(() => {
    return filtrarProcessos(processos, selectedAreas, selectedStages)
  }, [processos, selectedAreas, selectedStages])
  
  const statsPerArea = useMemo(() => {
    return agruparPorAreaComStats(filtrados, areas)
  }, [filtrados, areas])
  
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 500, marginBottom: '1rem' }}>
        Dashboard
      </div>
      
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <FilterPanel
          areas={areas}
          selectedAreas={selectedAreas}
          onAreasChange={setSelectedAreas}
          selectedStages={selectedStages}
          onStagesChange={setSelectedStages}
        />
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {Object.values(statsPerArea).map(stat => (
              <AreaCard key={stat.nome} stat={stat} />
            ))}
          </div>
          
          <ProcessosTable processos={filtrados} />
        </div>
      </div>
    </div>
  )
}
```

---

## 13. PRÓXIMOS PASSOS

1. **Validar com Product Owner**
   - Confirmar estágios mapeados
   - Confirmar campos de área
   - Confirmar permissões por role

2. **Preparar branch**
   - `git checkout -b feat/dashboard-areas`
   - Criar commits atômicos por feature

3. **Começar Fase 1**
   - Criar migration SQL
   - Testar no Supabase (dev)
   - Atualizar `supabase.js`

4. **Code Review**
   - Revisar schema antes de commit
   - Revisar componentes antes de merge

---

## 14. REFERÊNCIAS

- **Dados atuais:** `supabase-setup-v2.sql`
- **App principal:** `src/App.jsx` (2107 linhas)
- **Supabase client:** `src/supabase.js`
- **Stack:** React 18, Vite 8.1, Supabase 2.108
