import { getDb, ensureTables } from './db.js';

export default async function handler(req, res) {
  // Set CORS headers
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
          team_id as "teamId", 
          team_name as "teamName", 
          wk1, 
          wk2, 
          wk3, 
          wk4, 
          attendance, 
          badges, 
          created_at as "createdAt"
        FROM participants
        ORDER BY created_at ASC;
      `;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const p = req.body;
      if (!p || !p.id || !p.name) {
        return res.status(400).json({ error: 'Missing participant id or name' });
      }

      await sql`
        INSERT INTO participants (
          id, name, role, team_id, team_name, 
          wk1, wk2, wk3, wk4, attendance, badges
        ) VALUES (
          ${p.id},
          ${p.name},
          ${p.role || 'Member'},
          ${p.teamId || ''},
          ${p.teamName || ''},
          ${p.wk1 || 0},
          ${p.wk2 || 0},
          ${p.wk3 || 0},
          ${p.wk4 || 0},
          ${JSON.stringify(p.attendance || {})},
          ${JSON.stringify(p.badges || [])}
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          team_id = EXCLUDED.team_id,
          team_name = EXCLUDED.team_name,
          wk1 = EXCLUDED.wk1,
          wk2 = EXCLUDED.wk2,
          wk3 = EXCLUDED.wk3,
          wk4 = EXCLUDED.wk4,
          attendance = EXCLUDED.attendance,
          badges = EXCLUDED.badges;
      `;

      return res.status(200).json({ success: true, participant: p });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API /api/participants error:', error);
    return res.status(500).json({ error: error.message });
  }
}
