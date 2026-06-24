import { useState } from 'react'
import './index.css'

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

function toYMD(dt)    { return `${dt.getFullYear()}-${p2(dt.getMonth()+1)}-${p2(dt.getDate())}` }
function fromYMD(s)   { const [y,mo,dy]=s.split('-').map(Number); return new Date(y,mo-1,dy,12) }
function addDays(dt,n){ return new Date(dt.getFullYear(),dt.getMonth(),dt.getDate()+n,12) }
function addMonths(dt,n){ return new Date(dt.getFullYear(),dt.getMonth()+n,1,12) }
function weekMon(dt)  { const dow=dt.getDay(); return addDays(dt, dow===0?-6:1-dow) }
function sameDay(a,b) { return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate() }
function p2(n)        { return String(n).padStart(2,'0') }

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

// ─── Seed data ────────────────────────────────────────────────
let nextMeetingId = 8
let nextProcId    = 11

const initMeetings = [
  { id:1, title:'Kick-off do Sprint',     who:'Pedro + Equipe',   date:'2026-06-23', sh:9,  sm:0,  eh:10, em:0,  ci:0, canceled:false },
  { id:2, title:'Review de Requisitos',   who:'Coordenação',      date:'2026-06-24', sh:14, sm:0,  eh:15, em:0,  ci:1, canceled:false },
  { id:3, title:'Alinhamento Cliente',    who:'Grupo DF Turismo', date:'2026-06-25', sh:10, sm:30, eh:11, em:30, ci:2, canceled:false },
  { id:4, title:'Coleta — Proc. Financ.', who:'Beatriz S.',       date:'2026-06-25', sh:14, sm:0,  eh:15, em:30, ci:3, canceled:false },
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
  { id:1,  num:1,  nome:'Emissão de Pacotes Turísticos', area:'Comercial',  comQuem:'Gerência Comercial',      consultor:'Ana Lima',  formato:'Fluxograma',
    coleta:true,  modelagem:true,  valCOPS:true,  corrCOPS:false, valCliente:false, corrCliente:false, analise:false, confirmed:false },
  { id:2,  num:2,  nome:'Atendimento e Reservas',         area:'Atendimento',comQuem:'Central de Atendimento', consultor:'Carlos M.', formato:'POP - Procedimento Operacional Padrão',
    coleta:true,  modelagem:true,  valCOPS:true,  corrCOPS:true,  valCliente:true,  corrCliente:true,  analise:false, confirmed:false },
  { id:3,  num:3,  nome:'Controle Financeiro',            area:'Financeiro', comQuem:'Beatriz S.',             consultor:'Ana Lima',  formato:'Fluxograma',
    coleta:true,  modelagem:false, valCOPS:false, corrCOPS:false, valCliente:false, corrCliente:false, analise:false, confirmed:false },
  { id:4,  num:4,  nome:'Gestão de Fornecedores',         area:'Compras',    comQuem:'Rodrigo T.',             consultor:'Carlos M.', formato:'POP - Procedimento Operacional Padrão',
    coleta:true,  modelagem:true,  valCOPS:false, corrCOPS:false, valCliente:false, corrCliente:false, analise:false, confirmed:false },
  { id:5,  num:5,  nome:'Recrutamento & Seleção',         area:'RH',         comQuem:'Mariana L.',             consultor:'Ana Lima',  formato:'Fluxograma',
    coleta:false, modelagem:false, valCOPS:false, corrCOPS:false, valCliente:false, corrCliente:false, analise:false, confirmed:false },
  { id:6,  num:6,  nome:'Marketing Digital',              area:'Marketing',  comQuem:'Felipe A.',              consultor:'Carlos M.', formato:'Fluxograma',
    coleta:true,  modelagem:true,  valCOPS:true,  corrCOPS:true,  valCliente:false, corrCliente:false, analise:false, confirmed:false },
  { id:7,  num:7,  nome:'Controle de Vendas',             area:'Comercial',  comQuem:'Sofia R.',               consultor:'Ana Lima',  formato:'POP - Procedimento Operacional Padrão',
    coleta:true,  modelagem:true,  valCOPS:true,  corrCOPS:true,  valCliente:true,  corrCliente:true,  analise:true,  confirmed:true  },
  { id:8,  num:8,  nome:'Onboarding de Colaboradores',    area:'RH',         comQuem:'Mariana L.',             consultor:'Carlos M.', formato:'POP - Procedimento Operacional Padrão',
    coleta:true,  modelagem:true,  valCOPS:false, corrCOPS:false, valCliente:false, corrCliente:false, analise:false, confirmed:false },
  { id:9,  num:9,  nome:'Gestão de Transportes',          area:'Operações',  comQuem:'ainda vamos ver',        consultor:'Ana Lima',  formato:'Fluxograma',
    coleta:false, modelagem:false, valCOPS:false, corrCOPS:false, valCliente:false, corrCliente:false, analise:false, confirmed:false },
  { id:10, num:10, nome:'Relatórios Gerenciais',          area:'Gerência',   comQuem:'Gerência Geral',         consultor:'Carlos M.', formato:'Fluxograma',
    coleta:true,  modelagem:true,  valCOPS:true,  corrCOPS:false, valCliente:false, corrCliente:false, analise:false, confirmed:false },
]

// ─── Shared styles ────────────────────────────────────────────
const inputSt = { width:'100%', padding:'6px 10px', fontSize:13, border:'0.5px solid #ccc', borderRadius:7, background:'#fafafa', color:'#111', outline:'none' }
const labelSt = { fontSize:11, color:'#666', marginBottom:3, display:'block' }

