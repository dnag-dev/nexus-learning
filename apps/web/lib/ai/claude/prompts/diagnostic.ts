import type { DiagnosticQuestion, DiagnosticOption } from "@/lib/diagnostic/types";

interface QuestionGenInput {
  nodeCode: string;
  nodeTitle: string;
  nodeDescription: string;
  gradeLevel: string;
  domain: string;
  difficulty: number;
  studentName: string;
  studentAge: number;
  personaId: string;
}

/**
 * Build the system prompt for Claude to generate a diagnostic question.
 */
export function buildDiagnosticSystemPrompt(personaId: string): string {
  const personaInstructions = getPersonaInstructions(personaId);

  return `You are an adaptive math assessment engine for a K-5 learning platform called Aauti Learn.

${personaInstructions}

Your job is to generate ONE multiple-choice diagnostic question to test whether a student has mastered a specific math concept.

Rules:
- The question must DIRECTLY test the concept described — not a prerequisite or successor concept.
- Provide exactly 4 answer options labeled A, B, C, D.
- Exactly ONE option must be correct.
- Wrong options should represent common student misconceptions for this concept, not random wrong answers.
- The language must be age-appropriate for the student's age.
- Use simple, clear language. Avoid jargon.
- For younger children (ages 5-7), use concrete objects (apples, blocks, toys) in problems.
- For older children (ages 8-12), you can use more abstract numbers.
- Include a brief, encouraging hint that nudges toward the right thinking without giving the answer away.

Respond with valid JSON only, no markdown, no explanation. Use this exact structure:
{
  "questionText": "the question",
  "options": [
    { "id": "A", "text": "option text", "isCorrect": false },
    { "id": "B", "text": "option text", "isCorrect": true },
    { "id": "C", "text": "option text", "isCorrect": false },
    { "id": "D", "text": "option text", "isCorrect": false }
  ],
  "hint": "a gentle nudge"
}`;
}

/**
 * Build the user prompt with the specific concept to test.
 */
export function buildDiagnosticUserPrompt(input: QuestionGenInput): string {
  const ageDescription =
    input.studentAge <= 7
      ? "young child (use pictures, objects, and simple words)"
      : input.studentAge <= 10
        ? "elementary student (can handle basic word problems)"
        : "upper elementary student (comfortable with more abstract math)";

  return `Generate a diagnostic question for this concept:

Concept Code: ${input.nodeCode}
Concept: ${input.nodeTitle}
Description: ${input.nodeDescription}
Grade Level: ${input.gradeLevel === "K" ? "Kindergarten" : `Grade ${input.gradeLevel.replace("G", "")}`}
Domain: ${input.domain}
Difficulty: ${input.difficulty}/10

Student: ${input.studentName}, age ${input.studentAge} (${ageDescription})

Generate the question now as JSON.`;
}

/**
 * Persona-specific instructions for tone and style.
 */
function getPersonaInstructions(personaId: string): string {
  switch (personaId) {
    case "cosmo":
      return `You are Cosmo the Bear — warm, patient, and encouraging. You celebrate every attempt.
Your tone is gentle and supportive. You use phrases like "Let's figure this out together!" and "You're doing great!"
Frame questions as fun adventures: "Cosmo found some apples..." or "Help Cosmo count the stars!"`;

    case "luna":
      return `You are Luna the Cat — calm, mysterious, and artistic. You make math feel magical.
Your tone is soft and thoughtful. Frame questions with wonder: "Luna noticed something interesting..." or "What pattern do you see?"`;

    case "rex":
      return `You are Rex the Dinosaur — goofy, lovable, and sometimes makes mistakes on purpose.
Your tone is playful and silly. Frame questions with humor: "Rex tried to count but got confused..." or "Can you help Rex figure this out?"`;

    case "nova":
      return `You are Dr. Nova — enthusiastic scientist who loves discovery.
Your tone is curious and excited. Frame questions as discoveries: "Let's explore this!" or "What do you think happens when..."`;

    case "pip":
      return `You are Pip the Owl — wise but genuinely funny, loves words and stories.
Your tone is storytelling-like. Frame questions within mini-stories.`;

    case "atlas":
      return `You are Atlas — strong and steady, loves building and construction analogies.
Your tone is confident and supportive. Frame questions with building metaphors.`;

    default:
      return `You are a friendly, patient math tutor for young children.
Your tone is warm and encouraging. Make math feel approachable and fun.`;
  }
}

/**
 * Parse Claude's JSON response into a DiagnosticQuestion.
 */
