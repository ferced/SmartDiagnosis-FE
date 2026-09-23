import axios from 'axios';
import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { getErrorMessage } from 'src/utils/api-error';

import { HOST_API } from 'src/config-global';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

// Define types for conversation history
interface Conversation {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  title: string;
}

// Table headers configuration
const TABLE_HEAD = [
  { id: 'title', label: 'Conversation', align: 'left' },
  { id: 'created_at', label: 'Created At', align: 'left' },
  { id: 'updated_at', label: 'Last Updated', align: 'left' },
  { id: '' },
];

export default function HistoryView() {
  const settings = useSettingsContext();
  const router = useRouter();

  // Table state
  const [page, setPage] = useState(0);
  const [order] = useState<'asc' | 'desc'>('desc');
  const [orderBy] = useState('created_at');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);

  // Data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Deletion is irreversible, so both the per-row and the bulk action go
  // through a confirmation. `null` = closed, 'bulk' = selected rows.
  const [pendingDelete, setPendingDelete] = useState<number | 'bulk' | null>(null);

  const table = useTable({
    defaultOrderBy: 'created_at',
    defaultRowsPerPage: 10,
    defaultOrder: 'desc',
  });

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found in sessionStorage');
      }

      const response = await axios.get(`${HOST_API}/conversation/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Aseguramos que 'conversations' sea siempre un array
      setConversations(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(getErrorMessage(err, 'Error fetching conversations'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleViewRow = useCallback(
    (id: number) => {
      router.push(paths.dashboard.history.conversation(id));
    },
    [router]
  );

  const handleDeleteRow = useCallback(
    async (id: number) => {
      try {
        const token = sessionStorage.getItem('accessToken');
        if (!token) throw new Error('No access token found');

        await axios.delete(`${HOST_API}/conversation/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setConversations((prev) => prev.filter((row) => row.id !== id));
        setSelected([]);
      } catch (err) {
        console.error('Error deleting conversation:', err);
        setError('Failed to delete conversation');
      }
    },
    []
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('accessToken');
      if (!token) throw new Error('No access token found');

      // Delete multiple conversations
      await Promise.all(
        selected.map((id) =>
          axios.delete(`${HOST_API}/conversation/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        )
      );

      setConversations((prev) =>
        prev.filter((row) => !selected.includes(row.id.toString()))
      );
      setSelected([]);
    } catch (err) {
      console.error('Error deleting conversations:', err);
      setError('Failed to delete conversations');
    }
  }, [selected]);

  const handleConfirmDelete = () => {
    if (pendingDelete === 'bulk') {
      handleDeleteRows();
    } else if (pendingDelete !== null) {
      handleDeleteRow(pendingDelete);
    }
    setPendingDelete(null);
  };

  const generateTitle = (conversation: Conversation) => {
    if (conversation.title) return conversation.title;

    const date = new Date(conversation.created_at);
    return `Conversation ${conversation.id} - ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Conversation History"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Chat', href: paths.dashboard.chat },
          { name: 'History' },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <Card>
        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          {selected.length > 0 && (
            <TableSelectedAction
              dense={table.dense}
              numSelected={selected.length}
              rowCount={conversations.length}
              onSelectAllRows={(checked) =>
                setSelected(
                  checked
                    ? conversations.map((row) => row.id.toString())
                    : []
                )
              }
              action={
                <Stack direction="row" spacing={1.5}>
                  <Tooltip title="Delete selected">
                    <IconButton
                      color="primary"
                      aria-label={`Delete ${selected.length} selected conversation${
                        selected.length === 1 ? '' : 's'
                      }`}
                      onClick={() => setPendingDelete('bulk')}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              }
            />
          )}

          <Scrollbar>
            <Table
              size={table.dense ? 'small' : 'medium'}
              sx={{ minWidth: 800 }}
            >
              <TableHeadCustom
                order={order}
                orderBy={orderBy}
                headLabel={TABLE_HEAD}
                rowCount={conversations.length}
                numSelected={selected.length}
                onSort={table.onSort}
                onSelectAllRows={(checked) =>
                  setSelected(
                    checked
                      ? conversations.map((row) => row.id.toString())
                      : []
                  )
                }
              />

              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                )}

                {error && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Alert severity="error">{error}</Alert>
                    </TableCell>
                  </TableRow>
                )}

                {!loading &&
                  conversations
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => (
                      <TableRow
                        key={row.id}
                        hover
                        selected={selected.includes(row.id.toString())}
                        onClick={() => handleViewRow(row.id)}
                        sx={{ cursor: 'pointer' }}
                      >
                        {/* The row opens the case on click, so the checkbox
                            must stop the *click* from bubbling —
                            stopPropagation in onChange came too late and
                            ticking a box navigated away. */}
                        <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selected.includes(row.id.toString())}
                            inputProps={{ 'aria-label': `Select ${generateTitle(row)}` }}
                            onChange={(e) => {
                              const newSelected = e.target.checked
                                ? [...selected, row.id.toString()]
                                : selected.filter(
                                    (id) => id !== row.id.toString()
                                  );
                              setSelected(newSelected);
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <Typography variant="subtitle2">
                            {generateTitle(row)}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          {new Date(row.created_at).toLocaleString()}
                        </TableCell>

                        <TableCell>
                          {new Date(row.updated_at).toLocaleString()}
                        </TableCell>

                        <TableCell align="right">
                          <Tooltip title="Delete">
                            <IconButton
                              color="error"
                              aria-label={`Delete ${generateTitle(row)}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setPendingDelete(row.id);
                              }}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}

                <TableEmptyRows
                  height={table.dense ? 52 : 72}
                  emptyRows={emptyRows(page, rowsPerPage, conversations.length)}
                />

                <TableNoData notFound={!conversations.length && !loading} />
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        <TablePaginationCustom
          count={conversations.length}
          page={page}
          rowsPerPage={rowsPerPage}
          
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) =>
            setRowsPerPage(Number(event.target.value))
          }
        />
      </Card>

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title={pendingDelete === 'bulk' ? 'Delete conversations?' : 'Delete conversation?'}
        content={
          pendingDelete === 'bulk'
            ? `${selected.length} selected conversation${
                selected.length === 1 ? '' : 's'
              } and all their messages will be permanently deleted. This cannot be undone.`
            : 'This conversation and all its messages will be permanently deleted. This cannot be undone.'
        }
        action={
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Delete
          </Button>
        }
      />
    </Container>
  );
}
