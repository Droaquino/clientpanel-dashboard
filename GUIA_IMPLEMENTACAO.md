# Guia Rápido de Implementação

**Para iniciar a codificação — vá direto ao ponto**

---

## 1. SETUP INICIAL (30 min)

### 1.1 Branch e Database

```bash
# Criar branch
git checkout -b feat/dashboard-areas

# Backup do estado atual (opcional)
git stash

# Executar migration no Supabase
# Copie e execute o SQL abaixo no console do Supabase:
```

### 1.2 SQL para Executar

```sql
-- Copiar e executar no Supabase → SQL Editor

CREATE TABLE IF NOT EXISTS areas (
  id BIGSERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE areas DISABLE ROW LEVEL SECURITY;

INSERT INTO areas (data) VALUES
  ('{"nome":"Comercial","descricao":"Área de vendas e atendimento ao cliente","ativa":true}'),
  ('{"nome":"Financeiro","descricao":"Gestão financeira e contábil","ativa":true}'),
  ('{"nome":"RH","descricao":"Recursos Humanos e gestão de pessoas","ativa":true}'),
  ('{"nome":"Compras","descricao":"Gestão de fornecedores e compras","ativa":true}'),
  ('{"nome":"Marketing","descricao":"Marketing e comunicação","ativa":true}'),
  ('{"nome":"Operações","descricao":"Operações gerais e logística","ativa":true}'),
  ('{"nome":"Gerência","descricao":"Gerência geral e administração","ativa":true}');
```

**Validar:** Vá para Data Editor → areas → Confirmar que tem 7 registros

### 1.3 Atualizar supabase.js

```javascript
// Adicione ao final de src/supabase.js (após "Consultores")

// ─── Áreas ────────────────────────────────────────────
export const dbGetAreas      = ()        => getAll('areas')
export const dbAddArea       = obj       => addOne('areas', obj)
export const dbSaveArea      = (id, obj) => saveOne('areas', id, obj)
export const dbDeleteArea    = id        => delOne('areas', id)
```

**Validar:** Não deve haver erros de build. Testar no console:
```javascript
// No console do navegador (após login)
dbGetAreas().then(console.log) // Deve exibir array de 7 áreas
```

---

## 2. ADICIONAR ESTADO AO APP.JSX (15 min)

### 2.1 Imports

```javascript
// No topo do App.jsx, adicione ao import de supabase:
import {
  dbFindUsuario, dbGetSolicitacoes, dbAddSolicitacao, dbUpdateSolicitacao, dbAddUsuario,
  dbGetConvites, dbAddConvite, dbGetConvite, dbUsarConvite,
  dbGetEventos, dbAddEvento, dbSaveEvento, dbDeleteEvento,
  dbGetProcessos, dbAddProcesso, dbSaveProcesso, dbDeleteProcesso,
  dbGetColaboradores, dbAddColaborador, dbSaveColaborador, dbDeleteColaborador,
  dbGetConsultores, dbAddConsultor, dbSaveConsultor, dbDeleteConsultor,
  dbGetAreas, dbAddArea, dbSaveArea, dbDeleteArea, // ← ADICIONAR ESTA LINHA
} from './supabase'
```

### 2.2 Estado

```javascript
// Encontre a seção useState() em App (ao redor da linha 150-200)
// Adicione esta linha após as outras:

const [areas, setAreas] = useState([])  // ← ADICIONAR

// Exemplo de onde adicionar (ao lado de outras declarações):
const [user, setUser] = useState(null)
const [tab, setTab] = useState('dashboard')
const [colaboradores, setColaboradores] = useState([])
const [consultores, setConsultores] = useState([])
const [eventos, setEventos] = useState([])
const [processos, setProcessos] = useState([])
const [areas, setAreas] = useState([])  // ← AQUI
```

### 2.3 useEffect de Carregamento

