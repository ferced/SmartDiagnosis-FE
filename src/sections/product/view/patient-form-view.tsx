import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import { Healing, Assignment, Announcement } from '@mui/icons-material'; // Note: Check the actual import path in your project
import CardHeader from '@mui/material/CardHeader';

import { useRouter } from 'src/routes/hooks'; // Adjust according to your actual import paths

import FormProvider, { RHFUpload, RHFTextField } from 'src/components/hook-form'; // Adjust imports as needed
import axios from 'axios';
import { useState } from 'react';

import {
  Box,
  Button,
  Select,
  Divider,
  MenuItem,
  useTheme,
  InputLabel,
  Typography,
  FormControl,
  CardContent,
  CircularProgress,
} from '@mui/material';

// ----------------------------------------------------------------------

export default function PatientForm() {
  const [responseReceived, setResponseReceived] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [responseDetails, setResponseDetails] = useState({});
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
      files: [], // This would be replaced with actual File objects in a real application
    },
  });

  const { reset, handleSubmit, setValue, watch } = methods;

  const onSubmit: SubmitHandler<{ [key: string]: any }> = async (data) => {
    console.log('Patient Details:', data);
    setIsLoading(true);

    // Retrieve the token from sessionStorage
    const token = sessionStorage.getItem('accessToken');

    if (!token) {
      console.error('No access token found in sessionStorage');
      setIsLoading(false);
      return; // Exit the function if there is no token
    }

    try {
      // Convert form data to a format suitable for your backend, if necessary
      const formattedData = {
        ...data,
        patientName: data.patientName,
        // Include other data transformations here
      };

      // Make a POST request to the server
      const response = await axios.post(
        'http://127.0.0.1:5000/api/diagnosis/submit',
        formattedData,
        {
          headers: {
            // Include the authorization header with the token
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(response.data); // Log the response data from the server
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
                  <Select
                    {...field}
                    labelId="gender-label"
                    label="Gender" // This prop is necessary for the outlined variant to calculate the space for the label correctly.
                    defaultValue="" // Default value can also be managed by React Hook Form.
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    {/* Add more options as necessary */}
                  </Select>
                </FormControl>
              )}
            />

            <RHFTextField name="symptoms" label="Symptoms" multiline rows={4} />
            <RHFTextField name="medicalHistory" label="Medical History" multiline rows={4} />
            <RHFTextField name="allergies" label="Allergies" />
            <RHFTextField name="currentMedications" label="Current Medications" />

            {/* Attachments for medical reports or files */}
            <RHFUpload
              multiple
              thumbnail
              name="files"
              // Add the rest of your upload logic here
            />
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
        disabled={isLoading} // Disable the button while loading
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
      <Card raised sx={{ maxWidth: 600, mx: 'auto', mt: 5 }}>
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

  return (
    <FormProvider methods={methods} onSubmit={methods.handleSubmit(onSubmit)}>
      {!responseReceived ? (
        <>
          {renderDetails}
          {renderSubmitButton}
        </>
      ) : (
        renderResponseDetails(responseDetails)
      )}
    </FormProvider>
  );
}
