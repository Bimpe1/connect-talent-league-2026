// Initial realistic participant and team state for Connect Talent League 2026
// Reflecting Tab 1 (Individual), Tab 2 (Team), Tab 3 (Leaderboard), and Tab 4 (Attendance)

export const INITIAL_PARTICIPANTS = [
  {
    id: "p_alex",
    name: "Alex P.",
    role: "learner",
    teamId: "phoenix",
    teamName: "Phoenix",
    wk1: 95,
    wk2: 85,
    wk3: 0,
    wk4: 0,
    attendance: { prep: true, wk1: true, wk2: true, wk3: false, wk4: false },
    badges: ["ready_to_begin", "first_step", "growing_confidence", "creative_spark"]
  },
  {
    id: "p_sam",
    name: "Sam V.",
    role: "volunteer",
    teamId: "vision",
    teamName: "Vision",
    wk1: 110,
    wk2: 90,
    wk3: 0,
    wk4: 0,
    attendance: { prep: true, wk1: true, wk2: true, wk3: false, wk4: false },
    badges: ["ready_to_begin", "first_step", "growing_confidence", "building_momentum", "critical_thinker"]
  },
  {
    id: "p_jordan",
    name: "Jordan T. (You)",
    role: "learner",
    teamId: "spark",
    teamName: "Spark",
    wk1: 80,
    wk2: 65,
    wk3: 0,
    wk4: 0,
    attendance: { prep: true, wk1: true, wk2: true, wk3: false, wk4: false },
    badges: ["ready_to_begin", "first_step", "growing_confidence"]
  },
  {
    id: "p_maya",
    name: "Maya K.",
    role: "learner",
    teamId: "unity",
    teamName: "Unity",
    wk1: 105,
    wk2: 95,
    wk3: 0,
    wk4: 0,
    attendance: { prep: true, wk1: true, wk2: true, wk3: false, wk4: false },
    badges: ["ready_to_begin", "first_step", "growing_confidence", "building_momentum", "kindness_champion"]
  },
  {
    id: "p_charlie",
    name: "Charlie R.",
    role: "volunteer",
    teamId: "hope",
    teamName: "Hope",
    wk1: 85,
    wk2: 75,
    wk3: 0,
    wk4: 0,
    attendance: { prep: true, wk1: true, wk2: true, wk3: false, wk4: false },
    badges: ["ready_to_begin", "first_step", "growing_confidence"]
  },
  {
    id: "p_priya",
    name: "Priya M.",
    role: "learner",
    teamId: "talent_stars",
    teamName: "Talent Stars",
    wk1: 90,
    wk2: 80,
    wk3: 0,
    wk4: 0,
    attendance: { prep: true, wk1: true, wk2: true, wk3: false, wk4: false },
    badges: ["ready_to_begin", "first_step", "growing_confidence", "team_builder"]
  },
  {
    id: "p_david",
    name: "David O.",
    role: "volunteer",
    teamId: "bridge",
    teamName: "Bridge",
    wk1: 100,
    wk2: 80,
    wk3: 0,
    wk4: 0,
    attendance: { prep: true, wk1: true, wk2: true, wk3: false, wk4: false },
    badges: ["ready_to_begin", "first_step", "growing_confidence", "personal_progress"]
  },
  {
    id: "p_taylor",
    name: "Taylor B.",
    role: "learner",
    teamId: "phoenix",
    teamName: "Phoenix",
    wk1: 75,
    wk2: 60,
    wk3: 0,
    wk4: 0,
    attendance: { prep: false, wk1: true, wk2: true, wk3: false, wk4: false },
    badges: ["first_step", "growing_confidence"]
  },
  {
    id: "p_elena",
    name: "Elena G.",
    role: "learner",
    teamId: "vision",
    teamName: "Vision",
    wk1: 90,
    wk2: 85,
    wk3: 0,
    wk4: 0,
    attendance: { prep: true, wk1: true, wk2: true, wk3: false, wk4: false },
    badges: ["ready_to_begin", "first_step", "growing_confidence"]
  },
  {
    id: "p_zack",
    name: "Zack W.",
    role: "learner",
    teamId: "unity",
    teamName: "Unity",
    wk1: 70,
    wk2: 70,
    wk3: 0,
    wk4: 0,
    attendance: { prep: true, wk1: true, wk2: false, wk3: false, wk4: false },
    badges: ["ready_to_begin", "first_step", "growing_confidence"]
  }
];

export const INITIAL_SUBMISSIONS = [
  {
    id: "sub_1",
    participantId: "p_alex",
    participantName: "Alex P.",
    teamName: "Phoenix",
    weekNumber: 2,
    challengeDay: "Monday",
    challengeTitle: "A message that matters",
    submissionText: "I drew a poster for the learning session on Wednesday at 2pm in the community hall. I made the text large so everyone can read it. I checked the bus times so people know how to get there.",
    aiScore: { attempt: 5, reason: 5, evidence: 0, conclusion: 5, total: 15 },
    aiNotes: "Clear explanation for text size choice. Good practical details. Missing evidence of checking the draft with a peer before finalising.",
    status: "pending",
    submittedAt: "Mon 23 Nov, 14:15",
    type: "Daily Challenge (up to 20 TP)"
  },
  {
    id: "sub_2",
    participantId: "p_sam",
    participantName: "Sam V.",
    teamName: "Vision",
    weekNumber: 2,
    challengeDay: "Monday",
    challengeTitle: "A message that matters",
    submissionText: "Voice note transcript: 'Hi everyone, come to the hub tomorrow at 10. I showed my draft to my buddy and they said the location was clear, but suggested adding a large arrow to the entrance.'",
    aiScore: { attempt: 5, reason: 0, evidence: 5, conclusion: 5, total: 15 },
    aiNotes: "Checked with buddy and acted on feedback (evidence). Missing explanation of why the original wording was chosen.",
    status: "pending",
    submittedAt: "Mon 23 Nov, 15:40",
    type: "Daily Challenge (up to 20 TP)"
  },
  {
    id: "sub_3",
    participantId: "p_maya",
    participantName: "Maya K.",
    teamName: "Unity",
    weekNumber: 2,
    challengeDay: "Monday",
    challengeTitle: "A message that matters",
    submissionText: "I designed a simple flyer in plain language. I chose high-contrast yellow on dark navy because high contrast helps people with visual impairments. I asked my neighbour if she could read it from across the table, and she said yes easily. Next time I will add an RSVP phone number.",
    aiScore: { attempt: 5, reason: 5, evidence: 5, conclusion: 5, total: 20 },
    aiNotes: "Exemplary submission: clear reasoning for contrast, tested with neighbor (evidence), and identified practical next improvement.",
    status: "approved",
    approvedBy: "Coach Morgan",
    approvedAt: "Mon 23 Nov, 16:10",
    type: "Daily Challenge (up to 20 TP)"
  }
];
