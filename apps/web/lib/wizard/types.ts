/**
 * Wizard Types — Add Child Wizard state definition.
 *
 * Covers all 6 steps of the onboarding wizard.
 */

export interface WizardState {
  // Step 1: Basic Info
  displayName: string;
  gradeLevel: string;
  ageGroup: string;
  country: string;
  username: string;
  pin: string;
  pinConfirm: string;

  // Step 2: Learning Goal
  learningGoal: "CATCH_UP" | "STAY_ON_TRACK" | "GET_AHEAD" | "EXAM_PREP" | "";
  examType: string;

  // Step 3: Time & Schedule
  dailyMinutesTarget: number;
  targetDateOption: "NONE" | "END_OF_YEAR" | "CUSTOM";
  targetDate: string; // ISO date string

  // Step 4: Challenges
  initialChallenges: string[];

  // Step 5: Subject Focus
  subjectFocus: "MATH" | "ENGLISH" | "BOTH" | "";
}

export const INITIAL_WIZARD_STATE: WizardState = {
  displayName: "",
  gradeLevel: "G3",
  ageGroup: "MID_8_10",
  country: "US",
  username: "",
  pin: "",
  pinConfirm: "",
  learningGoal: "",
  examType: "",
  dailyMinutesTarget: 20,
  targetDateOption: "NONE",
  targetDate: "",
  initialChallenges: [],
  subjectFocus: "",
};

export const GRADE_OPTIONS = [
  { value: "K", label: "Kindergarten" },
  { value: "G1", label: "Grade 1" },
  { value: "G2", label: "Grade 2" },
  { value: "G3", label: "Grade 3" },
  { value: "G4", label: "Grade 4" },
  { value: "G5", label: "Grade 5" },
  { value: "G6", label: "Grade 6" },
  { value: "G7", label: "Grade 7" },
  { value: "G8", label: "Grade 8" },
  { value: "G9", label: "Grade 9" },
  { value: "G10", label: "Grade 10" },
  { value: "G11", label: "Grade 11" },
  { value: "G12", label: "Grade 12" },
];

export const AGE_GROUP_OPTIONS = [
  { value: "EARLY_5_7", label: "Ages 5-7" },
  { value: "MID_8_10", label: "Ages 8-10" },
  { value: "UPPER_11_12", label: "Ages 11-12" },
  { value: "TEEN_13_15", label: "Ages 13-15" },
  { value: "HIGH_16_18", label: "Ages 16-18" },
];

export const LEARNING_GOALS = [
  {
    value: "CATCH_UP" as const,
    label: "Catch Up",
    icon: "🏃",
    description: "Help close gaps and build confidence",
  },
  {
    value: "STAY_ON_TRACK" as const,
    label: "Stay on Track",
    icon: "📍",
    description: "Keep up with grade-level expectations",
  },
  {
    value: "GET_AHEAD" as const,
    label: "Get Ahead",
    icon: "🚀",
    description: "Challenge with above-grade material",
  },
  {
    value: "EXAM_PREP" as const,
    label: "Exam Prep",
    icon: "📝",
    description: "Prepare for a specific test",
  },
];

export const EXAM_TYPES = [
  { value: "SAT", label: "SAT" },
  { value: "ACT", label: "ACT" },
  { value: "ISEE_LOWER", label: "ISEE Lower" },
  { value: "ISEE_MID", label: "ISEE Mid" },
  { value: "ISEE_UPPER", label: "ISEE Upper" },
  { value: "PSAT", label: "PSAT" },
];

export const CHALLENGE_OPTIONS = {
  math: [
    { value: "MATH_FACTS", label: "Remembering facts" },
    { value: "WORD_PROBLEMS", label: "Word problems" },
    { value: "FRACTIONS", label: "Fractions" },
    { value: "ALGEBRA", label: "Algebra" },
    { value: "GEOMETRY", label: "Geometry" },
  ],
  english: [
    { value: "READING_COMP", label: "Reading comprehension" },
    { value: "WRITING", label: "Writing" },
    { value: "GRAMMAR", label: "Grammar" },
    { value: "SPELLING", label: "Spelling" },
    { value: "VOCABULARY", label: "Vocabulary" },
  ],
};

export const TIME_STOPS = [10, 15, 20, 30, 45, 60];
