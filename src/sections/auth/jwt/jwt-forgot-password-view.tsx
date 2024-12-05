import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

import { Stack, Typography, Alert, TextField, Button } from '@mui/material';

import { useAuthContext } from 'src/auth/hooks'; // Asegúrate de que existe este hook
import { useRouter } from 'src/routes/hooks'; // Para redirigir después de enviar

export default function JwtForgotPasswordView() {
  const { forgotPassword } = useAuthContext(); // Método que llamará al backend
  const router = useRouter();

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const ForgotPasswordSchema = Yup.object().shape({
    email: Yup.string().required('Email is required').email('Email must be a valid email address'),
  });

  const defaultValues = {
    email: '',
  };

  const methods = useForm({
    resolver: yupResolver(ForgotPasswordSchema),
    defaultValues,
  });

  const { handleSubmit, register, formState } = methods;

  const onSubmit = async (data: { email: string }) => {
    try {
      await forgotPassword?.(data.email); // Llama al método desde el contexto
      setSuccessMsg('If the email exists, a reset link has been sent.');
      setErrorMsg('');
    } catch (error) {
      console.error(error);
      setErrorMsg('Failed to send reset link. Please try again later.');
    }
  };

  return (
    <Stack spacing={3} sx={{ maxWidth: 400, mx: 'auto', mt: 5 }}>
      <Typography variant="h4" textAlign="center">
        Forgot Password
      </Typography>
      {successMsg && <Alert severity="success">{successMsg}</Alert>}
      {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <TextField
            label="Email Address"
            {...register('email')}
            error={!!formState.errors.email}
            helperText={formState.errors.email?.message}
            fullWidth
          />
          <Button type="submit" variant="contained" fullWidth>
            Send Reset Link
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}
