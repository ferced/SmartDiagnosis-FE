import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { paths } from 'src/routes/paths';
import { HOST_API } from 'src/config-global';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { useSnackbar } from 'src/components/snackbar';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { useTable, TableNoData, TableHeadCustom } from 'src/components/table';

import UserStatisticsRow from '../user-statistics-row';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'user', label: 'User' },
  { id: 'role', label: 'Role', width: 100 },
  { id: 'usage', label: 'Usage Today', width: 200 },
  { id: 'last7days', label: 'Last 7 Days', width: 120 },
  { id: 'last30days', label: 'Last 30 Days', width: 120 },
  { id: 'lastRequest', label: 'Last Request', width: 150 },
  { id: 'actions', label: 'Actions', width: 100 },
];

interface UserStatistics {
  userId: number;
  username: string;
  email: string;
  role: string;
  dailyLimit: number;
  requestsToday: number;
  requestsLast7Days: number;
  requestsLast30Days: number;
  lastRequestAt: string | null;
}

// ----------------------------------------------------------------------

export default function UserStatisticsView() {
  const { enqueueSnackbar } = useSnackbar();
  const table = useTable();

  const [statistics, setStatistics] = useState<UserStatistics[]>([]);
  const [loading, setLoading] = useState(false);
  const [editLimitDialog, setEditLimitDialog] = useState<{
    open: boolean;
    user: UserStatistics | null;
  }>({ open: false, user: null });
  const [newLimit, setNewLimit] = useState('');

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('accessToken');
      const response = await fetch(`${HOST_API}/users/statistics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data || []);
      } else if (response.status === 403) {
        enqueueSnackbar('You do not have permission to view statistics', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      enqueueSnackbar('Error loading statistics', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const handleEditLimit = (user: UserStatistics) => {
    setEditLimitDialog({ open: true, user });
    setNewLimit(user.dailyLimit.toString());
  };

  const handleSaveLimit = async () => {
    if (!editLimitDialog.user) return;

    try {
      const token = sessionStorage.getItem('accessToken');
      const response = await fetch(
        `${HOST_API}/users/${editLimitDialog.user.userId}/limit`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            dailyLimit: parseInt(newLimit, 10),
            monthlyLimit: parseInt(newLimit, 10) * 30,
            customLimit: true,
          }),
        }
      );

      if (response.ok) {
        enqueueSnackbar('Limit updated successfully');
        setEditLimitDialog({ open: false, user: null });
        fetchStatistics();
      } else {
        throw new Error('Failed to update limit');
      }
    } catch (error) {
      console.error('Error updating limit:', error);
      enqueueSnackbar('Error updating limit', { variant: 'error' });
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage < 50) return 'success';
    if (percentage < 80) return 'warning';
    return 'error';
  };

  // Calculate summary statistics
  const totalRequestsToday = statistics.reduce((sum, stat) => sum + stat.requestsToday, 0);
  const totalRequestsWeek = statistics.reduce((sum, stat) => sum + stat.requestsLast7Days, 0);
  const activeUsers = statistics.filter(stat => stat.requestsToday > 0).length;

  const notFound = !loading && !statistics.length;

  return (
    <Container maxWidth="xl">
      <CustomBreadcrumbs
        heading="User Statistics"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'User Management', href: paths.dashboard.user.list },
          { name: 'Statistics' },
        ]}
        action={
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:refresh-fill" />}
            onClick={fetchStatistics}
          >
            Refresh
          </Button>
        }
        sx={{ mb: 3 }}
      />

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Total Requests Today
              </Typography>
              <Typography variant="h3">{totalRequestsToday}</Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Active Users Today
              </Typography>
              <Typography variant="h3">{activeUsers}</Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Total Requests (7 days)
              </Typography>
              <Typography variant="h3">{totalRequestsWeek}</Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Card>
        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <Scrollbar>
            <Table sx={{ minWidth: 960 }}>
              <TableHeadCustom
                headLabel={TABLE_HEAD}
                rowCount={statistics.length}
              />
              <TableBody>
                {statistics
                  .slice(
                    table.page * table.rowsPerPage,
                    table.page * table.rowsPerPage + table.rowsPerPage
                  )
                  .map((stat) => (
                    <UserStatisticsRow
                      key={stat.userId}
                      statistics={stat}
                      onEditLimit={handleEditLimit}
                      getUsagePercentage={getUsagePercentage}
                      getUsageColor={getUsageColor}
                    />
                  ))}
                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        <TablePagination
          page={table.page}
          component="div"
          count={statistics.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          rowsPerPageOptions={[10, 25, 50]}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>

      {/* Edit Limit Dialog */}
      <Dialog open={editLimitDialog.open} onClose={() => setEditLimitDialog({ open: false, user: null })}>
        <DialogTitle>
          Edit Daily Limit for {editLimitDialog.user?.username}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Daily Request Limit"
            type="number"
            fullWidth
            variant="outlined"
            value={newLimit}
            onChange={(e) => setNewLimit(e.target.value)}
            helperText="Set to -1 for unlimited requests"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditLimitDialog({ open: false, user: null })}>
            Cancel
          </Button>
          <Button onClick={handleSaveLimit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}