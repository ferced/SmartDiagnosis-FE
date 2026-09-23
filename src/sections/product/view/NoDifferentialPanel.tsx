import { Box, Card, Chip, Alert, Stack, Button, Typography } from '@mui/material';
import { Science, NoteAlt, WarningAmber, AddCircleOutline } from '@mui/icons-material';

import { DiagnosisData } from './types';

interface Props {
  data: Partial<DiagnosisData>;
  onReviseCase: () => void;
  onNewCase: () => void;
}

// What the clinician sees when a response carries no common_diagnoses. Most
// of the time that is the engine doing its job — the confidence gate
// abstained, or the evidence gate decided the work-up must come first — so it
// is presented as an outcome with its reason and next steps, not as an error.
// It used to be a one-line warning with no way back to the case.
export default function NoDifferentialPanel({ data, onReviseCase, onNewCase }: Props) {
  const abstained = Boolean(data.abstained);
  const workupFirst = Boolean(data.workup_first);
  const recommendedWorkup = data.recommended_workup || [];
  const followUpQuestions = data.follow_up_questions || [];

  // Both gates can fire on one case: the evidence gate caps a differential
  // that depends on a finding nobody has obtained, and the confidence gate
  // then abstains. The abstention reason leads, and the work-up reason is
  // shown under it instead of being dropped (unless it just repeats it).
  const workupReason = data.workup_reason?.trim() || '';
  const showWorkupReason =
    abstained &&
    workupFirst &&
    Boolean(workupReason) &&
    workupReason !== (data.abstention_reason?.trim() || '');

  let title = 'No differential was returned for this case';
  let body =
    'The engine did not return any diagnoses for this input. Review the case details — symptoms, history, medications — and resubmit, or start a new case.';

  if (abstained) {
    title = 'AI Professor abstained — no diagnosis met the confidence threshold';
    body =
      data.abstention_reason ||
      'The available evidence does not support naming a diagnosis. Declining to guess is a deliberate safety outcome: add findings or investigations and resubmit.';
  } else if (workupFirst) {
    title = 'Work-up first — the case is not yet confirmable';
    body =
      data.workup_reason ||
      'The leading possibilities depend on findings that have not been obtained for this patient. The investigations below are the next step.';
  }

  return (
    <Card sx={{ mt: 3, p: 3 }}>
      <Alert
        severity={abstained || workupFirst ? 'info' : 'warning'}
        icon={workupFirst ? <Science /> : <WarningAmber />}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="body2">{body}</Typography>
        {abstained && data.top_confidence && (
          <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.5 }}>
            Top confidence reached: {data.top_confidence}
          </Typography>
        )}
        {showWorkupReason && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Work-up first
            </Typography>
            <Typography variant="body2">{workupReason}</Typography>
          </Box>
        )}
      </Alert>

      {recommendedWorkup.length > 0 && (
        <Box sx={{ mt: 2.5 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Recommended investigations
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.75}>
            {recommendedWorkup.map((test, idx) => (
              <Chip key={idx} label={test} size="small" color="info" variant="outlined" />
            ))}
          </Stack>
        </Box>
      )}

      {followUpQuestions.length > 0 && (
        <Box sx={{ mt: 2.5 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Information that would help
          </Typography>
          <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2.5 }}>
            {followUpQuestions.map((q, idx) => (
              <Typography key={idx} component="li" variant="body2">
                {q}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}

      <Stack direction="row" spacing={1.5} sx={{ mt: 3 }} flexWrap="wrap" useFlexGap>
        <Button variant="contained" startIcon={<NoteAlt />} onClick={onReviseCase}>
          Revise case
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<AddCircleOutline />}
          onClick={onNewCase}
        >
          New case
        </Button>
      </Stack>
    </Card>
  );
}
