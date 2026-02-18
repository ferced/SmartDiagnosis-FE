import React, { useState } from 'react';

import { useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  Chip,
  Fade,
  Stack,
  Divider,
  Collapse,
  IconButton,
  Typography,
  CardContent,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';

interface ArchivedDiagnosis {
  diagnosis: string;
  treatment: string;
  probability: string;
  timestamp: string;
  reason?: string;
}

interface PreviousWorkingDiagnosesProps {
  archivedDiagnoses: ArchivedDiagnosis[];
}

const PreviousWorkingDiagnoses: React.FC<PreviousWorkingDiagnosesProps> = ({
  archivedDiagnoses,
}) => {
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();

  if (!archivedDiagnoses || archivedDiagnoses.length === 0) {
    return null;
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(parseInt(timestamp, 10) * 1000);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  return (
    <Fade in timeout={500}>
      <Card
        sx={{
          mt: 3,
          backgroundColor: theme.palette.background.neutral,
          border: '1px solid',
          borderColor: theme.palette.divider,
          boxShadow: theme.customShadows?.card || '0px 2px 8px rgba(0, 0, 0, 0.08)',
        }}
      >
        <CardContent sx={{ pb: expanded ? 2 : 1 }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{ cursor: 'pointer' }}
            onClick={() => setExpanded(!expanded)}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <HistoryIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
              <Typography variant="h6" color="text.secondary">
                Previous Working Diagnoses
              </Typography>
              <Chip
                label={archivedDiagnoses.length}
                size="small"
                color="default"
                variant="outlined"
              />
            </Box>
            <IconButton
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: theme.transitions.create('transform', {
                  duration: theme.transitions.duration.shortest,
                }),
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>

          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                These diagnoses were considered but are now archived based on additional information or test results.
              </Typography>

              <Stack spacing={2}>
                {archivedDiagnoses.map((diagnosis, index) => (
                  <Fade
                    key={index}
                    in={expanded}
                    timeout={300 + index * 100}
                    style={{ transitionDelay: expanded ? `${index * 100}ms` : '0ms' }}
                  >
                    <Card
                      variant="outlined"
                      sx={{
                        backgroundColor: 'background.paper',
                        opacity: 0.8,
                        transition: 'opacity 0.3s ease-in-out',
                        '&:hover': {
                          opacity: 1,
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Stack spacing={1.5}>
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Typography variant="subtitle1" fontWeight="medium">
                              {diagnosis.diagnosis}
                            </Typography>
                            <Chip
                              icon={<TrendingDownIcon />}
                              label="Archived"
                              size="small"
                              color="default"
                              variant="outlined"
                            />
                          </Box>

                          <Box display="flex" alignItems="center" gap={2}>
                            <Chip
                              label={`Probability: ${diagnosis.probability}`}
                              size="small"
                              color="default"
                              variant="filled"
                              sx={{ backgroundColor: theme.palette.grey[200] }}
                            />
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {formatTimestamp(diagnosis.timestamp)}
                              </Typography>
                            </Box>
                          </Box>

                          {diagnosis.reason && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              Archived: {diagnosis.reason}
                            </Typography>
                          )}

                          <Divider />

                          <Typography variant="body2" color="text.secondary" sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            <strong>Treatment:</strong> {diagnosis.treatment}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Fade>
                ))}
              </Stack>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </Fade>
  );
};

export default PreviousWorkingDiagnoses;
