import axios from 'axios';
import * as Yup from 'yup';
import { m, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, SubmitHandler } from 'react-hook-form';

import { NoteAlt, AddCircleOutline } from '@mui/icons-material';
import {
  Box,
  Card,
  Grid,
  Alert,
  Stack,
  Button,
  Skeleton,
  Snackbar,
  Typography,
  LinearProgress,
  CircularProgress,
} from '@mui/material';

import { getErrorMessage, isRequestCancelled } from 'src/utils/api-error';
import { loadPatientDraft, savePatientDraft, clearPatientDraft } from 'src/utils/patient-draft';

import { HOST_API } from 'src/config-global';
import { uploadDocuments } from 'src/api/documents';

import { varFade } from 'src/components/animate';
import FormProvider from 'src/components/hook-form';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { OpenAIConfigModal } from 'src/components/openai-config';

import ChatBox from './ChatBox';
import MainForm from './main-form';
import DailyUsage from './DailyUsage';
import ClinicalDisclaimer from './ClinicalDisclaimer';
import ResponseDetails from './response-details-form';
import NoDifferentialPanel from './NoDifferentialPanel';
import { DiagnosisData, DiagnosisResponseDetails } from './types';

interface OpenAIConfig {
  apiKey: string;
  model: string;
}

const LOADING_STAGES = [
  'Analyzing symptoms and patient history…',
  'Generating the most probable differential diagnoses…',
  'Screening for rare and ultra-rare conditions…',
  'Cross-checking drug interactions and allergies…',
  'Compiling clinical evidence and follow-up questions…',
  'Finalizing diagnoses and treatment plan…',
];

function LoadingSkeleton({ onCancel }: { onCancel: () => void }) {
  const [stageIdx, setStageIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const tick = setInterval(() => setElapsed((e) => e + 1), 1000);
    const advance = setInterval(
      () => setStageIdx((i) => Math.min(i + 1, LOADING_STAGES.length - 1)),
      7000
    );
    return () => {
      clearInterval(tick);
      clearInterval(advance);
    };
  }, []);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <Box sx={{ mt: 3 }}>
      <Alert
        severity="info"
        icon={<CircularProgress size={22} />}
        sx={{ mb: 2 }}
        action={
          <Button color="inherit" size="small" onClick={onCancel}>
            Cancel
          </Button>
        }
      >
        <Stack spacing={0.5}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {LOADING_STAGES[stageIdx]}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Running several AI analyses in parallel — this can take up to ~3 minutes.
            Elapsed {mm}:{ss}. Keep this tab open; nothing is frozen. Cancelling takes you back
            to the form with your input intact.
            {elapsed >= 120 && ' Complex or ultra-rare cases take the longest.'}
          </Typography>
        </Stack>
      </Alert>
      <LinearProgress sx={{ mb: 3, height: 6, borderRadius: 1 }} />
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1, mb: 3 }} />
            <Stack spacing={2}>
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 1 }} />
              <Skeleton variant="text" width="40%" height={32} sx={{ mt: 2 }} />
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="90%" />
              <Skeleton variant="text" width="70%" />
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// Field values of an empty case. `age` stays undefined (not 0 or '') so the
// schema reports "Age is required" rather than a type error.
const EMPTY_CASE = {
  patientName: '',
  age: undefined,
  gender: '',
  symptoms: '',
  medicalHistory: '',
  allergies: '',
  currentMedications: '',
  files: [],
  imageAnalysisType: '',
};

