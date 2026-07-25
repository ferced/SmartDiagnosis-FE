import axios from 'axios';
import React, { useState } from 'react';

import { useTheme } from '@mui/material/styles';
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

import Iconify from 'src/components/iconify';

import { DiagnosisDetail } from './types';
import { probabilityColor, parseProbabilityPercent } from './probability';

// Mirrors the backend's rare-candidate shape. `prevalence` is optional there,
// so it is optional here too — declaring it required only hid the case where it
// is missing, it did not prevent it.
//
// The two disconfirming fields are what make this a screen rather than a
// confirmation engine: a panel listing only the features a candidate SHARES
// with the patient fires positive on every candidate.
type RareDisease = Pick<
  DiagnosisDetail,
  | 'diagnosis'
  | 'treatment'
  | 'probability'
  | 'prevalence'
  | 'discriminatorSymptoms'
  | 'recommendedTests'
  | 'expectedButAbsent'
  | 'arguesAgainst'
>;

interface RareDiseasePanelProps {
  rareDiseases: RareDisease[];
  onTestSubmit: (
    decision: string,
    action: any,
    rareDiseaseId: string,
    completedTests?: { name: string; result: string }[]
  ) => void;
  patientInfo: any;
  currentDiagnoses: any;
  conversationId: number;
  openAIConfig?: any;
}

// Colour comes from the shared scale so a probability reads the same here as on
// the main card — this panel used to invert it (high = red) while the main card
// used high = green, with both on screen at once. It also matched "unlikely"
// via includes('likely') and gave explicitly-downgraded candidates the maximum
// alarm accent, and returned a constant colour once the backend started
// emitting numeric percentages.

