// ClinicalStudiesModal.tsx
import axios from 'axios';
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

import { Box, Modal, Button, Typography, CircularProgress } from '@mui/material';

interface ClinicalStudiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  uploadEndpoint: string; // Endpoint de nuestro back (e.g., "/upload-pdf")
}

export default function ClinicalStudiesModal({
  isOpen,
  onClose,
  uploadEndpoint,
}: ClinicalStudiesModalProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setIsUploading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axios.post(uploadEndpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log('Respuesta del back:', response.data);
        alert('Archivo subido con éxito.');
        onClose();
      } catch (err: any) {
        console.error('Error subiendo archivo:', err);
        setError(err.message);
      } finally {
        setIsUploading(false);
      }
    },
    [uploadEndpoint, onClose]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  });

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Box
        sx={{
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          mx: 'auto',
          mt: '10vh',
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Upload Clinical Studies (PDF)
        </Typography>
        {isUploading ? (
          <Box display="flex" alignItems="center" justifyContent="center" sx={{ height: 100 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'text.disabled',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <Typography>Drop the PDF here ...</Typography>
            ) : (
              <Typography>Drag and drop a PDF here, or click to select one</Typography>
            )}
          </Box>
        )}
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
        <Box display="flex" justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button onClick={onClose} variant="outlined" color="inherit" disabled={isUploading}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
