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

// ─── Math: Gold / Amber (light theme) ───
const mathColors: SubjectColorConfig = {
  primary: "#D97706",
  primaryLight: "rgba(217, 119, 6, 0.10)",
  gradient: "linear-gradient(135deg, #6C5CE7 0%, #7C3AED 100%)",
  border: "#D97706",
  badgeBg: "#6C5CE7",
  badgeText: "#FFFFFF",
  ringColor: "#D97706",
  hoverBg: "rgba(217, 119, 6, 0.06)",
};

// ─── Science: Teal (light theme) ───
const scienceColors: SubjectColorConfig = {
  primary: "#0D9488",
  primaryLight: "rgba(13, 148, 136, 0.10)",
  gradient: "linear-gradient(135deg, #0D9488 0%, #0891B2 100%)",
  border: "#0D9488",
  badgeBg: "#0D9488",
  badgeText: "#FFFFFF",
  ringColor: "#0D9488",
  hoverBg: "rgba(13, 148, 136, 0.06)",
};

// ─── English: Blue (light theme) ───
const englishColors: SubjectColorConfig = {
  primary: "#2563EB",
  primaryLight: "rgba(37, 99, 235, 0.10)",
  gradient: "linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)",
  border: "#2563EB",
  badgeBg: "#2563EB",
  badgeText: "#FFFFFF",
  ringColor: "#2563EB",
  hoverBg: "rgba(37, 99, 235, 0.06)",
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
