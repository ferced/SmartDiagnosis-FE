import { Controller } from 'react-hook-form';

import { Settings, AutoAwesome } from '@mui/icons-material';
import {
  Box,
  Card,
  Chip,
  Grid,
  Alert,
  Stack,
  Button,
  Select,
  MenuItem,
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

        {/* OpenAI Configuration Card */}
        <Grid xs={12}>
          <Card>
            <CardHeader
              title="AI Model Configuration"
              action={
                <Button
                  variant="outlined"
                  startIcon={<Settings />}
                  onClick={onOpenAIConfigClick}
                  size="small"
                >
                  Configure
                </Button>
              }
            />
            <Box sx={{ p: 3 }}>
              {openAIConfig ? (
                <Stack spacing={2}>
                  <Alert severity="success" icon={<AutoAwesome />}>
                    Using your custom OpenAI configuration
                  </Alert>
                  <Box display="flex" gap={2} alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Model:
                    </Typography>
                    <Chip
                      label={openAIConfig.model}
                      color="primary"
                      size="small"
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    API Key: ••••••••{openAIConfig.apiKey.slice(-4)}
                  </Typography>
                </Stack>
              ) : (
                <Alert severity="info">
                  <Typography variant="body2">
                    Using system default (GPT-4o). Configure your own API key to choose different models and manage your own costs.
                  </Typography>
                </Alert>
              )}
            </Box>
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
            boxShadow: '0 3px 5px 2px rgba(105, 140, 255, .3)',
            ':hover': { boxShadow: '0 5px 7px 3px rgba(105, 140, 255, .4)' },
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
            ':hover': { boxShadow: '0 5px 7px 3px rgba(105, 140, 255, .4)' },
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
            boxShadow: '0 3px 5px 2px rgba(255, 183, 77, .3)',
            ':hover': { boxShadow: '0 5px 7px 3px rgba(255, 183, 77, .4)' },
            textTransform: 'none',
            fontWeight: 'bold',
          }}
        >
          Rare Disease Auto Fill & Submit
        </Button>
      </Stack>
    </>
  );
}
