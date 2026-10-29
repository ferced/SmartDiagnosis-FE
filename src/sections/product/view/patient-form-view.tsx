import axios from 'axios';
import * as Yup from 'yup';
import { m, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, SubmitHandler } from 'react-hook-form';

import { NoteAlt, PostAdd, AddCircleOutline } from '@mui/icons-material';
import {
  Box,
  Card,
  Grid,
  Alert,
  Stack,
  Button,
  Skeleton,
  Snackbar,
  TextField,
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
import CaseTimeline from './CaseTimeline';
import ClinicalDisclaimer from './ClinicalDisclaimer';
import ResponseDetails from './response-details-form';
import NoDifferentialPanel from './NoDifferentialPanel';
import { CaseUpdate, DiagnosisData, TimelineEntry, DiagnosisResponseDetails } from './types';

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

// One timeline entry from a response: the differential as it stood then.
function snapshot(label: string, data: Partial<DiagnosisData> | undefined, addedText?: string): TimelineEntry {
  return {
    label,
    addedText,
    at: new Date().toISOString(),
    assessmentState: data?.assessment_state,
    diagnoses: (data?.common_diagnoses || []).map((d) => ({
      diagnosis: d.diagnosis,
      probability: d.probability,
      confirmation_status: d.confirmation_status,
    })),
  };
}

function responseData(details: any): Partial<DiagnosisData> {
  return details?.diagnoses || details?.followUpResponse || {};
}

// "Add new clinical information" box. New results and findings are added to
// the case over time and the assessment is updated; the original presentation
// is not edited. That is what "Revise original case" is for.
function AddFindingsBox({
  onSubmit,
  onCancel,
  updating,
  disabled,
}: {
  onSubmit: (text: string) => Promise<boolean>;
  onCancel: () => void;
  updating: boolean;
  disabled: boolean;
}) {
  const [text, setText] = useState('');
  const submit = async () => {
    if (!text.trim()) return;
    if (await onSubmit(text.trim())) setText('');
  };
  return (
    <Card sx={{ mt: 3, p: 2.5 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        Add new clinical information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        New results, examination findings or the course since the last assessment. They are added
        to the case in order; the original presentation stays as entered.
      </Typography>
      <TextField
        fullWidth
        multiline
        minRows={2}
        placeholder="Add new clinical information… e.g. CT pulmonary angiography: filling defects in the right lower lobe segmental arteries"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={updating || disabled}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit();
        }}
      />
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.5 }}>
        <Button
          variant="contained"
          startIcon={updating ? <CircularProgress size={18} color="inherit" /> : <PostAdd />}
          onClick={submit}
          disabled={!text.trim() || updating || disabled}
        >
          {updating ? 'Updating assessment…' : 'Update assessment'}
        </Button>
        {updating && (
          <Button color="inherit" size="small" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {updating && (
          <Typography variant="caption" color="text.secondary">
            Re-running the full assessment with everything entered so far — this can take a few
            minutes.
          </Typography>
        )}
      </Stack>
    </Card>
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

  // Longitudinal case state: information added after the first assessment, and
  // every state the assessment went through. Kept across "Revise original
  // case"; cleared by "New case".
  const [caseUpdates, setCaseUpdates] = useState<CaseUpdate[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  // Bumped on each update so the results view starts fresh for the new state
  // (its follow-up rounds and conclusion belonged to the previous one).
  const [assessmentVersion, setAssessmentVersion] = useState(0);
  const [updating, setUpdating] = useState(false);
  const updateAbortRef = useRef<AbortController | null>(null);

  const PatientSchema = Yup.object().shape({
    patientName: Yup.string().required('Patient name is required'),
    age: Yup.number().positive().integer().required('Age is required'),
    symptoms: Yup.string().required('Symptoms are required'),
    medicalHistory: Yup.string(),
    allergies: Yup.string(),
    // Required: the engine's symbolic checks rule out sex-incompatible
    // diagnoses with it. The medical history stays optional.
    gender: Yup.string().required('Gender is required'),
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
  useEffect(
    () => () => {
      submitAbortRef.current?.abort();
      updateAbortRef.current?.abort();
    },
    []
  );

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
        ...(caseUpdates.length > 0 && { caseUpdates }),
        ...(openAIConfig && { openaiConfig: openAIConfig }),
      };

      const response = await axios.post(`${HOST_API}/diagnoses/submit`, formattedData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal,
      });

      setResponseDetails(response.data);
      setTimeline((prev) => [
        ...prev,
        snapshot(
          prev.length === 0 ? 'Initial assessment' : 'Original case revised',
          responseData(response.data)
        ),
      ]);
      setAssessmentVersion((v) => v + 1);
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
      // The input is deliberately NOT cleared here: "Revise original case"
      // returns to the form with it intact, and only "New case" empties it.
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

  // Back to the form with every field as it was submitted, to correct the
  // original presentation. Information added later and the timeline are kept
  // and go with the resubmission. The result itself is kept in History.
  const handleReviseCase = () => {
    updateAbortRef.current?.abort();
    clearResult();
  };

  // Adds new clinical information to the case and re-runs the full assessment
  // on everything entered so far, in the same conversation.
  const handleAddFindings = async (text: string): Promise<boolean> => {
    const token = sessionStorage.getItem('accessToken');
    if (!token || !responseDetails) {
      setError('No access token found in sessionStorage');
      return false;
    }
    const nextUpdates = [...caseUpdates, { text, addedAt: new Date().toISOString() }];

    updateAbortRef.current?.abort();
    const controller = new AbortController();
    updateAbortRef.current = controller;
    setUpdating(true);
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${HOST_API}/diagnoses/submit`,
        {
          ...originalPatientInfo,
          conversationId: responseDetails.conversationId,
          caseUpdates: nextUpdates,
          ...(openAIConfig && { openaiConfig: openAIConfig }),
        },
        { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
      );
      setCaseUpdates(nextUpdates);
      setResponseDetails(response.data);
      setTimeline((prev) => [...prev, snapshot('New findings', responseData(response.data), text)]);
      setAssessmentVersion((v) => v + 1);
      setActiveStep(0);
      setShowFollowUp(false);
      setFollowUpAnswers([]);
      setUsageRefreshKey((k) => k + 1);
      try {
        sessionStorage.setItem('lastDiagnosisResponse', JSON.stringify(response.data));
      } catch (e) {
        /* storage may be unavailable (private mode / quota) — non-fatal */
      }
      return true;
    } catch (err: any) {
      if (!isRequestCancelled(err)) {
        setError(getErrorMessage(err, 'The assessment could not be updated. Please try again.'));
      }
      return false;
    } finally {
      setUpdating(false);
      setIsLoading(false);
      if (updateAbortRef.current === controller) updateAbortRef.current = null;
    }
  };

  // A follow-up round inside the results view is a new state of the case too.
  const handleAssessmentRound = (label: string, data: DiagnosisData | undefined) => {
    setTimeline((prev) => [...prev, snapshot(label, data)]);
  };

  const handleNewCase = () => {
    setConfirmNewCase(false);
    updateAbortRef.current?.abort();
    setCaseUpdates([]);
    setTimeline([]);
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

  const currentData: Partial<DiagnosisData> = responseData(responseDetails);
  // Every request about this case carries what was added to it over time.
  const casePatientInfo =
    caseUpdates.length > 0 ? { ...originalPatientInfo, caseUpdates } : originalPatientInfo;

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
                  Revise original case
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
              <CaseTimeline entries={timeline} />
              <ResponseDetails
                key={assessmentVersion}
                responseDetails={responseDetails}
                activeStep={activeStep}
                setActiveStep={setActiveStep}
                showFollowUp={showFollowUp}
                setShowFollowUp={setShowFollowUp}
                followUpAnswers={followUpAnswers}
                setFollowUpAnswers={setFollowUpAnswers}
                originalPatientInfo={casePatientInfo}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                setResponseDetails={setResponseDetails}
                onAssessment={handleAssessmentRound}
                openAIConfig={openAIConfig}
              />
              <AddFindingsBox
                onSubmit={handleAddFindings}
                onCancel={() => updateAbortRef.current?.abort()}
                updating={updating}
                disabled={isLoading && !updating}
              />
              <ChatBox
                question={question}
                setQuestion={setQuestion}
                originalPatientInfo={casePatientInfo}
                initialResponse={getActiveDiagnosis()}
                openAIConfig={openAIConfig}
                conversationId={responseDetails.conversationId}
              />
              <ClinicalDisclaimer text={currentData.disclaimer} />
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
              <CaseTimeline entries={timeline} />
              <NoDifferentialPanel
                data={currentData}
                onReviseCase={handleReviseCase}
                onNewCase={handleNewCase}
              />
              <AddFindingsBox
                onSubmit={handleAddFindings}
                onCancel={() => updateAbortRef.current?.abort()}
                updating={updating}
                disabled={isLoading && !updating}
              />
              <ClinicalDisclaimer text={currentData.disclaimer} />
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
