/**
 * Layout Constants — Centralized layout values for the entire platform.
 *
 * All spacing, breakpoints, and typography sizes referenced
 * across Parts 1-8 of the UX overhaul.
 */

export const LAYOUT = {
  /** Max content width for parent dashboard pages (px) */
  PARENT_MAX_WIDTH: 1100,
  /** Max content width for student session pages (px) */
  SESSION_MAX_WIDTH: 1200,
  /** Parent sidebar width (px) */
  SIDEBAR_WIDTH: 256,
  /** Session left column width - Cosmo + stepper (px) */
  SESSION_LEFT_COL: 200,
  /** Session center column max width (px) */
  SESSION_CENTER_MAX: 680,
  /** Session right column width - stats (px) */
  SESSION_RIGHT_COL: 260,

  /** Responsive breakpoints (px) */
  BREAKPOINTS: {
    DESKTOP_XL: 1440,
    DESKTOP: 1280,
    TABLET: 1024,
    MOBILE_LG: 768,
    MOBILE: 375,
  },

  /** Spacing values (px) */
  SPACING: {
    /** Max card inner padding */
    CARD_PADDING: 20,
    /** Gap between cards in a row */
    ROW_GAP: 16,
    /** Gap between sections */
    SECTION_GAP: 24,
  },

  /** Font sizes (px) — never go below MIN */
  FONT_SIZES: {
    PAGE_TITLE: 24,
    SECTION_HEADING: 18,
    CARD_HEADING: 15,
    BODY: 14,
    LABEL: 12,
    MIN: 12,
  },
} as const;

/**
 * Tailwind class equivalents for the layout constants.
 * Use these in className strings for consistency.
 */
export const TW = {
  PARENT_MAX: "max-w-[1100px]",
  SESSION_MAX: "max-w-[1200px]",
  CARD_PADDING: "p-5",
  ROW_GAP: "gap-4",
  SECTION_GAP: "space-y-6",
  PAGE_TITLE: "text-2xl",
  SECTION_HEADING: "text-lg",
  CARD_HEADING: "text-[15px]",
  BODY: "text-sm",
  LABEL: "text-xs",
} as const;
