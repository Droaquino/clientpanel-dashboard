import { useState, useEffect } from 'react'
import { BarChart2, Calendar, ClipboardList, FolderOpen, Settings, LogOut, Phone, Mail, Pencil, Trash2, Plus, X, Check, MessageSquare, CheckCircle, XCircle, AlertTriangle, User, Video, ChevronLeft, ChevronRight, Lock, Loader2, Link, ArrowLeft, LayoutGrid, Moon, Sun } from 'lucide-react'
import './index.css'
import { useTheme, themes } from './useTheme.jsx'
import {
  dbFindUsuario, dbGetSolicitacoes, dbAddSolicitacao, dbUpdateSolicitacao, dbAddUsuario,
  dbGetConvites, dbAddConvite, dbGetConvite, dbUsarConvite,
  dbGetEventos, dbAddEvento, dbSaveEvento, dbDeleteEvento,
  dbGetProcessos, dbAddProcesso, dbSaveProcesso, dbDeleteProcesso,
  dbGetColaboradores, dbAddColaborador, dbSaveColaborador, dbDeleteColaborador,
  dbGetConsultores, dbAddConsultor, dbSaveConsultor, dbDeleteConsultor,
  dbGetAreas, dbAddArea, dbSaveArea, dbDeleteArea,
} from './supabase'

function Icon({ ic: Ic, size=14, style={} }) {
  return <Ic size={size} strokeWidth={1.8} style={{ display:'inline-block', verticalAlign:'middle', flexShrink:0, ...style }} />
}

// Transições CSS globais
const globalStyles = `
  @keyframes fadeInOut {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  main {
    transition: opacity 0.3s ease-in-out;
  }
  main.fade-out {
    opacity: 0;
  }
`

if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = globalStyles
  document.head.appendChild(style)
}

// ─── Theme ────────────────────────────────────────────────────
const BRAND       = '#163828'
const BRAND_MID   = '#2D6A4F'
const BRAND_LIGHT = '#EBF4EF'
const BRAND_BRD   = '#A8D0B8'
const ACCENT      = '#D4AC3A'
const ACCENT_LT   = '#FBF4DE'

const HOUR_H    = 58
const DAY_START = 8
const DAY_END   = 19
const HOURS     = Array.from({ length: DAY_END - DAY_START }, (_, i) => i + DAY_START)

const EV_COLORS = [
  { bg:'#E6F1FB', brd:'#378ADD', txt:'#0C447C' },
  { bg:BRAND_LIGHT, brd:BRAND_MID, txt:BRAND    },
  { bg:ACCENT_LT,   brd:'#BA7517', txt:'#7A5F10' },
  { bg:'#FBEAF0',   brd:'#D4537E', txt:'#72243E' },
  { bg:'#EAF3DE',   brd:'#639922', txt:'#173404' },
]

// ─── Date helpers ─────────────────────────────────────────────
const MONTH_PT = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
const MONTH_SH = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const DAY_PT   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

function toYMD(dt)     { return `${dt.getFullYear()}-${p2(dt.getMonth()+1)}-${p2(dt.getDate())}` }
function fromYMD(s)    { const [y,mo,dy]=s.split('-').map(Number); return new Date(y,mo-1,dy,12) }
function addDays(dt,n) { return new Date(dt.getFullYear(),dt.getMonth(),dt.getDate()+n,12) }
function addMonths(dt,n){ return new Date(dt.getFullYear(),dt.getMonth()+n,1,12) }
function weekMon(dt)   { const dow=dt.getDay(); return addDays(dt, dow===0?-6:1-dow) }
function sameDay(a,b)  { return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate() }
function p2(n)         { return String(n).padStart(2,'0') }

function monthGrid(dt) {
  const y=dt.getFullYear(), m=dt.getMonth()
  const first=new Date(y,m,1,12)
  const pad=(first.getDay()===0)?6:first.getDay()-1
  const days=new Date(y,m+1,0).getDate()
  const cells=[]
  for(let i=0;i<pad;i++) cells.push(null)
  for(let i=1;i<=days;i++) cells.push(new Date(y,m,i,12))
  while(cells.length%7) cells.push(null)
  return cells
}

// ─── Auth ─────────────────────────────────────────────────────
const USERS = [
  { id:1, nome:'Pedro Aquino', role:'coordenador', cargo:'Coordenador',  senha:'coord2024',   grupo:'gestao'  },
  { id:2, nome:'Ana Lima',     role:'consultor',   cargo:'Consultora',   senha:'cons2024',    grupo:'gestao'  },
  { id:3, nome:'Carlos M.',    role:'consultor',   cargo:'Consultor',    senha:'cons2024',    grupo:'gestao'  },
  { id:4, nome:'DF Turismo',   role:'socio',       cargo:'Sócio',        senha:'socio2024',   grupo:'cliente' },
  { id:5, nome:'Visitante',    role:'cliente',     cargo:'Cliente',      senha:'cliente2024', grupo:'cliente' },
]

// ─── localStorage helpers (apenas sessão do usuário logado) ──
// Dados de cadastro/solicitações/convites agora no Supabase

function senhaFromTel(tel) {
  return (tel.replace(/\D/g,'').slice(0,4))
}

// findUser → dbFindUsuario (supabase.js)

// ─── CadastroScreen ───────────────────────────────────────────
function CadastroScreen({ onBack, inviteToken }) {
  const { theme } = useTheme()
  const [inviteData, setInviteData] = useState(null)
  const lockedRole = inviteData?.role || null

  const [nome,      setNome     ] = useState('')
  const [email,     setEmail    ] = useState('')
  const [telefone,  setTelefone ] = useState('')
  const [grupo,     setGrupo    ] = useState('cliente')
  const [role,      setRole     ] = useState('socio')
  const [cargo,     setCargo    ] = useState('Coordenador')
  const [area,      setArea     ] = useState('')
  const [cargoFunc, setCargoFunc] = useState('')
  const [success,   setSuccess  ] = useState(false)
  const [err,       setErr      ] = useState('')
  const [loading,   setLoading  ] = useState(false)

  // Carrega dados do convite via Supabase
  useEffect(() => {
    if (!inviteToken) return
    dbGetConvite(inviteToken).then(inv => {
      if (inv) {
        setInviteData(inv)
        setRole(inv.role)
        if (inv.role === 'consultor' || inv.role === 'coordenador') setGrupo('gestao')
        else setGrupo('cliente')
      }
    })
  }, [inviteToken])

  function handleGrupo(g) {
    setGrupo(g)
    if (!lockedRole) setRole(g === 'gestao' ? 'coordenador' : 'socio')
  }

  async function handleSubmit() {
    setErr('')
    if (!nome.trim() || !email.trim() || !telefone.trim()) { setErr('Preencha todos os campos obrigatórios.'); return }
    if (role === 'colaborador' && (!area.trim() || !cargoFunc.trim())) { setErr('Preencha Área e Cargo/Função.'); return }
    setLoading(true)
    try {
      await dbAddSolicitacao({
        nome: nome.trim(), email: email.trim(), telefone: telefone.trim(),
        grupo,
        role: grupo === 'gestao' ? (cargo === 'Coordenador' ? 'coordenador' : 'consultor') : role,
        cargo: grupo === 'gestao' ? cargo : (role === 'socio' ? 'Sócio' : cargoFunc),
        area: role === 'colaborador' ? area.trim() : '',
        inviteToken: inviteToken || null,
      })
      if (inviteToken) await dbUsarConvite(inviteToken)
      setSuccess(true)
    } catch(e) {
      setErr('Erro ao enviar solicitação. Tente novamente.')
    }
    setLoading(false)
  }

  if (success) return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(135deg, ${BRAND} 0%, ${BRAND_MID} 100%)`, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'#fff', borderRadius:18, padding:'2rem', width:400, maxWidth:'95vw', textAlign:'center', boxShadow:'0 16px 60px rgba(0,0,0,.25)' }}>
        <div style={{ fontSize:40, marginBottom:12 }}><Icon ic={CheckCircle} size={40} style={{color: BRAND}} /></div>
        <div style={{ fontSize:16, fontWeight:600, color:BRAND, marginBottom:8 }}>Solicitação enviada!</div>
        <div style={{ fontSize:13, color: theme === 'dark' ? '#d0d0d0' : '#555', marginBottom:'1.5rem' }}>Aguarde a aprovação do coordenador.</div>
        <button onClick={onBack} style={{ fontSize:13, padding:'8px 20px', borderRadius:8, border:`0.5px solid ${BRAND}`, background:BRAND, color:'#fff', cursor:'pointer' }}>Voltar ao login</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(135deg, ${BRAND} 0%, ${BRAND_MID} 100%)`, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'#fff', borderRadius:18, padding:'2rem', width:440, maxWidth:'95vw', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 16px 60px rgba(0,0,0,.25)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'1.5rem' }}>
          <button onClick={onBack} style={{ border:'none', background:'none', fontSize:18, cursor:'pointer', color: theme === 'dark' ? '#a0a0a0' : '#999', lineHeight:1, padding:0 }}><Icon ic={ArrowLeft} size={18} /></button>
          <div>
            <div style={{ fontSize:16, fontWeight:600, color:BRAND }}>Solicitar Cadastro</div>
            <div style={{ fontSize:11, color: theme === 'dark' ? '#b0b0b0' : '#888' }}>Preencha os dados para solicitar acesso</div>
          </div>
        </div>

        {inviteData && (
          <div style={{ background:BRAND_LIGHT, border:`0.5px solid ${BRAND_BRD}`, borderRadius:8, padding:'8px 10px', marginBottom:12, fontSize:11, color:BRAND }}>
            <Icon ic={Link} size={13} /> Convite válido — perfil pré-definido: <strong>{lockedRole}</strong>
          </div>
        )}

        <div style={{ marginBottom:10 }}>
          <label style={labelSt(theme)}>Nome completo <span style={{ color:'#E24B4A' }}>*</span></label>
          <input style={inputSt(theme)} value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome completo" />
        </div>
        <div style={{ marginBottom:10 }}>
          <label style={labelSt(theme)}>E-mail <span style={{ color:'#E24B4A' }}>*</span></label>
          <input style={inputSt(theme)} value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={labelSt(theme)}>Telefone (com DDD) <span style={{ color:'#E24B4A' }}>*</span></label>
          <input style={inputSt(theme)} value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(61) 9 9999-9999" />
        </div>

        <div style={{ marginBottom:12 }}>
          <label style={labelSt(theme)}>Grupo <span style={{ color:'#E24B4A' }}>*</span></label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[['gestao','Grupo Gestão'],['cliente','Cliente']].map(([g,l]) => (
              <button key={g} onClick={() => !lockedRole && handleGrupo(g)} style={{
                padding:'10px', borderRadius:9, fontSize:12, fontWeight:500, cursor: lockedRole ? 'default' : 'pointer',
                border: `1.5px solid ${grupo===g ? BRAND : '#ddd'}`,
                background: grupo===g ? BRAND_LIGHT : '#fafafa',
                color: grupo===g ? BRAND : '#666',
                opacity: lockedRole && grupo!==g ? .5 : 1,
              }}>{l}</button>
            ))}
          </div>
        </div>

        {grupo === 'gestao' && (
          <div style={{ marginBottom:10 }}>
            <label style={labelSt(theme)}>Cargo</label>
            <select style={{ ...inputSt(theme), cursor: lockedRole ? 'default' : 'pointer' }} value={cargo}
              onChange={e => !lockedRole && setCargo(e.target.value)} disabled={!!lockedRole}>
              <option value="Coordenador">Coordenador</option>
              <option value="Consultor">Consultor</option>
            </select>
          </div>
        )}

        {grupo === 'cliente' && (
          <div style={{ marginBottom:10 }}>
            <label style={labelSt(theme)}>Tipo</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[['socio','Sócio'],['colaborador','Colaborador']].map(([r,l]) => (
                <button key={r} onClick={() => !lockedRole && setRole(r)} style={{
                  padding:'9px', borderRadius:9, fontSize:12, fontWeight:500, cursor: lockedRole ? 'default' : 'pointer',
                  border: `1.5px solid ${role===r ? BRAND : '#ddd'}`,
                  background: role===r ? BRAND_LIGHT : '#fafafa',
                  color: role===r ? BRAND : '#666',
                  opacity: lockedRole && role!==r ? .5 : 1,
                }}>{l}</button>
              ))}
            </div>
          </div>
        )}

        {grupo === 'cliente' && role === 'colaborador' && (
          <>
            <div style={{ marginBottom:10 }}>
              <label style={labelSt(theme)}>Área <span style={{ color:'#E24B4A' }}>*</span></label>
              <input style={inputSt(theme)} value={area} onChange={e => setArea(e.target.value)} placeholder="Ex: Financeiro, RH…" />
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={labelSt(theme)}>Cargo/Função <span style={{ color:'#E24B4A' }}>*</span></label>
              <input style={inputSt(theme)} value={cargoFunc} onChange={e => setCargoFunc(e.target.value)} placeholder="Ex: Analista, Supervisor…" />
            </div>
          </>
        )}

        {err && <div style={{ fontSize:11, color:'#A32D2D', marginBottom:8 }}>{err}</div>}

        <button onClick={handleSubmit} disabled={loading} style={{
          width:'100%', padding:'9px', borderRadius:8, fontSize:13, fontWeight:500, marginTop:6,
          background: loading ? '#999' : BRAND, color:'#fff', border:'none', cursor: loading ? 'wait' : 'pointer',
        }}>{loading ? 'Enviando...' : 'Enviar Solicitação'}</button>
      </div>
    </div>
  )
}

