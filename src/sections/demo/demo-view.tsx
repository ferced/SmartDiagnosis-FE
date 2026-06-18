import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha } from '@mui/material/styles';

import { RouterLink } from 'src/routes/components';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const PRIMARY = '#1B4965';
const ACCENT = '#62B6CB';

const PATIENT = {
  name: 'John Smith',
  age: 45,
  gender: 'Male',
  symptoms:
    'Persistent fatigue for 3 months, unexplained weight loss of 8kg, night sweats, intermittent low-grade fever, painless swelling in the neck',
  medicalHistory: 'Type 2 diabetes (2019), hypertension',
  allergies: 'Penicillin',
  medications: 'Metformin 500mg BID, Lisinopril 10mg daily, Warfarin 5mg daily',
};

const DRUG_INTERACTIONS = [
  {
    severity: 'HIGH',
    color: 'error' as const,
    drugs: 'CHOP chemotherapy + Warfarin',
    detail: 'Altered metabolism, INR monitoring required. Chemotherapy agents significantly affect warfarin clearance.',
  },
  {
    severity: 'MODERATE',
    color: 'warning' as const,
    drugs: 'Metformin + contrast agents',
    detail: 'Risk of lactic acidosis during CT staging. Withhold metformin 48h before and after contrast.',
  },
];

const EVIDENCE_LINKS = [
  { source: 'NCCN', title: 'NCCN Guidelines for B-Cell Lymphomas', icon: 'mdi:shield-check' },
  { source: 'PubMed', title: 'B-symptoms in lymphoma: diagnostic significance', icon: 'mdi:file-document' },
  { source: 'Cochrane', title: 'First-line treatment for non-Hodgkin lymphoma', icon: 'mdi:database-search' },
];

const MISSING_INFO = [
  { test: 'Lymph Node Biopsy', boost: 25 },
  { test: 'Complete Blood Count', boost: 15 },
  { test: 'CT Chest/Abdomen/Pelvis', boost: 10 },
];

// ----------------------------------------------------------------------

