import axios from 'axios';
import React, { useState } from 'react';

import {
  Close as CloseIcon,
  Biotech as BiotechIcon,
  Science as ScienceIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Chip,
  Alert,
  Stack,
  Button,
  Dialog,
  TextField,
  IconButton,
  Typography,
  CardContent,
  DialogTitle,
  DialogActions,
  DialogContent,
  CircularProgress,
} from '@mui/material';

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
  onTestSubmit: (decision: string, action: any, rareDiseaseId: string) => void;
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
  const [testResults, setTestResults] = useState<{ [key: string]: string }>({});
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [symptomsPresent, setSymptomsPresent] = useState<{ [key: string]: boolean }>({});

  const handleSymptomsResponse = (diseaseId: string, hasSymptoms: boolean) => {
    setSymptomsPresent({ ...symptomsPresent, [diseaseId]: hasSymptoms });
    
    if (hasSymptoms) {
      const disease = rareDiseases.find(d => d.diagnosis === diseaseId);
      if (disease) {
        // Agregar tests de ejemplo si no vienen del backend
        const diseaseWithTests = {
          ...disease,
          recommendedTests: disease.recommendedTests && disease.recommendedTests.length > 0 
            ? disease.recommendedTests 
            : [
                'Complete Blood Count (CBC)',
                'Genetic Panel Testing',
                'Specialized Biomarker Analysis'
              ],
          discriminatorSymptoms: disease.discriminatorSymptoms && disease.discriminatorSymptoms.length > 0
            ? disease.discriminatorSymptoms
            : [
                'Specific symptom that distinguishes this condition',
                'Additional characteristic symptom',
                'Key diagnostic feature'
              ]
        };
        setSelectedDisease(diseaseWithTests);
        setShowTestDialog(true);
      }
    }
  };

  const handleTestSubmit = async () => {
    if (!selectedDisease || selectedTests.length === 0 || Object.keys(testResults).length === 0) return;

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      const testResultData = {
        testNames: selectedTests,
        results: testResults,
        rareDiseaseId: selectedDisease.diagnosis,
        conversationId,
        patientInfo,
        currentDiagnoses,
        ...(openAIConfig && { openaiConfig: openAIConfig }),
      };

      const response = await axios.post(`${HOST_API}/diagnosis/test-result`, testResultData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Handle the decision from backend
      const { decision, action } = response.data;
      
      // Call parent callback with the decision and action
      onTestSubmit(
        decision, // CONFIRM, RULE_OUT, or INCONCLUSIVE
        action, // Contains action type and updated diagnosis details
        selectedDisease.diagnosis
      );
      
      // Reset state
      setShowTestDialog(false);
      setTestResults({});
      setSelectedTests([]);
      setSelectedDisease(null);
    } catch (error) {
      console.error('Error submitting test result:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipTest = () => {
    setShowTestDialog(false);
    setTestResults({});
    setSelectedTests([]);
    setSelectedDisease(null);
  };


  return (
    <Box sx={{ position: 'sticky', top: 20, maxHeight: 'calc(100vh - 100px)' }}>
      <Card sx={{ backgroundColor: '#FFF8E1', border: '2px solid #FFB74D', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flex: '0 0 auto', pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <WarningIcon color="warning" />
            <Typography variant="h6" fontWeight="bold">
              Rare Disease Consideration
            </Typography>
          </Box>

          <Alert severity="warning" icon={<ScienceIcon />}>
            The following rare diseases share symptom overlap with the primary diagnosis.
            Review discriminator symptoms to rule out critical conditions.
          </Alert>
        </CardContent>
        
        <Box 
          sx={{ 
            flex: '1 1 auto',
            overflowY: 'auto',
            px: 2,
            pb: 2,
            maxHeight: '500px', // This will show approximately 2 cards
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f1f1f1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#FFB74D',
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: '#FF9800',
              },
            },
          }}
        >
          <Stack spacing={2}>
            {rareDiseases && rareDiseases.length > 0 ? (
              rareDiseases.map((disease, index) => (
                <Card
                  key={index}
                  sx={{
                    backgroundColor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    minHeight: '220px', // Ensures consistent card height
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
        </Box>
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
                The following tests are recommended. You can select one or more tests and provide results for each.
              </Alert>

              {selectedDisease.recommendedTests && selectedDisease.recommendedTests.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Recommended Tests (Select one or more):
                  </Typography>
                  <Stack spacing={1}>
                    {selectedDisease.recommendedTests.map((test, idx) => (
                      <Chip
                        key={idx}
                        label={test}
                        icon={<BiotechIcon />}
                        onClick={() => {
                          if (selectedTests.includes(test)) {
                            setSelectedTests(selectedTests.filter(t => t !== test));
                            const newResults = { ...testResults };
                            delete newResults[test];
                            setTestResults(newResults);
                          } else {
                            setSelectedTests([...selectedTests, test]);
                          }
                        }}
                        color={selectedTests.includes(test) ? 'primary' : 'default'}
                        variant={selectedTests.includes(test) ? 'filled' : 'outlined'}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {selectedTests.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Test Results:
                  </Typography>
                  <Stack spacing={2}>
                    {selectedTests.map((test) => (
                      <TextField
                        key={test}
                        fullWidth
                        multiline
                        rows={2}
                        label={`Result for ${test}`}
                        value={testResults[test] || ''}
                        onChange={(e) => setTestResults({ ...testResults, [test]: e.target.value })}
                        placeholder="Enter the test result here..."
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </Box>
              )}
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
              disabled={selectedTests.length === 0 || selectedTests.some(test => !testResults[test]) || isSubmitting}
              fullWidth
            >
              🧪 Submit Test Results
            </Button>
            <Button
              variant="outlined"
              onClick={handleSkipTest}
              disabled={isSubmitting}
              fullWidth
            >
              🙅 Skip test and proceed
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RareDiseasePanel;