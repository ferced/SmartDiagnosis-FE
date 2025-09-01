import * as Yup from 'yup';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFSelect,
  RHFTextField,
} from 'src/components/hook-form';

import { IUserItem } from './types';
import { HOST_API } from 'src/config-global';

// ----------------------------------------------------------------------

type Props = {
  currentUser?: IUserItem;
};

export default function UserNewEditForm({ currentUser }: Props) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const NewUserSchema = Yup.object().shape({
    username: Yup.string().required('Username is required'),
    email: Yup.string().required('Email is required').email('Email must be a valid email address'),
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    displayName: Yup.string(),
    phoneNumber: Yup.string(),
    country: Yup.string(),
    state: Yup.string(),
    city: Yup.string(),
    address: Yup.string(),
    role: Yup.string().required('Role is required'),
    password: currentUser ? Yup.string() : Yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
  });

  const defaultValues = useMemo(
    () => ({
      username: currentUser?.username || '',
      email: currentUser?.email || '',
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      displayName: currentUser?.displayName || '',
      phoneNumber: currentUser?.phoneNumber || '',
      country: currentUser?.country || '',
      state: currentUser?.state || '',
      city: currentUser?.city || '',
      address: currentUser?.address || '',
      role: currentUser?.role || 'user',
      password: '',
    }),
    [currentUser]
  );

  const methods = useForm({
    resolver: yupResolver(NewUserSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Get token from different possible locations
      const token = localStorage.getItem('accessToken') ||
        localStorage.getItem('token') ||
        sessionStorage.getItem('accessToken');

      if (!token) {
        enqueueSnackbar('No authentication token found. Please login again.', { variant: 'error' });
        router.push(paths.auth.jwt.login);
        return;
      }

      const url = currentUser
        ? `${HOST_API}/user/${currentUser.username}`
        : `${HOST_API}/user`;

      const method = currentUser ? 'PUT' : 'POST';

      const payload = { ...data };
      if (currentUser && !payload.password) {
        delete payload.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        reset();
        enqueueSnackbar(currentUser ? 'Update success!' : 'Create success!');
        router.push(paths.dashboard.user.list);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save user');
      }
    } catch (error) {
      console.error(error);
      enqueueSnackbar(error.message || 'An error occurred', { variant: 'error' });
    }
  });

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              <RHFTextField name="username" label="Username" disabled={!!currentUser} />
              <RHFTextField name="email" label="Email Address" />
              <RHFTextField name="firstName" label="First Name" />
              <RHFTextField name="lastName" label="Last Name" />
              <RHFTextField name="displayName" label="Display Name" />
              <RHFTextField name="phoneNumber" label="Phone Number" />

              {!currentUser && (
                <RHFTextField
                  name="password"
                  label="Password"
                  type="password"
                />
              )}

              {currentUser && (
                <RHFTextField
                  name="password"
                  label="New Password (leave blank to keep current)"
                  type="password"
                />
              )}

              <RHFSelect name="role" label="Role">
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="medic">Medic</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </RHFSelect>
            </Box>

            <Stack spacing={3} sx={{ mt: 3 }}>
              <Typography variant="subtitle1">Address Information</Typography>

              <Box
                rowGap={3}
                columnGap={2}
                display="grid"
                gridTemplateColumns={{
                  xs: 'repeat(1, 1fr)',
                  sm: 'repeat(2, 1fr)',
                }}
              >
                <RHFTextField name="country" label="Country" />
                <RHFTextField name="state" label="State/Region" />
                <RHFTextField name="city" label="City" />
                <RHFTextField name="address" label="Address" />
              </Box>
            </Stack>

            <Stack alignItems="flex-end" sx={{ mt: 3 }}>
              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                {!currentUser ? 'Create User' : 'Save Changes'}
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </FormProvider>
  );
}