function LoginScreen({ onLogin, onCadastro }) {
  const { theme } = useTheme()
  const [section,     setSection    ] = useState('gestao')
  const [userId,      setUserId     ] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientType,  setClientType ] = useState('socio')
  const [clientName,  setClientName ] = useState('')
  const [senha,       setSenha      ] = useState('')
  const [err,         setErr        ] = useState('')
  const [loading,     setLoading    ] = useState(false)

  async function doLogin() {
    setErr('')
    setLoading(true)
    if (section === 'gestao') {
      if (userId) {
        // 1. Tenta usuário fixo (Pedro, Ana, Carlos)
        const u = USERS.find(x => x.id === Number(userId) && x.grupo === 'gestao')
        if (u) {
          if (u.senha !== senha) { setErr('Senha incorreta.'); setLoading(false); return }
          localStorage.setItem('pcUser', JSON.stringify(u))
          onLogin(u); setLoading(false); return
        }
        // 2. Tenta usuário criado via Configurações (Supabase)
        const dbU = await dbFindUsuario(String(userId), senha)
        if (dbU && dbU.grupo === 'gestao') {
          localStorage.setItem('pcUser', JSON.stringify(dbU))
          onLogin(dbU); setLoading(false); return
        }
      }
      setErr('Usuário ou senha incorretos.'); setLoading(false); return
    } else {
      // 1. Tenta no Supabase por e-mail
      if (clientEmail.trim()) {
        const dbU = await dbFindUsuario(clientEmail.trim(), senha)
        if (dbU) {
          localStorage.setItem('pcUser', JSON.stringify(dbU))
          onLogin(dbU); setLoading(false); return
        }
      }
      // 2. Fallback hardcoded (DF Turismo / Visitante)
      const targetRole = clientType
      const u = USERS.find(x => x.role === targetRole && x.grupo === 'cliente')
      if (!u) { setErr('Tipo inválido.'); setLoading(false); return }
      if (u.senha !== senha) { setErr('Senha incorreta.'); setLoading(false); return }
      const logged = { ...u, nome: clientName.trim() || u.nome }
      localStorage.setItem('pcUser', JSON.stringify(logged))
      onLogin(logged); setLoading(false)
    }
  }

  const gestaoUsers = USERS.filter(x => x.grupo === 'gestao')

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(135deg, ${BRAND} 0%, ${BRAND_MID} 100%)`, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'#fff', borderRadius:18, padding:'2rem', width:380, maxWidth:'95vw', boxShadow:'0 16px 60px rgba(0,0,0,.25)' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:BRAND, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, color:'#fff', margin:'0 auto 10px' }}><Icon ic={LayoutGrid} size={24} /></div>
          <div style={{ fontSize:17, fontWeight:600, color:BRAND }}>Painel de Controle</div>
          <div style={{ fontSize:12, color: theme === 'dark' ? '#b0b0b0' : '#888', marginTop:2 }}>DF Turismo</div>
        </div>

        {/* Section tabs */}
        <div style={{ display:'flex', border:`0.5px solid ${BRAND_BRD}`, borderRadius:9, overflow:'hidden', marginBottom:'1.25rem' }}>
          {[['gestao','Grupo Gestão'],['cliente','Acesso Cliente']].map(([s,l]) => (
            <button key={s} onClick={() => { setSection(s); setErr('') }} style={{
              flex:1, padding:'8px', fontSize:12, border:'none', cursor:'pointer', fontWeight: section===s ? 500 : 400,
              background: section===s ? BRAND : '#fff', color: section===s ? '#fff' : '#555',
            }}>{l}</button>
          ))}
        </div>

        {section === 'gestao' ? (
          <>
            <div style={{ marginBottom:10 }}>
              <label style={labelSt(theme)}>Usuário</label>
              <select style={{ ...inputSt(theme), cursor:'pointer' }} value={userId} onChange={e => setUserId(e.target.value)}>
                <option value="">Selecione…</option>
                {gestaoUsers.map(u => <option key={u.id} value={u.id}>{u.nome} — {u.cargo}</option>)}
              </select>
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom:10 }}>
              <label style={labelSt(theme)}>E-mail</label>
              <input style={inputSt(theme)} value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={labelSt(theme)}>Tipo de acesso (demo)</label>
              <select style={{ ...inputSt(theme), cursor:'pointer' }} value={clientType} onChange={e => setClientType(e.target.value)}>
                <option value="socio">Sócio</option>
                <option value="cliente">Cliente</option>
              </select>
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={labelSt(theme)}>Seu nome</label>
              <input style={inputSt(theme)} value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Nome (opcional)" />
            </div>
          </>
        )}

        <div style={{ marginBottom:'1rem' }}>
          <label style={labelSt(theme)}>Senha</label>
          <input type="password" style={inputSt(theme)} value={senha} onChange={e => setSenha(e.target.value)}
            onKeyDown={e => e.key==='Enter' && doLogin()} placeholder="••••••••" />
        </div>

        {err && <div style={{ fontSize:11, color:'#A32D2D', marginBottom:8 }}>{err}</div>}

        <button onClick={doLogin} disabled={loading} style={{
          width:'100%', padding:'9px', borderRadius:8, fontSize:13, fontWeight:500,
          background: loading ? '#999' : BRAND, color:'#fff', border:'none', cursor: loading ? 'wait' : 'pointer',
        }}>{loading ? 'Verificando...' : 'Entrar'}</button>

        <div style={{ textAlign:'center', marginTop:'1rem', paddingTop:'1rem', borderTop: `0.5px solid ${theme === 'dark' ? '#222' : '#eee'}` }}>
          <span style={{ fontSize:11, color: theme === 'dark' ? '#b0b0b0' : '#888' }}>Não tem acesso? </span>
          <button onClick={onCadastro} style={{ fontSize:11, color:BRAND_MID, background:'none', border:'none', cursor:'pointer', fontWeight:500, textDecoration:'underline', padding:0 }}>
            Solicitar cadastro
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Seed — People ────────────────────────────────────────────
let nextColabId      = 7
let nextConsultorId  = 3
let nextMeetingId    = 8
let nextProcId       = 11

const initColaboradores = [
  { id:1, nome:'Beatriz Santos',   cargo:'Financeiro',  telefone:'(61) 9 9123-4567', email:'beatriz@dfturismo.com.br'   },
  { id:2, nome:'Mariana Lima',     cargo:'RH',          telefone:'(61) 9 9234-5678', email:'mariana@dfturismo.com.br'   },
  { id:3, nome:'Rodrigo Torres',   cargo:'Compras',     telefone:'(61) 9 9345-6789', email:'rodrigo@dfturismo.com.br'   },
  { id:4, nome:'Felipe Andrade',   cargo:'Marketing',   telefone:'(61) 9 9456-7890', email:'felipe@dfturismo.com.br'    },
  { id:5, nome:'Sofia Rezende',    cargo:'Comercial',   telefone:'(61) 9 9567-8901', email:'sofia@dfturismo.com.br'     },
  { id:6, nome:'Gerência Geral',   cargo:'Gerência',    telefone:'(61) 9 9678-9012', email:'gerencia@dfturismo.com.br'  },
]

const initConsultores = [
  { id:1, nome:'Ana Lima',   especialidade:'Processos Comerciais',   telefone:'(61) 9 9001-0001', email:'ana.lima@consultoria.com'  },
  { id:2, nome:'Carlos M.',  especialidade:'Processos Operacionais', telefone:'(61) 9 9001-0002', email:'carlos.m@consultoria.com'  },
]

// ─── Seed — Meetings & Processes ─────────────────────────────
const initMeetings = [
  { id:1, title:'Kick-off do Sprint',     who:'Pedro + Equipe',   date:'2026-06-23', sh:9,  sm:0,  eh:10, em:0,  ci:0, canceled:false },
  { id:2, title:'Review de Requisitos',   who:'Coordenação',      date:'2026-06-24', sh:14, sm:0,  eh:15, em:0,  ci:1, canceled:false },
  { id:3, title:'Alinhamento Cliente',    who:'Grupo DF Turismo', date:'2026-06-25', sh:10, sm:30, eh:11, em:30, ci:2, canceled:false },
  { id:4, title:'Coleta — Proc. Financ.', who:'Beatriz Santos',   date:'2026-06-25', sh:14, sm:0,  eh:15, em:30, ci:3, canceled:false },
  { id:5, title:'Sync Técnico',           who:'Equipe Interna',   date:'2026-06-26', sh:16, sm:0,  eh:16, em:45, ci:4, canceled:false },
  { id:6, title:'Validação COPS',         who:'Coordenação',      date:'2026-06-26', sh:9,  sm:0,  eh:10, em:0,  ci:1, canceled:false },
  { id:7, title:'Sprint Retrospectiva',   who:'All Hands',        date:'2026-06-27', sh:11, sm:0,  eh:12, em:0,  ci:0, canceled:false },
]

const STAGE_KEYS = [
  { key:'coleta',      label:'Coleta'          },
  { key:'modelagem',   label:'Modelagem'       },
  { key:'valCOPS',     label:'Val. COPS'       },
  { key:'corrCOPS',    label:'Corr. COPS'      },
  { key:'valCliente',  label:'Val. Cliente'    },
  { key:'corrCliente', label:'Corr. Cliente'   },
  { key:'analise',     label:'Análise Crítica' },
]

const FORMATO_OPTS = ['POP - Procedimento Operacional Padrão', 'Fluxograma']
const getPct = p => Math.round(STAGE_KEYS.filter(s => p[s.key]).length / STAGE_KEYS.length * 100)
const emptyStages = { coleta:false, modelagem:false, valCOPS:false, corrCOPS:false, valCliente:false, corrCliente:false, analise:false }

const initProcesses = [
  { id:1,  num:1,  nome:'Emissão de Pacotes Turísticos', area:['Comercial'],              comQuem:['Gerência Geral'],             consultor:['Ana Lima'],            formato:'Fluxograma',
    coleta:true,  modelagem:true,  valCOPS:true,  corrCOPS:false, valCliente:false, corrCliente:false, analise:false, confirmed:false, comentarios:[] },
  { id:2,  num:2,  nome:'Atendimento e Reservas',         area:['Comercial'],              comQuem:['Sofia Rezende'],              consultor:['Carlos M.'],           formato:'POP - Procedimento Operacional Padrão',
    coleta:true,  modelagem:true,  valCOPS:true,  corrCOPS:true,  valCliente:true,  corrCliente:true,  analise:false, confirmed:false, comentarios:[] },
  { id:3,  num:3,  nome:'Controle Financeiro',            area:['Financeiro'],             comQuem:['Beatriz Santos'],             consultor:['Ana Lima'],            formato:'Fluxograma',
    coleta:true,  modelagem:false, valCOPS:false, corrCOPS:false, valCliente:false, corrCliente:false, analise:false, confirmed:false, comentarios:[] },
  { id:4,  num:4,  nome:'Gestão de Fornecedores',         area:['Compras'],                comQuem:['Rodrigo Torres'],             consultor:['Carlos M.'],           formato:'POP - Procedimento Operacional Padrão',
    coleta:true,  modelagem:true,  valCOPS:false, corrCOPS:false, valCliente:false, corrCliente:false, analise:false, confirmed:false, comentarios:[] },
  { id:5,  num:5,  nome:'Recrutamento & Seleção',         area:['RH'],                     comQuem:['Mariana Lima'],               consultor:['Ana Lima'],            formato:'Fluxograma',
    coleta:false, modelagem:false, valCOPS:false, corrCOPS:false, valCliente:false, corrCliente:false, analise:false, confirmed:false, comentarios:[] },
  { id:6,  num:6,  nome:'Marketing Digital',              area:['Marketing'],              comQuem:['Felipe Andrade'],             consultor:['Carlos M.'],           formato:'Fluxograma',
    coleta:true,  modelagem:true,  valCOPS:true,  corrCOPS:true,  valCliente:false, corrCliente:false, analise:false, confirmed:false, comentarios:[] },
  { id:7,  num:7,  nome:'Controle de Vendas',             area:['Comercial'],              comQuem:['Sofia Rezende'],              consultor:['Ana Lima'],            formato:'POP - Procedimento Operacional Padrão',
    coleta:true,  modelagem:true,  valCOPS:true,  corrCOPS:true,  valCliente:true,  corrCliente:true,  analise:true,  confirmed:true,  comentarios:[] },
  { id:8,  num:8,  nome:'Onboarding de Colaboradores',    area:['RH'],                     comQuem:['Mariana Lima'],               consultor:['Carlos M.'],           formato:'POP - Procedimento Operacional Padrão',
    coleta:true,  modelagem:true,  valCOPS:false, corrCOPS:false, valCliente:false, corrCliente:false, analise:false, confirmed:false, comentarios:[] },
  { id:9,  num:9,  nome:'Gestão de Transportes',          area:['Operações'],              comQuem:[],                             consultor:['Ana Lima'],            formato:'Fluxograma',
    coleta:false, modelagem:false, valCOPS:false, corrCOPS:false, valCliente:false, corrCliente:false, analise:false, confirmed:false, comentarios:[] },
  { id:10, num:10, nome:'Relatórios Gerenciais',          area:['Gerência'],               comQuem:['Gerência Geral'],             consultor:['Carlos M.'],           formato:'Fluxograma',
    coleta:true,  modelagem:true,  valCOPS:true,  corrCOPS:false, valCliente:false, corrCliente:false, analise:false, confirmed:false, comentarios:[] },
]

// ─── Shared styles ────────────────────────────────────────────
const inputSt = (theme) => ({ width:'100%', padding:'7px 12px', fontSize:13, border: `0.5px solid ${theme === 'dark' ? '#444' : '#ccc'}`, borderRadius:8, background: theme === 'dark' ? '#1a1a1a' : 'linear-gradient(135deg, #fafbfa 0%, #f5f9f7 100%)', color: theme === 'dark' ? '#f0f0f0' : '#111', outline:'none' })
const labelSt = (theme) => ({ fontSize:12, color: theme === 'dark' ? '#d0d0d0' : '#666', marginBottom:4, display:'block', fontWeight:500 })

// Reusable button hover state
const hoverBtnSt = (isHovered) => ({ transition:'all 0.2s ease', filter: isHovered ? 'brightness(0.90)' : 'brightness(1)' })
const hoverCardSt = (isHovered) => ({ transition:'all 0.2s ease', filter: isHovered ? 'brightness(1.02)' : 'brightness(1)', boxShadow: isHovered ? '0 8px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.06)' })

// ─── Sidebar ─────────────────────────────────────────────────
function Sidebar({ tab, setTab, user, onLogout, onTabChange }) {
  const { theme, setTheme } = useTheme()
  const colors = themes[theme]
  const [collapsed, setCollapsed] = useState(false)
  const role = user?.role || 'cliente'

  const handleTabClick = (newTab) => {
    if (onTabChange) onTabChange(newTab)
    else setTab(newTab)
  }
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }
  const allItems = [
    { id:'dashboard',    icon: <Icon ic={BarChart2} size={36} />, label:'Dashboard',     roles:['coordenador','consultor','socio'] },
    { id:'agenda',       icon: <Icon ic={Calendar} size={36} />, label:'Agenda',         roles:['coordenador','consultor'] },
    { id:'levantamento', icon: <Icon ic={ClipboardList} size={36} />, label:'Levantamento',   roles:['coordenador','consultor'] },
    { id:'processos',    icon: <Icon ic={FolderOpen} size={36} />,  label:'Processos',      roles:['coordenador','consultor','socio','cliente'] },
    { id:'colaboradores',icon: <Icon ic={User} size={36} />, label:'Colaboradores',  roles:['socio'] },
    { id:'configuracoes',icon: <Icon ic={Settings} size={36} />, label:'Configurações',  roles:['coordenador'] },
  ]
  const items = allItems.filter(i => i.roles.includes(role))
  const initials = (user?.nome||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
  const w = collapsed ? 60 : 220
  return (
    <nav style={{ width:w, flexShrink:0, background: theme === 'light' ? BRAND : colors.sidebarBg, backgroundImage: theme === 'light' ? `linear-gradient(180deg, #163828 0%, #0f2a1f 100%)` : colors.sidebarGradient, display:'flex', flexDirection:'column', transition:'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)', overflow:'hidden', position:'relative' }}>
      {/* Toggle separado — flutua sobre a borda direita */}
      <button
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        style={{
          position:'absolute', top:12, right: collapsed ? 8 : 8, zIndex:10,
          width:26, height:26, borderRadius:'50%', border:'none', cursor:'pointer',
          background:'rgba(255,255,255,.18)', color:'rgba(255,255,255,.9)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:11, lineHeight:1, flexShrink:0, transition:'all 0.2s ease',
        }}
        onMouseOver={e => { e.target.style.background = 'rgba(255,255,255,.28)'; e.target.style.transform = 'scale(1.1)' }}
        onMouseOut={e => { e.target.style.background = 'rgba(255,255,255,.18)'; e.target.style.transform = 'scale(1)' }}
      ><Icon ic={collapsed ? ChevronRight : ChevronLeft} size={18} /></button>

      {/* Cabeçalho */}
      <div style={{ padding:'0 1.25rem 1.5rem', borderBottom:'1px solid rgba(255,255,255,.12)', marginBottom:'1rem', paddingTop:'1.5rem', paddingRight: collapsed ? '1rem' : '2.8rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:44, height:44, flexShrink:0, background:'linear-gradient(135deg, rgba(255,255,255,.25) 0%, rgba(255,255,255,.15) 100%)', borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, color:'#fff', boxShadow:'0 4px 12px rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,.2)' }}><Icon ic={LayoutGrid} size={26} /></div>
          <div style={{ opacity: collapsed ? 0 : 1, transition:'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <div style={{ fontSize:15, fontWeight:700, color:'#fff', whiteSpace:'nowrap', letterSpacing:'-0.3px' }}>Painel de Controle</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.65)' }}>DF Turismo</div>
          </div>
        </div>
      </div>

      {/* Itens de menu */}
      {items.map(({ id, icon, label }) => (
        <div key={id} onClick={() => handleTabClick(id)} onMouseEnter={e => { if (!tab.includes(id)) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }} onMouseLeave={e => { if (!tab.includes(id)) e.currentTarget.style.background = 'transparent' }} title={collapsed ? label : ''} style={{
          display:'flex', alignItems:'center', gap:14,
          padding: collapsed ? '16px 0' : '16px 1rem',
          justifyContent: collapsed ? 'center' : 'flex-start',
          cursor:'pointer',
          fontSize:14, color: tab===id ? '#fff' : 'rgba(255,255,255,.7)',
          borderLeft:`4px solid ${tab===id ? ACCENT : 'transparent'}`,
          background: tab===id ? 'rgba(255,255,255,.15)' : 'transparent',
          fontWeight: tab===id ? 600 : 500,
          transition: 'all 0.2s ease',
        }}>
          <span style={{ fontSize: collapsed ? 36 : 36, display:'flex', alignItems:'center', justifyContent:'center' }}>{icon}</span>
          {!collapsed && <span style={{fontSize: 14, whiteSpace:'nowrap' }}>{label}</span>}
        </div>
      ))}

      {/* Perfil + Logout + Theme Toggle — logo abaixo dos itens, sem marginTop:auto */}
      <div style={{ padding: collapsed ? '1rem 0.5rem' : '1rem 1rem', borderTop:'1px solid rgba(255,255,255,.1)', marginTop:12 }}>
        {collapsed ? (
          <>
            <button onClick={toggleTheme} title={theme==='light' ? 'Dark mode' : 'Light mode'} style={{ width:'100%', fontSize:13, padding:'8px 6px', border:'1px solid rgba(255,255,255,.25)', borderRadius:8, cursor:'pointer', background:'rgba(255,255,255,.12)', color:'rgba(255,255,255,.9)', marginBottom:8, transition:'all 0.2s ease', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon ic={theme==='light' ? Moon : Sun} size={18} /></button>
            <div title={user?.nome} style={{ width:32, height:32, borderRadius:'50%', background:ACCENT, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#0D2519', fontWeight:700, margin:'0 auto 8px' }}>{initials}</div>
            <button onClick={onLogout} title="Sair" style={{ width:'100%', fontSize:13, padding:'8px 6px', border:'1px solid rgba(255,255,255,.25)', borderRadius:8, cursor:'pointer', background:'rgba(255,255,255,.12)', color:'rgba(255,255,255,.9)', transition:'all 0.2s ease', display:'flex', alignItems:'center', justifyContent:'center' }} onMouseOver={e => { e.target.style.background = 'rgba(255,255,255,.2)'; e.target.style.borderColor = 'rgba(255,255,255,.5)' }} onMouseOut={e => { e.target.style.background = 'rgba(255,255,255,.12)'; e.target.style.borderColor = 'rgba(255,255,255,.25)' }}><Icon ic={LogOut} size={18} /></button>
          </>
        ) : (
          <>
            <button onClick={toggleTheme} title={theme==='light' ? 'Dark mode' : 'Light mode'} style={{ width:'100%', fontSize:11, padding:'9px 10px', border:'1px solid rgba(255,255,255,.25)', borderRadius:8, cursor:'pointer', background:'rgba(255,255,255,.12)', color:'rgba(255,255,255,.9)', marginBottom:9, display:'flex', alignItems:'center', justifyContent:'center', gap:7, fontWeight:600, transition:'all 0.2s ease' }}><Icon ic={theme==='light' ? Moon : Sun} size={16} /> {theme==='light' ? 'Dark' : 'Light'}</button>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:9 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:ACCENT, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#0D2519', fontWeight:700, flexShrink:0 }}>{initials}</div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:12, color:'rgba(255,255,255,.9)', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.nome}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,.6)' }}>{user?.cargo}</div>
              </div>
            </div>
            <button onClick={onLogout} style={{ width:'100%', fontSize:11, padding:'7px 10px', border:'0.5px solid rgba(255,255,255,.25)', borderRadius:7, cursor:'pointer', background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.85)', fontWeight:500, transition:'all 0.2s ease' }} onMouseOver={e => { e.target.style.background = 'rgba(255,255,255,.18)' }} onMouseOut={e => { e.target.style.background = 'rgba(255,255,255,.1)' }}>Sair</button>
          </>
        )}
      </div>
    </nav>
  )
}

// ─── Configurações ────────────────────────────────────────────
const emptyColab      = { nome:'', cargo:'', telefone:'', email:'' }
const emptyConsultor  = { nome:'', especialidade:'', telefone:'', email:'' }
const emptyArea       = { nome:'', ativa:true }

function PersonCard({ person, type, onEdit, onDelete }) {
  const { theme } = useTheme()
  const initials = person.nome.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
  const avatarBg = type==='consultor' ? BRAND : '#6B7280'
  return (
    <div style={{ background:'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(235,244,239,0.85) 100%)', border: `0.5px solid ${theme === 'dark' ? '#333' : '#e2e8e4'}`, borderTop:'3px solid #163828', borderRadius:14, padding:'1.5rem', display:'flex', gap:14, alignItems:'flex-start', boxShadow:'0 4px 15px rgba(22, 56, 40, 0.15)', animation:'slideInUp 0.4s ease-out' }}>
      <div style={{ width:40, height:40, borderRadius:'50%', background:avatarBg, color:'#fff', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{initials}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:500, color: theme === 'dark' ? '#f0f0f0' : '#111' }}>{person.nome}</div>
        <div style={{ fontSize:11, color: type==='consultor' ? BRAND_MID : '#888', marginTop:1 }}>
          {type==='consultor' ? person.especialidade : person.cargo}
        </div>
        <div style={{ display:'flex', gap:14, marginTop:6, flexWrap:'wrap' }}>
          {person.telefone && (
            <a href={`tel:${person.telefone}`} style={{ fontSize:11, color: theme === 'dark' ? '#d0d0d0' : '#555', textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
              <Icon ic={Phone} size={11} /> {person.telefone}
            </a>
          )}
          {person.email && (
            <a href={`mailto:${person.email}`} style={{ fontSize:11, color:'#378ADD', textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
              <Icon ic={Mail} size={11} /> {person.email}
            </a>
          )}
        </div>
      </div>
      <div style={{ display:'flex', gap:5, flexShrink:0 }}>
        <button onClick={() => onEdit(person)} style={{ fontSize:11, padding:'4px 9px', border: `0.5px solid ${theme === 'dark' ? '#444' : '#d0d0d0'}`, borderRadius:6, cursor:'pointer', background:'#fff', color: theme === 'dark' ? '#d0d0d0' : '#555' }}><Icon ic={Pencil} size={12} /></button>
        <button onClick={() => onDelete(person.id)} style={{ fontSize:11, padding:'4px 9px', border:'0.5px solid #f5c6c6', borderRadius:6, cursor:'pointer', background:'#fff', color:'#A32D2D' }}><Icon ic={Trash2} size={12} /></button>
      </div>
    </div>
  )
}

function AreaCard({ area, onEdit, onDelete }) {
  const { theme } = useTheme()
  return (
    <div style={{ background:'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(235,244,239,0.85) 100%)', border: `0.5px solid ${theme === 'dark' ? '#333' : '#e2e8e4'}`, borderTop:'3px solid #163828', borderRadius:14, padding:'1.5rem', display:'flex', gap:14, alignItems:'flex-start', boxShadow:'0 4px 15px rgba(22, 56, 40, 0.15)', animation:'slideInUp 0.4s ease-out' }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:500, color: theme === 'dark' ? '#f0f0f0' : '#111' }}>{area.nome}</div>
        <div style={{ fontSize:11, color: theme === 'dark' ? '#b0b0b0' : '#888', marginTop:2 }}>
          Status: <span style={{ fontWeight:500, color: area.ativa ? BRAND : '#888' }}>{area.ativa ? 'Ativa' : 'Inativa'}</span>
        </div>
      </div>
      <div style={{ display:'flex', gap:5, flexShrink:0 }}>
        <button onClick={() => onEdit(area)} style={{ fontSize:11, padding:'4px 9px', border: `0.5px solid ${theme === 'dark' ? '#444' : '#d0d0d0'}`, borderRadius:6, cursor:'pointer', background:'#fff', color: theme === 'dark' ? '#d0d0d0' : '#555' }}><Icon ic={Pencil} size={12} /></button>
        <button onClick={() => onDelete(area.id)} style={{ fontSize:11, padding:'4px 9px', border:'0.5px solid #f5c6c6', borderRadius:6, cursor:'pointer', background:'#fff', color:'#A32D2D' }}><Icon ic={Trash2} size={12} /></button>
      </div>
    </div>
  )
}

function AreaForm({ data, onChange, onSave, onCancel, isNew }) {
  const { theme } = useTheme()
  const ok = (data.nome||'').trim()
  return (
    <div style={{ background: isNew ? (theme === 'dark' ? '#1a1a1a' : '#FAFCFA') : (theme === 'dark' ? '#1e1e1e' : '#f8fbf9'), border:`1.5px solid ${BRAND_BRD}`, borderTop:`3px solid ${BRAND}`, borderRadius:14, padding:'1.25rem 1.35rem', marginBottom:'.8rem', boxShadow:'0 2px 8px rgba(22, 56, 40, 0.08)' }}>
      <div style={{ fontSize:13, fontWeight:500, color:BRAND, marginBottom:'1rem' }}>{isNew ? <><Icon ic={Plus} size={12} /> Nova área</> : <><Icon ic={Pencil} size={12} /> Editando área</>}</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={labelSt(theme)}>Nome da área <span style={{ color:'#E24B4A' }}>*</span></label>
          <input style={inputSt(theme)} value={data.nome||''} placeholder="Ex: Comercial, RH, Financeiro"
            onChange={e => onChange({ ...data, nome:e.target.value })} />
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', userSelect:'none' }}>
            <input type="checkbox" checked={data.ativa!==false} onChange={e => onChange({ ...data, ativa:e.target.checked })}
              style={{ accentColor:BRAND, width:14, height:14 }} />
            <span style={{ fontSize:12, fontWeight:500, color:BRAND }}>Área ativa</span>
          </label>
        </div>
      </div>
      <div style={{ display:'flex', gap:'0.85rem', justifyContent:'flex-end' }}>
        <button onClick={onCancel} style={{ fontSize:12, padding:'7px 16px', border:`0.5px solid #d0d0d0`, borderRadius:8, cursor:'pointer', background:'#fff', color: theme === 'dark' ? '#d0d0d0' : '#555', fontWeight:500, transition:'all 0.2s ease' }} onMouseOver={e => { e.target.style.background = '#f5f5f5' }} onMouseOut={e => { e.target.style.background = '#fff' }}>Cancelar</button>
        <button onClick={onSave} disabled={!ok} style={{ fontSize:12, padding:'7px 16px', borderRadius:8, cursor: ok ? 'pointer' : 'default', border:`0.5px solid ${ok ? BRAND : '#ddd'}`, background: ok ? BRAND : '#f0f0f0', color: ok ? '#fff' : '#ccc', fontWeight:600, boxShadow: ok ? '0 4px 15px rgba(22, 56, 40, 0.3)' : 'none', transition:'all 0.2s ease' }} onMouseOver={e => { if (ok) { e.target.style.filter = 'brightness(0.90)' } }} onMouseOut={e => { e.target.style.filter = 'brightness(1)' }}>Salvar</button>
      </div>
    </div>
  )
}

function PersonForm({ data, onChange, onSave, onCancel, type, isNew }) {
  const { theme } = useTheme()
  const [criarLogin, setCriarLogin] = useState(false)
  const [loginRole,  setLoginRole ] = useState(type === 'consultor' ? 'consultor' : 'cliente')
  const [loginSenha, setLoginSenha] = useState('')

  // sync senha padrão com telefone
  useEffect(() => {
    if (criarLogin) setLoginSenha(senhaFromTel(data.telefone || ''))
  }, [data.telefone, criarLogin])

  const ok = (data.nome||'').trim()
  const fields = type==='consultor'
    ? [
        { key:'nome',          label:'Nome completo',     placeholder:'Ex: Ana Lima',           span:2 },
        { key:'especialidade', label:'Especialidade',     placeholder:'Ex: Processos Comerciais',span:2 },
        { key:'telefone',      label:'Telefone',          placeholder:'(XX) 9 XXXX-XXXX',       span:1 },
        { key:'email',         label:'E-mail',            placeholder:'exemplo@email.com',       span:1 },
      ]
    : [
        { key:'nome',          label:'Nome completo',     placeholder:'Ex: João da Silva',       span:2 },
        { key:'cargo',         label:'Cargo / Área',      placeholder:'Ex: Financeiro, RH',      span:2 },
        { key:'telefone',      label:'Telefone',          placeholder:'(XX) 9 XXXX-XXXX',        span:1 },
        { key:'email',         label:'E-mail',            placeholder:'exemplo@email.com',        span:1 },
      ]

  function handleSave() {
    if (!ok) return
    const loginInfo = criarLogin ? { createLogin:true, role:loginRole, senha:loginSenha } : { createLogin:false }
    onSave(loginInfo)
  }

  return (
    <div style={{ background: isNew ? (theme === 'dark' ? '#1a1a1a' : '#FAFCFA') : (theme === 'dark' ? '#1e1e1e' : '#f8fbf9'), border:`1.5px solid ${BRAND_BRD}`, borderTop:`3px solid ${BRAND}`, borderRadius:14, padding:'1.25rem 1.35rem', marginBottom:'.8rem', boxShadow:'0 2px 8px rgba(22, 56, 40, 0.08)' }}>
      <div style={{ fontSize:13, fontWeight:500, color:BRAND, marginBottom:'1rem' }}>{isNew ? <><Icon ic={Plus} size={12} /> Novo registro</> : <><Icon ic={Pencil} size={12} /> Editando registro</>}</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
        {fields.map(f => (
          <div key={f.key} style={{ gridColumn: f.span===2 ? '1/-1' : 'auto' }}>
            <label style={labelSt(theme)}>{f.label} {f.key==='nome' && <span style={{ color:'#E24B4A' }}>*</span>}</label>
            <input style={inputSt(theme)} value={data[f.key]||''} placeholder={f.placeholder}
              onChange={e => onChange({ ...data, [f.key]:e.target.value })} />
          </div>
        ))}
      </div>

      {/* Seção de login — só no cadastro novo */}
      {isNew && (
        <div style={{ borderTop:`1px dashed ${BRAND_BRD}`, paddingTop:'.75rem', marginBottom:'.75rem' }}>
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', userSelect:'none' }}>
            <input type="checkbox" checked={criarLogin} onChange={e => setCriarLogin(e.target.checked)}
              style={{ accentColor:BRAND, width:14, height:14 }} />
            <span style={{ fontSize:12, fontWeight:500, color:BRAND }}>Criar acesso ao painel</span>
          </label>
          {criarLogin && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginTop:'.75rem' }}>
              <div>
                <label style={labelSt(theme)}>Nível de acesso</label>
                <select value={loginRole} onChange={e => setLoginRole(e.target.value)}
                  style={{ ...inputSt(theme), cursor:'pointer' }}>
                  {type === 'consultor' && <option value="consultor">Consultor</option>}
                  {type === 'consultor' && <option value="coordenador">Coordenador</option>}
                  {type !== 'consultor' && <option value="cliente">Cliente (somente leitura)</option>}
                  {type !== 'consultor' && <option value="socio">Sócio</option>}
                </select>
              </div>
              <div>
                <label style={labelSt(theme)}>Senha de acesso</label>
                <input style={inputSt(theme)} value={loginSenha} placeholder="Senha"
                  onChange={e => setLoginSenha(e.target.value)} />
                {(data.telefone||'').replace(/\D/g,'').length >= 4 && (
                  <div style={{ fontSize:10, color: theme === 'dark' ? '#b0b0b0' : '#888', marginTop:3 }}>
                    Pré-preenchida com os 4 primeiros dígitos do telefone
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display:'flex', gap:9, justifyContent:'flex-end' }}>
        <button onClick={onCancel} style={{ fontSize:12, padding:'7px 16px', border: `0.5px solid ${theme === 'dark' ? '#444' : '#ccc'}`, borderRadius:8, cursor:'pointer', background:'#fff', color: theme === 'dark' ? '#d0d0d0' : '#666', fontWeight:500, transition:'all 0.2s ease' }} onMouseOver={e => { e.target.style.background = '#f5f5f5' }} onMouseOut={e => { e.target.style.background = '#fff' }}>Cancelar</button>
        <button onClick={handleSave} style={{
          fontSize:12, padding:'7px 18px', borderRadius:8, fontWeight:600,
          cursor: ok ? 'pointer' : 'not-allowed',
          border:`0.5px solid ${ok ? BRAND : '#ccc'}`,
          background: ok ? BRAND : '#ccc', color:'#fff',
          boxShadow: ok ? '0 4px 15px rgba(22, 56, 40, 0.3)' : 'none',
          transition:'all 0.2s ease'
        }} onMouseOver={e => { if (ok) { e.target.style.filter = 'brightness(0.90)' } }} onMouseOut={e => { e.target.style.filter = 'brightness(1)' }}>{isNew ? <><Icon ic={Plus} size={14} /> Adicionar</> : <><Icon ic={Check} size={14} /> Salvar</>}</button>
      </div>
    </div>
  )
}

function PeopleSection({ title, subtitle, type, people, onAdd, onUpdate, onDelete, accentColor }) {
  const { theme } = useTheme()
  const [showAdd,   setShowAdd]   = useState(false)
  const [addData,   setAddData]   = useState(type==='consultor' ? emptyConsultor : emptyColab)
  const [editingId, setEditingId] = useState(null)
  const [editData,  setEditData]  = useState({})
  const [deletingId,setDeletingId]= useState(null)

  function startEdit(p) { setDeletingId(null); setShowAdd(false); setEditingId(p.id); setEditData({...p}) }
  function saveEdit()   { onUpdate(editingId, editData); setEditingId(null) }
  function confirmDel(id){ onDelete(id); setDeletingId(null) }
  async function saveAdd(loginInfo) {
    const newPerson = { ...addData, id: Date.now() }
    onAdd(newPerson)
    if (loginInfo?.createLogin && newPerson.nome && loginInfo.senha) {
      const grupo = (loginInfo.role === 'consultor' || loginInfo.role === 'coordenador') ? 'gestao' : 'cliente'
      await dbAddUsuario({
        nome: newPerson.nome,
        email: newPerson.email || '',
        telefone: newPerson.telefone || '',
        role: loginInfo.role,
        cargo: type === 'consultor' ? (newPerson.especialidade || 'Consultor') : (newPerson.cargo || 'Colaborador'),
        grupo,
        senhaCustom: loginInfo.senha,
      })
    }
    setAddData(type==='consultor' ? emptyConsultor : emptyColab)
    setShowAdd(false)
  }

  return (
    <div style={{ background:'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(235,244,239,0.85) 100%)', border: `0.5px solid ${theme === 'dark' ? '#333' : '#e2e8e4'}`, borderTop:'3px solid #163828', borderRadius:14, boxShadow:'0 4px 15px rgba(22, 56, 40, 0.15)', overflow:'hidden', flex:1, minWidth:0 }}>
      {/* Header */}
      <div style={{ padding:'1.25rem 1.5rem', background: accentColor+'1A', borderBottom:`0.5px solid ${accentColor}45`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:15, fontWeight:600, color: accentColor }}>{title}</div>
          <div style={{ fontSize:11, color: theme === 'dark' ? '#b0b0b0' : '#888', marginTop:2 }}>{subtitle}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:11, fontWeight:700, color: accentColor, background: accentColor+'22', padding:'5px 14px', borderRadius:99 }}>{people.length}</span>
          <button onClick={() => { setShowAdd(s=>!s); setEditingId(null); setDeletingId(null) }}
            style={{ fontSize:12, padding:'7px 16px', border:`0.5px solid ${accentColor}`, borderRadius:8, cursor:'pointer', background: showAdd ? '#f0f0f0' : accentColor, color: showAdd ? '#555' : '#fff', fontWeight:600, boxShadow: !showAdd ? `0 4px 15px ${accentColor}4d` : 'none', transition:'all 0.2s ease' }} onMouseOver={e => { if (!showAdd) e.target.style.filter = 'brightness(0.90)' }} onMouseOut={e => { e.target.style.filter = 'brightness(1)' }}>
            {showAdd ? <Icon ic={X} size={14} /> : <><Icon ic={Plus} size={14} /> Novo</>}
          </button>
        </div>
      </div>

      <div style={{ padding:'1.25rem' }}>
        {showAdd && <PersonForm data={addData} onChange={setAddData} onSave={saveAdd} onCancel={() => setShowAdd(false)} type={type} isNew />}

        {people.length === 0 && !showAdd && (
          <div style={{ textAlign:'center', padding:'2rem', color: theme === 'dark' ? '#909090' : '#bbb', fontSize:12 }}>
            Nenhum registro ainda. Clique em "<Icon ic={Plus} size={18} /> Novo" para começar.
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:'.85rem' }}>
          {people.map(p => {
            if (deletingId===p.id) return (
              <div key={p.id} style={{ background:'#FCEBEB', border:'0.5px solid #F7C1C1', borderRadius:14, padding:'.9rem 1rem', display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:12, color:'#791F1F', flex:1 }}>Remover <strong>"{p.nome}"</strong>?</span>
                <button onClick={() => setDeletingId(null)} style={{ fontSize:11, padding:'5px 10px', border: `0.5px solid ${theme === 'dark' ? '#444' : '#ccc'}`, borderRadius:6, cursor:'pointer', background:'#fff', color: theme === 'dark' ? '#d0d0d0' : '#666' }}>Cancelar</button>
                <button onClick={() => confirmDel(p.id)} style={{ fontSize:11, padding:'5px 12px', border:'0.5px solid #A32D2D', borderRadius:6, cursor:'pointer', background:'#A32D2D', color:'#fff', fontWeight:500 }}><Icon ic={Trash2} size={11} /> Remover</button>
              </div>
            )
            if (editingId===p.id) return (
              <PersonForm key={p.id} data={editData} onChange={setEditData} onSave={saveEdit} onCancel={() => setEditingId(null)} type={type} isNew={false} />
            )
            return <PersonCard key={p.id} person={p} type={type} onEdit={startEdit} onDelete={id => setDeletingId(id)} />
          })}
        </div>
      </div>
    </div>
  )
}

function AreasSection({ areas, onAdd, onUpdate, onDelete }) {
  const { theme } = useTheme()
  const [showAdd,   setShowAdd]   = useState(false)
  const [addData,   setAddData]   = useState(emptyArea)
  const [editingId, setEditingId] = useState(null)
  const [editData,  setEditData]  = useState({})
  const [deletingId,setDeletingId]= useState(null)

  function startEdit(a) { setDeletingId(null); setShowAdd(false); setEditingId(a.id); setEditData({...a}) }
  function saveEdit()   { onUpdate(editingId, editData); setEditingId(null) }
  function confirmDel(id){ onDelete(id); setDeletingId(null) }
  function saveAdd() {
    const newArea = { ...addData, id: Date.now() }
    onAdd(newArea)
    setAddData(emptyArea)
    setShowAdd(false)
  }

  return (
    <div style={{ background:'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(235,244,239,0.85) 100%)', border: `0.5px solid ${theme === 'dark' ? '#333' : '#e2e8e4'}`, borderTop:'3px solid #163828', borderRadius:14, boxShadow:'0 4px 15px rgba(22, 56, 40, 0.15)', overflow:'hidden', flex:1, minWidth:0 }}>
      <div style={{ padding:'1.25rem 1.5rem', background: BRAND+'1A', borderBottom:`0.5px solid ${BRAND}45`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:15, fontWeight:600, color: BRAND }}>Áreas da Empresa</div>
          <div style={{ fontSize:11, color: theme === 'dark' ? '#b0b0b0' : '#888', marginTop:2 }}>Configure as áreas para exibição nos processos</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:12, fontWeight:700, color: BRAND, background: BRAND+'22', padding:'5px 14px', borderRadius:99 }}>{areas.length}</span>
          <button onClick={() => { setShowAdd(s=>!s); setEditingId(null); setDeletingId(null) }}
            style={{ fontSize:12, padding:'7px 16px', border:`0.5px solid ${BRAND}`, borderRadius:8, cursor:'pointer', background: showAdd ? '#f0f0f0' : BRAND, color: showAdd ? '#555' : '#fff', fontWeight:600, boxShadow: !showAdd ? `0 4px 15px ${BRAND}4d` : 'none', transition:'all 0.2s ease' }} onMouseOver={e => { if (!showAdd) e.target.style.filter = 'brightness(0.90)' }} onMouseOut={e => { e.target.style.filter = 'brightness(1)' }}>
            {showAdd ? <Icon ic={X} size={14} /> : <><Icon ic={Plus} size={14} /> Nova</>}
          </button>
        </div>
      </div>

      <div style={{ padding:'1.25rem' }}>
        {showAdd && <AreaForm data={addData} onChange={setAddData} onSave={saveAdd} onCancel={() => setShowAdd(false)} isNew />}

        {areas.length === 0 && !showAdd && (
          <div style={{ textAlign:'center', padding:'2rem', color: theme === 'dark' ? '#909090' : '#bbb', fontSize:12 }}>
            Nenhuma área configurada. Clique em "<Icon ic={Plus} size={18} /> Nova" para começar.
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:'.85rem' }}>
          {areas.map(a => {
            if (deletingId===a.id) return (
              <div key={a.id} style={{ background:'#FCEBEB', border:'0.5px solid #F7C1C1', borderRadius:14, padding:'.9rem 1rem', display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:12, color:'#791F1F', flex:1 }}>Remover <strong>"{a.nome}"</strong>?</span>
                <button onClick={() => setDeletingId(null)} style={{ fontSize:11, padding:'5px 10px', border: `0.5px solid ${theme === 'dark' ? '#444' : '#ccc'}`, borderRadius:6, cursor:'pointer', background:'#fff', color: theme === 'dark' ? '#d0d0d0' : '#666' }}>Cancelar</button>
                <button onClick={() => confirmDel(a.id)} style={{ fontSize:11, padding:'5px 12px', border:'0.5px solid #A32D2D', borderRadius:6, cursor:'pointer', background:'#A32D2D', color:'#fff', fontWeight:500 }}><Icon ic={Trash2} size={11} /> Remover</button>
              </div>
            )
            if (editingId===a.id) return (
              <AreaForm key={a.id} data={editData} onChange={setEditData} onSave={saveEdit} onCancel={() => setEditingId(null)} isNew={false} />
            )
            return <AreaCard key={a.id} area={a} onEdit={startEdit} onDelete={id => setDeletingId(id)} />
          })}
        </div>
      </div>
    </div>
  )
}

function SolicitacoesPendentes() {
  const { theme } = useTheme()
  const [list, setList] = useState([])

  async function refresh() {
    const data = await dbGetSolicitacoes()
    setList(data)
  }

  useEffect(() => { refresh() }, [])

  async function aprovar(item) {
    await dbAddUsuario({
      nome: item.nome, email: item.email, telefone: item.telefone,
      role: item.role, cargo: item.cargo, grupo: item.grupo,
    })
    await dbUpdateSolicitacao(item.id, { status: 'aprovado' })
    refresh()
  }

  async function rejeitar(id) {
    await dbUpdateSolicitacao(id, { status: 'rejeitado' })
    refresh()
  }

  const pendentes = list.filter(x => x.status === 'pendente')
  const outros    = list.filter(x => x.status !== 'pendente')

  return (
    <div style={{ background:'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(235,244,239,0.85) 100%)', border: `0.5px solid ${theme === 'dark' ? '#333' : '#e2e8e4'}`, borderTop:'3px solid #163828', borderRadius:14, boxShadow:'0 4px 15px rgba(22, 56, 40, 0.15)', overflow:'hidden', marginBottom:'1.5rem' }}>
      <div style={{ padding:'1.25rem 1.5rem', background:ACCENT_LT, borderBottom:`0.5px solid ${ACCENT}45`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:'#7A5F10' }}>Solicitações Pendentes</div>
          <div style={{ fontSize:11, color: theme === 'dark' ? '#b0b0b0' : '#888', marginTop:2 }}>Aprovar ou rejeitar novos cadastros</div>
        </div>
        {pendentes.length > 0 && (
          <span style={{ fontSize:12, fontWeight:700, color:'#fff', background:'#E24B4A', padding:'5px 14px', borderRadius:99, boxShadow:'0 4px 15px rgba(226, 75, 74, 0.4)' }}>{pendentes.length}</span>
        )}
      </div>
      <div style={{ padding:'1.25rem' }}>
        {pendentes.length === 0 && outros.length === 0 && (
          <div style={{ textAlign:'center', padding:'1.5rem', fontSize:12, color: theme === 'dark' ? '#909090' : '#bbb' }}>Nenhuma solicitação ainda.</div>
        )}
        {pendentes.map(item => (
          <div key={item.id} style={{ background:'#FAFCFA', border:`0.5px solid ${BRAND_BRD}`, borderRadius:10, padding:'.85rem 1rem', marginBottom:'.6rem' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:500, color: theme === 'dark' ? '#f0f0f0' : '#111' }}>{item.nome}</div>
                <div style={{ fontSize:11, color: theme === 'dark' ? '#d0d0d0' : '#555', marginTop:2 }}>{item.email} · {item.telefone}</div>
                <div style={{ display:'flex', gap:6, marginTop:4, flexWrap:'wrap' }}>
                  <span style={{ fontSize:11, padding:'4px 12px', borderRadius:99, background:BRAND_LIGHT, color:BRAND_MID, fontWeight:600 }}>{item.grupo === 'gestao' ? 'Grupo Gestão' : 'Cliente'}</span>
                  <span style={{ fontSize:11, padding:'4px 12px', borderRadius:99, background:'#f0f0f0', color: theme === 'dark' ? '#d0d0d0' : '#666', fontWeight:600 }}>{item.role}</span>
                  {item.area && <span style={{ fontSize:11, padding:'4px 12px', borderRadius:99, background:'#f0f0f0', color: theme === 'dark' ? '#d0d0d0' : '#666', fontWeight:600 }}>Área: {item.area}</span>}
                  {item.cargo && item.grupo === 'cliente' && item.role === 'colaborador' && <span style={{ fontSize:11, padding:'4px 12px', borderRadius:99, background:'#f0f0f0', color: theme === 'dark' ? '#d0d0d0' : '#666', fontWeight:600 }}>{item.cargo}</span>}
                </div>
                <div style={{ fontSize:10, color: theme === 'dark' ? '#909090' : '#bbb', marginTop:3 }}>{new Date(item.created_at || item.dataSolicitacao).toLocaleString('pt-BR')}</div>
              </div>
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                <button onClick={() => aprovar(item)} style={{ fontSize:11, padding:'5px 11px', border:`0.5px solid ${BRAND_MID}`, borderRadius:7, cursor:'pointer', background:BRAND_LIGHT, color:BRAND, fontWeight:500 }}><Icon ic={CheckCircle} size={12} /> Aprovar</button>
                <button onClick={() => rejeitar(item.id)} style={{ fontSize:11, padding:'5px 11px', border:'0.5px solid #f5c6c6', borderRadius:7, cursor:'pointer', background:'#fff', color:'#A32D2D' }}><Icon ic={XCircle} size={12} /> Rejeitar</button>
              </div>
            </div>
          </div>
        ))}
        {outros.length > 0 && (
          <div style={{ marginTop:8 }}>
            <div style={{ fontSize:11, color: theme === 'dark' ? '#909090' : '#bbb', marginBottom:6 }}>Histórico</div>
            {outros.map(item => (
              <div key={item.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'.6rem .9rem', background: theme === 'dark' ? '#1a1a1a' : '#fafafa', borderRadius:8, marginBottom:4, opacity:.7 }}>
                <span style={{ fontSize:18 }}>{item.status === 'aprovado' ? <Icon ic={CheckCircle} size={18} style={{color:BRAND_MID}} /> : <Icon ic={XCircle} size={18} style={{color:'#A32D2D'}} />}</span>
                <div style={{ flex:1, fontSize:11, color: theme === 'dark' ? '#d0d0d0' : '#555' }}>{item.nome} — {item.email}</div>
                <span style={{ fontSize:11, padding:'4px 12px', borderRadius:99, background: item.status==='aprovado' ? BRAND_LIGHT : '#FCEBEB', color: item.status==='aprovado' ? BRAND_MID : '#A32D2D', fontWeight:600 }}>{item.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function GerarConvites() {
  const { theme } = useTheme()
  const [roleInv, setRoleInv] = useState('consultor')
  const [invites, setInvitesState] = useState([])
  const [copied, setCopied] = useState(null)
  const BASE_URL = 'https://clientpanel-dashboard.vercel.app'

  useEffect(() => {
    dbGetConvites().then(setInvitesState)
  }, [])

  async function gerarLink() {
    const token = Math.random().toString(36).slice(2,10)
    await dbAddConvite(token, roleInv)
    const upd = await dbGetConvites()
    setInvitesState(upd)
  }

  function copyLink(token) {
    const url = `${BASE_URL}?invite=${token}`
    navigator.clipboard.writeText(url).then(() => { setCopied(token); setTimeout(() => setCopied(null), 2000) })
  }

  return (
    <div style={{ background:'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(235,244,239,0.85) 100%)', border: `0.5px solid ${theme === 'dark' ? '#333' : '#e2e8e4'}`, borderTop:'3px solid #163828', borderRadius:14, boxShadow:'0 4px 15px rgba(22, 56, 40, 0.15)', overflow:'hidden', marginBottom:'1.5rem' }}>
      <div style={{ padding:'1.25rem 1.5rem', background:BRAND_LIGHT, borderBottom:`0.5px solid ${BRAND_BRD}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:BRAND }}>Gerar Link de Convite</div>
          <div style={{ fontSize:11, color: theme === 'dark' ? '#b0b0b0' : '#888', marginTop:2 }}>Convide usuários com perfil pré-definido</div>
        </div>
      </div>
      <div style={{ padding:'1.25rem' }}>
        <div style={{ display:'flex', gap:9, marginBottom:'1.25rem', alignItems:'flex-end' }}>
          <div style={{ flex:1 }}>
            <label style={labelSt(theme)}>Função do convidado</label>
            <select style={{ ...inputSt(theme), cursor:'pointer' }} value={roleInv} onChange={e => setRoleInv(e.target.value)}>
              <option value="consultor">Consultor</option>
              <option value="socio">Sócio</option>
              <option value="colaborador">Colaborador</option>
            </select>
          </div>
          <button onClick={gerarLink} style={{ fontSize:12, padding:'9px 18px', borderRadius:8, border:`0.5px solid ${BRAND}`, background:BRAND, color:'#fff', cursor:'pointer', fontWeight:600, whiteSpace:'nowrap', boxShadow:`0 4px 15px ${BRAND}4d`, transition:'all 0.2s ease' }} onMouseOver={e => { e.target.style.filter = 'brightness(0.90)' }} onMouseOut={e => { e.target.style.filter = 'brightness(1)' }}>
            <Icon ic={Link} size={16} /> Gerar Link
          </button>
        </div>

        {invites.length === 0 && (
          <div style={{ textAlign:'center', padding:'1rem', fontSize:12, color: theme === 'dark' ? '#909090' : '#bbb' }}>Nenhum convite gerado ainda.</div>
        )}
        {invites.map(inv => {
          const url = `${BASE_URL}?invite=${inv.token}`
          return (
            <div key={inv.token} style={{ display:'flex', alignItems:'center', gap:8, padding:'.7rem .9rem', background: theme === 'dark' ? '#1a1a1a' : '#fafafa', border: `0.5px solid ${theme === 'dark' ? '#333' : '#e2e8e4'}`, borderRadius:9, marginBottom:6 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                  <span style={{ fontSize:11, padding:'4px 12px', borderRadius:99, background:BRAND_LIGHT, color:BRAND_MID, fontWeight:600 }}>{inv.role}</span>
                  <span style={{ fontSize:11, padding:'4px 12px', borderRadius:99, background: inv.status==='usado' ? '#f0f0f0' : '#EBF4EF', color: inv.status==='usado' ? '#888' : BRAND_MID, fontWeight:600 }}>{inv.status}</span>
                </div>
                <div style={{ fontSize:10, color: theme === 'dark' ? '#b0b0b0' : '#888', fontFamily:'monospace', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{url}</div>
              </div>
              <button onClick={() => copyLink(inv.token)} style={{ fontSize:11, padding:'5px 10px', border:`0.5px solid ${BRAND_BRD}`, borderRadius:7, cursor:'pointer', background: copied===inv.token ? BRAND_LIGHT : '#fff', color: copied===inv.token ? BRAND : '#555', whiteSpace:'nowrap', flexShrink:0 }}>
                {copied===inv.token ? <><Icon ic={Check} size={12} /> Copiado</> : <><Icon ic={ClipboardList} size={12} /> Copiar</>}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Configuracoes({ colaboradores, consultores, areas, onColabAdd, onColabUpdate, onColabDelete, onConsultorAdd, onConsultorUpdate, onConsultorDelete, onAreaAdd, onAreaUpdate, onAreaDelete, user }) {
  const { theme } = useTheme()
  const isCoord = user?.role === 'coordenador'
  return (
    <div>
      <div style={{ fontSize:28, fontWeight:800, color: theme === 'dark' ? '#f0f0f0' : '#111', marginBottom:'.3rem' }}>Configurações</div>
      <div style={{ fontSize:13, color: theme === 'dark' ? '#a0a0a0' : '#999', marginBottom:'1.5rem' }}>Gerencie os participantes e consultores do projeto DF Turismo</div>

      {isCoord && <SolicitacoesPendentes />}
      {isCoord && <GerarConvites />}

      {isCoord && <AreasSection areas={areas} onAdd={onAreaAdd} onUpdate={onAreaUpdate} onDelete={onAreaDelete} />}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', alignItems:'start', marginTop: isCoord ? '1.5rem' : 0 }}>
        <PeopleSection
          title="Colaboradores / Atores"
          subtitle="Participantes da coleta de processos"
          type="colaborador"
          people={colaboradores}
          onAdd={onColabAdd}
          onUpdate={onColabUpdate}
          onDelete={onColabDelete}
          accentColor="#6B7280"
        />
        <PeopleSection
          title="Consultores"
          subtitle="Responsáveis pelo mapeamento"
          type="consultor"
          people={consultores}
          onAdd={onConsultorAdd}
          onUpdate={onConsultorUpdate}
          onDelete={onConsultorDelete}
          accentColor={BRAND}
        />
      </div>
    </div>
  )
}

// ─── Calendar nav bar ─────────────────────────────────────────
function CalNavBar({ label, onPrev, onNext, onToday, mode, setMode }) {
  const { theme } = useTheme()
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'1rem', flexWrap:'wrap' }}>
      <button onClick={onToday} style={{ fontSize:11, padding:'5px 12px', border:`0.5px solid ${BRAND_BRD}`, borderRadius:7, cursor:'pointer', background:BRAND_LIGHT, color:BRAND, fontWeight:500 }}>Hoje</button>
      <div style={{ display:'flex', alignItems:'center', gap:2 }}>
        <button onClick={onPrev} style={{ width:28, height:28, border: `0.5px solid ${theme === 'dark' ? '#333' : '#ddd'}`, borderRadius:6, cursor:'pointer', background:'#fff', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', color: theme === 'dark' ? '#d0d0d0' : '#555' }}>‹</button>
        <button onClick={onNext} style={{ width:28, height:28, border: `0.5px solid ${theme === 'dark' ? '#333' : '#ddd'}`, borderRadius:6, cursor:'pointer', background:'#fff', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', color: theme === 'dark' ? '#d0d0d0' : '#555' }}>›</button>
      </div>
      <span style={{ fontSize:15, fontWeight:500, color: theme === 'dark' ? '#f0f0f0' : '#111', flex:1 }}>{label}</span>
      <div style={{ display:'flex', border: `0.5px solid ${theme === 'dark' ? '#333' : '#ddd'}`, borderRadius:8, overflow:'hidden' }}>
        {['dia','semana','mês','ano'].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            fontSize:11, padding:'5px 11px', cursor:'pointer', border:'none',
            background: mode===m ? BRAND : '#fff',
            color: mode===m ? '#fff' : '#555',
            fontWeight: mode===m ? 500 : 400,
          }}>{m.charAt(0).toUpperCase()+m.slice(1)}</button>
        ))}
      </div>
    </div>
  )
}

// ─── Day view ─────────────────────────────────────────────────
function AgendaDia({ user, meetings, viewDate, onToggle, onEdit, onNew, onUpdate }) {
  const { theme } = useTheme()
  const ymd    = toYMD(viewDate)
  const evs    = meetings.filter(m => m.date===ymd)
  const totalH = HOURS.length * HOUR_H
  return (
    <div style={{ background:'#fff', border: `0.5px solid ${theme === 'dark' ? '#333' : '#e2e8e4'}`, borderRadius:14, boxShadow:'0 1px 3px rgba(0,0,0,0.05)', overflow:'hidden' }}>
      <div style={{ padding:'.65rem 1rem', background:BRAND_LIGHT, borderBottom: `0.5px solid ${theme === 'dark' ? '#333' : '#e2e8e4'}`, fontSize:13, fontWeight:500, color:BRAND }}>
        {DAY_PT[viewDate.getDay()]} — {viewDate.getDate()} de {MONTH_PT[viewDate.getMonth()]} de {viewDate.getFullYear()}
        {evs.length===0 && <span style={{ fontSize:11, color: theme === 'dark' ? '#909090' : '#aaa', fontWeight:400, marginLeft:12 }}>Nenhuma reunião agendada</span>}
      </div>
      <div style={{ display:'flex', overflowY:'auto', maxHeight:560 }}>
        <div style={{ width:52, flexShrink:0, position:'relative', height:totalH }}>
          {HOURS.map(h => <div key={h} style={{ position:'absolute', top:(h-DAY_START)*HOUR_H-8, right:8, fontSize:10, color: theme === 'dark' ? '#909090' : '#bbb' }}>{p2(h)}:00</div>)}
        </div>
        <div style={{ flex:1, position:'relative', height:totalH, borderLeft: `0.5px solid ${theme === 'dark' ? '#222' : '#eee'}` }}>
          {HOURS.map(h => <div key={h} style={{ position:'absolute', top:(h-DAY_START)*HOUR_H, left:0, right:0, borderTop:'0.5px solid #f0f0f0', height:HOUR_H }} />)}
          {evs.map(m => {
            const c   = EV_COLORS[(m.ci??0)%5]
            const top = ((m.sh-DAY_START)+m.sm/60)*HOUR_H
            const ht  = Math.max(((m.eh-m.sh)+(m.em-m.sm)/60)*HOUR_H, 32)
            return (
              <div key={m.id} onClick={() => onEdit && onEdit(m)} style={{
                position:'absolute', top:top+2, left:6, right:6, height:ht-4,
                background: m.canceled ? '#f5f5f5' : c.bg, border:`1px solid ${m.canceled ? '#ddd' : c.brd}`,
                borderRadius:8, padding:'5px 10px', cursor:'pointer', opacity: m.canceled ? .5 : 1,
              }}>
                <div style={{ fontSize:12, fontWeight:500, color: m.canceled ? '#aaa' : c.txt, textDecoration: m.canceled ? 'line-through' : 'none' }}>{m.title}</div>
                <div style={{ fontSize:11, color: m.canceled ? '#bbb' : c.brd, marginTop:2 }}>{p2(m.sh)}:{p2(m.sm)} – {p2(m.eh)}:{p2(m.em)}</div>
                <div style={{ fontSize:10, color: m.canceled ? '#bbb' : c.brd, marginTop:3 }}>
                  {Array.isArray(m.participantes) && m.participantes.length > 0 ? (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                      {m.participantes.map((p,i) => (
                        <span key={i} style={{ padding:'2px 6px', background: 'rgba(0,0,0,.1)', borderRadius:4, whiteSpace:'nowrap' }}>{p}</span>
                      ))}
                    </div>
                  ) : m.who ? (
                    <span><Icon ic={User} size={10} /> {m.who}</span>
                  ) : null}
                </div>
                {m.meetLink && !m.canceled && (
                  <div style={{ marginTop:4, display:'flex', gap:4 }}>
                    <a href={m.meetLink} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                      style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:9, fontWeight:500, color:'#fff', background:'#1a73e8', padding:'3px 8px', borderRadius:99, textDecoration:'none' }}>
                      <Icon ic={Video} size={10} /> Entrar
                    </a>
                    {user && m.participantes?.includes(user.nome) && (
                      <button onClick={e => { e.stopPropagation(); onUpdate(m.id, { participantes: m.participantes.filter(p => p !== user.nome) }) }} style={{ fontSize:9, padding:'3px 8px', border:'0.5px solid rgba(0,0,0,.2)', background:'rgba(0,0,0,.05)', borderRadius:99, cursor:'pointer' }}>Sair</button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          <div onClick={() => onNew && onNew(ymd)} style={{ position:'absolute', bottom:8, right:8, width:28, height:28, borderRadius:'50%', background:BRAND, color:'#fff', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,.2)', userSelect:'none' }} title="Novo evento"><Icon ic={Plus} size={16} /></div>
        </div>
      </div>
    </div>
  )
}

// ─── Week view ────────────────────────────────────────────────
function AgendaSemana({ user, meetings, viewDate, onToggle, onEdit, onNew, onUpdate }) {
  const { theme } = useTheme()
  const mon    = weekMon(viewDate)
  const cols   = Array.from({ length:5 }, (_, i) => addDays(mon, i))
  const totalH = HOURS.length * HOUR_H
  const today  = new Date()
  return (
    <div style={{ background:'#fff', border: `0.5px solid ${theme === 'dark' ? '#333' : '#e2e8e4'}`, borderRadius:14, boxShadow:'0 1px 3px rgba(0,0,0,0.05)', overflow:'hidden' }}>
      <div style={{ display:'flex', borderBottom: `0.5px solid ${theme === 'dark' ? '#333' : '#e2e8e4'}` }}>
        <div style={{ width:52, flexShrink:0 }} />
        {cols.map((col, i) => {
          const isToday = sameDay(col, today)
          return (
            <div key={i} style={{ flex:1, padding:'.55rem .5rem', textAlign:'center', borderLeft:'0.5px solid #e2e8e4', background: isToday ? BRAND_LIGHT : 'transparent' }}>
              <div style={{ fontSize:10, color: theme === 'dark' ? '#b0b0b0' : '#888' }}>{DAY_PT[col.getDay()]}</div>
              <div style={{ width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'3px auto 0', fontSize:14, fontWeight: isToday ? 600 : 400, background: isToday ? BRAND : 'transparent', color: isToday ? '#fff' : '#111' }}>{col.getDate()}</div>
            </div>
          )
        })}
      </div>
      <div style={{ overflowY:'auto', maxHeight:520 }}>
        <div style={{ display:'flex', position:'relative' }}>
          <div style={{ width:52, flexShrink:0, position:'relative', height:totalH }}>
            {HOURS.map(h => <div key={h} style={{ position:'absolute', top:(h-DAY_START)*HOUR_H-8, right:8, fontSize:10, color: theme === 'dark' ? '#909090' : '#bbb' }}>{p2(h)}:00</div>)}
          </div>
          {cols.map((col, di) => {
            const ymd     = toYMD(col)
            const isToday = sameDay(col, today)
            return (
              <div key={di} style={{ flex:1, borderLeft:'0.5px solid #e2e8e4', position:'relative', height:totalH, background: isToday ? '#FAFCFA' : 'transparent' }}>
                {HOURS.map(h => <div key={h} style={{ position:'absolute', top:(h-DAY_START)*HOUR_H, left:0, right:0, borderTop:'0.5px solid #f0f0f0', height:HOUR_H }} />)}
                {meetings.filter(m => m.date===ymd).map(m => {
                  const c   = EV_COLORS[(m.ci??0)%5]
                  const top = ((m.sh-DAY_START)+m.sm/60)*HOUR_H
                  const ht  = Math.max(((m.eh-m.sh)+(m.em-m.sm)/60)*HOUR_H, 28)
                  return (
                    <div key={m.id} onClick={() => onEdit ? onEdit(m) : onToggle(m.id)} title="Clique para editar"
                      style={{ position:'absolute', top:top+2, left:2, right:2, height:ht-4, background: m.canceled ? '#f5f5f5' : c.bg, border:`1px solid ${m.canceled ? '#ddd' : c.brd}`, borderRadius:6, padding:'3px 5px', cursor:'pointer', overflow:'hidden', opacity: m.canceled ? .5 : 1 }}>
                      <div style={{ fontSize:10, fontWeight:500, color: m.canceled ? '#aaa' : c.txt, textDecoration: m.canceled?'line-through':'none', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {m.meetLink && !m.canceled && <span style={{ marginRight:3 }}><Icon ic={Video} size={11} /></span>}{m.title}
                      </div>
                      {ht>36 && <div style={{ fontSize:9, color: m.canceled ? '#bbb' : c.brd, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p2(m.sh)}:{p2(m.sm)}–{p2(m.eh)}:{p2(m.em)}</div>}
                      {ht>52 && m.meetLink && !m.canceled && (
                        <a href={m.meetLink} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}
                          style={{ fontSize:8, color:'#1a73e8', textDecoration:'none', display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          Entrar no Meet
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
      <div style={{ padding:'.4rem .8rem', borderTop: `0.5px solid ${theme === 'dark' ? '#222' : '#eee'}`, fontSize:10, color: theme === 'dark' ? '#909090' : '#bbb' }}>Clique em um evento para editar</div>
    </div>
  )
}

// ─── Month view ───────────────────────────────────────────────
function AgendaMes({ user, meetings, viewDate, onToggle, onDrillDay, onUpdate }) {
  const { theme } = useTheme()
  const cells = monthGrid(viewDate)
  const today = new Date()
  return (
    <div style={{ background:'#fff', border: `0.5px solid ${theme === 'dark' ? '#333' : '#e2e8e4'}`, borderRadius:14, boxShadow:'0 1px 3px rgba(0,0,0,0.05)', overflow:'hidden' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom: `0.5px solid ${theme === 'dark' ? '#222' : '#eee'}` }}>
        {['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(dl => (
          <div key={dl} style={{ padding:'8px 0', textAlign:'center', fontSize:10, fontWeight:500, color: theme === 'dark' ? '#b0b0b0' : '#888' }}>{dl}</div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} style={{ minHeight:72, background: theme === 'dark' ? '#1a1a1a' : '#fafafa', borderRight:'0.5px solid #f0f0f0', borderBottom:'0.5px solid #f0f0f0' }} />
          const ymd     = toYMD(cell)
          const evs     = meetings.filter(m => m.date===ymd)
          const isToday = sameDay(cell, today)
          const inMonth = cell.getMonth()===viewDate.getMonth()
          return (
            <div key={i} onClick={() => onDrillDay(cell)}
              style={{ minHeight:72, padding:'5px 6px', border:'0.5px solid #f0f0f0', cursor:'pointer', background: isToday ? BRAND_LIGHT : '#fff', opacity: inMonth ? 1 : .35 }}>
              <div style={{ width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight: isToday ? 600 : 400, marginBottom:3, background: isToday ? BRAND : 'transparent', color: isToday ? '#fff' : '#333' }}>{cell.getDate()}</div>
              {evs.slice(0,2).map(m => (
                <div key={m.id} onClick={e => { e.stopPropagation(); onToggle(m.id) }}
                  style={{ fontSize:9, padding:'1px 5px', borderRadius:3, marginBottom:2, background: m.canceled ? '#eee' : EV_COLORS[(m.ci??0)%5].bg, color: m.canceled ? '#aaa' : EV_COLORS[(m.ci??0)%5].txt, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', textDecoration: m.canceled ? 'line-through' : 'none' }}>
                  {m.title}
                </div>
              ))}
              {evs.length>2 && <div style={{ fontSize:9, color: theme === 'dark' ? '#b0b0b0' : '#888' }}>+{evs.length-2} mais</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Year view ────────────────────────────────────────────────
function AgendaAno({ user, meetings, viewDate, onToggle, onDrillMonth, onUpdate }) {
  const { theme } = useTheme()
  const year  = viewDate.getFullYear()
  const today = new Date()
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
      {Array.from({ length:12 }, (_, mi) => {
        const anchor  = new Date(year, mi, 1, 12)
        const cells   = monthGrid(anchor)
        const evCount = meetings.filter(m => { const dt=fromYMD(m.date); return dt.getFullYear()===year&&dt.getMonth()===mi }).length
        return (
          <div key={mi} style={{ background:'#fff', border: `0.5px solid ${theme === 'dark' ? '#333' : '#e2e8e4'}`, borderRadius:10, padding:'10px 8px' }}>
            <div onClick={() => onDrillMonth(anchor)} style={{ fontSize:12, fontWeight:500, color:BRAND, marginBottom:6, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
              {MONTH_PT[mi].charAt(0).toUpperCase()+MONTH_PT[mi].slice(1)}
              {evCount>0 && <span style={{ fontSize:11, padding:'4px 12px', borderRadius:99, background:BRAND_LIGHT, color:BRAND_MID, fontWeight:600 }}>{evCount}</span>}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:1 }}>
              {['S','T','Q','Q','S','S','D'].map((dl,i) => (
                <div key={i} style={{ fontSize:7, color: theme === 'dark' ? '#909090' : '#bbb', textAlign:'center', paddingBottom:2 }}>{dl}</div>
              ))}
              {cells.map((cell, ci) => {
                if (!cell) return <div key={ci} />
                const ymd     = toYMD(cell)
                const hasEv   = meetings.some(m => m.date===ymd)
                const isToday = sameDay(cell, today)
                return (
                  <div key={ci} onClick={() => hasEv && onDrillMonth(cell)}
                    style={{ aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%', fontSize:8, cursor: hasEv ? 'pointer' : 'default', background: isToday ? BRAND : hasEv ? BRAND_LIGHT : 'transparent', color: isToday ? '#fff' : '#444', fontWeight: isToday ? 600 : 400, outline: hasEv&&!isToday ? `1.5px solid ${BRAND_BRD}` : 'none' }}>
                    {cell.getDate()}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Agenda tab ───────────────────────────────────────────────
function Agenda({ user, meetings, colaboradores, onAdd, onUpdate, onDelete, onToggle }) {
  const { theme } = useTheme()
  const todayDt = new Date(); todayDt.setHours(12,0,0,0)
  const [viewDate,  setViewDate ] = useState(todayDt)
  const [mode,      setMode     ] = useState('semana')
  const [editingM,  setEditingM ] = useState(null)  // meeting object or 'new'
  const [newDate,   setNewDate  ] = useState(null)

  function navLabel() {
    if (mode==='dia')    return `${DAY_PT[viewDate.getDay()]}, ${viewDate.getDate()} de ${MONTH_PT[viewDate.getMonth()]} de ${viewDate.getFullYear()}`
    if (mode==='semana') { const mon=weekMon(viewDate); const fri=addDays(mon,4); return `${mon.getDate()}–${fri.getDate()} de ${MONTH_PT[mon.getMonth()]} de ${mon.getFullYear()}` }
    if (mode==='mês')    return `${MONTH_PT[viewDate.getMonth()].charAt(0).toUpperCase()+MONTH_PT[viewDate.getMonth()].slice(1)} ${viewDate.getFullYear()}`
    return `${viewDate.getFullYear()}`
  }
  function navigate(dir) {
    if (mode==='dia')    setViewDate(v => addDays(v, dir))
    if (mode==='semana') setViewDate(v => addDays(v, dir*7))
    if (mode==='mês')    setViewDate(v => addMonths(v, dir))
    if (mode==='ano')    setViewDate(v => addMonths(v, dir*12))
  }
  function goToday() { const t=new Date(); t.setHours(12,0,0,0); setViewDate(t) }

  function openNew(date) { setNewDate(date || toYMD(viewDate)); setEditingM('new') }
  function openEdit(m)   { setEditingM(m) }
  function closeForm()   { setEditingM(null); setNewDate(null) }

  function handleSave(data) {
    if (editingM === 'new') {
      onAdd(data)
    } else {
      onUpdate(editingM.id, data)
    }
    closeForm()
  }

  const upcoming = meetings.filter(m => !m.canceled && m.date >= toYMD(todayDt))
  const canceled = meetings.filter(m => m.canceled)

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'.2rem' }}>
        <div style={{ fontSize:28, fontWeight:800, color: theme === 'dark' ? '#f0f0f0' : '#111' }}>Agenda</div>
        <button onClick={() => openNew()} style={{
          fontSize:12, padding:'9px 18px', borderRadius:8, fontWeight:600, cursor:'pointer',
          border:`0.5px solid ${BRAND}`, background:BRAND, color:'#fff', boxShadow:`0 4px 15px ${BRAND}4d`, transition:'all 0.2s ease'
        }} onMouseOver={e => { e.target.style.filter = 'brightness(0.90)' }} onMouseOut={e => { e.target.style.filter = 'brightness(1)' }}><Icon ic={Plus} size={20} /> Novo evento</button>
      </div>
      <div style={{ fontSize:13, color: theme === 'dark' ? '#a0a0a0' : '#999', marginBottom:'1.5rem' }}>
        {upcoming.length} reunião(ões) futura(s)
        {canceled.length>0 && <span style={{ marginLeft:10, color:'#A32D2D' }}>· {canceled.length} cancelada(s)</span>}
      </div>
      <CalNavBar label={navLabel()} onPrev={() => navigate(-1)} onNext={() => navigate(1)} onToday={goToday} mode={mode} setMode={setMode} />
      {mode==='dia'    && <AgendaDia    user={user} meetings={meetings} viewDate={viewDate} onToggle={onToggle} onEdit={openEdit} onNew={openNew} onUpdate={onUpdate} />}
      {mode==='semana' && <AgendaSemana user={user} meetings={meetings} viewDate={viewDate} onToggle={onToggle} onEdit={openEdit} onNew={openNew} onUpdate={onUpdate} />}
      {mode==='mês'    && <AgendaMes    user={user} meetings={meetings} viewDate={viewDate} onToggle={onToggle} onEdit={openEdit} onDrillDay={dt => { setViewDate(dt); setMode('dia') }} onUpdate={onUpdate} />}
      {mode==='ano'    && <AgendaAno    user={user} meetings={meetings} viewDate={viewDate} onToggle={onToggle} onDrillMonth={dt => { setViewDate(dt); setMode('mês') }} onUpdate={onUpdate} />}

      {editingM && (
        <EventForm
          initial={editingM === 'new' ? { date: newDate } : editingM}
          colaboradores={colaboradores}
          onSave={handleSave}
          onCancel={closeForm}
          onDelete={editingM !== 'new' ? () => { onDelete(editingM.id); closeForm() } : null}
        />
      )}
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────
function DashboardSocio({ processes, areas, colaboradores, consultores }) {
  const { theme } = useTheme()
  const [selectedAreas, setSelectedAreas] = useState([])
  const [selectedStages, setSelectedStages] = useState([])

  const STAGES = [
    { key: 'coleta', label: 'Coletado', color: '#6B7280' },
    { key: 'modelagem', label: 'Modelado', color: '#F59E0B' },
    { key: 'valCOPS', label: 'Validação Interna', color: '#3B82F6' },
    { key: 'corrCOPS', label: 'Correção', color: '#8B5CF6' },
    { key: 'valCliente', label: 'Validação Final', color: '#10B981' },
    { key: 'analise', label: 'Análise Crítica', color: '#EC4899' },
  ]

  // Filtros
  const filtered = processes.filter(p => {
    const areaMatch = selectedAreas.length === 0 || (Array.isArray(p.area) ? p.area : [p.area]).some(a => selectedAreas.includes(a))
    const stageMatch = selectedStages.length === 0 || selectedStages.some(s => p[s])
    return areaMatch && stageMatch
  })

  // Métricas
  const total = filtered.length
  const byStage = {}
  STAGES.forEach(s => { byStage[s.key] = filtered.filter(p => p[s.key]).length })
  const completed = filtered.filter(p => p.confirmed).length
  const avgPct = total ? Math.round(filtered.map(getPct).reduce((a, b) => a + b, 0) / total) : 0

  // Contagem por área
  const byArea = {}
  areas.forEach(a => {
    byArea[a.nome] = filtered.filter(p => {
      const pa = Array.isArray(p.area) ? p.area : [p.area]
      return pa.includes(a.nome)
    }).length
  })

  const areaOpts = areas.map(a => a.nome)

  return (
    <div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#111', marginBottom: '.3rem' }}>Dashboard Sócio</div>
      <div style={{ fontSize: 13, color: '#999', marginBottom: '1.5rem' }}>Acompanhamento de processos por área e estágio</div>

      {/* Filtros */}
      <div style={{ background:'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(235,244,239,0.85) 100%)', border: '0.5px solid #e2e8e4', borderTop:'3px solid #163828', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem', boxShadow:'0 4px 15px rgba(22, 56, 40, 0.15)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label style={labelSt(theme)}>Filtrar por área</label>
            <ChipSelect values={selectedAreas} onChange={setSelectedAreas} options={areaOpts} allowFreeText={false} placeholder="Todas as áreas" />
          </div>
          <div>
            <label style={labelSt(theme)}>Filtrar por estágio</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STAGES.map(s => (
                <button
                  key={s.key}
                  onClick={() => setSelectedStages(st => st.includes(s.key) ? st.filter(x => x !== s.key) : [...st, s.key])}
                  style={{
                    fontSize: 11,
                    padding: '5px 10px',
                    borderRadius: 6,
                    border: `0.5px solid ${selectedStages.includes(s.key) ? s.color : '#ddd'}`,
                    background: selectedStages.includes(s.key) ? s.color + '15' : '#fff',
                    color: selectedStages.includes(s.key) ? s.color : '#888',
                    cursor: 'pointer',
                    fontWeight: selectedStages.includes(s.key) ? 500 : 400,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          [`${total}`, 'Processos', BRAND, <Icon ic={FolderOpen} size={40} />],
          [`${completed}/${total}`, 'Concluídos', completed === total && total > 0 ? BRAND_MID : ACCENT, <Icon ic={Check} size={40} />],
          [`${avgPct}%`, 'Progresso médio', avgPct >= 70 ? BRAND_MID : ACCENT, <Icon ic={BarChart2} size={40} />],
        ].map(([val, lbl, clr, ico]) => (
          <div key={lbl} style={{ background:'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(235,244,239,0.85) 100%)', border: '0.5px solid #e2e8e4', borderTop:'3px solid #163828', borderRadius: 14, padding: '1.25rem 1.25rem', display: 'flex', alignItems: 'center', gap: 16, boxShadow:'0 4px 15px rgba(22, 56, 40, 0.15)' }}>
            <span style={{ fontSize: 40, color: clr }}>{ico}</span>
            <div><div style={{ fontSize: 22, fontWeight: 700, color: clr }}>{val}</div><div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>{lbl}</div></div>
          </div>
        ))}
      </div>

      {/* Progresso por estágio */}
      <div style={{ background:'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(235,244,239,0.85) 100%)', border: '0.5px solid #e2e8e4', borderTop:'3px solid #163828', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem', boxShadow:'0 4px 15px rgba(22, 56, 40, 0.15)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: '1.25rem' }}>Distribuição por estágio</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1rem' }}>
          {STAGES.map(s => {
            const cnt = byStage[s.key] || 0
            const pct = total ? Math.round((cnt / total) * 100) : 0
            return (
              <div key={s.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: '#555', fontWeight: 500 }}>{s.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: s.color }}>{cnt} ({pct}%)</span>
                </div>
                <div style={{ height: 8, background: '#eee', borderRadius: 99, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 99, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Distribuição por área */}
      {areas.length > 0 && (
        <div style={{ background:'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(235,244,239,0.85) 100%)', border: '0.5px solid #e2e8e4', borderTop:'3px solid #163828', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem', boxShadow:'0 4px 15px rgba(22, 56, 40, 0.15)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: '1.25rem' }}>Distribuição por área</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1rem' }}>
            {areas.map(a => {
              const cnt = byArea[a.nome] || 0
              const pct = total ? Math.round((cnt / total) * 100) : 0
              return (
                <div key={a.nome}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: '#555', fontWeight: 500 }}>{a.nome}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: BRAND }}>{cnt} ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, background: '#eee', borderRadius: 99, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: BRAND, borderRadius: 99, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tabela de processos filtrada */}
      {filtered.length > 0 && (
        <div style={{ background:'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(235,244,239,0.85) 100%)', border: '0.5px solid #e2e8e4', borderTop:'3px solid #163828', borderRadius: 14, overflow: 'hidden', boxShadow:'0 4px 15px rgba(22, 56, 40, 0.15)' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '0.5px solid #eee', fontSize: 14, fontWeight: 700, color: '#111' }}>Processos ({filtered.length})</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #e2e8e4', background: '#f8f8f8' }}>
                  <th style={{ padding: '.6rem 1rem', textAlign: 'left', color: '#555', fontWeight: 500 }}>Processo</th>
                  <th style={{ padding: '.6rem 1rem', textAlign: 'left', color: '#555', fontWeight: 500 }}>Área(s)</th>
                  <th style={{ padding: '.6rem 1rem', textAlign: 'center', color: '#555', fontWeight: 500 }}>Progresso</th>
                  <th style={{ padding: '.6rem 1rem', textAlign: 'center', color: '#555', fontWeight: 500 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const pct = getPct(p)
                  return (
                    <tr key={p.id} style={{ borderBottom: '0.5px solid #f0f0f0' }}>
                      <td style={{ padding: '.6rem 1rem', color: '#111', fontWeight: 500 }}>{p.nome}</td>
                      <td style={{ padding: '.6rem 1rem', color: '#666', fontSize: 11 }}>
                        {(Array.isArray(p.area) ? p.area : [p.area]).join(', ')}
                      </td>
                      <td style={{ padding: '.6rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                          <div style={{ width: 60, height: 8, background: '#eee', borderRadius: 99, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? BRAND : ACCENT, borderRadius: 99, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                          </div>
                          <span style={{ fontSize: 10, color: '#888' }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '.6rem 1rem', textAlign: 'center' }}>
                        {p.confirmed ? (
                          <span style={{ padding: '4px 12px', borderRadius: 4, background: BRAND_LIGHT, color: BRAND, fontWeight: 600, fontSize: 11 }}>Concluído</span>
                        ) : (
                          <span style={{ padding: '4px 12px', borderRadius: 4, background: '#f5f5f5', color: '#888', fontWeight: 600, fontSize: 11 }}>Em andamento</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ background:'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(235,244,239,0.85) 100%)', border: '0.5px solid #e2e8e4', borderTop:'3px solid #163828', borderRadius: 14, padding: '2.5rem 2rem', textAlign: 'center', color: '#bbb', fontSize: 12, boxShadow:'0 4px 15px rgba(22, 56, 40, 0.15)' }}>
          Nenhum processo encontrado com os filtros aplicados.
        </div>
      )}
    </div>
  )
}

function Dashboard({ meetings, processes }) {
  const { theme } = useTheme()
  const today    = new Date(); today.setHours(12,0,0,0)
  const todayYMD = toYMD(today)
  const upcoming = meetings.filter(m => !m.canceled && m.date >= todayYMD).sort((a,b) => a.date.localeCompare(b.date)||a.sh-b.sh).slice(0,5)
  const canceled = meetings.filter(m => m.canceled)
  const total    = processes.length
  const done     = processes.filter(p => p.confirmed).length
  const avgPct   = total ? Math.round(processes.map(getPct).reduce((a,b)=>a+b,0)/total) : 0
  return (
    <div>
      <div style={{ fontSize:28, fontWeight:800, color: theme === 'dark' ? '#f0f0f0' : '#111', marginBottom:'.3rem' }}>Dashboard</div>
      <div style={{ fontSize:13, color: theme === 'dark' ? '#a0a0a0' : '#999', marginBottom:'1.5rem' }}>Visão geral do projeto DF Turismo</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
        {[
          ['Sprint 04','Mapeamento Core',BRAND,'📌'],
          [`${avgPct}%`,`${done}/${total} processos concluídos`, avgPct>=70?BRAND_MID:ACCENT,'🗂'],
          [`${meetings.filter(m=>!m.canceled).length}`,'Reuniões confirmadas','#2D8A6F',<><Icon ic={CheckCircle} size={40} /></>],
          [canceled.length||'0', canceled.length?`${canceled.length} cancelada(s)`:'Nenhuma cancelada', canceled.length?'#A32D2D':'#888',<><Icon ic={AlertTriangle} size={40} /></>],
        ].map(([val,lbl,clr,ico]) => (
          <div key={lbl} style={{ background:'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(235,244,239,0.85) 100%)', border: `0.5px solid ${theme === 'dark' ? '#333' : '#e2e8e4'}`, borderTop:'3px solid #163828', borderRadius:14, padding:'1.25rem', display:'flex', alignItems:'center', gap:14, boxShadow:'0 4px 15px rgba(22, 56, 40, 0.15)', animation:'slideInUp 0.4s ease-out' }}>
            <span style={{ fontSize:40 }}>{ico}</span>
            <div><div style={{ fontSize:22, fontWeight:700, color:clr }}>{val}</div><div style={{ fontSize:11, color: theme === 'dark' ? '#b0b0b0' : '#888', marginTop:3 }}>{lbl}</div></div>
          </div>
        ))}
      </div>
      <div style={{ background:'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(235,244,239,0.85) 100%)', border: `0.5px solid ${theme === 'dark' ? '#333' : '#e2e8e4'}`, borderTop:'3px solid #163828', borderRadius:14, padding:'1.5rem', marginBottom:'1.5rem', boxShadow:'0 4px 15px rgba(22, 56, 40, 0.15)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:13, fontWeight:600, color: theme === 'dark' ? '#d0d0d0' : '#555' }}>Progresso geral dos processos</span>
          <span style={{ fontSize:14, fontWeight:700, color: avgPct>=70?BRAND_MID:ACCENT }}>{avgPct}%</span>
        </div>
        <div style={{ height:10, background: theme === 'dark' ? '#222' : '#eee', borderRadius:99, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ height:'100%', width:`${avgPct}%`, background: avgPct>=70?BRAND_MID:ACCENT, borderRadius:99, transition:'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
        </div>
      </div>
      <div style={{ background:'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(235,244,239,0.85) 100%)', border: `0.5px solid ${theme === 'dark' ? '#333' : '#e2e8e4'}`, borderTop:'3px solid #163828', borderRadius:14, boxShadow:'0 4px 15px rgba(22, 56, 40, 0.15)', overflow:'hidden' }}>
        <div style={{ padding:'1rem 1.25rem', borderBottom: `0.5px solid ${theme === 'dark' ? '#222' : '#eee'}`, fontSize:14, fontWeight:700, color: theme === 'dark' ? '#f0f0f0' : '#111' }}>📅 Próximas reuniões</div>
        {upcoming.length===0
          ? <div style={{ padding:'2rem', textAlign:'center', fontSize:12, color: theme === 'dark' ? '#909090' : '#bbb' }}>Nenhuma reunião futura agendada</div>
          : upcoming.map(m => {
            const c  = EV_COLORS[(m.ci??0)%5]
            const dt = fromYMD(m.date)
            const isToday = sameDay(dt, today)
            return (
              <div key={m.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'.65rem 1rem', borderBottom:'0.5px solid #f5f5f5' }}>
                <div style={{ width:34, textAlign:'center', flexShrink:0 }}>
                  <div style={{ fontSize:9, color: theme === 'dark' ? '#909090' : '#aaa' }}>{DAY_PT[dt.getDay()]}</div>
                  <div style={{ fontSize:16, fontWeight:600, color: isToday ? BRAND : '#333' }}>{dt.getDate()}</div>
                  <div style={{ fontSize:9, color: theme === 'dark' ? '#909090' : '#aaa' }}>{MONTH_SH[dt.getMonth()]}</div>
                </div>
                <div style={{ width:3, height:36, borderRadius:2, background:c.brd, flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:500, color: theme === 'dark' ? '#f0f0f0' : '#111', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.title}</div>
                  <div style={{ fontSize:10, color: theme === 'dark' ? '#b0b0b0' : '#888' }}>{p2(m.sh)}:{p2(m.sm)} – {p2(m.eh)}:{p2(m.em)} · {m.who}</div>
                  {m.meetLink && (
                    <a href={m.meetLink} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize:10, color:'#1a73e8', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:3, marginTop:2 }}>
                      <Icon ic={Video} size={11} /> Entrar no Meet
                    </a>
                  )}
                </div>
                {isToday && <span style={{ fontSize:11, padding:'4px 12px', borderRadius:99, background:BRAND_LIGHT, color:BRAND, fontWeight:600 }}>Hoje</span>}
              </div>
            )
          })}
      </div>
    </div>
  )
}

// ─── Event Form (create / edit from Agenda) ──────────────────
function EventForm({ initial, colaboradores, onSave, onCancel, onDelete }) {
  const { theme } = useTheme()
  const todayYMD = toYMD(new Date())
  const isEdit   = !!initial?.id

  const [title,    setTitle    ] = useState(initial?.title      || 'Reunião de Coleta | DF Turismo')
  const [date,     setDate     ] = useState(initial?.date       || todayYMD)
  const [start,    setStart    ] = useState(initial?.sh !== undefined ? `${p2(initial.sh)}:${p2(initial.sm)}` : '09:00')
  const [end,      setEnd      ] = useState(initial?.eh !== undefined ? `${p2(initial.eh)}:${p2(initial.em)}` : '10:00')
  const [participantes, setParticipantes] = useState(Array.isArray(initial?.participantes) ? initial.participantes : [])
  const [desc,     setDesc     ] = useState(initial?.desc      || '')
  const [meetLink, setMeetLink ] = useState(initial?.meetLink   || '')
  const [loading,  setLoading  ] = useState(false)
  const [apiErr,   setApiErr   ] = useState(null)
  const [success,  setSuccess  ] = useState(null)

  const [sh,sm] = start.split(':').map(Number)
  const [eh,em] = end.split(':').map(Number)
  const validTime = eh*60+em > sh*60+sm
  const valid     = title.trim() && date && validTime

  async function handleSave() {
    if (!valid || loading) return
    setLoading(true); setApiErr(null)
    let ml = meetLink, el = initial?.eventLink || null

    if (!isEdit) {
      try {
        const res  = await fetch('/api/create-event', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ title, processName: desc, date, sh, sm, eh, em, participantes }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Erro desconhecido')
        ml = json.meetLink; el = json.eventLink
        setSuccess({ meetLink: ml, eventLink: el })
      } catch (err) { setApiErr(err.message) }
    }
    setLoading(false)
    if (isEdit || !ml) {
      onSave({ title, date, sh, sm, eh, em, participantes, desc, meetLink: ml||null, eventLink: el })
    }
  }

  const selDt   = date ? fromYMD(date) : null
  const dayLabel = selDt ? `${DAY_PT[selDt.getDay()]}, ${selDt.getDate()} de ${MONTH_PT[selDt.getMonth()]}` : ''

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:'#fff', borderRadius:14, padding:'1.25rem 1.5rem', width:420, maxWidth:'95vw', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 8px 40px rgba(0,0,0,.18)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <div style={{ fontSize:14, fontWeight:600, color:BRAND }}>{isEdit ? <><Icon ic={Pencil} size={11} /> Editar evento</> : <><Icon ic={Plus} size={18} /> Novo evento</>}</div>
          <button onClick={onCancel} style={{ border:'none', background:'none', fontSize:18, cursor:'pointer', color: theme === 'dark' ? '#a0a0a0' : '#999', lineHeight:1 }}>×</button>
        </div>

        {success && (
          <div style={{ background:'#EBF4EF', border:`0.5px solid ${BRAND_BRD}`, borderRadius:8, padding:'8px 10px', marginBottom:10, fontSize:11 }}>
            <Icon ic={CheckCircle} size={16} /> <strong>Evento criado no Google Calendar!</strong>
            {success.meetLink && <> · <a href={success.meetLink} target="_blank" rel="noopener noreferrer" style={{ color:'#1a73e8' }}><Icon ic={Video} size={11} /> Entrar no Meet</a></>}
          </div>
        )}
        {apiErr && (
          <div style={{ background:'#FCEBEB', border:'0.5px solid #F7C1C1', borderRadius:8, padding:'7px 10px', marginBottom:10, fontSize:11, color:'#791F1F' }}>
            <Icon ic={AlertTriangle} size={14} /> Google Calendar: {apiErr} — evento salvo localmente.
          </div>
        )}

        <div style={{ marginBottom:8 }}>
          <label style={labelSt(theme)}>Título do evento</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Reunião de Coleta | DF Turismo"
            style={{ ...inputSt(theme), padding:'6px 10px' }} />
        </div>
        <div style={{ marginBottom:8 }}>
          <label style={labelSt(theme)}>Data {dayLabel && <span style={{ color:BRAND_MID, fontWeight:500 }}>· {dayLabel}</span>}</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputSt(theme), padding:'6px 10px' }} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
          <div>
            <label style={labelSt(theme)}>Início</label>
            <input type="time" value={start} onChange={e => setStart(e.target.value)} style={{ ...inputSt(theme), padding:'6px 10px' }} />
          </div>
          <div>
            <label style={labelSt(theme)}>Término</label>
            <input type="time" value={end} onChange={e => setEnd(e.target.value)}
              style={{ ...inputSt(theme), padding:'6px 10px', borderColor: !validTime&&end ? '#E24B4A': theme === 'dark' ? '#444' : '#ccc' }} />
            {!validTime && end && <div style={{ fontSize:9, color:'#E24B4A', marginTop:2 }}>Término após o início</div>}
          </div>
        </div>
        <div style={{ marginBottom:8 }}>
          <label style={labelSt(theme)}>Consultores e Participantes</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8, minHeight:28 }}>
            {participantes.map(p => (
              <div key={p} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', background:BRAND_LIGHT, border:`0.5px solid ${BRAND_MID}`, borderRadius:99, fontSize:11, color:BRAND }}>
                {p}
                <button onClick={() => setParticipantes(participantes.filter(x=>x!==p))} style={{ border:'none', background:'none', cursor:'pointer', fontSize:13, color:BRAND_MID, padding:'0 2px', lineHeight:1 }}>×</button>
              </div>
            ))}
          </div>
          <select onChange={e => { if(e.target.value && !participantes.includes(e.target.value)) setParticipantes([...participantes, e.target.value]); e.target.value='' }} style={{ ...inputSt(theme), cursor:'pointer', padding:'6px 10px' }}>
            <option value="">+ Selecionar participante…</option>
            {colaboradores.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:8 }}>
          <label style={labelSt(theme)}>Descrição / Processo</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descrição opcional"
            rows={2} style={{ ...inputSt(theme), padding:'6px 10px', resize:'vertical', fontFamily:'inherit' }} />
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={labelSt(theme)}>Link do Meet (opcional)</label>
          <input value={meetLink} onChange={e => setMeetLink(e.target.value)} placeholder="https://meet.google.com/..."
            style={{ ...inputSt(theme), padding:'6px 10px' }} />
        </div>

        <div style={{ display:'flex', gap:6, justifyContent:'space-between', alignItems:'center' }}>
          <div>
            {isEdit && onDelete && (
              <button onClick={onDelete} style={{ fontSize:11, padding:'5px 12px', border:'0.5px solid #E24B4A', borderRadius:6, cursor:'pointer', background:'#fff', color:'#E24B4A' }}>
                <Icon ic={Trash2} size={11} /> Excluir
              </button>
            )}
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={onCancel} style={{ fontSize:11, padding:'5px 12px', border: `0.5px solid ${theme === 'dark' ? '#444' : '#ccc'}`, borderRadius:6, cursor:'pointer', background:'#fff', color: theme === 'dark' ? '#d0d0d0' : '#666' }}>
              {success ? 'Fechar' : 'Cancelar'}
            </button>
            {!success && (
              <button onClick={handleSave} disabled={!valid || loading} style={{
                fontSize:11, padding:'5px 16px', borderRadius:6, fontWeight:500,
                border:`0.5px solid ${valid&&!loading ? BRAND:'#ccc'}`,
                background: valid&&!loading ? BRAND:'#ccc', color:'#fff',
                cursor: valid&&!loading ? 'pointer':'not-allowed',
              }}>
                {loading ? <><Icon ic={Loader2} size={13} /> Criando…</> : isEdit ? <><Icon ic={Check} size={12} /> Salvar alterações</> : <><Icon ic={Video} size={11} /> Criar + Google Meet</>}
              </button>
            )}
            {success && (
              <button onClick={() => onSave({ title, date, sh, sm, eh, em, participantes, desc, meetLink: success.meetLink, eventLink: success.eventLink })}
                style={{ fontSize:11, padding:'5px 16px', borderRadius:6, fontWeight:500, border:`0.5px solid ${BRAND}`, background:BRAND, color:'#fff', cursor:'pointer' }}>
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Schedule form ────────────────────────────────────────────
function ScheduleForm({ processName, defaultWho, colaboradores, onSave, onCancel }) {
  const { theme } = useTheme()
  const todayYMD = toYMD(new Date())
  const [date,    setDate   ] = useState(todayYMD)
  const [start,   setStart  ] = useState('09:00')
  const [end,     setEnd    ] = useState('10:00')
  const [who,     setWho    ] = useState(Array.isArray(defaultWho) ? defaultWho.join(', ') : (defaultWho||''))
  const [loading, setLoading] = useState(false)
  const [apiErr,  setApiErr ] = useState(null)
  const [success, setSuccess] = useState(null) // { meetLink, eventLink }

  const [sh,sm] = start.split(':').map(Number)
  const [eh,em] = end.split(':').map(Number)
  const validTime = eh*60+em > sh*60+sm
  const valid     = (who||'').trim() && date && validTime
  const selDt     = date ? fromYMD(date) : null
  const dayLabel  = selDt ? `${DAY_PT[selDt.getDay()]}, ${selDt.getDate()} de ${MONTH_PT[selDt.getMonth()]}` : ''

  async function handleSave() {
    if (!valid || loading) return
    setLoading(true)
    setApiErr(null)
    let meetLink = null, eventLink = null

    try {
      const res  = await fetch('/api/create-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: processName, processName, date, sh, sm, eh, em, participantes: who ? [who] : [] }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro desconhecido')
      meetLink  = json.meetLink
      eventLink = json.eventLink
      setSuccess({ meetLink, eventLink })
    } catch (err) {
      setApiErr(err.message)
    } finally {
      setLoading(false)
    }

    // if API failed, save locally immediately so meeting isn't lost
    if (!meetLink) {
      onSave({ date, sh, sm, eh, em, who, meetLink: null, eventLink: null })
    }
    // if API succeeded, onSave is called when user clicks Fechar (see button below)
  }

  return (
    <div style={{ marginTop:10, padding:'12px 14px', background:'#F0F7F3', border:`1px solid ${BRAND_BRD}`, borderRadius:10 }}>
      <div style={{ fontSize:11, fontWeight:500, color:BRAND, marginBottom:10 }}>
        📅 Agendar reunião
      </div>

      {/* success banner */}
      {success && (
        <div style={{ background:'#EBF4EF', border:`0.5px solid ${BRAND_BRD}`, borderRadius:8, padding:'8px 10px', marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:14 }}><Icon ic={CheckCircle} size={16} /></span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, fontWeight:500, color:BRAND }}>Evento criado no Google Calendar!</div>
            {success.meetLink && (
              <a href={success.meetLink} target="_blank" rel="noopener noreferrer"
                style={{ fontSize:11, color:'#1a73e8', display:'inline-flex', alignItems:'center', gap:4, marginTop:2 }}>
                <Icon ic={Video} size={11} /> Entrar no Google Meet
              </a>
            )}
          </div>
        </div>
      )}

      {/* error banner */}
      {apiErr && (
        <div style={{ background:'#FCEBEB', border:'0.5px solid #F7C1C1', borderRadius:8, padding:'7px 10px', marginBottom:10, fontSize:11, color:'#791F1F' }}>
          <Icon ic={AlertTriangle} size={14} /> Google Calendar: {apiErr} — reunião salva localmente.
        </div>
      )}

      <div style={{ marginBottom:8 }}>
        <label style={labelSt(theme)}>Data {dayLabel && <span style={{ color:BRAND_MID, fontWeight:500 }}>· {dayLabel}</span>}</label>
        <input type="date" value={date} min={todayYMD} onChange={e => setDate(e.target.value)} style={{ ...inputSt(theme), padding:'5px 8px' }} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
        <div>
          <label style={labelSt(theme)}>Início</label>
          <input type="time" value={start} onChange={e => setStart(e.target.value)} style={{ ...inputSt(theme), padding:'5px 8px' }} />
        </div>
        <div>
          <label style={labelSt(theme)}>Término</label>
          <input type="time" value={end} onChange={e => setEnd(e.target.value)}
            style={{ ...inputSt(theme), padding:'5px 8px', borderColor: !validTime&&end ? '#E24B4A' : theme === 'dark' ? '#444' : '#ccc' }} />
          {!validTime && end && <div style={{ fontSize:9, color:'#E24B4A', marginTop:2 }}>Término após o início</div>}
        </div>
      </div>
      <div style={{ marginBottom:10 }}>
        <label style={labelSt(theme)}>Participante</label>
        <input list="colab-list" value={who} onChange={e => setWho(e.target.value)} placeholder="Nome do participante"
          style={{ ...inputSt(theme), padding:'5px 8px' }} />
        <datalist id="colab-list">
          {colaboradores.map(c => <option key={c.id} value={c.nome} />)}
        </datalist>
      </div>
      <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
        <button onClick={() => success ? onSave({ date, sh, sm, eh, em, who, meetLink: success.meetLink, eventLink: success.eventLink }) : onCancel()}
          style={{ fontSize:11, padding:'5px 12px', border: `0.5px solid ${theme === 'dark' ? '#444' : '#ccc'}`, borderRadius:6, cursor:'pointer', background:'#fff', color: theme === 'dark' ? '#d0d0d0' : '#666' }}>
          {success ? 'Fechar' : 'Cancelar'}
        </button>
        {!success && (
          <button onClick={handleSave} disabled={!valid || loading} style={{
            fontSize:11, padding:'5px 14px', borderRadius:6, fontWeight:500, display:'flex', alignItems:'center', gap:5,
            border:`0.5px solid ${valid && !loading ? BRAND : '#ccc'}`,
            background: valid && !loading ? BRAND : '#ccc', color:'#fff',
            cursor: valid && !loading ? 'pointer' : 'not-allowed',
          }}>
            {loading ? <><Icon ic={Loader2} size={13} /> Criando evento…</> : <><Icon ic={Video} size={11} /> Agendar + Google Meet</>}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── ChipSelect ───────────────────────────────────────────────
// values: string[]  options: string[]  allowFreeText: bool
function ChipSelect({ values, onChange, options, allowFreeText, placeholder }) {
  const { theme } = useTheme()
  const [freeText, setFreeText] = useState('')
  const available = options.filter(o => !values.includes(o))

  function add(v) { if (v && !values.includes(v)) onChange([...values, v]) }
  function remove(v) { onChange(values.filter(x => x !== v)) }

  function commitFree() {
    const t = freeText.trim()
    if (t) { add(t); setFreeText('') }
  }

  return (
    <div>
      {/* chips */}
      {values.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:6 }}>
          {values.map(v => (
            <span key={v} style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, padding:'3px 8px 3px 10px', borderRadius:99, background:BRAND_LIGHT, color:BRAND, border:`0.5px solid ${BRAND_BRD}` }}>
              {v}
              <button onClick={() => remove(v)} style={{ border:'none', background:'none', cursor:'pointer', color:BRAND_MID, fontSize:12, padding:0, lineHeight:1, display:'flex', alignItems:'center' }}>×</button>
            </span>
          ))}
        </div>
      )}
      {/* select dropdown */}
      {available.length > 0 && (
        <select style={{ ...inputSt(theme), cursor:'pointer', marginBottom: allowFreeText ? 6 : 0 }}
          value="" onChange={e => { add(e.target.value); e.target.value='' }}>
          <option value="">{placeholder || 'Selecionar…'}</option>
          {available.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )}
      {/* free-text for external collaborators */}
      {allowFreeText && (
        <div style={{ display:'flex', gap:6, marginTop: available.length > 0 ? 6 : 0 }}>
          <input value={freeText} onChange={e => setFreeText(e.target.value)}
            onKeyDown={e => e.key==='Enter' && commitFree()}
            placeholder="Colaborador externo… (Enter para adicionar)"
            style={{ ...inputSt(theme), flex:1, fontSize:12 }} />
          <button onClick={commitFree} style={{ fontSize:12, padding:'5px 10px', border:`0.5px solid ${BRAND_BRD}`, borderRadius:7, cursor:'pointer', background:BRAND_LIGHT, color:BRAND, whiteSpace:'nowrap' }}><Icon ic={Plus} size={16} /></button>
        </div>
      )}
    </div>
  )
}

// ─── Process Edit Form ────────────────────────────────────────
function ProcEditForm({ data, onChange, onSave, onCancel, isNew, consultores, colaboradores, areas }) {
  const { theme } = useTheme()
  const areaOpts     = areas.map(a => a.nome)
  const consultorOpts = consultores.map(c => c.nome)
  const colaborOpts   = colaboradores.map(c => c.nome)
  const ok = (data.nome||'').trim() && data.area?.length && data.comQuem?.length && data.consultor?.length

  return (
    <div style={{ background: isNew ? (theme === 'dark' ? '#1a1a1a' : '#FAFCFA') : (theme === 'dark' ? '#1e1e1e' : '#f8fbf9'), border:`1.5px solid ${BRAND_BRD}`, borderRadius:14, padding:'1.1rem 1.2rem', marginBottom:'.6rem' }}>
      <div style={{ fontSize:13, fontWeight:500, color:BRAND, marginBottom:'1rem' }}>{isNew ? <><Icon ic={Plus} size={18} /> Novo processo</> : <><Icon ic={Pencil} size={11} /> Editando processo</>}</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={labelSt(theme)}>Nome do processo <span style={{ color:'#E24B4A' }}>*</span></label>
          <input style={inputSt(theme)} value={data.nome} placeholder="Ex: Gestão de Contratos" onChange={e => onChange({ ...data, nome:e.target.value })} />
        </div>
        <div>
          <label style={labelSt(theme)}>Área(s) do processo <span style={{ color:'#E24B4A' }}>*</span></label>
          <ChipSelect values={data.area} onChange={v => onChange({ ...data, area:v })}
            options={areaOpts} allowFreeText={false} placeholder="Selecionar área…" />
        </div>
        <div>
          <label style={labelSt(theme)}>Formato do processo</label>
          <select style={{ ...inputSt(theme), cursor:'pointer' }} value={data.formato} onChange={e => onChange({ ...data, formato:e.target.value })}>
            {FORMATO_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={labelSt(theme)}>Atores responsáveis (coleta) <span style={{ color:'#E24B4A' }}>*</span></label>
          <ChipSelect values={data.comQuem} onChange={v => onChange({ ...data, comQuem:v })}
            options={colaborOpts} allowFreeText={true} placeholder="Selecionar colaborador…" />
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={labelSt(theme)}>Consultor(es) responsável(is) <span style={{ color:'#E24B4A' }}>*</span></label>
          <ChipSelect values={data.consultor} onChange={v => onChange({ ...data, consultor:v })}
            options={consultorOpts} allowFreeText={false} placeholder="Selecionar consultor…" />
        </div>
      </div>
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
        <button onClick={onCancel} style={{ fontSize:12, padding:'6px 14px', border: `0.5px solid ${theme === 'dark' ? '#444' : '#ccc'}`, borderRadius:7, cursor:'pointer', background:'#fff', color: theme === 'dark' ? '#d0d0d0' : '#666' }}>Cancelar</button>
        <button onClick={() => ok && onSave()} style={{ fontSize:12, padding:'6px 16px', borderRadius:7, fontWeight:500, cursor: ok ? 'pointer' : 'not-allowed', border:`0.5px solid ${ok ? BRAND : '#ccc'}`, background: ok ? BRAND : '#ccc', color:'#fff' }}>
          {isNew ? <><Icon ic={Plus} size={18} /> Adicionar</> : <><Icon ic={Check} size={12} /> Salvar alterações</>}
        </button>
      </div>
    </div>
  )
}

// ─── Delete Confirm ───────────────────────────────────────────
function DeleteConfirm({ nome, onConfirm, onCancel }) {
  const { theme } = useTheme()
  return (
    <div style={{ background:'#FCEBEB', border:'0.5px solid #F7C1C1', borderRadius:14, padding:'1rem 1.2rem', marginBottom:'.6rem', display:'flex', alignItems:'center', gap:12 }}>
      <span style={{ fontSize:13, color:'#791F1F', flex:1 }}>Excluir <strong>"{nome}"</strong>? Esta ação não pode ser desfeita.</span>
      <button onClick={onCancel} style={{ fontSize:12, padding:'5px 12px', border: `0.5px solid ${theme === 'dark' ? '#444' : '#ccc'}`, borderRadius:7, cursor:'pointer', background:'#fff', color: theme === 'dark' ? '#d0d0d0' : '#666' }}>Cancelar</button>
      <button onClick={onConfirm} style={{ fontSize:12, padding:'5px 14px', border:'0.5px solid #A32D2D', borderRadius:7, cursor:'pointer', background:'#A32D2D', color:'#fff', fontWeight:500 }}><Icon ic={Trash2} size={11} /> Excluir</button>
    </div>
  )
}

// ─── ComentariosBox ───────────────────────────────────────────
let nextCommentId = 1
const ROLE_BADGE = {
  coordenador: { bg:BRAND,       color:'#fff'   },
  consultor:   { bg:'#2563EB',   color:'#fff'   },
  socio:       { bg:ACCENT,      color:'#0D2519'},
  cliente:     { bg:'#9CA3AF',   color:'#fff'   },
}

function ComentariosBox({ comentarios, onAdd, user, readonly }) {
  const { theme } = useTheme()
  const [texto, setTexto] = useState('')

  function submit() {
    const t = texto.trim()
    if (!t) return
    onAdd({ id: nextCommentId++, autor: user.nome, role: user.role, texto: t, data: new Date().toLocaleDateString('pt-BR') })
    setTexto('')
  }

  return (
    <div style={{ marginTop:10 }}>
      {comentarios.length === 0 && (
        <div style={{ fontSize:11, color: theme === 'dark' ? '#909090' : '#bbb', textAlign:'center', padding:'8px 0' }}>Nenhum comentário ainda.</div>
      )}
      {comentarios.map(c => {
        const badge = ROLE_BADGE[c.role] || ROLE_BADGE.cliente
        return (
          <div key={c.id} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'flex-start' }}>
            <div style={{ width:26, height:26, borderRadius:'50%', background:badge.bg, color:badge.color, fontSize:9, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {c.autor.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
            </div>
            <div style={{ flex:1, background: theme === 'dark' ? '#2a2a2a' : '#f7f9f7', borderRadius:8, padding:'6px 9px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                <span style={{ fontSize:11, fontWeight:500, color: theme === 'dark' ? '#f0f0f0' : '#111' }}>{c.autor}</span>
                <span style={{ fontSize:11, padding:'4px 12px', borderRadius:99, background:badge.bg, color:badge.color, fontWeight:600 }}>{c.role}</span>
                <span style={{ fontSize:9, color: theme === 'dark' ? '#909090' : '#bbb', marginLeft:'auto' }}>{c.data}</span>
              </div>
              <div style={{ fontSize:12, color: theme === 'dark' ? '#e0e0e0' : '#333', lineHeight:1.5 }}>{c.texto}</div>
            </div>
          </div>
        )
      })}
      {!readonly && (
        <div style={{ display:'flex', gap:6, marginTop:6 }}>
          <input value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={e => e.key==='Enter' && submit()}
            placeholder="Adicionar comentário…" style={{ ...inputSt(theme), flex:1, fontSize:12 }} />
          <button onClick={submit} style={{ fontSize:11, padding:'5px 12px', border:`0.5px solid ${BRAND}`, borderRadius:7, cursor:'pointer', background:BRAND, color:'#fff', whiteSpace:'nowrap' }}>Comentar</button>
        </div>
      )}
    </div>
  )
}

// ─── Process Card ─────────────────────────────────────────────
function ProcCard({ p, onToggle, onConfirm, onEdit, onDelete, onAddMeeting, colaboradores, user, onAddComment }) {
  const { theme } = useTheme()
  const [scheduling,   setScheduling  ] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const role     = user?.role || 'cliente'
  const canEdit  = role === 'coordenador' || role === 'consultor'
  const canSchedule = role === 'coordenador' || role === 'consultor' || role === 'socio'
  const canConfirm  = role === 'coordenador' || role === 'consultor'
  const readonlyComments = role === 'cliente'
  const pct      = getPct(p)
  const ready    = pct===100 && !p.confirmed
  const barColor = pct===100 ? BRAND : pct>=70 ? BRAND_MID : pct>=40 ? ACCENT : '#E24B4A'
  const fmtShort = p.formato==='Fluxograma' ? 'Fluxograma' : 'POP'
  const comentarios = p.comentarios || []
  return (
    <div style={{ background:'#fff', border:`0.5px solid ${p.confirmed ? BRAND_BRD : '#e2e8e4'}`, borderRadius:14, padding:'1rem 1.1rem', marginBottom:'.6rem', boxShadow: p.confirmed ? `0 0 0 1px ${BRAND_BRD}` : 'none', animation:'slideInUp 0.4s ease-out' }}>
      <div style={{ display:'grid', gridTemplateColumns:'28px 1fr auto', gap:10, alignItems:'start', marginBottom:'.85rem' }}>
        <div style={{ width:26, height:26, borderRadius:'50%', background: p.confirmed ? BRAND : '#f0f0f0', color: p.confirmed ? '#fff' : '#aaa', fontSize:10, fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center' }}>{p.num}</div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:500, color: theme === 'dark' ? '#f0f0f0' : '#111', lineHeight:1.3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.nome}</div>
          <div style={{ display:'flex', gap:5, marginTop:4, flexWrap:'wrap' }}>
            {(Array.isArray(p.area) ? p.area : [p.area]).filter(Boolean).map(a => (
              <span key={a} style={{ fontSize:11, padding:'4px 12px', borderRadius:99, background:BRAND_LIGHT, color:BRAND_MID, fontWeight:600 }}>{a}</span>
            ))}
            {p.formato && <span style={{ fontSize:11, padding:'4px 12px', borderRadius:99, background:'#f0f0f0', color:'#777', fontWeight:600 }}>{fmtShort}</span>}
          </div>
          <div style={{ fontSize:11, color: theme === 'dark' ? '#b0b0b0' : '#888', marginTop:4 }}>
            <Icon ic={User} size={11} /> {(Array.isArray(p.comQuem) ? p.comQuem : [p.comQuem]).filter(Boolean).join(', ') || '—'}
            {' · '}Consultor: {(Array.isArray(p.consultor) ? p.consultor : [p.consultor]).filter(Boolean).join(', ') || '—'}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:7 }}>
            <div style={{ flex:1, height:8, background: theme === 'dark' ? '#222' : '#eee', borderRadius:99, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ height:'100%', width:`${pct}%`, background:barColor, borderRadius:99, transition:'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </div>
            <span style={{ fontSize:12, fontWeight:600, color:barColor, flexShrink:0 }}>{pct}%</span>
            <span style={{ fontSize:10, color: theme === 'dark' ? '#909090' : '#bbb', flexShrink:0 }}>{STAGE_KEYS.filter(s=>p[s.key]).length}/{STAGE_KEYS.length}</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap', justifyContent:'flex-end' }}>
          {canSchedule && <button onClick={() => setScheduling(s => !s)} title="Agendar reunião" style={{ fontSize:11, padding:'4px 9px', borderRadius:6, cursor:'pointer', border: scheduling ? `0.5px solid ${BRAND_MID}` : '0.5px solid #d0d0d0', background: scheduling ? BRAND_LIGHT : '#fff', color: scheduling ? BRAND : '#555' }}>📅</button>}
          {canEdit && !p.confirmed && <button onClick={() => onEdit(p)} title="Editar" style={{ fontSize:11, padding:'4px 9px', border: `0.5px solid ${theme === 'dark' ? '#444' : '#d0d0d0'}`, borderRadius:6, cursor:'pointer', background:'#fff', color: theme === 'dark' ? '#d0d0d0' : '#555' }}><Icon ic={Pencil} size={11} /></button>}
          {canEdit && !p.confirmed && <button onClick={() => onDelete(p.id)} title="Excluir" style={{ fontSize:11, padding:'4px 9px', border:'0.5px solid #f5c6c6', borderRadius:6, cursor:'pointer', background:'#fff', color:'#A32D2D' }}><Icon ic={Trash2} size={11} /></button>}
          {canConfirm && <button onClick={() => ready && onConfirm(p.id)} style={{
            fontSize:11, padding:'5px 11px', borderRadius:7, whiteSpace:'nowrap', cursor: ready ? 'pointer' : 'default',
            border: p.confirmed ? `0.5px solid ${BRAND_BRD}` : ready ? `0.5px solid ${BRAND}` : '0.5px solid #ddd',
            background: p.confirmed ? BRAND_LIGHT : ready ? BRAND : '#f8f8f8',
            color: p.confirmed ? BRAND_MID : ready ? '#fff' : '#ccc', fontWeight: ready ? 500 : 400,
          }}>{p.confirmed ? <><Icon ic={Lock} size={11} /> Concluído</> : ready ? <><Icon ic={Check} size={12} /> Confirmar</> : 'Pendente'}</button>}
        </div>
      </div>
      {canEdit && (
        <div style={{ overflowX:'auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:6, minWidth:490 }}>
            {STAGE_KEYS.map(({ key, label }) => {
              const checked = p[key]
              return (
                <div key={key} onClick={() => !p.confirmed && onToggle(p.id, key)} style={{
                  borderRadius:8, padding:'8px 4px 6px', textAlign:'center', transition:'all .18s', userSelect:'none',
                  background: checked ? BRAND : '#f8f8f8', border:`1.5px ${checked ? 'solid' : 'dashed'} ${checked ? BRAND_MID : '#d0d0d0'}`, cursor: p.confirmed ? 'default' : 'pointer',
                }}>
                  <div style={{ width:22, height:22, borderRadius:'50%', margin:'0 auto 5px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, background: checked ? 'rgba(255,255,255,.2)' : '#ebebeb', border:`1.5px solid ${checked ? 'rgba(255,255,255,.4)' : '#d5d5d5'}`, color: checked ? '#fff' : '#ccc' }}>{checked ? <Icon ic={Check} size={12} /> : ''}</div>
                  <div style={{ fontSize:9, fontWeight: checked ? 500 : 400, color: checked ? 'rgba(255,255,255,.9)' : '#aaa', lineHeight:1.3 }}>{label}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {scheduling && (
        <ScheduleForm processName={p.nome} defaultWho={p.comQuem} colaboradores={colaboradores}
          onSave={data => { onAddMeeting({ title:'Reunião de Coleta | DF Turismo', ...data, ci:(p.id-1)%5 }); setScheduling(false) }}
          onCancel={() => setScheduling(false)} />
      )}
      {/* Comments section */}
      <div style={{ borderTop:'0.5px solid #f0f0f0', marginTop:10, paddingTop:8 }}>
        <div onClick={() => setShowComments(s => !s)} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:11, color: theme === 'dark' ? '#d0d0d0' : '#666', userSelect:'none' }}>
          <span><Icon ic={MessageSquare} size={13} /> Comentários ({comentarios.length})</span>
          <span style={{ fontSize:10, color: theme === 'dark' ? '#909090' : '#bbb' }}>{showComments ? '▲' : '▼'}</span>
        </div>
        {showComments && (
          <ComentariosBox
            comentarios={comentarios}
            onAdd={c => onAddComment(p.id, c)}
            user={user}
            readonly={readonlyComments}
          />
        )}
      </div>
    </div>
  )
}

// ─── Processos tab ────────────────────────────────────────────
function Processos({ processes, consultores, colaboradores, areas, onToggle, onConfirm, onAdd, onUpdate, onDelete, onAddMeeting, user, onAddComment }) {
  const { theme } = useTheme()
  const [editingId, setEditingId]  = useState(null)
  const [editData,  setEditData]   = useState({})
  const [deletingId,setDeletingId] = useState(null)
  const [showAdd,   setShowAdd]    = useState(false)
  const [addData,   setAddData]    = useState({ nome:'', area:[], comQuem:[], consultor:[], formato:FORMATO_OPTS[0] })

  const role   = user?.role || 'cliente'
  const canEdit = role === 'coordenador' || role === 'consultor'
  const total  = processes.length
  const done   = processes.filter(p => p.confirmed).length
  const avgPct = total ? Math.round(processes.map(getPct).reduce((a,b)=>a+b,0)/total) : 0
  const barClr = avgPct>=70 ? BRAND_MID : avgPct>=40 ? ACCENT : '#E24B4A'

  function toArr(v) { return Array.isArray(v) ? v : (v ? [v] : []) }
  function startEdit(p){ setDeletingId(null); setShowAdd(false); setEditingId(p.id); setEditData({ nome:p.nome, area:toArr(p.area), comQuem:toArr(p.comQuem), consultor:toArr(p.consultor), formato:p.formato||FORMATO_OPTS[0] }) }
  function saveEdit()  { onUpdate(editingId, editData); setEditingId(null) }
  function handleDel(id){ setEditingId(null); setDeletingId(id) }
  function saveAdd()   { onAdd(addData); setAddData({ nome:'', area:[], comQuem:[], consultor:[], formato:FORMATO_OPTS[0] }); setShowAdd(false) }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1.25rem' }}>
        <div style={{ fontSize:26, fontWeight:700, color: theme === 'dark' ? '#f0f0f0' : '#111' }}>Controle de Mapeamento de Processos</div>
        {canEdit && (
          <button onClick={() => { setShowAdd(s=>!s); setEditingId(null); setDeletingId(null) }}
            style={{ fontSize:12, padding:'7px 15px', border:`0.5px solid ${BRAND}`, borderRadius:8, cursor:'pointer', background: showAdd ? '#f0f0f0' : BRAND, color: showAdd ? '#555' : '#fff', fontWeight:500, flexShrink:0, marginTop:2 }}>
            {showAdd ? <><Icon ic={X} size={12} /> Cancelar</> : <><Icon ic={Plus} size={18} /> Novo processo</>}
          </button>
        )}
      </div>

      {consultores.length===0 && (
        <div style={{ background:ACCENT_LT, border:`0.5px solid ${ACCENT}`, borderRadius:10, padding:'.75rem 1rem', marginBottom:'1rem', fontSize:12, color:'#7A5F10' }}>
          <Icon ic={AlertTriangle} size={14} /> Nenhum consultor cadastrado ainda. Acesse <strong>Configurações</strong> para registrar consultores.
        </div>
      )}

      {showAdd && <ProcEditForm data={addData} onChange={setAddData} onSave={saveAdd} onCancel={() => setShowAdd(false)} isNew consultores={consultores} colaboradores={colaboradores} areas={areas} />}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.75rem', marginBottom:'1rem' }}>
        {[['Total',total,'#111'],['Em andamento',processes.filter(p=>getPct(p)>0&&!p.confirmed).length,'#BA7517'],['Concluídos',done,BRAND_MID],['Progresso',`${avgPct}%`,BRAND]].map(([l,v,c]) => (
          <div key={l} style={{ background:'#fff', border: `0.5px solid ${theme === 'dark' ? '#333' : '#e2e8e4'}`, borderRadius:14, padding:'.8rem 1rem', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize:20, fontWeight:500, color:c }}>{v}</div>
            <div style={{ fontSize:10, color: theme === 'dark' ? '#b0b0b0' : '#888', marginTop:1 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'#fff', border: `0.5px solid ${theme === 'dark' ? '#333' : '#e2e8e4'}`, borderRadius:14, padding:'.9rem 1.1rem', marginBottom:'1.1rem', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <span style={{ fontSize:12, fontWeight:500, color: theme === 'dark' ? '#d0d0d0' : '#555' }}>Progresso geral</span>
          <span style={{ fontSize:14, fontWeight:600, color:barClr }}>{avgPct}%</span>
        </div>
        <div style={{ height:10, background: theme === 'dark' ? '#222' : '#eee', borderRadius:99, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${avgPct}%`, background:barClr, borderRadius:99, transition:'width .5s' }} />
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:'.75rem', fontSize:11, color: theme === 'dark' ? '#b0b0b0' : '#888', flexWrap:'wrap' }}>
        <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:14, height:14, borderRadius:4, background:BRAND, display:'inline-block' }} /> Etapa concluída</span>
        <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:14, height:14, borderRadius:4, border:'1.5px dashed #d0d0d0', display:'inline-block' }} /> Pendente</span>
        <span style={{ marginLeft:'auto', fontSize:10, color: theme === 'dark' ? '#808080' : '#ccc' }}>📅 agendar · <Icon ic={Pencil} size={11} /> editar · <Icon ic={Trash2} size={11} /> excluir</span>
      </div>

      {processes.map(p => {
        if (deletingId===p.id) return <DeleteConfirm key={p.id} nome={p.nome} onConfirm={() => { onDelete(p.id); setDeletingId(null) }} onCancel={() => setDeletingId(null)} />
        if (editingId===p.id)  return <ProcEditForm key={p.id} data={editData} onChange={setEditData} onSave={saveEdit} onCancel={() => setEditingId(null)} isNew={false} consultores={consultores} colaboradores={colaboradores} areas={areas} />
        return <ProcCard key={p.id} p={p} onToggle={onToggle} onConfirm={onConfirm} onEdit={startEdit} onDelete={handleDel} onAddMeeting={onAddMeeting} colaboradores={colaboradores} user={user} onAddComment={onAddComment} />
      })}
    </div>
  )
}

// ─── Levantamento tab ─────────────────────────────────────────
function ColaboradoresTab({ colaboradores, onAdd, onUpdate, onDelete }) {
  const { theme } = useTheme()
  return (
    <div>
      <div style={{ fontSize:26, fontWeight:700, color: theme === 'dark' ? '#f0f0f0' : '#111', marginBottom:'.2rem' }}>Colaboradores</div>
      <div style={{ fontSize:13, color: theme === 'dark' ? '#a0a0a0' : '#999', marginBottom:'1.5rem' }}>Gerencie os colaboradores da sua empresa</div>

      <PeopleSection
        title="Colaboradores / Atores"
        subtitle="Participantes da coleta de processos"
        type="colaborador"
        people={colaboradores}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDelete}
        accentColor="#6B7280"
      />
    </div>
  )
}

function Levantamento({ consultores, colaboradores, areas, onAdd, onGoProcessos }) {
  const { theme } = useTheme()
  const [data,    setData   ] = useState({ nome:'', area:[], comQuem:[], consultor:[], formato:FORMATO_OPTS[0] })
  const [success, setSuccess] = useState(false)

  function handleSave() {
    onAdd(data)
    setData({ nome:'', area:[], comQuem:[], consultor:[], formato:FORMATO_OPTS[0] })
    setSuccess(true)
  }

  return (
    <div>
      <div style={{ fontSize:26, fontWeight:700, color: theme === 'dark' ? '#f0f0f0' : '#111', marginBottom:'.2rem' }}>Levantamento de Processos</div>
      <div style={{ fontSize:13, color: theme === 'dark' ? '#a0a0a0' : '#999', marginBottom:'1.5rem' }}>Cadastre um novo processo para acompanhamento</div>

      {success ? (
        <div style={{ background:BRAND_LIGHT, border:`0.5px solid ${BRAND_BRD}`, borderRadius:14, padding:'1.5rem', textAlign:'center' }}>
          <div style={{ fontSize:22, marginBottom:8 }}><Icon ic={CheckCircle} size={16} /></div>
          <div style={{ fontSize:14, fontWeight:500, color:BRAND, marginBottom:4 }}>Processo lançado!</div>
          <div style={{ fontSize:12, color: theme === 'dark' ? '#d0d0d0' : '#555', marginBottom:'1.25rem' }}>Acesse a aba Processos para acompanhar.</div>
          <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
            <button onClick={() => setSuccess(false)} style={{ fontSize:12, padding:'7px 16px', border:`0.5px solid ${BRAND_BRD}`, borderRadius:8, cursor:'pointer', background:'#fff', color:BRAND }}><Icon ic={Plus} size={18} /> Lançar outro</button>
            <button onClick={onGoProcessos} style={{ fontSize:12, padding:'7px 16px', border:`0.5px solid ${BRAND}`, borderRadius:8, cursor:'pointer', background:BRAND, color:'#fff', fontWeight:500 }}>Ver Processos</button>
          </div>
        </div>
      ) : (
        <ProcEditForm
          data={data}
          onChange={setData}
          onSave={handleSave}
          onCancel={() => setData({ nome:'', area:[], comQuem:[], consultor:[], formato:FORMATO_OPTS[0] })}
          isNew
          consultores={consultores}
          colaboradores={colaboradores}
          areas={areas}
        />
      )}
    </div>
  )
}

// ─── App root ─────────────────────────────────────────────────
export default function App() {
  const { theme } = useTheme()
  const colors = themes[theme]

  // Apply theme to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark')
        document.body.style.backgroundColor = '#0f0f0f'
        document.body.style.color = '#f0f0f0'
      } else {
        document.documentElement.removeAttribute('data-theme')
        document.body.style.backgroundColor = '#f0f2f0'
        document.body.style.color = '#111'
      }
    }
  }, [theme])

  const [user,         setUser        ] = useState(() => {
    try { const s = localStorage.getItem('pcUser'); return s ? JSON.parse(s) : null } catch { return null }
  })
  const [tab,          setTab         ] = useState('dashboard')
  const [fadeOut,      setFadeOut     ] = useState(false)
  const [meetings,     setMeetings    ] = useState([])
  const [processes,    setProcesses   ] = useState([])
  const [colaboradores,setColaboradores]= useState([])
  const [consultores,  setConsultores ] = useState([])
  const [areas,        setAreas       ] = useState([])
  const [dataLoaded,   setDataLoaded  ] = useState(false)
  const [showCadastro, setShowCadastro] = useState(false)

  // Check URL for invite token on mount
  const inviteToken = (() => {
    try { return new URLSearchParams(window.location.search).get('invite') } catch { return null }
  })()

  // Auto-open cadastro if invite token in URL
  useEffect(() => {
    if (inviteToken && !user) {
      dbGetConvite(inviteToken).then(inv => { if (inv) setShowCadastro(true) })
    }
  }, [])

  // Carrega dados do Supabase após login
  useEffect(() => {
    if (!user) return
    if (user.role === 'socio' || user.role === 'cliente') setTab('processos')
    else setTab('dashboard')
    Promise.all([
      dbGetEventos(),
      dbGetProcessos(),
      dbGetColaboradores(),
      dbGetConsultores(),
      dbGetAreas(),
    ]).then(([evts, procs, colabs, consults, areas]) => {
      setMeetings(evts)
      setProcesses(procs)
      setColaboradores(colabs)
      setConsultores(consults)
      setAreas(areas)
      setDataLoaded(true)
    })
  }, [user?.id])

  function handleLogin(u) { setUser(u); setShowCadastro(false) }
  function handleLogout() { localStorage.removeItem('pcUser'); setUser(null) }

  // ── Meetings ──────────────────────────────────────────────────
  const handleMeetingToggle = id => {
    setMeetings(ms => {
      const upd = ms.map(m => m.id===id ? {...m, canceled:!m.canceled} : m)
      const evt = upd.find(m => m.id===id)
      if (evt) dbSaveEvento(id, evt)
      return upd
    })
  }
  const handleAddMeeting = async data => {
    const novo = await dbAddEvento({ canceled:false, ci: Math.floor(Math.random()*5), ...data })
    setMeetings(ms => [...ms, novo])
    setTab('agenda')
  }
  const handleUpdateMeeting = (id, data) => {
    setMeetings(ms => {
      const upd = ms.map(m => m.id===id ? {...m, ...data} : m)
      const evt = upd.find(m => m.id===id)
      if (evt) dbSaveEvento(id, evt)
      return upd
    })
  }
  const handleDeleteMeeting = id => {
    setMeetings(ms => ms.filter(m => m.id!==id))
    dbDeleteEvento(id)
  }

  // ── Processos ─────────────────────────────────────────────────
  const handleProcToggle = (id, key) => {
    setProcesses(ps => {
      const upd = ps.map(p => p.id===id && !p.confirmed ? {...p, [key]:!p[key]} : p)
      const proc = upd.find(p => p.id===id)
      if (proc) dbSaveProcesso(id, proc)
      return upd
    })
  }
  const handleConfirm = id => {
    setProcesses(ps => {
      const upd = ps.map(p => p.id===id && getPct(p)===100 ? {...p, confirmed:true} : p)
      const proc = upd.find(p => p.id===id)
      if (proc) dbSaveProcesso(id, proc)
      return upd
    })
  }
  const handleProcDelete = id => {
    setProcesses(ps => ps.filter(p => p.id!==id))
    dbDeleteProcesso(id)
  }
  const handleProcUpdate = (id, data) => {
    setProcesses(ps => {
      const upd = ps.map(p => p.id===id ? {...p, ...data} : p)
      const proc = upd.find(p => p.id===id)
      if (proc) dbSaveProcesso(id, proc)
      return upd
    })
  }
  const handleProcAdd = async data => {
    const newNum = processes.length ? Math.max(...processes.map(p=>p.num))+1 : 1
    const novo = await dbAddProcesso({ ...emptyStages, comentarios:[], num:newNum, confirmed:false, ...data })
    setProcesses(ps => [...ps, novo])
  }
  const handleAddComment = (procId, comentario) => {
    setProcesses(ps => {
      const upd = ps.map(p => p.id===procId ? {...p, comentarios:[...(p.comentarios||[]), comentario]} : p)
      const proc = upd.find(p => p.id===procId)
      if (proc) dbSaveProcesso(procId, proc)
      return upd
    })
  }

  // ── Colaboradores ─────────────────────────────────────────────
  const handleColabAdd = async data => {
    const novo = await dbAddColaborador(data)
    setColaboradores(cs => [...cs, novo])
  }
  const handleColabUpdate = (id, data) => {
    setColaboradores(cs => {
      const upd = cs.map(c => c.id===id ? {...c, ...data} : c)
      const colab = upd.find(c => c.id===id)
      if (colab) dbSaveColaborador(id, colab)
      return upd
    })
  }
  const handleColabDelete = id => {
    setColaboradores(cs => cs.filter(c => c.id!==id))
    dbDeleteColaborador(id)
  }

  // ── Consultores ───────────────────────────────────────────────
  const handleConsultorAdd = async data => {
    const novo = await dbAddConsultor(data)
    setConsultores(cs => [...cs, novo])
  }
  const handleConsultorUpdate = (id, data) => {
    setConsultores(cs => {
      const upd = cs.map(c => c.id===id ? {...c, ...data} : c)
      const cons = upd.find(c => c.id===id)
      if (cons) dbSaveConsultor(id, cons)
      return upd
    })
  }
  const handleConsultorDelete = id => {
    setConsultores(cs => cs.filter(c => c.id!==id))
    dbDeleteConsultor(id)
  }

  // ── Áreas ──────────────────────────────────────────────────────
  const handleAreaAdd = async data => {
    const novo = await dbAddArea(data)
    setAreas(as => [...as, novo])
  }
  const handleAreaUpdate = (id, data) => {
    setAreas(as => {
      const upd = as.map(a => a.id===id ? {...a, ...data} : a)
      const area = upd.find(a => a.id===id)
      if (area) dbSaveArea(id, area)
      return upd
    })
  }
  const handleAreaDelete = id => {
    setAreas(as => as.filter(a => a.id!==id))
    dbDeleteArea(id)
  }

  // Função para transição suave de abas
  const handleTabChange = (newTab) => {
    setFadeOut(true)
    setTimeout(() => {
      setTab(newTab)
      setFadeOut(false)
    }, 150)
  }

  if (!user) {
    if (showCadastro) return <CadastroScreen onBack={() => setShowCadastro(false)} inviteToken={inviteToken} />
    return <LoginScreen onLogin={handleLogin} onCadastro={() => setShowCadastro(true)} />
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', backgroundImage: colors.backgroundGradient, backgroundColor: colors.background }}>
      <Sidebar tab={tab} setTab={setTab} user={user} onLogout={handleLogout} onTabChange={handleTabChange} />
      <main style={{ flex:1, padding:'1.5rem', overflowY:'auto', minWidth:0, opacity: fadeOut ? 0 : 1, transition: 'opacity 0.3s ease-in-out', backgroundColor:'transparent', color:colors.text }}>
        {tab==='dashboard' && user?.role === 'socio' && (
          <DashboardSocio processes={processes} areas={areas} colaboradores={colaboradores} consultores={consultores} />
        )}
        {tab==='dashboard' && user?.role !== 'socio' && (
          <Dashboard meetings={meetings} processes={processes} />
        )}
        {tab==='agenda'        && <Agenda user={user} meetings={meetings} colaboradores={colaboradores} onToggle={handleMeetingToggle} onAdd={handleAddMeeting} onUpdate={handleUpdateMeeting} onDelete={handleDeleteMeeting} />}
        {tab==='levantamento'  && (
          <Levantamento
            consultores={consultores} colaboradores={colaboradores} areas={areas}
            onAdd={handleProcAdd} onGoProcessos={() => setTab('processos')}
          />
        )}
        {tab==='processos'     && (
          <Processos
            processes={processes} consultores={consultores} colaboradores={colaboradores} areas={areas}
            onToggle={handleProcToggle} onConfirm={handleConfirm}
            onAdd={handleProcAdd} onUpdate={handleProcUpdate} onDelete={handleProcDelete}
            onAddMeeting={handleAddMeeting} user={user} onAddComment={handleAddComment}
          />
        )}
        {tab==='colaboradores' && (
          <ColaboradoresTab
            colaboradores={colaboradores}
            onAdd={handleColabAdd} onUpdate={handleColabUpdate} onDelete={handleColabDelete}
          />
        )}
        {tab==='configuracoes' && (
          <Configuracoes
            colaboradores={colaboradores} consultores={consultores} areas={areas}
            onColabAdd={handleColabAdd} onColabUpdate={handleColabUpdate} onColabDelete={handleColabDelete}
            onConsultorAdd={handleConsultorAdd} onConsultorUpdate={handleConsultorUpdate} onConsultorDelete={handleConsultorDelete}
            onAreaAdd={handleAreaAdd} onAreaUpdate={handleAreaUpdate} onAreaDelete={handleAreaDelete}
            user={user}
          />
        )}
      </main>
    </div>
  )
}
