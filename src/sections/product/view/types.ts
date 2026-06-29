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
}

export interface MissingInfo {
  test: string;
  impact_estimate: string;
  reasoning: string;
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

export interface DiagnosisDetail {
  diagnosis: string;
  treatment: string;
  probability: string;
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
}