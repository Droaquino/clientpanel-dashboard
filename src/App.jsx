import { useState } from 'react'
import './index.css'

const BRAND = '#163828'
const BRAND_MID = '#2D6A4F'
const BRAND_LIGHT = '#EBF4EF'
const BRAND_BORDER = '#A8D0B8'
const ACCENT = '#D4AC3A'
const ACCENT_LIGHT = '#FBF4DE'

// ─── Calendar config ────────────────────────────────────────
const HOUR_H = 58
const DAY_START = 8
const DAY_END = 19
const HOURS = Array.from({ length: DAY_END - DAY_START }, (_, i) => i + DAY_START)
const DAYS_HEADER = [
  { short: 'Seg', full: 'Segunda', date: '23/06' },
  { short: 'Ter', full: 'Terça',   date: '24/06' },
  { short: 'Qua', full: 'Quarta',  date: '25/06' },
  { short: 'Qui', full: 'Quinta',  date: '26/06' },
  { short: 'Sex', full: 'Sexta',   date: '27/06' },
]
const EV_COLORS = [
  { bg: '#E6F1FB', border: '#378ADD', text: '#0C447C' },
  { bg: BRAND_LIGHT, border: BRAND_MID, text: BRAND },
  { bg: ACCENT_LIGHT, border: '#BA7517', text: '#7A5F10' },
  { bg: '#FBEAF0', border: '#D4537E', text: '#72243E' },
  { bg: '#EAF3DE', border: '#639922', text: '#173404' },
]

// ─── Stages — mirror spreadsheet "Mapeamentos" columns ──────
const STAGES = [
  { label: 'Coleta',         col: 'coletado'   },
  { label: 'Modelagem',      col: 'modelado'   },
  { label: 'Val. COPS',      col: 'valCOPS'    },
  { label: 'Val. Cliente',   col: 'valCliente' },
  { label: 'Análise Crítica',col: 'analise'    },
]

// ─── Seed data ───────────────────────────────────────────────
const initMeetings = [
  { id:1, title:'Kick-off do Sprint',     who:'Pedro + Equipe',     day:0, sh:9,  sm:0,  eh:10, em:0,  ci:0, canceled:false },
  { id:2, title:'Review de Requisitos',   who:'Coordenação',        day:1, sh:14, sm:0,  eh:15, em:0,  ci:1, canceled:false },
  { id:3, title:'Alinhamento Cliente',    who:'Grupo DF Turismo',   day:2, sh:10, sm:30, eh:11, em:30, ci:2, canceled:false },
  { id:4, title:'Coleta — Proc. Financ.', who:'Beatriz S.',         day:2, sh:14, sm:0,  eh:15, em:30, ci:3, canceled:false },
  { id:5, title:'Sync Técnico',           who:'Equipe Interna',     day:3, sh:16, sm:0,  eh:16, em:45, ci:4, canceled:false },
  { id:6, title:'Validação COPS',         who:'Coordenação',        day:3, sh:9,  sm:0,  eh:10, em:0,  ci:1, canceled:false },
  { id:7, title:'Sprint Retrospectiva',   who:'All Hands',          day:4, sh:11, sm:0,  eh:12, em:0,  ci:0, canceled:false },
]

