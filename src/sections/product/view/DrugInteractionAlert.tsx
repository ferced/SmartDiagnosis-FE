import { Box, Chip, Alert, Stack, Tooltip, AlertTitle, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import { DrugInteraction } from './types';

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
              <Typography variant="caption" color="text.secondary" display="block">
                {interaction.detail}
              </Typography>

              {/* Drug grounding. The wording is deliberate: RxNorm resolves the
                  DRUGS, not the severity — RxNav's pairwise interaction API was
                  retired in 2024 — so this must not read as "interaction verified".
                  An interaction naming a drug that does not resolve is a likely
                  model hallucination and has to be visible as such. */}
              <Box sx={{ mt: 0.75 }}>
                {interaction.drugs_verified ? (
                  <Tooltip
                    title={`Both drugs resolve to real RxNorm concepts${
                      interaction.drug1_rxcui && interaction.drug2_rxcui
                        ? ` (RxCUI ${interaction.drug1_rxcui} / ${interaction.drug2_rxcui})`
                        : ''
                    }. The severity above is the model's assessment, not an RxNorm verdict.`}
                  >
                    <Chip
                      size="small"
                      variant="outlined"
                      color="success"
                      icon={<Iconify icon="mdi:check-decagram" width={16} />}
                      label="Drugs verified in RxNorm"
                      sx={{ height: 22, fontSize: '0.7rem' }}
                    />
                  </Tooltip>
                ) : (
                  <Tooltip
                    title={
                      interaction.grounding_note ||
                      'At least one drug named here did not resolve to a real RxNorm concept — treat this interaction as unverified.'
                    }
                  >
                    <Chip
                      size="small"
                      variant="outlined"
                      color="warning"
                      icon={<Iconify icon="mdi:help-circle-outline" width={16} />}
                      label="Unverified drug name"
                      sx={{ height: 22, fontSize: '0.7rem' }}
                    />
                  </Tooltip>
                )}
              </Box>
            </Alert>
          );
        })}
      </Stack>
    </Box>
  );
}
