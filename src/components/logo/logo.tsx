import { forwardRef } from 'react';

import Link from '@mui/material/Link';
import Box, { BoxProps } from '@mui/material/Box';

import { RouterLink } from 'src/routes/components';

// ----------------------------------------------------------------------

export interface LogoProps extends BoxProps {
  disabledLink?: boolean;
  /** Mark + "AI Professor" wordmark instead of the mark alone. */
  full?: boolean;
}

/**
 * AI Professor mark: an "A" inside a circle whose crossbar is the one colour
 * of the brand (the landing's "verified" teal). Same drawing as the public
 * landing's Wordmark and the favicon; strokes follow the text colour so it
 * works on light and dark themes.
 */
const VERIFIED = '#0F7B6C';

const Logo = forwardRef<HTMLDivElement, LogoProps>(
  ({ disabledLink = false, full = false, sx, ...other }, ref) => {
    const logo = (
      <Box
        ref={ref}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1.25,
          color: 'text.primary',
          cursor: disabledLink ? 'default' : 'pointer',
          ...(full ? {} : { width: 40, height: 40 }),
          ...sx,
        }}
        {...other}
      >
        <Box
          component="svg"
          viewBox="0 0 28 28"
          aria-label="AI Professor"
          role="img"
          sx={{ width: full ? 32 : '100%', height: full ? 32 : '100%', flexShrink: 0 }}
        >
          <circle cx="14" cy="14" r="12.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M8 18.5 L14 8 L20 18.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M10.4 14.6 H17.6" stroke={VERIFIED} strokeWidth="1.8" strokeLinecap="round" />
        </Box>
        {full && (
          <Box
            component="span"
            sx={{
              fontFamily: '"Newsreader", "Iowan Old Style", Georgia, serif',
              fontSize: 23,
              letterSpacing: '-0.01em',
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            AI Professor
          </Box>
        )}
      </Box>
    );

    if (disabledLink) {
      return logo;
    }

    return (
      <Link component={RouterLink} href="/" sx={{ display: 'contents', color: 'inherit' }}>
        {logo}
      </Link>
    );
  }
);

export default Logo;
