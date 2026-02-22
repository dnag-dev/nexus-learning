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

    // ─── Grade 2 ───
    "2.OA.1": {
      questionText: "There were 45 birds in a tree. 18 flew away. How many birds are left in the tree?",
      options: [
        { id: "A", text: "27", isCorrect: true },
        { id: "B", text: "37", isCorrect: false },
        { id: "C", text: "23", isCorrect: false },
        { id: "D", text: "63", isCorrect: false },
      ],
      hint: "Start at 45 and take away 18. You can break 18 into 10 and 8 to make it easier!",
    },
    "2.OA.2": {
      questionText: "What is 9 + 6?",
      options: [
        { id: "A", text: "14", isCorrect: false },
        { id: "B", text: "15", isCorrect: true },
        { id: "C", text: "16", isCorrect: false },
        { id: "D", text: "13", isCorrect: false },
      ],
      hint: "Try making a 10 first: 9 + 1 = 10, then add 5 more!",
    },
    "2.OA.3": {
      questionText: "Is the number 13 odd or even?",
      options: [
        { id: "A", text: "Odd", isCorrect: true },
        { id: "B", text: "Even", isCorrect: false },
        { id: "C", text: "Both", isCorrect: false },
        { id: "D", text: "Neither", isCorrect: false },
      ],
      hint: "Try pairing up 13 objects in groups of 2. Is there one left over?",
    },
    "2.OA.4": {
      questionText: "Look at this array: 3 rows with 4 objects in each row. How many objects in all?",
      options: [
        { id: "A", text: "7", isCorrect: false },
        { id: "B", text: "12", isCorrect: true },
        { id: "C", text: "10", isCorrect: false },
        { id: "D", text: "34", isCorrect: false },
      ],
      hint: "Add equal groups: 4 + 4 + 4 = ?",
    },
    "2.NBT.1": {
      questionText: "In the number 357, what does the 3 represent?",
      options: [
        { id: "A", text: "3 ones", isCorrect: false },
        { id: "B", text: "3 tens", isCorrect: false },
        { id: "C", text: "3 hundreds (300)", isCorrect: true },
        { id: "D", text: "Just 3", isCorrect: false },
      ],
      hint: "The leftmost digit in a three-digit number tells us how many HUNDREDS.",
    },
    "2.NBT.2": {
      questionText: "Skip-count by 100s: 200, 300, 400, ___. What comes next?",
      options: [
        { id: "A", text: "410", isCorrect: false },
        { id: "B", text: "500", isCorrect: true },
        { id: "C", text: "450", isCorrect: false },
        { id: "D", text: "1000", isCorrect: false },
      ],
      hint: "When skip-counting by 100, add 100 each time!",
    },
    "2.NBT.3": {
      questionText: "How do you write 'four hundred sixty-two' as a number?",
      options: [
        { id: "A", text: "462", isCorrect: true },
        { id: "B", text: "4062", isCorrect: false },
        { id: "C", text: "46200", isCorrect: false },
        { id: "D", text: "426", isCorrect: false },
      ],
      hint: "Four hundred = 400, sixty = 60, two = 2. Put them together!",
    },
    "2.NBT.4": {
      questionText: "Which symbol makes this correct? 582 ___ 528",
      options: [
        { id: "A", text: "<", isCorrect: false },
        { id: "B", text: ">", isCorrect: true },
        { id: "C", text: "=", isCorrect: false },
        { id: "D", text: "Cannot tell", isCorrect: false },
      ],
      hint: "The hundreds are the same (5). Compare the tens: 8 tens vs 2 tens.",
    },
    "2.NBT.5": {
      questionText: "What is 56 + 37?",
      options: [
        { id: "A", text: "83", isCorrect: false },
        { id: "B", text: "93", isCorrect: true },
        { id: "C", text: "89", isCorrect: false },
        { id: "D", text: "73", isCorrect: false },
      ],
      hint: "Add the tens: 50 + 30 = 80. Add the ones: 6 + 7 = 13. Now combine!",
    },
    "2.NBT.7": {
      questionText: "What is 345 + 200?",
      options: [
        { id: "A", text: "365", isCorrect: false },
        { id: "B", text: "545", isCorrect: true },
        { id: "C", text: "347", isCorrect: false },
        { id: "D", text: "445", isCorrect: false },
      ],
      hint: "Adding 200 means adding 2 more hundreds. 3 hundreds + 2 hundreds = ?",
    },
    "2.MD.1": {
      questionText: "You want to measure the length of your desk. Which tool would be best?",
      options: [
        { id: "A", text: "A ruler", isCorrect: true },
        { id: "B", text: "A scale", isCorrect: false },
        { id: "C", text: "A clock", isCorrect: false },
        { id: "D", text: "A thermometer", isCorrect: false },
      ],
      hint: "Which tool measures how LONG something is?",
    },
    "2.MD.8": {
      questionText: "You have 2 quarters and 1 dime. How much money do you have?",
      options: [
        { id: "A", text: "35¢", isCorrect: false },
        { id: "B", text: "60¢", isCorrect: true },
        { id: "C", text: "55¢", isCorrect: false },
        { id: "D", text: "75¢", isCorrect: false },
      ],
      hint: "A quarter is 25¢ and a dime is 10¢. Add: 25 + 25 + 10 = ?",
    },
    "2.G.1": {
      questionText: "Which shape has exactly 3 sides and 3 angles?",
      options: [
        { id: "A", text: "Square", isCorrect: false },
        { id: "B", text: "Triangle", isCorrect: true },
        { id: "C", text: "Pentagon", isCorrect: false },
        { id: "D", text: "Hexagon", isCorrect: false },
      ],
      hint: "The prefix 'tri-' means three!",
    },

    // ─── Grade 3 ───
    "3.OA.1": {
      questionText: "There are 4 bags with 6 apples in each bag. How many apples in all? Which equation matches?",
      options: [
        { id: "A", text: "4 + 6 = 10", isCorrect: false },
        { id: "B", text: "4 × 6 = 24", isCorrect: true },
        { id: "C", text: "6 - 4 = 2", isCorrect: false },
        { id: "D", text: "6 ÷ 4 = 1.5", isCorrect: false },
      ],
      hint: "When you have equal groups, you can MULTIPLY: number of groups × objects in each group.",
    },
    "3.OA.2": {
      questionText: "18 cookies are shared equally among 3 friends. How many cookies does each friend get?",
      options: [
        { id: "A", text: "5", isCorrect: false },
        { id: "B", text: "6", isCorrect: true },
        { id: "C", text: "15", isCorrect: false },
        { id: "D", text: "21", isCorrect: false },
      ],
      hint: "Sharing equally is DIVISION: 18 ÷ 3 = ?",
    },
    "3.OA.3": {
      questionText: "A bookshelf has 5 shelves with 7 books on each shelf. How many books are there in total?",
      options: [
        { id: "A", text: "12", isCorrect: false },
        { id: "B", text: "35", isCorrect: true },
        { id: "C", text: "30", isCorrect: false },
        { id: "D", text: "57", isCorrect: false },
      ],
      hint: "Equal groups means multiply: 5 × 7 = ?",
    },
    "3.OA.4": {
      questionText: "Find the missing number: 7 × ___ = 42",
      options: [
        { id: "A", text: "5", isCorrect: false },
        { id: "B", text: "6", isCorrect: true },
        { id: "C", text: "7", isCorrect: false },
        { id: "D", text: "8", isCorrect: false },
      ],
      hint: "Think: 42 ÷ 7 = ? Or count by 7s until you reach 42.",
    },
    "3.OA.5": {
      questionText: "If 6 × 4 = 24, what does 4 × 6 equal?",
      options: [
        { id: "A", text: "10", isCorrect: false },
        { id: "B", text: "24", isCorrect: true },
        { id: "C", text: "20", isCorrect: false },
        { id: "D", text: "46", isCorrect: false },
      ],
      hint: "Switching the order of numbers in multiplication does not change the answer. This is the commutative property!",
    },
    "3.OA.7": {
      questionText: "What is 8 × 7?",
      options: [
        { id: "A", text: "54", isCorrect: false },
        { id: "B", text: "56", isCorrect: true },
        { id: "C", text: "48", isCorrect: false },
        { id: "D", text: "63", isCorrect: false },
      ],
      hint: "Think of 8 × 7 as (8 × 5) + (8 × 2) = 40 + 16 = ?",
    },
    "3.OA.8": {
      questionText: "Emma had 48 stickers. She gave 12 away and then bought 7 more. How many stickers does she have now?",
      options: [
        { id: "A", text: "43", isCorrect: true },
        { id: "B", text: "29", isCorrect: false },
        { id: "C", text: "53", isCorrect: false },
        { id: "D", text: "67", isCorrect: false },
      ],
      hint: "Do it in two steps: first 48 - 12 = ?, then add 7 more.",
    },
    "3.OA.9": {
      questionText: "Look at this pattern: 3, 6, 9, 12, ___. What comes next?",
      options: [
        { id: "A", text: "13", isCorrect: false },
        { id: "B", text: "15", isCorrect: true },
        { id: "C", text: "14", isCorrect: false },
        { id: "D", text: "18", isCorrect: false },
      ],
      hint: "The pattern adds 3 each time. 12 + 3 = ?",
    },
    "3.NBT.1": {
      questionText: "Round 67 to the nearest ten.",
      options: [
        { id: "A", text: "60", isCorrect: false },
        { id: "B", text: "70", isCorrect: true },
        { id: "C", text: "65", isCorrect: false },
        { id: "D", text: "100", isCorrect: false },
      ],
      hint: "Look at the ones digit (7). Is it 5 or more? If yes, round up!",
    },
    "3.NBT.2": {
      questionText: "What is 482 + 315?",
      options: [
        { id: "A", text: "797", isCorrect: true },
        { id: "B", text: "697", isCorrect: false },
        { id: "C", text: "787", isCorrect: false },
        { id: "D", text: "897", isCorrect: false },
      ],
      hint: "Add hundreds: 400+300=700. Add tens: 80+10=90. Add ones: 2+5=7.",
    },
    "3.NF.1": {
      questionText: "A pizza is cut into 4 equal slices. You eat 1 slice. What fraction of the pizza did you eat?",
      options: [
        { id: "A", text: "1/2", isCorrect: false },
        { id: "B", text: "1/4", isCorrect: true },
        { id: "C", text: "1/3", isCorrect: false },
        { id: "D", text: "4/1", isCorrect: false },
      ],
      hint: "You ate 1 part out of 4 equal parts. That's 1 over 4.",
    },
    "3.NF.2": {
      questionText: "Where does 1/2 go on a number line from 0 to 1?",
      options: [
        { id: "A", text: "Right at 0", isCorrect: false },
        { id: "B", text: "Exactly in the middle between 0 and 1", isCorrect: true },
        { id: "C", text: "Right at 1", isCorrect: false },
        { id: "D", text: "Past 1", isCorrect: false },
      ],
      hint: "1/2 means halfway. Find the middle point between 0 and 1.",
    },
    "3.NF.3": {
      questionText: "Which fraction is the same as 2/4?",
      options: [
        { id: "A", text: "1/2", isCorrect: true },
        { id: "B", text: "3/4", isCorrect: false },
        { id: "C", text: "2/3", isCorrect: false },
        { id: "D", text: "1/4", isCorrect: false },
      ],
      hint: "If you simplify 2/4 by dividing top and bottom by 2, what do you get?",
    },
    "3.MD.7": {
      questionText: "A rectangle is 5 units long and 3 units wide. What is its area?",
      options: [
        { id: "A", text: "8 square units", isCorrect: false },
        { id: "B", text: "15 square units", isCorrect: true },
        { id: "C", text: "16 square units", isCorrect: false },
        { id: "D", text: "53 square units", isCorrect: false },
      ],
      hint: "Area of a rectangle = length × width. So 5 × 3 = ?",
    },
    "3.G.1": {
      questionText: "Which of these is a quadrilateral?",
      options: [
        { id: "A", text: "Triangle", isCorrect: false },
        { id: "B", text: "Rectangle", isCorrect: true },
        { id: "C", text: "Circle", isCorrect: false },
        { id: "D", text: "Pentagon", isCorrect: false },
      ],
      hint: "'Quad' means four. A quadrilateral has exactly 4 sides.",
    },

    // ─── Grade 4 ───
    "4.OA.1": {
      questionText: "Sara has 3 times as many stickers as Jake. Jake has 8 stickers. How many does Sara have?",
      options: [
        { id: "A", text: "11", isCorrect: false },
        { id: "B", text: "24", isCorrect: true },
        { id: "C", text: "5", isCorrect: false },
        { id: "D", text: "38", isCorrect: false },
      ],
      hint: "'3 times as many' means multiply: 3 × 8 = ?",
    },
    "4.OA.2": {
      questionText: "A rope is 36 feet long. It is 4 times as long as a shorter rope. How long is the shorter rope?",
      options: [
        { id: "A", text: "32 feet", isCorrect: false },
        { id: "B", text: "9 feet", isCorrect: true },
        { id: "C", text: "40 feet", isCorrect: false },
        { id: "D", text: "8 feet", isCorrect: false },
      ],
      hint: "If the long rope is 4 TIMES the short rope, divide: 36 ÷ 4 = ?",
    },
    "4.OA.3": {
      questionText: "A store has 256 apples. They sell 89 in the morning and 67 in the afternoon. How many are left?",
      options: [
        { id: "A", text: "100", isCorrect: true },
        { id: "B", text: "110", isCorrect: false },
        { id: "C", text: "90", isCorrect: false },
        { id: "D", text: "156", isCorrect: false },
      ],
      hint: "First find total sold: 89 + 67. Then subtract from 256.",
    },
    "4.OA.4": {
      questionText: "Which of these numbers is a prime number?",
      options: [
        { id: "A", text: "9", isCorrect: false },
        { id: "B", text: "15", isCorrect: false },
        { id: "C", text: "17", isCorrect: true },
        { id: "D", text: "21", isCorrect: false },
      ],
      hint: "A prime number has exactly 2 factors: 1 and itself. Can you divide 17 evenly by anything other than 1 and 17?",
    },
    "4.NBT.1": {
      questionText: "In the number 4,500, the digit 5 is in the hundreds place. It represents 500. What would the 5 represent if it moved one place to the LEFT?",
      options: [
        { id: "A", text: "50", isCorrect: false },
        { id: "B", text: "500", isCorrect: false },
        { id: "C", text: "5,000", isCorrect: true },
        { id: "D", text: "50,000", isCorrect: false },
      ],
      hint: "Moving one place to the left makes a digit worth 10 TIMES more.",
    },
    "4.NBT.2": {
      questionText: "Which is the correct way to write 30,000 + 5,000 + 200 + 40 + 6 as one number?",
      options: [
        { id: "A", text: "35,246", isCorrect: true },
        { id: "B", text: "3,524,600", isCorrect: false },
        { id: "C", text: "352,460", isCorrect: false },
        { id: "D", text: "35,264", isCorrect: false },
      ],
      hint: "Add each place value together: 30,000 + 5,000 + 200 + 40 + 6.",
    },
    "4.NBT.3": {
      questionText: "Round 4,738 to the nearest hundred.",
      options: [
        { id: "A", text: "4,700", isCorrect: true },
        { id: "B", text: "4,800", isCorrect: false },
        { id: "C", text: "5,000", isCorrect: false },
        { id: "D", text: "4,740", isCorrect: false },
      ],
      hint: "Look at the tens digit (3). Is it 5 or more? If not, round down.",
    },
    "4.NBT.4": {
      questionText: "What is 5,247 + 3,684?",
      options: [
        { id: "A", text: "8,931", isCorrect: true },
        { id: "B", text: "8,831", isCorrect: false },
        { id: "C", text: "9,031", isCorrect: false },
        { id: "D", text: "8,921", isCorrect: false },
      ],
      hint: "Line up the digits by place value and add from right to left. Don't forget to carry!",
    },
    "4.NBT.5": {
      questionText: "What is 26 × 4?",
      options: [
        { id: "A", text: "84", isCorrect: false },
        { id: "B", text: "104", isCorrect: true },
        { id: "C", text: "96", isCorrect: false },
        { id: "D", text: "114", isCorrect: false },
      ],
      hint: "Break it up: (20 × 4) + (6 × 4) = 80 + 24 = ?",
    },
    "4.NBT.6": {
      questionText: "What is 96 ÷ 4?",
      options: [
        { id: "A", text: "22", isCorrect: false },
        { id: "B", text: "24", isCorrect: true },
        { id: "C", text: "26", isCorrect: false },
        { id: "D", text: "20", isCorrect: false },
      ],
      hint: "Think: 4 × ? = 96. Or break it up: 80 ÷ 4 = 20, and 16 ÷ 4 = 4. Add them!",
    },
    "4.NF.1": {
      questionText: "Which fraction is equivalent to 2/3?",
      options: [
        { id: "A", text: "4/6", isCorrect: true },
        { id: "B", text: "3/4", isCorrect: false },
        { id: "C", text: "2/6", isCorrect: false },
        { id: "D", text: "4/3", isCorrect: false },
      ],
      hint: "Multiply both the numerator and denominator by the same number. 2×2 = 4, 3×2 = 6.",
    },
    "4.NF.2": {
      questionText: "Which is greater: 3/8 or 5/8?",
      options: [
        { id: "A", text: "3/8", isCorrect: false },
        { id: "B", text: "5/8", isCorrect: true },
        { id: "C", text: "They are equal", isCorrect: false },
        { id: "D", text: "Cannot compare", isCorrect: false },
      ],
      hint: "When denominators are the same, just compare the numerators. Which is bigger: 3 or 5?",
    },
    "4.NF.3": {
      questionText: "What is 3/8 + 2/8?",
      options: [
        { id: "A", text: "5/16", isCorrect: false },
        { id: "B", text: "5/8", isCorrect: true },
        { id: "C", text: "6/8", isCorrect: false },
        { id: "D", text: "1/8", isCorrect: false },
      ],
      hint: "When denominators are the same, add the numerators and keep the denominator: 3 + 2 = ?",
    },
    "4.NF.4": {
      questionText: "What is 3 × 2/5?",
      options: [
        { id: "A", text: "6/5", isCorrect: true },
        { id: "B", text: "6/15", isCorrect: false },
        { id: "C", text: "5/5", isCorrect: false },
        { id: "D", text: "2/15", isCorrect: false },
      ],
      hint: "Multiply the whole number by the numerator: 3 × 2 = 6. Keep the denominator: 6/5.",
    },
    "4.MD.3": {
      questionText: "A rectangle is 8 meters long and 5 meters wide. What is its perimeter?",
      options: [
        { id: "A", text: "13 meters", isCorrect: false },
        { id: "B", text: "26 meters", isCorrect: true },
        { id: "C", text: "40 meters", isCorrect: false },
        { id: "D", text: "30 meters", isCorrect: false },
      ],
      hint: "Perimeter = 2 × (length + width) = 2 × (8 + 5) = ?",
    },
    "4.G.1": {
      questionText: "Which pair of lines will NEVER cross, no matter how far they extend?",
      options: [
        { id: "A", text: "Perpendicular lines", isCorrect: false },
        { id: "B", text: "Parallel lines", isCorrect: true },
        { id: "C", text: "Intersecting lines", isCorrect: false },
        { id: "D", text: "Curved lines", isCorrect: false },
      ],
      hint: "Think of railroad tracks — they go in the same direction and never meet.",
    },

    // ─── Grade 5 ───
    "5.OA.1": {
      questionText: "What is the value of 3 × (4 + 2)?",
      options: [
        { id: "A", text: "14", isCorrect: false },
        { id: "B", text: "18", isCorrect: true },
        { id: "C", text: "10", isCorrect: false },
        { id: "D", text: "24", isCorrect: false },
      ],
      hint: "Do the parentheses first: 4 + 2 = 6. Then multiply: 3 × 6 = ?",
    },
    "5.OA.2": {
      questionText: "Which expression means 'add 8 and 3, then multiply by 2'?",
      options: [
        { id: "A", text: "8 + 3 × 2", isCorrect: false },
        { id: "B", text: "(8 + 3) × 2", isCorrect: true },
        { id: "C", text: "8 × 2 + 3", isCorrect: false },
        { id: "D", text: "2 × 8 + 3", isCorrect: false },
      ],
      hint: "Use parentheses to show what should be done FIRST.",
    },
    "5.OA.3": {
      questionText: "Rule 1: start at 0, add 3. Rule 2: start at 0, add 6. What pair comes at step 3? (Rule1, Rule2)",
      options: [
        { id: "A", text: "(9, 18)", isCorrect: true },
        { id: "B", text: "(6, 12)", isCorrect: false },
        { id: "C", text: "(9, 12)", isCorrect: false },
        { id: "D", text: "(3, 6)", isCorrect: false },
      ],
      hint: "Step 3 for Rule 1: 3+3+3=9. Step 3 for Rule 2: 6+6+6=18.",
    },
    "5.NBT.1": {
      questionText: "In the number 0.45, the digit 4 is in the tenths place. What is its value?",
      options: [
        { id: "A", text: "4", isCorrect: false },
        { id: "B", text: "0.4", isCorrect: true },
        { id: "C", text: "0.04", isCorrect: false },
        { id: "D", text: "40", isCorrect: false },
      ],
      hint: "The tenths place is the first digit after the decimal point. 4 tenths = 4/10 = 0.4.",
    },
    "5.NBT.2": {
      questionText: "What is 3.7 × 10?",
      options: [
        { id: "A", text: "3.70", isCorrect: false },
        { id: "B", text: "37", isCorrect: true },
        { id: "C", text: "370", isCorrect: false },
        { id: "D", text: "0.37", isCorrect: false },
      ],
      hint: "Multiplying by 10 moves the decimal point one place to the RIGHT.",
    },
    "5.NBT.3": {
      questionText: "Which is greater: 0.65 or 0.7?",
      options: [
        { id: "A", text: "0.65", isCorrect: false },
        { id: "B", text: "0.7", isCorrect: true },
        { id: "C", text: "They are equal", isCorrect: false },
        { id: "D", text: "Cannot compare", isCorrect: false },
      ],
      hint: "Rewrite 0.7 as 0.70. Now compare: 70 hundredths vs 65 hundredths.",
    },
    "5.NBT.5": {
      questionText: "What is 234 × 16?",
      options: [
        { id: "A", text: "3,744", isCorrect: true },
        { id: "B", text: "3,504", isCorrect: false },
        { id: "C", text: "2,574", isCorrect: false },
        { id: "D", text: "3,844", isCorrect: false },
      ],
      hint: "Break it up: (234 × 10) + (234 × 6) = 2,340 + 1,404 = ?",
    },
    "5.NBT.6": {
      questionText: "What is 1,260 ÷ 15?",
      options: [
        { id: "A", text: "84", isCorrect: true },
        { id: "B", text: "80", isCorrect: false },
        { id: "C", text: "90", isCorrect: false },
        { id: "D", text: "126", isCorrect: false },
      ],
      hint: "Try: 15 × 80 = 1,200, so 1,260 - 1,200 = 60. Then 60 ÷ 15 = 4. So 80 + 4 = ?",
    },
    "5.NBT.7": {
      questionText: "What is 3.5 + 2.75?",
      options: [
        { id: "A", text: "5.25", isCorrect: false },
        { id: "B", text: "6.25", isCorrect: true },
        { id: "C", text: "5.75", isCorrect: false },
        { id: "D", text: "6.0", isCorrect: false },
      ],
      hint: "Line up the decimal points: 3.50 + 2.75. Add the hundredths, then tenths, then ones.",
    },
    "5.NF.1": {
      questionText: "What is 1/3 + 1/6?",
      options: [
        { id: "A", text: "2/9", isCorrect: false },
        { id: "B", text: "1/2", isCorrect: true },
        { id: "C", text: "2/6", isCorrect: false },
        { id: "D", text: "1/9", isCorrect: false },
      ],
      hint: "Find a common denominator. 1/3 = 2/6. Now add: 2/6 + 1/6 = 3/6 = ?",
    },
    "5.NF.2": {
      questionText: "Tom ate 2/5 of a pie. Anna ate 1/4 of the same pie. How much of the pie did they eat together?",
      options: [
        { id: "A", text: "3/9", isCorrect: false },
        { id: "B", text: "13/20", isCorrect: true },
        { id: "C", text: "3/20", isCorrect: false },
        { id: "D", text: "1/2", isCorrect: false },
      ],
      hint: "Find a common denominator for 5 and 4: it's 20. Then 2/5 = 8/20 and 1/4 = 5/20. Add them!",
    },
    "5.NF.3": {
      questionText: "3 pizzas are shared equally among 4 people. How much does each person get?",
      options: [
        { id: "A", text: "1 pizza", isCorrect: false },
        { id: "B", text: "3/4 of a pizza", isCorrect: true },
        { id: "C", text: "4/3 of a pizza", isCorrect: false },
        { id: "D", text: "1/4 of a pizza", isCorrect: false },
      ],
      hint: "Sharing 3 things among 4 people is the same as 3 ÷ 4 = 3/4.",
    },
    "5.NF.4": {
      questionText: "What is 2/3 × 3/4?",
      options: [
        { id: "A", text: "6/7", isCorrect: false },
        { id: "B", text: "1/2", isCorrect: true },
        { id: "C", text: "5/7", isCorrect: false },
        { id: "D", text: "6/12", isCorrect: false },
      ],
      hint: "Multiply numerators: 2×3=6. Multiply denominators: 3×4=12. Simplify 6/12 = ?",
    },
    "5.NF.6": {
      questionText: "A recipe needs 2/3 cup of sugar. If you make 1 1/2 batches, how much sugar do you need?",
      options: [
        { id: "A", text: "1 cup", isCorrect: true },
        { id: "B", text: "2/3 cup", isCorrect: false },
        { id: "C", text: "1 1/3 cups", isCorrect: false },
        { id: "D", text: "3/4 cup", isCorrect: false },
      ],
      hint: "Multiply: 2/3 × 3/2 (since 1 1/2 = 3/2). Numerators: 2×3=6. Denominators: 3×2=6. So 6/6 = ?",
    },
    "5.MD.1": {
      questionText: "How many centimeters are in 3 meters?",
      options: [
        { id: "A", text: "30", isCorrect: false },
        { id: "B", text: "300", isCorrect: true },
        { id: "C", text: "3,000", isCorrect: false },
        { id: "D", text: "0.03", isCorrect: false },
      ],
      hint: "1 meter = 100 centimeters. So 3 meters = 3 × 100 = ?",
    },
    "5.MD.3": {
      questionText: "A box is 4 cm long, 3 cm wide, and 2 cm tall. What is its volume?",
      options: [
        { id: "A", text: "9 cubic cm", isCorrect: false },
        { id: "B", text: "24 cubic cm", isCorrect: true },
        { id: "C", text: "20 cubic cm", isCorrect: false },
        { id: "D", text: "14 cubic cm", isCorrect: false },
      ],
      hint: "Volume = length × width × height = 4 × 3 × 2 = ?",
    },
    "5.G.1": {
      questionText: "What ordered pair represents a point that is 3 units right and 5 units up from the origin?",
      options: [
        { id: "A", text: "(5, 3)", isCorrect: false },
        { id: "B", text: "(3, 5)", isCorrect: true },
        { id: "C", text: "(3, 3)", isCorrect: false },
        { id: "D", text: "(5, 5)", isCorrect: false },
      ],
      hint: "In an ordered pair (x, y), x is the horizontal distance (right) and y is the vertical distance (up).",
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
    // Grade 2
    "2.OA.1": { title: "Add and Subtract Within 100 Word Problems", gradeLevel: "2", domain: "OPERATIONS", difficulty: 4 },
    "2.OA.2": { title: "Fluently Add and Subtract Within 20", gradeLevel: "2", domain: "OPERATIONS", difficulty: 3 },
    "2.OA.3": { title: "Determine Odd or Even", gradeLevel: "2", domain: "OPERATIONS", difficulty: 4 },
    "2.OA.4": { title: "Use Addition for Rectangular Arrays", gradeLevel: "2", domain: "OPERATIONS", difficulty: 5 },
    "2.NBT.1": { title: "Understand Place Value: Hundreds, Tens, Ones", gradeLevel: "2", domain: "COUNTING", difficulty: 5 },
    "2.NBT.2": { title: "Count Within 1000 and Skip-Count", gradeLevel: "2", domain: "COUNTING", difficulty: 4 },
    "2.NBT.3": { title: "Read and Write Numbers to 1000", gradeLevel: "2", domain: "COUNTING", difficulty: 5 },
    "2.NBT.4": { title: "Compare Two Three-Digit Numbers", gradeLevel: "2", domain: "COUNTING", difficulty: 5 },
    "2.NBT.5": { title: "Fluently Add and Subtract Within 100", gradeLevel: "2", domain: "OPERATIONS", difficulty: 5 },
    "2.NBT.7": { title: "Add and Subtract Within 1000", gradeLevel: "2", domain: "OPERATIONS", difficulty: 6 },
    "2.MD.1": { title: "Measure Length Using Appropriate Tools", gradeLevel: "2", domain: "MEASUREMENT", difficulty: 4 },
    "2.MD.8": { title: "Solve Word Problems Involving Money", gradeLevel: "2", domain: "MEASUREMENT", difficulty: 6 },
    "2.G.1": { title: "Recognize and Draw Shapes", gradeLevel: "2", domain: "GEOMETRY", difficulty: 3 },
    // Grade 3
    "3.OA.1": { title: "Interpret Products of Whole Numbers", gradeLevel: "3", domain: "OPERATIONS", difficulty: 4 },
    "3.OA.2": { title: "Interpret Whole-Number Quotients", gradeLevel: "3", domain: "OPERATIONS", difficulty: 5 },
    "3.OA.3": { title: "Multiply and Divide Word Problems", gradeLevel: "3", domain: "OPERATIONS", difficulty: 5 },
    "3.OA.4": { title: "Determine Unknown in Multiplication/Division", gradeLevel: "3", domain: "OPERATIONS", difficulty: 6 },
    "3.OA.5": { title: "Apply Properties of Multiplication", gradeLevel: "3", domain: "OPERATIONS", difficulty: 6 },
    "3.OA.7": { title: "Fluently Multiply and Divide Within 100", gradeLevel: "3", domain: "OPERATIONS", difficulty: 6 },
    "3.OA.8": { title: "Two-Step Word Problems", gradeLevel: "3", domain: "OPERATIONS", difficulty: 7 },
    "3.OA.9": { title: "Identify Arithmetic Patterns", gradeLevel: "3", domain: "OPERATIONS", difficulty: 5 },
    "3.NBT.1": { title: "Round Whole Numbers to Nearest 10 or 100", gradeLevel: "3", domain: "COUNTING", difficulty: 4 },
    "3.NBT.2": { title: "Fluently Add and Subtract Within 1000", gradeLevel: "3", domain: "OPERATIONS", difficulty: 5 },
    "3.NF.1": { title: "Understand Fractions as Parts of a Whole", gradeLevel: "3", domain: "OPERATIONS", difficulty: 5 },
    "3.NF.2": { title: "Understand Fractions on a Number Line", gradeLevel: "3", domain: "OPERATIONS", difficulty: 6 },
    "3.NF.3": { title: "Explain Fraction Equivalence and Comparison", gradeLevel: "3", domain: "OPERATIONS", difficulty: 7 },
    "3.MD.7": { title: "Relate Area to Multiplication and Addition", gradeLevel: "3", domain: "MEASUREMENT", difficulty: 6 },
    "3.G.1": { title: "Understand Categories of Shapes", gradeLevel: "3", domain: "GEOMETRY", difficulty: 4 },
    // Grade 4
    "4.OA.1": { title: "Interpret Multiplication as Comparison", gradeLevel: "4", domain: "OPERATIONS", difficulty: 5 },
    "4.OA.2": { title: "Multiplicative Comparison Word Problems", gradeLevel: "4", domain: "OPERATIONS", difficulty: 6 },
    "4.OA.3": { title: "Multi-Step Word Problems", gradeLevel: "4", domain: "OPERATIONS", difficulty: 7 },
    "4.OA.4": { title: "Factor Pairs and Prime/Composite Numbers", gradeLevel: "4", domain: "OPERATIONS", difficulty: 6 },
    "4.NBT.1": { title: "Generalize Place Value Understanding", gradeLevel: "4", domain: "COUNTING", difficulty: 5 },
    "4.NBT.2": { title: "Read, Write, and Compare Multi-Digit Numbers", gradeLevel: "4", domain: "COUNTING", difficulty: 5 },
    "4.NBT.3": { title: "Round Multi-Digit Whole Numbers", gradeLevel: "4", domain: "COUNTING", difficulty: 5 },
    "4.NBT.4": { title: "Fluently Add and Subtract Multi-Digit Numbers", gradeLevel: "4", domain: "OPERATIONS", difficulty: 5 },
    "4.NBT.5": { title: "Multiply up to Four-Digit by One-Digit", gradeLevel: "4", domain: "OPERATIONS", difficulty: 7 },
    "4.NBT.6": { title: "Divide up to Four-Digit by One-Digit", gradeLevel: "4", domain: "OPERATIONS", difficulty: 7 },
    "4.NF.1": { title: "Explain Fraction Equivalence with Visual Models", gradeLevel: "4", domain: "OPERATIONS", difficulty: 6 },
    "4.NF.2": { title: "Compare Fractions with Different Denominators", gradeLevel: "4", domain: "OPERATIONS", difficulty: 6 },
    "4.NF.3": { title: "Add and Subtract Fractions (Same Denominator)", gradeLevel: "4", domain: "OPERATIONS", difficulty: 6 },
    "4.NF.4": { title: "Multiply a Fraction by a Whole Number", gradeLevel: "4", domain: "OPERATIONS", difficulty: 7 },
    "4.MD.3": { title: "Apply Area and Perimeter Formulas", gradeLevel: "4", domain: "MEASUREMENT", difficulty: 6 },
    "4.G.1": { title: "Draw and Identify Lines, Angles, and Shapes", gradeLevel: "4", domain: "GEOMETRY", difficulty: 5 },
    // Grade 5
    "5.OA.1": { title: "Use Grouping Symbols in Expressions", gradeLevel: "5", domain: "OPERATIONS", difficulty: 6 },
    "5.OA.2": { title: "Write and Interpret Numerical Expressions", gradeLevel: "5", domain: "OPERATIONS", difficulty: 6 },
    "5.OA.3": { title: "Generate and Analyze Patterns", gradeLevel: "5", domain: "OPERATIONS", difficulty: 7 },
    "5.NBT.1": { title: "Understand the Place Value System", gradeLevel: "5", domain: "COUNTING", difficulty: 6 },
    "5.NBT.2": { title: "Explain Powers of 10 Patterns", gradeLevel: "5", domain: "COUNTING", difficulty: 6 },
    "5.NBT.3": { title: "Read, Write, and Compare Decimals", gradeLevel: "5", domain: "COUNTING", difficulty: 6 },
    "5.NBT.5": { title: "Fluently Multiply Multi-Digit Whole Numbers", gradeLevel: "5", domain: "OPERATIONS", difficulty: 6 },
    "5.NBT.6": { title: "Divide Multi-Digit Numbers", gradeLevel: "5", domain: "OPERATIONS", difficulty: 7 },
    "5.NBT.7": { title: "Add, Subtract, Multiply, and Divide Decimals", gradeLevel: "5", domain: "OPERATIONS", difficulty: 7 },
    "5.NF.1": { title: "Add and Subtract Fractions (Unlike Denominators)", gradeLevel: "5", domain: "OPERATIONS", difficulty: 7 },
    "5.NF.2": { title: "Fraction Addition/Subtraction Word Problems", gradeLevel: "5", domain: "OPERATIONS", difficulty: 7 },
    "5.NF.3": { title: "Interpret Fractions as Division", gradeLevel: "5", domain: "OPERATIONS", difficulty: 7 },
    "5.NF.4": { title: "Multiply Fractions", gradeLevel: "5", domain: "OPERATIONS", difficulty: 8 },
    "5.NF.6": { title: "Real-World Fraction Multiplication Problems", gradeLevel: "5", domain: "OPERATIONS", difficulty: 8 },
    "5.MD.1": { title: "Convert Measurement Units", gradeLevel: "5", domain: "MEASUREMENT", difficulty: 6 },
    "5.MD.3": { title: "Understand Volume Concepts", gradeLevel: "5", domain: "MEASUREMENT", difficulty: 7 },
    "5.G.1": { title: "Graph Points on a Coordinate Plane", gradeLevel: "5", domain: "GEOMETRY", difficulty: 6 },
  };
  return nodes[nodeCode] ?? null;
}
