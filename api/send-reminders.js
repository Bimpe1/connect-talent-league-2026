import { createRemindersHandler } from './_lib/reminders.js';

// POST /api/send-reminders  { kind: "closing" | "live", dryRun?: true }   (called by the scheduled GitHub job)
export default createRemindersHandler();
