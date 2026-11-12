import { neon } from '@neondatabase/serverless';

function getConnectionString() {
  return (
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ''
  );
}

export function getDb() {
  const connectionString = getConnectionString();
  if (!connectionString) {
    return null;
  }
  return neon(connectionString);
}

// Auto-create database tables on first use
let tablesInitialized = false;

export async function ensureTables(sql) {
  if (tablesInitialized || !sql) return;

  try {
    // Participants Table
    await sql`
      CREATE TABLE IF NOT EXISTS participants (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100),
        team_id VARCHAR(100),
        team_name VARCHAR(100),
        wk1 INT DEFAULT 0,
        wk2 INT DEFAULT 0,
        wk3 INT DEFAULT 0,
        wk4 INT DEFAULT 0,
        attendance JSONB DEFAULT '{}'::jsonb,
        badges JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Submissions Table
    await sql`
      CREATE TABLE IF NOT EXISTS submissions (
        id VARCHAR(100) PRIMARY KEY,
        participant_id VARCHAR(100),
        participant_name VARCHAR(255),
        team_id VARCHAR(100),
        team_name VARCHAR(100),
        week_number INT,
        challenge_day VARCHAR(100),
        challenge_title VARCHAR(255),
        submission_text TEXT,
        media_type VARCHAR(50),
        attached_voice JSONB,
        attached_media JSONB,
        is_team_mission BOOLEAN DEFAULT FALSE,
        is_reflection BOOLEAN DEFAULT FALSE,
        status VARCHAR(50) DEFAULT 'pending',
        ai_score JSONB,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Captains Table
    await sql`
      CREATE TABLE IF NOT EXISTS captains (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100) DEFAULT 'captain',
        team_name VARCHAR(100) DEFAULT 'Staff',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Curriculum Weeks Table
    await sql`
      CREATE TABLE IF NOT EXISTS curriculum_weeks (
        week_number INT PRIMARY KEY,
        data JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    tablesInitialized = true;
  } catch (err) {
    console.error("Failed to ensure database tables:", err);
    throw err;
  }
}
