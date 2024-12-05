import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';
import Alert from '@mui/material/Alert';

// ----------------------------------------------------------------------

export default function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Validation schema
  const ForgotPasswordSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email address').required('Email is required'),
  });

  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(ForgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: { email: string }) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Reset state on success
      setEmailSent(true);
      setErrorMsg('');
    } catch (error) {
      console.error(error);
      setErrorMsg('Failed to send reset email. Please try again.');
    }
  };

  return (
    <Stack spacing={3} sx={{ maxWidth: 400, mx: 'auto', mt: 10 }}>
      <Typography variant="h4" textAlign="center">
        Forgot Password
      </Typography>

      {emailSent && <Alert severity="success">Password reset email sent successfully!</Alert>}

      {!!errorMsg && <Alert severity="error">{errorMsg}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <TextField
            label="Email address"
            type="email"
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
          />

          <LoadingButton
            fullWidth
            type="submit"
            variant="contained"
            loading={isSubmitting}
          >
            Send Reset Email
          </LoadingButton>
        </Stack>
      </form>
    </Stack>
  );
}
