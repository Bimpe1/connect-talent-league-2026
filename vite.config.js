import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-dev-api-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          // Localhandler for /api/notifications when testing on localhost before Vercel deploy
          if (req.url.startsWith('/api/notifications') && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const recipients = (parsed.recipients || []).filter(r => (typeof r === 'string' ? r : r.email));
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({
                  success: true,
                  type: parsed.type || 'challenge_opened',
                  deliveredCount: recipients.length,
                  provider: 'localhost_dev_simulation',
                  recipients: recipients.map(r => typeof r === 'string' ? r : r.email),
                  message: `[Localhost Test Success] Notification simulated for ${recipients.length} participant(s). Real emails will be sent via Resend once deployed to Vercel.`
                }));
              } catch (e) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: e.message }));
              }
            });
            return;
          }

          // Localhandler for /api/settings
          if (req.url.startsWith('/api/settings')) {
            if (req.method === 'GET') {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({}));
              return;
            }
            if (req.method === 'POST') {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true }));
              return;
            }
          }

          next();
        });
      }
    }
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://connect-talent-league-2026.vercel.app',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
