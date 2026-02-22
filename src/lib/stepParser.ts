/**
 * Step Parser Utility (Sprint 19)
 *
 * Parses recipe instruction text into individual steps.
 * Handles numbered steps, paragraph breaks, and common instruction formats.
 *
 * Implementation Plan Phase 26 · Roadmap V1.5 Epic 1
 */

export interface ParsedStep {
  /** 1-based step number */
  stepNumber: number;
  /** The instruction text for this step (cleaned, no leading number) */
  text: string;
}

/**
 * Parse a list of instruction strings into structured steps.
 *
 * Recipes may store instructions as:
 * 1. An array where each element is already a single step
 * 2. An array with a single element containing all steps as numbered text
 * 3. An array with steps that contain embedded sub-steps
 *
 * This parser normalises all formats into a flat array of ParsedStep objects.
 */
export function parseSteps(instructions: string[]): ParsedStep[] {
  if (!instructions || instructions.length === 0) return [];

  // If instructions are already split into individual steps (most common)
  // and none of them contain embedded numbered sub-steps, return as-is
  if (instructions.length > 1 && !hasEmbeddedNumberedSteps(instructions)) {
    return instructions
      .map((text, i) => ({
        stepNumber: i + 1,
        text: cleanStepText(text),
      }))
      .filter((step) => step.text.length > 0);
  }

  // Otherwise, try to split combined instructions into individual steps
  const allText = instructions.join('\n');
  const steps = splitIntoSteps(allText);

  return steps
    .map((text, i) => ({
      stepNumber: i + 1,
      text: cleanStepText(text),
    }))
    .filter((step) => step.text.length > 0);
}

/**
 * Check if any instruction strings contain embedded numbered sub-steps.
 * e.g. "1. Do this. 2. Do that." in a single string
 */
function hasEmbeddedNumberedSteps(instructions: string[]): boolean {
  // If there's only one instruction and it's long, it likely has embedded steps
  if (instructions.length === 1 && instructions[0].length > 200) return true;

  // Check if any single instruction contains numbered step patterns
  const numberedPattern = /(?:^|\n)\s*\d+[\.\)]\s/;
  return instructions.some(
    (inst) => (inst.match(/\d+[\.\)]\s/g) || []).length >= 2 && numberedPattern.test(inst)
  );
}

/**
 * Split combined instruction text into individual steps.
 * Handles various formats: numbered, double newline, bullet points.
 */
function splitIntoSteps(text: string): string[] {
  // Try numbered steps first: "1. ...", "1) ...", "Step 1: ..."
  const numberedSteps = splitByNumberedPattern(text);
  if (numberedSteps.length > 1) return numberedSteps;

  // Try "Step X" pattern
  const stepPrefixSteps = splitByStepPrefix(text);
  if (stepPrefixSteps.length > 1) return stepPrefixSteps;

  // Try double newline separation
  const paragraphs = text.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  if (paragraphs.length > 1) return paragraphs;

  // Try single newline separation
  const lines = text.split(/\n/).map((s) => s.trim()).filter(Boolean);
  if (lines.length > 1) return lines;

  // Fallback: return as single step
  return [text.trim()].filter(Boolean);
}

/**
 * Split by numbered patterns like "1. ...", "1) ..."
 */
function splitByNumberedPattern(text: string): string[] {
  // Split on patterns like "1.", "2.", "1)", "2)" at line start or after newline
  const parts = text.split(/(?:^|\n)\s*\d+[\.\)]\s+/).filter(Boolean);

  if (parts.length <= 1) {
    // Try inline numbered patterns (no newline required)
    const inlineParts = text.split(/\s+\d+[\.\)]\s+/);
    // Only use if the first split part looks like a numbered step was removed from the start
    if (inlineParts.length > 1 && /^\s*\d+[\.\)]\s/.test(text)) {
      return inlineParts.filter(Boolean);
    }
    return parts;
  }

  return parts.map((p) => p.trim()).filter(Boolean);
}

/**
 * Split by "Step X:" or "Step X." patterns
 */
function splitByStepPrefix(text: string): string[] {
  // Handle both newline-separated and inline step prefixes
  const parts = text.split(/(?:^|\n|\.\s*)\s*[Ss]tep\s+\d+[:\.\s]+/).filter(Boolean);
  return parts.map((p) => p.trim()).filter(Boolean);
}

/**
 * Clean up step text — remove leading numbers, whitespace, and common prefixes.
 */
function cleanStepText(text: string): string {
  return (
    text
      // Remove leading step numbers: "1. ", "2) ", "Step 3: "
      .replace(/^\s*\d+[\.\)]\s*/, '')
      .replace(/^\s*[Ss]tep\s+\d+[:\.\s]+/, '')
      // Collapse multiple whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}
