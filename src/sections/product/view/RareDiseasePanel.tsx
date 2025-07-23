import React, { useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import {
  Biotech as BiotechIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Science as ScienceIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

import axios from 'axios';

import { HOST_API } from 'src/config-global';

interface RareDisease {
  diagnosis: string;
  treatment: string;
  probability: string;
  prevalence: string;
  discriminatorSymptoms?: string[];
  recommendedTests?: string[];
}

interface RareDiseasePanelProps {
  rareDiseases: RareDisease[];
  onTestSubmit: (testName: string, testResult: string, rareDiseaseId: string) => void;
  patientInfo: any;
  currentDiagnoses: any;
  conversationId: number;
  openAIConfig?: any;
}

const RareDiseasePanel: React.FC<RareDiseasePanelProps> = ({
  rareDiseases,
  onTestSubmit,
  patientInfo,
  currentDiagnoses,
  conversationId,
  openAIConfig,
}) => {
  const [selectedDisease, setSelectedDisease] = useState<RareDisease | null>(null);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [selectedTest, setSelectedTest] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [symptomsPresent, setSymptomsPresent] = useState<{ [key: string]: boolean }>({});

  const handleSymptomsResponse = (diseaseId: string, hasSymptoms: boolean) => {
    setSymptomsPresent({ ...symptomsPresent, [diseaseId]: hasSymptoms });
    
    if (hasSymptoms) {
      const disease = rareDiseases.find(d => d.diagnosis === diseaseId);
      if (disease) {
        setSelectedDisease(disease);
        setShowTestDialog(true);
      }
    }
  };

  const handleTestSubmit = async () => {
    if (!selectedDisease || !testResult || !selectedTest) return;

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      const testResultData = {
        testName: selectedTest,
        result: testResult,
        rareDiseaseId: selectedDisease.diagnosis,
        conversationId,
        patientInfo,
        currentDiagnoses,
        ...(openAIConfig && { openaiConfig: openAIConfig }),
      };

      await axios.post(`${HOST_API}/diagnosis/test-result`, testResultData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Call parent callback with the response
      onTestSubmit(selectedTest, testResult, selectedDisease.diagnosis);
      
      // Reset state
      setShowTestDialog(false);
      setTestResult('');
      setSelectedTest('');
      setSelectedDisease(null);
    } catch (error) {
      console.error('Error submitting test result:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipTest = () => {
    setShowTestDialog(false);
    setTestResult('');
    setSelectedTest('');
    setSelectedDisease(null);
  };

  const handleSwitchToDiagnosis = () => {
    if (selectedDisease) {
      onTestSubmit('', '', selectedDisease.diagnosis);
    }
    setShowTestDialog(false);
  };

  return (
    <Box sx={{ position: 'sticky', top: 20, height: 'fit-content' }}>
      <Card sx={{ backgroundColor: '#FFF8E1', border: '2px solid #FFB74D' }}>
        <CardContent>
          <Stack spacing={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <WarningIcon color="warning" />
              <Typography variant="h6" fontWeight="bold">
                Rare Disease Consideration
              </Typography>
            </Box>

            <Alert severity="warning" icon={<ScienceIcon />}>
              The following rare diseases share symptom overlap with the primary diagnosis.
              Review discriminator symptoms to rule out critical conditions.
            </Alert>

            {rareDiseases && rareDiseases.length > 0 ? (
              rareDiseases.slice(0, 5).map((disease, index) => (
                <Card
                  key={index}
                  sx={{
                    backgroundColor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <CardContent>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          {disease.diagnosis}
                        </Typography>
                        <Chip
                          label={`Prevalence: ${disease.prevalence}`}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      </Box>

                      {disease.discriminatorSymptoms && disease.discriminatorSymptoms.length > 0 && (
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Discriminator symptoms:
                          </Typography>
                          <ul style={{ margin: 0, paddingLeft: 20 }}>
                            {disease.discriminatorSymptoms.map((symptom, idx) => (
                              <li key={idx}>
                                <Typography variant="body2">{symptom}</Typography>
                              </li>
                            ))}
                          </ul>
                        </Box>
                      )}

                      <Box>
                        <Typography variant="body2" fontWeight="bold" gutterBottom>
                          Are any of these symptoms present in the patient?
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="contained"
                            size="small"
                            color="error"
                            onClick={() => handleSymptomsResponse(disease.diagnosis, true)}
                            disabled={symptomsPresent[disease.diagnosis] !== undefined}
                          >
                            Yes
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleSymptomsResponse(disease.diagnosis, false)}
                            disabled={symptomsPresent[disease.diagnosis] !== undefined}
                          >
                            No
                          </Button>
                          {symptomsPresent[disease.diagnosis] === true && (
                            <CheckCircleIcon color="error" />
                          )}
                          {symptomsPresent[disease.diagnosis] === false && (
                            <CheckCircleIcon color="success" />
                          )}
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No rare diseases to consider for this diagnosis.
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Test Dialog */}
      <Dialog open={showTestDialog} onClose={() => setShowTestDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Test Recommendation</Typography>
            <IconButton onClick={() => setShowTestDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedDisease && (
            <Stack spacing={3}>
              <Alert severity="warning">
                This symptom could point to <strong>{selectedDisease.diagnosis}</strong>.
                The following test(s) is/are recommended. After you perform them, please input the result below.
              </Alert>

              {selectedDisease.recommendedTests && selectedDisease.recommendedTests.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Recommended Tests:
                  </Typography>
                  <Stack spacing={1}>
                    {selectedDisease.recommendedTests.map((test, idx) => (
                      <Chip
                        key={idx}
                        label={test}
                        icon={<BiotechIcon />}
                        onClick={() => setSelectedTest(test)}
                        color={selectedTest === test ? 'primary' : 'default'}
                        variant={selectedTest === test ? 'filled' : 'outlined'}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Test Result"
                value={testResult}
                onChange={(e) => setTestResult(e.target.value)}
                placeholder="Enter the test result here..."
                variant="outlined"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Stack direction="row" spacing={2} sx={{ width: '100%', p: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={isSubmitting ? <CircularProgress size={20} /> : <BiotechIcon />}
              onClick={handleTestSubmit}
              disabled={!testResult || !selectedTest || isSubmitting}
              fullWidth
            >
              🧪 Submit Test Result
            </Button>
            <Button
              variant="outlined"
              onClick={handleSkipTest}
              disabled={isSubmitting}
              fullWidth
            >
              🙅 Skip test and proceed
            </Button>
            <Button
              variant="outlined"
              color="warning"
              onClick={handleSwitchToDiagnosis}
              disabled={isSubmitting}
              fullWidth
            >
              📋 Switch to Rare Disease
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RareDiseasePanel;