```javascript
// Encontre a seção useEffect([]) que carrega dados
// (ao redor de linha 280-300)

// ANTES:
useEffect(() => {
  async function loadData() {
    const [p, c, co] = await Promise.all([
      dbGetProcessos(),
      dbGetColaboradores(),
      dbGetConsultores()
    ])
    setProcessos(p)
    setColaboradores(c)
    setConsultores(co)
  }
  loadData()
}, [])

// DEPOIS:
useEffect(() => {
  async function loadData() {
    const [p, a, c, co] = await Promise.all([  // ← ADICIONAR 'a'
      dbGetProcessos(),
      dbGetAreas(),  // ← ADICIONAR ESTA LINHA
      dbGetColaboradores(),
      dbGetConsultores()
    ])
    setProcessos(p)
    setAreas(a)  // ← ADICIONAR ESTA LINHA
    setColaboradores(c)
    setConsultores(co)
  }
  loadData()
}, [])
```

---

## 3. CRIAR COMPONENTES (3-4 horas)

### 3.1 Arquivo: src/components/DashboardSocio.jsx

```javascript
// Copie o código completo de ESPECIFICACOES_TECNICAS.md seção 3.1
// Salve como src/components/DashboardSocio.jsx
// Ajuste imports conforme necessário
```

**Checklist:**
- [ ] Arquivo criado
- [ ] Imports corretos
- [ ] Sem erros de compilação
- [ ] Componente renderiza sem crash

### 3.2 Arquivo: src/components/AreaCard.jsx

```javascript
// Copie o código de ESPECIFICACOES_TECNICAS.md seção 3.2
// Salve como src/components/AreaCard.jsx
```

### 3.3 Arquivo: src/components/GerenciadorAreas.jsx