export function parseDiagnosticResponse(
  rawJson: string,
  nodeCode: string,
  nodeTitle: string,
  gradeLevel: string,
  domain: string,
  difficulty: number
): DiagnosticQuestion {
  // Strip any markdown code fences if present
  const cleaned = rawJson
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  const parsed = JSON.parse(cleaned) as {
    questionText: string;
    options: Array<{ id: string; text: string; isCorrect: boolean }>;
    hint?: string;
  };

  // Validate exactly 4 options with exactly 1 correct
  if (!parsed.options || parsed.options.length !== 4) {
    throw new Error("Expected exactly 4 options");
  }
  const correctCount = parsed.options.filter((o) => o.isCorrect).length;
  if (correctCount !== 1) {
    throw new Error(`Expected exactly 1 correct option, got ${correctCount}`);
  }

  return {
    questionId: `diag-${nodeCode}-${Date.now()}`,
    nodeCode,
    nodeTitle,
    gradeLevel,
    domain,
    difficulty,
    questionText: parsed.questionText,
    options: parsed.options.map(
      (o): DiagnosticOption => ({
        id: o.id,
        text: o.text,
        isCorrect: o.isCorrect,
      })
    ),
    hint: parsed.hint,
  };
}

/**
 * Hardcoded fallback questions for each node, used when Claude API is unavailable
 * or for faster local testing. Covers all 21 knowledge nodes.
 */
