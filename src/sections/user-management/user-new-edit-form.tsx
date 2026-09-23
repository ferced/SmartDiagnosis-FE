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

import axios from 'src/utils/axios';
import { getErrorMessage } from 'src/utils/api-error';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, { RHFSelect, RHFTextField } from 'src/components/hook-form';

import { IUserItem } from './types';

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
    password: currentUser
      ? Yup.string()
      : Yup.string()
          .required('Password is required')
          .min(6, 'Password must be at least 6 characters'),
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

  // Goes through the shared API client, which already carries the session's
  // Bearer token (set at sign-in from sessionStorage) and ends the session on
  // a 401. This form used to look for the token in localStorage first, where
  // it never lives.
  const onSubmit = handleSubmit(async (data) => {
    const payload = { ...data };
    if (currentUser && !payload.password) {
      delete payload.password;
    }

    try {
      if (currentUser) {
        await axios.put(`/user/${currentUser.username}`, payload);
      } else {
        await axios.post('/user', payload);
      }

      reset();
      enqueueSnackbar(currentUser ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.user.list);
    } catch (error) {
      console.error(error);
      enqueueSnackbar(getErrorMessage(error, 'Failed to save user'), { variant: 'error' });
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

              {!currentUser && <RHFTextField name="password" label="Password" type="password" />}

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
