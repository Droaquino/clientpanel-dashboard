# Especificações Técnicas Detalhadas

**Documento complementar ao PLANO_ARQUITETURA.md**

---

## 1. DIAGRAMA DE ENTIDADES E RELACIONAMENTOS

### 1.1 Modelo de Dados (ER Diagram)

```
┌─────────────────────┐
│     usuarios        │
├─────────────────────┤
│ id (PK)             │
│ nome                │
│ email               │
│ role (FK→grupos)    │
│ grupo               │
│ status              │
│ senha_custom        │
│ created_at          │
└────────┬────────────┘
         │
         │ (auth)
         │
    ┌────▼──────────────────────────────┐
    │       APLICAÇÃO                   │
    │  (React + State Management)       │
    └────┬──────────────────────────────┘
         │
    ┌────┴──────────────────────────────┐
    │                                   │
┌───▼────────────────┐    ┌────────────▼──────────┐
│     areas (NEW)    │    │      processos       │
├────────────────────┤    ├──────────────────────┤
│ id (PK)            │    │ id (PK)              │
│ data JSONB:        │    │ data JSONB:          │
│  - nome *required* │    │  - num               │
│  - descricao       │    │  - nome              │
│  - ativa           │    │  - area FK→areas     │
│ created_at         │    │  - comQuem           │
│ updated_at         │    │  - consultor         │
└────────────────────┘    │  - formato           │
     ▲                    │  - coleta (bool)     │
     │ 1:N                │  - modelagem (bool)  │
     │ (referenced by)    │  - valCOPS (bool)    │
     │                    │  - corrCOPS (bool)   │
     │                    │  - valCliente (bool) │
     │                    │  - corrCliente (bool)│
     └────────────────────┤  - analise (bool)    │
                          │  - confirmed         │
                          │  - comentarios       │
                          │ created_at           │
                          └──────────────────────┘
```

### 1.2 Tabela: areas (Detalhes)

```sql
CREATE TABLE areas (
  id BIGSERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices (opcional, para performance)
CREATE INDEX idx_areas_nome ON areas USING GIN(data);
```

**JSONB Structure:**
```json
{
  "nome": "Comercial",
  "descricao": "Área de vendas e atendimento",
  "ativa": true
}
```

**Validações (Frontend):**
- `nome`: 3-50 caracteres, sem duplicatas
- `descricao`: 0-200 caracteres
- `ativa`: boolean

---

## 2. FLUXO DE ESTADO (State Management)

### 2.1 Estado Global da Aplicação

```javascript
// App.jsx - useState hooks
const [user, setUser]                    = useState(null)          // usuário logado
const [colaboradores, setColaboradores]  = useState([])
const [consultores, setConsultores]      = useState([])
const [eventos, setEventos]              = useState([])
const [processos, setProcessos]          = useState([])
const [areas, setAreas]                  = useState([])            // NEW

// Loading states
const [loadingProcessos, setLoadingProcessos] = useState(false)
const [loadingAreas, setLoadingAreas]         = useState(false)    // NEW
```

### 2.2 Fluxo de Inicialização

```javascript
useEffect(() => {
  async function loadData() {
    try {
      setLoadingProcessos(true)
      setLoadingAreas(true)
      
      const [p, a, c, co] = await Promise.all([
        dbGetProcessos(),
        dbGetAreas(),      // NEW
        dbGetColaboradores(),
        dbGetConsultores()
      ])
      
      setProcessos(p)
      setAreas(a)         // NEW
      setColaboradores(c)
      setConsultores(co)
    } catch(e) {
      console.error('Erro ao carregar dados:', e)
      // setError('Erro ao carregar. Tente novamente.')
    } finally {
      setLoadingProcessos(false)
      setLoadingAreas(false)
    }
  }
  
  loadData()
}, [])
```

### 2.3 Estado Local do Dashboard Sócio

