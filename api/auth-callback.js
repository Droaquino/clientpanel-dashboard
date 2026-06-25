import { google } from 'googleapis'

export default async function handler(req, res) {
  const { code } = req.query

  if (!code) {
    return res.status(400).send('Código de autorização não encontrado.')
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:5174'}/api/auth-callback`,
  )

  try {
    const { tokens } = await oauth2Client.getToken(code)

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Autorização concluída</title>
        <style>
          body { font-family: sans-serif; max-width: 700px; margin: 60px auto; padding: 0 20px; }
          h2 { color: #163828; }
          pre { background: #f4f4f4; padding: 16px; border-radius: 8px; word-break: break-all; white-space: pre-wrap; }
          .ok { color: #2D6A4F; font-weight: bold; }
          .step { margin: 12px 0; }
        </style>
      </head>
      <body>
        <h2>✅ Autorização concluída!</h2>
        <p>Copie o <strong>Refresh Token</strong> abaixo e adicione como variável de ambiente <code>GOOGLE_REFRESH_TOKEN</code> no Vercel:</p>
        <pre>${tokens.refresh_token || '(refresh token não retornado — tente o fluxo novamente)'}</pre>
        <div class="step">Após adicionar no Vercel, clique em <strong>Redeploy</strong> e a integração estará ativa.</div>
      </body>
      </html>
    `)
  } catch (err) {
    res.status(500).send(`Erro ao trocar o código: ${err.message}`)
  }
}
