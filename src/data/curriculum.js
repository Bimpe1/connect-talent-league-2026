// Complete Connect Talent League 2026 Program & Curriculum Data
// Extracted from Connect Talent CIO Facilitator & Participant Pack (Charity 1169975)

export const CHARITY_INFO = {
  name: "Connect Talent CIO",
  registration: "Registered charity 1169975",
  leagueName: "Connect Talent League 2026",
  motto: "Learn together. Think creatively. Celebrate every step.",
  promise: "Effort matters, different abilities are valued, and everyone has something to contribute.",
  dates: {
    prep: "Thursday 12 November 2026",
    period: "Monday 16 November – Sunday 13 December 2026",
    announcements: "Sundays at 7pm"
  }
};

export const TEAMS = [
  { id: "phoenix", name: "Phoenix", capacity: 6, color: "text-red-700 bg-red-50 border-red-200" },
  { id: "vision", name: "Vision", capacity: 5, color: "text-purple-700 bg-purple-50 border-purple-200" },
  { id: "unity", name: "Unity", capacity: 6, color: "text-blue-700 bg-blue-50 border-blue-200" },
  { id: "hope", name: "Hope", capacity: 6, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { id: "spark", name: "Spark", capacity: 5, color: "text-amber-700 bg-amber-50 border-amber-200" },
  { id: "talent_stars", name: "Talent Stars", capacity: 6, color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  { id: "bridge", name: "Bridge", capacity: 6, color: "text-teal-700 bg-teal-50 border-teal-200" }
];

export const SCORING_RULES = {
  dailyMax: 20,
  teamMissionMax: 20,
  sundayReflectionMax: 10,
  thursdayAttendanceBonus: 10,
  weeklyMax: 140,
  fourWeekMax: 560,
  dailyRubric: [
    { key: "attempt", label: "Makes a relevant attempt", points: 5, hint: "Completes the core requirement with effort" },
    { key: "reason", label: "Explains an idea or reason", points: 5, hint: "Gives clear rationale for choices ('because', 'so')" },
    { key: "evidence", label: "Checks evidence, considers another view or tests idea", points: 5, hint: "Showed a buddy, tested an option, or checked facts" },
    { key: "conclusion", label: "Gives a practical conclusion or reflection", points: 5, hint: "Shares what they'd change or do next" }
  ],
  missionRubric: [
    { label: "Identifiable contribution", points: 5 },
    { label: "Listening to or including others", points: 5 },
    { label: "Helping develop the solution", points: 5 },
    { label: "Explaining team's decision", points: 5 }
  ],
  reflectionRubric: [
    { label: "Identifying something learned", points: 5 },
    { label: "Describing a next step", points: 5 }
  ]
};

export const MILESTONE_BADGES = [
  { id: "ready_to_begin", name: "Ready to Begin", requirement: "Completes preparation session (12 Nov)", type: "Milestone", icon: "Flag", color: "bg-sky-100 text-sky-800 border-sky-300" },
  { id: "first_step", name: "First Step", requirement: "Completes a first challenge", type: "Milestone", icon: "Footprints", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { id: "growing_confidence", name: "Growing Confidence", requirement: "Reaches 100 TP", type: "Milestone", points: 100, icon: "TrendingUp", color: "bg-teal-100 text-teal-800 border-teal-300" },
  { id: "building_momentum", name: "Building Momentum", requirement: "Reaches 250 TP", type: "Milestone", points: 250, icon: "Zap", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { id: "league_achiever", name: "League Achiever", requirement: "Reaches 400 TP", type: "Milestone", points: 400, icon: "Award", color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  { id: "learning_champion", name: "Learning Champion", requirement: "Reaches 500 TP", type: "Milestone", points: 500, icon: "Trophy", color: "bg-yellow-100 text-yellow-900 border-yellow-400" }
];

export const RECOGNITION_BADGES = [
  { id: "critical_thinker", name: "Critical Thinker", requirement: "Shows thoughtful checking or reconsideration in three challenges", type: "Recognition", icon: "Brain", color: "bg-purple-100 text-purple-800 border-purple-300" },
  { id: "creative_spark", name: "Creative Spark", requirement: "Shows a useful original idea or adaptation", type: "Recognition", icon: "Sparkles", color: "bg-pink-100 text-pink-800 border-pink-300" },
  { id: "kindness_champion", name: "Kindness Champion", requirement: "Shows thoughtful, respectful help, with recipient's consent", type: "Recognition", icon: "Heart", color: "bg-rose-100 text-rose-800 border-rose-300" },
  { id: "team_builder", name: "Team Builder", requirement: "Helps include others in two team missions", type: "Recognition", icon: "Users", color: "bg-green-100 text-green-800 border-green-300" },
  { id: "personal_progress", name: "Personal Progress", requirement: "Shows meaningful improvement against own starting point", type: "Recognition", icon: "Compass", color: "bg-orange-100 text-orange-800 border-orange-300" }
];

export const WEEKS = [
  {
    weekNumber: 1,
    title: "Connect and Think",
    dates: "16–22 November",
    thursdayDate: "19 November",
    criticalFocus: "Telling claims from evidence and spotting assumptions.",
    challenges: [
      {
        day: "Monday",
        date: "16 Nov",
        title: "My learning superpower",
        instructions: "Share one strength and one skill you want to develop. Explain how your strength could help someone.",
        thinkingPrompt: "What helped you decide? How might your strength support a teammate?",
        maxPoints: 20
      },
      {
        day: "Tuesday",
        date: "17 Nov",
        title: "Fact, opinion or unknown?",
        instructions: "Sort three statements supplied by your captain. Explain what evidence would help check one of them.",
        thinkingPrompt: "Why did you categorize the statement that way? What source would you trust?",
        maxPoints: 20
      },
      {
        day: "Wednesday",
        date: "18 Nov",
        title: "Pause before you click",
        instructions: "Look at a fictional message demanding urgent payment. Spot two warning signs and one safe next step.",
        thinkingPrompt: "What makes the message suspicious? What should you never do?",
        maxPoints: 20
      },
      {
        day: "Thursday",
        date: "19 Nov",
        title: "Explain it simply",
        instructions: "Explain a useful digital task to a beginner in three steps. Ask a buddy whether your instructions are clear.",
        thinkingPrompt: "Did your buddy understand step 1? What did you clarify after asking them?",
        maxPoints: 20
      },
      {
        day: "Friday",
        date: "20 Nov",
        title: "Solve the hub puzzle",
        instructions: "Plan how three people can share one laptop in a 30-minute session. Explain why your plan is fair.",
        thinkingPrompt: "How did you balance each person's needs? What would you do if someone needs extra time?",
        maxPoints: 20
      },
      {
        day: "Saturday",
        date: "21 Nov",
        title: "Team Mission: Our welcoming hub",
        isTeamMission: true,
        instructions: "Design a welcome for a newcomer who feels nervous about technology, including three practical adjustments.",
        thinkingPrompt: "What role did you take in your team discussion? How does your plan respect different access needs?",
        maxPoints: 20
      },
      {
        day: "Sunday",
        date: "22 Nov",
        title: "Sunday Reflection",
        isReflection: true,
        instructions: "Share one thing you learned this week and one thing to practise next week.",
        thinkingPrompt: "Reflect on your progress and identify a realistic next step.",
        maxPoints: 10
      }
    ]
  },
  {
    weekNumber: 2,
    title: "Create and Communicate",
    dates: "23–29 November",
    thursdayDate: "26 November",
    criticalFocus: "Comparing options and explaining decisions.",
    challenges: [
      {
        day: "Monday",
        date: "23 Nov",
        title: "A message that matters",
        instructions: "Write, draw or record a short invitation to a community learning session. Include who, what, when and where.",
        thinkingPrompt: "What helped you decide? What might you check or change?",
        maxPoints: 20
      },
      {
        day: "Tuesday",
        date: "24 Nov",
        title: "Human or AI: check both",
        instructions: "Review a sample AI answer (prepared by your captain) that contains a mistake. Say what needs checking and how.",
        thinkingPrompt: "How did you spot the error? What source verified the correct information?",
        maxPoints: 20
      },
      {
        day: "Wednesday",
        date: "25 Nov",
        title: "Two ways to say it",
        instructions: "Rewrite a confusing instruction in plain language. Explain what makes yours easier to follow.",
        thinkingPrompt: "Why was the original unclear? What words did you simplify?",
        maxPoints: 20
      },
      {
        day: "Thursday",
        date: "26 Nov",
        title: "Design for everyone",
        instructions: "Improve an example poster for readability and inclusion — think about text size, contrast and contact options.",
        thinkingPrompt: "Who might struggle with the old design? How does your redesign fix that?",
        maxPoints: 20
      },
      {
        day: "Friday",
        date: "27 Nov",
        title: "The £20 decision",
        instructions: "Share out a fictional £20 activity budget. Compare two options and justify your choice. No real spending.",
        thinkingPrompt: "What trade-offs did you consider? Why is option A better than option B?",
        maxPoints: 20
      },
      {
        day: "Saturday",
        date: "28 Nov",
        title: "Team Mission: A useful campaign",
        isTeamMission: true,
        instructions: "Create a poster, script or audio message inviting people to learn a digital skill. Explain your audience and design choices.",
        thinkingPrompt: "How did your team agree on the medium and message? What was your contribution?",
        maxPoints: 20
      },
      {
        day: "Sunday",
        date: "29 Nov",
        title: "Sunday Reflection",
        isReflection: true,
        instructions: "Share one communication skill you learned and one change you would make to your work.",
        thinkingPrompt: "What made the biggest difference in getting your message across?",
        maxPoints: 10
      }
    ]
  },
  {
    weekNumber: 3,
    title: "Care and Collaborate",
    dates: "30 November–6 December",
    thursdayDate: "3 December",
    criticalFocus: "Seeing other perspectives, inclusion and disagreeing constructively.",
    challenges: [
      {
        day: "Monday",
        date: "30 Nov",
        title: "Kindness with consent",
        instructions: "Offer a small act of help the person welcomes. Describe what you learned without naming them.",
        thinkingPrompt: "How did you ensure the help was wanted? What did you learn about respecting boundaries?",
        maxPoints: 20
      },
      {
        day: "Tuesday",
        date: "1 Dec",
        title: "Whose voice is missing?",
        instructions: "Review a fictional activity plan. Identify who it might leave out and suggest an improvement.",
        thinkingPrompt: "What barriers might someone with lower digital confidence or limited mobile data face?",
        maxPoints: 20
      },
      {
        day: "Wednesday",
        date: "2 Dec",
        title: "Spot the assumption",
        instructions: "Consider: 'Everyone can complete this online.' Identify the assumptions and suggest alternatives.",
        thinkingPrompt: "What assumptions does this statement make? How can in-person/paper options bridge the gap?",
        maxPoints: 20
      },
      {
        day: "Thursday",
        date: "3 Dec",
        title: "Teach and learn",
        instructions: "Swap one useful skill with a buddy. Each of you shares what helped you understand.",
        thinkingPrompt: "What teaching method clicked with your buddy? What did they teach you?",
        maxPoints: 20
      },
      {
        day: "Friday",
        date: "4 Dec",
        title: "Disagree respectfully",
        instructions: "Respond to a fictional disagreement with one question, one acknowledgement and one practical compromise.",
        thinkingPrompt: "How did you keep the conversation constructive? What was the shared common ground?",
        maxPoints: 20
      },
      {
        day: "Saturday",
        date: "5 Dec",
        title: "Team Mission: Make it accessible",
        isTeamMission: true,
        instructions: "Redesign a community activity for someone with limited data, low confidence or a different access need.",
        thinkingPrompt: "How did your team incorporate feedback from participants with different needs?",
        maxPoints: 20
      },
      {
        day: "Sunday",
        date: "6 Dec",
        title: "Sunday Reflection",
        isReflection: true,
        instructions: "Explain how someone else's perspective changed your thinking, and add one next step.",
        thinkingPrompt: "What new view did you adopt? How will you apply it going forward?",
        maxPoints: 10
      }
    ]
  },
  {
    weekNumber: 4,
    title: "Solve and Shine",
    dates: "7–13 December",
    thursdayDate: "10 December",
    criticalFocus: "Defining problems, testing ideas and improving through feedback.",
    challenges: [
      {
        day: "Monday",
        date: "7 Dec",
        title: "Find the real problem",
        instructions: "Choose a fictional community difficulty. Separate its symptoms from its possible causes.",
        thinkingPrompt: "What was the visible symptom vs the underlying root cause?",
        maxPoints: 20
      },
      {
        day: "Tuesday",
        date: "8 Dec",
        title: "Three solutions",
        instructions: "Suggest three responses and compare their effort, benefit and accessibility.",
        thinkingPrompt: "Which solution gives the best balance between ease and impact?",
        maxPoints: 20
      },
      {
        day: "Wednesday",
        date: "9 Dec",
        title: "Test before deciding",
        instructions: "Ask a buddy to review your preferred solution. Note one useful suggestion and your response.",
        thinkingPrompt: "What blind spot did your buddy highlight? How did you respond?",
        maxPoints: 20
      },
      {
        day: "Thursday",
        date: "10 Dec",
        title: "Improve your idea",
        instructions: "Revise your solution using the feedback. Explain what changed and why.",
        thinkingPrompt: "Why is the revised version stronger than your initial draft?",
        maxPoints: 20
      },
      {
        day: "Friday",
        date: "11 Dec",
        title: "My next learning step",
        instructions: "Share a skill you've gained, an example of progress and a realistic next goal.",
        thinkingPrompt: "How far have you come since Week 1? What will you learn next?",
        maxPoints: 20
      },
      {
        day: "Saturday",
        date: "12 Dec",
        title: "Team Mission: Community solution showcase",
        isTeamMission: true,
        instructions: "Present a practical solution as a two-minute talk, poster, drawing or audio clip: the problem, evidence and next step.",
        thinkingPrompt: "How did your team pull together evidence and present clearly?",
        maxPoints: 20
      },
      {
        day: "Sunday",
        date: "13 Dec",
        title: "Final Celebration & Achievements",
        isReflection: true,
        instructions: "Reflect on your progress, recognise a teammate and receive your final achievements.",
        thinkingPrompt: "Celebrate every step you and your team have made!",
        maxPoints: 10
      }
    ]
  }
];
