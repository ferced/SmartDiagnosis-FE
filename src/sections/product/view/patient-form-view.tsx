/* eslint-disable import/no-extraneous-dependencies */
import axios from 'axios';
import * as Yup from 'yup';
import { useState } from 'react';
import Stepper from 'react-stepper-horizontal';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import CardHeader from '@mui/material/CardHeader';
import { Healing, BarChart, Assignment, Announcement } from '@mui/icons-material';
import {
  Box,
  Button,
  Select,
  Divider,
  MenuItem,
  useTheme,
  Collapse,
  InputLabel,
  Typography,
  FormControl,
  CardContent,
  CircularProgress,
} from '@mui/material';

import { HOST_API } from 'src/config-global';

import FormProvider, { RHFUpload, RHFTextField } from 'src/components/hook-form';

import ChatBox from './ChatBox'; 
// ----------------------------------------------------------------------

interface ResponseDetails {
  diagnosis: string;
  probability: string;
  treatment: string;
  disclaimer: string;
}

export default function PatientForm() {
  const [responseReceived, setResponseReceived] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [responseDetails, setResponseDetails] = useState<ResponseDetails[]>([]);
  const [originalPatientInfo, setOriginalPatientInfo] = useState({});
  const [activeStep, setActiveStep] = useState(0);
  const theme = useTheme();
  const [question, setQuestion] = useState('');

  const PatientSchema = Yup.object().shape({
    patientName: Yup.string().required('Patient name is required'),
    age: Yup.number().positive().integer().required('Age is required'),
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

  const methods = useForm({
    resolver: yupResolver(PatientSchema),
  });

  const { reset, setValue, handleSubmit } = methods;

  const onSubmit: SubmitHandler<{ [key: string]: any }> = async (data) => {
    console.log('Patient Details:', data);

    setOriginalPatientInfo(data);

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

      const response = await axios.post(`${HOST_API}/diagnoses/submit`, formattedData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(response.data);
      const diagnosisData = Array.isArray(response.data) ? response.data : [response.data];
      setResponseDetails(diagnosisData);
      setIsLoading(false);
      setResponseReceived(true);
      reset();
    } catch (error) {
      console.error(error.response ? error.response.data : error.message);
      setIsLoading(false);
    }
  };

  const handleAutoFill = () => {
    const preloadedData = {
      patientName: 'John Doe',
      age: 45,
      symptoms: 'Fever, Cough, Sore Throat',
      medicalHistory: 'Hypertension, Diabetes',
      allergies: 'Peanuts',
      gender: 'male',
      currentMedications: 'Aspirin',
    };

    Object.keys(preloadedData).forEach((key) => {
      setValue(key as keyof typeof preloadedData, preloadedData[key as keyof typeof preloadedData]);
    });

    handleSubmit(onSubmit)();
  };

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
            <RHFTextField name="medicalHistory" label="Medical History" multiline rows={7} />
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
      <Button
        variant="contained"
        color="secondary"
        onClick={handleAutoFill}
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
        Auto Fill & Submit
      </Button>
    </Stack>
  );

  const renderResponseDetails = (detailsArray: ResponseDetails[]) => (
    <Box sx={{ mt: 3 }}>
      <Stepper
        steps={detailsArray.map((_, index) => ({ title: `Diagnosis ${index + 1}` }))}
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
        {Array.isArray(detailsArray) && detailsArray.map((details, index) => (
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
              </CardContent>
            </Card>
          </Collapse>
        ))}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          disabled={activeStep === 0}
          onClick={() => setActiveStep((prev) => Math.max(prev - 1, 0))}
        >
          Previous
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={activeStep === detailsArray.length - 1}
          onClick={() => setActiveStep((prev) => Math.min(prev + 1, detailsArray.length - 1))}
        >
          Next
        </Button>
      </Box>
    </Box>
  );

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
          <ChatBox question={question} setQuestion={setQuestion} originalPatientInfo={originalPatientInfo} initialResponse={responseDetails[activeStep]} />  
        </>
      )}
    </FormProvider>
  );
}