```javascript
// DashboardSocio.jsx
function DashboardSocio({ processos, areas, user }) {
  // Filtros
  const [selectedAreas, setSelectedAreas] = useState([])
  const [selectedStages, setSelectedStages] = useState({
    coleta: false,
    modelagem: false,
    valCOPS: false,
    corrCOPS: false,
    valCliente: false,
    corrCliente: false,
    analise: false
  })
  
  // UI state
  const [sortBy, setSortBy] = useState('area')        // 'area', 'nome', 'pct'
  const [viewMode, setViewMode] = useState('cards')   // 'cards', 'table'
  
  // Derived state (computado com useMemo)
  const filtrados = useMemo(() => {
    return filtrarProcessos(processos, selectedAreas, selectedStages)
  }, [processos, selectedAreas, selectedStages])
  
  const statsPerArea = useMemo(() => {
    return agruparPorAreaComStats(filtrados, areas)
  }, [filtrados, areas])
}
```

### 2.4 Estado Local do Gerenciador de Áreas

```javascript
// GerenciadorAreas.jsx
function GerenciadorAreas({ areas, processos, onAdd, onUpdate, onDelete }) {
  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    ativa: true
  })
  
  // Validation
  const [errors, setErrors] = useState({})
  
  // Loading
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(null)  // id do item sendo deletado
  
  // UI
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('nome')  // 'nome', 'ativa', 'data'
}
```

---

## 3. COMPONENTES DETALHADOS

### 3.1 DashboardSocio — Implementação Completa

