import { useState } from 'react'
import './index.css'

const BRAND      = '#163828'
const BRAND_MID  = '#2D6A4F'
const BRAND_LIGHT= '#EBF4EF'
const BRAND_BRD  = '#A8D0B8'
const ACCENT     = '#D4AC3A'
const ACCENT_LT  = '#FBF4DE'

// ─── Calendar ────────────────────────────────────────────────
const HOUR_H   = 58
const DAY_START= 8
const DAY_END  = 19
const HOURS    = Array.from({ length: DAY_END - DAY_START }, (_, i) => i + DAY_START)
const DAYS_HDR = [
  { short:'Seg', date:'23/06' },
  { short:'Ter', date:'24/06' },
  { short:'Qua', date:'25/06' },
  { short:'Qui', date:'26/06' },
  { short:'Sex', date:'27/06' },
]
const EV_COLORS = [
  { bg:'#E6F1FB', brd:'#378ADD', txt:'#0C447C' },
  { bg:BRAND_LIGHT, brd:BRAND_MID, txt:BRAND    },
  { bg:ACCENT_LT,  brd:'#BA7517', txt:'#7A5F10' },
  { bg:'#FBEAF0',  brd:'#D4537E', txt:'#72243E' },
  { bg:'#EAF3DE',  brd:'#639922', txt:'#173404' },
]

// ─── Process stages — 7 independent boxes ─────────────────────
const STAGE_KEYS = [
  { key:'coleta',      label:'Coleta'          },
  { key:'modelagem',   label:'Modelagem'       },
  { key:'valCOPS',     label:'Val. COPS'       },
  { key:'corrCOPS',    label:'Corr. COPS'      },
  { key:'valCliente',  label:'Val. Cliente'    },
  { key:'corrCliente', label:'Corr. Cliente'   },
  { key:'analise',     label:'Análise Crítica' },
]

const getPct = p =>
  Math.round(STAGE_KEYS.filter(s => p[s.key]).length / STAGE_KEYS.length * 100)

// ─── Seed data ────────────────────────────────────────────────
const initMeetings = [
  { id:1, title:'Kick-off do Sprint',      who:'Pedro + Equipe',    day:0, sh:9,  sm:0,  eh:10, em:0,  ci:0, canceled:false },
  { id:2, title:'Review de Requisitos',    who:'Coordenação',       day:1, sh:14, sm:0,  eh:15, em:0,  ci:1, canceled:false },
  { id:3, title:'Alinhamento Cliente',     who:'Grupo DF Turismo',  day:2, sh:10, sm:30, eh:11, em:30, ci:2, canceled:false },
  { id:4, title:'Coleta — Proc. Financ.',  who:'Beatriz S.',        day:2, sh:14, sm:0,  eh:15, em:30, ci:3, canceled:false },
  { id:5, title:'Sync Técnico',            who:'Equipe Interna',    day:3, sh:16, sm:0,  eh:16, em:45, ci:4, canceled:false },
  { id:6, title:'Validação COPS',          who:'Coordenação',       day:3, sh:9,  sm:0,  eh:10, em:0,  ci:1, canceled:false },
  { id:7, title:'Sprint Retrospectiva',    who:'All Hands',         day:4, sh:11, sm:0,  eh:12, em:0,  ci:0, canceled:false },
]

