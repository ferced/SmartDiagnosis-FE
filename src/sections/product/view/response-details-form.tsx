import axios from 'axios';
import { m } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';

import {
  Science,
  Healing,
  BarChart,
  Assignment,
  WarningAmber,
  NavigateNext,
  CompareArrows,
  NavigateBefore,
  CheckCircleOutline,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Chip,
  Grid,
  Step,
  Alert,
  Stack,
  Button,
  Divider,
  Stepper,
  Snackbar,
  useTheme,
  StepButton,
  Typography,
  CardContent,
  LinearProgress,
} from '@mui/material';

import { HOST_API } from 'src/config-global';

import { varFade } from 'src/components/animate';

import TreatmentPlan from './TreatmentPlan';
import RareDiseasePanel from './RareDiseasePanel';
import DrugInteractionAlert from './DrugInteractionAlert';
import EvidenceLinksSection from './EvidenceLinksSection';
import ConfidenceCalibration from './ConfidenceCalibration';
import PreviousWorkingDiagnoses from './PreviousWorkingDiagnoses';
import FollowUpModal from '../../../components/modals/FollowUpModal';
import { probabilityColor, parseProbabilityPercent } from './probability';
import { DiagnosisDetail, ArchivedDiagnosis, ResponseDetailsProps } from './types';

interface OpenAIConfig {
  apiKey: string;
  model: string;
}

// Probability parsing and colour now live in ./probability, shared with the
// rare-disease panel so the same value cannot render two different ways.