```javascript
import { BarChart2, ChevronDown, Check, X } from 'lucide-react'
import { BRAND, BRAND_LIGHT, BRAND_MID, ACCENT } from './theme'

const STAGE_KEYS = [
  { key: 'coleta', label: 'Coleta' },
  { key: 'modelagem', label: 'Modelagem' },
  { key: 'valCOPS', label: 'Val. COPS' },
  { key: 'corrCOPS', label: 'Corr. COPS' },
  { key: 'valCliente', label: 'Val. Cliente' },
  { key: 'corrCliente', label: 'Corr. Cliente' },
  { key: 'analise', label: 'Análise Crítica' }
]

function DashboardSocio({ processos, areas, user }) {
  const [selectedAreas, setSelectedAreas] = useState([])
  const [selectedStages, setSelectedStages] = useState(
    Object.fromEntries(STAGE_KEYS.map(s => [s.key, false]))
  )
  const [sortBy, setSortBy] = useState('area')
  
  // Aplicar filtros
  const filtrados = useMemo(() => {
    let result = processos
    
    // Filtro por áreas
    if (selectedAreas.length > 0) {
      result = result.filter(p => p.area?.some(a => selectedAreas.includes(a)))
    }
    
    // Filtro por estágios (AND — todos selecionados)
    const stagesToFilter = Object.entries(selectedStages)
      .filter(([_, v]) => v)
      .map(([k]) => k)
    
    if (stagesToFilter.length > 0) {
      result = result.filter(p => stagesToFilter.every(s => p[s]))
    }
    
    // Ordenação
    if (sortBy === 'area') {
      result = result.sort((a, b) => (a.area?.[0] || '').localeCompare(b.area?.[0] || ''))
    } else if (sortBy === 'pct') {
      result = result.sort((a, b) => calcularPct(b) - calcularPct(a))
    }
    
    return result
  }, [processos, selectedAreas, selectedStages, sortBy])
  
  // Estatísticas por área
  const statsPerArea = useMemo(() => {
    const stats = {}
    areas.forEach(area => {
      const processosArea = filtrados.filter(p => p.area?.includes(area.nome))
      stats[area.nome] = {
        area,
        total: processosArea.length,
        processos: processosArea,
        porEstágio: Object.fromEntries(
          STAGE_KEYS.map(s => [s.key, processosArea.filter(p => p[s.key]).length])
        ),
        pctMédio: processosArea.length > 0
          ? Math.round(processosArea.reduce((acc, p) => acc + calcularPct(p), 0) / processosArea.length)
          : 0
      }
    })
    return Object.values(stats).filter(s => s.total > 0)
  }, [filtrados, areas])
  
  function handleLimparFiltros() {
    setSelectedAreas([])
    setSelectedStages(Object.fromEntries(STAGE_KEYS.map(s => [s.key, false])))
    setSortBy('area')
  }
  
  const temFiltros = selectedAreas.length > 0 || Object.values(selectedStages).some(v => v)
  
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 500, color: '#111', marginBottom: '.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <BarChart2 size={20} strokeWidth={1.8} style={{ color: BRAND }} />
        Dashboard
      </div>
      <div style={{ fontSize: 12, color: '#888', marginBottom: '1.5rem' }}>
        Visualize o progresso dos processos por área
      </div>
      
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        {/* PAINEL DE FILTROS */}
        <div style={{
          width: 220,
          flexShrink: 0,
          background: '#fff',
          border: '0.5px solid #e2e8e4',
          borderRadius: 12,
          padding: '1.25rem',
          height: 'fit-content'
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: BRAND, marginBottom: '1rem' }}>
            Filtros
          </div>
          
          {/* Áreas */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#555', marginBottom: '.5rem', textTransform: 'uppercase' }}>
              Áreas
            </div>
            {areas.map(area => (
              <label key={area.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: '.5rem',
                fontSize: 12,
                cursor: 'pointer',
                userSelect: 'none'
              }}>
                <input
                  type="checkbox"
                  checked={selectedAreas.includes(area.nome)}
                  onChange={e => {
                    if (e.target.checked) {
                      setSelectedAreas(a => [...a, area.nome])
                    } else {
                      setSelectedAreas(a => a.filter(x => x !== area.nome))
                    }
                  }}
                  style={{ accentColor: BRAND, width: 14, height: 14 }}
                />
                <span>{area.nome}</span>
                <span style={{ fontSize: 10, color: '#bbb', marginLeft: 'auto' }}>
                  {processos.filter(p => p.area?.includes(area.nome)).length}
                </span>
              </label>
            ))}
          </div>
          
          {/* Estágios */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#555', marginBottom: '.5rem', textTransform: 'uppercase' }}>
              Estágios
            </div>
            {STAGE_KEYS.map(stage => (
              <label key={stage.key} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: '.5rem',
                fontSize: 12,
                cursor: 'pointer',
                userSelect: 'none'
              }}>
                <input
                  type="checkbox"
                  checked={selectedStages[stage.key]}
                  onChange={e => {
                    setSelectedStages(s => ({ ...s, [stage.key]: e.target.checked }))
                  }}
                  style={{ accentColor: BRAND, width: 14, height: 14 }}
                />
                <span>{stage.label}</span>
              </label>
            ))}
          </div>
          
          {/* Botão Limpar */}
          {temFiltros && (
            <button onClick={handleLimparFiltros} style={{
              width: '100%',
              padding: '6px 10px',
              fontSize: 11,
              border: `0.5px solid ${BRAND_BRD}`,
              borderRadius: 7,
              background: BRAND_LIGHT,
              color: BRAND,
              cursor: 'pointer',
              fontWeight: 500
            }}>
              Limpar filtros
            </button>
          )}
        </div>
        
        {/* CONTEÚDO PRINCIPAL */}
        <div style={{ flex: 1 }}>
          {/* Resumo */}
          <div style={{
            background: BRAND_LIGHT,
            border: `0.5px solid ${BRAND_BRD}`,
            borderRadius: 12,
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: BRAND }}>
                {filtrados.length} processos {temFiltros ? 'encontrados' : 'no total'}
              </div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                Média de progresso: {
                  filtrados.length > 0
                    ? Math.round(filtrados.reduce((acc, p) => acc + calcularPct(p), 0) / filtrados.length)
                    : 0
                }%
              </div>
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
              fontSize: 11,
              padding: '5px 8px',
              border: `0.5px solid ${BRAND_BRD}`,
              borderRadius: 6,
              background: '#fff',
              cursor: 'pointer'
            }}>
              <option value="area">Ordenar por: Área</option>
              <option value="nome">Ordenar por: Nome</option>
              <option value="pct">Ordenar por: Progresso</option>
            </select>
          </div>
          
          {/* Cards por Área */}
          {statsPerArea.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2rem'
            }}>
              {statsPerArea.map(stat => (
                <AreaCard key={stat.area.id} stat={stat} />
              ))}
            </div>
          ) : (
            <div style={{
              background: '#fff',
              border: '0.5px solid #e2e8e4',
              borderRadius: 12,
              padding: '2rem',
              textAlign: 'center',
              color: '#bbb',
              fontSize: 13,
              marginBottom: '2rem'
            }}>
              Nenhum processo encontrado com os filtros selecionados.
            </div>
          )}
          
          {/* Tabela de Processos */}
          <div style={{
            background: '#fff',
            border: '0.5px solid #e2e8e4',
            borderRadius: 12,
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1rem 1.25rem',
              background: BRAND_LIGHT,
              borderBottom: '0.5px solid #e2e8e4',
              fontSize: 13,
              fontWeight: 600,
              color: BRAND
            }}>
              Processos {temFiltros ? 'Filtrados' : 'Todos'}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 12
              }}>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid #e2e8e4' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: '#666' }}>#</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: '#666' }}>Nome</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: '#666' }}>Área</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 500, color: '#666' }}>Progresso</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: '#666' }}>Estágio Atual</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(proc => {
                    const pct = calcularPct(proc)
                    const estágioAtual = STAGE_KEYS
                      .filter(s => proc[s.key])
                      .pop()?.label || 'Não iniciado'
                    
                    return (
                      <tr key={proc.id} style={{
                        borderBottom: '0.5px solid #f0f0f0',
                        '&:hover': { background: '#f9f9f9' }
                      }}>
                        <td style={{ padding: '10px 12px', color: '#888' }}>{proc.num}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 500, color: '#111' }}>
                          {proc.nome}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#555' }}>
                          {proc.area?.[0] || '—'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{
                            background: '#f0f0f0',
                            borderRadius: 4,
                            height: 6,
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${pct}%`,
                              height: '100%',
                              background: pct === 100 ? '#16A34A' : pct >= 70 ? BRAND : pct >= 40 ? ACCENT : '#E24B4A',
                              transition: 'width .3s'
                            }} />
                          </div>
                          <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                            {pct}%
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 11, color: BRAND_MID }}>
                          {estágioAtual}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardSocio
```

### 3.2 AreaCard — Sub-componente

```javascript
function AreaCard({ stat }) {
  const pct = stat.pctMédio
  const STAGE_KEYS = ['coleta', 'modelagem', 'valCOPS', 'corrCOPS', 'valCliente', 'corrCliente', 'analise']
  
  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid #e2e8e4',
      borderRadius: 12,
      padding: '1.25rem',
      boxShadow: '0 1px 3px rgba(0,0,0,.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: '.75rem'
    }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>
          {stat.area.nome}
        </div>
        <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
          {stat.total} processo{stat.total !== 1 ? 's' : ''}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6
        }}>
          <span style={{ fontSize: 11, color: '#666' }}>Progresso Médio</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: BRAND }}>{pct}%</span>
        </div>
        <div style={{
          background: '#f0f0f0',
          borderRadius: 6,
          height: 8,
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${pct}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${BRAND} 0%, ${BRAND_MID} 100%)`,
            transition: 'width .3s ease'
          }} />
        </div>
      </div>
      
      {/* Estágios */}
      <div style={{
        fontSize: 11,
        display: 'grid',
        gap: 6,
        marginTop: '.5rem'
      }}>
        {STAGE_KEYS.map((key, i) => {
          const count = stat.porEstágio[key]
          const pctStage = stat.total > 0 ? Math.round((count / stat.total) * 100) : 0
          return (
            <div key={key} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span style={{ width: 90, color: '#666', fontSize: 10 }}>
                {STAGE_LABELS[key]}
              </span>
              <div style({
                flex: 1,
                height: 4,
                background: '#e2e8e4',
                borderRadius: 2,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${pctStage}%`,
                  height: '100%',
                  background: BRAND_MID,
                  transition: 'width .3s'
                }} />
              </div>
              <span style={{ width: 28, textAlign: 'right', color: '#888', fontSize: 10 }}>
                {count}/{stat.total}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

---

## 4. FUNCIONES SUPABASE DETALHADAS

### 4.1 Arquivo: src/supabase.js (Adições)

```javascript
// ─── Áreas (NEW) ──────────────────────────────────────
export const dbGetAreas      = ()        => getAll('areas')
export const dbAddArea       = obj       => addOne('areas', obj)
export const dbSaveArea      = (id, obj) => saveOne('areas', id, obj)
export const dbDeleteArea    = id        => delOne('areas', id)

// ─── Helper para validar se area pode ser deletada ────
export async function dbCheckAreaUsage(areaNome, processos) {
  const count = processos.filter(p => p.area?.includes(areaNome)).length
  return count
}
```

### 4.2 SQL Migration

