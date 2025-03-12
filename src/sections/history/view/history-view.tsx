import axios from 'axios';
import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { HOST_API } from 'src/config-global';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
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
      setError(err.response?.data?.message || 'Error fetching conversations');
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
                  <Iconify
                    icon="solar:trash-bin-trash-bold"
                    onClick={handleDeleteRows}
                    sx={{ cursor: 'pointer' }}
                  />
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
                        <TableCell padding="checkbox">
                          <input
                            type="checkbox"
                            checked={selected.includes(row.id.toString())}
                            onChange={(e) => {
                              const newSelected = e.target.checked
                                ? [...selected, row.id.toString()]
                                : selected.filter(
                                    (id) => id !== row.id.toString()
                                  );
                              setSelected(newSelected);
                              e.stopPropagation();
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
                          <Iconify
                            icon="solar:trash-bin-trash-bold"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRow(row.id);
                            }}
                            sx={{ cursor: 'pointer' }}
                          />
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
    </Container>
  );
}
