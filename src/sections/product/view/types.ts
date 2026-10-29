export interface EvidenceLink {
  title: string;
  source: string;
  description: string;
  // populated when the citation was grounded against a real PubMed record
  pmid?: string;
  url?: string;
  verified?: boolean;
}

// Verdict of the symbolic verification layer for a single differential.
export interface SymbolicVerdict {
  status: 'ok' | 'blocked';
  rule?: string;
  reason?: string;
}

// A second, independent model's review of a single differential.
export interface IndependentVerdict {
  agree: boolean;
  confidence?: 'high' | 'medium' | 'low' | string;
  note?: string;
  model?: string;
}

// A free-text symptom mapped to a standardized ontology concept (e.g. HPO).
export interface ClinicalConcept {
  input: string;
  code: string;
  name: string;
  system: string;
  url?: string;
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'high' | 'moderate' | 'low';
  detail: string;
  // drug grounding against RxNorm (NIH): each drug resolved to a real concept
  drug1_rxcui?: string;
  drug2_rxcui?: string;
  drugs_verified?: boolean;
  grounding_note?: string;
}

export interface MissingInfo {
  test: string;
  impact_estimate: string;
  reasoning: string;
}

// The three confidence dimensions are separate answers (see the backend's
// confidence_semantics.go): `probability` is the diagnostic likelihood, this is
// whether a result confirms it, and `etiology` is what causes it.
export type ConfirmationStatus = 'suspected' | 'strongly_supported' | 'confirmed';

export interface Etiology {
  cause: string;
  status?: 'unknown' | 'suspected' | 'confirmed' | string;
  likelihood?: string;
  basis?: string;
}

// One step of the investigation plan — the only place the response lists tests.
export interface Investigation {
  test: string;
  priority: 'immediate' | 'conditional' | 'later' | string;
  purpose?: string;
  addresses?: 'diagnosis' | 'etiology' | 'alternative' | 'baseline' | 'monitoring' | string;
  for_diagnosis?: string;
  trigger_condition?: string;
  changes_management?: boolean;
  time_horizon?: string;
  if_positive?: string;
  if_negative?: string;
}

export interface MustNotMiss {
  diagnosis: string;
  why_it_matters?: string;
  how_to_exclude?: string;
}

export type AssessmentState = 'abstained' | 'workup_first' | 'working_diagnosis' | 'confirmed';

// Clinical information added after the initial presentation, oldest first.
export interface CaseUpdate {
  text: string;
  addedAt?: string;
}

// One state of the case, kept so earlier assessments stay visible.
export interface TimelineEntry {
  label: string;
  addedText?: string;
  at: string;
  assessmentState?: string;
  diagnoses: { diagnosis: string; probability: string; confirmation_status?: string }[];
}

export interface PatientCase {
  id: number;
  user_id: number;
  patient_name: string;
  age?: number;
  gender?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PatientCaseEntry {
  id: number;
  patient_case_id: number;
  conversation_id: number;
  summary: string;
  diagnosis_names?: string;
  created_at: string;
}

// A finding a differential DEPENDS ON that has not been obtained for this
// patient. While one is unresolved the diagnosis stays provisional — the engine
// does not commit to a conclusion resting on a value it was never given.
export interface PendingConfirmation {
  finding: string;
  test: string;
  if_absent?: string;
  resolved?: boolean;
  resolved_by?: string;
}

// A competing diagnosis actively weighed and set aside, with the feature of this
// case that discriminates against it.
export interface AlternativeConsidered {
  diagnosis: string;
  discriminator: string;
  missing_features?: string[];
}

// A recommendation anchored to a named guideline body, flagging where bodies
// genuinely disagree instead of presenting one side as settled consensus.
export interface GuidelineRef {
  body: string;
  year?: string;
  statement: string;
  contested?: boolean;
  contested_note?: string;
}

export interface DiagnosisDetail {
  diagnosis: string;
  treatment: string;
  // Diagnostic likelihood (0–100%), never a confirmation score.
  probability: string;
  confirmation_status?: ConfirmationStatus | string;
  confirmed_by?: string;
  status_note?: string;
  etiology?: Etiology;
  prevalence?: string;
  discriminatorSymptoms?: string[];
  recommendedTests?: string[];
  testConfirmed?: boolean;
  evidence_links?: EvidenceLink[];
  drug_interactions?: DrugInteraction[];
  missing_information?: MissingInfo[];
  // neurosymbolic pipeline annotations
  symbolic_check?: SymbolicVerdict;
  independent_check?: IndependentVerdict;
  // evidence gate: what this differential still depends on
  pending_confirmations?: PendingConfirmation[];
  provisional?: boolean;
  provisional_reason?: string;
  // differential discipline: the alternatives weighed and why they were set aside
  considered_alternatives?: AlternativeConsidered[];
  guideline_basis?: GuidelineRef[];
  // rare-candidate discrimination: what this condition predicts that is ABSENT
  expectedButAbsent?: string[];
  arguesAgainst?: string;
}

export interface DiagnosisData {
  disclaimer: string;
  common_diagnoses: DiagnosisDetail[];
  rare_diagnoses: DiagnosisDetail[] | null;
  follow_up_questions: string[];
  // pipeline outputs (populated by the backend reasoning stages)
  ruled_out?: DiagnosisDetail[];
  normalized_concepts?: ClinicalConcept[];
  evidence_grounded?: boolean;
  independently_verified?: boolean;
  abstained?: boolean;
  abstention_reason?: string;
  top_confidence?: string;
  // evidence gate / history sufficiency
  workup_first?: boolean;
  workup_reason?: string;
  recommended_workup?: string[];
  history_sufficient?: boolean;
  // prioritised next steps, dangerous alternatives, where the case stands
  investigation_plan?: Investigation[];
  must_not_miss?: MustNotMiss[];
  urgency?: 'emergency' | 'urgent' | 'routine' | string;
  assessment_state?: AssessmentState | string;
}

export interface ArchivedDiagnosis {
  diagnosis: string;
  treatment: string;
  probability: string;
  timestamp: string;
  reason?: string;
}

export interface DiagnosisResponseDetails {
  conversationId: number;
  diagnoses?: DiagnosisData;
  followUpResponse?: DiagnosisData;
  archivedDiagnoses?: ArchivedDiagnosis[];
}

export interface ResponseDetailsProps {
  responseDetails: DiagnosisResponseDetails;
  activeStep: number;
  setActiveStep: React.Dispatch<React.SetStateAction<number>>;
  showFollowUp: boolean;
  setShowFollowUp: React.Dispatch<React.SetStateAction<boolean>>;
  followUpAnswers: string[];
  setFollowUpAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  originalPatientInfo: any;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setResponseDetails: React.Dispatch<React.SetStateAction<DiagnosisResponseDetails | null>>;
  // A follow-up round produced a new state of the case (for the timeline).
  onAssessment?: (label: string, data: DiagnosisData | undefined) => void;
}
