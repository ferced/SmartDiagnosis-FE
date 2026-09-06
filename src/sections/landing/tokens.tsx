import Box from '@mui/material/Box';

/**
 * Design tokens of the public landing. Deliberately separate from the Minimal
 * dashboard theme: the landing is "clinical paper" (warm off-white, ink, one
 * teal for verified, one amber for provisional, one red for ruled-out), set in
 * an editorial serif for statements and IBM Plex for everything measurable.
 */
export const LANDING = {
  paper: '#F5F2EC',
  paper2: '#ECE7DD',
  ink: '#14181C',
  ink2: '#4B5157',
  ink3: '#7A8087',
  hairline: 'rgba(20,24,28,0.12)',
  verified: '#0F7B6C',
  provisional: '#B4690E',
  ruledOut: '#9B2C2C',
  serif: '"Newsreader", "Iowan Old Style", Georgia, serif',
  sans: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
  mono: '"IBM Plex Mono", ui-monospace, Menlo, monospace',
} as const;

/** Small mark + wordmark. The mark is a caliper: two arms that only meet on evidence. */
export function Wordmark({ light = false }: { light?: boolean }) {
  const color = light ? LANDING.paper : LANDING.ink;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.25 }}>
      <Box component="svg" viewBox="0 0 28 28" aria-hidden sx={{ width: 26, height: 26 }}>
        <circle cx="14" cy="14" r="12.5" fill="none" stroke={color} strokeWidth="1.5" />
        <path d="M8 18.5 L14 8 L20 18.5" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.4 14.6 H17.6" stroke={LANDING.verified} strokeWidth="1.8" strokeLinecap="round" />
      </Box>
      <Box
        component="span"
        sx={{
          fontFamily: LANDING.serif,
          fontSize: 21,
          letterSpacing: '-0.01em',
          color,
          lineHeight: 1,
        }}
      >
        SmartDiagnosis
      </Box>
    </Box>
  );
}