const initProcesses = [
  { id:1,  num:1,  nome:'Emissão de Pacotes Turísticos', comQuem:'Gerência Comercial',       consultor:'Ana Lima',
    coleta:true,  modelagem:true,  valCOPS:true,  corrCOPS:false, valCliente:false, corrCliente:false, analise:false, confirmed:false },
  { id:2,  num:2,  nome:'Atendimento e Reservas',         comQuem:'Central de Atendimento',  consultor:'Carlos M.',
    coleta:true,  modelagem:true,  valCOPS:true,  corrCOPS:true,  valCliente:true,  corrCliente:true,  analise:false, confirmed:false },
  { id:3,  num:3,  nome:'Controle Financeiro',            comQuem:'Beatriz S. — Financeiro', consultor:'Ana Lima',
    coleta:true,  modelagem:false, valCOPS:false, corrCOPS:false, valCliente:false, corrCliente:false, analise:false, confirmed:false },
  { id:4,  num:4,  nome:'Gestão de Fornecedores',         comQuem:'Rodrigo T. — Compras',    consultor:'Carlos M.',
    coleta:true,  modelagem:true,  valCOPS:false, corrCOPS:false, valCliente:false, corrCliente:false, analise:false, confirmed:false },
  { id:5,  num:5,  nome:'Recrutamento & Seleção',         comQuem:'Mariana L. — RH',         consultor:'Ana Lima',
    coleta:false, modelagem:false, valCOPS:false, corrCOPS:false, valCliente:false, corrCliente:false, analise:false, confirmed:false },
  { id:6,  num:6,  nome:'Marketing Digital',              comQuem:'Felipe A. — Marketing',   consultor:'Carlos M.',
    coleta:true,  modelagem:true,  valCOPS:true,  corrCOPS:true,  valCliente:false, corrCliente:false, analise:false, confirmed:false },
  { id:7,  num:7,  nome:'Controle de Vendas',             comQuem:'Sofia R. — Comercial',    consultor:'Ana Lima',
    coleta:true,  modelagem:true,  valCOPS:true,  corrCOPS:true,  valCliente:true,  corrCliente:true,  analise:true,  confirmed:true  },
  { id:8,  num:8,  nome:'Onboarding de Colaboradores',    comQuem:'Mariana L. — RH',         consultor:'Carlos M.',
    coleta:true,  modelagem:true,  valCOPS:false, corrCOPS:false, valCliente:false, corrCliente:false, analise:false, confirmed:false },
  { id:9,  num:9,  nome:'Gestão de Transportes',          comQuem:'ainda vamos ver',         consultor:'Ana Lima',
    coleta:false, modelagem:false, valCOPS:false, corrCOPS:false, valCliente:false, corrCliente:false, analise:false, confirmed:false },
  { id:10, num:10, nome:'Relatórios Gerenciais',          comQuem:'Gerência Geral',          consultor:'Carlos M.',
    coleta:true,  modelagem:true,  valCOPS:true,  corrCOPS:false, valCliente:false, corrCliente:false, analise:false, confirmed:false },
]

// ─── Helpers ─────────────────────────────────────────────────
const fmt2 = n => String(n).padStart(2, '0')

// ─── Sidebar ─────────────────────────────────────────────────
function Sidebar({ tab, setTab }) {
  return (
    <nav style={{ width:210, flexShrink:0, background:BRAND, display:'flex', flexDirection:'column', padding:'1.25rem 0' }}>
      <div style={{ padding:'0 1rem 1.25rem', borderBottom:'1px solid rgba(255,255,255,.1)', marginBottom:'.75rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, background:'rgba(255,255,255,.15)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, color:'#fff' }}>⊞</div>
          <div>
            <div style={{ fontSize:13, fontWeight:500, color:'#fff' }}>ClientPanel</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,.5)' }}>DF Turismo</div>
          </div>
        </div>
      </div>
      {[
        { id:'dashboard', icon:'📅', label:'Dashboard' },
        { id:'processos', icon:'🗂',  label:'Processos'  },
      ].map(({ id, icon, label }) => (
        <div key={id} onClick={() => setTab(id)} style={{
          display:'flex', alignItems:'center', gap:10, padding:'10px 1rem', cursor:'pointer',
          fontSize:13, color: tab===id ? '#fff' : 'rgba(255,255,255,.6)',
          borderLeft:`2.5px solid ${tab===id ? ACCENT : 'transparent'}`,
          background: tab===id ? 'rgba(255,255,255,.1)' : 'transparent',
          fontWeight: tab===id ? 500 : 400,
        }}>
          <span>{icon}</span> {label}
        </div>
      ))}
      <div style={{ marginTop:'auto', padding:'1rem', borderTop:'1px solid rgba(255,255,255,.1)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:'50%', background:ACCENT, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#0D2519', fontWeight:500 }}>DF</div>
          <div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.85)', fontWeight:500 }}>DF Turismo</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,.5)' }}>cliente</div>
          </div>
        </div>
      </div>
    </nav>
  )
}

