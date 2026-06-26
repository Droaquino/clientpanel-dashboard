import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// ─── Solicitações ─────────────────────────────────────────────
export async function dbGetSolicitacoes() {
  const { data } = await supabase.from('solicitacoes').select('*').order('created_at', { ascending: false })
  return data || []
}

export async function dbAddSolicitacao(item) {
  const { data } = await supabase.from('solicitacoes').insert([{
    nome: item.nome, email: item.email, telefone: item.telefone,
    grupo: item.grupo, role: item.role, cargo: item.cargo,
    area: item.area || '', status: 'pendente', invite_token: item.inviteToken || null,
  }]).select().single()
  return data
}

export async function dbUpdateSolicitacao(id, fields) {
  await supabase.from('solicitacoes').update(fields).eq('id', id)
}

// ─── Usuários aprovados ───────────────────────────────────────
export async function dbGetUsuarios() {
  const { data } = await supabase.from('usuarios').select('*')
  return data || []
}

export async function dbAddUsuario(u) {
  const { data } = await supabase.from('usuarios').insert([{
    nome: u.nome, email: u.email || '', telefone: u.telefone || '',
    role: u.role, cargo: u.cargo || '', grupo: u.grupo,
    senha_custom: u.senhaCustom || u.senha_custom || null,
    status: 'ativo',
  }]).select().single()
  return data
}

export async function dbFindUsuario(emailOrNome, senha) {
  const { data } = await supabase
    .from('usuarios')
    .select('*')
    .or(`email.eq.${emailOrNome},nome.eq.${emailOrNome}`)
    .eq('status', 'ativo')
    .limit(1)
  const u = data?.[0]
  if (!u) return null
  const senhaOk = u.senha_custom === senha || (u.telefone && u.telefone.replace(/\D/g,'').slice(0,4) === senha)
  if (!senhaOk) return null
  return { id: u.id, nome: u.nome, role: u.role, cargo: u.cargo, grupo: u.grupo, email: u.email }
}

// ─── Convites ─────────────────────────────────────────────────
export async function dbGetConvites() {
  const { data } = await supabase.from('convites').select('*').order('created_at', { ascending: false })
  return data || []
}

export async function dbAddConvite(token, role) {
  const { data } = await supabase.from('convites').insert([{ token, role, status: 'ativo' }]).select().single()
  return data
}

export async function dbGetConvite(token) {
  const { data } = await supabase.from('convites').select('*').eq('token', token).eq('status', 'ativo').single()
  return data || null
}

export async function dbUsarConvite(token) {
  await supabase.from('convites').update({ status: 'usado' }).eq('token', token)
}

// ─── helpers jsonb genéricos ──────────────────────────────────
async function getAll(table) {
  const { data } = await supabase.from(table).select('*').order('created_at')
  return (data || []).map(r => ({ ...r.data, id: r.id }))
}
async function addOne(table, obj) {
  const { id, ...rest } = obj
  const { data } = await supabase.from(table).insert([{ data: rest }]).select().single()
  return { ...data.data, id: data.id }
}
async function saveOne(table, id, obj) {
  const { id: _, ...rest } = obj
  await supabase.from(table).update({ data: rest }).eq('id', id)
}
async function delOne(table, id) {
  await supabase.from(table).delete().eq('id', id)
}

// ─── Eventos (Agenda) ─────────────────────────────────────────
export const dbGetEventos      = ()        => getAll('eventos')
export const dbAddEvento       = obj       => addOne('eventos', obj)
export const dbSaveEvento      = (id, obj) => saveOne('eventos', id, obj)
export const dbDeleteEvento    = id        => delOne('eventos', id)

// ─── Processos ────────────────────────────────────────────────
export const dbGetProcessos    = ()        => getAll('processos')
export const dbAddProcesso     = obj       => addOne('processos', obj)
export const dbSaveProcesso    = (id, obj) => saveOne('processos', id, obj)
export const dbDeleteProcesso  = id        => delOne('processos', id)

// ─── Colaboradores ────────────────────────────────────────────
export const dbGetColaboradores  = ()        => getAll('colaboradores')
export const dbAddColaborador    = obj       => addOne('colaboradores', obj)
export const dbSaveColaborador   = (id, obj) => saveOne('colaboradores', id, obj)
export const dbDeleteColaborador = id        => delOne('colaboradores', id)

// ─── Consultores ──────────────────────────────────────────────
export const dbGetConsultores  = ()        => getAll('consultores')
export const dbAddConsultor    = obj       => addOne('consultores', obj)
export const dbSaveConsultor   = (id, obj) => saveOne('consultores', id, obj)
export const dbDeleteConsultor = id        => delOne('consultores', id)

// ─── Áreas ────────────────────────────────────────────────────
export const dbGetAreas   = ()        => getAll('areas')
export const dbAddArea    = obj       => addOne('areas', obj)
export const dbSaveArea   = (id, obj) => saveOne('areas', id, obj)
export const dbDeleteArea = id        => delOne('areas', id)