export function getFallbackQuestion(
  nodeCode: string
): DiagnosticQuestion | null {
  const fallbacks: Record<
    string,
    {
      questionText: string;
      options: DiagnosticOption[];
      hint: string;
    }
  > = {
    "K.CC.1": {
      questionText:
        "Cosmo is counting by tens. He says: 10, 20, 30, ... What number comes next?",
      options: [
        { id: "A", text: "35", isCorrect: false },
        { id: "B", text: "40", isCorrect: true },
        { id: "C", text: "31", isCorrect: false },
        { id: "D", text: "50", isCorrect: false },
      ],
      hint: "When we count by tens, we add 10 each time!",
    },
    "K.CC.2": {
      questionText: "Start at 5 and count forward. What are the next 3 numbers?",
      options: [
        { id: "A", text: "6, 7, 8", isCorrect: true },
        { id: "B", text: "4, 3, 2", isCorrect: false },
        { id: "C", text: "6, 8, 10", isCorrect: false },
        { id: "D", text: "5, 5, 5", isCorrect: false },
      ],
      hint: "Counting forward means going to the NEXT number each time.",
    },
    "K.CC.3": {
      questionText:
        "Cosmo has this many stars: ⭐⭐⭐⭐⭐⭐⭐. Which number tells how many stars?",
      options: [
        { id: "A", text: "5", isCorrect: false },
        { id: "B", text: "6", isCorrect: false },
        { id: "C", text: "7", isCorrect: true },
        { id: "D", text: "8", isCorrect: false },
      ],
      hint: "Try pointing to each star and counting: 1, 2, 3...",
    },
    "K.CC.4": {
      questionText:
        "There are 4 apples on the table. Cosmo says 'the last number I count tells me how many.' If he counts 1, 2, 3, 4 — how many apples are there?",
      options: [
        { id: "A", text: "1", isCorrect: false },
        { id: "B", text: "3", isCorrect: false },
        { id: "C", text: "4", isCorrect: true },
        { id: "D", text: "5", isCorrect: false },
      ],
      hint: "The LAST number you say when counting tells you the total!",
    },
    "K.CC.5": {
      questionText:
        "How many circles are there? 🔵🔵🔵🔵🔵🔵🔵🔵🔵",
      options: [
        { id: "A", text: "7", isCorrect: false },
        { id: "B", text: "8", isCorrect: false },
        { id: "C", text: "9", isCorrect: true },
        { id: "D", text: "10", isCorrect: false },
      ],
      hint: "Count each circle carefully, one at a time!",
    },
    "K.CC.6": {
      questionText:
        "Group A has 5 blocks. Group B has 3 blocks. Which group has MORE blocks?",
      options: [
        { id: "A", text: "Group A", isCorrect: true },
        { id: "B", text: "Group B", isCorrect: false },
        { id: "C", text: "They are the same", isCorrect: false },
        { id: "D", text: "Cannot tell", isCorrect: false },
      ],
      hint: "Which number is bigger: 5 or 3?",
    },
    "K.CC.7": {
      questionText: "Which number is greater: 4 or 7?",
      options: [
        { id: "A", text: "4", isCorrect: false },
        { id: "B", text: "7", isCorrect: true },
        { id: "C", text: "They are equal", isCorrect: false },
        { id: "D", text: "Neither", isCorrect: false },
      ],
      hint: "Think about counting — which number do you reach later?",
    },
    "1.OA.1": {
      questionText:
        "Cosmo had 8 stickers. He gave 3 to a friend. How many stickers does Cosmo have now?",
      options: [
        { id: "A", text: "11", isCorrect: false },
        { id: "B", text: "5", isCorrect: true },
        { id: "C", text: "6", isCorrect: false },
        { id: "D", text: "3", isCorrect: false },
      ],
      hint: "He gave some away, so he has FEWER. Try taking away 3 from 8.",
    },
    "1.OA.2": {
      questionText: "What is 4 + 5 + 3?",
      options: [
        { id: "A", text: "10", isCorrect: false },
        { id: "B", text: "11", isCorrect: false },
        { id: "C", text: "12", isCorrect: true },
        { id: "D", text: "13", isCorrect: false },
      ],
      hint: "Try adding the first two numbers, then add the third!",
    },
    "1.OA.3": {
      questionText: "If 3 + 5 = 8, what does 5 + 3 equal?",
      options: [
        { id: "A", text: "7", isCorrect: false },
        { id: "B", text: "8", isCorrect: true },
        { id: "C", text: "9", isCorrect: false },
        { id: "D", text: "15", isCorrect: false },
      ],
      hint: "When you swap the numbers you're adding, does the answer change?",
    },
    "1.OA.4": {
      questionText: "10 - 6 = ? Think: what number plus 6 equals 10?",
      options: [
        { id: "A", text: "3", isCorrect: false },
        { id: "B", text: "4", isCorrect: true },
        { id: "C", text: "5", isCorrect: false },
        { id: "D", text: "16", isCorrect: false },
      ],
      hint: "Think: 6 + ? = 10. What number fills the blank?",
    },
    "1.OA.5": {
      questionText:
        "You are on number 7. You count on 3 more. What number do you land on?",
      options: [
        { id: "A", text: "9", isCorrect: false },
        { id: "B", text: "10", isCorrect: true },
        { id: "C", text: "11", isCorrect: false },
        { id: "D", text: "4", isCorrect: false },
      ],
      hint: "Start at 7 and count: 8, 9, ...?",
    },
    "1.OA.6": {
      questionText: "What is 14 - 7?",
      options: [
        { id: "A", text: "6", isCorrect: false },
        { id: "B", text: "7", isCorrect: true },
        { id: "C", text: "8", isCorrect: false },
        { id: "D", text: "21", isCorrect: false },
      ],
      hint: "Think of a doubles fact: 7 + 7 = ?",
    },
    "1.OA.7": {
      questionText: "Is this equation true or false? 5 + 3 = 4 + 4",
      options: [
        { id: "A", text: "True", isCorrect: true },
        { id: "B", text: "False", isCorrect: false },
        { id: "C", text: "Cannot tell", isCorrect: false },
        { id: "D", text: "Only the left side is correct", isCorrect: false },
      ],
      hint: "Calculate both sides separately. Do they equal the same number?",
    },
    "1.OA.8": {
      questionText: "Find the missing number: 8 + ___ = 15",
      options: [
        { id: "A", text: "6", isCorrect: false },
        { id: "B", text: "7", isCorrect: true },
        { id: "C", text: "8", isCorrect: false },
        { id: "D", text: "23", isCorrect: false },
      ],
      hint: "What do you need to add to 8 to get 15? Try counting up from 8.",
    },
    "1.NBT.1": {
      questionText: "What number comes right after 109?",
      options: [
        { id: "A", text: "110", isCorrect: true },
        { id: "B", text: "111", isCorrect: false },
        { id: "C", text: "1010", isCorrect: false },
        { id: "D", text: "100", isCorrect: false },
      ],
      hint: "Count forward from 109. What comes next?",
    },
    "1.NBT.2": {
      questionText: "In the number 34, what does the digit 3 represent?",
      options: [
        { id: "A", text: "3 ones", isCorrect: false },
        { id: "B", text: "3 tens (which is 30)", isCorrect: true },
        { id: "C", text: "Just the number 3", isCorrect: false },
        { id: "D", text: "34", isCorrect: false },
      ],
      hint: "The digit on the LEFT side of a two-digit number tells us how many TENS.",
    },
    "1.NBT.3": {
      questionText: "Which symbol makes this correct? 47 ___ 52",
      options: [
        { id: "A", text: ">", isCorrect: false },
        { id: "B", text: "<", isCorrect: true },
        { id: "C", text: "=", isCorrect: false },
        { id: "D", text: "None of these", isCorrect: false },
      ],
      hint: "Compare the tens first. 4 tens vs 5 tens — which is more?",
    },
    "1.NBT.4": {
      questionText: "What is 37 + 20?",
      options: [
        { id: "A", text: "39", isCorrect: false },
        { id: "B", text: "47", isCorrect: false },
        { id: "C", text: "57", isCorrect: true },
        { id: "D", text: "55", isCorrect: false },
      ],
      hint: "Adding 20 means adding 2 more tens. 3 tens + 2 tens = ?",
    },
    "1.NBT.5": {
      questionText: "What is 10 more than 63?",
      options: [
        { id: "A", text: "64", isCorrect: false },
        { id: "B", text: "73", isCorrect: true },
        { id: "C", text: "53", isCorrect: false },
        { id: "D", text: "163", isCorrect: false },
      ],
      hint: "Adding 10 means the tens digit goes up by 1, but the ones stay the same!",
    },
    "1.NBT.6": {
      questionText: "What is 70 - 30?",
      options: [
        { id: "A", text: "30", isCorrect: false },
        { id: "B", text: "40", isCorrect: true },
        { id: "C", text: "50", isCorrect: false },
        { id: "D", text: "100", isCorrect: false },
      ],
      hint: "Think in tens: 7 tens minus 3 tens = ? tens",
    },
  };

  const fb = fallbacks[nodeCode];
  if (!fb) return null;

  const nodeInfo = getNodeInfo(nodeCode);

  return {
    questionId: `diag-${nodeCode}-${Date.now()}`,
    nodeCode,
    nodeTitle: nodeInfo?.title ?? nodeCode,
    gradeLevel: nodeInfo?.gradeLevel ?? "K",
    domain: nodeInfo?.domain ?? "COUNTING",
    difficulty: nodeInfo?.difficulty ?? 1,
    questionText: fb.questionText,
    options: fb.options,
    hint: fb.hint,
  };
}