// ─── Sidebar ─────────────────────────────────────────────────
function Sidebar({ tab, setTab }) {
  const items = [
    { id:'dashboard', icon:'📊', label:'Dashboard' },
    { id:'agenda',    icon:'📅', label:'Agenda'     },
    { id:'processos', icon:'🗂',  label:'Processos'  },
  ]
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
      {items.map(({ id, icon, label }) => (
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

// ─── Calendar nav bar ─────────────────────────────────────────
function CalNavBar({ label, onPrev, onNext, onToday, mode, setMode }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'1rem', flexWrap:'wrap' }}>
      <button onClick={onToday} style={{ fontSize:11, padding:'5px 12px', border:`0.5px solid ${BRAND_BRD}`, borderRadius:7, cursor:'pointer', background:BRAND_LIGHT, color:BRAND, fontWeight:500 }}>Hoje</button>
      <div style={{ display:'flex', alignItems:'center', gap:2 }}>
        <button onClick={onPrev} style={{ width:28, height:28, border:'0.5px solid #ddd', borderRadius:6, cursor:'pointer', background:'#fff', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', color:'#555' }}>‹</button>
        <button onClick={onNext} style={{ width:28, height:28, border:'0.5px solid #ddd', borderRadius:6, cursor:'pointer', background:'#fff', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', color:'#555' }}>›</button>
      </div>
      <span style={{ fontSize:15, fontWeight:500, color:'#111', flex:1 }}>{label}</span>
      <div style={{ display:'flex', border:'0.5px solid #ddd', borderRadius:8, overflow:'hidden' }}>
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
function AgendaDia({ meetings, viewDate, onToggle }) {
  const ymd    = toYMD(viewDate)
  const evs    = meetings.filter(m => m.date===ymd)
  const totalH = HOURS.length * HOUR_H
  return (
    <div style={{ background:'#fff', border:'0.5px solid #e2e8e4', borderRadius:12, overflow:'hidden' }}>
      <div style={{ padding:'.65rem 1rem', background:BRAND_LIGHT, borderBottom:'0.5px solid #e2e8e4', fontSize:13, fontWeight:500, color:BRAND }}>
        {DAY_PT[viewDate.getDay()]} — {viewDate.getDate()} de {MONTH_PT[viewDate.getMonth()]} de {viewDate.getFullYear()}
        {evs.length===0 && <span style={{ fontSize:11, color:'#aaa', fontWeight:400, marginLeft:12 }}>Nenhuma reunião agendada</span>}
      </div>
      <div style={{ display:'flex', overflowY:'auto', maxHeight:560 }}>
        <div style={{ width:52, flexShrink:0, position:'relative', height:totalH }}>
          {HOURS.map(h => <div key={h} style={{ position:'absolute', top:(h-DAY_START)*HOUR_H-8, right:8, fontSize:10, color:'#bbb' }}>{p2(h)}:00</div>)}
        </div>
        <div style={{ flex:1, position:'relative', height:totalH, borderLeft:'0.5px solid #eee' }}>
          {HOURS.map(h => <div key={h} style={{ position:'absolute', top:(h-DAY_START)*HOUR_H, left:0, right:0, borderTop:'0.5px solid #f0f0f0', height:HOUR_H }} />)}
          {evs.map(m => {
            const c   = EV_COLORS[m.ci%5]
            const top = ((m.sh-DAY_START)+m.sm/60)*HOUR_H
            const ht  = Math.max(((m.eh-m.sh)+(m.em-m.sm)/60)*HOUR_H, 32)
            return (
              <div key={m.id} onClick={() => onToggle(m.id)} style={{
                position:'absolute', top:top+2, left:6, right:6, height:ht-4,
                background: m.canceled ? '#f5f5f5' : c.bg, border:`1px solid ${m.canceled ? '#ddd' : c.brd}`,
                borderRadius:8, padding:'5px 10px', cursor:'pointer', opacity: m.canceled ? .5 : 1,
              }}>
                <div style={{ fontSize:12, fontWeight:500, color: m.canceled ? '#aaa' : c.txt, textDecoration: m.canceled ? 'line-through' : 'none' }}>{m.title}</div>
                <div style={{ fontSize:11, color: m.canceled ? '#bbb' : c.brd, marginTop:2 }}>{p2(m.sh)}:{p2(m.sm)} – {p2(m.eh)}:{p2(m.em)}</div>
                <div style={{ fontSize:11, color: m.canceled ? '#bbb' : c.brd }}>👤 {m.who}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Week view ────────────────────────────────────────────────
function AgendaSemana({ meetings, viewDate, onToggle }) {
  const mon    = weekMon(viewDate)
  const cols   = Array.from({ length:5 }, (_, i) => addDays(mon, i))
  const totalH = HOURS.length * HOUR_H
  const today  = new Date()
  return (
    <div style={{ background:'#fff', border:'0.5px solid #e2e8e4', borderRadius:12, overflow:'hidden' }}>
      <div style={{ display:'flex', borderBottom:'0.5px solid #e2e8e4' }}>
        <div style={{ width:52, flexShrink:0 }} />
        {cols.map((col, i) => {
          const isToday = sameDay(col, today)
          return (
            <div key={i} style={{ flex:1, padding:'.55rem .5rem', textAlign:'center', borderLeft:'0.5px solid #e2e8e4', background: isToday ? BRAND_LIGHT : 'transparent' }}>
              <div style={{ fontSize:10, color:'#888' }}>{DAY_PT[col.getDay()]}</div>
              <div style={{
                fontSize:14, fontWeight: isToday ? 600 : 400,
                width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'3px auto 0',
                background: isToday ? BRAND : 'transparent',
                color: isToday ? '#fff' : '#111',
              }}>{col.getDate()}</div>
            </div>
          )
        })}
      </div>
      <div style={{ overflowY:'auto', maxHeight:520 }}>
        <div style={{ display:'flex', position:'relative' }}>
          <div style={{ width:52, flexShrink:0, position:'relative', height:totalH }}>
            {HOURS.map(h => <div key={h} style={{ position:'absolute', top:(h-DAY_START)*HOUR_H-8, right:8, fontSize:10, color:'#bbb' }}>{p2(h)}:00</div>)}
          </div>
          {cols.map((col, di) => {
            const ymd     = toYMD(col)
            const isToday = sameDay(col, today)
            return (
              <div key={di} style={{ flex:1, borderLeft:'0.5px solid #e2e8e4', position:'relative', height:totalH, background: isToday ? '#FAFCFA' : 'transparent' }}>
                {HOURS.map(h => <div key={h} style={{ position:'absolute', top:(h-DAY_START)*HOUR_H, left:0, right:0, borderTop:'0.5px solid #f0f0f0', height:HOUR_H }} />)}
                {meetings.filter(m => m.date===ymd).map(m => {
                  const c   = EV_COLORS[m.ci%5]
                  const top = ((m.sh-DAY_START)+m.sm/60)*HOUR_H
                  const ht  = Math.max(((m.eh-m.sh)+(m.em-m.sm)/60)*HOUR_H, 28)
                  return (
                    <div key={m.id} onClick={() => onToggle(m.id)} title={m.canceled?'Reativar':'Cancelar'}
                      style={{
                        position:'absolute', top:top+2, left:2, right:2, height:ht-4,
                        background: m.canceled ? '#f5f5f5' : c.bg, border:`1px solid ${m.canceled ? '#ddd' : c.brd}`,
                        borderRadius:6, padding:'3px 5px', cursor:'pointer', overflow:'hidden', opacity: m.canceled ? .5 : 1,
                      }}>
                      <div style={{ fontSize:10, fontWeight:500, color: m.canceled ? '#aaa' : c.txt, textDecoration: m.canceled?'line-through':'none', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.title}</div>
                      {ht>36 && <div style={{ fontSize:9, color: m.canceled ? '#bbb' : c.brd, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p2(m.sh)}:{p2(m.sm)}–{p2(m.eh)}:{p2(m.em)}</div>}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
      <div style={{ padding:'.4rem .8rem', borderTop:'0.5px solid #eee', fontSize:10, color:'#bbb' }}>Clique em um evento para cancelar · clique novamente para reativar</div>
    </div>
  )
}

// ─── Month view ───────────────────────────────────────────────
function AgendaMes({ meetings, viewDate, onToggle, onDrillDay }) {
  const cells = monthGrid(viewDate)
  const today = new Date()
  return (
    <div style={{ background:'#fff', border:'0.5px solid #e2e8e4', borderRadius:12, overflow:'hidden' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'0.5px solid #eee' }}>
        {['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(dl => (
          <div key={dl} style={{ padding:'8px 0', textAlign:'center', fontSize:10, fontWeight:500, color:'#888' }}>{dl}</div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} style={{ minHeight:72, background:'#fafafa', borderRight:'0.5px solid #f0f0f0', borderBottom:'0.5px solid #f0f0f0' }} />
          const ymd     = toYMD(cell)
          const evs     = meetings.filter(m => m.date===ymd)
          const isToday = sameDay(cell, today)
          const inMonth = cell.getMonth()===viewDate.getMonth()
          return (
            <div key={i} onClick={() => onDrillDay(cell)}
              style={{ minHeight:72, padding:'5px 6px', border:'0.5px solid #f0f0f0', cursor:'pointer', background: isToday ? BRAND_LIGHT : '#fff', opacity: inMonth ? 1 : .35 }}>
              <div style={{
                width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:11, fontWeight: isToday ? 600 : 400, marginBottom:3,
                background: isToday ? BRAND : 'transparent', color: isToday ? '#fff' : '#333',
              }}>{cell.getDate()}</div>
              {evs.slice(0,2).map(m => (
                <div key={m.id} onClick={e => { e.stopPropagation(); onToggle(m.id) }}
                  style={{ fontSize:9, padding:'1px 5px', borderRadius:3, marginBottom:2,
                    background: m.canceled ? '#eee' : EV_COLORS[m.ci%5].bg,
                    color: m.canceled ? '#aaa' : EV_COLORS[m.ci%5].txt,
                    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                    textDecoration: m.canceled ? 'line-through' : 'none' }}>
                  {m.title}
                </div>
              ))}
              {evs.length>2 && <div style={{ fontSize:9, color:'#888' }}>+{evs.length-2} mais</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Year view ────────────────────────────────────────────────
function AgendaAno({ meetings, viewDate, onToggle, onDrillMonth }) {
  const year  = viewDate.getFullYear()
  const today = new Date()
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
      {Array.from({ length:12 }, (_, mi) => {
        const anchor = new Date(year, mi, 1, 12)
        const cells  = monthGrid(anchor)
        const evCount = meetings.filter(m => { const dt=fromYMD(m.date); return dt.getFullYear()===year&&dt.getMonth()===mi }).length
        return (
          <div key={mi} style={{ background:'#fff', border:'0.5px solid #e2e8e4', borderRadius:10, padding:'10px 8px' }}>
            <div onClick={() => onDrillMonth(anchor)}
              style={{ fontSize:12, fontWeight:500, color:BRAND, marginBottom:6, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
              {MONTH_PT[mi].charAt(0).toUpperCase()+MONTH_PT[mi].slice(1)}
              {evCount>0 && <span style={{ fontSize:9, padding:'1px 6px', borderRadius:99, background:BRAND_LIGHT, color:BRAND_MID }}>{evCount} reunião{evCount>1?'ões':''}</span>}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:1 }}>
              {['S','T','Q','Q','S','S','D'].map((dl,i) => (
                <div key={i} style={{ fontSize:7, color:'#bbb', textAlign:'center', paddingBottom:2 }}>{dl}</div>
              ))}
              {cells.map((cell, ci) => {
                if (!cell) return <div key={ci} />
                const ymd   = toYMD(cell)
                const hasEv = meetings.some(m => m.date===ymd)
                const isToday = sameDay(cell, today)
                return (
                  <div key={ci}
                    title={hasEv ? meetings.filter(m=>m.date===ymd).map(m=>m.title).join(', ') : ''}
                    onClick={() => { if(hasEv) onDrillMonth(cell) }}
                    style={{
                      aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center',
                      borderRadius:'50%', fontSize:8, cursor: hasEv ? 'pointer' : 'default',
                      background: isToday ? BRAND : hasEv ? BRAND_LIGHT : 'transparent',
                      color: isToday ? '#fff' : '#444',
                      fontWeight: isToday ? 600 : 400,
                      outline: hasEv && !isToday ? `1.5px solid ${BRAND_BRD}` : 'none',
                    }}>
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
function Agenda({ meetings, onToggle }) {
  const todayDt = new Date(); todayDt.setHours(12,0,0,0)
  const [viewDate, setViewDate] = useState(todayDt)
  const [mode,     setMode    ] = useState('semana')

  function navLabel() {
    if (mode==='dia') {
      return `${DAY_PT[viewDate.getDay()]}, ${viewDate.getDate()} de ${MONTH_PT[viewDate.getMonth()]} de ${viewDate.getFullYear()}`
    }
    if (mode==='semana') {
      const mon = weekMon(viewDate)
      const fri = addDays(mon, 4)
      return `${mon.getDate()}–${fri.getDate()} de ${MONTH_PT[mon.getMonth()]} de ${mon.getFullYear()}`
    }
    if (mode==='mês') {
      return `${MONTH_PT[viewDate.getMonth()].charAt(0).toUpperCase()+MONTH_PT[viewDate.getMonth()].slice(1)} ${viewDate.getFullYear()}`
    }
    return `${viewDate.getFullYear()}`
  }

  function navigate(dir) {
    if (mode==='dia')    setViewDate(v => addDays(v, dir))
    if (mode==='semana') setViewDate(v => addDays(v, dir*7))
    if (mode==='mês')    setViewDate(v => addMonths(v, dir))
    if (mode==='ano')    setViewDate(v => addMonths(v, dir*12))
  }

  function goToday() { const t=new Date(); t.setHours(12,0,0,0); setViewDate(t) }

  const upcoming = meetings.filter(m => !m.canceled && m.date >= toYMD(todayDt))
  const canceled = meetings.filter(m => m.canceled)

  return (
    <div>
      <div style={{ fontSize:20, fontWeight:500, color:'#111', marginBottom:'.2rem' }}>Agenda</div>
      <div style={{ fontSize:12, color:'#888', marginBottom:'1rem' }}>
        {upcoming.length} reunião(ões) futura(s)
        {canceled.length > 0 && <span style={{ marginLeft:10, color:'#A32D2D' }}>· {canceled.length} cancelada(s)</span>}
      </div>

      <CalNavBar label={navLabel()} onPrev={() => navigate(-1)} onNext={() => navigate(1)} onToday={goToday} mode={mode} setMode={setMode} />

      {mode==='dia'    && <AgendaDia    meetings={meetings} viewDate={viewDate} onToggle={onToggle} />}
      {mode==='semana' && <AgendaSemana meetings={meetings} viewDate={viewDate} onToggle={onToggle} />}
      {mode==='mês'    && <AgendaMes    meetings={meetings} viewDate={viewDate} onToggle={onToggle}
                            onDrillDay={dt => { setViewDate(dt); setMode('dia') }} />}
      {mode==='ano'    && <AgendaAno    meetings={meetings} viewDate={viewDate} onToggle={onToggle}
                            onDrillMonth={dt => { setViewDate(dt); setMode('mês') }} />}
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────
function Dashboard({ meetings, processes }) {
  const today    = new Date(); today.setHours(12,0,0,0)
  const todayYMD = toYMD(today)
  const upcoming = meetings.filter(m => !m.canceled && m.date >= todayYMD)
    .sort((a,b) => a.date.localeCompare(b.date)||a.sh-b.sh).slice(0,5)
  const canceled = meetings.filter(m => m.canceled)
  const total    = processes.length
  const done     = processes.filter(p => p.confirmed).length
  const avgPct   = total ? Math.round(processes.map(getPct).reduce((a,b)=>a+b,0)/total) : 0

  return (
    <div>
      <div style={{ fontSize:20, fontWeight:500, color:'#111', marginBottom:'.2rem' }}>Dashboard</div>
      <div style={{ fontSize:12, color:'#888', marginBottom:'1.25rem' }}>Visão geral do projeto DF Turismo</div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'.75rem', marginBottom:'1.25rem' }}>
        {[
          ['Sprint 04','Mapeamento Core',BRAND,'📌'],
          [`${avgPct}%`,`${done}/${total} processos concluídos`, avgPct>=70?BRAND_MID:ACCENT,'🗂'],
          [`${meetings.filter(m=>!m.canceled).length}`,'Reuniões confirmadas','#2D8A6F','✅'],
          [canceled.length||'0', canceled.length?`${canceled.length} cancelada(s)`:'Nenhuma cancelada', canceled.length?'#A32D2D':'#888','⚠️'],
        ].map(([val,lbl,clr,ico]) => (
          <div key={lbl} style={{ background:'#fff', border:'0.5px solid #e2e8e4', borderRadius:12, padding:'.9rem 1rem', display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:22 }}>{ico}</span>
            <div>
              <div style={{ fontSize:20, fontWeight:600, color:clr }}>{val}</div>
              <div style={{ fontSize:10, color:'#888', marginTop:1 }}>{lbl}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:'#fff', border:'0.5px solid #e2e8e4', borderRadius:12, padding:'.9rem 1.1rem', marginBottom:'1.25rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
          <span style={{ fontSize:12, fontWeight:500, color:'#555' }}>Progresso geral dos processos</span>
          <span style={{ fontSize:13, fontWeight:600, color: avgPct>=70?BRAND_MID:ACCENT }}>{avgPct}%</span>
        </div>
        <div style={{ height:10, background:'#eee', borderRadius:99, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${avgPct}%`, background: avgPct>=70?BRAND_MID:ACCENT, borderRadius:99, transition:'width .5s' }} />
        </div>
      </div>

      <div style={{ background:'#fff', border:'0.5px solid #e2e8e4', borderRadius:12, overflow:'hidden' }}>
        <div style={{ padding:'.75rem 1rem', borderBottom:'0.5px solid #eee', fontSize:13, fontWeight:500, color:'#111' }}>📅 Próximas reuniões</div>
        {upcoming.length===0
          ? <div style={{ padding:'1.5rem', textAlign:'center', fontSize:12, color:'#bbb' }}>Nenhuma reunião futura agendada</div>
          : upcoming.map(m => {
            const c  = EV_COLORS[m.ci%5]
            const dt = fromYMD(m.date)
            const isToday = sameDay(dt, today)
            return (
              <div key={m.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'.65rem 1rem', borderBottom:'0.5px solid #f5f5f5' }}>
                <div style={{ width:34, textAlign:'center', flexShrink:0 }}>
                  <div style={{ fontSize:9, color:'#aaa' }}>{DAY_PT[dt.getDay()]}</div>
                  <div style={{ fontSize:16, fontWeight:600, color: isToday ? BRAND : '#333' }}>{dt.getDate()}</div>
                  <div style={{ fontSize:9, color:'#aaa' }}>{MONTH_SH[dt.getMonth()]}</div>
                </div>
                <div style={{ width:3, height:36, borderRadius:2, background:c.brd, flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:500, color:'#111', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.title}</div>
                  <div style={{ fontSize:10, color:'#888' }}>{p2(m.sh)}:{p2(m.sm)} – {p2(m.eh)}:{p2(m.em)} · {m.who}</div>
                </div>
                {isToday && <span style={{ fontSize:9, padding:'2px 7px', borderRadius:99, background:BRAND_LIGHT, color:BRAND, fontWeight:500 }}>Hoje</span>}
              </div>
            )
          })}
      </div>
    </div>
  )
}

// ─── Schedule form (inside ProcCard) ─────────────────────────
function ScheduleForm({ processName, defaultWho, onSave, onCancel }) {
  const todayYMD = toYMD(new Date())
  const [date,  setDate ] = useState(todayYMD)
  const [start, setStart] = useState('09:00')
  const [end,   setEnd  ] = useState('10:00')
  const [who,   setWho  ] = useState(defaultWho)

  const [sh,sm] = start.split(':').map(Number)
  const [eh,em] = end.split(':').map(Number)
  const validTime = eh*60+em > sh*60+sm
  const valid     = who.trim() && date && validTime

  const selDt    = date ? fromYMD(date) : null
  const dayLabel = selDt ? `${DAY_PT[selDt.getDay()]}, ${selDt.getDate()} de ${MONTH_PT[selDt.getMonth()]}` : ''

  return (
    <div style={{ marginTop:10, padding:'12px 14px', background:'#F0F7F3', border:`1px solid ${BRAND_BRD}`, borderRadius:10 }}>
      <div style={{ fontSize:11, fontWeight:500, color:BRAND, marginBottom:10 }}>
        📅 Agendar reunião — <span style={{ fontWeight:400, color:BRAND_MID }}>{processName}</span>
      </div>

      <div style={{ marginBottom:8 }}>
        <label style={labelSt}>
          Data {dayLabel && <span style={{ color:BRAND_MID, fontWeight:500 }}>· {dayLabel}</span>}
        </label>
        <input type="date" value={date} min={todayYMD} onChange={e => setDate(e.target.value)}
          style={{ ...inputSt, padding:'5px 8px' }} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
        <div>
          <label style={labelSt}>Início</label>
          <input type="time" value={start} onChange={e => setStart(e.target.value)} style={{ ...inputSt, padding:'5px 8px' }} />
        </div>
        <div>
          <label style={labelSt}>Término</label>
          <input type="time" value={end} onChange={e => setEnd(e.target.value)}
            style={{ ...inputSt, padding:'5px 8px', borderColor: !validTime&&end ? '#E24B4A' : '#ccc' }} />
          {!validTime && end && <div style={{ fontSize:9, color:'#E24B4A', marginTop:2 }}>Término após o início</div>}
        </div>
      </div>

      <div style={{ marginBottom:10 }}>
        <label style={labelSt}>Participante</label>
        <input value={who} onChange={e => setWho(e.target.value)} placeholder="Ex: Ana Lima"
          style={{ ...inputSt, padding:'5px 8px' }} />
      </div>

      <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
        <button onClick={onCancel} style={{ fontSize:11, padding:'5px 12px', border:'0.5px solid #ccc', borderRadius:6, cursor:'pointer', background:'#fff', color:'#666' }}>Cancelar</button>
        <button onClick={() => valid && onSave({ date, sh, sm, eh, em, who })} style={{
          fontSize:11, padding:'5px 14px', borderRadius:6, fontWeight:500,
          border:`0.5px solid ${valid ? BRAND : '#ccc'}`,
          background: valid ? BRAND : '#ccc', color:'#fff',
          cursor: valid ? 'pointer' : 'not-allowed',
        }}>✓ Adicionar à agenda</button>
      </div>
    </div>
  )
}

// ─── Process Edit Form ────────────────────────────────────────
function ProcEditForm({ data, onChange, onSave, onCancel, isNew }) {
  const ok = data.nome.trim() && data.comQuem.trim() && data.consultor.trim() && data.area.trim()
  return (
    <div style={{ background: isNew ? '#FAFCFA' : '#f8fbf9', border:`1.5px solid ${BRAND_BRD}`, borderRadius:12, padding:'1.1rem 1.2rem', marginBottom:'.6rem' }}>
      <div style={{ fontSize:13, fontWeight:500, color:BRAND, marginBottom:'1rem' }}>{isNew ? '＋ Novo processo' : '✏️ Editando processo'}</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={labelSt}>Nome do processo <span style={{ color:'#E24B4A' }}>*</span></label>
          <input style={inputSt} value={data.nome} placeholder="Ex: Gestão de Contratos" onChange={e => onChange({ ...data, nome:e.target.value })} />
        </div>
        <div>
          <label style={labelSt}>Área do processo <span style={{ color:'#E24B4A' }}>*</span></label>
          <input style={inputSt} value={data.area} placeholder="Ex: Comercial, RH" onChange={e => onChange({ ...data, area:e.target.value })} />
        </div>
        <div>
          <label style={labelSt}>Formato do processo</label>
          <select style={{ ...inputSt, cursor:'pointer' }} value={data.formato} onChange={e => onChange({ ...data, formato:e.target.value })}>
            {FORMATO_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label style={labelSt}>Ator responsável <span style={{ color:'#E24B4A' }}>*</span></label>
          <input style={inputSt} value={data.comQuem} placeholder="Ex: Gerência Comercial" onChange={e => onChange({ ...data, comQuem:e.target.value })} />
        </div>
        <div>
          <label style={labelSt}>Consultor responsável <span style={{ color:'#E24B4A' }}>*</span></label>
          <input style={inputSt} value={data.consultor} placeholder="Ex: Ana Lima" onChange={e => onChange({ ...data, consultor:e.target.value })} />
        </div>
      </div>
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
        <button onClick={onCancel} style={{ fontSize:12, padding:'6px 14px', border:'0.5px solid #ccc', borderRadius:7, cursor:'pointer', background:'#fff', color:'#666' }}>Cancelar</button>
        <button onClick={() => ok && onSave()} style={{
          fontSize:12, padding:'6px 16px', borderRadius:7, fontWeight:500,
          cursor: ok ? 'pointer' : 'not-allowed',
          border:`0.5px solid ${ok ? BRAND : '#ccc'}`,
          background: ok ? BRAND : '#ccc', color:'#fff',
        }}>{isNew ? '＋ Adicionar' : '✓ Salvar alterações'}</button>
      </div>
    </div>
  )
}

// ─── Delete Confirm ───────────────────────────────────────────
function DeleteConfirm({ nome, onConfirm, onCancel }) {
  return (
    <div style={{ background:'#FCEBEB', border:'0.5px solid #F7C1C1', borderRadius:12, padding:'1rem 1.2rem', marginBottom:'.6rem', display:'flex', alignItems:'center', gap:12 }}>
      <span style={{ fontSize:13, color:'#791F1F', flex:1 }}>Excluir <strong>"{nome}"</strong>? Esta ação não pode ser desfeita.</span>
      <button onClick={onCancel} style={{ fontSize:12, padding:'5px 12px', border:'0.5px solid #ccc', borderRadius:7, cursor:'pointer', background:'#fff', color:'#666' }}>Cancelar</button>
      <button onClick={onConfirm} style={{ fontSize:12, padding:'5px 14px', border:'0.5px solid #A32D2D', borderRadius:7, cursor:'pointer', background:'#A32D2D', color:'#fff', fontWeight:500 }}>🗑 Excluir</button>
    </div>
  )
}

// ─── Process Card ─────────────────────────────────────────────
function ProcCard({ p, onToggle, onConfirm, onEdit, onDelete, onAddMeeting }) {
  const [scheduling, setScheduling] = useState(false)
  const pct      = getPct(p)
  const ready    = pct===100 && !p.confirmed
  const barColor = pct===100 ? BRAND : pct>=70 ? BRAND_MID : pct>=40 ? ACCENT : '#E24B4A'
  const fmtShort = p.formato==='Fluxograma' ? 'Fluxograma' : 'POP'

  return (
    <div style={{ background:'#fff', border:`0.5px solid ${p.confirmed ? BRAND_BRD : '#e2e8e4'}`, borderRadius:12, padding:'1rem 1.1rem', marginBottom:'.6rem', boxShadow: p.confirmed ? `0 0 0 1px ${BRAND_BRD}` : 'none' }}>
      <div style={{ display:'grid', gridTemplateColumns:'28px 1fr auto', gap:10, alignItems:'start', marginBottom:'.85rem' }}>
        <div style={{ width:26, height:26, borderRadius:'50%', background: p.confirmed ? BRAND : '#f0f0f0', color: p.confirmed ? '#fff' : '#aaa', fontSize:10, fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center' }}>{p.num}</div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:500, color:'#111', lineHeight:1.3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.nome}</div>
          <div style={{ display:'flex', gap:5, marginTop:4, flexWrap:'wrap' }}>
            {p.area && <span style={{ fontSize:9, padding:'2px 7px', borderRadius:99, background:BRAND_LIGHT, color:BRAND_MID, fontWeight:500 }}>{p.area}</span>}
            {p.formato && <span style={{ fontSize:9, padding:'2px 7px', borderRadius:99, background:'#f0f0f0', color:'#777' }}>{fmtShort}</span>}
          </div>
          <div style={{ fontSize:11, color:'#888', marginTop:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>👤 {p.comQuem} · Consultor: {p.consultor}</div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:7 }}>
            <div style={{ flex:1, height:5, background:'#eee', borderRadius:99, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, background:barColor, borderRadius:99, transition:'width .4s' }} />
            </div>
            <span style={{ fontSize:12, fontWeight:600, color:barColor, flexShrink:0 }}>{pct}%</span>
            <span style={{ fontSize:10, color:'#bbb', flexShrink:0 }}>{STAGE_KEYS.filter(s=>p[s.key]).length}/{STAGE_KEYS.length}</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:5 }}>
          <button onClick={() => setScheduling(s => !s)} title="Agendar reunião" style={{ fontSize:11, padding:'4px 9px', borderRadius:6, cursor:'pointer', border: scheduling ? `0.5px solid ${BRAND_MID}` : '0.5px solid #d0d0d0', background: scheduling ? BRAND_LIGHT : '#fff', color: scheduling ? BRAND : '#555' }}>📅</button>
          {!p.confirmed && <button onClick={() => onEdit(p)} title="Editar" style={{ fontSize:11, padding:'4px 9px', border:'0.5px solid #d0d0d0', borderRadius:6, cursor:'pointer', background:'#fff', color:'#555' }}>✏️</button>}
          {!p.confirmed && <button onClick={() => onDelete(p.id)} title="Excluir" style={{ fontSize:11, padding:'4px 9px', border:'0.5px solid #f5c6c6', borderRadius:6, cursor:'pointer', background:'#fff', color:'#A32D2D' }}>🗑</button>}
          <button onClick={() => ready && onConfirm(p.id)} style={{
            fontSize:11, padding:'5px 11px', borderRadius:7, whiteSpace:'nowrap', cursor: ready ? 'pointer' : 'default',
            border: p.confirmed ? `0.5px solid ${BRAND_BRD}` : ready ? `0.5px solid ${BRAND}` : '0.5px solid #ddd',
            background: p.confirmed ? BRAND_LIGHT : ready ? BRAND : '#f8f8f8',
            color: p.confirmed ? BRAND_MID : ready ? '#fff' : '#ccc',
            fontWeight: ready ? 500 : 400,
          }}>{p.confirmed ? '🔒 Concluído' : ready ? '✓ Confirmar' : 'Pendente'}</button>
        </div>
      </div>
      <div style={{ overflowX:'auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:6, minWidth:490 }}>
          {STAGE_KEYS.map(({ key, label }) => {
            const checked = p[key]
            return (
              <div key={key} onClick={() => !p.confirmed && onToggle(p.id, key)} style={{
                borderRadius:8, padding:'8px 4px 6px', textAlign:'center', transition:'all .18s', userSelect:'none',
                background: checked ? BRAND : '#f8f8f8',
                border:`1.5px ${checked ? 'solid' : 'dashed'} ${checked ? BRAND_MID : '#d0d0d0'}`,
                cursor: p.confirmed ? 'default' : 'pointer',
              }}>
                <div style={{ width:22, height:22, borderRadius:'50%', margin:'0 auto 5px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, background: checked ? 'rgba(255,255,255,.2)' : '#ebebeb', border:`1.5px solid ${checked ? 'rgba(255,255,255,.4)' : '#d5d5d5'}`, color: checked ? '#fff' : '#ccc' }}>{checked ? '✓' : ''}</div>
                <div style={{ fontSize:9, fontWeight: checked ? 500 : 400, color: checked ? 'rgba(255,255,255,.9)' : '#aaa', lineHeight:1.3 }}>{label}</div>
              </div>
            )
          })}
        </div>
      </div>
      {scheduling && (
        <ScheduleForm
          processName={p.nome}
          defaultWho={p.comQuem}
          onSave={data => { onAddMeeting({ title:p.nome, ...data, ci:(p.id-1)%5 }); setScheduling(false) }}
          onCancel={() => setScheduling(false)}
        />
      )}
    </div>
  )
}

// ─── Processos tab ────────────────────────────────────────────
function Processos({ processes, onToggle, onConfirm, onAdd, onUpdate, onDelete, onAddMeeting }) {
  const [editingId, setEditingId]  = useState(null)
  const [editData,  setEditData]   = useState({})
  const [deletingId,setDeletingId] = useState(null)
  const [showAdd,   setShowAdd]    = useState(false)
  const [addData,   setAddData]    = useState({ nome:'', area:'', comQuem:'', consultor:'', formato:FORMATO_OPTS[0] })

  const total  = processes.length
  const done   = processes.filter(p => p.confirmed).length
  const avgPct = total ? Math.round(processes.map(getPct).reduce((a,b)=>a+b,0)/total) : 0
  const barClr = avgPct>=70 ? BRAND_MID : avgPct>=40 ? ACCENT : '#E24B4A'

  function startEdit(p){ setDeletingId(null); setShowAdd(false); setEditingId(p.id); setEditData({ nome:p.nome, area:p.area||'', comQuem:p.comQuem, consultor:p.consultor, formato:p.formato||FORMATO_OPTS[0] }) }
  function saveEdit()  { onUpdate(editingId, editData); setEditingId(null) }
  function handleDel(id){ setEditingId(null); setDeletingId(id) }
  function saveAdd()   { onAdd(addData); setAddData({ nome:'', area:'', comQuem:'', consultor:'', formato:FORMATO_OPTS[0] }); setShowAdd(false) }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1.25rem' }}>
        <div style={{ fontSize:20, fontWeight:500, color:'#111' }}>Controle de Mapeamento de Processos</div>
        <button onClick={() => { setShowAdd(s=>!s); setEditingId(null); setDeletingId(null) }}
          style={{ fontSize:12, padding:'7px 15px', border:`0.5px solid ${BRAND}`, borderRadius:8, cursor:'pointer', background: showAdd ? '#f0f0f0' : BRAND, color: showAdd ? '#555' : '#fff', fontWeight:500, flexShrink:0, marginTop:2 }}>
          {showAdd ? '✕ Cancelar' : '＋ Novo processo'}
        </button>
      </div>

      {showAdd && <ProcEditForm data={addData} onChange={setAddData} onSave={saveAdd} onCancel={() => setShowAdd(false)} isNew />}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.75rem', marginBottom:'1rem' }}>
        {[['Total',total,'#111'],['Em andamento',processes.filter(p=>getPct(p)>0&&!p.confirmed).length,'#BA7517'],['Concluídos',done,BRAND_MID],['Progresso',`${avgPct}%`,BRAND]].map(([l,v,c]) => (
          <div key={l} style={{ background:'#fff', border:'0.5px solid #e2e8e4', borderRadius:10, padding:'.8rem 1rem' }}>
            <div style={{ fontSize:20, fontWeight:500, color:c }}>{v}</div>
            <div style={{ fontSize:10, color:'#888', marginTop:1 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'#fff', border:'0.5px solid #e2e8e4', borderRadius:10, padding:'.9rem 1.1rem', marginBottom:'1.1rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <span style={{ fontSize:12, fontWeight:500, color:'#555' }}>Progresso geral</span>
          <span style={{ fontSize:14, fontWeight:600, color:barClr }}>{avgPct}%</span>
        </div>
        <div style={{ height:10, background:'#eee', borderRadius:99, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${avgPct}%`, background:barClr, borderRadius:99, transition:'width .5s' }} />
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:'.75rem', fontSize:11, color:'#888', flexWrap:'wrap' }}>
        <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:14, height:14, borderRadius:4, background:BRAND, display:'inline-block' }} /> Etapa concluída</span>
        <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:14, height:14, borderRadius:4, border:'1.5px dashed #d0d0d0', display:'inline-block' }} /> Pendente</span>
        <span style={{ marginLeft:'auto', fontSize:10, color:'#ccc' }}>📅 agendar · ✏️ editar · 🗑 excluir</span>
      </div>

      {processes.map(p => {
        if (deletingId===p.id) return <DeleteConfirm key={p.id} nome={p.nome} onConfirm={() => { onDelete(p.id); setDeletingId(null) }} onCancel={() => setDeletingId(null)} />
        if (editingId===p.id)  return <ProcEditForm key={p.id} data={editData} onChange={setEditData} onSave={saveEdit} onCancel={() => setEditingId(null)} isNew={false} />
        return <ProcCard key={p.id} p={p} onToggle={onToggle} onConfirm={onConfirm} onEdit={startEdit} onDelete={handleDel} onAddMeeting={onAddMeeting} />
      })}
    </div>
  )
}

// ─── App root ─────────────────────────────────────────────────
export default function App() {
  const [tab,       setTab]       = useState('dashboard')
  const [meetings,  setMeetings]  = useState(initMeetings)
  const [processes, setProcesses] = useState(initProcesses)

  const handleMeetingToggle = id => setMeetings(ms => ms.map(m => m.id===id ? {...m, canceled:!m.canceled} : m))
  const handleProcToggle    = (id,key) => setProcesses(ps => ps.map(p => p.id===id && !p.confirmed ? {...p, [key]:!p[key]} : p))
  const handleConfirm       = id => setProcesses(ps => ps.map(p => p.id===id && getPct(p)===100 ? {...p, confirmed:true} : p))
  const handleDelete        = id => setProcesses(ps => ps.filter(p => p.id!==id))
  const handleUpdate        = (id,data) => setProcesses(ps => ps.map(p => p.id===id ? {...p,...data} : p))
  const handleAdd           = data => {
    const newNum = processes.length ? Math.max(...processes.map(p=>p.num))+1 : 1
    setProcesses(ps => [...ps, { ...emptyStages, id:nextProcId++, num:newNum, confirmed:false, ...data }])
  }
  const handleAddMeeting    = data => {
    setMeetings(ms => [...ms, { id:nextMeetingId++, canceled:false, ...data }])
    setTab('agenda')
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f0f2f0' }}>
      <Sidebar tab={tab} setTab={setTab} />
      <main style={{ flex:1, padding:'1.5rem', overflowY:'auto', minWidth:0 }}>
        {tab==='dashboard' && <Dashboard meetings={meetings} processes={processes} />}
        {tab==='agenda'    && <Agenda meetings={meetings} onToggle={handleMeetingToggle} />}
        {tab==='processos' && <Processos processes={processes} onToggle={handleProcToggle} onConfirm={handleConfirm} onAdd={handleAdd} onUpdate={handleUpdate} onDelete={handleDelete} onAddMeeting={handleAddMeeting} />}
      </main>
    </div>
  )
}