```sql
-- Criar tabela areas
CREATE TABLE IF NOT EXISTS areas (
  id BIGSERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Desabilitar RLS (mesmo padrão das outras tabelas)
ALTER TABLE areas DISABLE ROW LEVEL SECURITY;

-- Seed de dados (baseado em processos existentes)
INSERT INTO areas (data) VALUES
  ('{"nome":"Comercial","descricao":"Área de vendas e atendimento ao cliente","ativa":true}'),
  ('{"nome":"Financeiro","descricao":"Gestão financeira e contábil","ativa":true}'),
  ('{"nome":"RH","descricao":"Recursos Humanos e gestão de pessoas","ativa":true}'),
  ('{"nome":"Compras","descricao":"Gestão de fornecedores e compras","ativa":true}'),
  ('{"nome":"Marketing","descricao":"Marketing e comunicação","ativa":true}'),
  ('{"nome":"Operações","descricao":"Operações gerais e logística","ativa":true}'),
  ('{"nome":"Gerência","descricao":"Gerência geral e administração","ativa":true}');

-- Criar índice para melhorar queries (opcional)
CREATE INDEX idx_areas_nome ON areas USING GIN(data);
```

---

## 5. VALIDAÇÕES E REGRAS DE NEGÓCIO

### 5.1 Validações de Área

```javascript
function validarArea(area) {
  const erros = {}
  
  if (!area.nome || area.nome.trim().length === 0) {
    erros.nome = 'Nome é obrigatório'
  } else if (area.nome.trim().length < 3) {
    erros.nome = 'Nome deve ter pelo menos 3 caracteres'
  } else if (area.nome.trim().length > 50) {
    erros.nome = 'Nome não pode exceder 50 caracteres'
  }
  
  if (area.descricao && area.descricao.length > 200) {
    erros.descricao = 'Descrição não pode exceder 200 caracteres'
  }
  
  if (typeof area.ativa !== 'boolean') {
    erros.ativa = 'Status inválido'
  }
  
  return erros
}

function validarAreaDuplicata(nome, areas, editingId) {
  return areas.some(a => 
    a.nome.toLowerCase() === nome.toLowerCase() && a.id !== editingId
  )
}

function validarDeletarArea(areaNome, processos) {
  const count = processos.filter(p => p.area?.includes(areaNome)).length
  if (count > 0) {
    return {
      permitido: false,
      mensagem: `Não é possível deletar. Existem ${count} processo(s) nesta área.`
    }
  }
  return { permitido: true }
}
```

### 5.2 Regras de Negócio (Dashboard)

```javascript
// Filtro por áreas: OR lógico (mostrar se QUALQUER área selecionada)
function filtrarPorAreas(processos, areasSelecionadas) {
  if (!areasSelecionadas || areasSelecionadas.length === 0) return processos
  return processos.filter(p =>
    p.area && p.area.some(a => areasSelecionadas.includes(a))
  )
}

// Filtro por estágios: AND lógico (mostrar se TODOS os estágios selecionados)
function filtrarPorEstágios(processos, estágiosSelecionados) {
  const estadgiosAtivos = Object.entries(estágiosSelecionados)
    .filter(([_, selecionado]) => selecionado)
    .map(([estágio]) => estágio)
  
  if (estadgiosAtivos.length === 0) return processos
  
  return processos.filter(p =>
    estadgiosAtivos.every(e => p[e] === true)
  )
}

// Combinar filtros
function filtrarProcessos(processos, areasSelecionadas, estágiosSelecionados) {
  let resultado = processos
  resultado = filtrarPorAreas(resultado, areasSelecionadas)
  resultado = filtrarPorEstágios(resultado, estágiosSelecionados)
  return resultado
}
```

---

## 6. TESTES E CASOS DE USO

### 6.1 Teste: Criar Área

```javascript
// Caso de sucesso
const novaArea = { nome: 'Logística', descricao: 'Gestão de logística', ativa: true }
const errors = validarArea(novaArea)
expect(errors).toEqual({})
expect(validarAreaDuplicata(novaArea.nome, areas, null)).toBe(false)
// → dbAddArea(novaArea)

// Caso: Nome vazio
const areaInvalida = { nome: '', descricao: '', ativa: true }
const errors = validarArea(areaInvalida)
expect(errors.nome).toBeDefined()

// Caso: Nome duplicado
const areaDuplica = { nome: 'Comercial', ... }
expect(validarAreaDuplicata(areaDuplica.nome, areas, null)).toBe(true)
// → Error: Área com este nome já existe
```

