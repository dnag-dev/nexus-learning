/**
 * Topic-aware question generators for Fluency Zone speed drills.
 *
 * Each generator produces instant, procedural questions client-side
 * (no API calls — speed drills need instant question delivery).
 *
 * Questions are multiple-choice with 4 options for fast tapping.
 */

export interface FluencyQ {
  questionText: string;
  correctAnswer: string;
  options: string[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Generate 3 unique wrong answers near the correct number */
function nearbyWrongs(correct: number, range = 5, min = 0): string[] {
  const wrongs = new Set<number>();
  let attempts = 0;
  while (wrongs.size < 3 && attempts < 50) {
    const offset = randInt(-range, range);
    const w = correct + (offset === 0 ? 1 : offset);
    if (w !== correct && w >= min) wrongs.add(w);
    attempts++;
  }
  // Fallback if not enough
  while (wrongs.size < 3) {
    wrongs.add(correct + wrongs.size + 1);
  }
  return [...wrongs].map(String);
}

function makeQ(questionText: string, correct: number | string, wrongAnswers: string[]): FluencyQ {
  const correctStr = String(correct);
  return {
    questionText,
    correctAnswer: correctStr,
    options: shuffle([correctStr, ...wrongAnswers]),
  };
}

// ═══════════════════════════════════════════════════════════
// MATH GENERATORS
// ═══════════════════════════════════════════════════════════

function genAddition(): FluencyQ {
  const a = randInt(1, 50);
  const b = randInt(1, 50);
  return makeQ(`${a} + ${b} = ?`, a + b, nearbyWrongs(a + b));
}

function genSubtraction(): FluencyQ {
  const a = randInt(10, 99);
  const b = randInt(1, a);
  return makeQ(`${a} − ${b} = ?`, a - b, nearbyWrongs(a - b));
}

function genMultiplication(): FluencyQ {
  const a = randInt(2, 12);
  const b = randInt(2, 12);
  return makeQ(`${a} × ${b} = ?`, a * b, nearbyWrongs(a * b, 8, 1));
}

function genDivision(): FluencyQ {
  const b = randInt(2, 12);
  const answer = randInt(2, 12);
  const a = b * answer;
  return makeQ(`${a} ÷ ${b} = ?`, answer, nearbyWrongs(answer, 3, 1));
}

function genPlaceValue(): FluencyQ {
  const templates = [
    () => {
      const n = randInt(100, 9999);
      const digit = Math.floor(n / 100) % 10;
      return makeQ(`What digit is in the hundreds place of ${n.toLocaleString()}?`, digit, nearbyWrongs(digit, 4, 0));
    },
    () => {
      const n = randInt(100, 999);
      const expanded = `${Math.floor(n/100)} hundreds + ${Math.floor(n/10)%10} tens + ${n%10} ones`;
      return makeQ(`What number is: ${expanded}?`, n, nearbyWrongs(n, 20, 100));
    },
    () => {
      const n = randInt(10, 9999);
      const vals = [n * 10, n * 100, Math.round(n / 10), n];
      const correct = n * 10;
      return makeQ(`${n} × 10 = ?`, correct, nearbyWrongs(correct, correct < 1000 ? 30 : 200, 1));
    },
  ];
  return templates[randInt(0, templates.length - 1)]();
}

function genFractions(): FluencyQ {
  const templates = [
    // Add fractions with same denominator
    () => {
      const d = randInt(3, 10);
      const a = randInt(1, d - 2);
      const b = randInt(1, d - a);
      const sum = a + b;
      return makeQ(`${a}/${d} + ${b}/${d} = ?`, `${sum}/${d}`,
        [`${sum + 1}/${d}`, `${a + b}/${d * 2}`, `${sum - 1}/${d}`]);
    },
    // Compare fractions
    () => {
      const a = randInt(1, 5);
      const b = randInt(a + 1, 8);
      const c = randInt(1, 5);
      const d = randInt(c + 1, 8);
      const left = a / b;
      const right = c / d;
      const correct = left > right ? ">" : left < right ? "<" : "=";
      return makeQ(`${a}/${b}  ___  ${c}/${d}`, correct,
        shuffle(["<", ">", "="].filter(x => x !== correct)).slice(0, 3));
    },
    // Simplify
    () => {
      const factor = randInt(2, 5);
      const num = randInt(1, 4);
      const den = randInt(num + 1, 6);
      return makeQ(`Simplify: ${num * factor}/${den * factor}`, `${num}/${den}`,
        [`${num * factor}/${den}`, `${num}/${den * factor}`, `${num + 1}/${den}`]);
    },
  ];
  return templates[randInt(0, templates.length - 1)]();
}

function genDecimals(): FluencyQ {
  const templates = [
    // Add decimals
    () => {
      const a = randInt(1, 99) / 10;
      const b = randInt(1, 99) / 10;
      const sum = Math.round((a + b) * 10) / 10;
      return makeQ(`${a.toFixed(1)} + ${b.toFixed(1)} = ?`, sum.toFixed(1),
        nearbyWrongs(sum * 10, 3, 1).map(w => (Number(w) / 10).toFixed(1)));
    },
    // Compare decimals
    () => {
      const a = randInt(1, 99) / 10;
      const b = randInt(1, 99) / 10;
      const correct = a > b ? ">" : a < b ? "<" : "=";
      return makeQ(`${a.toFixed(1)}  ___  ${b.toFixed(1)}`, correct,
        shuffle(["<", ">", "="].filter(x => x !== correct)).slice(0, 3));
    },
    // Decimal to fraction
    () => {
      const pairs: [string, string][] = [
        ["0.5", "1/2"], ["0.25", "1/4"], ["0.75", "3/4"],
        ["0.1", "1/10"], ["0.2", "1/5"], ["0.4", "2/5"],
      ];
      const [dec, frac] = pairs[randInt(0, pairs.length - 1)];
      const wrongs = pairs.filter(([d]) => d !== dec).map(([, f]) => f);
      return makeQ(`${dec} as a fraction = ?`, frac, shuffle(wrongs).slice(0, 3));
    },
  ];
  return templates[randInt(0, templates.length - 1)]();
}

function genCoordinatePlane(): FluencyQ {
  const templates = [
    // Which quadrant?
    () => {
      const x = randInt(1, 9) * (Math.random() < 0.5 ? 1 : -1);
      const y = randInt(1, 9) * (Math.random() < 0.5 ? 1 : -1);
      const q = x > 0 && y > 0 ? "I" : x < 0 && y > 0 ? "II" : x < 0 && y < 0 ? "III" : "IV";
      return makeQ(`Which quadrant is (${x}, ${y}) in?`, q,
        shuffle(["I", "II", "III", "IV"].filter(v => v !== q)).slice(0, 3));
    },
    // What's the x-coordinate?
    () => {
      const x = randInt(-9, 9);
      const y = randInt(-9, 9);
      return makeQ(`What is the x-coordinate of (${x}, ${y})?`, x, nearbyWrongs(x, 3));
    },
    // What's the y-coordinate?
    () => {
      const x = randInt(-9, 9);
      const y = randInt(-9, 9);
      return makeQ(`What is the y-coordinate of (${x}, ${y})?`, y, nearbyWrongs(y, 3));
    },
    // Distance from origin (simple)
    () => {
      const pairs = [[3,4,5],[5,12,13],[6,8,10],[8,15,17]];
      const [a, b, c] = pairs[randInt(0, pairs.length - 1)];
      return makeQ(`Distance from origin to (${a}, ${b}) = ?`, c, nearbyWrongs(c, 3, 1));
    },
  ];
  return templates[randInt(0, templates.length - 1)]();
}

function genGeometry(): FluencyQ {
  const templates = [
    // Area of rectangle
    () => {
      const l = randInt(2, 12);
      const w = randInt(2, 12);
      return makeQ(`Area of a rectangle: ${l} × ${w} = ?`, l * w, nearbyWrongs(l * w, 8, 1));
    },
    // Perimeter of rectangle
    () => {
      const l = randInt(2, 15);
      const w = randInt(2, 15);
      const p = 2 * (l + w);
      return makeQ(`Perimeter of rectangle (${l} × ${w}) = ?`, p, nearbyWrongs(p, 6, 4));
    },
    // Area of triangle
    () => {
      const b = randInt(2, 10) * 2; // even for clean division
      const h = randInt(2, 10);
      const area = (b * h) / 2;
      return makeQ(`Area of triangle (base=${b}, height=${h}) = ?`, area, nearbyWrongs(area, 5, 1));
    },
    // Angles in triangle
    () => {
      const a = randInt(20, 80);
      const b = randInt(20, 160 - a);
      const c = 180 - a - b;
      return makeQ(`Triangle angles: ${a}° + ${b}° + ? = 180°`, c, nearbyWrongs(c, 10, 1));
    },
  ];
  return templates[randInt(0, templates.length - 1)]();
}

function genMeasurement(): FluencyQ {
  const templates = [
    () => {
      const cm = randInt(100, 900);
      const m = cm / 100;
      return makeQ(`${cm} cm = ? meters`, m.toString(),
        nearbyWrongs(cm, 200, 100).map(w => (Number(w) / 100).toString()));
    },
    () => {
      const kg = randInt(1, 9);
      const g = kg * 1000;
      return makeQ(`${kg} kg = ? grams`, g.toString(), nearbyWrongs(g, 500, 100).map(String));
    },
    () => {
      const ft = randInt(1, 5);
      const inches = ft * 12;
      return makeQ(`${ft} feet = ? inches`, inches.toString(), nearbyWrongs(inches, 6, 6).map(String));
    },
  ];
  return templates[randInt(0, templates.length - 1)]();
}

function genAlgebra(): FluencyQ {
  const templates = [
    // Solve x + a = b
    () => {
      const x = randInt(1, 20);
      const a = randInt(1, 20);
      return makeQ(`x + ${a} = ${x + a}. x = ?`, x, nearbyWrongs(x, 3, 0));
    },
    // Solve a × x = b
    () => {
      const x = randInt(2, 12);
      const a = randInt(2, 10);
      return makeQ(`${a}x = ${a * x}. x = ?`, x, nearbyWrongs(x, 3, 1));
    },
    // Evaluate expression
    () => {
      const x = randInt(1, 10);
      const a = randInt(1, 5);
      const b = randInt(1, 10);
      const val = a * x + b;
      return makeQ(`If x = ${x}, then ${a}x + ${b} = ?`, val, nearbyWrongs(val, 5, 0));
    },
  ];
  return templates[randInt(0, templates.length - 1)]();
}

function genRatiosPercent(): FluencyQ {
  const templates = [
    // Percentage of number
    () => {
      const pcts = [10, 20, 25, 50, 75];
      const pct = pcts[randInt(0, pcts.length - 1)];
      const num = randInt(2, 20) * (100 / pct); // clean result
      const answer = (pct / 100) * num;
      return makeQ(`${pct}% of ${num} = ?`, answer, nearbyWrongs(answer, 5, 0));
    },
    // Simple ratio
    () => {
      const a = randInt(1, 5);
      const b = randInt(1, 5);
      const mult = randInt(2, 6);
      return makeQ(`${a}:${b} = ${a * mult}:?`, b * mult, nearbyWrongs(b * mult, 3, 1));
    },
  ];
  return templates[randInt(0, templates.length - 1)]();
}

// ═══════════════════════════════════════════════════════════
// ELA GENERATORS
// ═══════════════════════════════════════════════════════════

const ELA_POOLS: Record<string, Array<{ q: string; correct: string; wrong: string[] }>> = {
  GRAMMAR: [
    { q: "Which is a noun?", correct: "Mountain", wrong: ["Quickly", "Run", "Beautiful"] },
    { q: "Which is a verb?", correct: "Jump", wrong: ["Table", "Bright", "Under"] },
    { q: "Which is an adjective?", correct: "Bright", wrong: ["Run", "Chair", "Softly"] },
    { q: "Which word is a pronoun?", correct: "They", wrong: ["Happy", "Swim", "Dog"] },
    { q: "Which is an adverb?", correct: "Carefully", wrong: ["Cat", "Green", "Eat"] },
    { q: 'She ___ to the store yesterday.', correct: "went", wrong: ["go", "goes", "going"] },
    { q: 'The children ___ playing outside.', correct: "are", wrong: ["is", "was", "be"] },
    { q: "Which sentence has correct punctuation?", correct: "Let's eat, Mom!", wrong: ["Lets eat Mom!", "Let's eat Mom.", "Lets eat, Mom"] },
    { q: 'Which is a complete sentence?', correct: 'The dog barked loudly.', wrong: ['Running fast.', 'Because of rain.', 'Under the table.'] },
    { q: 'What is the plural of "child"?', correct: "children", wrong: ["childs", "childrens", "childes"] },
    { q: 'Which word is a conjunction?', correct: "And", wrong: ["Happy", "Run", "Chair"] },
    { q: 'Which is a preposition?', correct: "Under", wrong: ["Jump", "Quick", "Tree"] },
  ],
  VOCABULARY: [
    { q: 'Which word means "happy"?', correct: "Joyful", wrong: ["Sad", "Angry", "Tired"] },
    { q: 'What is the opposite of "brave"?', correct: "Cowardly", wrong: ["Strong", "Bold", "Fierce"] },
    { q: '"Enormous" means the same as:', correct: "Huge", wrong: ["Tiny", "Average", "Narrow"] },
    { q: '"Rapid" is closest in meaning to:', correct: "Fast", wrong: ["Slow", "Careful", "Heavy"] },
    { q: 'A synonym for "begin" is:', correct: "Start", wrong: ["End", "Wait", "Pause"] },
    { q: 'An antonym of "ancient" is:', correct: "Modern", wrong: ["Old", "Classic", "Aged"] },
  ],
  READING: [
    { q: "What is the main idea of a text?", correct: "The central point", wrong: ["A small detail", "The title", "The author's name"] },
    { q: "What does 'infer' mean in reading?", correct: "Figure out from clues", wrong: ["Read aloud", "Copy text", "Skip ahead"] },
    { q: "A 'setting' in a story is:", correct: "Where and when it happens", wrong: ["The main character", "The ending", "The theme"] },
    { q: "What is a 'conflict' in a story?", correct: "A problem or struggle", wrong: ["The ending", "A character's name", "The title"] },
  ],
};

function genELA(domain: string): FluencyQ {
  const pool = ELA_POOLS[domain] || ELA_POOLS.GRAMMAR;
  const item = pool[randInt(0, pool.length - 1)];
  const options = shuffle([item.correct, ...item.wrong]);
  return { questionText: item.q, correctAnswer: item.correct, options };
}

// ═══════════════════════════════════════════════════════════
// MAIN DISPATCHER
// ═══════════════════════════════════════════════════════════

/**
 * Generate a topic-specific fluency question based on domain and nodeCode.
 */
export function generateTopicQuestion(
  subject: string,
  domain: string,
  nodeCode: string,
  nodeTitle: string
): FluencyQ {
  if (subject !== "MATH") {
    return genELA(domain);
  }

  // Use domain + nodeCode/title to pick the right math generator
  const lowerTitle = nodeTitle.toLowerCase();
  const lowerCode = nodeCode.toLowerCase();

  // Coordinate plane
  if (
    domain === "GEOMETRY" &&
    (lowerTitle.includes("coordinate") || lowerTitle.includes("graph points") ||
     lowerTitle.includes("plot") || lowerTitle.includes("ordered pair") ||
     lowerCode.includes(".cp."))
  ) {
    return genCoordinatePlane();
  }

  // Geometry (non-coordinate)
  if (domain === "GEOMETRY") {
    return genGeometry();
  }

  // Fractions
  if (
    domain === "FRACTIONS" ||
    lowerTitle.includes("fraction") || lowerTitle.includes("numerator") ||
    lowerTitle.includes("denominator")
  ) {
    return genFractions();
  }

  // Decimals
  if (domain === "DECIMALS" || lowerTitle.includes("decimal")) {
    return genDecimals();
  }

  // Measurement
  if (domain === "MEASUREMENT" || lowerTitle.includes("measur") || lowerTitle.includes("convert")) {
    return genMeasurement();
  }

  // Algebra
  if (
    domain === "ALGEBRA" || domain === "EXPRESSIONS_EQUATIONS" ||
    lowerTitle.includes("algebra") || lowerTitle.includes("equation") ||
    lowerTitle.includes("variable") || lowerTitle.includes("expression")
  ) {
    return genAlgebra();
  }

  // Ratios and Percentages
  if (
    domain === "RATIOS" || domain === "RATIOS_PROPORTIONAL" ||
    lowerTitle.includes("ratio") || lowerTitle.includes("percent") ||
    lowerTitle.includes("proportion")
  ) {
    return genRatiosPercent();
  }

  // Place value / Number sense
  if (
    lowerTitle.includes("place value") || lowerTitle.includes("number sense") ||
    lowerTitle.includes("rounding") || lowerTitle.includes("comparing numbers")
  ) {
    return genPlaceValue();
  }

  // NUMBER_OPERATIONS — detect operation from title
  if (lowerTitle.includes("subtract")) return genSubtraction();
  if (lowerTitle.includes("division") || lowerTitle.includes("divide") || lowerTitle.includes("quotient")) return genDivision();
  if (lowerTitle.includes("add") || lowerTitle.includes("sum")) return genAddition();
  if (lowerTitle.includes("multipl") || lowerTitle.includes("product") || lowerTitle.includes("times")) return genMultiplication();

  // Default: mix of operations based on domain
  switch (domain) {
    case "NUMBER_OPERATIONS":
    case "OPERATIONS_ALGEBRAIC": {
      const generators = [genAddition, genSubtraction, genMultiplication, genDivision];
      return generators[randInt(0, generators.length - 1)]();
    }
    default:
      // Ultimate fallback — multiplication (fast, universally useful)
      return genMultiplication();
  }
}
