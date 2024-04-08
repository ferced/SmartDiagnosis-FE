import axios from 'axios';
import * as Yup from 'yup';
import { useState, SetStateAction } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import CardHeader from '@mui/material/CardHeader';
import { Healing, Assignment, Announcement } from '@mui/icons-material';
import {
  Box,
  Button,
  Select,
  Divider,
  MenuItem,
  useTheme,
  Collapse,
  TextField,
  InputLabel,
  Typography,
  FormControl,
  CardContent,
  CircularProgress,
} from '@mui/material';

import { useRouter } from 'src/routes/hooks';

import FormProvider, { RHFUpload, RHFTextField } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export default function PatientForm() {
  const [responseReceived, setResponseReceived] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [responseDetails, setResponseDetails] = useState({});
  const [askInputShown, setAskInputShown] = useState(false);

  const [question, setQuestion] = useState('');

  const handleAskNowClick = () => {
    setAskInputShown((prev) => !prev);
  };

  const handleQuestionChange = (event: { target: { value: SetStateAction<string> } }) => {
    setQuestion(event.target.value);
  };

  const handleSubmitQuestion = () => {
    console.log('Question Submitted:', question);
    // Here you would typically send the question to your backend or handle it as needed
    setAskInputShown(false); // Optionally hide the input and button after submission
    setQuestion(''); // Clear the question input field
  };
  const router = useRouter();

  // Define a more appropriate schema for a patient form
  const PatientSchema = Yup.object().shape({
    patientName: Yup.string().required('Patient name is required'),
    age: Yup.number().positive().integer().required('Age is required'), // Ensure age is a number
    symptoms: Yup.string().required('Symptoms are required'),
    medicalHistory: Yup.string(),
    allergies: Yup.string(),
    gender: Yup.string(),
    currentMedications: Yup.string(),
    files: Yup.array().of(
      Yup.object().shape({
        path: Yup.string().required(),
        description: Yup.string(),
      })
    ),
  });

  // Your form initialization and usage logic follows
  const methods = useForm({
    resolver: yupResolver(PatientSchema),
    defaultValues: {
      patientName: 'Alex Johnson',
      age: 29,
      symptoms:
        'Fatigue, intermittent joint pains, and occasional headaches. Recently noticed a circular rash.',
      medicalHistory:
        'Reported tick bite during a camping trip last summer, frequent outdoor activities. Previous episodes of unexplained fatigue and mild fevers over the past few months.',
      allergies: 'Penicillin',
      gender: '',
      currentMedications: 'Occasional ibuprofen for joint pain',
    },
  });

  const { reset, handleSubmit, setValue, watch } = methods;

  const onSubmit: SubmitHandler<{ [key: string]: any }> = async (data) => {
    console.log('Patient Details:', data);

    setIsLoading(true);

    const token = sessionStorage.getItem('accessToken');

    if (!token) {
      console.error('No access token found in sessionStorage');
      setIsLoading(false);
      return;
    }

    try {
      const formattedData = {
        ...data,
        patientName: data.patientName,
      };

      const response = await axios.post('http://127.0.0.1:3000/diagnosis/submit', formattedData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(response.data);
      setResponseDetails(response.data);
      setIsLoading(false);
      setResponseReceived(true);
      // Handle post-submission logic: reset form, navigate, show success message, etc.
      reset();
    } catch (error) {
      console.error(error.response ? error.response.data : error.message);
      // Handle errors (e.g., show error message to the user)
      setIsLoading(false);
    }
  };

  // Additional logic for handling file uploads, removal, etc.

  const renderDetails = (
    <Grid container spacing={3}>
      <Grid xs={12}>
        <Card>
          <CardHeader title="Patient Details" />

          <Stack spacing={3} sx={{ p: 3 }}>
            <RHFTextField name="patientName" label="Patient Name" />
            <RHFTextField name="age" label="Age" type="number" />
            <Controller
              name="gender"
              control={methods.control}
              render={({ field }) => (
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="gender-label">Gender</InputLabel>
                  <Select {...field} labelId="gender-label" label="Gender" defaultValue="">
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                  </Select>
                </FormControl>
              )}
            />

            <RHFTextField name="symptoms" label="Symptoms" multiline rows={4} />
            <RHFTextField name="medicalHistory" label="Medical History" multiline rows={4} />
            <RHFTextField name="allergies" label="Allergies" />
            <RHFTextField name="currentMedications" label="Current Medications" />

            <RHFUpload multiple thumbnail name="files" />
          </Stack>
        </Card>
      </Grid>
    </Grid>
  );
  const renderSubmitButton = (
    <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 3 }}>
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={isLoading}
        sx={{
          borderRadius: 2,
          padding: '10px 30px',
          boxShadow: '0 3px 5px 2px rgba(105, 140, 255, .3)',
          ':hover': {
            boxShadow: '0 5px 7px 3px rgba(105, 140, 255, .4)',
          },
          textTransform: 'none',
          fontWeight: 'bold',
        }}
      >
        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Submit Patient Information'}
      </Button>
    </Stack>
  );

  const renderResponseDetails = (details: any) => {
    const theme = useTheme();

    return (
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
          title="Diagnosis Results"
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
        </CardContent>
      </Card>
    );
  };

  const renderFollowUpPrompt = () => {
    const theme = useTheme();

    return (
      <Box
        sx={{
          mt: 4,
          py: 3,
          px: 2,
          bgcolor: theme.palette.background.paper,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h5"
          sx={{ mb: 2, fontWeight: 'medium', color: theme.palette.text.primary }}
        >
          Got More Questions?
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, color: theme.palette.text.secondary }}>
          If you have any more questions or need further clarification, don't hesitate to ask.
        </Typography>
        <Collapse in={!askInputShown}>
          <Button
            variant="contained"
            color="primary"
            sx={{
              borderRadius: '20px',
              textTransform: 'none',
              px: 4,
              py: '6px',
              boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
              ':hover': {
                boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)',
              },
            }}
            onClick={handleAskNowClick}
          >
            Ask Now
          </Button>
        </Collapse>
        <Collapse in={askInputShown}>
          <Box
            sx={{
              mt: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TextField
              variant="outlined"
              value={question}
              onChange={handleQuestionChange}
              placeholder="Type your question here..."
              sx={{
                width: '100%',
                maxWidth: '600px',
                mr: 1,
              }}
              autoFocus
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmitQuestion}
              sx={{
                borderRadius: '20px',
                textTransform: 'none',
                px: 2,
                py: '6px',
                boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
                ':hover': {
                  boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)',
                },
              }}
            >
              Submit
            </Button>
          </Box>
        </Collapse>
      </Box>
    );
  };

  return (
    <FormProvider methods={methods} onSubmit={methods.handleSubmit(onSubmit)}>
      {!responseReceived ? (
        <>
          {renderDetails}
          {renderSubmitButton}
        </>
      ) : (
        <>
          {renderResponseDetails(responseDetails)}
          {renderFollowUpPrompt()} {/* Call the follow-up prompt here */}
        </>
      )}
    </FormProvider>
  );
}