### 6.2 Teste: Deletar Área

```javascript
// Caso: Área com 0 processos
const areaVazia = areas[0]
const validacao = validarDeletarArea(areaVazia.nome, processos)
expect(validacao.permitido).toBe(true)
// → dbDeleteArea(areaVazia.id)

// Caso: Área com N processos
const areaComProcessos = areas[1]
const validacao = validarDeletarArea(areaComProcessos.nome, processos)
expect(validacao.permitido).toBe(false)
expect(validacao.mensagem).toContain('N processo(s)')
// → Error: Não é possível deletar. Existem N processos nesta área.
// → Oferecer: [Desativar] [Cancelar]
```

### 6.3 Teste: Dashboard Filtros

```javascript
// Caso: Sem filtros
const resultado = filtrarProcessos(processos, [], {})
expect(resultado.length).toBe(processos.length)

// Caso: Filtro por 1 área
const resultado = filtrarProcessos(processos, ['Comercial'], {})
expect(resultado.every(p => p.area?.includes('Comercial'))).toBe(true)

// Caso: Filtro por 2+ áreas (OR)
const resultado = filtrarProcessos(processos, ['Comercial', 'RH'], {})
expect(resultado.every(p => 
  p.area?.includes('Comercial') || p.area?.includes('RH')
)).toBe(true)

// Caso: Filtro por estágio
const resultado = filtrarProcessos(processos, [], { coleta: true })
expect(resultado.every(p => p.coleta === true)).toBe(true)

// Caso: Filtro por 2 estágios (AND)
const resultado = filtrarProcessos(processos, [], { coleta: true, modelagem: true })
expect(resultado.every(p => p.coleta && p.modelagem)).toBe(true)

// Caso: Filtro combinado (Áreas: OR, Estágios: AND)
const resultado = filtrarProcessos(processos, ['Comercial', 'RH'], { coleta: true, modelagem: true })
expect(resultado.every(p => 
  (p.area?.includes('Comercial') || p.area?.includes('RH')) && p.coleta && p.modelagem
)).toBe(true)
```

---

## 7. PERFORMANCE E OTIMIZAÇÕES

### 7.1 useMemo para Filtros

```javascript
// ❌ INEFICIENTE (recalcula a cada render)
const filtrados = filtrarProcessos(processos, selectedAreas, selectedStages)

// ✓ EFICIENTE (recalcula apenas quando dependências mudam)
const filtrados = useMemo(() => {
  return filtrarProcessos(processos, selectedAreas, selectedStages)
}, [processos, selectedAreas, selectedStages])
```

### 7.2 useCallback para Handlers

```javascript
// Evitar recreação de funções a cada render
const handleAreaAdd = useCallback(async (area) => {
  try {
    const newArea = await dbAddArea(area)
    setAreas(a => [...a, newArea])
  } catch(e) {
    setError('Erro ao adicionar área')
  }
}, [])

// Usar em onClick={handleAreaAdd}
```

### 7.3 Paginação de Tabela (Futura Otimização)

```javascript
// Se houver >100 processos, implementar paginação
const ITEMS_PER_PAGE = 20
const [currentPage, setCurrentPage] = useState(1)

const paginados = useMemo(() => {
  const start = (currentPage - 1) * ITEMS_PER_PAGE
  return filtrados.slice(start, start + ITEMS_PER_PAGE)
}, [filtrados, currentPage])

const totalPages = Math.ceil(filtrados.length / ITEMS_PER_PAGE)
```

---

## 8. INTEGRAÇÃO NO APP.JSX

### 8.1 Estrutura de Tabs (Modificação)

```javascript
// Adicionar novo tab para sócio
const items = allItems.filter(i => i.roles.includes(role))

// allItems já contém:
const allItems = [
  { id: 'dashboard', icon: ..., label: 'Dashboard', roles: ['coordenador','consultor','socio'] }, // MODIFICAR
  { id: 'agenda', ... },
  { id: 'levantamento', ... },
  { id: 'processos', ... },
  { id: 'configuracoes', ... }
]

// Renderização condicional
if (tab === 'dashboard' && user.role === 'socio') {
  return <DashboardSocio processos={processos} areas={areas} user={user} />
}

// Ou usar componente separado
if (tab === 'dashboard') {
  return user.role === 'coordenador' || user.role === 'consultor'
    ? <DashboardGestao {...props} />
    : <DashboardSocio {...props} />
}
```

