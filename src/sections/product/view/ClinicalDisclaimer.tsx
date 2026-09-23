import { Alert, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

// Shown under every result — differential, abstention or work-up-first. The
// engine sends its own disclaimer with each response; this is the fallback
// when a payload arrives without one, so the screen is never shown bare.
export const DEFAULT_DISCLAIMER =
  'AI Professor is a clinical decision-support tool. It assists, it does not replace clinical judgement. The physician accepts, modifies or overrides every output.';

interface Props {
  text?: string;
}

export default function ClinicalDisclaimer({ text }: Props) {
  return (
    <Alert
      severity="info"
      variant="outlined"
      icon={<Iconify icon="solar:shield-warning-bold-duotone" width={22} />}
      sx={{ mt: 3 }}
    >
      <Typography variant="caption" component="p" sx={{ fontWeight: 700 }}>
        Medical disclaimer
      </Typography>
      <Typography variant="caption" component="p">
        {text?.trim() || DEFAULT_DISCLAIMER}
      </Typography>
    </Alert>
  );
}
