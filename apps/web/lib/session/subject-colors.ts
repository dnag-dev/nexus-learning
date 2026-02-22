/**
 * Subject Color System — Maps knowledge domains to visual color configs.
 *
 * Used across session screens for gradient headers, accent borders,
 * badge colors, and progress rings.
 */

export interface SubjectColorConfig {
  /** Main subject color (hex) */
  primary: string;
  /** Light variant for hover backgrounds */
  primaryLight: string;
  /** CSS gradient for header bar background */
  gradient: string;
  /** Left-border accent on question cards */
  border: string;
  /** Filled circle background for A/B/C/D letter badges */
  badgeBg: string;
  /** Letter text color inside badges */
  badgeText: string;
  /** SVG stroke color for mastery progress ring */
  ringColor: string;
  /** Dark surface hover background for answer buttons */
  hoverBg: string;
}

// ─── Math: Gold / Amber ───
const mathColors: SubjectColorConfig = {
  primary: "#FDCB6E",
  primaryLight: "rgba(253, 203, 110, 0.15)",
  gradient: "linear-gradient(135deg, #1A1A2E 0%, #2D1B69 100%)",
  border: "#FDCB6E",
  badgeBg: "#6C5CE7",
  badgeText: "#FFFFFF",
  ringColor: "#FDCB6E",
  hoverBg: "rgba(253, 203, 110, 0.08)",
};

// ─── Science: Teal ───
const scienceColors: SubjectColorConfig = {
  primary: "#00CEC9",
  primaryLight: "rgba(0, 206, 201, 0.15)",
  gradient: "linear-gradient(135deg, #0D2137 0%, #0E4D5C 100%)",
  border: "#00CEC9",
  badgeBg: "#00B894",
  badgeText: "#FFFFFF",
  ringColor: "#00CEC9",
  hoverBg: "rgba(0, 206, 201, 0.08)",
};

// ─── English: Blue ───
const englishColors: SubjectColorConfig = {
  primary: "#74B9FF",
  primaryLight: "rgba(116, 185, 255, 0.15)",
  gradient: "linear-gradient(135deg, #1A1A2E 0%, #1B3A69 100%)",
  border: "#74B9FF",
  badgeBg: "#0984E3",
  badgeText: "#FFFFFF",
  ringColor: "#74B9FF",
  hoverBg: "rgba(116, 185, 255, 0.08)",
};

const DOMAIN_COLORS: Record<string, SubjectColorConfig> = {
  // Math domains
  COUNTING: mathColors,
  OPERATIONS: mathColors,
  GEOMETRY: mathColors,
  MEASUREMENT: mathColors,
  DATA: mathColors,
  // Science domains (future)
  PHYSICS: scienceColors,
  CHEMISTRY: scienceColors,
  BIOLOGY: scienceColors,
  EARTH_SCIENCE: scienceColors,
  // English domains (future)
  READING: englishColors,
  WRITING: englishColors,
  GRAMMAR: englishColors,
  VOCABULARY: englishColors,
};

/**
 * Get the color config for a given knowledge domain.
 * Falls back to math (gold) if domain is unknown.
 */
export function getSubjectColors(domain: string): SubjectColorConfig {
  return DOMAIN_COLORS[domain] ?? mathColors;
}
