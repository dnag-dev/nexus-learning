/**
 * Client-side question generators for fluency zone.
 *
 * Math: random multiplication (a × b, 1-12)
 * ELA: fixed grammar question pool
 */

export interface FluencyQuestion {
  questionText: string;
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
  correctId: string;
}

// ─── Math Questions ───

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateMathQuestion(): FluencyQuestion {
  const a = Math.floor(Math.random() * 12) + 1;
  const b = Math.floor(Math.random() * 12) + 1;
  const correct = a * b;

  // Generate 3 wrong answers (close to correct)
  const wrongSet = new Set<number>();
  while (wrongSet.size < 3) {
    const offset = Math.floor(Math.random() * 10) - 5;
    const wrong = correct + (offset === 0 ? 1 : offset);
    if (wrong > 0 && wrong !== correct) {
      wrongSet.add(wrong);
    }
  }

  const options = shuffle([
    { id: "correct", text: String(correct), isCorrect: true },
    ...[...wrongSet].map((w, i) => ({
      id: `wrong-${i}`,
      text: String(w),
      isCorrect: false,
    })),
  ]);

  return {
    questionText: `${a} × ${b}`,
    options,
    correctId: options.find((o) => o.isCorrect)!.id,
  };
}

// ─── ELA Questions ───

const ELA_POOL: Array<{
  question: string;
  correct: string;
  wrong: string[];
}> = [
  {
    question: "Which is a noun?",
    correct: "Mountain",
    wrong: ["Quickly", "Run", "Beautiful"],
  },
  {
    question: "Which is a verb?",
    correct: "Jump",
    wrong: ["Table", "Bright", "Under"],
  },
  {
    question: "Which is an adjective?",
    correct: "Bright",
    wrong: ["Run", "Chair", "Softly"],
  },
  {
    question: "Which word is a pronoun?",
    correct: "They",
    wrong: ["Happy", "Swim", "Dog"],
  },
  {
    question: "Which is an adverb?",
    correct: "Carefully",
    wrong: ["Cat", "Green", "Eat"],
  },
  {
    question: "Which sentence is correct?",
    correct: "She runs every day.",
    wrong: [
      "She run every day.",
      "Her runs every day.",
      "She running every day.",
    ],
  },
  {
    question: "Which word is a conjunction?",
    correct: "And",
    wrong: ["Happy", "Run", "Chair"],
  },
  {
    question: "Which is a preposition?",
    correct: "Under",
    wrong: ["Jump", "Quick", "Tree"],
  },
];

export function generateELAQuestion(): FluencyQuestion {
  const item = ELA_POOL[Math.floor(Math.random() * ELA_POOL.length)];

  const options = shuffle([
    { id: "correct", text: item.correct, isCorrect: true },
    ...item.wrong.map((w, i) => ({
      id: `wrong-${i}`,
      text: w,
      isCorrect: false,
    })),
  ]);

  return {
    questionText: item.question,
    options,
    correctId: options.find((o) => o.isCorrect)!.id,
  };
}

/**
 * Generate a question based on subject.
 */
export function generateQuestion(subject: string): FluencyQuestion {
  return subject.toUpperCase() === "MATH"
    ? generateMathQuestion()
    : generateELAQuestion();
}
