import axios from 'axios';
import Stepper from 'react-stepper-horizontal';
import { useMemo, useState, useEffect } from 'react';

import {
  Healing,
  BarChart,
  Assignment,
  CheckCircleOutline,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Fade,
  Grid,
  Alert,
  Button,
  Divider,
  Snackbar,
  useTheme,
  CardHeader,
  Typography,
  CardContent,
} from '@mui/material';

import { HOST_API } from 'src/config-global';

import RareDiseasePanel from './RareDiseasePanel';
import PreviousWorkingDiagnoses from './PreviousWorkingDiagnoses';
import FollowUpModal from '../../../components/modals/FollowUpModal';
import { DiagnosisDetail, ArchivedDiagnosis, ResponseDetailsProps } from './types';

interface OpenAIConfig {
  apiKey: string;
  model: string;
}

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
  // const [showRareDiseases, setShowRareDiseases] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [followUpCounter, setFollowUpCounter] = useState(0);
  const [finalDiagnosis, setFinalDiagnosis] = useState<DiagnosisDetail | null>(null);
  const [preservedRareDiagnoses, setPreservedRareDiagnoses] = useState<DiagnosisDetail[] | null>(null);
  const [archivedDiagnoses, setArchivedDiagnoses] = useState<ArchivedDiagnosis[]>([]);

  // Using useMemo to extract data from responseDetails to avoid redeclaration issues
  const {
    diagnosesData,
    disclaimer,
    follow_up_questions
  } = useMemo(() => {
    // Check if responseDetails has the right structure and handle the case if it doesn't
    // Using type assertion to work around TypeScript error
    const diagnoses = responseDetails?.diagnoses || (responseDetails as any)?.followUpResponse || {};
    return {
      diagnosesData: diagnoses.common_diagnoses || [],
      disclaimer: diagnoses.disclaimer || '',
      follow_up_questions: diagnoses.follow_up_questions || [],
    };
  }, [responseDetails]);

  // Use preserved rare diagnoses if they exist, otherwise use the ones from the response
  const rareDiseasesData = useMemo(() => {
    if (preservedRareDiagnoses) return preservedRareDiagnoses;

    const diagnoses = responseDetails?.diagnoses || (responseDetails as any)?.followUpResponse || {};
    return diagnoses.rare_diagnoses || null;
  }, [preservedRareDiagnoses, responseDetails]);

  // Store rare diagnoses when they first appear
  useEffect(() => {
    const diagnoses = responseDetails?.diagnoses || (responseDetails as any)?.followUpResponse || {};
    if (diagnoses.rare_diagnoses && diagnoses.rare_diagnoses.length > 0 && !preservedRareDiagnoses) {
      setPreservedRareDiagnoses(diagnoses.rare_diagnoses);
    }
  }, [responseDetails, preservedRareDiagnoses]);

  // Effect to set final diagnosis after 3 rounds of follow-up
  useEffect(() => {
    if (followUpCounter >= 3 && diagnosesData.length > 0 && !finalDiagnosis) {
      // Set the diagnosis with highest probability as final
      // In a real app, you might want to use a more sophisticated selection method
      // But for this example, we'll pick the first diagnosis as the "most probable"
      setFinalDiagnosis(diagnosesData[0]);

      // Reset activeStep to show the final diagnosis
      setActiveStep(0);
    }
  }, [followUpCounter, diagnosesData, finalDiagnosis, setActiveStep]);

  // Determine if we should show the Follow Up Questions button
  // Hide it if only one diagnosis remains or if we've reached 3 follow-ups
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
      // Update conversation history
      const newConversationEntries = follow_up_questions.map((question: string, index: number) => ({
        question,
        answer: followUpAnswers[index] || '',
      }));

      // Agregar la entrada de "Add more information" si se ingresó algo
      if (additionalInfo.trim() !== '') {
        newConversationEntries.push({
          question: 'Additional Information',
          answer: additionalInfo.trim(),
        });
      }

      const updatedConversationHistory = [...conversationHistory, ...newConversationEntries];
      setConversationHistory(updatedConversationHistory);

      // Asegurar que la estructura del request sea compatible con el backend
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
          // Asegurar que el nombre del campo sea el que espera el backend
          diagnoses: diagnosesData, // Este es el campo que el backend convertirá a CommonDiagnoses
          follow_up_questions // Este campo es esperado por el backend
        },
        followUpAnswers,  // Respuestas normales
        additionalInfo: additionalInfo.trim(), // Agregar el nuevo campo
        conversationHistory: updatedConversationHistory.map(entry => ({
          question: entry.question,
          response: entry.answer
        })),
        ...(openAIConfig && { openaiConfig: openAIConfig }),
      };

      // Increment follow-up counter
      const newFollowUpCounter = followUpCounter + 1;
      setFollowUpCounter(newFollowUpCounter);

      // If this is the third follow-up, we'll handle the final diagnosis
      if (newFollowUpCounter === 3) {
        // We'll still send the request to get the backend's response
        const response = await axios.post(`${HOST_API}/diagnoses/followup`, followUpRequest, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('API Response (Final Round):', response.data);

        // But we'll override the result to show only one diagnosis
        // We'll pick the first diagnosis as the "most probable" one
        const responseData = response.data;
        const diagnosisData = responseData?.followUpResponse || responseData?.diagnoses;

        if (diagnosisData && diagnosisData.common_diagnoses && diagnosisData.common_diagnoses.length > 0) {
          // Pick the first diagnosis from the response
          const finalDiag = diagnosisData.common_diagnoses[0];
          setFinalDiagnosis(finalDiag);

          // Modify the response to only include the final diagnosis
          // but preserve rare diagnoses if they exist
          const modifiedResponse = {
            ...responseData,
            followUpResponse: {
              ...diagnosisData,
              common_diagnoses: [finalDiag],
              follow_up_questions: [], // No more follow-up questions
              rare_diagnoses: preservedRareDiagnoses || diagnosisData.rare_diagnoses // Preserve rare diagnoses
            }
          };

          setResponseDetails(modifiedResponse);
        } else {
          // If no diagnoses returned, just use the response as is
          setResponseDetails(response.data);
        }
      } else {
        // For follow-ups 1 and 2, process normally
        const response = await axios.post(`${HOST_API}/diagnoses/followup`, followUpRequest, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('API Response:', response.data);

        // Check if the response has the expected structure
        if (!response.data) {
          throw new Error('Empty response from server');
        }

        // Handle both possible response formats
        setResponseDetails(response.data);
      }

      setFollowUpAnswers([]);
      setAdditionalInfo('');  // Resetear el campo adicional después de enviar
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

  // Determine which diagnoses to display
  const displayDiagnoses = finalDiagnosis ? [finalDiagnosis] : diagnosesData;

  const handleTestResult = async (decision: string, action: any, rareDiseaseId: string) => {
    // Handle test result decision from backend
    
    if (decision === 'CONFIRM' && action.shouldBecomePrimary) {
      // Find the rare disease and promote it to primary diagnosis
      const rareDisease = rareDiseasesData?.find((d: DiagnosisDetail) => d.diagnosis === rareDiseaseId);
      if (rareDisease) {
        // Archive current diagnoses before switching
        const currentTimestamp = Math.floor(Date.now() / 1000).toString();
        const diagnosesToArchive: ArchivedDiagnosis[] = diagnosesData.map((diag: DiagnosisDetail) => ({
          diagnosis: diag.diagnosis,
          treatment: diag.treatment,
          probability: diag.probability,
          timestamp: currentTimestamp,
          reason: `Test confirmed rare disease: ${rareDisease.diagnosis}`,
        }));
        
        setArchivedDiagnoses(prev => [...prev, ...diagnosesToArchive]);
        
        // Update the rare disease with new probability from test results
        const updatedRareDisease = {
          ...rareDisease,
          probability: action.probability || rareDisease.probability,
          treatment: action.updatedDiagnosis?.treatment || rareDisease.treatment,
        };
        
        // Set as final diagnosis
        setFinalDiagnosis(updatedRareDisease);
        
        // Clear other diagnoses and show only the confirmed rare disease
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
      // Remove the rare disease from the list
      const updatedRareDiseases = rareDiseasesData?.filter(
        (d: DiagnosisDetail) => d.diagnosis !== rareDiseaseId
      );
      
      // Update the preserved rare diagnoses
      setPreservedRareDiagnoses(updatedRareDiseases);
      
      // Update response details to remove the ruled out disease
      setResponseDetails((prev: any) => ({
        ...prev,
        diagnoses: {
          ...prev.diagnoses,
          rare_diagnoses: updatedRareDiseases,
        }
      }));
      
      // Show a message that the disease was ruled out
      // You could add a snackbar or alert here
      console.log(`Rare disease ${rareDiseaseId} has been ruled out based on test results`);
    } else if (decision === 'INCONCLUSIVE') {
      // Tests were inconclusive, may need additional testing
      // You could show the additional tests needed from action.additionalTestsNeeded
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
          responseType: 'blob', // Important for binary files
        }
      );

      // Create blob link to download
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
        <Stepper
          steps={displayDiagnoses.map((_: any, idx: number) => ({
            title: `Diagnosis ${idx + 1}`,
          }))}
          activeStep={activeStep}
          activeColor="#0097A7"
          completeColor="#00897B"
          defaultColor={theme.palette.grey[300]}
          completeBarColor="#00897B"
          defaultBarColor={theme.palette.grey[300]}
          barStyle="solid"
          titleFontSize={14}
          circleFontSize={14}
          size={36}
        />
        <Box sx={{ mt: 5 }}>
        {displayDiagnoses.map((details: DiagnosisDetail, idx: number) => (
          <div
            key={idx}
            style={{
              display: activeStep === idx ? 'block' : 'none',
            }}
          >
            <Fade in={activeStep === idx} timeout={600}>
              <Card
                raised
                sx={{
                  maxWidth: '100%',
                  mx: 'auto',
                  mt: 5,
                  bgcolor: theme.palette.background.paper,
                  boxShadow: finalDiagnosis ? '0px 8px 32px rgba(0, 137, 123, 0.2)' : '0px 4px 20px rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  transition: 'all 0.5s ease-in-out',
                  transform: finalDiagnosis ? 'scale(1.02)' : 'scale(1)',
                  border: finalDiagnosis ? '2px solid #00897B' : 'none',
                }}
              >
              <CardHeader
                title={
                  <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                    {finalDiagnosis && <CheckCircleOutline sx={{ fontSize: 36 }} />}
                    {finalDiagnosis ? "Confirmed Diagnosis" : `Diagnosis Result ${idx + 1}`}
                  </Box>
                }
                subheader=" "
                titleTypographyProps={{ align: 'center', variant: 'h4' }}
                subheaderTypographyProps={{ align: 'center' }}
                sx={{
                  backgroundColor: finalDiagnosis ? '#00897B' : '#0097A7',
                  color: theme.palette.common.white,
                  paddingBottom: 3,
                }}
              />
              <CardContent>
                <Box display="flex" alignItems="center" my={2}>
                  <Healing sx={{ color: theme.palette.success.main, mr: 2 }} />
                  <Typography variant="h6">Diagnosis</Typography>
                </Box>
                <Typography paragraph sx={{ ml: 4 }}>
                  {details.diagnosis}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box display="flex" alignItems="center" my={2}>
                  <BarChart sx={{ color: theme.palette.info.main, mr: 2 }} />
                  <Typography variant="h6">Probability</Typography>
                </Box>
                <Typography paragraph sx={{ ml: 4 }}>
                  {finalDiagnosis ? "High" : details.probability}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Box display="flex" alignItems="center" my={2}>
                  <Assignment sx={{ color: theme.palette.info.main, mr: 2 }} />
                  <Typography variant="h6">Treatment</Typography>
                </Box>
                <Typography paragraph sx={{ ml: 4 }}>
                  {details.treatment}
                </Typography>
              </CardContent>
                </Card>
              </Fade>
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

        {/* Previous Working Diagnoses Section */}
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          disabled={activeStep === 0}
          onClick={() => {
            setActiveStep((prev) => Math.max(prev - 1, 0));
            setShowFollowUp(false);
          }}
        >
          Previous
        </Button>

        {/* Show follow-up rounds counter */}
        {followUpCounter > 0 && !finalDiagnosis && (
          <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
            Follow-up rounds: {followUpCounter}/3
          </Typography>
        )}

        {/* Only show Follow Up Questions button if multiple diagnoses remain, questions exist, and we haven't reached 3 follow-ups */}
        {showFollowUpButton && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowFollowUp(true)}
            sx={{ mt: 2 }}
          >
            Follow Up Questions
          </Button>
        )}

        <Button
          variant="contained"
          color="primary"
          disabled={activeStep === displayDiagnoses.length - 1}
          onClick={() => {
            setActiveStep((prev) => Math.min(prev + 1, displayDiagnoses.length - 1));
            setShowFollowUp(false);
          }}
        >
          Next
        </Button>

      </Box>
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