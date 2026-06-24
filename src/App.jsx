import { useState } from 'react'
import './index.css'

const BRAND = '#163828'
const BRAND_MID = '#2D6A4F'
const BRAND_LIGHT = '#EBF4EF'
const BRAND_BORDER = '#A8D0B8'
const ACCENT = '#D4AC3A'
const ACCENT_LIGHT = '#FBF4DE'

const STAGES = ['Coleta', 'Modelagem', 'Val. Coordenador', 'Val. Cliente', 'Análise Crítica']

const initialMeetings = [
  { id: 1, title: 'Kick-off do Sprint', who: 'Pedro + Equipe', time: 'Seg, 09:00', canceled: false },
  { id: 2, title: 'Review de Requisitos', who: 'Coordenação', time: 'Ter, 14:00', canceled: false },
  { id: 3, title: 'Alinhamento Cliente', who: 'Grupo Arbrent', time: 'Qua, 10:30', canceled: false },
  { id: 4, title: 'Sync Técnico', who: 'Equipe Interna', time: 'Qui, 16:00', canceled: false },
  { id: 5, title: 'Sprint Retrospectiva', who: 'All Hands', time: 'Sex, 11:00', canceled: false },
]

const initialProcesses = [
  { id: 1, name: 'Onboarding de Colaboradores', owner: 'RH — Ana Lima', stage: 3, confirmed: false },
  { id: 2, name: 'Aprovação de Compras', owner: 'Financeiro — Carlos M.', stage: 5, confirmed: false },
  { id: 3, name: 'Gestão de Contratos', owner: 'Jurídico — Beatriz S.', stage: 1, confirmed: false },
  { id: 4, name: 'Suporte ao Cliente', owner: 'CS — Rodrigo T.', stage: 2, confirmed: false },
  { id: 5, name: 'Recrutamento & Seleção', owner: 'RH — Ana Lima', stage: 0, confirmed: false },
  { id: 6, name: 'Relatórios Financeiros', owner: 'Financeiro — Carlos M.', stage: 5, confirmed: true },
]