```javascript
import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, AlertTriangle } from 'lucide-react'
import { BRAND, BRAND_LIGHT, BRAND_BRD, BRAND_MID } from '../theme' // Ajuste path

const labelSt = { fontSize: 11, color: '#666', marginBottom: 3, display: 'block' }
const inputSt = { width: '100%', padding: '6px 10px', fontSize: 13, border: '0.5px solid #ccc', borderRadius: 7, background: '#fafafa', color: '#111', outline: 'none' }

function GerenciadorAreas({ areas, processos, onAdd, onUpdate, onDelete, user }) {
  const isCoord = user?.role === 'coordenador'
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ nome: '', descricao: '', ativa: true })
  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  
  if (!isCoord) {
    return <div style={{ fontSize: 12, color: '#888', padding: '1rem' }}>Apenas coordenadores podem gerenciar áreas.</div>
  }
  
  function validarArea(area) {
    const erros = {}
    if (!area.nome || area.nome.trim().length === 0) {
      erros.nome = 'Nome é obrigatório'
    } else if (area.nome.trim().length < 3) {
      erros.nome = 'Mínimo 3 caracteres'
    } else if (area.nome.trim().length > 50) {
      erros.nome = 'Máximo 50 caracteres'
    }
    if (area.descricao && area.descricao.length > 200) {
      erros.descricao = 'Máximo 200 caracteres'
    }
    return erros
  }
  
  function temDuplicata(nome) {
    return areas.some(a => a.nome?.toLowerCase() === nome.toLowerCase() && a.id !== editingId)
  }
  
  function contarProcessosPorArea(areaNome) {
    return processos.filter(p => p.area?.includes(areaNome)).length
  }
  
  function handleStartNew() {
    setEditingId(null)
    setFormData({ nome: '', descricao: '', ativa: true })
    setErrors({})
    setShowForm(true)
  }
  
  function handleStartEdit(area) {
    setEditingId(area.id)
    setFormData({ nome: area.nome, descricao: area.descricao || '', ativa: area.ativa })
    setErrors({})
    setShowForm(true)
  }
  
  function handleCancel() {
    setShowForm(false)
    setEditingId(null)
  }
  
  async function handleSave() {
    const erros = validarArea(formData)
    if (temDuplicata(formData.nome)) {
      erros.nome = 'Área com este nome já existe'
    }
    
    if (Object.keys(erros).length > 0) {
      setErrors(erros)
      return
    }
    
    setIsSaving(true)
    try {
      if (editingId) {
        await onUpdate(editingId, formData)
      } else {
        await onAdd(formData)
      }
      handleCancel()
    } catch(e) {
      setErrors({ _form: 'Erro ao salvar. Tente novamente.' })
    } finally {
      setIsSaving(false)
    }
  }
  
  function handleDelete(area) {
    const count = contarProcessosPorArea(area.nome)
    if (count > 0) {
      setErrors({ _delete: `Existem ${count} processo(s) nesta área. Desative em vez de deletar.` })
      return
    }
    setDeletingId(area.id)
  }
  
  function confirmDelete() {
    if (deletingId) {
      onDelete(deletingId)
      setDeletingId(null)
    }
  }
  
  return (
    <div style={{ background: '#fff', border: '0.5px solid #e2e8e4', borderRadius: 14, overflow: 'hidden', marginBottom: '1.25rem', marginTop: '1.5rem' }}>
      <div style={{ padding: '1rem 1.25rem', background: BRAND_LIGHT, borderBottom: `0.5px solid ${BRAND_BRD}` }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: BRAND }}>Gerenciar Áreas</div>
        <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Configure as áreas da sua empresa</div>
      </div>
      
      <div style={{ padding: '1rem' }}>
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: BRAND, background: BRAND_LIGHT, padding: '3px 10px', borderRadius: 99 }}>
            {areas.length} área(s)
          </span>
          <button onClick={() => { setShowForm(s => !s); setEditingId(null); setDeletingId(null) }} style={{
            fontSize: 12, padding: '6px 13px', border: `0.5px solid ${BRAND}`, borderRadius: 8, cursor: 'pointer',
            background: showForm ? '#f0f0f0' : BRAND, color: showForm ? '#555' : '#fff', fontWeight: 500
          }}>
            {showForm ? <X size={13} style={{ display: 'inline', marginRight: 4 }} /> : <Plus size={12} style={{ display: 'inline', marginRight: 4 }} />}
            {showForm ? 'Cancelar' : 'Nova Área'}
          </button>
        </div>
        
        {/* Form */}
        {showForm && (
          <div style={{ background: '#FAFCFA', border: `1.5px solid ${BRAND_BRD}`, borderRadius: 12, padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelSt}>Nome <span style={{ color: '#E24B4A' }}>*</span></label>
                <input style={inputSt} value={formData.nome} placeholder="Ex: Logística" onChange={e => setFormData({ ...formData, nome: e.target.value })} />
                {errors.nome && <div style={{ fontSize: 11, color: '#A32D2D', marginTop: 3 }}>{errors.nome}</div>}
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelSt}>Descrição (opcional)</label>
                <textarea style={{ ...inputSt, minHeight: 60, resize: 'vertical' }} value={formData.descricao} placeholder="Descrição da área..." onChange={e => setFormData({ ...formData, descricao: e.target.value })} />
                {errors.descricao && <div style={{ fontSize: 11, color: '#A32D2D', marginTop: 3 }}>{errors.descricao}</div>}
              </div>
              <label style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', fontSize: 12 }}>
                <input type="checkbox" checked={formData.ativa} onChange={e => setFormData({ ...formData, ativa: e.target.checked })} style={{ accentColor: BRAND, width: 14, height: 14 }} />
                <span style={{ fontWeight: 500, color: BRAND }}>Ativa</span>
              </label>
            </div>
            {errors._form && <div style={{ fontSize: 11, color: '#A32D2D', marginBottom: '1rem' }}>{errors._form}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={handleCancel} style={{ fontSize: 12, padding: '6px 14px', border: '0.5px solid #ccc', borderRadius: 7, cursor: 'pointer', background: '#fff', color: '#666' }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={isSaving} style={{
                fontSize: 12, padding: '6px 16px', borderRadius: 7, fontWeight: 500,
                cursor: isSaving ? 'wait' : 'pointer',
                border: `0.5px solid ${BRAND}`,
                background: BRAND, color: '#fff'
              }}>
                {isSaving ? 'Salvando...' : editingId ? 'Atualizar' : 'Adicionar'}
              </button>
            </div>
          </div>
        )}
        
        {/* Lista */}
        {areas.length === 0 && !showForm && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#bbb', fontSize: 12 }}>
            Nenhuma área cadastrada. Clique em "Nova Área" para começar.
          </div>
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
          {areas.map(area => {
            const count = contarProcessosPorArea(area.nome)
            
            if (deletingId === area.id) {
              return (
                <div key={area.id} style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', borderRadius: 12, padding: '.9rem 1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, color: '#791F1F', flex: 1 }}>
                    Remover <strong>"{area.nome}"</strong>?
                  </span>
                  <button onClick={() => setDeletingId(null)} style={{ fontSize: 11, padding: '5px 10px', border: '0.5px solid #ccc', borderRadius: 6, cursor: 'pointer', background: '#fff', color: '#666' }}>
                    Cancelar
                  </button>
                  <button onClick={confirmDelete} style={{ fontSize: 11, padding: '5px 12px', border: '0.5px solid #A32D2D', borderRadius: 6, cursor: 'pointer', background: '#A32D2D', color: '#fff', fontWeight: 500 }}>
                    <Trash2 size={11} style={{ display: 'inline', marginRight: 4 }} />
                    Remover
                  </button>
                </div>
              )
            }
            
            if (editingId === area.id) {
              return null // Form cobre o edit
            }
            
            return (
              <div key={area.id} style={{ background: '#fff', border: '0.5px solid #e2e8e4', borderRadius: 12, padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: 12, justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{area.nome}</div>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: area.ativa ? BRAND_LIGHT : '#f0f0f0', color: area.ativa ? BRAND_MID : '#888' }}>
                      {area.ativa ? 'Ativa' : 'Inativa'}
                    </span>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: '#f0f0f0', color: '#666', marginLeft: 'auto' }}>
                      {count} processo(s)
                    </span>
                  </div>
                  {area.descricao && <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{area.descricao}</div>}
                </div>
                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                  <button onClick={() => handleStartEdit(area)} style={{ fontSize: 11, padding: '4px 9px', border: '0.5px solid #d0d0d0', borderRadius: 6, cursor: 'pointer', background: '#fff', color: '#555' }}>
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => handleDelete(area)} style={{ fontSize: 11, padding: '4px 9px', border: '0.5px solid #f5c6c6', borderRadius: 6, cursor: 'pointer', background: '#fff', color: '#A32D2D' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        
        {errors._delete && (
          <div style={{ marginTop: '1rem', background: '#FCEBEB', border: '0.5px solid #F7C1C1', borderRadius: 8, padding: '.75rem', display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#791F1F' }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Não é possível deletar</strong>
              <div style={{ marginTop: 4 }}>{errors._delete}</div>
              <button onClick={() => { const area = areas.find(a => a.id === editingId); if (area) handleStartEdit(area); setErrors({}) }} style={{ marginTop: 6, fontSize: 11, padding: '4px 10px', border: `0.5px solid #791F1F`, borderRadius: 4, background: 'transparent', color: '#791F1F', cursor: 'pointer', fontWeight: 500 }}>
                Desativar em vez de deletar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GerenciadorAreas
