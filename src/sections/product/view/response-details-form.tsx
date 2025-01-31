import axios from 'axios';
import { useState } from 'react';
import Stepper from 'react-stepper-horizontal';

import { Healing, BarChart, Assignment } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  Divider,
  Snackbar,
  Typography,
  useTheme,
} from '@mui/material';

import { HOST_API } from 'src/config-global';

import FollowUpModal from '../../../components/modals/FollowUpModal';


interface DiagnosisDetail {
  diagnosis: string;
  treatment: string;
  probability: string;
}

interface DiagnosisResponseDetails {
  disclaimer: string;
  diagnoses: DiagnosisDetail[];
  follow_up_questions: string[];
}

interface ResponseDetailsProps {
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
      const newConversationEntries = responseDetails.follow_up_questions.map((question, index) => ({
        question,
        answer: followUpAnswers[index] || '',
      }));

      const updatedConversationHistory = [...conversationHistory, ...newConversationEntries];
      setConversationHistory(updatedConversationHistory);

      const followUpRequest = {
        originalPatientInfo,
        initialResponse: responseDetails,
        followUpAnswers,
        conversationHistory: updatedConversationHistory,
      };

      const response = await axios.post(`${HOST_API}/diagnoses/followup`, followUpRequest, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setResponseDetails(response.data);
      setFollowUpAnswers([]);
      setIsLoading(false);
      setShowFollowUp(false);
      setActiveStep(0);

      if (response.data.diagnoses.length === 1) {
        // Optionally display a message or handle the final diagnosis
      }
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      setError(
        typeof err.response?.data === 'object' ? JSON.stringify(err.response.data) : err.message
      );
      setIsLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Stepper
        steps={responseDetails.diagnoses.map((_, idx) => ({
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
        {responseDetails.diagnoses.map((details: DiagnosisDetail, idx: number) => (
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
                title={`Diagnosis Result ${idx + 1}`}
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
              </CardContent>
            </Card>
          </Collapse>
        ))}
        {responseDetails.diagnoses.length === 1 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Only one diagnosis remains after the follow-up. This is the most probable diagnosis
            based on the provided information.
          </Alert>
        )}
        {showFollowUp && (
  <FollowUpModal
    isOpen={showFollowUp}
    onClose={() => setShowFollowUp(false)}
    followUpQuestions={responseDetails.follow_up_questions}
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
        {responseDetails.diagnoses.length > 1 && (
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
          disabled={activeStep === responseDetails.diagnoses.length - 1}
          onClick={() => {
            setActiveStep((prev) => Math.min(prev + 1, responseDetails.diagnoses.length - 1));
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
