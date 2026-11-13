import { getDb, ensureTables } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = getDb();
  if (!sql) {
    return res.status(503).json({
      error: 'Database not configured. Please set POSTGRES_URL in Vercel Storage settings.',
      fallback: true
    });
  }

  try {
    await ensureTables(sql);

    if (req.method === 'GET') {
      const key = req.query.key || 'challenge_schedule';
      const rows = await sql`
        SELECT key, value, updated_at as "updatedAt"
        FROM league_settings
        WHERE key = ${key};
      `;

      if (rows && rows.length > 0) {
        return res.status(200).json(rows[0].value);
      }
      return res.status(200).json(null);
    }

    if (req.method === 'POST') {
      const { key = 'challenge_schedule', value } = req.body;
      if (!value) {
        return res.status(400).json({ error: 'Missing value' });
      }

      await sql`
        INSERT INTO league_settings (key, value, updated_at)
        VALUES (${key}, ${JSON.stringify(value)}, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE SET
          value = EXCLUDED.value,
          updated_at = CURRENT_TIMESTAMP;
      `;

      return res.status(200).json({ success: true, key, value });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API /api/settings error:', error);
    return res.status(500).json({ error: error.message });
  }
}
