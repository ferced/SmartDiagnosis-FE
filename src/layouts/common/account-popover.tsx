import { m } from 'framer-motion';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useAuthContext } from 'src/auth/hooks';

import Label from 'src/components/label';
import { varHover } from 'src/components/animate';
import { useSnackbar } from 'src/components/snackbar';
import CustomPopover, { usePopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

// Same labels as the role picker in user management.
const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  medic: 'Medic',
  user: 'User',
};

type AccountUser = {
  username?: string;
  email?: string;
  role?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
} | null;

// The signed-in account as /auth/me returns it. Display name first, then the
// first/last name pair, then the username; the email is the last resort.
function accountName(user: AccountUser) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  return user?.displayName?.trim() || fullName || user?.username?.trim() || user?.email || '';
}

function initialsOf(name: string) {
  const words = name
    .replace(/@.*/, '')
    .split(/[\s._-]+/)
    .filter(Boolean);
  const initials = words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('');
  return initials.toUpperCase() || '?';
}

// ----------------------------------------------------------------------

export default function AccountPopover() {
  const router = useRouter();

  const { user, logout } = useAuthContext();

  const { enqueueSnackbar } = useSnackbar();

  const popover = usePopover();

  const name = accountName(user);
  const email = user?.email || '';
  const role = user?.role ? ROLE_LABELS[user.role] || user.role : '';

  const handleLogout = async () => {
    try {
      await logout();
      popover.onClose();
      router.replace(paths.auth.jwt.login);
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Unable to logout!', { variant: 'error' });
    }
  };

  const handleHowItWorks = () => {
    popover.onClose();
    router.push(paths.dashboard.howItWorks);
  };

  return (
    <>
      <IconButton
        component={m.button}
        whileTap="tap"
        whileHover="hover"
        variants={varHover(1.05)}
        onClick={popover.onOpen}
        aria-label="Account"
        sx={{
          width: 40,
          height: 40,
          background: (theme) => alpha(theme.palette.grey[500], 0.08),
          ...(popover.open && {
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
          }),
        }}
      >
        <Avatar
          alt={name}
          sx={{
            width: 36,
            height: 36,
            fontSize: 14,
            fontWeight: 'fontWeightBold',
            color: 'primary.contrastText',
            bgcolor: 'primary.main',
            border: (theme) => `solid 2px ${theme.palette.background.default}`,
          }}
        >
          {initialsOf(name)}
        </Avatar>
      </IconButton>

      <CustomPopover open={popover.open} onClose={popover.onClose} sx={{ width: 240, p: 0 }}>
        <Box sx={{ p: 2, pb: 1.5 }}>
          <Typography variant="subtitle2" noWrap>
            {name}
          </Typography>

          {email && email !== name && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
              {email}
            </Typography>
          )}

          {role && (
            <Label color="info" variant="soft" sx={{ mt: 1 }}>
              {role}
            </Label>
          )}
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Stack sx={{ p: 1 }}>
          <MenuItem onClick={handleHowItWorks}>How it works</MenuItem>
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <MenuItem
          onClick={handleLogout}
          sx={{ m: 1, fontWeight: 'fontWeightBold', color: 'error.main' }}
        >
          Logout
        </MenuItem>
      </CustomPopover>
    </>
  );
}
