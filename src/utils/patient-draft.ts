// Unsent patient-form draft, kept in sessionStorage so a long case survives a
// reload, an accidental navigation or a session expiry (the login redirect
// brings the clinician back to the form). sessionStorage is per-tab and is
// wiped when the tab closes; the draft is also cleared on "New case" and on
// explicit logout. Uploaded files are not kept — File objects can't be
// serialised.

const DRAFT_KEY = 'patientFormDraft';

const TEXT_FIELDS = [
  'patientName',
  'gender',
  'symptoms',
  'medicalHistory',
  'allergies',
  'currentMedications',
  'imageAnalysisType',
] as const;

// 0 is a real age (a baby under one year), so it is kept like any other value.
const NUMBER_FIELDS = ['age', 'ageMonths', 'ageDays'] as const;

type TextField = (typeof TEXT_FIELDS)[number];
type NumberField = (typeof NUMBER_FIELDS)[number];

export type PatientDraft = Partial<Record<TextField, string>> &
  Partial<Record<NumberField, number>>;

function pickDraft(values: Record<string, unknown>): PatientDraft {
  const draft: PatientDraft = {};
  TEXT_FIELDS.forEach((field) => {
    const value = values[field];
    if (typeof value === 'string' && value !== '') draft[field] = value;
  });
  NUMBER_FIELDS.forEach((field) => {
    const value = values[field];
    if (value === undefined || value === null || value === '') return;
    const number = Number(value);
    if (Number.isFinite(number)) draft[field] = number;
  });
  return draft;
}

export function loadPatientDraft(): PatientDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = pickDraft(JSON.parse(raw));
    return Object.keys(draft).length > 0 ? draft : null;
  } catch {
    return null;
  }
}

export function savePatientDraft(values: Record<string, unknown>) {
  try {
    const draft = pickDraft(values);
    if (Object.keys(draft).length === 0) {
      sessionStorage.removeItem(DRAFT_KEY);
    } else {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  } catch {
    /* storage may be unavailable (private mode / quota) — non-fatal */
  }
}

export function clearPatientDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* non-fatal */
  }
}