```

**Salvar como:** `src/components/GerenciadorAreas.jsx`

### 3.4 Arquivo: src/theme.js (Constants)

```javascript
// Criar novo arquivo src/theme.js (ou adicionar a App.jsx)

export const BRAND       = '#163828'
export const BRAND_MID   = '#2D6A4F'
export const BRAND_LIGHT = '#EBF4EF'
export const BRAND_BRD   = '#A8D0B8'
export const ACCENT      = '#D4AC3A'
export const ACCENT_LT   = '#FBF4DE'
```

---

## 4. INTEGRAR COMPONENTES (30 min)

### 4.1 Adicionar Imports em App.jsx

```javascript
// Após outros imports de componentes, adicione:
import DashboardSocio from './components/DashboardSocio'  // NEW
import GerenciadorAreas from './components/GerenciadorAreas'  // NEW
```

### 4.2 Renderizar DashboardSocio

```javascript
// Encontre a seção de renderização por tab (ao redor de linha 1000-1100)
// Adicione:

if (tab === 'dashboard' && user.role === 'socio') {
  return <DashboardSocio processos={processos} areas={areas} user={user} />
}

// Ou se houver um switch/if para cada tab:
case 'dashboard':
  if (user.role === 'socio') {
    return <DashboardSocio processos={processos} areas={areas} user={user} />
  } else {
    return <Dashboard ... /> // componente existente
  }