### 8.2 Integração em Configurações

```javascript
// Dentro de Configuracoes()
function Configuracoes({ ... areas, onAreaAdd, onAreaUpdate, onAreaDelete, user }) {
  const isCoord = user?.role === 'coordenador'
  
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 500, color: '#111', marginBottom: '.2rem' }}>
        Configurações
      </div>
      
      {isCoord && <SolicitacoesPendentes />}
      {isCoord && <GerarConvites />}
      {isCoord && (
        <GerenciadorAreas
          areas={areas}
          processos={processos}
          onAdd={onAreaAdd}
          onUpdate={onAreaUpdate}
          onDelete={onAreaDelete}
        />
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <PeopleSection ... />
        <PeopleSection ... />
      </div>
    </div>
  )
}
```

---

## 9. CHECKLISTS DE IMPLEMENTAÇÃO

### 9.1 Database
- [ ] Executar migration SQL (criar tabela areas)
- [ ] Inserir seed de áreas
- [ ] Testar queries via Supabase console
- [ ] Validar estrutura JSONB

### 9.2 Backend (supabase.js)
- [ ] Adicionar dbGetAreas()
- [ ] Adicionar dbAddArea()
- [ ] Adicionar dbSaveArea()
- [ ] Adicionar dbDeleteArea()
- [ ] Adicionar dbCheckAreaUsage()
- [ ] Testar cada função

### 9.3 Frontend (Componentes)
- [ ] Criar DashboardSocio.jsx
- [ ] Criar GerenciadorAreas.jsx
- [ ] Criar AreaCard.jsx
- [ ] Criar FilterPanel.jsx
- [ ] Integrar em App.jsx

### 9.4 Lógica de Negócio
- [ ] Implementar calcularPct()
- [ ] Implementar contarPorEstágio()
- [ ] Implementar filtrarPorAreas()
- [ ] Implementar filtrarPorEstágios()
- [ ] Implementar filtrarProcessos()
- [ ] Implementar agruparPorAreaComStats()
- [ ] Implementar validarArea()
- [ ] Implementar validarAreaDuplicata()
- [ ] Implementar validarDeletarArea()

### 9.5 Testes Manuais
- [ ] Filtrar por 1 área
- [ ] Filtrar por múltiplas áreas
- [ ] Filtrar por 1 estágio
- [ ] Filtrar por múltiplos estágios
- [ ] Filtrar combinado (áreas + estágios)
- [ ] Limpar filtros
- [ ] Criar nova área
- [ ] Editar área
- [ ] Deletar área com 0 processos
- [ ] Tentar deletar área com processos (validação)
- [ ] Responsividade (mobile, tablet, desktop)

---

## 10. EXEMPLOS DE ESTADO APÓS IMPLEMENTAÇÃO

### Estado do App após carga

```javascript
{
  user: { id: 4, nome: 'DF Turismo', role: 'socio', ... },
  processos: [ ... 10 items ],
  areas: [
    { id: 1, nome: 'Comercial', descricao: '...', ativa: true },
    { id: 2, nome: 'Financeiro', descricao: '...', ativa: true },
    ...
  ],
  colaboradores: [ ... 6 items ],
  consultores: [ ... 2 items ]
}
```

### Estado do Dashboard Sócio

```javascript
{
  selectedAreas: ['Comercial', 'RH'],
  selectedStages: {
    coleta: true,
    modelagem: true,
    valCOPS: false,
    corrCOPS: false,
    valCliente: false,
    corrCliente: false,
    analise: false
  },
  sortBy: 'area',
  filtrados: [ 3 processos que atendem aos critérios ],
  statsPerArea: {
    'Comercial': { area: {...}, total: 2, pctMédio: 71, ... },
    'RH': { area: {...}, total: 1, pctMédio: 28, ... }
  }
}
```

---

**Fim do documento técnico. Revise com Product Owner antes de iniciar implementação.**
