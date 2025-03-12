import axios from 'axios';
import * as Yup from 'yup';
import { useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, SubmitHandler } from 'react-hook-form';

import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

import { HOST_API } from 'src/config-global';

import FormProvider from 'src/components/hook-form';

import ChatBox from './ChatBox';
import MainForm from './main-form';
import { DiagnosisResponseDetails } from './types';
import ResponseDetails from './response-details-form';  // Import the shared types

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

  const { reset, handleSubmit } = methods;

  const onSubmit: SubmitHandler<{ [key: string]: any }> = async (data) => {
    setOriginalPatientInfo(data);
    setIsLoading(true);

    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      console.error('No access token found in sessionStorage');
      setError('No access token found in sessionStorage');
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

      // Log the response structure to help debug
      console.log('API Response:', response.data);
      
      setResponseDetails(response.data);
      setActiveStep(0);
      setIsLoading(false);
      setResponseReceived(true);
      reset();
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

  // Helper function to safely check for diagnoses
  const hasDiagnoses = () => {
    // Check for responseDetails.diagnoses structure
    if (responseDetails?.diagnoses?.common_diagnoses && responseDetails.diagnoses.common_diagnoses.length > 0) {
      return true;
    }
    
    // Check for responseDetails.followUpResponse structure using type assertion
    const response = responseDetails as any;
    if (response?.followUpResponse?.common_diagnoses && response.followUpResponse.common_diagnoses.length > 0) {
      return true;
    }
    
    return false;
  };
  
  // Helper function to get the active diagnosis regardless of structure
  const getActiveDiagnosis = () => {
    if (responseDetails && responseDetails.diagnoses?.common_diagnoses && 
        responseDetails.diagnoses.common_diagnoses.length > 0) {
      return responseDetails.diagnoses.common_diagnoses[activeStep];
    }
    
    // Using type assertion to handle followUpResponse
    const response = responseDetails as any;
    if (response && response.followUpResponse?.common_diagnoses && 
        response.followUpResponse.common_diagnoses.length > 0) {
      return response.followUpResponse.common_diagnoses[activeStep];
    }
    
    return null;
  };

  return (
    <FormProvider methods={methods} onSubmit={methods.handleSubmit(onSubmit)}>
      {!responseReceived && (
        <MainForm methods={methods} isLoading={isLoading} handleSubmit={handleSubmit(onSubmit)} />
      )}
      {responseReceived && responseDetails && hasDiagnoses() ? (
        <>
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
          />
          <ChatBox
            question={question}
            setQuestion={setQuestion}
            originalPatientInfo={originalPatientInfo}
            initialResponse={getActiveDiagnosis()}
          />
        </>
      ) : (
        responseReceived &&
        responseDetails && (
          <Alert severity="warning">
            No diagnoses were returned. Please check the patient information and try again.
          </Alert>
        )
      )}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </FormProvider>
  );
}