```

### 4.3 Integrar GerenciadorAreas em Configurações

```javascript
// Encontre a função Configuracoes() (ao redor de linha 880)
// Adicione handlers para áreas:

async function handleAreaAdd(area) {
  const newArea = await dbAddArea(area)
  setAreas(a => [...a, newArea])
}

async function handleAreaUpdate(id, area) {
  await dbSaveArea(id, area)
  setAreas(a => a.map(x => x.id === id ? { ...x, ...area } : x))
}

async function handleAreaDelete(id) {
  await dbDeleteArea(id)
  setAreas(a => a.filter(x => x.id !== id))
}

// Adicione antes dos PeopleSections:
{isCoord && (
  <GerenciadorAreas
    areas={areas}
    processos={processos}
    onAdd={handleAreaAdd}
    onUpdate={handleAreaUpdate}
    onDelete={handleAreaDelete}
    user={user}
  />
)}
```

### 4.4 Adicionar Tab "Dashboard" para Sócio

```javascript
// Encontre a seção de allItems na Sidebar (ao redor de linha 448)
// Modifique:

const allItems = [
  { id:'dashboard',    icon: <Icon ic={BarChart2} />, label:'Dashboard',     roles:['coordenador','consultor','socio'] }, // ← ADICIONAR 'socio'
  { id:'agenda',       icon: <Icon ic={Calendar} />, label:'Agenda',         roles:['coordenador','consultor'] },
  { id:'levantamento', icon: <Icon ic={ClipboardList} />, label:'Levantamento',   roles:['coordenador','consultor'] },
  { id:'processos',    icon: <Icon ic={FolderOpen} />,  label:'Processos',      roles:['coordenador','consultor','socio','cliente'] },
  { id:'configuracoes',icon: <Icon ic={Settings} />, label:'Configurações',  roles:['coordenador'] },
]
```

---

## 5. TESTES MANUAIS (15 min)

### 5.1 Login como Coordenador

1. Abrir app
2. Tab "Grupo Gestão" → Selecionar "Pedro Aquino" (coordenador)
3. Senha: `coord2024`
4. Entrar

### 5.2 Testar Gerenciador de Áreas

1. Ir para "Configurações"
2. Ver seção "Gerenciar Áreas"
3. Clicar "+ Nova Área"
4. Preencher:
   - Nome: "Logística" (novo)
   - Descrição: "Gestão de transportes"
   - Ativa: ✓
5. Clicar "Adicionar"
6. Validar que aparece na lista
7. Clicar editar → mudar descrição → "Atualizar"
8. Tentar deletar área SEM processos → deve funcionar
9. Tentar deletar área COM processos → deve mostrar erro

### 5.3 Login como Sócio

1. Logout
2. Abrir app
3. Tab "Acesso Cliente" → Tipo: "Sócio"
4. Senha: `socio2024`
5. Entrar

### 5.4 Testar Dashboard

1. Ver novo tab "Dashboard" (já deve estar selecionado)
2. Ver cards com áreas
3. Filtrar por "Comercial" → deve reduzir processos
4. Filtrar por estágio "Coleta" → deve filtrar
5. Combinar filtros → verificar lógica
6. Clicar "Limpar filtros" → volta ao normal
7. Mudar "Ordenar por" → verificar mudança
8. Tabela deve atualizar com filtros

### 5.5 Validações

- ✓ Sem áreas selecionadas = mostrar todos
- ✓ Sem estágios selecionados = mostrar todos
- ✓ Múltiplas áreas = OR (mostrar se em qualquer uma)
- ✓ Múltiplos estágios = AND (mostrar se em todos)
- ✓ Dashboard desaparece se usuário não é sócio/coordenador

---

## 6. DEPLOY (10 min)

### 6.1 Local Build

```bash
npm run build
npm run preview