// Processes reflect the Mapeamentos sheet of "_Controle de Processos _ DF Turismo .xlsx"
// Columns: Num | Nome | Com Quem coletar | Consultor | Coletado | Modelado |
//          Validado COPS | Val.Corr.COPS | Está no Drive | Validado Cliente |
//          Val.Corr.Cliente | Precisa To Be | Modelado ToBe | ToBe Valid.COPS | Enviado PDF
const initProcesses = [
  { id:1, num:1,  nome:'Emissão de Pacotes Turísticos', comQuem:'Gerência Comercial',       consultor:'Ana Lima',  stage:3, confirmed:false, emDrive:true,  corrigidoCOPS:false, precisaToBe:true,  modeladoToBe:false, enviado:false },
  { id:2, num:2,  nome:'Atendimento e Reservas',         comQuem:'Central de Atendimento',  consultor:'Carlos M.', stage:5, confirmed:false, emDrive:true,  corrigidoCOPS:true,  precisaToBe:false, modeladoToBe:false, enviado:false },
  { id:3, num:3,  nome:'Controle Financeiro',            comQuem:'Beatriz S. — Financeiro', consultor:'Ana Lima',  stage:1, confirmed:false, emDrive:false, corrigidoCOPS:false, precisaToBe:true,  modeladoToBe:false, enviado:false },
  { id:4, num:4,  nome:'Gestão de Fornecedores',         comQuem:'Rodrigo T. — Compras',    consultor:'Carlos M.', stage:2, confirmed:false, emDrive:false, corrigidoCOPS:false, precisaToBe:false, modeladoToBe:false, enviado:false },
  { id:5, num:5,  nome:'Recrutamento & Seleção',         comQuem:'Mariana L. — RH',         consultor:'Ana Lima',  stage:0, confirmed:false, emDrive:false, corrigidoCOPS:false, precisaToBe:false, modeladoToBe:false, enviado:false },
  { id:6, num:6,  nome:'Marketing Digital',              comQuem:'Felipe A. — Marketing',   consultor:'Carlos M.', stage:4, confirmed:false, emDrive:true,  corrigidoCOPS:true,  precisaToBe:true,  modeladoToBe:true,  enviado:false },
  { id:7, num:7,  nome:'Controle de Vendas',             comQuem:'Sofia R. — Comercial',    consultor:'Ana Lima',  stage:5, confirmed:true,  emDrive:true,  corrigidoCOPS:true,  precisaToBe:false, modeladoToBe:false, enviado:true  },
  { id:8, num:8,  nome:'Onboarding de Colaboradores',    comQuem:'Mariana L. — RH',         consultor:'Carlos M.', stage:2, confirmed:false, emDrive:false, corrigidoCOPS:false, precisaToBe:false, modeladoToBe:false, enviado:false },
  { id:9, num:9,  nome:'Gestão de Transportes',          comQuem:'ainda vamos ver',         consultor:'Ana Lima',  stage:0, confirmed:false, emDrive:false, corrigidoCOPS:false, precisaToBe:false, modeladoToBe:false, enviado:false },
  { id:10,num:10, nome:'Relatórios Gerenciais',          comQuem:'Gerência Geral',          consultor:'Carlos M.', stage:3, confirmed:false, emDrive:true,  corrigidoCOPS:false, precisaToBe:false, modeladoToBe:false, enviado:false },
]

// ─── Helpers ─────────────────────────────────────────────────
const evTop = (sh, sm) => ((sh - DAY_START) + sm / 60) * HOUR_H
const evHeight = (sh, sm, eh, em) => ((eh - sh) + (em - sm) / 60) * HOUR_H
const fmt2 = n => String(n).padStart(2, '0')

