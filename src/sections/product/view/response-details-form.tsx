import axios from 'axios';
import { useState } from 'react';
import Stepper from 'react-stepper-horizontal';

import { Healing, BarChart, Assignment, Description, Announcement } from '@mui/icons-material';
import { Box, Card, Alert, Button, Divider, Collapse, useTheme, Snackbar, TextField, CardHeader, Typography, CardContent, CircularProgress } from '@mui/material';

import { HOST_API } from 'src/config-global';

interface DiagnosisResponseDetails {
  diagnosis: string;
  probability: string;
  treatment: string;
  disclaimer: string;
  follow_up_questions: string[];
}

interface FollowUpPayload {
  diagnosis: string;
  probability: string;
  treatment: string;
  reason: string;
}

interface ResponseDetailsProps {
  responseDetails: DiagnosisResponseDetails[];
  activeStep: number;
  setActiveStep: (step: number | ((prevStep: number) => number)) => void;
  showFollowUp: boolean;
  setShowFollowUp: (show: boolean) => void;
  followUpAnswers: { [key: number]: string[] };
  setFollowUpAnswers: (answers: { [key: number]: string[] } | ((prev: { [key: number]: string[] }) => { [key: number]: string[] })) => void;
  followUpResponse: { [key: number]: FollowUpPayload | null };
  setFollowUpResponse: (response: { [key: number]: FollowUpPayload | null } | ((prev: { [key: number]: FollowUpPayload | null }) => { [key: number]: FollowUpPayload | null })) => void;
  originalPatientInfo: any;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function ResponseDetails({
  responseDetails,
  activeStep,
  setActiveStep,
  showFollowUp,
  setShowFollowUp,
  followUpAnswers,
  setFollowUpAnswers,
  followUpResponse,
  setFollowUpResponse,
  originalPatientInfo,
  isLoading,
  setIsLoading,
}: ResponseDetailsProps) {
  const theme = useTheme();
  const [error, setError] = useState<string | null>(null);

  const handleFollowUpSubmit = async (details: DiagnosisResponseDetails, index: number) => {
    setIsLoading(true);

    const token = sessionStorage.getItem('accessToken');

    if (!token) {
      console.error('No access token found in sessionStorage');
      setError('No access token found in sessionStorage');
      setIsLoading(false);
      return;
    }

    try {
      const followUpRequest = {
        originalPatientInfo,
        initialResponse: details,
        followUpQuestions: followUpAnswers[index] || [],
        conversationHistory: [
          { question: "Do you have any allergies?", response: originalPatientInfo.allergies },
          { question: "Do you have any chronic conditions?", response: "Yes, hypertension and diabetes." },
          ...details.follow_up_questions.map((question2, idx) => ({
            question: question2,
            response: followUpAnswers[index]?.[idx] || ''
          }))
        ]
      };

      const response = await axios.post(`${HOST_API}/diagnoses/followup`, followUpRequest, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setFollowUpResponse((prev) => ({
        ...prev,
        [index]: response.data
      }));
      setIsLoading(false);
      setShowFollowUp(false);
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setError(typeof err.response.data === 'object' ? JSON.stringify(err.response.data) : err.message);
      setIsLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Stepper
        steps={responseDetails.map((_, index) => ({ title: `Diagnosis ${index + 1}` }))}
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
        {Array.isArray(responseDetails) && responseDetails.map((details, index) => (
          <Collapse in={activeStep === index} timeout="auto" unmountOnExit key={index}>
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
                title={`Diagnosis Result ${index + 1}`}
                subheader=" "
                titleTypographyProps={{ align: 'center', variant: 'h4' }}
                subheaderTypographyProps={{ align: 'center' }}
                sx={{
                  backgroundColor: theme.palette.primary.main,
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
                  {details.probability}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Box display="flex" alignItems="center" my={2}>
                  <Assignment sx={{ color: theme.palette.info.main, mr: 2 }} />
                  <Typography variant="h6">Treatment</Typography>
                </Box>
                <Typography paragraph sx={{ ml: 4 }}>
                  {details.treatment}
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Box display="flex" alignItems="center" my={2}>
                  <Announcement sx={{ color: theme.palette.warning.main, mr: 2 }} />
                  <Typography variant="h6">Disclaimer</Typography>
                </Box>
                <Typography paragraph sx={{ ml: 4 }}>
                  {details.disclaimer}
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setShowFollowUp(true)}
                  sx={{ mt: 2 }}
                >
                  Follow Up Questions
                </Button>
              </CardContent>
              {showFollowUp && activeStep === index && (
                <Box key={index} sx={{ mt: 3 }}>
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
                      title={`Follow Up Questions for Diagnosis ${index + 1}`}
                      titleTypographyProps={{ align: 'center', variant: 'h4' }}
                      sx={{
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.common.white,
                        paddingBottom: 3,
                      }}
                    />
                    <CardContent>
                      {details.follow_up_questions.map((question, qIndex) => (
                        <Box key={qIndex} mb={3}>
                          <Typography variant="h6">{question}</Typography>
                          <TextField
                            fullWidth
                            variant="outlined"
                            value={followUpAnswers[index]?.[qIndex] || ''}
                            onChange={(e) => {
                              const newAnswers = [...(followUpAnswers[index] || [])];
                              newAnswers[qIndex] = e.target.value;
                              setFollowUpAnswers((prev) => ({
                                ...prev,
                                [index]: newAnswers,
                              }));
                            }}
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      ))}
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleFollowUpSubmit(details, index)}
                        sx={{ mt: 2 }}
                        disabled={isLoading}
                      >
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Submit Follow Up Answers'}
                      </Button>
                    </CardContent>
                  </Card>
                </Box>
              )}
            </Card>
          </Collapse>
        ))}
        {followUpResponse[activeStep] && (
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
              title="Follow Up Response"
              titleTypographyProps={{ align: 'center', variant: 'h4' }}
              sx={{
                backgroundColor: theme.palette.primary.main,
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
                {followUpResponse[activeStep]?.diagnosis}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" alignItems="center" my={2}>
                <BarChart sx={{ color: theme.palette.info.main, mr: 2 }} />
                <Typography variant="h6">Probability</Typography>
              </Box>
              <Typography paragraph sx={{ ml: 4 }}>
                {followUpResponse[activeStep]?.probability}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" alignItems="center" my={2}>
                <Assignment sx={{ color: theme.palette.info.main, mr: 2 }} />
                <Typography variant="h6">Treatment</Typography>
              </Box>
              <Typography paragraph sx={{ ml: 4 }}>
                {followUpResponse[activeStep]?.treatment}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" alignItems="center" my={2}>
                <Description sx={{ color: theme.palette.info.main, mr: 2 }} />
                <Typography variant="h6">Reason</Typography>
              </Box>
              <Typography paragraph sx={{ ml: 4 }}>
                {followUpResponse[activeStep]?.reason}
              </Typography>
            </CardContent>
          </Card>
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
        <Button
          variant="contained"
          color="primary"
          disabled={activeStep === responseDetails.length - 1}
          onClick={() => {
            setActiveStep((prev) => Math.min(prev + 1, responseDetails.length - 1));
            setShowFollowUp(false);
          }}
        >
          Next
        </Button>
      </Box>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
