import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { paths } from 'src/routes/paths';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { useSnackbar } from 'src/components/snackbar';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { TableNoData, TableHeadCustom } from 'src/components/table';
import { HOST_API } from 'src/config-global';

import ActivityLogRow from '../activity-log-row';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'timestamp', label: 'Timestamp', width: 180 },
  { id: 'user', label: 'User', width: 150 },
  { id: 'action', label: 'Action', width: 150 },
  { id: 'endpoint', label: 'Endpoint', width: 200 },
  { id: 'status', label: 'Status', width: 100 },
  { id: 'duration', label: 'Duration', width: 100 },
  { id: 'ip', label: 'IP Address', width: 120 },
];

interface ActivityLog {
  id: number;
  userId: number;
  username: string;
  action: string;
  method: string;
  endpoint: string;
  ipAddress: string;
  responseStatus: number;
  durationMs: number;
  errorMessage?: string;
  createdAt: string;
}

// ----------------------------------------------------------------------

export default function ActivityLogsView() {
  const { enqueueSnackbar } = useSnackbar();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterUsername, setFilterUsername] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterEndpoint, setFilterEndpoint] = useState('');
  const [filterDateRange, setFilterDateRange] = useState(7); // Last 7 days by default

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('accessToken');
      const params = new URLSearchParams({
        limit: rowsPerPage.toString(),
        offset: (page * rowsPerPage).toString(),
      });

      if (filterUsername) params.append('username', filterUsername);
      if (filterAction !== 'all') params.append('action', filterAction);
      if (filterEndpoint) params.append('endpoint', filterEndpoint);

      // Add date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - filterDateRange);
      params.append('start_date', startDate.toISOString());
      params.append('end_date', endDate.toISOString());

      const response = await fetch(`${HOST_API}/activity-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data || []);
        // Assuming the API returns total count in headers or response
        setTotalCount(data.length); // Update this based on actual API response
      } else if (response.status === 403) {
        enqueueSnackbar('You do not have permission to view activity logs', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      enqueueSnackbar('Error loading activity logs', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filterUsername, filterAction, filterEndpoint, filterDateRange, enqueueSnackbar]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRefresh = () => {
    fetchLogs();
  };

  const getStatusColor = (status: number) => {
    if (status < 300) return 'success';
    if (status < 400) return 'info';
    if (status < 500) return 'warning';
    return 'error';
  };

  const notFound = !loading && !logs.length;

  return (
    <Container maxWidth="xl">
      <CustomBreadcrumbs
        heading="Activity Logs"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'User Management', href: paths.dashboard.user.list },
          { name: 'Activity Logs' },
        ]}
        sx={{ mb: 3 }}
      />

      <Card>
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ p: 2.5, pb: 0 }}
        >
          <TextField
            size="small"
            label="Username"
            value={filterUsername}
            onChange={(e) => setFilterUsername(e.target.value)}
            sx={{ minWidth: 150 }}
          />

          <TextField
            select
            size="small"
            label="Action"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">All Actions</MenuItem>
            <MenuItem value="USER_LOGIN">Login</MenuItem>
            <MenuItem value="CREATE_USER">Create User</MenuItem>
            <MenuItem value="UPDATE_USER">Update User</MenuItem>
            <MenuItem value="DELETE_USER">Delete User</MenuItem>
            <MenuItem value="SUBMIT_DIAGNOSIS">Submit Diagnosis</MenuItem>
          </TextField>

          <TextField
            size="small"
            label="Endpoint"
            value={filterEndpoint}
            onChange={(e) => setFilterEndpoint(e.target.value)}
            sx={{ minWidth: 150 }}
          />

          <TextField
            select
            size="small"
            label="Date Range"
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(Number(e.target.value))}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value={1}>Last 24 hours</MenuItem>
            <MenuItem value={7}>Last 7 days</MenuItem>
            <MenuItem value={30}>Last 30 days</MenuItem>
          </TextField>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:refresh-fill" />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </Stack>

        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <Scrollbar>
            <Table sx={{ minWidth: 1200 }}>
              <TableHeadCustom headLabel={TABLE_HEAD} />
              <TableBody>
                {logs.map((log) => (
                  <ActivityLogRow
                    key={log.id}
                    log={log}
                    getStatusColor={getStatusColor}
                  />
                ))}
                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        <TablePagination
          page={page}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>
    </Container>
  );
}