const s = {
  root: { display: 'flex', minHeight: '100vh', background: '#f0f2f0' },
  sidebar: { width: 210, flexShrink: 0, background: BRAND, display: 'flex', flexDirection: 'column', padding: '1.25rem 0' },
  logoWrap: { padding: '0 1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,.1)', marginBottom: '.75rem' },
  logoMark: { display: 'flex', alignItems: 'center', gap: 10 },
  logoDot: { width: 32, height: 32, background: 'rgba(255,255,255,.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff' },
  logoText: { fontSize: 14, fontWeight: 500, color: '#fff', lineHeight: 1.2 },
  logoSub: { fontSize: 10, color: 'rgba(255,255,255,.5)' },
  navItem: (active) => ({
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 1rem', cursor: 'pointer',
    fontSize: 13, color: active ? '#fff' : 'rgba(255,255,255,.6)',
    borderLeft: `2.5px solid ${active ? ACCENT : 'transparent'}`,
    background: active ? 'rgba(255,255,255,.1)' : 'transparent',
    fontWeight: active ? 500 : 400, transition: 'all .15s',
  }),
  sideFooter: { marginTop: 'auto', padding: '1rem', borderTop: '1px solid rgba(255,255,255,.1)' },
  main: { flex: 1, padding: '1.5rem', overflowY: 'auto', minWidth: 0 },
  pageTitle: { fontSize: 20, fontWeight: 500, color: '#111', marginBottom: 2 },
  pageSub: { fontSize: 12, color: '#666', marginBottom: '1.25rem' },
  card: { background: '#fff', border: '0.5px solid #e2e8e4', borderRadius: 12, padding: '1rem 1.25rem' },
  cardLabel: { fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.6rem', display: 'flex', alignItems: 'center', gap: 6 },
  progTrack: { height: 7, background: '#eee', borderRadius: 99, overflow: 'hidden' },
  progFill: (pct) => ({ height: '100%', width: `${pct}%`, background: BRAND, borderRadius: 99, transition: 'width .4s' }),
  metricBox: { background: '#f5f7f5', borderRadius: 8, padding: '.6rem .75rem' },
  metricVal: (color) => ({ fontSize: 20, fontWeight: 500, color: color || '#111' }),
  metricLbl: { fontSize: 10, color: '#888', marginTop: 1 },
  badge: (type) => {
    const map = {
      ok: { background: BRAND_LIGHT, color: BRAND_MID },
      canceled: { background: '#FCEBEB', color: '#A32D2D' },
      today: { background: ACCENT_LIGHT, color: '#7A5F10' },
    }
    return { fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 500, whiteSpace: 'nowrap', ...(map[type] || {}) }
  },
  alertBox: (warn) => ({
    background: warn ? '#FCEBEB' : BRAND_LIGHT,
    border: `0.5px solid ${warn ? '#F7C1C1' : BRAND_BORDER}`,
    borderRadius: 12, padding: '.9rem 1.1rem', marginBottom: '1rem',
  }),
  alertTitle: (warn) => ({ fontSize: 12, fontWeight: 500, color: warn ? '#A32D2D' : '#0D2519', display: 'flex', alignItems: 'center', gap: 6, marginBottom: '.5rem' }),
  stageDot: (done, isNext) => ({
    width: 26, height: 26, borderRadius: '50%',
    border: done ? `1.5px solid ${BRAND}` : isNext ? `1.5px dashed ${BRAND_MID}` : '1.5px solid #ccc',
    background: done ? BRAND : 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: isNext ? 'pointer' : 'default',
    fontSize: 10, color: done ? '#fff' : isNext ? BRAND_MID : '#aaa',
    flexShrink: 0, transition: 'all .15s', position: 'relative',
  }),
  btnConfirm: (state) => {
    const base = { fontSize: 11, padding: '5px 10px', borderRadius: 8, cursor: 'default', whiteSpace: 'nowrap', transition: 'all .15s', border: '0.5px solid #ccc', background: '#f5f5f5', color: '#aaa' }
    if (state === 'ready') return { ...base, cursor: 'pointer', background: BRAND, borderColor: BRAND, color: '#fff', fontWeight: 500 }
    if (state === 'locked') return { ...base, background: BRAND_LIGHT, borderColor: BRAND_BORDER, color: BRAND_MID }
    return base
  },
  chip: (type) => {
    const map = {
      done: { background: BRAND_LIGHT, color: BRAND_MID },
      progress: { background: ACCENT_LIGHT, color: '#7A5F10' },
      pending: { background: '#f0f0f0', color: '#888' },
    }
    return { fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 3, ...(map[type] || {}) }
  },
}

function Sidebar({ tab, setTab }) {
  return (
    <nav style={s.sidebar}>
      <div style={s.logoWrap}>
        <div style={s.logoMark}>
          <div style={s.logoDot}>⊞</div>
          <div>
            <div style={s.logoText}>ClientPanel</div>
            <div style={s.logoSub}>Gestão de Projetos</div>
          </div>
        </div>
      </div>
      {[
        { id: 'dashboard', icon: '📅', label: 'Dashboard' },
        { id: 'processos', icon: '🗂', label: 'Processos' },
      ].map(({ id, icon, label }) => (
        <div key={id} style={s.navItem(tab === id)} onClick={() => setTab(id)}>
          <span>{icon}</span> {label}
        </div>
      ))}
      <div style={s.sideFooter}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#0D2519', fontWeight: 500 }}>GA</div>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.85)', fontWeight: 500 }}>Grupo Arbrent</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)' }}>cliente</div>
          </div>
        </div>
      </div>
    </nav>
  )
}

function Dashboard({ meetings, onCancel }) {
  const canceled = meetings.filter(m => m.canceled)
  const confirmed = meetings.filter(m => !m.canceled).length
  const sprintPct = 68

  return (
    <div>
      <div style={s.pageTitle}>Dashboard — Sprint & Agenda</div>
      <div style={s.pageSub}>Semana de 23 a 27 de Jun, 2026</div>

      <div style={s.alertBox(canceled.length > 0)}>
        <div style={s.alertTitle(canceled.length > 0)}>
          {canceled.length > 0 ? '⚠️' : '✅'}
          {canceled.length > 0 ? ' Notificação ao cliente — reuniões canceladas esta semana' : ' Nenhuma reunião cancelada esta semana'}
        </div>
        {canceled.length === 0
          ? <div style={{ fontSize: 12, color: BRAND_MID, opacity: .85 }}>Todos os compromissos estão confirmados.</div>
          : <ul style={{ listStyle: 'none' }}>
              {canceled.map(m => (
                <li key={m.id} style={{ fontSize: 12, color: '#A32D2D', padding: '3px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#E24B4A', flexShrink: 0, display: 'inline-block' }} />
                  <strong>{m.title}</strong> — {m.time} &nbsp;({m.who})
                </li>
              ))}
            </ul>
        }
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div style={s.card}>
          <div style={s.cardLabel}>🚀 Sprint atual</div>
          <div style={{ fontSize: 17, fontWeight: 500, color: '#111' }}>Sprint 04 — Mapeamento Core</div>
          <div style={{ fontSize: 12, color: '#888', margin: '.3rem 0 .8rem' }}>📅 16 Jun → 27 Jun 2026</div>
          <div style={s.progTrack}><div style={s.progFill(sprintPct)} /></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', marginTop: '.35rem' }}>
            <span>Dias restantes: 3</span>
            <span style={{ color: BRAND_MID, fontWeight: 500 }}>{sprintPct}% concluído</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: '.75rem' }}>
            <div style={s.metricBox}><div style={s.metricVal()}>12</div><div style={s.metricLbl}>Tarefas totais</div></div>
            <div style={s.metricBox}><div style={s.metricVal(BRAND_MID)}>8</div><div style={s.metricLbl}>Concluídas</div></div>
            <div style={s.metricBox}><div style={s.metricVal('#BA7517')}>4</div><div style={s.metricLbl}>Em aberto</div></div>
          </div>
        </div>

        <div style={s.card}>
          <div style={s.cardLabel}>📊 Velocidade do time</div>
          {[['Sprint 01', 85], ['Sprint 02', 72], ['Sprint 03', 91], ['Sprint 04', sprintPct]].map(([sp, v], i) => (
            <div key={sp} style={{ marginBottom: 9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', marginBottom: 3 }}>
                <span>{sp}</span><span style={{ fontWeight: 500, color: '#111' }}>{v}%</span>
              </div>
              <div style={s.progTrack}>
                <div style={{ ...s.progFill(v), opacity: i === 3 ? 1 : .45 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#111' }}>📆 Agenda da semana</div>
          <span style={s.badge('today')}>{confirmed} confirmadas</span>
        </div>
        {meetings.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid #eee', opacity: m.canceled ? .7 : 1 }}>
            <div style={{ fontSize: 11, color: '#888', minWidth: 72 }}>🕐 {m.time}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: m.canceled ? '#aaa' : '#111', textDecoration: m.canceled ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
              <div style={{ fontSize: 11, color: '#aaa' }}>👤 {m.who}</div>
            </div>
            <span style={s.badge(m.canceled ? 'canceled' : 'ok')}>{m.canceled ? '✕ Cancelado' : '✓ Confirmado'}</span>
            <button
              onClick={() => onCancel(m.id)}
              style={{ fontSize: 10, padding: '3px 8px', border: '0.5px solid #ccc', borderRadius: 6, cursor: 'pointer', background: 'transparent', color: '#888' }}
            >
              {m.canceled ? '↺ Reativar' : '⊘ Cancelar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function Processos({ processes, onAdvance, onConfirm }) {
  const total = processes.length
  const done = processes.filter(p => p.confirmed).length
  const inProg = processes.filter(p => p.stage > 0 && !p.confirmed).length

  return (
    <div>
      <div style={s.pageTitle}>Controle de Mapeamento de Processos</div>
      <div style={s.pageSub}>Avance cada processo pelos 5 estágios e confirme ao concluir</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.75rem', marginBottom: '1rem' }}>
        {[['Total', total, '#111'], ['Em andamento', inProg, '#BA7517'], ['Concluídos', done, BRAND_MID]].map(([l, v, c]) => (
          <div key={l} style={s.card}>
            <div style={s.metricVal(c)}>{v}</div>
            <div style={s.metricLbl}>{l}</div>
          </div>
        ))}
      </div>

      <div style={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap', marginBottom: '.75rem', fontSize: 11, color: '#888' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: BRAND, display: 'inline-block' }} /> Concluído</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: '50%', border: `1.5px dashed ${BRAND_MID}`, display: 'inline-block' }} /> Próximo</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px solid #ccc', display: 'inline-block' }} /> Pendente</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr auto 90px', gap: 8, padding: '0 .5rem .5rem', fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.05em' }}>
          <span>Processo</span><span>Responsável</span><span>Estágios</span><span style={{ textAlign: 'center' }}>Ação</span>
        </div>

        {processes.map(p => {
          const chipType = p.confirmed ? 'done' : p.stage === 0 ? 'pending' : 'progress'
          const chipLabel = p.confirmed ? '✓ Concluído' : p.stage === 0 ? 'Não iniciado' : `Estágio ${p.stage}/5`
          const confirmState = p.confirmed ? 'locked' : p.stage === 5 ? 'ready' : 'disabled'

          return (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr auto 90px', gap: 8, alignItems: 'center', background: '#fff', border: '0.5px solid #e2e8e4', borderRadius: 8, padding: '.75rem .5rem', marginBottom: '.5rem' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{p.name}</div>
                <div style={{ marginTop: 3 }}><span style={s.chip(chipType)}>{chipLabel}</span></div>
              </div>
              <div style={{ fontSize: 12, color: '#888' }}>👤 {p.owner}</div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {STAGES.map((stage, i) => {
                  const sn = i + 1
                  const isDone = p.stage >= sn
                  const isNext = !p.confirmed && p.stage === i
                  return (
                    <div
                      key={i}
                      title={stage}
                      style={s.stageDot(isDone, isNext)}
                      onClick={() => isNext && onAdvance(p.id)}
                    >
                      {isDone ? '✓' : sn}
                    </div>
                  )
                })}
              </div>
              <div style={{ textAlign: 'center' }}>
                <button
                  style={s.btnConfirm(confirmState)}
                  onClick={() => confirmState === 'ready' && onConfirm(p.id)}
                >
                  {p.confirmed ? '🔒 Bloqueado' : p.stage === 5 ? '✓ Confirmar' : `${p.stage}/5`}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [meetings, setMeetings] = useState(initialMeetings)
  const [processes, setProcesses] = useState(initialProcesses)

  const handleCancel = (id) => setMeetings(ms => ms.map(m => m.id === id ? { ...m, canceled: !m.canceled } : m))
  const handleAdvance = (id) => setProcesses(ps => ps.map(p => p.id === id && p.stage < 5 ? { ...p, stage: p.stage + 1 } : p))
  const handleConfirm = (id) => setProcesses(ps => ps.map(p => p.id === id && p.stage === 5 ? { ...p, confirmed: true } : p))

  return (
    <div style={s.root}>
      <Sidebar tab={tab} setTab={setTab} />
      <main style={s.main}>
        {tab === 'dashboard'
          ? <Dashboard meetings={meetings} onCancel={handleCancel} />
          : <Processos processes={processes} onAdvance={handleAdvance} onConfirm={handleConfirm} />
        }
      </main>
    </div>
  )
}
