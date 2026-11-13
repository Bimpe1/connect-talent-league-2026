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
          email,
          role, 
          team_id as "teamId", 
          team_name as "teamName", 
          wk1, 
          wk2, 
          wk3, 
          wk4, 
          attendance, 
          badges, 
          is_approved as "isApproved",
          status,
          password_hash as "passwordHash",
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

      // Hard team capacity limits per official pack (Max 40 total participants)
      const teamCapacities = {
        phoenix: 6,
        vision: 5,
        unity: 6,
        hope: 6,
        spark: 5,
        talent_stars: 6,
        bridge: 6
      };

      const targetTeamId = (p.teamId || '').toLowerCase();
      const maxCap = teamCapacities[targetTeamId] || 6;

      // Count existing members excluding this participant (allows updating an already enrolled participant)
      const [countRow] = await sql`
        SELECT count(*)::int as count FROM participants 
        WHERE LOWER(team_id) = ${targetTeamId} AND id != ${p.id};
      `;

      if (countRow && countRow.count >= maxCap) {
        return res.status(400).json({ 
          error: `Team is at maximum capacity (${maxCap} places). Please select another team.` 
        });
      }

      const isApprovedVal = p.isApproved !== undefined ? p.isApproved : false;
      const statusVal = p.status || (isApprovedVal ? 'approved' : 'pending');
      const passwordHashVal = p.passwordHash || p.password_hash || '';

      await sql`
        INSERT INTO participants (
          id, name, email, role, team_id, team_name, 
          wk1, wk2, wk3, wk4, attendance, badges,
          is_approved, status, password_hash
        ) VALUES (
          ${p.id},
          ${p.name},
          ${p.email || ''},
          ${p.role || 'Member'},
          ${p.teamId || ''},
          ${p.teamName || ''},
          ${p.wk1 || 0},
          ${p.wk2 || 0},
          ${p.wk3 || 0},
          ${p.wk4 || 0},
          ${JSON.stringify(p.attendance || {})},
          ${JSON.stringify(p.badges || [])},
          ${isApprovedVal},
          ${statusVal},
          ${passwordHashVal}
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          role = EXCLUDED.role,
          team_id = EXCLUDED.team_id,
          team_name = EXCLUDED.team_name,
          wk1 = EXCLUDED.wk1,
          wk2 = EXCLUDED.wk2,
          wk3 = EXCLUDED.wk3,
          wk4 = EXCLUDED.wk4,
          attendance = EXCLUDED.attendance,
          badges = EXCLUDED.badges,
          is_approved = EXCLUDED.is_approved,
          status = EXCLUDED.status,
          password_hash = COALESCE(NULLIF(EXCLUDED.password_hash, ''), participants.password_hash);
      `;

      return res.status(200).json({ success: true, participant: p });
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: 'Missing participant id' });
      }
      await sql`DELETE FROM participants WHERE id = ${id};`;
      return res.status(200).json({ success: true, deletedId: id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API /api/participants error:', error);
    return res.status(500).json({ error: error.message });
  }
}