const RareDiseasePanel: React.FC<RareDiseasePanelProps> = ({
  rareDiseases,
  onTestSubmit,
  patientInfo,
  currentDiagnoses,
  conversationId,
  openAIConfig,
}) => {
  const theme = useTheme();
  const [selectedDisease, setSelectedDisease] = useState<RareDisease | null>(null);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testResults, setTestResults] = useState<{ [key: string]: string }>({});
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [symptomsPresent, setSymptomsPresent] = useState<{ [key: string]: boolean }>({});

  const handleSymptomsResponse = (diseaseId: string, hasSymptoms: boolean) => {
    setSymptomsPresent({ ...symptomsPresent, [diseaseId]: hasSymptoms });

    if (hasSymptoms) {
      const disease = rareDiseases.find(d => d.diagnosis === diseaseId);
      if (disease) {
        // Show what the engine actually proposed. Filling empty arrays with
        // invented placeholders ("Specific symptom that distinguishes this
        // condition", "Genetic Panel Testing") put fabricated clinical content
        // in front of a clinician and made an untested candidate look worked up.
        setSelectedDisease(disease);
        setShowTestDialog(true);
      }
    }
  };

  const handleTestSubmit = async () => {
    if (!selectedDisease || selectedTests.length === 0 || Object.keys(testResults).length === 0) return;

    setIsSubmitting(true);
    setSubmitError(null);
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

      const { decision, action } = response.data;

      // Surface the tests the clinician actually ran (with results) so the
      // parent can feed them back to the engine as authoritative case state.
      const performedTests = selectedTests.map((t) => ({
        name: t,
        result: testResults[t] || '',
      }));

      onTestSubmit(
        decision,
        action,
        selectedDisease.diagnosis,
        performedTests
      );

      setShowTestDialog(false);
      setTestResults({});
      setSelectedTests([]);
      setSelectedDisease(null);
    } catch (error) {
      // A silent console.error left the dialog open with the button live and no
      // explanation — the clinician could not tell a failed submission from a
      // slow one.
      console.error('Error submitting test result:', error);
      setSubmitError(
        'The test result could not be submitted. Nothing was recorded — check the connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipTest = () => {
    setShowTestDialog(false);
    setTestResults({});
    setSelectedTests([]);
    setSelectedDisease(null);
    setSubmitError(null);
  };


  return (
    <Box sx={{ position: 'sticky', top: 20, maxHeight: 'calc(100vh - 100px)' }}>
      <Card sx={{
        backgroundColor: theme.palette.warning.lighter,
        border: '2px solid',
        borderColor: theme.palette.warning.light,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
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
            maxHeight: '500px',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: theme.palette.grey[100],
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.warning.main,
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: theme.palette.warning.dark,
              },
            },
          }}
        >
          <Stack spacing={2}>
            {rareDiseases && rareDiseases.length > 0 ? (
              rareDiseases.map((disease, index) => {
                const accentColor = probabilityColor(parseProbabilityPercent(disease.probability));
                return (
                  <Card
                    key={index}
                    sx={{
                      backgroundColor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderLeft: '4px solid',
                      borderLeftColor: `${accentColor}.main`,
                      minHeight: '220px',
                    }}
                  >
                    <CardContent>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            {disease.diagnosis}
                          </Typography>
                          {/* prevalence is optional on the backend; interpolating
                              it unguarded rendered "Prevalence: undefined" at the
                              clinician. Say nothing rather than say that. */}
                          {disease.prevalence && (
                            <Chip
                              label={`Prevalence: ${disease.prevalence}`}
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          )}
                        </Box>

                        {disease.discriminatorSymptoms && disease.discriminatorSymptoms.length > 0 && (
                          <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Supporting features present in this patient:
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

                        {disease.expectedButAbsent && disease.expectedButAbsent.length > 0 && (
                          <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Expected for this condition but absent here:
                            </Typography>
                            <ul style={{ margin: 0, paddingLeft: 20 }}>
                              {disease.expectedButAbsent.map((feature, idx) => (
                                <li key={idx}>
                                  <Typography variant="body2" color="text.secondary">
                                    {feature}
                                  </Typography>
                                </li>
                              ))}
                            </ul>
                          </Box>
                        )}

                        {disease.arguesAgainst && (
                          <Alert severity="info" icon={false} sx={{ py: 0.5 }}>
                            <Typography variant="caption" fontWeight="bold">
                              Argues against:{' '}
                            </Typography>
                            <Typography variant="caption">{disease.arguesAgainst}</Typography>
                          </Alert>
                        )}

                        <Box>
                          <Typography variant="body2" fontWeight="bold" gutterBottom>
                            Does this candidate warrant investigation?
                          </Typography>
                          <Stack direction="row" spacing={1}>
                            <Button
                              variant="contained"
                              size="small"
                              color="warning"
                              onClick={() => handleSymptomsResponse(disease.diagnosis, true)}
                              disabled={symptomsPresent[disease.diagnosis] !== undefined}
                            >
                              Present
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              color="success"
                              onClick={() => handleSymptomsResponse(disease.diagnosis, false)}
                              disabled={symptomsPresent[disease.diagnosis] !== undefined}
                            >
                              Not Present
                            </Button>
                            {symptomsPresent[disease.diagnosis] === true && (
                              <CheckCircleIcon color="warning" />
                            )}
                            {symptomsPresent[disease.diagnosis] === false && (
                              <CheckCircleIcon color="success" />
                            )}
                          </Stack>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Typography variant="body2" color="text.secondary">
                No rare diseases to consider for this diagnosis.
              </Typography>
            )}
          </Stack>
        </Box>
      </Card>

      {/* Test Dialog. Every close path must clear the selection: closing with
          the X or the backdrop used to leave the previous disease's selected
          tests and typed results in state, so reopening for a DIFFERENT disease
          submitted that workup attributed to the new one. */}
      <Dialog open={showTestDialog} onClose={handleSkipTest} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Test Recommendation</Typography>
            <IconButton onClick={handleSkipTest} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedDisease && (
            <Stack spacing={3}>
              {submitError && <Alert severity="error">{submitError}</Alert>}

              {selectedDisease.recommendedTests && selectedDisease.recommendedTests.length > 0 ? (
                <Alert severity="warning">
                  This could point to <strong>{selectedDisease.diagnosis}</strong>. Select one or
                  more of the tests below and record the result for each.
                </Alert>
              ) : (
                // Do not promise recommendations that were never returned.
                <Alert severity="info">
                  The engine did not propose a specific confirmatory test for{' '}
                  <strong>{selectedDisease.diagnosis}</strong>. Nothing can be recorded here — refer
                  to specialist guidance to choose the discriminating investigation.
                </Alert>
              )}

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
              startIcon={isSubmitting ? <CircularProgress size={20} /> : <Iconify icon="mdi:test-tube" />}
              onClick={handleTestSubmit}
              disabled={selectedTests.length === 0 || selectedTests.some(test => !testResults[test]) || isSubmitting}
              fullWidth
            >
              Submit Test Results
            </Button>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="mdi:skip-next" />}
              onClick={handleSkipTest}
              disabled={isSubmitting}
              fullWidth
            >
              Skip test and proceed
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RareDiseasePanel;
