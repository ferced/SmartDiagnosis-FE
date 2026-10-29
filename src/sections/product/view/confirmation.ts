// Labels for the confidence dimensions. The likelihood (probability.ts) says how
// probable a diagnosis is; these say whether a result confirms it and how sure
// the engine is about its cause. They are separate answers and are shown
// separately — the old single "Probability" mixed them, so it barely moved on
// discriminating findings and then jumped when the confirmatory scan came back.

type ChipColor = 'success' | 'info' | 'warning' | 'default';

export function confirmationLabel(status?: string): string {
  switch (status) {
    case 'confirmed':
      return 'Confirmed';
    case 'strongly_supported':
      return 'Strongly supported — not confirmed';
    case 'suspected':
      return 'Suspected';
    default:
      return '';
  }
}

export function confirmationColor(status?: string): ChipColor {
  switch (status) {
    case 'confirmed':
      return 'success';
    case 'strongly_supported':
      return 'info';
    case 'suspected':
      return 'warning';
    default:
      return 'default';
  }
}

export function etiologyStatusLabel(status?: string): string {
  switch (status) {
    case 'confirmed':
      return 'confirmed';
    case 'unknown':
      return 'unknown';
    default:
      return 'suspected';
  }
}

export function assessmentStateLabel(state?: string): string {
  switch (state) {
    case 'abstained':
      return 'No diagnosis singled out';
    case 'workup_first':
      return 'Workup first';
    case 'working_diagnosis':
      return 'Working diagnosis';
    case 'confirmed':
      return 'Confirmed';
    default:
      return '';
  }
}

export const LIKELIHOOD_HELP =
  'How likely this diagnosis is, given everything entered so far. It is an estimate, not a calibrated probability. Whether a result confirms the diagnosis, and what causes it, are shown separately.';