export default function ResponseDetails({
  responseDetails,
  activeStep,
  setActiveStep,
  showFollowUp,
  setShowFollowUp,
  followUpAnswers,
  setFollowUpAnswers,
  originalPatientInfo,
  isLoading,
  setIsLoading,
  setResponseDetails,
  openAIConfig,
}: ResponseDetailsProps & { openAIConfig?: OpenAIConfig | null }) {
  const theme = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ question: string; answer: string }>
  >([]);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [followUpCounter, setFollowUpCounter] = useState(0);
  const [finalDiagnosis, setFinalDiagnosis] = useState<DiagnosisDetail | null>(null);
  const [preservedRareDiagnoses, setPreservedRareDiagnoses] = useState<DiagnosisDetail[] | null>(null);
  const [archivedDiagnoses, setArchivedDiagnoses] = useState<ArchivedDiagnosis[]>([]);
  const [finalNarrative, setFinalNarrative] = useState<string | null>(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  // Structured case state captured from the rare-disease test panel, fed back
  // into the backend prompts so the engine does not re-recommend tests already
  // performed (it receives them as authoritative "Known Case State").
  const [completedTests, setCompletedTests] = useState<{ name: string; result: string }[]>([]);

  const {
    diagnosesData,
    disclaimer,
    follow_up_questions,
    abstained,
    abstentionReason,
    topConfidence,
    workupFirst,
    workupReason,
    recommendedWorkup,
  } = useMemo(() => {
    const diagnoses = responseDetails?.diagnoses || (responseDetails as any)?.followUpResponse || {};
    return {
      diagnosesData: diagnoses.common_diagnoses || [],
      disclaimer: diagnoses.disclaimer || '',
      follow_up_questions: diagnoses.follow_up_questions || [],
      abstained: Boolean(diagnoses.abstained),
      abstentionReason: diagnoses.abstention_reason || '',
      topConfidence: diagnoses.top_confidence || '',
      // Evidence gate: the leading differential rests on a finding that was
      // never obtained, so the workup is the deliverable, not the diagnosis.
      workupFirst: Boolean(diagnoses.workup_first),
      workupReason: diagnoses.workup_reason || '',
      recommendedWorkup: (diagnoses.recommended_workup || []) as string[],
    };
  }, [responseDetails]);

  const rareDiseasesData = useMemo(() => {
    if (preservedRareDiagnoses) return preservedRareDiagnoses;
    const diagnoses = responseDetails?.diagnoses || (responseDetails as any)?.followUpResponse || {};
    return diagnoses.rare_diagnoses || null;
  }, [preservedRareDiagnoses, responseDetails]);

  useEffect(() => {
    const diagnoses = responseDetails?.diagnoses || (responseDetails as any)?.followUpResponse || {};
    if (diagnoses.rare_diagnoses && diagnoses.rare_diagnoses.length > 0 && !preservedRareDiagnoses) {
      setPreservedRareDiagnoses(diagnoses.rare_diagnoses);
    }
  }, [responseDetails, preservedRareDiagnoses]);

  useEffect(() => {
    if (finalDiagnosis || diagnosesData.length === 0) return;
    // The case is concluded either after the 3 follow-up rounds, or as soon as
    // the workup converges to a single remaining diagnosis after any round.
    // Both must flip to the dedicated conclusion view (hide the rule-out panel,
    // surface the full writeup) — not only the 3-round path.
    const convergedToOne = followUpCounter > 0 && diagnosesData.length === 1;
    if (followUpCounter >= 3 || convergedToOne) {
      setFinalDiagnosis(diagnosesData[0]);
      setActiveStep(0);
    }
  }, [followUpCounter, diagnosesData, finalDiagnosis, setActiveStep]);

  // Once a final diagnosis is reached, fetch the consolidated diagnosis + full
  // treatment writeup from the singular /diagnosis/followup endpoint (the only
  // path that returns the complete prose plan) and surface it on the main view,
  // instead of forcing the clinician to re-query it in the free-text ChatBox.
  useEffect(() => {
    // Don't compile a confident consolidated plan when the engine abstained.
    if (!finalDiagnosis || abstained || finalNarrative || narrativeLoading) return;

    const fetchFinalNarrative = async () => {
      const token = sessionStorage.getItem('accessToken');
      if (!token) return;

      setNarrativeLoading(true);
      try {
        const payload = {
          originalPatientInfo: {
            ...originalPatientInfo,
            patientName: originalPatientInfo.patientName || '',
            age: parseInt(originalPatientInfo.age, 10) || 0,
            gender: originalPatientInfo.gender || '',
            symptoms: originalPatientInfo.symptoms || '',
            medicalHistory: originalPatientInfo.medicalHistory || '',
            allergies: originalPatientInfo.allergies || '',
            currentMedications: originalPatientInfo.currentMedications || '',
            ...(completedTests.length > 0 && { completedTests }),
            ...(openAIConfig && { openaiConfig: openAIConfig }),
          },
          initialResponse: {
            disclaimer,
            diagnosis: finalDiagnosis.diagnosis,
            treatment: finalDiagnosis.treatment,
            probability: finalDiagnosis.probability,
            follow_up_questions: [],
            rare_diagnoses: preservedRareDiagnoses || rareDiseasesData || [],
          },
          followUpQuestion:
            'Provide the consolidated final diagnosis and the complete recommended treatment plan as a clear, comprehensive writeup.',
          conversationHistory: conversationHistory.map((entry) => ({
            question: entry.question,
            response: entry.answer,
          })),
          ...(openAIConfig && { openaiConfig: openAIConfig }),
        };

        const resp = await axios.post(`${HOST_API}/diagnosis/followup`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const narrative = resp?.data?.followUpResponse?.response;
        if (narrative) setFinalNarrative(narrative);
      } catch (err) {
        console.error('Error fetching final diagnosis writeup:', err);
      } finally {
        setNarrativeLoading(false);
      }
    };

    fetchFinalNarrative();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalDiagnosis, finalNarrative]);

  const showFollowUpButton = diagnosesData.length > 1 && follow_up_questions.length > 0 && followUpCounter < 3 && !finalDiagnosis;

  const handleFollowUpSubmit = async () => {
    setIsLoading(true);

    const token = sessionStorage.getItem('accessToken');

    if (!token) {
      console.error('No access token found in sessionStorage');
      setError('No access token found in sessionStorage');
      setIsLoading(false);
      return;
    }

    try {
      const newConversationEntries = follow_up_questions.map((question: string, index: number) => ({
        question,
        answer: followUpAnswers[index] || '',
      }));

      if (additionalInfo.trim() !== '') {
        newConversationEntries.push({
          question: 'Additional Information',
          answer: additionalInfo.trim(),
        });
      }

      const updatedConversationHistory = [...conversationHistory, ...newConversationEntries];
      setConversationHistory(updatedConversationHistory);

      const followUpRequest = {
        originalPatientInfo: {
          ...originalPatientInfo,
          patientName: originalPatientInfo.patientName || '',
          age: parseInt(originalPatientInfo.age, 10) || 0,
          gender: originalPatientInfo.gender || '',
          symptoms: originalPatientInfo.symptoms || '',
          medicalHistory: originalPatientInfo.medicalHistory || '',
          allergies: originalPatientInfo.allergies || '',
          currentMedications: originalPatientInfo.currentMedications || '',
          ...(completedTests.length > 0 && { completedTests }),
          // How many rounds of history-taking have already run. The engine uses
          // it to stop asking and commit to a workup instead of looping.
          historyRounds: followUpCounter,
          ...(openAIConfig && { openaiConfig: openAIConfig }),
        },
        initialResponse: {
          disclaimer,
          diagnoses: diagnosesData,
          follow_up_questions
        },
        followUpAnswers,
        additionalInfo: additionalInfo.trim(),
        conversationHistory: updatedConversationHistory.map(entry => ({
          question: entry.question,
          response: entry.answer
        })),
        ...(openAIConfig && { openaiConfig: openAIConfig }),
      };

      // The counter is only committed once the round actually succeeds. It used
      // to be set before the request: that re-rendered immediately at 3, which
      // fired the "final diagnosis" effect against the STALE pre-round-3 list —
      // so for the 30-90s the request was in flight the page showed a confident
      // conclusion for a diagnosis the engine had not converged on, and even
      // compiled a full treatment narrative for it. A failed round also counted,
      // permanently dead-ending the case on a conclusion that never happened.
      const newFollowUpCounter = followUpCounter + 1;

      if (newFollowUpCounter === 3) {
        const response = await axios.post(`${HOST_API}/diagnoses/followup`, followUpRequest, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const responseData = response.data;
        const diagnosisData = responseData?.followUpResponse || responseData?.diagnoses;

        if (diagnosisData && diagnosisData.common_diagnoses && diagnosisData.common_diagnoses.length > 0) {
          const finalDiag = diagnosisData.common_diagnoses[0];
          setFinalDiagnosis(finalDiag);

          const modifiedResponse = {
            ...responseData,
            followUpResponse: {
              ...diagnosisData,
              common_diagnoses: [finalDiag],
              follow_up_questions: [],
              rare_diagnoses: preservedRareDiagnoses || diagnosisData.rare_diagnoses
            }
          };

          setResponseDetails(modifiedResponse);
        } else {
          setResponseDetails(response.data);
        }
      } else {
        const response = await axios.post(`${HOST_API}/diagnoses/followup`, followUpRequest, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.data) {
          throw new Error('Empty response from server');
        }

        setResponseDetails(response.data);
      }

      setFollowUpCounter(newFollowUpCounter);
      setFollowUpAnswers([]);
      setAdditionalInfo('');
      setIsLoading(false);
      setShowFollowUp(false);
      setActiveStep(0);
    } catch (err) {
      console.error('Error in handleFollowUpSubmit:', err);
      console.error('Error response:', err.response?.data);
      setError(
        typeof err.response?.data === 'object' ? JSON.stringify(err.response.data) : err.message
      );
      setIsLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
  };

  const displayDiagnoses = diagnosesData;

  const handleTestResult = async (
    decision: string,
    action: any,
    rareDiseaseId: string,
    performedTests?: { name: string; result: string }[]
  ) => {
    // Accumulate the tests the clinician actually ran (with results) so later
    // diagnosis/treatment calls don't re-order them.
    if (performedTests && performedTests.length > 0) {
      setCompletedTests((prev) => {
        const byName = new Map(prev.map((t) => [t.name, t]));
        performedTests.forEach((t) => {
          if (t.name) byName.set(t.name, { name: t.name, result: t.result || '' });
        });
        return Array.from(byName.values());
      });
    }

    if (decision === 'CONFIRM' && action.shouldBecomePrimary) {
      const rareDisease = rareDiseasesData?.find((d: DiagnosisDetail) => d.diagnosis === rareDiseaseId);
      if (rareDisease) {
        const confirmedRareDisease: DiagnosisDetail = {
          ...rareDisease,
          probability: action.probability || rareDisease.probability,
          treatment: action.updatedDiagnosis?.treatment || rareDisease.treatment,
          testConfirmed: true,
        };

        const remainingRareDiagnoses = (rareDiseasesData || []).filter(
          (d: DiagnosisDetail) => d.diagnosis !== rareDiseaseId
        );

        setPreservedRareDiagnoses(remainingRareDiagnoses);

        const auditEntry: ArchivedDiagnosis = {
          diagnosis: confirmedRareDisease.diagnosis,
          treatment: confirmedRareDisease.treatment,
          probability: confirmedRareDisease.probability,
          timestamp: Math.floor(Date.now() / 1000).toString(),
          reason: `Promoted from rare diseases panel after positive test result`,
        };
        setArchivedDiagnoses(prev => [...prev, auditEntry]);

        setResponseDetails((prev: any) => {
          const prevDiagnoses = prev?.diagnoses || (prev as any)?.followUpResponse || {};
          const existingCommon: DiagnosisDetail[] = prevDiagnoses.common_diagnoses || [];
          const dedupedCommon = existingCommon.filter((d) => d.diagnosis !== rareDiseaseId);
          return {
            ...prev,
            diagnoses: {
              ...prevDiagnoses,
              common_diagnoses: [confirmedRareDisease, ...dedupedCommon],
              rare_diagnoses: remainingRareDiagnoses,
            },
          };
        });

        setActiveStep(0);
      }
    } else if (decision === 'RULE_OUT' && action.shouldBeDismissed) {
      const updatedRareDiseases = rareDiseasesData?.filter(
        (d: DiagnosisDetail) => d.diagnosis !== rareDiseaseId
      );

      setPreservedRareDiagnoses(updatedRareDiseases);

      // After any follow-up round the response lives under `followUpResponse`
      // and there is no `diagnoses` key. Spreading `prev.diagnoses` (undefined)
      // produced a `diagnoses` object holding ONLY rare_diagnoses — no
      // common_diagnoses, no disclaimer, no abstention — and since the reader
      // prefers `diagnoses` over `followUpResponse`, ruling out one rare
      // candidate erased every diagnosis card from the screen. The CONFIRM
      // branch above already reads from either shape; this now matches it.
      setResponseDetails((prev: any) => {
        const prevDiagnoses = prev?.diagnoses || (prev as any)?.followUpResponse || {};
        return {
          ...prev,
          diagnoses: {
            ...prevDiagnoses,
            rare_diagnoses: updatedRareDiseases,
          },
        };
      });
    } else if (decision === 'INCONCLUSIVE') {
      // Previously a silent console.log: the dialog closed cleanly and nothing
      // on screen changed, which is indistinguishable from the result having
      // been applied.
      setError(
        'The test result was inconclusive for this condition — it was neither confirmed nor ruled out. Further testing may be required.'
      );
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const token = sessionStorage.getItem('accessToken');
      if (!token) return;

      // Never let the report's "Diagnosis Results" section come out empty: when a
      // final diagnosis is reached, send it (with the full narrative as its
      // treatment) so the deliverable always carries the conclusion on screen.
      const pdfDiagnoses = (() => {
        if (finalDiagnosis) {
          return [{ ...finalDiagnosis, treatment: finalNarrative || finalDiagnosis.treatment }];
        }
        return diagnosesData;
      })();

      const response = await axios.post(
        `${HOST_API}/reports/pdf`,
        {
          patientInfo: originalPatientInfo,
          response: {
            disclaimer,
            common_diagnoses: pdfDiagnoses,
            rare_diagnoses: finalDiagnosis ? [] : rareDiseasesData,
            follow_up_questions
          }
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'diagnosis_report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Failed to download PDF report');
    }
  };

  const fadeInUp = varFade().inUp;

  return (
    <Grid container spacing={3} sx={{ mt: 3 }}>
      <Grid item xs={12} md={!finalDiagnosis && rareDiseasesData && rareDiseasesData.length > 0 ? 8 : 12}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<Assignment />}
            onClick={handleDownloadPDF}
          >
            Download PDF Report
          </Button>
        </Box>

        {workupFirst && (
          <Alert severity="info" icon={<Science />} sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Workup first — the leading differential is not yet confirmable
            </Typography>
            <Typography variant="body2">
              {workupReason ||
                'The leading differential depends on a finding that has not been obtained for this patient.'}
            </Typography>
            {recommendedWorkup.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  Outstanding investigations:
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                  {recommendedWorkup.map((test: string, idx: number) => (
                    <Chip key={idx} label={test} size="small" color="info" variant="outlined" />
                  ))}
                </Stack>
              </Box>
            )}
          </Alert>
        )}

        {abstained && (
          <Alert severity="warning" icon={<WarningAmber />} sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              GMIS abstained — confidence below threshold
            </Typography>
            <Typography variant="body2">
              {abstentionReason ||
                'The available evidence does not support a definitive diagnosis. The conditions below are considerations to investigate, not a conclusion.'}
            </Typography>
          </Alert>
        )}

        {/* MUI Stepper */}
        <Stepper nonLinear activeStep={activeStep} sx={{ mb: 4 }}>
          {displayDiagnoses.map((_: any, idx: number) => (
            <Step key={idx} completed={false}>
              <StepButton
                onClick={() => {
                  setActiveStep(idx);
                  setShowFollowUp(false);
                }}
                sx={{
                  '& .MuiStepLabel-label': {
                    fontWeight: activeStep === idx ? 'bold' : 'normal',
                  },
                }}
              >
                Diagnosis {idx + 1}
              </StepButton>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 2 }}>
          {displayDiagnoses.map((details: DiagnosisDetail, idx: number) => {
            // "Confirmed" must mean a test confirmed it. It previously also
            // became true the moment three questionnaire rounds had elapsed, so
            // the card claimed a confirmed diagnosis when nothing had been
            // confirmed — no test, no result. Converging on one candidate is a
            // WORKING diagnosis, which is a different and weaker claim.
            const stillUnconfirmed = Boolean(details.provisional) || workupFirst || abstained;
            const confirmed = Boolean(details.testConfirmed) && !stillUnconfirmed;
            const working = Boolean(finalDiagnosis) && !confirmed && !stillUnconfirmed;

            let headerColor = theme.palette.info.dark;
            if (abstained) headerColor = theme.palette.warning.dark;
            else if (confirmed) headerColor = theme.palette.success.dark;
            let cardBorder = 'none';
            if (abstained) cardBorder = `2px solid ${theme.palette.warning.main}`;
            else if (confirmed) cardBorder = `2px solid ${theme.palette.success.dark}`;

            // The probability shown is always the engine's own. It used to be
            // overwritten with the literal string 'High' once a final diagnosis
            // was picked, which then parsed to 80% and drew a green bar — while
            // the PDF exported the real value, so screen and report disagreed.
            const probabilityLabel = abstained
              ? topConfidence || details.probability
              : details.probability;
            return (
            <div
              key={idx}
              style={{
                display: activeStep === idx ? 'block' : 'none',
              }}
            >
              <m.div {...fadeInUp}>
                <Card
                  raised
                  sx={{
                    maxWidth: '100%',
                    mx: 'auto',
                    bgcolor: theme.palette.background.paper,
                    boxShadow: confirmed
                      ? theme.customShadows?.success || '0px 8px 32px rgba(0, 137, 123, 0.2)'
                      : theme.customShadows?.card || '0px 4px 20px rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    transition: 'all 0.5s ease-in-out',
                    transform: confirmed ? 'scale(1.02)' : 'scale(1)',
                    border: cardBorder,
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: headerColor,
                      color: theme.palette.common.white,
                      p: 3,
                      textAlign: 'center',
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                      {confirmed && <CheckCircleOutline sx={{ fontSize: 36 }} />}
                      {abstained && <WarningAmber sx={{ fontSize: 36 }} />}
                      <Typography variant="h4">
                        {(() => {
                          if (abstained) return 'Abstained — Confidence Below Threshold';
                          if (details.provisional || workupFirst)
                            return 'Provisional — Confirmatory Workup Pending';
                          if (confirmed) return 'Test-confirmed Diagnosis';
                          if (working) return 'Working Diagnosis';
                          return `Diagnosis Result ${idx + 1}`;
                        })()}
                      </Typography>
                    </Box>
                  </Box>

                  <CardContent>
                    {/* Diagnosis */}
                    <Box display="flex" alignItems="center" my={2}>
                      <Healing sx={{ color: theme.palette.success.main, mr: 2 }} />
                      <Typography variant="h6">{abstained ? 'Leading consideration' : 'Diagnosis'}</Typography>
                    </Box>
                    <Typography paragraph sx={{ ml: 4 }}>
                      {details.diagnosis}
                    </Typography>

                    {details.provisional && (
                      <Alert severity="warning" icon={<Science />} sx={{ ml: 4, mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Provisional — depends on a finding not yet obtained
                        </Typography>
                        <Typography variant="body2">
                          {details.provisional_reason ||
                            'This differential rests on a result that is not in the record.'}
                        </Typography>
                        {details.pending_confirmations && details.pending_confirmations.length > 0 && (
                          <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2.5 }}>
                            {details.pending_confirmations
                              .filter((pc) => !pc.resolved)
                              .map((pc, pcIdx) => (
                                <li key={pcIdx}>
                                  <Typography variant="body2">
                                    <strong>{pc.finding}</strong> — confirm with{' '}
                                    <strong>{pc.test}</strong>
                                    {pc.if_absent ? `. ${pc.if_absent}` : ''}
                                  </Typography>
                                </li>
                              ))}
                          </Box>
                        )}
                      </Alert>
                    )}

                    <Divider sx={{ my: 2 }} />

                    {/* Probability with bar */}
                    <Box display="flex" alignItems="center" my={2}>
                      <BarChart sx={{ color: theme.palette.info.main, mr: 2 }} />
                      <Typography variant="h6">Probability</Typography>
                    </Box>
                    <Box sx={{ ml: 4 }}>
                      {(() => {
                        const percent = parseProbabilityPercent(probabilityLabel);
                        // An unreadable probability must not draw a bar. The old
                        // code defaulted to 50%, so an empty string produced a
                        // confident half-full bar with nothing behind it.
                        if (percent === null) {
                          return (
                            <Typography paragraph color="text.secondary">
                              {probabilityLabel || 'Not reported by the engine'}
                            </Typography>
                          );
                        }
                        return (
                          <>
                            <Typography paragraph>{probabilityLabel}</Typography>
                            <LinearProgress
                              variant="determinate"
                              value={percent}
                              color={probabilityColor(percent)}
                              sx={{ height: 8, borderRadius: 1, mb: 2 }}
                            />
                          </>
                        );
                      })()}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Treatment with Markdown */}
                    <Box display="flex" alignItems="center" my={2}>
                      <Assignment sx={{ color: theme.palette.info.main, mr: 2 }} />
                      <Typography variant="h6">
                        {abstained ? 'Recommended workup & considerations' : 'Treatment'}
                      </Typography>
                    </Box>
                    <Box sx={{ ml: 4 }}>
                      {finalDiagnosis && narrativeLoading && !finalNarrative ? (
                        <Box display="flex" alignItems="center" gap={1}>
                          <LinearProgress sx={{ flexGrow: 1, height: 6, borderRadius: 1 }} />
                          <Typography variant="caption" color="text.secondary">
                            Compiling full treatment plan…
                          </Typography>
                        </Box>
                      ) : (
                        <TreatmentPlan
                          markdown={finalDiagnosis && finalNarrative ? finalNarrative : details.treatment}
                        />
                      )}
                    </Box>

                    {/* Interactions belong immediately under the plan they are
                        about — it is a safety alert on what was just proposed. */}
                    {details.drug_interactions && details.drug_interactions.length > 0 && (
                      <Box sx={{ ml: 4 }}>
                        <DrugInteractionAlert drugInteractions={details.drug_interactions} />
                      </Box>
                    )}

                    {/* The rejected alternative is the product: asserting the
                        right answer is worth less than showing the discrimination
                        that produced it. */}
                    {details.considered_alternatives &&
                      details.considered_alternatives.length > 0 && (
                        <>
                          <Divider sx={{ my: 2 }} />
                          <Box display="flex" alignItems="center" my={2}>
                            <CompareArrows sx={{ color: theme.palette.info.main, mr: 2 }} />
                            <Typography variant="h6">Alternatives considered</Typography>
                          </Box>
                          <Stack spacing={1.5} sx={{ ml: 4 }}>
                            {details.considered_alternatives.map((alt, altIdx) => (
                              <Box key={altIdx}>
                                <Typography variant="subtitle2">{alt.diagnosis}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {alt.discriminator}
                                </Typography>
                                {alt.missing_features && alt.missing_features.length > 0 && (
                                  <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                                    {alt.missing_features.map((f, fIdx) => (
                                      <Chip
                                        key={fIdx}
                                        label={`absent: ${f}`}
                                        size="small"
                                        variant="outlined"
                                      />
                                    ))}
                                  </Stack>
                                )}
                              </Box>
                            ))}
                          </Stack>
                        </>
                      )}

                    {/* Where recognized bodies disagree, say so rather than
                        presenting one side of a live controversy as consensus. */}
                    {details.guideline_basis && details.guideline_basis.length > 0 && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Box display="flex" alignItems="center" my={2}>
                          <Assignment sx={{ color: theme.palette.info.main, mr: 2 }} />
                          <Typography variant="h6">Guideline basis</Typography>
                        </Box>
                        <Stack spacing={1} sx={{ ml: 4 }}>
                          {details.guideline_basis.map((g, gIdx) => (
                            <Box key={gIdx}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Chip
                                  label={g.year ? `${g.body} ${g.year}` : g.body}
                                  size="small"
                                  color={g.contested ? 'warning' : 'default'}
                                />
                                {g.contested && (
                                  <Chip label="contested" size="small" color="warning" variant="outlined" />
                                )}
                              </Box>
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {g.statement}
                              </Typography>
                              {g.contested && g.contested_note && (
                                <Typography variant="caption" color="warning.dark">
                                  {g.contested_note}
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Stack>
                      </>
                    )}

                    {/* Citations grounded against real PubMed records, with the
                        unverified ones marked as such. */}
                    {details.evidence_links && details.evidence_links.length > 0 && (
                      <Box sx={{ ml: 4 }}>
                        <EvidenceLinksSection evidenceLinks={details.evidence_links} />
                      </Box>
                    )}

                    {/* What would most raise confidence, surfaced as its own
                        block rather than buried in the monitoring section. */}
                    {details.missing_information && details.missing_information.length > 0 && (
                      <Box sx={{ mt: 3 }}>
                        <ConfidenceCalibration missingInformation={details.missing_information} />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </m.div>
            </div>
          );
          })}

          {/* A conclusion may only be announced when nothing is outstanding.
              These banners used to fire alongside the abstention and
              provisional warnings, so the same screen said both "the workup is
              not confirmable yet" and "final diagnosis reached". They also
              claimed "after 3 rounds of follow-up questions" on the path that
              converges after one, stating a false provenance for the answer. */}
          {(() => {
            const outstanding =
              abstained || workupFirst || displayDiagnoses.some((d: DiagnosisDetail) => d.provisional);
            if (outstanding) return null;

            if (finalDiagnosis) {
              return (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Working diagnosis reached after {followUpCounter}{' '}
                  {followUpCounter === 1 ? 'round' : 'rounds'} of follow-up: this is the most
                  probable diagnosis given the information provided.
                </Alert>
              );
            }

            if (displayDiagnoses.length === 1 && follow_up_questions.length === 0) {
              return (
                <Alert severity="success" sx={{ mt: 2 }}>
                  A single differential remains and no further follow-up questions were proposed.
                </Alert>
              );
            }

            return null;
          })()}

          <PreviousWorkingDiagnoses archivedDiagnoses={archivedDiagnoses} />

          {showFollowUp && (
            <FollowUpModal
              isOpen={showFollowUp}
              onClose={() => setShowFollowUp(false)}
              followUpQuestions={follow_up_questions}
              followUpAnswers={followUpAnswers}
              setFollowUpAnswers={setFollowUpAnswers}
              handleSubmit={handleFollowUpSubmit}
              isLoading={isLoading}
            />
          )}
        </Box>

        {/* Navigation buttons */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            startIcon={<NavigateBefore />}
            disabled={activeStep === 0}
            onClick={() => {
              setActiveStep((prev) => Math.max(prev - 1, 0));
              setShowFollowUp(false);
            }}
          >
            Previous
          </Button>

          <Stack direction="row" alignItems="center" spacing={2}>
            {followUpCounter > 0 && !finalDiagnosis && (
              <Typography variant="body2" color="text.secondary">
                Follow-up rounds: {followUpCounter}/3
              </Typography>
            )}

            {showFollowUpButton && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => setShowFollowUp(true)}
              >
                Follow Up Questions
              </Button>
            )}
          </Stack>

          <Button
            variant="outlined"
            endIcon={<NavigateNext />}
            disabled={activeStep === displayDiagnoses.length - 1}
            onClick={() => {
              setActiveStep((prev) => Math.min(prev + 1, displayDiagnoses.length - 1));
              setShowFollowUp(false);
            }}
          >
            Next
          </Button>
        </Stack>
      </Grid>

      {/* Rare Disease Panel - Right Side (hidden once a final diagnosis is reached) */}
      {!finalDiagnosis && rareDiseasesData && rareDiseasesData.length > 0 && (
        <Grid item xs={12} md={4}>
          <RareDiseasePanel
            rareDiseases={rareDiseasesData}
            onTestSubmit={handleTestResult}
            patientInfo={originalPatientInfo}
            currentDiagnoses={{
              common_diagnoses: diagnosesData,
              rare_diagnoses: rareDiseasesData,
              disclaimer,
              follow_up_questions
            }}
            conversationId={responseDetails?.conversationId || 0}
            openAIConfig={openAIConfig}
          />
        </Grid>
      )}

      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Grid>
  );
}
