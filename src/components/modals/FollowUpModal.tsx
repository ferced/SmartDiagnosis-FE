import React, { useState } from 'react';

import {
  Box,
  Modal,
  Button,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  followUpQuestions: string[];
  followUpAnswers: string[];
  setFollowUpAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  handleSubmit: (additionalInfo: string) => void; // 🔹 Modificado para recibir `additionalInfo`
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
  const [additionalInfo, setAdditionalInfo] = useState(''); // 🔹 Nuevo estado para información adicional

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="follow-up-modal-title"
      aria-describedby="follow-up-modal-description"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90vw',
          maxWidth: '600px',
          maxHeight: '80vh',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          overflowY: 'auto',
        }}
      >
        <Typography
          id="follow-up-modal-title"
          variant="h5"
          align="center"
          gutterBottom
          sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}
        >
          Follow Up Questions
        </Typography>

        {followUpQuestions.map((question, index) => (
          <Box key={index} mb={3}>
            <Typography
              variant="h6"
              sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
            >
              {question}
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              value={followUpAnswers[index] || ''}
              onChange={(e) => {
                const newAnswers = [...followUpAnswers];
                newAnswers[index] = e.target.value;
                setFollowUpAnswers(newAnswers);
              }}
              sx={{ mt: 1, input: { fontSize: { xs: '0.9rem', sm: '1rem' } } }}
            />
          </Box>
        ))}

        {/* 🔹 Campo adicional para ingresar más información */}
        <Box mt={3}>
          <Typography variant="h6">Additional Information</Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            placeholder="Enter any extra details here..."
            sx={{ mt: 1 }}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
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
            onClick={() => handleSubmit(additionalInfo)} // 🔹 Ahora pasa `additionalInfo`
            disabled={isLoading}
            color="primary"
            sx={{
              fontSize: { xs: '0.8rem', sm: '1rem' },
              padding: { xs: '6px 12px', sm: '8px 16px' },
            }}
          >
            {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Submit'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default FollowUpModal;
