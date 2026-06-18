import { Box, Chip, Stack, Typography, Collapse } from '@mui/material';
import { useState } from 'react';
import Iconify from 'src/components/iconify';

interface EvidenceLink {
  title: string;
  source: string;
  description: string;
}

interface Props {
  evidenceLinks: EvidenceLink[];
}

const SOURCE_COLORS: Record<string, string> = {
  PubMed: '#326599',
  UpToDate: '#D35400',
  WHO: '#2980B9',
  CDC: '#1A5276',
  NICE: '#7D3C98',
  Cochrane: '#E74C3C',
  Other: '#7F8C8D',
};

export default function EvidenceLinksSection({ evidenceLinks }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!evidenceLinks || evidenceLinks.length === 0) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        onClick={() => setExpanded(!expanded)}
        sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
      >
        <Iconify icon="mdi:book-open-variant" width={20} color="primary.main" />
        <Typography variant="subtitle2" color="primary.main">
          Clinical References ({evidenceLinks.length})
        </Typography>
        <Iconify
          icon={expanded ? 'mdi:chevron-up' : 'mdi:chevron-down'}
          width={20}
          color="primary.main"
        />
      </Stack>

      <Collapse in={expanded}>
        <Stack spacing={1.5} sx={{ mt: 1.5 }}>
          {evidenceLinks.map((link, index) => (
            <Box
              key={index}
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'background.neutral',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                <Chip
                  label={link.source}
                  size="small"
                  sx={{
                    bgcolor: SOURCE_COLORS[link.source] || SOURCE_COLORS.Other,
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 22,
                  }}
                />
                <Typography variant="subtitle2" sx={{ fontSize: '0.85rem' }}>
                  {link.title}
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {link.description}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Collapse>
    </Box>
  );
}