// ─── Calendar ────────────────────────────────────────────────
function WeekCalendar({ meetings, onCancel }) {
  const [hov, setHov] = useState(null)
  const canceled  = meetings.filter(m => m.canceled)
  const confirmed = meetings.filter(m => !m.canceled).length
  const totalH    = HOURS.length * HOUR_H

  return (
    <div>
      <div style={{ fontSize:20, fontWeight:500, color:'#111', marginBottom:2 }}>Dashboard — Agenda Semanal</div>
      <div style={{ fontSize:12, color:'#888', marginBottom:'1rem' }}>Semana de 23 a 27 de Jun, 2026</div>

      {/* Alert */}
      <div style={{
        background: canceled.length ? '#FCEBEB' : BRAND_LIGHT,
        border:`0.5px solid ${canceled.length ? '#F7C1C1' : BRAND_BRD}`,
        borderRadius:12, padding:'.8rem 1.1rem', marginBottom:'1rem',
      }}>
        <div style={{ fontSize:12, fontWeight:500, color: canceled.length ? '#A32D2D' : '#0D2519', display:'flex', alignItems:'center', gap:6, marginBottom: canceled.length ? '.4rem' : 0 }}>
          {canceled.length ? '⚠️ Reuniões canceladas esta semana' : '✅ Nenhuma reunião cancelada esta semana'}
        </div>
        {canceled.length > 0 && canceled.map(m => (
          <div key={m.id} style={{ fontSize:12, color:'#A32D2D', display:'flex', alignItems:'center', gap:6, padding:'2px 0' }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'#E24B4A', display:'inline-block', flexShrink:0 }} />
            <strong>{m.title}</strong> — {DAYS_HDR[m.day].short}, {fmt2(m.sh)}:{fmt2(m.sm)}h ({m.who})
          </div>
        ))}
        {!canceled.length && <div style={{ fontSize:12, color:BRAND_MID }}>Todos os compromissos confirmados.</div>}
      </div>

      {/* Sprint strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.6rem', marginBottom:'1rem' }}>
        {[['Sprint 04','Mapeamento Core',BRAND],['68%','Concluído',BRAND_MID],[`${confirmed}`,'Reuniões confirmadas','#2D8A6F'],['3','Dias restantes','#BA7517']].map(([v,l,c]) => (
          <div key={l} style={{ background:'#fff', border:'0.5px solid #e2e8e4', borderRadius:10, padding:'.65rem 1rem' }}>
            <div style={{ fontSize: v.length > 5 ? 13 : 18, fontWeight:500, color:c }}>{v}</div>
            <div style={{ fontSize:10, color:'#888', marginTop:1 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ background:'#fff', border:'0.5px solid #e2e8e4', borderRadius:12, overflow:'hidden' }}>
        {/* Header */}
        <div style={{ display:'flex', borderBottom:'0.5px solid #e2e8e4' }}>
          <div style={{ width:52, flexShrink:0 }} />
          {DAYS_HDR.map((d, i) => (
            <div key={i} style={{ flex:1, padding:'.6rem .5rem', textAlign:'center', borderLeft:'0.5px solid #e2e8e4', background: i===2 ? BRAND_LIGHT : 'transparent' }}>
              <div style={{ fontSize:11, color:'#888' }}>{d.short}</div>
              <div style={{ fontSize:14, fontWeight: meetings.some(m=>m.day===i&&!m.canceled) ? 500 : 400, color: i===2 ? BRAND : '#111', marginTop:1 }}>{d.date}</div>
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ overflowY:'auto', maxHeight:520 }}>
          <div style={{ display:'flex', position:'relative' }}>
            {/* Hours */}
            <div style={{ width:52, flexShrink:0, position:'relative', height:totalH }}>
              {HOURS.map(h => (
                <div key={h} style={{ position:'absolute', top:(h-DAY_START)*HOUR_H-8, right:8, fontSize:10, color:'#bbb', userSelect:'none' }}>
                  {fmt2(h)}:00
                </div>
              ))}
            </div>
            {/* Day columns */}
            {DAYS_HDR.map((d, di) => (
              <div key={di} style={{ flex:1, borderLeft:'0.5px solid #e2e8e4', position:'relative', height:totalH, background: di===2 ? '#FAFCFA' : 'transparent' }}>
                {HOURS.map(h => (
                  <div key={h} style={{ position:'absolute', top:(h-DAY_START)*HOUR_H, left:0, right:0, borderTop: h===DAY_START ? 'none' : '0.5px solid #f0f0f0', height:HOUR_H }} />
                ))}
                {meetings.filter(m => m.day===di).map(m => {
                  const c   = EV_COLORS[m.ci % EV_COLORS.length]
                  const top = ((m.sh-DAY_START)+m.sm/60)*HOUR_H
                  const ht  = Math.max(((m.eh-m.sh)+(m.em-m.sm)/60)*HOUR_H, 28)
                  return (
                    <div key={m.id}
                      onMouseEnter={() => setHov(m.id)}
                      onMouseLeave={() => setHov(null)}
                      onClick={() => onCancel(m.id)}
                      title={m.canceled ? 'Clique para reativar' : 'Clique para cancelar'}
                      style={{
                        position:'absolute', top:top+2, left:3, right:3, height:ht-4,
                        background: m.canceled ? '#f5f5f5' : c.bg,
                        border:`1px solid ${m.canceled ? '#ddd' : c.brd}`,
                        borderRadius:6, padding:'3px 6px', cursor:'pointer', overflow:'hidden',
                        opacity: m.canceled ? .5 : 1, zIndex: hov===m.id ? 10 : 1,
                        boxShadow: hov===m.id ? '0 2px 8px rgba(0,0,0,.12)' : 'none',
                      }}>
                      <div style={{ fontSize:11, fontWeight:500, color: m.canceled ? '#aaa' : c.txt, textDecoration: m.canceled ? 'line-through' : 'none', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {m.title}
                      </div>
                      {ht > 36 && <div style={{ fontSize:10, color: m.canceled ? '#bbb' : c.brd, marginTop:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {fmt2(m.sh)}:{fmt2(m.sm)}–{fmt2(m.eh)}:{fmt2(m.em)} · {m.who}
                      </div>}
                      {m.canceled && ht > 24 && <div style={{ fontSize:9, color:'#A32D2D', fontWeight:500, marginTop:1 }}>CANCELADO</div>}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding:'.45rem 1rem', borderTop:'0.5px solid #eee', fontSize:11, color:'#bbb' }}>
          Clique em um evento para cancelar · clique novamente para reativar
        </div>
      </div>
    </div>
  )
}

// ─── Process Card ─────────────────────────────────────────────
function ProcCard({ p, onToggle, onConfirm }) {
  const pct   = getPct(p)
  const ready = pct === 100 && !p.confirmed

  // progress bar color ramp
  const barColor = pct === 100 ? BRAND : pct >= 70 ? BRAND_MID : pct >= 40 ? ACCENT : '#E24B4A'

  return (
    <div style={{
      background:'#fff', border:`0.5px solid ${p.confirmed ? BRAND_BRD : '#e2e8e4'}`,
      borderRadius:12, padding:'1rem 1.1rem', marginBottom:'.6rem',
      boxShadow: p.confirmed ? `0 0 0 1px ${BRAND_BRD}` : 'none',
    }}>
      {/* Top row — grid for reliable layout */}
      <div style={{ display:'grid', gridTemplateColumns:'28px 1fr auto', gap:10, alignItems:'start', marginBottom:'.85rem' }}>
        {/* Num badge */}
        <div style={{ width:26, height:26, borderRadius:'50%', background: p.confirmed ? BRAND : '#f0f0f0', color: p.confirmed ? '#fff' : '#aaa', fontSize:10, fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {p.num}
        </div>

        {/* Name + owner */}
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:500, color:'#111', lineHeight:1.3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.nome}</div>
          <div style={{ fontSize:11, color:'#888', marginTop:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            👤 {p.comQuem} · Consultor: {p.consultor}
          </div>
          {/* Progress bar under the name */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:7 }}>
            <div style={{ flex:1, height:5, background:'#eee', borderRadius:99, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, background:barColor, borderRadius:99, transition:'width .4s' }} />
            </div>
            <span style={{ fontSize:12, fontWeight:600, color:barColor, flexShrink:0 }}>{pct}%</span>
            <span style={{ fontSize:10, color:'#bbb', flexShrink:0 }}>{STAGE_KEYS.filter(s => p[s.key]).length}/{STAGE_KEYS.length} etapas</span>
          </div>
        </div>

        {/* Confirm button */}
        <button
          onClick={() => ready && onConfirm(p.id)}
          style={{
            fontSize:11, padding:'6px 12px', borderRadius:7, whiteSpace:'nowrap',
            cursor: ready ? 'pointer' : 'default',
            border: p.confirmed ? `0.5px solid ${BRAND_BRD}` : ready ? `0.5px solid ${BRAND}` : '0.5px solid #ddd',
            background: p.confirmed ? BRAND_LIGHT : ready ? BRAND : '#f8f8f8',
            color: p.confirmed ? BRAND_MID : ready ? '#fff' : '#ccc',
            fontWeight: ready ? 500 : 400,
          }}>
          {p.confirmed ? '🔒 Concluído' : ready ? '✓ Confirmar' : 'Pendente'}
        </button>
      </div>

      {/* Stage boxes row — scroll on narrow screens */}
      <div style={{ overflowX:'auto' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:6, minWidth:490 }}>
        {STAGE_KEYS.map(({ key, label }) => {
          const checked = p[key]
          return (
            <div
              key={key}
              onClick={() => !p.confirmed && onToggle(p.id, key)}
              title={p.confirmed ? label : checked ? `Desmarcar: ${label}` : `Marcar: ${label}`}
              style={{
                borderRadius:8, padding:'8px 4px 6px',
                background: checked ? BRAND : '#f8f8f8',
                border: `1.5px ${checked ? 'solid' : 'dashed'} ${checked ? BRAND_MID : '#d0d0d0'}`,
                cursor: p.confirmed ? 'default' : 'pointer',
                textAlign:'center',
                transition:'all .18s',
                userSelect:'none',
              }}
            >
              {/* Check indicator */}
              <div style={{
                width:22, height:22, borderRadius:'50%', margin:'0 auto 5px',
                background: checked ? 'rgba(255,255,255,.2)' : '#ebebeb',
                border: `1.5px solid ${checked ? 'rgba(255,255,255,.4)' : '#d5d5d5'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:11, color: checked ? '#fff' : '#ccc',
              }}>
                {checked ? '✓' : ''}
              </div>
              <div style={{ fontSize:9, fontWeight: checked ? 500 : 400, color: checked ? 'rgba(255,255,255,.9)' : '#aaa', lineHeight:1.3 }}>
                {label}
              </div>
            </div>
          )
        })}
      </div>{/* grid */}
      </div>{/* overflow wrapper */}
    </div>
  )
}

// ─── Processos tab ────────────────────────────────────────────
function Processos({ processes, onToggle, onConfirm }) {
  const total    = processes.length
  const done     = processes.filter(p => p.confirmed).length
  const allPcts  = processes.map(getPct)
  const avgPct   = Math.round(allPcts.reduce((a, b) => a + b, 0) / total)
  const barColor = avgPct >= 70 ? BRAND_MID : avgPct >= 40 ? ACCENT : '#E24B4A'

  return (
    <div>
      <div style={{ fontSize:20, fontWeight:500, color:'#111', marginBottom:2 }}>Controle de Mapeamento de Processos</div>
      <div style={{ fontSize:12, color:'#888', marginBottom:'1.25rem' }}>
        Fonte: <em>_Controle de Processos _ DF Turismo.xlsx</em> — Aba Mapeamentos
      </div>

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.75rem', marginBottom:'1rem' }}>
        {[
          ['Total de processos', total, '#111'],
          ['Em andamento', processes.filter(p => getPct(p) > 0 && !p.confirmed).length, '#BA7517'],
          ['Concluídos', done, BRAND_MID],
          ['Progresso médio', `${avgPct}%`, BRAND],
        ].map(([l, v, c]) => (
          <div key={l} style={{ background:'#fff', border:'0.5px solid #e2e8e4', borderRadius:10, padding:'.8rem 1rem' }}>
            <div style={{ fontSize:20, fontWeight:500, color:c }}>{v}</div>
            <div style={{ fontSize:10, color:'#888', marginTop:1 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Overall progress bar */}
      <div style={{ background:'#fff', border:'0.5px solid #e2e8e4', borderRadius:10, padding:'.9rem 1.1rem', marginBottom:'1.1rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <span style={{ fontSize:12, fontWeight:500, color:'#555' }}>Progresso geral do projeto</span>
          <span style={{ fontSize:14, fontWeight:600, color:barColor }}>{avgPct}%</span>
        </div>
        <div style={{ height:10, background:'#eee', borderRadius:99, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${avgPct}%`, background:barColor, borderRadius:99, transition:'width .5s' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
          {processes.map(p => {
            const pct = getPct(p)
            return (
              <div key={p.id} title={p.nome} style={{ flex:1, height:4, margin:'0 1px', borderRadius:99, background: pct > 0 ? BRAND : '#e8e8e8', opacity: p.confirmed ? 1 : 0.55 }} />
            )
          })}
        </div>
        <div style={{ fontSize:10, color:'#bbb', marginTop:4 }}>Cada barra = 1 processo</div>
      </div>

      {/* Legend */}
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:'.75rem', fontSize:11, color:'#888', flexWrap:'wrap' }}>
        <span style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:14, height:14, borderRadius:4, background:BRAND, display:'inline-block' }} /> Etapa concluída
        </span>
        <span style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:14, height:14, borderRadius:4, border:'1.5px dashed #d0d0d0', display:'inline-block' }} /> Pendente — clique para marcar
        </span>
        <span style={{ marginLeft:'auto', fontSize:10, color:'#ccc' }}>Clique nas caixas para avançar · Confirmar ativa em 100%</span>
      </div>

      {/* Process cards */}
      {processes.map(p => (
        <ProcCard key={p.id} p={p} onToggle={onToggle} onConfirm={onConfirm} />
      ))}
    </div>
  )
}

// ─── App root ─────────────────────────────────────────────────
export default function App() {
  const [tab,       setTab]       = useState('dashboard')
  const [meetings,  setMeetings]  = useState(initMeetings)
  const [processes, setProcesses] = useState(initProcesses)

  const handleCancel  = id  => setMeetings(ms  => ms.map(m => m.id===id ? {...m, canceled:!m.canceled} : m))
  const handleToggle  = (id,key) => setProcesses(ps => ps.map(p => p.id===id && !p.confirmed ? {...p, [key]:!p[key]} : p))
  const handleConfirm = id  => setProcesses(ps  => ps.map(p => p.id===id && getPct(p)===100 ? {...p, confirmed:true} : p))

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f0f2f0' }}>
      <Sidebar tab={tab} setTab={setTab} />
      <main style={{ flex:1, padding:'1.5rem', overflowY:'auto', minWidth:0 }}>
        {tab === 'dashboard'
          ? <WeekCalendar meetings={meetings} onCancel={handleCancel} />
          : <Processos    processes={processes} onToggle={handleToggle} onConfirm={handleConfirm} />
        }
      </main>
    </div>
  )
}
