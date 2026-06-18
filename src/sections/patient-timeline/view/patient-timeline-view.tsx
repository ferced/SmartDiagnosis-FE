import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';

import { HOST_API } from 'src/config-global';

import Iconify from 'src/components/iconify';

import type { PatientCase, PatientCaseEntry } from '../../product/view/types';

// ----------------------------------------------------------------------

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
};

interface PatientCaseWithEntries extends PatientCase {
  entries?: PatientCaseEntry[];
}

// ----------------------------------------------------------------------

export default function PatientTimelineView() {
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<PatientCaseWithEntries | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(false);

  // New case dialog
  const [openNewCase, setOpenNewCase] = useState(false);
  const [newCaseForm, setNewCaseForm] = useState({
    patient_name: '',
    age: '',
    gender: '',
    notes: '',
  });

  // Link diagnosis dialog
  const [openLinkDiagnosis, setOpenLinkDiagnosis] = useState(false);
  const [linkForm, setLinkForm] = useState({
    conversation_id: '',
    summary: '',
    diagnosis_names: '',
  });

  // Delete confirmation
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${HOST_API}/patient-cases`, {
        headers: getAuthHeaders(),
      });
      setCases(data || []);
    } catch (error) {
      console.error('Failed to load patient cases:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCaseDetail = useCallback(async (caseId: number) => {
    setLoadingEntries(true);
    try {
      const { data } = await axios.get(`${HOST_API}/patient-cases/${caseId}`, {
        headers: getAuthHeaders(),
      });
      setSelectedCase(data);
    } catch (error) {
      console.error('Failed to load case detail:', error);
    } finally {
      setLoadingEntries(false);
    }
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const handleSelectCase = (patientCase: PatientCase) => {
    setSelectedCase(patientCase);
    loadCaseDetail(patientCase.id);
  };

  const handleCreateCase = async () => {
    try {
      await axios.post(
        `${HOST_API}/patient-cases`,
        {
          patient_name: newCaseForm.patient_name,
          age: newCaseForm.age ? Number(newCaseForm.age) : undefined,
          gender: newCaseForm.gender || undefined,
          notes: newCaseForm.notes || undefined,
        },
        { headers: getAuthHeaders() }
      );
      setOpenNewCase(false);
      setNewCaseForm({ patient_name: '', age: '', gender: '', notes: '' });
      loadCases();
    } catch (error) {
      console.error('Failed to create case:', error);
    }
  };

  const handleLinkDiagnosis = async () => {
    if (!selectedCase) return;
    try {
      await axios.post(
        `${HOST_API}/patient-cases/${selectedCase.id}/entries`,
        {
          conversation_id: Number(linkForm.conversation_id),
          summary: linkForm.summary,
          diagnosis_names: linkForm.diagnosis_names || undefined,
        },
        { headers: getAuthHeaders() }
      );
      setOpenLinkDiagnosis(false);
      setLinkForm({ conversation_id: '', summary: '', diagnosis_names: '' });
      loadCaseDetail(selectedCase.id);
    } catch (error) {
      console.error('Failed to link diagnosis:', error);
    }
  };

  const handleDeleteCase = async () => {
    if (!selectedCase) return;
    try {
      await axios.delete(`${HOST_API}/patient-cases/${selectedCase.id}`, {
        headers: getAuthHeaders(),
      });
      setOpenDeleteConfirm(false);
      setSelectedCase(null);
      loadCases();
    } catch (error) {
      console.error('Failed to delete case:', error);
    }
  };

  const filteredCases = cases.filter((c) =>
    c.patient_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Container maxWidth="xl">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h4">Patient Timeline</Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mdi:plus" />}
          onClick={() => setOpenNewCase(true)}
        >
          New Case
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {/* Left panel - Case list */}
        <Grid xs={12} md={4}>
          <Card sx={{ height: '75vh', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="mdi:magnify" width={20} sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                  ...(searchQuery && {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearchQuery('')}>
                          <Iconify icon="mdi:close" width={16} />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }),
                }}
              />
            </Box>

            <Divider />

            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {loading && (
                <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                  <CircularProgress />
                </Stack>
              )}
              {!loading && filteredCases.length === 0 && (
                <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', p: 3 }}>
                  <Iconify
                    icon="mdi:account-search-outline"
                    width={48}
                    sx={{ color: 'text.disabled', mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {cases.length === 0 ? 'No patient cases yet' : 'No matching patients'}
                  </Typography>
                </Stack>
              )}
              {!loading && filteredCases.length > 0 && (
                <List disablePadding>
                  {filteredCases.map((c) => (
                    <ListItemButton
                      key={c.id}
                      selected={selectedCase?.id === c.id}
                      onClick={() => handleSelectCase(c)}
                      sx={{
                        py: 1.5,
                        px: 2,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Stack spacing={0.5} sx={{ width: '100%' }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="subtitle2" noWrap>
                            {c.patient_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(c.updated_at)}
                          </Typography>
                        </Stack>

                        <Stack direction="row" spacing={1} alignItems="center">
                          {c.age && (
                            <Chip
                              label={`${c.age} yrs`}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                          {c.gender && (
                            <Chip
                              label={c.gender}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Stack>
                      </Stack>
                    </ListItemButton>
                  ))}
                </List>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Right panel - Timeline */}
        <Grid xs={12} md={8}>
          <Card sx={{ height: '75vh', display: 'flex', flexDirection: 'column' }}>
            {!selectedCase ? (
              <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                <Iconify
                  icon="mdi:timeline-clock-outline"
                  width={64}
                  sx={{ color: 'text.disabled', mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary">
                  Select a patient case
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  Choose a case from the left to view its timeline
                </Typography>
              </Stack>
            ) : (
              <>
                {/* Case header */}
                <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Stack
                    direction="row"
                    alignItems="flex-start"
                    justifyContent="space-between"
                  >
                    <Box>
                      <Typography variant="h5">{selectedCase.patient_name}</Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                        {selectedCase.age && (
                          <Chip label={`Age: ${selectedCase.age}`} size="small" color="info" variant="outlined" />
                        )}
                        {selectedCase.gender && (
                          <Chip label={selectedCase.gender} size="small" color="info" variant="outlined" />
                        )}
                        {selectedCase.entries && (
                          <Chip
                            label={`${selectedCase.entries.length} ${selectedCase.entries.length === 1 ? 'entry' : 'entries'}`}
                            size="small"
                            color="primary"
                            variant="soft"
                          />
                        )}
                      </Stack>
                      {selectedCase.notes && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {selectedCase.notes}
                        </Typography>
                      )}
                    </Box>

                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Iconify icon="mdi:link-plus" />}
                        onClick={() => setOpenLinkDiagnosis(true)}
                      >
                        Link Diagnosis
                      </Button>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => setOpenDeleteConfirm(true)}
                      >
                        <Iconify icon="mdi:delete-outline" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Box>

                {/* Timeline entries */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                  {loadingEntries && (
                    <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                      <CircularProgress />
                    </Stack>
                  )}
                  {!loadingEntries && (!selectedCase.entries || selectedCase.entries.length === 0) && (
                    <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                      <Iconify
                        icon="mdi:clipboard-text-clock-outline"
                        width={48}
                        sx={{ color: 'text.disabled', mb: 1 }}
                      />
                      <Typography variant="body1" color="text.secondary">
                        No entries yet
                      </Typography>
                      <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
                        Link a diagnosis to start building this patient&apos;s timeline
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Iconify icon="mdi:link-plus" />}
                        onClick={() => setOpenLinkDiagnosis(true)}
                      >
                        Link Diagnosis
                      </Button>
                    </Stack>
                  )}
                  {!loadingEntries && selectedCase.entries && selectedCase.entries.length > 0 && (
                    <Timeline position="right" sx={{ px: 0 }}>
                      {selectedCase.entries.map((entry, index) => (
                        <TimelineItem key={entry.id}>
                          <TimelineOppositeContent
                            sx={{ maxWidth: 140, px: 1 }}
                            variant="caption"
                            color="text.secondary"
                          >
                            {formatDateTime(entry.created_at)}
                          </TimelineOppositeContent>

                          <TimelineSeparator>
                            <TimelineDot color={index === 0 ? 'primary' : 'grey'} />
                            {index < (selectedCase.entries?.length ?? 0) - 1 && <TimelineConnector />}
                          </TimelineSeparator>

                          <TimelineContent sx={{ pb: 3 }}>
                            <Card variant="outlined" sx={{ p: 2 }}>
                              {entry.diagnosis_names && (
                                <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mb: 1 }}>
                                  {entry.diagnosis_names.split(',').map((name) => (
                                    <Chip
                                      key={name.trim()}
                                      label={name.trim()}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                      sx={{ fontSize: '0.7rem' }}
                                    />
                                  ))}
                                </Stack>
                              )}
                              <Typography variant="body2">{entry.summary}</Typography>
                              <Typography
                                variant="caption"
                                color="text.disabled"
                                sx={{ mt: 1, display: 'block' }}
                              >
                                Conversation #{entry.conversation_id}
                              </Typography>
                            </Card>
                          </TimelineContent>
                        </TimelineItem>
                      ))}
                    </Timeline>
                  )}
                </Box>
              </>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* New Case Dialog */}
      <Dialog open={openNewCase} onClose={() => setOpenNewCase(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Patient Case</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Patient Name"
              fullWidth
              required
              value={newCaseForm.patient_name}
              onChange={(e) => setNewCaseForm({ ...newCaseForm, patient_name: e.target.value })}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Age"
                type="number"
                value={newCaseForm.age}
                onChange={(e) => setNewCaseForm({ ...newCaseForm, age: e.target.value })}
                sx={{ width: 120 }}
              />
              <TextField
                label="Gender"
                select
                value={newCaseForm.gender}
                onChange={(e) => setNewCaseForm({ ...newCaseForm, gender: e.target.value })}
                sx={{ width: 160 }}
              >
                <MenuItem value="">-</MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Stack>
            <TextField
              label="Notes"
              fullWidth
              multiline
              rows={3}
              value={newCaseForm.notes}
              onChange={(e) => setNewCaseForm({ ...newCaseForm, notes: e.target.value })}
              placeholder="Relevant background, conditions, allergies..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewCase(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateCase}
            disabled={!newCaseForm.patient_name.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Link Diagnosis Dialog */}
      <Dialog
        open={openLinkDiagnosis}
        onClose={() => setOpenLinkDiagnosis(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Link Diagnosis to Case</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Conversation ID"
              type="number"
              fullWidth
              required
              value={linkForm.conversation_id}
              onChange={(e) => setLinkForm({ ...linkForm, conversation_id: e.target.value })}
              helperText="Enter the conversation ID from a previous diagnosis"
            />
            <TextField
              label="Summary"
              fullWidth
              required
              multiline
              rows={3}
              value={linkForm.summary}
              onChange={(e) => setLinkForm({ ...linkForm, summary: e.target.value })}
              placeholder="Brief summary of the diagnosis and findings..."
            />
            <TextField
              label="Diagnosis Names"
              fullWidth
              value={linkForm.diagnosis_names}
              onChange={(e) => setLinkForm({ ...linkForm, diagnosis_names: e.target.value })}
              placeholder="e.g. Hypertension, Type 2 Diabetes"
              helperText="Comma-separated diagnosis names"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLinkDiagnosis(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleLinkDiagnosis}
            disabled={!linkForm.conversation_id || !linkForm.summary.trim()}
          >
            Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)}>
        <DialogTitle>Delete Patient Case</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1 }}>
            This will permanently delete the case for{' '}
            <strong>{selectedCase?.patient_name}</strong> and all its linked entries. This action
            cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteConfirm(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteCase}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
