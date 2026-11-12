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
          participant_id as "participantId",
          participant_name as "participantName",
          team_id as "teamId",
          team_name as "teamName",
          week_number as "weekNumber",
          challenge_day as "challengeDay",
          challenge_title as "challengeTitle",
          submission_text as "submissionText",
          media_type as "mediaType",
          attached_voice as "attachedVoice",
          attached_media as "attachedMedia",
          is_team_mission as "isTeamMission",
          is_reflection as "isReflection",
          status,
          ai_score as "aiScore",
          submitted_at as "submittedAt"
        FROM submissions
        ORDER BY submitted_at DESC;
      `;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const sub = req.body;
      if (!sub || !sub.id || !sub.participantId) {
        return res.status(400).json({ error: 'Missing submission id or participantId' });
      }

      await sql`
        INSERT INTO submissions (
          id, participant_id, participant_name, team_id, team_name,
          week_number, challenge_day, challenge_title, submission_text,
          media_type, attached_voice, attached_media, is_team_mission,
          is_reflection, status, ai_score
        ) VALUES (
          ${sub.id},
          ${sub.participantId},
          ${sub.participantName || ''},
          ${sub.teamId || ''},
          ${sub.teamName || ''},
          ${sub.weekNumber || 1},
          ${sub.challengeDay || ''},
          ${sub.challengeTitle || ''},
          ${sub.submissionText || ''},
          ${sub.mediaType || 'text'},
          ${JSON.stringify(sub.attachedVoice || null)},
          ${JSON.stringify(sub.attachedMedia || null)},
          ${!!sub.isTeamMission},
          ${!!sub.isReflection},
          ${sub.status || 'pending'},
          ${JSON.stringify(sub.aiScore || { total: 15 })}
        )
        ON CONFLICT (id) DO UPDATE SET
          submission_text = EXCLUDED.submission_text,
          attached_voice = EXCLUDED.attached_voice,
          attached_media = EXCLUDED.attached_media,
          status = EXCLUDED.status,
          ai_score = EXCLUDED.ai_score;
      `;

      return res.status(200).json({ success: true, submission: sub });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API /api/submissions error:', error);
    return res.status(500).json({ error: error.message });
  }
}