# Testar no http://localhost:4173
```

### 6.2 Deploy no Vercel

```bash
# Se não tiver Vercel CLI:
# npm install -g vercel

vercel --prod

# Ou simplesmente fazer push e deixar auto-deploy:
git add .
git commit -m "feat: adicionar dashboard de sócio e gerenciador de áreas"
git push origin feat/dashboard-areas

# Criar PR no GitHub
# Após aprovação, mergear em main
# Vercel fará deploy automático
```

---

## 7. TROUBLESHOOTING

### Erro: "dbGetAreas is not a function"

**Solução:** Verificar se foi adicionado import em App.jsx e export em supabase.js

```javascript
// Verificar supabase.js tem:
export const dbGetAreas = () => getAll('areas')

// Verificar App.jsx tem:
import { ..., dbGetAreas, ... } from './supabase'
```

### Erro: "Tabela 'areas' não existe"

**Solução:** Executar SQL migration no Supabase console

```
Supabase → SQL Editor → Novo Query → Copiar SQL → Executar
```

### Dados de áreas não aparecem

**Solução:** Aguarde 2-3 segundos após refresh. Se persistir:

```javascript
// No console do navegador:
localStorage.clear()
window.location.reload()

// Ou verificar se dbGetAreas() retorna dados:
dbGetAreas().then(a => console.log('Áreas:', a))
```

### Filtros não funcionam

**Solução:** Verificar console para erros. Validar que:
- Estado `selectedAreas` está sendo atualizado
- useMemo tem dependências corretas
- Função `filtrarProcessos` está recebendo parâmetros

```javascript
// Adicionar ao DashboardSocio:
console.log('selectedAreas:', selectedAreas)
console.log('selectedStages:', selectedStages)
console.log('filtrados:', filtrados)
```

---

## 8. PRÓXIMAS MELHORIAS (Future)

- [ ] Exportar relatório de dashboard como PDF
- [ ] Gráficos de progresso (Chart.js / Recharts)
- [ ] Histórico de mudanças de estágio
- [ ] Notificações quando processo muda de estágio
- [ ] Paginação de tabela (se >100 processos)
- [ ] Busca por nome de processo
- [ ] Filtro por consultor responsável

---

## 9. CHECKLIST FINAL

Antes de fazer commit:

- [ ] Sem erros no console
- [ ] Todos os testes manuais passaram
- [ ] App compila sem warnings
- [ ] Dados no Supabase estão corretos
- [ ] Dashboard aparece para sócio
- [ ] Gerenciador aparece para coordenador
- [ ] Filtros funcionam (área, estágio, combinado)
- [ ] CRUD de áreas funciona (criar, editar, deletar)
- [ ] Responsividade OK (mobile, tablet, desktop)
- [ ] Performance OK (sem lag ao filtrar)

---

**Pronto para começar! Boa sorte! 🚀**

Se tiver dúvidas, consulte:
- `PLANO_ARQUITETURA.md` — Visão geral
- `ESPECIFICACOES_TECNICAS.md` — Detalhes técnicos
- `App.jsx` — Código existente como referência
