import Typography from '@mui/material/Typography';

import { LANDING as T } from './tokens';

/** Typographic pieces shared by the public landing and the guided demo. */
export function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <Typography
      component="p"
      sx={{
        fontFamily: T.mono,
        fontSize: 11.5,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: light ? 'rgba(245,242,236,0.6)' : T.ink3,
        mb: 2.5,
      }}
    >
      {children}
    </Typography>
  );
}

export function Statement({
  children,
  light = false,
  size = 'md',
}: {
  children: React.ReactNode;
  light?: boolean;
  size?: 'md' | 'lg';
}) {
  return (
    <Typography
      component="h2"
      sx={{
        fontFamily: T.serif,
        fontWeight: 400,
        letterSpacing: '-0.02em',
        lineHeight: 1.05,
        fontSize: size === 'lg' ? { xs: 40, sm: 52, md: 64 } : { xs: 34, sm: 42, md: 50 },
        color: light ? T.paper : T.ink,
        textWrap: 'balance',
      }}
    >
      {children}
    </Typography>
  );
}

export function Body({ children, light = false, sx = {} }: { children: React.ReactNode; light?: boolean; sx?: object }) {
  return (
    <Typography
      sx={{
        fontFamily: T.sans,
        fontSize: { xs: 16, md: 17 },
        lineHeight: 1.6,
        color: light ? 'rgba(245,242,236,0.72)' : T.ink2,
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
}
