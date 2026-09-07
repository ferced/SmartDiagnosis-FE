import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';

import { RouterLink } from 'src/routes/components';

import { LANDING, Wordmark } from 'src/sections/landing/tokens';

// ----------------------------------------------------------------------

interface Props {
  children: React.ReactNode;
}

const NAV = [
  { label: 'Safety', href: '#gates' },
  { label: 'The engine', href: '#engine' },
  { label: 'Output', href: '#output' },
  { label: 'Europe', href: '#europe' },
];

/**
 * Chrome of the public landing (/ and /demo): a paper-coloured bar that turns
 * opaque once the visitor scrolls. The dashboard keeps its own layout.
 */
export default function LandingLayout({ children }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: LANDING.paper, color: LANDING.ink }}>
      <Box
        component="header"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          transition: 'background-color .3s ease, border-color .3s ease',
          bgcolor: scrolled ? 'rgba(245,242,236,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(14px)' : 'none',
          borderBottom: '1px solid',
          borderColor: scrolled ? LANDING.hairline : 'transparent',
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ height: 68 }}>
            <Box component={RouterLink} href="/" sx={{ textDecoration: 'none', color: 'inherit' }}>
              <Wordmark />
            </Box>

            <Stack
              direction="row"
              spacing={3.5}
              sx={{ display: { xs: 'none', md: 'flex' }, fontFamily: LANDING.sans }}
            >
              {NAV.map((item) => (
                <Box
                  key={item.href}
                  component="a"
                  href={item.href}
                  sx={{
                    fontSize: 14,
                    color: LANDING.ink2,
                    textDecoration: 'none',
                    '&:hover': { color: LANDING.ink },
                  }}
                >
                  {item.label}
                </Box>
              ))}
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                component={RouterLink}
                href="/demo"
                sx={{
                  display: { xs: 'none', sm: 'inline-flex' },
                  fontFamily: LANDING.sans,
                  fontWeight: 500,
                  color: LANDING.ink,
                  px: 1.5,
                  whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: 'rgba(20,24,28,0.05)' },
                }}
              >
                Walk through a case
              </Button>
              <Button
                component={RouterLink}
                href="/auth/jwt/login"
                variant="outlined"
                sx={{
                  fontFamily: LANDING.sans,
                  fontWeight: 500,
                  px: 2.25,
                  borderRadius: 999,
                  whiteSpace: 'nowrap',
                  color: LANDING.ink,
                  borderColor: LANDING.ink,
                  '&:hover': { bgcolor: LANDING.ink, color: LANDING.paper, borderColor: LANDING.ink },
                }}
              >
                Sign in
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {children}
    </Box>
  );
}
