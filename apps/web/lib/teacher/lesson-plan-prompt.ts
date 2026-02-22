/**
 * Lesson Plan Prompt — Phase 11
 *
 * Claude prompt template for generating structured lesson plans.
 */

interface LessonPlanInput {
  concepts: Array<{ title: string; nodeCode: string; description?: string }>;
  gradeLevel: string;
  duration: number; // minutes
  classSize: number;
  masteryDistribution?: {
    novice: number;
    developing: number;
    proficient: number;
    mastered: number;
  };
}

export function buildLessonPlanPrompt(input: LessonPlanInput): string {
  const conceptList = input.concepts
    .map((c) => `- ${c.nodeCode}: ${c.title}${c.description ? ` (${c.description})` : ""}`)
    .join("\n");

  const masteryInfo = input.masteryDistribution
    ? `\nClass Mastery Distribution:\n- Novice: ${input.masteryDistribution.novice} students\n- Developing: ${input.masteryDistribution.developing} students\n- Proficient: ${input.masteryDistribution.proficient} students\n- Mastered: ${input.masteryDistribution.mastered} students`
    : "";

  return `You are a curriculum planning assistant for elementary math teachers. Generate a structured lesson plan based on the following parameters.

Grade Level: ${input.gradeLevel}
Duration: ${input.duration} minutes
Class Size: ${input.classSize} students${masteryInfo}

Concepts to Cover:
${conceptList}

Generate a lesson plan in the following JSON format:
{
  "title": "Lesson title",
  "objectives": ["Learning objective 1", "Learning objective 2"],
  "warmUp": {
    "duration": 5,
    "activity": "Brief description of warm-up activity",
    "materials": ["Material 1"]
  },
  "mainActivity": {
    "duration": 15,
    "activity": "Description of main teaching activity",
    "steps": ["Step 1", "Step 2", "Step 3"],
    "materials": ["Material 1"]
  },
  "guidedPractice": {
    "duration": 10,
    "activity": "Description of guided practice",
    "examples": ["Example problem 1", "Example problem 2"]
  },
  "independentPractice": {
    "duration": 10,
    "activity": "Description of independent practice",
    "problems": ["Problem 1", "Problem 2", "Problem 3"]
  },
  "assessment": {
    "duration": 5,
    "method": "How to assess understanding",
    "exitTicket": "Exit ticket question"
  },
  "differentiation": {
    "struggling": "Support strategies for struggling learners",
    "advanced": "Extension activities for advanced learners",
    "ell": "ELL support strategies"
  },
  "materials": ["Complete list of materials needed"]
}

Important:
- Make the lesson engaging and age-appropriate for ${input.gradeLevel} students
- Include concrete manipulatives and visual aids where appropriate
- Ensure the total duration adds up to approximately ${input.duration} minutes
- Provide specific, actionable differentiation strategies
- Return ONLY the JSON object, no other text`;
}
