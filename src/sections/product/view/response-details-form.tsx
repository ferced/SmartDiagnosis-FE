import axios from 'axios';
import { m } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';

import {
  Healing,
  BarChart,
  Assignment,
  NavigateNext,
  NavigateBefore,
  CheckCircleOutline,
} from '@mui/icons-material';
import {
  Box,
  Card,
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

import Markdown from 'src/components/markdown';
import { varFade } from 'src/components/animate';

import RareDiseasePanel from './RareDiseasePanel';
import PreviousWorkingDiagnoses from './PreviousWorkingDiagnoses';
import FollowUpModal from '../../../components/modals/FollowUpModal';
import { DiagnosisDetail, ArchivedDiagnosis, ResponseDetailsProps } from './types';

interface OpenAIConfig {
  apiKey: string;
  model: string;
}

const getProbabilityPercent = (probability: string): number => {
  const match = probability.match(/(\d+)/);
  if (match) return parseInt(match[1], 10);
  const lower = probability.toLowerCase();
  if (lower.includes('high') || lower.includes('very likely')) return 80;
  if (lower.includes('moderate') || lower.includes('likely')) return 55;
  if (lower.includes('low')) return 25;
  return 50;
};

const getProbabilityColor = (percent: number): 'success' | 'warning' | 'error' => {
  if (percent >= 70) return 'success';
  if (percent >= 40) return 'warning';
  return 'error';
};

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

  const {
    diagnosesData,
    disclaimer,
    follow_up_questions
  } = useMemo(() => {
    const diagnoses = responseDetails?.diagnoses || (responseDetails as any)?.followUpResponse || {};
    return {
      diagnosesData: diagnoses.common_diagnoses || [],
      disclaimer: diagnoses.disclaimer || '',
      follow_up_questions: diagnoses.follow_up_questions || [],
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
    if (followUpCounter >= 3 && diagnosesData.length > 0 && !finalDiagnosis) {
      setFinalDiagnosis(diagnosesData[0]);
      setActiveStep(0);
    }
  }, [followUpCounter, diagnosesData, finalDiagnosis, setActiveStep]);

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

      const newFollowUpCounter = followUpCounter + 1;
      setFollowUpCounter(newFollowUpCounter);

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

  const displayDiagnoses = finalDiagnosis ? [finalDiagnosis] : diagnosesData;

  const handleTestResult = async (decision: string, action: any, rareDiseaseId: string) => {
    if (decision === 'CONFIRM' && action.shouldBecomePrimary) {
      const rareDisease = rareDiseasesData?.find((d: DiagnosisDetail) => d.diagnosis === rareDiseaseId);
      if (rareDisease) {
        const currentTimestamp = Math.floor(Date.now() / 1000).toString();
        const diagnosesToArchive: ArchivedDiagnosis[] = diagnosesData.map((diag: DiagnosisDetail) => ({
          diagnosis: diag.diagnosis,
          treatment: diag.treatment,
          probability: diag.probability,
          timestamp: currentTimestamp,
          reason: `Test confirmed rare disease: ${rareDisease.diagnosis}`,
        }));

        setArchivedDiagnoses(prev => [...prev, ...diagnosesToArchive]);

        const updatedRareDisease = {
          ...rareDisease,
          probability: action.probability || rareDisease.probability,
          treatment: action.updatedDiagnosis?.treatment || rareDisease.treatment,
        };

        setFinalDiagnosis(updatedRareDisease);

        setResponseDetails((prev: any) => ({
          ...prev,
          diagnoses: {
            ...prev.diagnoses,
            common_diagnoses: [updatedRareDisease],
            rare_diagnoses: [],
          }
        }));

        setActiveStep(0);
      }
    } else if (decision === 'RULE_OUT' && action.shouldBeDismissed) {
      const updatedRareDiseases = rareDiseasesData?.filter(
        (d: DiagnosisDetail) => d.diagnosis !== rareDiseaseId
      );

      setPreservedRareDiagnoses(updatedRareDiseases);

      setResponseDetails((prev: any) => ({
        ...prev,
        diagnoses: {
          ...prev.diagnoses,
          rare_diagnoses: updatedRareDiseases,
        }
      }));
    } else if (decision === 'INCONCLUSIVE') {
      console.log('Test results were inconclusive. Additional testing may be required.');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const token = sessionStorage.getItem('accessToken');
      if (!token) return;

      const response = await axios.post(
        `${HOST_API}/reports/pdf`,
        {
          patientInfo: originalPatientInfo,
          response: {
            disclaimer,
            common_diagnoses: diagnosesData,
            rare_diagnoses: rareDiseasesData,
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
      <Grid item xs={12} md={rareDiseasesData && rareDiseasesData.length > 0 ? 8 : 12}>
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
          {displayDiagnoses.map((details: DiagnosisDetail, idx: number) => (
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
                    boxShadow: finalDiagnosis
                      ? theme.customShadows?.success || '0px 8px 32px rgba(0, 137, 123, 0.2)'
                      : theme.customShadows?.card || '0px 4px 20px rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    transition: 'all 0.5s ease-in-out',
                    transform: finalDiagnosis ? 'scale(1.02)' : 'scale(1)',
                    border: finalDiagnosis ? `2px solid ${theme.palette.success.dark}` : 'none',
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: finalDiagnosis ? theme.palette.success.dark : theme.palette.info.dark,
                      color: theme.palette.common.white,
                      p: 3,
                      textAlign: 'center',
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                      {finalDiagnosis && <CheckCircleOutline sx={{ fontSize: 36 }} />}
                      <Typography variant="h4">
                        {finalDiagnosis ? 'Confirmed Diagnosis' : `Diagnosis Result ${idx + 1}`}
                      </Typography>
                    </Box>
                  </Box>

                  <CardContent>
                    {/* Diagnosis */}
                    <Box display="flex" alignItems="center" my={2}>
                      <Healing sx={{ color: theme.palette.success.main, mr: 2 }} />
                      <Typography variant="h6">Diagnosis</Typography>
                    </Box>
                    <Typography paragraph sx={{ ml: 4 }}>
                      {details.diagnosis}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    {/* Probability with bar */}
                    <Box display="flex" alignItems="center" my={2}>
                      <BarChart sx={{ color: theme.palette.info.main, mr: 2 }} />
                      <Typography variant="h6">Probability</Typography>
                    </Box>
                    <Box sx={{ ml: 4 }}>
                      <Typography paragraph>
                        {finalDiagnosis ? 'High' : details.probability}
                      </Typography>
                      {(() => {
                        const percent = getProbabilityPercent(finalDiagnosis ? 'High' : details.probability);
                        const barColor = getProbabilityColor(percent);
                        return (
                          <LinearProgress
                            variant="determinate"
                            value={percent}
                            color={barColor}
                            sx={{ height: 8, borderRadius: 1, mb: 2 }}
                          />
                        );
                      })()}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Treatment with Markdown */}
                    <Box display="flex" alignItems="center" my={2}>
                      <Assignment sx={{ color: theme.palette.info.main, mr: 2 }} />
                      <Typography variant="h6">Treatment</Typography>
                    </Box>
                    <Box sx={{ ml: 4 }}>
                      <Markdown>{details.treatment}</Markdown>
                    </Box>
                  </CardContent>
                </Card>
              </m.div>
            </div>
          ))}

          {finalDiagnosis && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Final diagnosis reached: The system has determined this is the most probable diagnosis
              based on the provided information after 3 rounds of follow-up questions.
            </Alert>
          )}

          {displayDiagnoses.length === 1 && !finalDiagnosis && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Final diagnosis reached: The system has determined this is the most probable diagnosis
              based on the provided information. No further follow-up questions needed.
            </Alert>
          )}

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

      {/* Rare Disease Panel - Right Side */}
      {rareDiseasesData && rareDiseasesData.length > 0 && (
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
