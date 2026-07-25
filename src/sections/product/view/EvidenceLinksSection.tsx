import { useState } from 'react';

import { Box, Chip, Link, Stack, Tooltip, Collapse, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import { EvidenceLink } from './types';

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

  const verifiedCount = evidenceLinks.filter((l) => l.verified).length;

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
        {verifiedCount > 0 && (
          <Chip
            size="small"
            variant="outlined"
            color="success"
            label={`${verifiedCount} verified on PubMed`}
            sx={{ height: 20, fontSize: '0.65rem' }}
          />
        )}
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

                {/* A grounded citation resolves to a real PubMed record. Rendering
                    it as plain text threw away the whole point of the grounding
                    stage — the clinician could not check it. */}
                {link.verified && link.url ? (
                  <Link
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="subtitle2"
                    sx={{ fontSize: '0.85rem' }}
                  >
                    {link.title}
                  </Link>
                ) : (
                  <Typography variant="subtitle2" sx={{ fontSize: '0.85rem' }}>
                    {link.title}
                  </Typography>
                )}

                {link.verified ? (
                  <Tooltip
                    title={
                      link.pmid
                        ? `Verified against a real PubMed record (PMID ${link.pmid}).`
                        : 'Verified against a real PubMed record.'
                    }
                  >
                    <Chip
                      size="small"
                      variant="outlined"
                      color="success"
                      icon={<Iconify icon="mdi:check-decagram" width={16} />}
                      label={link.pmid ? `PMID ${link.pmid}` : 'Verified'}
                      sx={{ height: 20, fontSize: '0.65rem' }}
                    />
                  </Tooltip>
                ) : (
                  <Tooltip title="This citation was produced by the model and has not been matched to a PubMed record. Check it before relying on it.">
                    <Chip
                      size="small"
                      variant="outlined"
                      color="warning"
                      icon={<Iconify icon="mdi:help-circle-outline" width={16} />}
                      label="Unverified"
                      sx={{ height: 20, fontSize: '0.65rem' }}
                    />
                  </Tooltip>
                )}
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
