import { Controller } from 'react-hook-form';

import { Settings, AutoAwesome } from '@mui/icons-material';
import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Button,
  Select,
  MenuItem,
  useTheme,
  CardHeader,
  InputLabel,
  Typography,
  FormControl,
  CircularProgress,
} from '@mui/material';

import { RHFUpload, RHFTextField } from 'src/components/hook-form';

interface OpenAIConfig {
  apiKey: string;
  model: string;
}

interface MainFormProps {
  methods: any;
  isLoading: boolean;
  handleSubmit: () => void;
  openAIConfig: OpenAIConfig | null;
  onOpenAIConfigClick: () => void;
}

export default function MainForm({
  methods,
  isLoading,
  handleSubmit,
  openAIConfig,
  onOpenAIConfigClick
}: MainFormProps) {
  const theme = useTheme();
  const { setValue } = methods;

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

    handleSubmit();
  };

  const handleRareDiseaseAutoFill = () => {
    const preloadedRareData = {
      patientName: 'Emily Clarke',
      age: 29,
      symptoms: 'Intermittent muscle weakness, blurred vision, slight coordination issues',
      medicalHistory: 'Subtle signs of rare neurological irregularities; family history of uncommon autoimmune markers',
      allergies: 'None reported',
      gender: 'female',
      currentMedications: 'Vitamin supplements',
    };

    Object.keys(preloadedRareData).forEach((key) => {
      setValue(key as keyof typeof preloadedRareData, preloadedRareData[key as keyof typeof preloadedRareData]);
    });

    handleSubmit();
  };

  return (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Patient Details" />
            <Stack spacing={3} sx={{ p: 3 }}>
              {/* Demographics */}
              <Typography variant="overline" color="text.secondary">
                Demographics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <RHFTextField name="patientName" label="Patient Name" />
                </Grid>
                <Grid item xs={12} md={4}>
                  <RHFTextField name="age" label="Age" type="number" />
                </Grid>
                <Grid item xs={12} md={4}>
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
                </Grid>
              </Grid>

              {/* Clinical Information */}
              <Typography variant="overline" color="text.secondary" sx={{ mt: 1 }}>
                Clinical Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <RHFTextField name="symptoms" label="Symptoms" multiline rows={4} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <RHFTextField name="medicalHistory" label="Medical History" multiline rows={4} />
                </Grid>
              </Grid>

              {/* Additional Details */}
              <Typography variant="overline" color="text.secondary" sx={{ mt: 1 }}>
                Additional Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <RHFTextField name="allergies" label="Allergies" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <RHFTextField name="currentMedications" label="Current Medications" />
                </Grid>
                <Grid item xs={12}>
                  <RHFUpload multiple thumbnail name="files" />
                </Grid>
              </Grid>

              {/* AI Model Configuration - inline */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  borderRadius: 1,
                  bgcolor: 'background.neutral',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <AutoAwesome sx={{ color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    AI Model:
                  </Typography>
                  <Chip
                    label={openAIConfig ? openAIConfig.model : 'GPT-4o (Default)'}
                    color={openAIConfig ? 'primary' : 'default'}
                    size="small"
                  />
                  {openAIConfig && (
                    <Typography variant="caption" color="text.disabled">
                      Key: ••••{openAIConfig.apiKey.slice(-4)}
                    </Typography>
                  )}
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<Settings />}
                  onClick={onOpenAIConfigClick}
                  size="small"
                >
                  Configure
                </Button>
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={isLoading}
          sx={{
            borderRadius: 2,
            padding: '10px 30px',
            boxShadow: theme.customShadows?.primary || '0 3px 5px 2px rgba(105, 140, 255, .3)',
            ':hover': { boxShadow: theme.customShadows?.primary || '0 5px 7px 3px rgba(105, 140, 255, .4)' },
            textTransform: 'none',
            fontWeight: 'bold',
          }}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Submit Patient Information'}
        </Button>

        {import.meta.env.DEV && (
          <>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleAutoFill}
              sx={{
                borderRadius: 2,
                padding: '10px 30px',
                textTransform: 'none',
                fontWeight: 'bold',
              }}
            >
              Auto Fill & Submit
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={handleRareDiseaseAutoFill}
              sx={{
                borderRadius: 2,
                padding: '10px 30px',
                textTransform: 'none',
                fontWeight: 'bold',
              }}
            >
              Rare Disease Auto Fill & Submit
            </Button>
          </>
        )}
      </Stack>
    </>
  );
}
