import axios from 'axios';
import * as Yup from 'yup';
import { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, SubmitHandler } from 'react-hook-form';

import { Alert, Box, Card, Grid, Skeleton, Snackbar, Stack } from '@mui/material';

import { HOST_API } from 'src/config-global';

import { uploadDocuments } from 'src/api/documents';
import { varFade } from 'src/components/animate';
import FormProvider from 'src/components/hook-form';
import { OpenAIConfigModal } from 'src/components/openai-config';

import ChatBox from './ChatBox';
import MainForm from './main-form';
import { DiagnosisResponseDetails } from './types';
import ResponseDetails from './response-details-form';

interface OpenAIConfig {
  apiKey: string;
  model: string;
}

function LoadingSkeleton() {
  return (
    <Box sx={{ mt: 3 }}>
      <Alert severity="info" sx={{ mb: 3 }}>
        Analyzing patient information and generating diagnosis...
      </Alert>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1, mb: 3 }} />
            <Stack spacing={2}>
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 1 }} />
              <Skeleton variant="text" width="40%" height={32} sx={{ mt: 2 }} />
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="90%" />
              <Skeleton variant="text" width="70%" />
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default function PatientForm() {
  const [responseReceived, setResponseReceived] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [responseDetails, setResponseDetails] = useState<DiagnosisResponseDetails | null>(null);
  const [originalPatientInfo, setOriginalPatientInfo] = useState({});
  const [activeStep, setActiveStep] = useState(0);
  const [question, setQuestion] = useState('');
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpAnswers, setFollowUpAnswers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [openAIConfig, setOpenAIConfig] = useState<OpenAIConfig | null>(null);
  const [showOpenAIConfig, setShowOpenAIConfig] = useState(false);

  const PatientSchema = Yup.object().shape({
    patientName: Yup.string().required('Patient name is required'),
    age: Yup.number().positive().integer().required('Age is required'),
    symptoms: Yup.string().required('Symptoms are required'),
    medicalHistory: Yup.string(),
    allergies: Yup.string(),
    gender: Yup.string(),
    currentMedications: Yup.string(),
    files: Yup.array().of(Yup.mixed()),
  });

  const methods = useForm({
    resolver: yupResolver(PatientSchema),
  });

  const { reset, handleSubmit } = methods;

  useEffect(() => {
    const savedConfig = sessionStorage.getItem('openaiConfig');
    if (savedConfig) {
      try {
        setOpenAIConfig(JSON.parse(savedConfig));
      } catch (parseError) {
        console.error('Failed to parse saved OpenAI config:', parseError);
        sessionStorage.removeItem('openaiConfig');
      }
    }
  }, []);

  const onSubmit: SubmitHandler<{ [key: string]: any }> = async (data) => {
    const { files, ...patientData } = data;
    setOriginalPatientInfo(patientData);
    setIsLoading(true);

    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      console.error('No access token found in sessionStorage');
      setError('No access token found in sessionStorage');
      setIsLoading(false);
      return;
    }

    try {
      const conversationResponse = await axios.post(`${HOST_API}/conversation`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const conversationId = conversationResponse.data.id;

      if (files && files.length > 0) {
         const filesToUpload = files.filter((f: any) => f instanceof File);
         if (filesToUpload.length > 0) {
            await uploadDocuments(filesToUpload, conversationId);
         }
      }

      const formattedData = {
        ...patientData,
        conversationId,
        ...(openAIConfig && { openaiConfig: openAIConfig }),
      };

      const response = await axios.post(`${HOST_API}/diagnoses/submit`, formattedData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setResponseDetails(response.data);
      setActiveStep(0);
      setIsLoading(false);
      setResponseReceived(true);
      reset();
    } catch (err: any) {
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

  const handleOpenAIConfigSet = (config: OpenAIConfig | null) => {
    setOpenAIConfig(config);
  };

  const hasDiagnoses = () => {
    if (responseDetails?.diagnoses?.common_diagnoses && responseDetails.diagnoses.common_diagnoses.length > 0) {
      return true;
    }
    const response = responseDetails as any;
    if (response?.followUpResponse?.common_diagnoses && response.followUpResponse.common_diagnoses.length > 0) {
      return true;
    }
    return false;
  };

  const getActiveDiagnosis = () => {
    if (responseDetails && responseDetails.diagnoses?.common_diagnoses &&
      responseDetails.diagnoses.common_diagnoses.length > 0) {
      return responseDetails.diagnoses.common_diagnoses[activeStep];
    }
    const response = responseDetails as any;
    if (response && response.followUpResponse?.common_diagnoses &&
      response.followUpResponse.common_diagnoses.length > 0) {
      return response.followUpResponse.common_diagnoses[activeStep];
    }
    return null;
  };

  const fadeIn = varFade().in;

  return (
    <>
      <FormProvider methods={methods} onSubmit={methods.handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          {/* Loading skeleton */}
          {isLoading && !responseReceived && (
            <m.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <LoadingSkeleton />
            </m.div>
          )}

          {/* Form */}
          {!responseReceived && !isLoading && (
            <m.div
              key="form"
              {...fadeIn}
            >
              <MainForm
                methods={methods}
                isLoading={isLoading}
                handleSubmit={handleSubmit(onSubmit)}
                openAIConfig={openAIConfig}
                onOpenAIConfigClick={() => setShowOpenAIConfig(true)}
              />
            </m.div>
          )}

          {/* Results */}
          {responseReceived && responseDetails && hasDiagnoses() && (
            <m.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <ResponseDetails
                responseDetails={responseDetails}
                activeStep={activeStep}
                setActiveStep={setActiveStep}
                showFollowUp={showFollowUp}
                setShowFollowUp={setShowFollowUp}
                followUpAnswers={followUpAnswers}
                setFollowUpAnswers={setFollowUpAnswers}
                originalPatientInfo={originalPatientInfo}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                setResponseDetails={setResponseDetails}
                openAIConfig={openAIConfig}
              />
              <ChatBox
                question={question}
                setQuestion={setQuestion}
                originalPatientInfo={originalPatientInfo}
                initialResponse={getActiveDiagnosis()}
                openAIConfig={openAIConfig}
              />
            </m.div>
          )}
        </AnimatePresence>

        {responseReceived && responseDetails && !hasDiagnoses() && (
          <Alert severity="warning">
            No diagnoses were returned. Please check the patient information and try again.
          </Alert>
        )}

        <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      </FormProvider>

      <OpenAIConfigModal
        open={showOpenAIConfig}
        onClose={() => setShowOpenAIConfig(false)}
        onConfigSet={handleOpenAIConfigSet}
        initialConfig={openAIConfig}
      />
    </>
  );
}
