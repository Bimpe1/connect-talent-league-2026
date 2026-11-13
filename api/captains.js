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
      const rows = await sql`
        SELECT 
          id, 
          name, 
          role, 
          team_name as "teamName", 
          created_at as "createdAt"
        FROM captains
        ORDER BY created_at ASC;
      `;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const cap = req.body;
      if (!cap || !cap.id || !cap.name) {
        return res.status(400).json({ error: 'Missing captain id or name' });
      }

      await sql`
        INSERT INTO captains (id, name, role, team_name)
        VALUES (${cap.id}, ${cap.name}, ${cap.role || 'captain'}, ${cap.teamName || 'Staff'})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          team_name = EXCLUDED.team_name;
      `;

      return res.status(200).json({ success: true, captain: cap });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API /api/captains error:', error);
    return res.status(500).json({ error: error.message });
  }
}
