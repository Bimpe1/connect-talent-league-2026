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
          week_number as "weekNumber", 
          data, 
          updated_at as "updatedAt"
        FROM curriculum_weeks
        ORDER BY week_number ASC;
      `;
      return res.status(200).json(rows.map(r => r.data));
    }

    if (req.method === 'POST') {
      const { weekNumber, weekData } = req.body;
      if (!weekNumber || !weekData) {
        return res.status(400).json({ error: 'Missing weekNumber or weekData' });
      }

      await sql`
        INSERT INTO curriculum_weeks (week_number, data, updated_at)
        VALUES (${weekNumber}, ${JSON.stringify(weekData)}, CURRENT_TIMESTAMP)
        ON CONFLICT (week_number) DO UPDATE SET
          data = EXCLUDED.data,
          updated_at = CURRENT_TIMESTAMP;
      `;

      return res.status(200).json({ success: true, weekData });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API /api/weeks error:', error);
    return res.status(500).json({ error: error.message });
  }
}
