import { neon } from '@neondatabase/serverless';

function getConnectionString() {
  // Check known standard variable names
  const direct =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.STORAGE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (direct) return direct;

  // Auto-detect any postgres connection string injected by Vercel / Neon
  for (const [key, value] of Object.entries(process.env)) {
    if (
      typeof value === 'string' &&
      (value.startsWith('postgres://') || value.startsWith('postgresql://'))
    ) {
      return value;
    }
  }

  return '';
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
        is_attendance BOOLEAN DEFAULT FALSE,
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

    // League Settings Table (Schedule, Timing, Locks)
    await sql`
      CREATE TABLE IF NOT EXISTS league_settings (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Email Notification Logs Table
    await sql`
      CREATE TABLE IF NOT EXISTS email_logs (
        id VARCHAR(100) PRIMARY KEY,
        type VARCHAR(50),
        subject VARCHAR(255),
        recipients JSONB,
        recipient_count INT,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50)
      );
    `;

    // Ensure is_attendance column exists on submissions
    try {
      await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS is_attendance BOOLEAN DEFAULT FALSE;`;
    } catch (e) {}

    // Ensure email column exists on participants
    try {
      await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS email VARCHAR(255);`;
    } catch (e) {}

    // Ensure is_approved and status columns exist on participants
    try {
      await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;`;
      await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'approved';`;
    } catch (e) {}

    // Ensure password_hash column exists on participants
    try {
      await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);`;
    } catch (e) {}

    tablesInitialized = true;
  } catch (err) {
    console.error("Failed to ensure database tables:", err);
    throw err;
  }
}
