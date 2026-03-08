import Box, { BoxProps } from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { useResponsive } from 'src/hooks/use-responsive';

import { useSettingsContext } from 'src/components/settings';

import { NAV, HEADER } from '../config-layout';

// ----------------------------------------------------------------------

const SPACING = 8;

export default function Main({ children, sx, ...other }: BoxProps) {
  const settings = useSettingsContext();

  const lgUp = useResponsive('up', 'lg');

  const isNavHorizontal = settings.themeLayout === 'horizontal';

  const isNavMini = settings.themeLayout === 'mini';

  if (isNavHorizontal) {
    return (
      <Box
        component="main"
        sx={{
          minHeight: 1,
          display: 'flex',
          flexDirection: 'column',
          pt: `${HEADER.H_MOBILE + 24}px`,
          pb: 10,
          ...(lgUp && {
            pt: `${HEADER.H_MOBILE * 2 + 40}px`,
            pb: 15,
          }),
        }}
      >
        {children}
      </Box>
    );
  }

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        minHeight: 1,
        display: 'flex',
        flexDirection: 'column',
        py: `${HEADER.H_MOBILE + SPACING}px`,
        ...(lgUp && {
          px: 2,
          py: `${HEADER.H_DESKTOP + SPACING}px`,
          width: `calc(100% - ${NAV.W_VERTICAL}px)`,
          ...(isNavMini && {
            width: `calc(100% - ${NAV.W_MINI}px)`,
          }),
        }),
        ...sx,
      }}
      {...other}
    >
      {children}

      <Box
        component="a"
        href="https://ferced.com"
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          py: 2,
          mt: 'auto',
          textDecoration: 'none',
          opacity: 0.35,
          transition: 'opacity 0.3s',
          '&:hover': { opacity: 0.7 },
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: 0.5 }}>
          Powered by
        </Typography>
        <Box component="img" src="/ferced-logo.png" alt="Ferced" sx={{ height: 18, width: 18 }} />
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: -0.3 }}>
          ferced
        </Typography>
      </Box>
    </Box>
  );
}
