import axios from 'axios';
import { useState, useEffect } from 'react';
import Stepper from 'react-stepper-horizontal';

import {
  Healing,
  Science,
  BarChart,
  Assignment,
  WarningAmber,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Alert,
  Badge,
  Paper,
  Slide,
  Stack,
  Button,
  Divider,
  Tooltip,
  Collapse,
  Snackbar,
  useTheme,
  CardHeader,
  IconButton,
  Typography,
  CardContent,
} from '@mui/material';

import { HOST_API } from 'src/config-global';

import { DiagnosisDetail, ResponseDetailsProps } from './types';
import FollowUpModal from '../../../components/modals/FollowUpModal';


function RareDiseaseCard({ details }: { details: DiagnosisDetail }) {
  const cardTheme = useTheme();

  return (
    <Card
      sx={{
        mb: 2,
        bgcolor: 'background.neutral',
        borderLeft: `6px solid ${cardTheme.palette.warning.main}`,
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Science color="warning" />
            <Typography variant="subtitle1" fontWeight="bold">
              {details.diagnosis}
            </Typography>
          </Box>

          {details.prevalence && (
            <Box
              sx={{
                bgcolor: 'warning.lighter',
                p: 1,
                borderRadius: 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                maxWidth: 'fit-content'
              }}
            >
              <WarningAmber fontSize="small" color="warning" />
              <Typography variant="caption" color="warning.darker">
                Prevalence: {details.prevalence}
              </Typography>
            </Box>
          )}

          <Box sx={{ bgcolor: 'background.paper', p: 1, borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Probability: {details.probability}
            </Typography>
            <Typography variant="body2">
              {details.treatment}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
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
}: ResponseDetailsProps) {
  const theme = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ question: string; answer: string }>
  >([]);
  const [showRareDiseases, setShowRareDiseases] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [followUpCounter, setFollowUpCounter] = useState(0);
  const [finalDiagnosis, setFinalDiagnosis] = useState<DiagnosisDetail | null>(null);
  const [preservedRareDiagnoses, setPreservedRareDiagnoses] = useState<DiagnosisDetail[] | null>(null);

  // Check if responseDetails has the right structure and handle the case if it doesn't
  // Using type assertion to work around TypeScript error
  const diagnoses = responseDetails?.diagnoses || (responseDetails as any)?.followUpResponse || {};
  const common_diagnoses = diagnoses.common_diagnoses || [];
  
  // Use preserved rare diagnoses if they exist, otherwise use the ones from the response
  const rare_diagnoses = preservedRareDiagnoses || diagnoses.rare_diagnoses || null;
  
  // Store rare diagnoses when they first appear
  useEffect(() => {
    if (diagnoses.rare_diagnoses && diagnoses.rare_diagnoses.length > 0 && !preservedRareDiagnoses) {
      setPreservedRareDiagnoses(diagnoses.rare_diagnoses);
    }
  }, [diagnoses.rare_diagnoses, preservedRareDiagnoses]);
  
  const follow_up_questions = diagnoses.follow_up_questions || [];
  const disclaimer = diagnoses.disclaimer || '';

  // Effect to set final diagnosis after 3 rounds of follow-up
  useEffect(() => {
    if (followUpCounter >= 3 && common_diagnoses.length > 0 && !finalDiagnosis) {
      // Set the diagnosis with highest probability as final
      // In a real app, you might want to use a more sophisticated selection method
      // But for this example, we'll pick the first diagnosis as the "most probable"
      setFinalDiagnosis(common_diagnoses[0]);
      
      // Reset activeStep to show the final diagnosis
      setActiveStep(0);
    }
  }, [followUpCounter, common_diagnoses, finalDiagnosis, setActiveStep]);

  // Determine if we should show the Follow Up Questions button
  // Hide it if only one diagnosis remains or if we've reached 3 follow-ups
  const showFollowUpButton = common_diagnoses.length > 1 && follow_up_questions.length > 0 && followUpCounter < 3 && !finalDiagnosis;

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
          currentMedications: originalPatientInfo.currentMedications || ''
        },
        initialResponse: {
          disclaimer,
          // Asegurar que el nombre del campo sea el que espera el backend
          // En el backend espera CommonDiagnoses, pero el frontend usa common_diagnoses
          diagnoses: common_diagnoses, // Este es el campo que el backend convertirá a CommonDiagnoses
          follow_up_questions // Este campo es esperado por el backend
        },
        followUpAnswers,  // Respuestas normales
        additionalInfo: additionalInfo.trim(), // Agregar el nuevo campo
        conversationHistory: updatedConversationHistory.map(entry => ({
          question: entry.question,
          response: entry.answer
        }))
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
  const displayDiagnoses = finalDiagnosis ? [finalDiagnosis] : common_diagnoses;

  return (
    <Box sx={{ mt: 3 }}>
      <Stepper
        steps={displayDiagnoses.map((_: any, idx: number) => ({
          title: `Diagnosis ${idx + 1}`,
        }))}
        activeStep={activeStep}
        activeColor={theme.palette.primary.main}
        completeColor={theme.palette.success.main}
        defaultColor={theme.palette.grey[300]}
        completeBarColor={theme.palette.success.main}
        defaultBarColor={theme.palette.grey[300]}
        barStyle="solid"
        titleFontSize={14}
        circleFontSize={14}
        size={36}
      />
      <Box sx={{ mt: 5 }}>
        {displayDiagnoses.map((details: DiagnosisDetail, idx: number) => (
          <Collapse in={activeStep === idx} timeout="auto" unmountOnExit key={idx}>
            <Card
              raised
              sx={{
                maxWidth: '100%',
                mx: 'auto',
                mt: 5,
                bgcolor: theme.palette.background.paper,
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
              }}
            >
              <CardHeader
                title={finalDiagnosis ? "Final Diagnosis" : `Diagnosis Result ${idx + 1}`}
                subheader=" "
                titleTypographyProps={{ align: 'center', variant: 'h4' }}
                subheaderTypographyProps={{ align: 'center' }}
                sx={{
                  backgroundColor: finalDiagnosis ? theme.palette.success.main : theme.palette.primary.main,
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
          </Collapse>
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
        
        {(rare_diagnoses || preservedRareDiagnoses) && Array.isArray(rare_diagnoses || preservedRareDiagnoses) && (rare_diagnoses || preservedRareDiagnoses).length > 0 && (
          <>
            <Tooltip title={showRareDiseases ? "Hide rare diseases" : "View rare diseases"} placement="left">
              <IconButton
                onClick={() => setShowRareDiseases(prev => !prev)}
                sx={{
                  position: 'fixed',
                  right: showRareDiseases ? 480 : 20,
                  bottom: 20,
                  width: 48,
                  height: 48,
                  bgcolor: theme.palette.background.paper,
                  boxShadow: `0 8px 32px -4px ${theme.palette.grey[200]}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: theme.palette.background.paper,
                    transform: 'scale(1.05)',
                    boxShadow: `0 12px 40px -8px ${theme.palette.grey[300]}`,
                  },
                }}
              >
                <Badge
                  badgeContent={(rare_diagnoses || []).length}
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: theme.palette.error.main,
                      boxShadow: `0 2px 12px -2px ${theme.palette.error.main}`,
                    },
                  }}
                >
                  <Science
                    sx={{
                      color: theme.palette.text.primary,
                      opacity: 0.8,
                      fontSize: 24
                    }}
                  />
                </Badge>
              </IconButton>
            </Tooltip>
            <Slide direction="left" in={showRareDiseases} mountOnEnter unmountOnExit>
              <Paper
                elevation={0}
                sx={{
                  position: 'fixed',
                  right: 0,
                  top: 0,
                  width: 480,
                  height: '100vh',
                  overflowY: 'auto',
                  bgcolor: theme.palette.background.paper,
                  borderLeft: `1px solid ${theme.palette.divider}`,
                  p: 4,
                  zIndex: 1200,
                }}
              >
                <Stack spacing={3}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Science
                      color="warning"
                      sx={{ fontSize: 28 }}
                    />
                    <Typography variant="h5">Rare Disease Considerations</Typography>
                  </Box>

                  <Alert
                    severity="info"
                    sx={{
                      mb: 2,
                      '& .MuiAlert-message': {
                        fontSize: '0.95rem'
                      }
                    }}
                  >
                    These are rare conditions that share similar symptoms and should be considered in the differential diagnosis.
                  </Alert>

                  {(rare_diagnoses || []).map((rareDiagnosis, index) => (
                    <RareDiseaseCard key={index} details={rareDiagnosis} />
                  ))}
                </Stack>
              </Paper>
            </Slide>
          </>
        )}
      </Box>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}