// Automatic first-pass rubric check for a submission (Attempt / Reason / Evidence / Conclusion, 5 pts each).
// This is a simple keyword heuristic, NOT AI. Captains review and can adjust every score before approval.

const has = (text, words) => words.some((w) => new RegExp(`\\b${w}\\b`, 'i').test(text));

const REASON_WORDS = ['because', 'so', 'reason', 'decided', 'since'];
const EVIDENCE_WORDS = ['checked', 'tested', 'buddy', 'showed', 'asked'];
const CONCLUSION_WORDS = ['next', 'change', 'learned', 'improve', 'will'];

export function evaluateRubric(text = '') {
  const attempt = text.trim() ? 5 : 0;
  const reason = has(text, REASON_WORDS) ? 5 : 0;
  const evidence = has(text, EVIDENCE_WORDS) ? 5 : 0;
  const conclusion = has(text, CONCLUSION_WORDS) ? 5 : 0;
  const total = attempt + reason + evidence + conclusion;

  let notes = 'Good attempt with clear effort.';
  if (reason && evidence) notes = 'Strong reasoning and evidence of testing with a buddy.';
  else if (!evidence) notes = 'Consider checking with a buddy or neighbor for full evidence points.';

  return { attempt, reason, evidence, conclusion, total, notes };
}
