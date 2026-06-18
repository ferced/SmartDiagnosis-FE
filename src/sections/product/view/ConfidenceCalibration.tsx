import { Box, Card, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import Iconify from 'src/components/iconify';

interface MissingInfo {
  test: string;
  impact_estimate: string;
  reasoning: string;
}

interface Props {
  missingInformation: MissingInfo[];
}

function parseImpact(estimate: string): number {
  const match = estimate.match(/\+?(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export default function ConfidenceCalibration({ missingInformation }: Props) {
  if (!missingInformation || missingInformation.length === 0) return null;

  const sorted = [...missingInformation].sort(
    (a, b) => parseImpact(b.impact_estimate) - parseImpact(a.impact_estimate)
  );

  return (
    <Card
      sx={{
        mt: 2,
        p: 2,
        bgcolor: 'primary.lighter',
        border: '1px solid',
        borderColor: 'primary.light',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Iconify icon="mdi:target" width={22} color="primary.main" />
        <Typography variant="subtitle2" color="primary.main">
          How to Increase Confidence
        </Typography>
      </Stack>

      <Stack spacing={1.5}>
        {sorted.map((item, index) => {
          const impact = parseImpact(item.impact_estimate);
          return (
            <Box key={index}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="body2" fontWeight={600}>
                  {item.test}
                </Typography>
                <Chip
                  label={item.impact_estimate}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                />
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.min(impact, 100)}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  mb: 0.5,
                  bgcolor: 'primary.lighter',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    bgcolor: 'primary.main',
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {item.reasoning}
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Card>
  );
}
