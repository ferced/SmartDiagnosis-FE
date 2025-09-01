import { memo } from 'react';

import Box, { BoxProps } from '@mui/material/Box';

// Placeholder illustration component
function PlaceholderIllustration({ ...other }: BoxProps) {
  return (
    <Box
      component="svg"
      width="100%"
      height="100%"
      fill="none"
      viewBox="0 0 480 360"
      xmlns="http://www.w3.org/2000/svg"
      {...other}
    >
      <rect width="480" height="360" fill="#F4F6F8" rx="8" />
      <circle cx="240" cy="180" r="60" fill="#DFE3E8" />
      <rect x="180" y="220" width="120" height="20" fill="#DFE3E8" rx="4" />
      <rect x="160" y="260" width="160" height="12" fill="#DFE3E8" rx="3" />
    </Box>
  );
}

export const MotivationIllustration = memo(PlaceholderIllustration);
export const ForbiddenIllustration = memo(PlaceholderIllustration); 
export const ServerErrorIllustration = memo(PlaceholderIllustration);
export const PageNotFoundIllustration = memo(PlaceholderIllustration);
export const UploadIllustration = memo(PlaceholderIllustration);
export const UpgradeStorageIllustration = memo(PlaceholderIllustration);