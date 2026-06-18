import { Alert, AlertTitle, Box, Stack, Typography } from '@mui/material';
import Iconify from 'src/components/iconify';

interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'high' | 'moderate' | 'low';
  detail: string;
}

interface Props {
  drugInteractions: DrugInteraction[];
}

const SEVERITY_CONFIG = {
  high: { color: 'error' as const, icon: 'mdi:alert-circle', label: 'High Risk' },
  moderate: { color: 'warning' as const, icon: 'mdi:alert', label: 'Moderate Risk' },
  low: { color: 'info' as const, icon: 'mdi:information', label: 'Low Risk' },
};

export default function DrugInteractionAlert({ drugInteractions }: Props) {
  if (!drugInteractions || drugInteractions.length === 0) return null;

  return (
    <Box sx={{ mt: 2, mb: 1 }}>
      <Stack spacing={1}>
        {drugInteractions.map((interaction, index) => {
          const config = SEVERITY_CONFIG[interaction.severity] || SEVERITY_CONFIG.low;
          return (
            <Alert
              key={index}
              severity={config.color}
              icon={<Iconify icon={config.icon} width={24} />}
              sx={{
                '& .MuiAlert-message': { width: '100%' },
              }}
            >
              <AlertTitle sx={{ fontSize: '0.85rem', mb: 0.5 }}>
                Drug Interaction — {config.label}
              </AlertTitle>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {interaction.drug1} + {interaction.drug2}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {interaction.detail}
              </Typography>
            </Alert>
          );
        })}
      </Stack>
    </Box>
  );
}
