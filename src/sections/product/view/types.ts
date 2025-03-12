export interface DiagnosisDetail {
  diagnosis: string;
  treatment: string;
  probability: string;
  prevalence?: string;
}

export interface DiagnosisData {
  disclaimer: string;
  common_diagnoses: DiagnosisDetail[];
  rare_diagnoses: DiagnosisDetail[] | null;
  follow_up_questions: string[];
}

export interface DiagnosisResponseDetails {
  conversationId: number;
  diagnoses?: DiagnosisData;
  followUpResponse?: DiagnosisData;
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