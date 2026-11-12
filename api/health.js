import { getDb, ensureTables } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const sql = getDb();

  if (!sql) {
    return res.status(200).json({
      connected: false,
      status: 'offline',
      message: 'No database connection string found in environment variables. Check Vercel Storage settings.'
    });
  }

  try {
    // Ping database
    const ping = await sql`SELECT 1 as connected;`;
    await ensureTables(sql);

    // Get count of registered participants
    const [{ count }] = await sql`SELECT count(*)::int as count FROM participants;`;

    return res.status(200).json({
      connected: true,
      status: 'online',
      message: 'PostgreSQL database connected and ready!',
      participantsCount: count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check database error:', error);
    return res.status(500).json({
      connected: false,
      status: 'error',
      message: error.message
    });
  }
}
