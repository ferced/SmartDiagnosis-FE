import React from 'react';

import {
  Box,
  Chip,
  Button,
  Dialog,
  TextField,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  LinearProgress,
  CircularProgress,
} from '@mui/material';


interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  followUpQuestions: string[];
  followUpAnswers: string[];
  setFollowUpAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  handleSubmit: () => void;
  isLoading: boolean;
}

const FollowUpModal: React.FC<FollowUpModalProps> = ({
  isOpen,
  onClose,
  followUpQuestions,
  followUpAnswers,
  setFollowUpAnswers,
  handleSubmit,
  isLoading,
}) => {
  const answeredCount = followUpAnswers.filter((a) => a && a.trim().length > 0).length;
  const totalCount = followUpQuestions?.length || 0;
  const progress = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="follow-up-modal-title"
    >
      <DialogTitle id="follow-up-modal-title" sx={{ pb: 1 }}>
        <Typography variant="h5" align="center" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
          Follow Up Questions
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {answeredCount} / {totalCount} answered
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ borderRadius: 1, height: 6 }}
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {followUpQuestions?.map((question, index) => (
          <Box key={index} mb={3}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
              <Chip
                label={index + 1}
                size="small"
                color="primary"
                sx={{ minWidth: 28, fontWeight: 'bold' }}
              />
              <Typography
                variant="subtitle1"
                sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, fontWeight: 500 }}
              >
                {question}
              </Typography>
            </Box>
            <TextField
              fullWidth
              variant="outlined"
              value={followUpAnswers[index] || ''}
              onChange={(e) => {
                const newAnswers = [...followUpAnswers];
                newAnswers[index] = e.target.value;
                setFollowUpAnswers(newAnswers);
              }}
              placeholder="Type your answer..."
              sx={{
                ml: 4.5,
                width: 'calc(100% - 36px)',
                input: { fontSize: { xs: '0.9rem', sm: '1rem' } },
              }}
            />
          </Box>
        ))}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            fontSize: { xs: '0.8rem', sm: '1rem' },
            padding: { xs: '6px 12px', sm: '8px 16px' },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading}
          color="primary"
          sx={{
            fontSize: { xs: '0.8rem', sm: '1rem' },
            padding: { xs: '6px 12px', sm: '8px 16px' },
          }}
        >
          {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FollowUpModal;