export default function PatientForm() {
  const [responseReceived, setResponseReceived] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [responseDetails, setResponseDetails] = useState<DiagnosisResponseDetails | null>(null);
  const [originalPatientInfo, setOriginalPatientInfo] = useState({});
  const [activeStep, setActiveStep] = useState(0);
  const [question, setQuestion] = useState('');
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpAnswers, setFollowUpAnswers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmNewCase, setConfirmNewCase] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [usageRefreshKey, setUsageRefreshKey] = useState(0);
  const submitAbortRef = useRef<AbortController | null>(null);

  const [openAIConfig, setOpenAIConfig] = useState<OpenAIConfig | null>(null);
  const [showOpenAIConfig, setShowOpenAIConfig] = useState(false);

  const PatientSchema = Yup.object().shape({
    patientName: Yup.string().required('Patient name is required'),
    age: Yup.number().positive().integer().required('Age is required'),
    symptoms: Yup.string().required('Symptoms are required'),
    medicalHistory: Yup.string(),
    allergies: Yup.string(),
    gender: Yup.string(),
    currentMedications: Yup.string(),
    files: Yup.array().of(Yup.mixed()),
  });

  const methods = useForm({
    resolver: yupResolver(PatientSchema),
  });

  const { reset, watch, handleSubmit } = methods;

  // Restore an unsent draft, then keep saving the form as the clinician types
  // (debounced). The last pending save is flushed on unmount so navigating
  // away mid-sentence doesn't drop it.
  useEffect(() => {
    const draft = loadPatientDraft();
    if (draft) {
      reset({ ...EMPTY_CASE, ...draft });
      setDraftRestored(true);
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending: Record<string, unknown> | null = null;

    const subscription = watch((values) => {
      pending = values;
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (pending) savePatientDraft(pending);
        pending = null;
      }, 500);
    });

    return () => {
      clearTimeout(timer);
      if (pending) savePatientDraft(pending);
      subscription.unsubscribe();
    };
  }, [reset, watch]);

  // A diagnosis can run for minutes; warn before a reload or tab close throws
  // the in-flight request away. (Also covers follow-up rounds, which share
  // this loading flag.)
  useEffect(() => {
    if (!isLoading) return undefined;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Chrome/Edge still require returnValue to be set.
      // eslint-disable-next-line no-param-reassign
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isLoading]);

  // Leaving the page aborts the submission instead of letting it land on an
  // unmounted view.
  useEffect(() => () => submitAbortRef.current?.abort(), []);

  useEffect(() => {
    const savedConfig = sessionStorage.getItem('openaiConfig');
    if (savedConfig) {
      try {
        setOpenAIConfig(JSON.parse(savedConfig));
      } catch (parseError) {
        console.error('Failed to parse saved OpenAI config:', parseError);
        sessionStorage.removeItem('openaiConfig');
      }
    }
  }, []);

  const onSubmit: SubmitHandler<{ [key: string]: any }> = async (data) => {
    const { files, ...patientData } = data;
    setOriginalPatientInfo(patientData);
    setDraftRestored(false);
    setIsLoading(true);

    submitAbortRef.current?.abort();
    const controller = new AbortController();
    submitAbortRef.current = controller;
    const { signal } = controller;

    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      console.error('No access token found in sessionStorage');
      setError('No access token found in sessionStorage');
      setIsLoading(false);
      return;
    }

    try {
      const conversationResponse = await axios.post(`${HOST_API}/conversation`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      const conversationId = conversationResponse.data.id;

      if (files && files.length > 0) {
         const filesToUpload = files.filter((f: any) => f instanceof File);
         if (filesToUpload.length > 0) {
            await uploadDocuments(filesToUpload, conversationId, undefined, signal);
         }
      }

      const formattedData = {
        ...patientData,
        conversationId,
        ...(openAIConfig && { openaiConfig: openAIConfig }),
      };

      const response = await axios.post(`${HOST_API}/diagnoses/submit`, formattedData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal,
      });

      setResponseDetails(response.data);
      // Persist the latest response so the "How it works" page can render the
      // real reasoning chain (pipeline stages) for this case. Best-effort.
      try {
        sessionStorage.setItem('lastDiagnosisResponse', JSON.stringify(response.data));
      } catch (e) {
        /* storage may be unavailable (private mode / quota) — non-fatal */
      }
      setActiveStep(0);
      setIsLoading(false);
      setResponseReceived(true);
      setUsageRefreshKey((k) => k + 1);
      // The input is deliberately NOT cleared here: "Revise case" returns to
      // the form with it intact, and only "New case" empties it.
    } catch (err: any) {
      setIsLoading(false);
      // Cancelled by the clinician: back to the form, input intact, no error.
      if (isRequestCancelled(err)) return;
      console.error(err.response ? err.response.data : err.message);
      setError(getErrorMessage(err, 'The diagnosis request failed. Please try again.'));
    } finally {
      if (submitAbortRef.current === controller) submitAbortRef.current = null;
    }
  };

  const handleCancelSubmit = () => {
    submitAbortRef.current?.abort();
  };

  const handleCloseSnackbar = () => {
    setError(null);
  };

  const clearResult = () => {
    setResponseReceived(false);
    setResponseDetails(null);
    setActiveStep(0);
    setShowFollowUp(false);
    setFollowUpAnswers([]);
    setQuestion('');
    setError(null);
  };

  // Back to the form with every field as it was submitted. The result itself
  // is kept server-side in History.
  const handleReviseCase = () => {
    clearResult();
  };

  const handleNewCase = () => {
    setConfirmNewCase(false);
    clearResult();
    setOriginalPatientInfo({});
    setDraftRestored(false);
    reset(EMPTY_CASE);
    clearPatientDraft();
  };

  const handleOpenAIConfigSet = (config: OpenAIConfig | null) => {
    setOpenAIConfig(config);
  };

  const hasDiagnoses = () => {
    if (responseDetails?.diagnoses?.common_diagnoses && responseDetails.diagnoses.common_diagnoses.length > 0) {
      return true;
    }
    const response = responseDetails as any;
    if (response?.followUpResponse?.common_diagnoses && response.followUpResponse.common_diagnoses.length > 0) {
      return true;
    }
    return false;
  };

  const getActiveDiagnosis = () => {
    if (responseDetails && responseDetails.diagnoses?.common_diagnoses &&
      responseDetails.diagnoses.common_diagnoses.length > 0) {
      return responseDetails.diagnoses.common_diagnoses[activeStep];
    }
    const response = responseDetails as any;
    if (response && response.followUpResponse?.common_diagnoses &&
      response.followUpResponse.common_diagnoses.length > 0) {
      return response.followUpResponse.common_diagnoses[activeStep];
    }
    return null;
  };

  const responseData: Partial<DiagnosisData> =
    responseDetails?.diagnoses || responseDetails?.followUpResponse || {};

  const fadeIn = varFade().in;

  return (
    <>
      <FormProvider methods={methods} onSubmit={methods.handleSubmit(onSubmit)}>
        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1.5 }}>
          <DailyUsage refreshKey={usageRefreshKey} />
        </Stack>

        <AnimatePresence mode="wait">
          {/* Loading skeleton */}
          {isLoading && !responseReceived && (
            <m.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <LoadingSkeleton onCancel={handleCancelSubmit} />
            </m.div>
          )}

          {/* Form */}
          {!responseReceived && !isLoading && (
            <m.div
              key="form"
              {...fadeIn}
            >
              {draftRestored && (
                <Alert
                  severity="info"
                  sx={{ mb: 3 }}
                  action={
                    <Button color="inherit" size="small" onClick={handleNewCase}>
                      Clear form
                    </Button>
                  }
                >
                  Your case details were restored from this browser tab.
                </Alert>
              )}
              <MainForm
                methods={methods}
                isLoading={isLoading}
                handleSubmit={handleSubmit(onSubmit)}
                openAIConfig={openAIConfig}
                onOpenAIConfigClick={() => setShowOpenAIConfig(true)}
              />
            </m.div>
          )}

          {/* Results */}
          {responseReceived && responseDetails && hasDiagnoses() && (
            <m.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Stack
                direction="row"
                spacing={1.5}
                justifyContent="flex-end"
                flexWrap="wrap"
                useFlexGap
              >
                <Button variant="outlined" color="inherit" startIcon={<NoteAlt />} onClick={handleReviseCase} disabled={isLoading}>
                  Revise case
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddCircleOutline />}
                  onClick={() => setConfirmNewCase(true)}
                  disabled={isLoading}
                >
                  New case
                </Button>
              </Stack>
              <ResponseDetails
                responseDetails={responseDetails}
                activeStep={activeStep}
                setActiveStep={setActiveStep}
                showFollowUp={showFollowUp}
                setShowFollowUp={setShowFollowUp}
                followUpAnswers={followUpAnswers}
                setFollowUpAnswers={setFollowUpAnswers}
                originalPatientInfo={originalPatientInfo}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                setResponseDetails={setResponseDetails}
                openAIConfig={openAIConfig}
              />
              <ChatBox
                question={question}
                setQuestion={setQuestion}
                originalPatientInfo={originalPatientInfo}
                initialResponse={getActiveDiagnosis()}
                openAIConfig={openAIConfig}
                conversationId={responseDetails.conversationId}
              />
              <ClinicalDisclaimer text={responseData.disclaimer} />
            </m.div>
          )}

          {/* No differential: abstention, work-up first, or an empty answer */}
          {responseReceived && responseDetails && !hasDiagnoses() && (
            <m.div
              key="no-differential"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <NoDifferentialPanel
                data={responseData}
                onReviseCase={handleReviseCase}
                onNewCase={handleNewCase}
              />
              <ClinicalDisclaimer text={responseData.disclaimer} />
            </m.div>
          )}
        </AnimatePresence>

        <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      </FormProvider>

      <ConfirmDialog
        open={confirmNewCase}
        onClose={() => setConfirmNewCase(false)}
        title="Start a new case?"
        content="The form will be cleared. The current result stays available in History."
        action={
          <Button variant="contained" onClick={handleNewCase}>
            New case
          </Button>
        }
      />

      <OpenAIConfigModal
        open={showOpenAIConfig}
        onClose={() => setShowOpenAIConfig(false)}
        onConfigSet={handleOpenAIConfigSet}
        initialConfig={openAIConfig}
      />
    </>
  );
}
