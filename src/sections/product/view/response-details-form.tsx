import axios from 'axios';
import { useState } from 'react';

import { Healing, BarChart, Assignment, Description, Announcement } from '@mui/icons-material';
import { Box, Card, Alert, Button, Divider, Snackbar, TextField, CardHeader, Typography, CardContent, CircularProgress } from '@mui/material';

import { HOST_API } from 'src/config-global';

interface DiagnosisResponseDetails {
  disclaimer: string;
  follow_up_questions: string[];
}

interface FollowUpPayload {
  diagnosis: string;
  probability: string;
  treatment: string;
  reason: string;
  follow_up_questions?: string[];
}

interface ResponseDetailsProps {
  responseDetails: DiagnosisResponseDetails;
  setResponseDetails: React.Dispatch<React.SetStateAction<DiagnosisResponseDetails | null>>;
  showFollowUp: boolean;
  setShowFollowUp: (show: boolean) => void;
  followUpAnswers: string[];
  setFollowUpAnswers: (answers: string[] | ((prev: string[]) => string[])) => void;
  followUpResponse: FollowUpPayload | null;
  setFollowUpResponse: (response: FollowUpPayload | null) => void;
  originalPatientInfo: any;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function ResponseDetails({
  responseDetails,
  setResponseDetails,
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
  const [error, setError] = useState<string | null>(null);

  if (!responseDetails) {
    return <Typography>Loading...</Typography>;
  }

  const followUpQuestions = responseDetails.follow_up_questions || [];

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
      const followUpRequest = {
        originalPatientInfo,
        initialResponse: responseDetails,
        followUpAnswers,
        conversationHistory: followUpQuestions.map((question, idx) => ({
          question,
          response: followUpAnswers[idx] || ''
        }))
      };

      const response = await axios.post(`${HOST_API}/diagnoses/followup/questions`, followUpRequest, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setFollowUpResponse(response.data);
      setIsLoading(false);
      setShowFollowUp(false);

      // If there are more follow-up questions, prepare for the next set
      if (response.data.follow_up_questions && response.data.follow_up_questions.length > 0) {
        setResponseDetails({
          disclaimer: '',
          follow_up_questions: response.data.follow_up_questions,
        });
        setFollowUpAnswers(Array(response.data.follow_up_questions.length).fill(''));
        setShowFollowUp(true);
      }
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
      <Card
        raised
        sx={{
          maxWidth: '100%',
          mx: 'auto',
          mt: 5,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
        }}
      >
        <CardHeader
          title="Initial Response"
          subheader=" "
          titleTypographyProps={{ align: 'center', variant: 'h4' }}
          subheaderTypographyProps={{ align: 'center' }}
          sx={{
            backgroundColor: 'primary.main',
            color: 'common.white',
            paddingBottom: 3,
          }}
        />
        <CardContent>
          <Box display="flex" alignItems="center" my={2}>
            <Announcement sx={{ color: 'warning.main', mr: 2 }} />
            <Typography variant="h6">Disclaimer</Typography>
          </Box>
          <Typography paragraph sx={{ ml: 4 }}>
            {responseDetails.disclaimer}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowFollowUp(true)}
            sx={{ mt: 2 }}
          >
            Answer Follow-Up Questions
          </Button>
        </CardContent>
      </Card>

      {showFollowUp && (
        <Box sx={{ mt: 3 }}>
          <Card
            raised
            sx={{
              maxWidth: '100%',
              mx: 'auto',
              mt: 5,
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
            }}
          >
            <CardHeader
              title="Follow-Up Questions"
              titleTypographyProps={{ align: 'center', variant: 'h4' }}
              sx={{
                backgroundColor: 'primary.main',
                color: 'common.white',
                paddingBottom: 3,
              }}
            />
            <CardContent>
            {responseDetails.follow_up_questions?.map((question, qIndex) => (
  <Box key={qIndex} mb={3}>
    <Typography variant="h6">{question}</Typography>
    <TextField
      fullWidth
      variant="outlined"
      value={followUpAnswers[qIndex] || ''}
      onChange={(e) => {
        const newAnswers = [...followUpAnswers];
        newAnswers[qIndex] = e.target.value;
        setFollowUpAnswers(newAnswers);
      }}
      sx={{ mt: 1 }}
    />
  </Box>
))}

              <Button
                variant="contained"
                color="primary"
                onClick={handleFollowUpSubmit}
                sx={{ mt: 2 }}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Submit Answers'}
              </Button>
            </CardContent>
          </Card>
        </Box>
      )}

      {followUpResponse && (
        <Card
          raised
          sx={{
            maxWidth: '100%',
            mx: 'auto',
            mt: 5,
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
          }}
        >
          <CardHeader
            title="Follow-Up Response"
            titleTypographyProps={{ align: 'center', variant: 'h4' }}
            sx={{
              backgroundColor: 'primary.main',
              color: 'common.white',
              paddingBottom: 3,
            }}
          />
          <CardContent>
            <Box display="flex" alignItems="center" my={2}>
              <Healing sx={{ color: 'success.main', mr: 2 }} />
              <Typography variant="h6">Diagnosis</Typography>
            </Box>
            <Typography paragraph sx={{ ml: 4 }}>
              {followUpResponse.diagnosis}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box display="flex" alignItems="center" my={2}>
              <BarChart sx={{ color: 'info.main', mr: 2 }} />
              <Typography variant="h6">Probability</Typography>
            </Box>
            <Typography paragraph sx={{ ml: 4 }}>
              {followUpResponse.probability}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" alignItems="center" my={2}>
              <Assignment sx={{ color: 'info.main', mr: 2 }} />
              <Typography variant="h6">Treatment</Typography>
            </Box>
            <Typography paragraph sx={{ ml: 4 }}>
              {followUpResponse.treatment}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" alignItems="center" my={2}>
              <Description sx={{ color: 'info.main', mr: 2 }} />
              <Typography variant="h6">Reason</Typography>
            </Box>
            <Typography paragraph sx={{ ml: 4 }}>
              {followUpResponse.reason}
            </Typography>
          </CardContent>
        </Card>
      )}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