export default function DemoView() {
  const [stage, setStage] = useState<'form' | 'loading' | 'result'>('form');

  const handleRunDiagnosis = () => {
    setStage('loading');
    setTimeout(() => setStage('result'), 3000);
  };

  const handleReset = () => {
    setStage('form');
  };

  return (
    <Box sx={{ py: { xs: 4, md: 6 } }}>
      <Container maxWidth="md">
        {/* Banner */}
        <Alert
          severity="info"
          sx={{ mb: 4, borderRadius: 2 }}
          action={
            <Button
              component={RouterLink}
              href="/auth/jwt/login"
              color="inherit"
              size="small"
              variant="outlined"
            >
              Sign Up
            </Button>
          }
        >
          This is an interactive demo with sample data. Sign up to use real AI-powered diagnosis.
        </Alert>

        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, color: PRIMARY }}>
          Interactive Demo
        </Typography>

        {/* ===== PATIENT FORM ===== */}
        <Card
          sx={{
            mb: 4,
            borderRadius: 2,
            boxShadow: (theme) => `0 4px 24px ${alpha(theme.palette.common.black, 0.06)}`,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
              <Iconify icon="mdi:account-circle" width={28} sx={{ color: PRIMARY }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: PRIMARY }}>
                Patient Information
              </Typography>
            </Stack>

            <Grid container spacing={2.5}>
              <Grid xs={12} sm={4}>
                <FieldDisplay label="Name" value={PATIENT.name} />
              </Grid>
              <Grid xs={6} sm={4}>
                <FieldDisplay label="Age" value={String(PATIENT.age)} />
              </Grid>
              <Grid xs={6} sm={4}>
                <FieldDisplay label="Gender" value={PATIENT.gender} />
              </Grid>
              <Grid xs={12}>
                <FieldDisplay label="Symptoms" value={PATIENT.symptoms} />
              </Grid>
              <Grid xs={12} sm={6}>
                <FieldDisplay label="Medical History" value={PATIENT.medicalHistory} />
              </Grid>
              <Grid xs={12} sm={6}>
                <FieldDisplay label="Allergies" value={PATIENT.allergies} />
              </Grid>
              <Grid xs={12}>
                <FieldDisplay label="Current Medications" value={PATIENT.medications} />
              </Grid>
            </Grid>

            {stage === 'form' && (
              <Button
                variant="contained"
                size="large"
                onClick={handleRunDiagnosis}
                sx={{
                  mt: 3,
                  px: 4,
                  bgcolor: PRIMARY,
                  '&:hover': { bgcolor: alpha(PRIMARY, 0.85) },
                }}
                startIcon={<Iconify icon="mdi:brain" />}
              >
                Run Diagnosis
              </Button>
            )}
          </CardContent>
        </Card>

        {/* ===== LOADING ===== */}
        {stage === 'loading' && (
          <Card
            sx={{
              mb: 4,
              borderRadius: 2,
              boxShadow: (theme) => `0 4px 24px ${alpha(theme.palette.common.black, 0.06)}`,
            }}
          >
            <CardContent sx={{ py: 8, textAlign: 'center' }}>
              <CircularProgress size={56} sx={{ color: PRIMARY, mb: 3 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Analyzing patient data...
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Running differential diagnosis, drug interaction checks, and evidence search.
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* ===== RESULTS ===== */}
        {stage === 'result' && (
          <Stack spacing={3}>
            {/* Primary Diagnosis */}
            <Card
              sx={{
                borderRadius: 2,
                boxShadow: (theme) => `0 4px 24px ${alpha(theme.palette.common.black, 0.06)}`,
                borderLeft: `4px solid ${PRIMARY}`,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                  <Iconify icon="mdi:stethoscope" width={28} sx={{ color: PRIMARY }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: PRIMARY }}>
                    Primary Diagnosis
                  </Typography>
                  <Chip
                    label="65% confidence"
                    size="small"
                    sx={{
                      bgcolor: alpha(ACCENT, 0.15),
                      color: PRIMARY,
                      fontWeight: 700,
                    }}
                  />
                </Stack>

                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Lymphoma (Non-Hodgkin)
                </Typography>

                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.7 }}>
                  Based on the constellation of B-symptoms (fatigue, weight loss, night sweats, fever)
                  combined with painless cervical lymphadenopathy in a 45-year-old male, Non-Hodgkin
                  Lymphoma is the leading differential diagnosis.
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Recommended Treatment
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                  CHOP chemotherapy regimen (Cyclophosphamide, Doxorubicin, Vincristine, Prednisone).
                  Urgent oncology referral recommended. Staging workup including PET/CT and bone marrow
                  biopsy should be completed prior to treatment initiation.
                </Typography>
              </CardContent>
            </Card>

            {/* Drug Interactions */}
            <Card
              sx={{
                borderRadius: 2,
                boxShadow: (theme) => `0 4px 24px ${alpha(theme.palette.common.black, 0.06)}`,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
                  <Iconify icon="mdi:alert-circle" width={28} sx={{ color: '#d32f2f' }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: PRIMARY }}>
                    Drug Interaction Alerts
                  </Typography>
                </Stack>

                <Stack spacing={2}>
                  {DRUG_INTERACTIONS.map((interaction) => (
                    <Alert
                      key={interaction.drugs}
                      severity={interaction.color}
                      variant="outlined"
                      sx={{ borderRadius: 1.5 }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {interaction.severity}: {interaction.drugs}
                      </Typography>
                      <Typography variant="body2">{interaction.detail}</Typography>
                    </Alert>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* Evidence Links */}
            <Card
              sx={{
                borderRadius: 2,
                boxShadow: (theme) => `0 4px 24px ${alpha(theme.palette.common.black, 0.06)}`,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
                  <Iconify icon="mdi:book-open-page-variant" width={28} sx={{ color: PRIMARY }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: PRIMARY }}>
                    Evidence-Based References
                  </Typography>
                </Stack>

                <Stack spacing={1.5}>
                  {EVIDENCE_LINKS.map((link) => (
                    <Stack
                      key={link.title}
                      direction="row"
                      alignItems="center"
                      spacing={1.5}
                      sx={{
                        p: 1.5,
                        borderRadius: 1.5,
                        bgcolor: alpha(PRIMARY, 0.03),
                        '&:hover': { bgcolor: alpha(PRIMARY, 0.06) },
                        cursor: 'pointer',
                      }}
                    >
                      <Iconify icon={link.icon} width={22} sx={{ color: ACCENT }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          [{link.source}] {link.title}
                        </Typography>
                      </Box>
                      <Iconify icon="mdi:open-in-new" width={18} sx={{ color: 'text.disabled' }} />
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* Confidence Calibration */}
            <Card
              sx={{
                borderRadius: 2,
                boxShadow: (theme) => `0 4px 24px ${alpha(theme.palette.common.black, 0.06)}`,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                  <Iconify icon="mdi:target" width={28} sx={{ color: PRIMARY }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: PRIMARY }}>
                    Missing Information - Confidence Calibration
                  </Typography>
                </Stack>

                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
                  The following tests would increase diagnostic confidence:
                </Typography>

                <Stack spacing={2}>
                  {MISSING_INFO.map((item) => (
                    <Box key={item.test}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 0.5 }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.test}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, color: ACCENT }}
                        >
                          +{item.boost}% confidence
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={item.boost * 2}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: alpha(PRIMARY, 0.08),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            background: `linear-gradient(90deg, ${PRIMARY}, ${ACCENT})`,
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* Reset */}
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ pt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleReset}
                sx={{ borderColor: PRIMARY, color: PRIMARY }}
              >
                Reset Demo
              </Button>
              <Button
                component={RouterLink}
                href="/auth/jwt/login"
                variant="contained"
                sx={{ bgcolor: PRIMARY, '&:hover': { bgcolor: alpha(PRIMARY, 0.85) } }}
              >
                Sign Up for Full Access
              </Button>
            </Stack>
          </Stack>
        )}
      </Container>
    </Box>
  );
}

// ----------------------------------------------------------------------

function FieldDisplay({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', mb: 0.5, display: 'block' }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          p: 1.5,
          borderRadius: 1,
          bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
          lineHeight: 1.6,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
