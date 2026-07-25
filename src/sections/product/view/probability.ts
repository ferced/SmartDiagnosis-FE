// One probability scale for the whole results view.
//
// There used to be two, and they disagreed: the main card coloured "High" green
// (confidence) while the rare-disease panel coloured the same word red (alarm),
// with both panels on screen at once. Colour that means opposite things in
// adjacent panels carries no information at all.
//
// The parsing had its own problem: it took the first integer anywhere in the
// string, so "0.85" rendered a 0% bar and "2 in 3 (66%)" rendered 2% — a
// high-probability diagnosis shown as an almost-empty red bar, which is the
// fastest thing on the card to read.

/**
 * Parses a backend probability string to a 0–100 value, or null when the string
 * does not actually carry a probability.
 *
 * Returning null matters: the previous version defaulted to 50, so an empty or
 * unparseable probability drew a confident half-full bar with no basis in the
 * data. An unknown probability must render as unknown.
 */
export function parseProbabilityPercent(probability: unknown): number | null {
  if (typeof probability !== 'string') return null;

  const raw = probability.trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();

  // A number explicitly marked as a percentage wins, wherever it sits:
  // "High (~70%)" -> 70, "2 in 3 (66%)" -> 66.
  const percent = lower.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percent) return clamp(parseFloat(percent[1]));

  const numbers = lower.match(/\d+(?:\.\d+)?/g) ?? [];

  // A lone fraction is a probability in 0–1 form: "0.85" -> 85.
  if (numbers.length === 1) {
    const value = parseFloat(numbers[0]);
    if (value > 0 && value <= 1 && numbers[0].includes('.')) return clamp(value * 100);
    if (value >= 0 && value <= 100) return clamp(value);
  }

  // With several unmarked numbers ("2 in 3", "1st of 3") we cannot tell which is
  // the probability — fall through to the wording rather than guess.

  // "unlikely" must be tested before "likely", which is a substring of it.
  // Matching it as high probability gave a downgraded candidate the maximum
  // alarm accent — the clearest possible inversion.
  if (/\bun(likely|probable)\b|improbable|doubtful/.test(lower)) return 15;
  if (lower.includes('very high') || lower.includes('very likely')) return 90;
  if (lower.includes('high') || lower.includes('likely') || lower.includes('probable')) return 80;
  if (lower.includes('moderate') || lower.includes('medium') || lower.includes('possible')) return 55;
  if (lower.includes('low') || lower.includes('rare') || lower.includes('remote')) return 25;

  return null;
}

/**
 * The single colour scale. It expresses how probable the diagnosis is — not how
 * alarming it is — so the same value reads the same way in every panel.
 * An unknown probability is neutral, never a confident colour.
 */
export function probabilityColor(percent: number | null): 'success' | 'warning' | 'error' | 'info' {
  if (percent === null) return 'info';
  if (percent >= 70) return 'success';
  if (percent >= 40) return 'warning';
  return 'error';
}

function clamp(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, value));
}
