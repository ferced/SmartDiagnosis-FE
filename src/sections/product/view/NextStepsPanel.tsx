import { useState } from 'react';

import { Science, ReportProblem, SubdirectoryArrowRight } from '@mui/icons-material';
import { Box, Chip, Stack, Button, Divider, Collapse, Typography } from '@mui/material';

import { MustNotMiss, Investigation } from './types';

interface Props {
  plan: Investigation[];
  mustNotMiss?: MustNotMiss[];
  // Fallback for responses from before the plan existed: a flat list of tests.
  legacyWorkup?: string[];
}

const ADDRESSES_LABEL: Record<string, string> = {
  diagnosis: 'Leading diagnosis',
  etiology: 'Cause',
  alternative: 'Alternative',
  baseline: 'Baseline',
  monitoring: 'Monitoring',
};

// The next steps as a decision pathway instead of a checklist: what to do now
// (at most three tests), what to do depending on that result, and everything
// else behind "Show additional workup". It is the only place the results view
// lists investigations — the workup chips, "How to Increase Confidence" and the
// per-card test lists used to repeat the same tests in slightly different words.
export default function NextStepsPanel({ plan, mustNotMiss = [], legacyWorkup = [] }: Props) {
  const [showMore, setShowMore] = useState(false);

  const now = plan.filter((i) => i.priority === 'immediate');
  const branches = plan.filter((i) => i.priority === 'conditional');
  const later = plan.filter((i) => i.priority !== 'immediate' && i.priority !== 'conditional');

  if (plan.length === 0 && legacyWorkup.length === 0 && mustNotMiss.length === 0) return null;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: 'info.light',
        bgcolor: 'background.neutral',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <Science color="info" fontSize="small" />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Next steps
        </Typography>
      </Stack>

      {plan.length === 0 && legacyWorkup.length > 0 && (
        <Stack direction="row" flexWrap="wrap" gap={0.5}>
          {legacyWorkup.map((t) => (
            <Chip key={t} label={t} size="small" color="info" variant="outlined" />
          ))}
        </Stack>
      )}

      {now.length > 0 && (
        <Box>
          <Typography variant="overline" color="info.dark">
            Do now
          </Typography>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            {now.map((inv, idx) => (
              <Box key={`${inv.test}-${idx}`}>
                <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap" useFlexGap>
                  <Typography variant="subtitle2">
                    {idx + 1}. {inv.test}
                  </Typography>
                  {inv.time_horizon && inv.time_horizon !== 'now' && (
                    <Chip label={inv.time_horizon} size="small" variant="outlined" />
                  )}
                </Stack>
                {inv.purpose && (
                  <Typography variant="body2" color="text.secondary">
                    {inv.purpose}
                  </Typography>
                )}
                {(inv.if_positive || inv.if_negative) && (
                  <Stack spacing={0.25} sx={{ mt: 0.5, pl: 1.5 }}>
                    {inv.if_positive && <Branch when="If positive" then={inv.if_positive} />}
                    {inv.if_negative && <Branch when="If negative" then={inv.if_negative} />}
                  </Stack>
                )}
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {branches.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="overline" color="info.dark">
            Depending on the result
          </Typography>
          <Stack spacing={0.75} sx={{ mt: 0.5 }}>
            {branches.map((inv, idx) => (
              <Branch
                key={`${inv.test}-${idx}`}
                when={inv.trigger_condition || 'If needed'}
                then={inv.purpose ? `${inv.test} — ${inv.purpose}` : inv.test}
              />
            ))}
          </Stack>
        </Box>
      )}

      {mustNotMiss.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <ReportProblem color="warning" sx={{ fontSize: 18 }} />
            <Typography variant="overline" color="warning.dark">
              Still to exclude
            </Typography>
          </Stack>
          <Stack spacing={0.75} sx={{ mt: 0.5 }}>
            {mustNotMiss.map((m, idx) => (
              <Typography key={`${m.diagnosis}-${idx}`} variant="body2">
                <strong>{m.diagnosis}</strong>
                {m.why_it_matters ? ` — ${m.why_it_matters}` : ''}
                {m.how_to_exclude ? ` Exclude with: ${m.how_to_exclude}.` : ''}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}

      {later.length > 0 && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Button size="small" onClick={() => setShowMore((v) => !v)}>
            {showMore ? 'Hide additional workup' : `Show additional workup (${later.length})`}
          </Button>
          <Collapse in={showMore} unmountOnExit>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {later.map((inv, idx) => (
                <Box key={`${inv.test}-${idx}`}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="baseline"
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {inv.test}
                    </Typography>
                    {inv.addresses && ADDRESSES_LABEL[inv.addresses] && (
                      <Chip
                        label={ADDRESSES_LABEL[inv.addresses]}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {inv.time_horizon && (
                      <Typography variant="caption" color="text.secondary">
                        {inv.time_horizon}
                      </Typography>
                    )}
                  </Stack>
                  {(inv.purpose || inv.for_diagnosis) && (
                    <Typography variant="caption" color="text.secondary" component="p">
                      {[inv.purpose, inv.for_diagnosis && `(${inv.for_diagnosis})`]
                        .filter(Boolean)
                        .join(' ')}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          </Collapse>
        </>
      )}
    </Box>
  );
}

function Branch({ when, then }: { when: string; then: string }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="flex-start">
      <SubdirectoryArrowRight sx={{ fontSize: 18, color: 'text.disabled', mt: '2px' }} />
      <Typography variant="body2">
        <Box component="span" sx={{ fontWeight: 600 }}>
          {when}
        </Box>{' '}
        → {then}
      </Typography>
    </Stack>
  );
}
