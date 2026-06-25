import { google } from 'googleapis'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { title, processName, date, sh, sm, eh, em, who } = req.body

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
    return res.status(500).json({ error: 'Credenciais do Google não configuradas nas variáveis de ambiente.' })
  }

  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    )
    auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })

    const calendar = google.calendar({ version: 'v3', auth })

    const pad = n => String(n).padStart(2, '0')
    const tz  = 'America/Sao_Paulo'

    const event = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: {
        summary: title || processName,
        description: [
          processName ? `Processo: ${processName}` : null,
          who         ? `Participante: ${who}` : null,
          '',
          'Agendado via ClientPanel — DF Turismo',
        ].filter(l => l !== null).join('\n'),
        start: { dateTime: `${date}T${pad(sh)}:${pad(sm)}:00`, timeZone: tz },
        end:   { dateTime: `${date}T${pad(eh)}:${pad(em)}:00`, timeZone: tz },
        conferenceData: {
          createRequest: {
            requestId: `cp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      },
    })

    res.json({
      eventId:   event.data.id,
      meetLink:  event.data.hangoutLink,
      eventLink: event.data.htmlLink,
    })
  } catch (err) {
    console.error('[create-event] Google Calendar API error:', err.message)
    res.status(500).json({ error: err.message })
  }
}