function getNodeInfo(
  nodeCode: string
): { title: string; gradeLevel: string; domain: string; difficulty: number } | null {
  const nodes: Record<
    string,
    { title: string; gradeLevel: string; domain: string; difficulty: number }
  > = {
    "K.CC.1": { title: "Count to 100 by Ones and Tens", gradeLevel: "K", domain: "COUNTING", difficulty: 1 },
    "K.CC.2": { title: "Count Forward from a Given Number", gradeLevel: "K", domain: "COUNTING", difficulty: 2 },
    "K.CC.3": { title: "Write Numbers 0 to 20", gradeLevel: "K", domain: "COUNTING", difficulty: 2 },
    "K.CC.4": { title: "Understand Counting and Cardinality", gradeLevel: "K", domain: "COUNTING", difficulty: 3 },
    "K.CC.5": { title: "Count to Answer 'How Many?'", gradeLevel: "K", domain: "COUNTING", difficulty: 3 },
    "K.CC.6": { title: "Identify Greater/Less/Equal", gradeLevel: "K", domain: "COUNTING", difficulty: 4 },
    "K.CC.7": { title: "Compare Two Numbers Between 1 and 10", gradeLevel: "K", domain: "COUNTING", difficulty: 4 },
    "1.OA.1": { title: "Addition and Subtraction Word Problems to 20", gradeLevel: "1", domain: "OPERATIONS", difficulty: 3 },
    "1.OA.2": { title: "Addition Word Problems with Three Numbers", gradeLevel: "1", domain: "OPERATIONS", difficulty: 4 },
    "1.OA.3": { title: "Commutative and Associative Properties", gradeLevel: "1", domain: "OPERATIONS", difficulty: 5 },
    "1.OA.4": { title: "Subtraction as Unknown-Addend Problem", gradeLevel: "1", domain: "OPERATIONS", difficulty: 5 },
    "1.OA.5": { title: "Relate Counting to Addition and Subtraction", gradeLevel: "1", domain: "OPERATIONS", difficulty: 3 },
    "1.OA.6": { title: "Add and Subtract Within 20", gradeLevel: "1", domain: "OPERATIONS", difficulty: 5 },
    "1.OA.7": { title: "Understand the Meaning of the Equal Sign", gradeLevel: "1", domain: "OPERATIONS", difficulty: 4 },
    "1.OA.8": { title: "Determine Unknown in Equations", gradeLevel: "1", domain: "OPERATIONS", difficulty: 6 },
    "1.NBT.1": { title: "Count to 120", gradeLevel: "1", domain: "COUNTING", difficulty: 3 },
    "1.NBT.2": { title: "Understand Place Value (Tens and Ones)", gradeLevel: "1", domain: "COUNTING", difficulty: 5 },
    "1.NBT.3": { title: "Compare Two Two-Digit Numbers", gradeLevel: "1", domain: "COUNTING", difficulty: 5 },
    "1.NBT.4": { title: "Add Within 100", gradeLevel: "1", domain: "OPERATIONS", difficulty: 6 },
    "1.NBT.5": { title: "Find 10 More or 10 Less", gradeLevel: "1", domain: "OPERATIONS", difficulty: 5 },
    "1.NBT.6": { title: "Subtract Multiples of 10", gradeLevel: "1", domain: "OPERATIONS", difficulty: 6 },
  };
  return nodes[nodeCode] ?? null;
}
