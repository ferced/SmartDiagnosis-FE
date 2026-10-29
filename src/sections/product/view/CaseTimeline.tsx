import { useState } from 'react';

import { ArrowForward } from '@mui/icons-material';
import { Box, Card, Chip, Stack, Typography, ButtonBase } from '@mui/material';

import { TimelineEntry } from './types';
import { parseProbabilityPercent } from './probability';
import { confirmationColor, confirmationLabel, assessmentStateLabel } from './confirmation';

interface Props {
  entries: TimelineEntry[];
}

function leadingOf(entry: TimelineEntry) {
  let lead = entry.diagnoses[0];
  entry.diagnoses.forEach((d) => {
    if (
      (parseProbabilityPercent(d.probability) ?? -1) >
      (parseProbabilityPercent(lead.probability) ?? -1)
    ) {
      lead = d;
    }
  });
  return lead;
}

// Every state the case went through, oldest first: what was added and what
// the assessment was after it ("38% → new findings → 62% → imaging → 96%
// confirmed"). Earlier states stay readable — click one to see its full
// differential — so the case reads as an ongoing assessment with an audit
// trail, not as a form that was submitted again.
export default function CaseTimeline({ entries }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  if (entries.length < 2) return null;

  const selected = open !== null ? entries[open] : null;

  return (
    <Card sx={{ mt: 3, p: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        Case timeline
      </Typography>
      <Stack direction="row" alignItems="stretch" flexWrap="wrap" gap={1}>
        {entries.map((entry, idx) => {
          const lead = entry.diagnoses.length > 0 ? leadingOf(entry) : null;
          const current = idx === entries.length - 1;
          return (
            <Stack key={`${entry.at}-${idx}`} direction="row" alignItems="center" gap={1}>
              {idx > 0 && <ArrowForward sx={{ fontSize: 16, color: 'text.disabled' }} />}
              <ButtonBase
                onClick={() => setOpen(open === idx ? null : idx)}
                sx={{
                  px: 1.25,
                  py: 0.75,
                  borderRadius: 1,
                  textAlign: 'left',
                  display: 'block',
                  border: '1px solid',
                  borderColor: open === idx || current ? 'primary.main' : 'divider',
                  maxWidth: 220,
                }}
              >
                <Typography variant="caption" color="text.secondary" component="p" noWrap>
                  {entry.label}
                </Typography>
                {lead ? (
                  <>
                    <Typography variant="subtitle2" noWrap title={lead.diagnosis}>
                      {lead.probability} {lead.diagnosis}
                    </Typography>
                    {confirmationLabel(lead.confirmation_status) && (
                      <Chip
                        label={confirmationLabel(lead.confirmation_status)}
                        color={confirmationColor(lead.confirmation_status)}
                        size="small"
                        variant="outlined"
                        sx={{ mt: 0.5, height: 20, fontSize: 11 }}
                      />
                    )}
                  </>
                ) : (
                  <Typography variant="subtitle2">
                    {assessmentStateLabel(entry.assessmentState) || 'No differential'}
                  </Typography>
                )}
              </ButtonBase>
            </Stack>
          );
        })}
      </Stack>

      {selected && (
        <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 1, bgcolor: 'background.neutral' }}>
          <Typography variant="caption" color="text.secondary">
            {new Date(selected.at).toLocaleString()} · {selected.label}
            {selected.assessmentState ? ` · ${assessmentStateLabel(selected.assessmentState)}` : ''}
          </Typography>
          {selected.addedText && (
            <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
              Added: {selected.addedText}
            </Typography>
          )}
          <Stack spacing={0.25} sx={{ mt: 1 }}>
            {selected.diagnoses.map((d, idx) => (
              <Typography key={`${d.diagnosis}-${idx}`} variant="body2">
                {d.probability} — {d.diagnosis}
                {confirmationLabel(d.confirmation_status)
                  ? ` (${confirmationLabel(d.confirmation_status).toLowerCase()})`
                  : ''}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}
    </Card>
  );
}