function stageOf(p) {
  // derive current stage index from boolean flags (matches spreadsheet logic)
  return p.stage
}

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
        <div key={id}
          onClick={() => setTab(id)}
          style={{
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

// ─── Google-Calendar-style week grid ─────────────────────────
function WeekCalendar({ meetings, onCancel }) {
  const [hovered, setHovered] = useState(null)
  const canceled = meetings.filter(m => m.canceled)
  const confirmed = meetings.filter(m => !m.canceled).length
  const totalH = HOURS.length * HOUR_H

  return (
    <div>
      {/* Alert */}
      <div style={{
        background: canceled.length ? '#FCEBEB' : BRAND_LIGHT,
        border: `0.5px solid ${canceled.length ? '#F7C1C1' : BRAND_BORDER}`,
        borderRadius:12, padding:'.8rem 1.1rem', marginBottom:'1rem',
      }}>
        <div style={{ fontSize:12, fontWeight:500, color: canceled.length ? '#A32D2D' : '#0D2519', display:'flex', alignItems:'center', gap:6, marginBottom: canceled.length ? '.4rem' : 0 }}>
          {canceled.length ? '⚠️ Reuniões canceladas esta semana' : '✅ Nenhuma reunião cancelada esta semana'}
        </div>
        {canceled.length > 0 && canceled.map(m => (
          <div key={m.id} style={{ fontSize:12, color:'#A32D2D', display:'flex', alignItems:'center', gap:6, padding:'2px 0' }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'#E24B4A', display:'inline-block', flexShrink:0 }} />
            <strong>{m.title}</strong> — {DAYS_HEADER[m.day].short}, {fmt2(m.sh)}:{fmt2(m.sm)}h &nbsp;({m.who})
          </div>
        ))}
        {!canceled.length && <div style={{ fontSize:12, color:BRAND_MID }}>Todos os compromissos confirmados.</div>}
      </div>

      {/* Sprint summary strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.6rem', marginBottom:'1rem' }}>
        {[
          ['Sprint 04', 'Mapeamento Core', BRAND],
          ['68%', 'Concluído', BRAND_MID],
          [`${confirmed}`, 'Reuniões confirmadas', '#2D8A6F'],
          ['3', 'Dias restantes', '#BA7517'],
        ].map(([v, l, c]) => (
          <div key={l} style={{ background:'#fff', border:'0.5px solid #e2e8e4', borderRadius:10, padding:'.65rem 1rem' }}>
            <div style={{ fontSize: v.length > 5 ? 13 : 18, fontWeight:500, color:c }}>{v}</div>
            <div style={{ fontSize:10, color:'#888', marginTop:1 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ background:'#fff', border:'0.5px solid #e2e8e4', borderRadius:12, overflow:'hidden' }}>
        {/* Header row */}
        <div style={{ display:'flex', borderBottom:'0.5px solid #e2e8e4' }}>
          <div style={{ width:52, flexShrink:0 }} />
          {DAYS_HEADER.map((d, i) => {
            const hasEvent = meetings.some(m => m.day === i && !m.canceled)
            return (
              <div key={i} style={{
                flex:1, padding:'.6rem .5rem', textAlign:'center',
                borderLeft:'0.5px solid #e2e8e4',
                background: i === 2 ? BRAND_LIGHT : 'transparent',
              }}>
                <div style={{ fontSize:11, color:'#888' }}>{d.short}</div>
                <div style={{ fontSize:14, fontWeight: hasEvent ? 500 : 400, color: i===2 ? BRAND : '#111', marginTop:1 }}>{d.date}</div>
              </div>
            )
          })}
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY:'auto', maxHeight:520 }}>
          <div style={{ display:'flex', position:'relative' }}>
            {/* Hour labels */}
            <div style={{ width:52, flexShrink:0, position:'relative', height:totalH }}>
              {HOURS.map(h => (
                <div key={h} style={{
                  position:'absolute', top: (h - DAY_START) * HOUR_H - 8,
                  right:8, fontSize:10, color:'#aaa', userSelect:'none',
                }}>
                  {fmt2(h)}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {DAYS_HEADER.map((d, dayIdx) => (
              <div key={dayIdx} style={{
                flex:1, borderLeft:'0.5px solid #e2e8e4', position:'relative', height:totalH,
                background: dayIdx === 2 ? '#FAFCFA' : 'transparent',
              }}>
                {/* Hour grid lines */}
                {HOURS.map(h => (
                  <div key={h} style={{
                    position:'absolute', top:(h - DAY_START) * HOUR_H, left:0, right:0,
                    borderTop: h === DAY_START ? 'none' : '0.5px solid #f0f0f0',
                    height:HOUR_H,
                  }} />
                ))}

                {/* Events */}
                {meetings
                  .filter(m => m.day === dayIdx)
                  .map(m => {
                    const c = EV_COLORS[m.ci % EV_COLORS.length]
                    const top = evTop(m.sh, m.sm)
                    const height = Math.max(evHeight(m.sh, m.sm, m.eh, m.em), 28)
                    const isHov = hovered === m.id
                    return (
                      <div
                        key={m.id}
                        onMouseEnter={() => setHovered(m.id)}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                          position:'absolute',
                          top: top + 2,
                          left: 3,
                          right: 3,
                          height: height - 4,
                          background: m.canceled ? '#f5f5f5' : c.bg,
                          border: `1px solid ${m.canceled ? '#ddd' : c.border}`,
                          borderRadius:6,
                          padding:'3px 6px',
                          cursor:'pointer',
                          overflow:'hidden',
                          opacity: m.canceled ? .5 : 1,
                          zIndex: isHov ? 10 : 1,
                          transition:'box-shadow .1s',
                          boxShadow: isHov ? '0 2px 8px rgba(0,0,0,.12)' : 'none',
                        }}
                        onClick={() => onCancel(m.id)}
                        title={m.canceled ? 'Clique para reativar' : 'Clique para cancelar'}
                      >
                        <div style={{ fontSize:11, fontWeight:500, color: m.canceled ? '#aaa' : c.text, lineHeight:1.2, textDecoration: m.canceled ? 'line-through' : 'none', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {m.title}
                        </div>
                        {height > 36 && (
                          <div style={{ fontSize:10, color: m.canceled ? '#bbb' : c.border, marginTop:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                            {fmt2(m.sh)}:{fmt2(m.sm)}–{fmt2(m.eh)}:{fmt2(m.em)} · {m.who}
                          </div>
                        )}
                        {m.canceled && height > 24 && (
                          <div style={{ fontSize:9, color:'#A32D2D', fontWeight:500, marginTop:1 }}>CANCELADO</div>
                        )}
                      </div>
                    )
                  })}
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding:'.5rem 1rem', borderTop:'0.5px solid #eee', fontSize:11, color:'#aaa' }}>
          Clique em um evento para cancelar · Clique novamente para reativar
        </div>
      </div>
    </div>
  )
}

// ─── Process row ─────────────────────────────────────────────
function ProcRow({ p, onAdvance, onConfirm, onToggle }) {
  const chipType = p.confirmed ? 'done' : p.stage === 0 ? 'pending' : 'prog'
  const chipMap = {
    done:    { bg:BRAND_LIGHT, color:BRAND_MID, label:'✓ Concluído' },
    pending: { bg:'#f0f0f0',   color:'#888',    label:'Não iniciado' },
    prog:    { bg:ACCENT_LIGHT,color:'#7A5F10', label:`Etapa ${p.stage}/5` },
  }
  const chip = chipMap[chipType]
  const confirmState = p.confirmed ? 'locked' : p.stage === 5 ? 'ready' : 'disabled'

  const extras = [
    { key:'emDrive',      label:'Drive',    icon:'💾' },
    { key:'corrigidoCOPS',label:'Corr.COPS',icon:'✏️' },
    { key:'precisaToBe',  label:'To Be',    icon:'🔄' },
    { key:'modeladoToBe', label:'Mod.ToBe', icon:'📐' },
    { key:'enviado',      label:'PDF',      icon:'📄' },
  ]

  return (
    <div style={{ background:'#fff', border:'0.5px solid #e2e8e4', borderRadius:8, padding:'.7rem .75rem', marginBottom:'.45rem', display:'grid', gridTemplateColumns:'24px 1.8fr 1.2fr auto 1fr 72px', gap:6, alignItems:'center' }}>
      {/* Num */}
      <div style={{ fontSize:11, color:'#aaa', textAlign:'center', fontWeight:500 }}>{p.num}</div>

      {/* Nome + status chip */}
      <div>
        <div style={{ fontSize:13, fontWeight:500, color:'#111' }}>{p.nome}</div>
        <div style={{ marginTop:3, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
          <span style={{ fontSize:10, padding:'2px 7px', borderRadius:99, fontWeight:500, background:chip.bg, color:chip.color }}>{chip.label}</span>
        </div>
      </div>

      {/* Com Quem / Consultor */}
      <div>
        <div style={{ fontSize:11, color:'#555', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>👤 {p.comQuem}</div>
        <div style={{ fontSize:10, color:'#aaa', marginTop:2 }}>Consultor: {p.consultor}</div>
      </div>

      {/* Stage dots */}
      <div style={{ display:'flex', gap:3, alignItems:'center' }}>
        {STAGES.map((st, i) => {
          const sn = i + 1
          const done = p.stage >= sn
          const isNext = !p.confirmed && p.stage === i
          return (
            <div
              key={i}
              title={st.label}
              onClick={() => isNext && onAdvance(p.id)}
              style={{
                width:22, height:22, borderRadius:'50%',
                border: done ? `1.5px solid ${BRAND}` : isNext ? `1.5px dashed ${BRAND_MID}` : '1.5px solid #ddd',
                background: done ? BRAND : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor: isNext ? 'pointer' : 'default',
                fontSize:9, color: done ? '#fff' : isNext ? BRAND_MID : '#ccc',
                flexShrink:0,
              }}
            >
              {done ? '✓' : sn}
            </div>
          )
        })}
      </div>

      {/* Extra flags — map directly to spreadsheet columns */}
      <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
        {extras.map(({ key, label, icon }) => (
          <div
            key={key}
            title={label}
            onClick={() => !p.confirmed && onToggle(p.id, key)}
            style={{
              fontSize:8, padding:'2px 4px', borderRadius:4, cursor: p.confirmed ? 'default' : 'pointer',
              background: p[key] ? BRAND_LIGHT : '#f5f5f5',
              color: p[key] ? BRAND_MID : '#bbb',
              border: `0.5px solid ${p[key] ? BRAND_BORDER : '#e0e0e0'}`,
              fontWeight: p[key] ? 500 : 400,
              userSelect:'none', whiteSpace:'nowrap',
            }}
          >
            {icon} {label}
          </div>
        ))}
      </div>

      {/* Confirm button */}
      <div style={{ textAlign:'center' }}>
        <button
          onClick={() => confirmState === 'ready' && onConfirm(p.id)}
          style={{
            fontSize:11, padding:'5px 10px', borderRadius:7, whiteSpace:'nowrap',
            cursor: confirmState === 'ready' ? 'pointer' : 'default',
            border: confirmState === 'locked' ? `0.5px solid ${BRAND_BORDER}` : confirmState === 'ready' ? `0.5px solid ${BRAND}` : '0.5px solid #ddd',
            background: confirmState === 'locked' ? BRAND_LIGHT : confirmState === 'ready' ? BRAND : '#f5f5f5',
            color: confirmState === 'locked' ? BRAND_MID : confirmState === 'ready' ? '#fff' : '#ccc',
            fontWeight: confirmState === 'ready' ? 500 : 400,
          }}
        >
          {p.confirmed ? '🔒 Bloqueado' : p.stage === 5 ? '✓ Confirmar' : `${p.stage}/5`}
        </button>
      </div>
    </div>
  )
}

// ─── Processos tab ───────────────────────────────────────────
function Processos({ processes, onAdvance, onConfirm, onToggle }) {
  const total = processes.length
  const done = processes.filter(p => p.confirmed).length
  const inProg = processes.filter(p => p.stage > 0 && !p.confirmed).length
  const pct = Math.round((done / total) * 100)

  return (
    <div>
      <div style={{ fontSize:20, fontWeight:500, color:'#111', marginBottom:2 }}>Controle de Mapeamento de Processos</div>
      <div style={{ fontSize:12, color:'#888', marginBottom:'1.25rem' }}>
        Fonte: <em>_Controle de Processos _ DF Turismo.xlsx</em> — Aba Mapeamentos
      </div>

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.75rem', marginBottom:'1rem' }}>
        {[
          ['Total', total, '#111'],
          ['Em andamento', inProg, '#BA7517'],
          ['Concluídos', done, BRAND_MID],
          [`${pct}%`, 'Conclusão geral', BRAND],
        ].map(([v, l, c]) => (
          <div key={l} style={{ background:'#fff', border:'0.5px solid #e2e8e4', borderRadius:10, padding:'.8rem 1rem' }}>
            <div style={{ fontSize:20, fontWeight:500, color:c }}>{v}</div>
            <div style={{ fontSize:10, color:'#888', marginTop:1 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      <div style={{ background:'#fff', border:'0.5px solid #e2e8e4', borderRadius:10, padding:'.8rem 1.1rem', marginBottom:'1rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#888', marginBottom:5 }}>
          <span>Progresso geral do projeto</span>
          <span style={{ color:BRAND_MID, fontWeight:500 }}>{pct}%</span>
        </div>
        <div style={{ height:7, background:'#eee', borderRadius:99, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${pct}%`, background:BRAND, borderRadius:99, transition:'width .5s' }} />
        </div>
      </div>

      {/* Header */}
      <div style={{ background:'#fff', border:'0.5px solid #e2e8e4', borderRadius:12, padding:'1rem', overflowX:'auto' }}>
      <div style={{ minWidth:680 }}>
        <div style={{ display:'grid', gridTemplateColumns:'24px 1.8fr 1.2fr auto 1fr 72px', gap:6, padding:'0 .75rem .6rem', fontSize:10, color:'#aaa', textTransform:'uppercase', letterSpacing:'.05em', borderBottom:'0.5px solid #eee', marginBottom:'.5rem' }}>
          <span>Nº</span>
          <span>Processo</span>
          <span>Com Quem / Consultor</span>
          <span>Estágios — clique para avançar</span>
          <span>Flags da planilha</span>
          <span style={{ textAlign:'center' }}>Ação</span>
        </div>

        {/* Legend */}
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:'.75rem', paddingLeft:'.75rem' }}>
          {[
            { dot: BRAND, border: BRAND, label:'Etapa concluída' },
            { dot:'transparent', border:BRAND_MID, dashed:true, label:'Próxima etapa (clique)' },
            { dot:'transparent', border:'#ddd', label:'Pendente' },
          ].map(({ dot, border, dashed, label }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#888' }}>
              <div style={{ width:12, height:12, borderRadius:'50%', background:dot, border:`1.5px ${dashed?'dashed':'solid'} ${border}` }} />
              {label}
            </div>
          ))}
          <div style={{ marginLeft:'auto', fontSize:10, color:'#bbb' }}>
            Flags: clique para marcar/desmarcar
          </div>
        </div>

        {processes.map(p => (
          <ProcRow
            key={p.id}
            p={p}
            onAdvance={onAdvance}
            onConfirm={onConfirm}
            onToggle={onToggle}
          />
        ))}
      </div>{/* minWidth wrapper */}
      </div>{/* outer card */}
    </div>
  )
}

// ─── App root ────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [meetings, setMeetings] = useState(initMeetings)
  const [processes, setProcesses] = useState(initProcesses)

  const handleCancel  = id => setMeetings(ms => ms.map(m => m.id === id ? { ...m, canceled: !m.canceled } : m))
  const handleAdvance = id => setProcesses(ps => ps.map(p => p.id === id && p.stage < 5 && !p.confirmed ? { ...p, stage: p.stage + 1 } : p))
  const handleConfirm = id => setProcesses(ps => ps.map(p => p.id === id && p.stage === 5 ? { ...p, confirmed: true } : p))
  const handleToggle  = (id, key) => setProcesses(ps => ps.map(p => p.id === id ? { ...p, [key]: !p[key] } : p))

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f0f2f0' }}>
      <Sidebar tab={tab} setTab={setTab} />
      <main style={{ flex:1, padding:'1.5rem', overflowY:'auto', minWidth:0 }}>
        {tab === 'dashboard'
          ? <WeekCalendar meetings={meetings} onCancel={handleCancel} />
          : <Processos processes={processes} onAdvance={handleAdvance} onConfirm={handleConfirm} onToggle={handleToggle} />
        }
      </main>
    </div>
  )
}
