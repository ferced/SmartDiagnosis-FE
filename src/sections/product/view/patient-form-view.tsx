import axios from 'axios';
import * as Yup from 'yup';
import { useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, SubmitHandler } from 'react-hook-form';

import { HOST_API } from 'src/config-global';

import FormProvider from 'src/components/hook-form';

import MainForm from './main-form';
import ResponseDetails from './response-details-form';
import ChatBox from './ChatBox';

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

export default function PatientForm() {
  const [responseReceived, setResponseReceived] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [responseDetails, setResponseDetails] = useState<ResponseDetails[]>([]);
  const [originalPatientInfo, setOriginalPatientInfo] = useState({});
  const [activeStep, setActiveStep] = useState(0);
  const [question, setQuestion] = useState('');
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpAnswers, setFollowUpAnswers] = useState<{ [key: number]: string[] }>({});
  const [followUpResponse, setFollowUpResponse] = useState<{ [key: number]: FollowUpPayload | null }>({});

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

  return (
    <FormProvider methods={methods} onSubmit={methods.handleSubmit(onSubmit)}>
      {!responseReceived ? (
        <MainForm methods={methods} isLoading={isLoading} handleSubmit={handleSubmit(onSubmit)} />
      ) : (
        <ResponseDetails
          responseDetails={responseDetails}
          activeStep={activeStep}
          setActiveStep={setActiveStep}
          showFollowUp={showFollowUp}
          setShowFollowUp={setShowFollowUp}
          followUpAnswers={followUpAnswers}
          setFollowUpAnswers={setFollowUpAnswers}
          followUpResponse={followUpResponse}
          setFollowUpResponse={setFollowUpResponse}
          originalPatientInfo={originalPatientInfo}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      )}
      {responseReceived && (
        <ChatBox
          question={question}
          setQuestion={setQuestion}
          originalPatientInfo={originalPatientInfo}
          initialResponse={responseDetails[activeStep]}
        />
      )}
    </FormProvider>
  );
}
