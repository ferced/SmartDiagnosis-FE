import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import { alpha } from '@mui/material/styles';

import { RouterLink } from 'src/routes/components';

const PRIMARY = '#1B4965';

interface Props {
  children: React.ReactNode;
}

export default function LandingLayout({ children }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Box
        component="header"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          transition: 'all 0.3s ease',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          bgcolor: scrolled ? alpha('#fff', 0.92) : 'transparent',
          boxShadow: scrolled ? `0 1px 12px ${alpha('#000', 0.06)}` : 'none',
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ height: 72 }}
          >
            <Stack
              component={RouterLink}
              href="/"
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{ textDecoration: 'none' }}
            >
              <Box
                component="img"
                src="/logo/logo_single.png"
                alt="SmartDiagnosis"
                sx={{
                  width: 40,
                  height: 40,
                  objectFit: 'contain',
                  filter: scrolled ? 'none' : 'brightness(0) invert(1)',
                  transition: 'filter 0.3s',
                }}
              />
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                component={RouterLink}
                href="/demo"
                sx={{
                  fontWeight: 600,
                  color: scrolled ? 'text.secondary' : alpha('#fff', 0.85),
                  transition: 'color 0.3s',
                  '&:hover': { color: scrolled ? PRIMARY : '#fff', bgcolor: 'transparent' },
                }}
              >
                Demo
              </Button>
              <Button
                component={RouterLink}
                href="/auth/jwt/login"
                variant="contained"
                sx={{
                  fontWeight: 700,
                  px: 3,
                  borderRadius: '10px',
                  bgcolor: scrolled ? PRIMARY : alpha('#fff', 0.15),
                  color: '#fff',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.3s',
                  '&:hover': {
                    bgcolor: scrolled ? alpha(PRIMARY, 0.9) : alpha('#fff', 0.25),
                  },
                }}
              >
                Sign In
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {children}
    </Box>
  );
}
