import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { HOST_API } from 'src/config-global';

import { useBoolean } from 'src/hooks/use-boolean';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { useSnackbar } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import {
  useTable,
  TableNoData,
  TableHeadCustom,
  TableSelectedAction,
} from 'src/components/table';

import { IUserItem } from '../types';
import UserTableRow from '../user-table-row';
import UserTableToolbar from '../user-table-toolbar';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'username', label: 'Username' },
  { id: 'name', label: 'Name' },
  { id: 'email', label: 'Email' },
  { id: 'phoneNumber', label: 'Phone', width: 180 },
  { id: 'role', label: 'Role', width: 100 },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export default function UserListView() {
  const router = useRouter();
  const table = useTable();
  const { enqueueSnackbar } = useSnackbar();
  const confirm = useBoolean();

  const [tableData, setTableData] = useState<IUserItem[]>([]);
  const [filters, setFilters] = useState({ name: '', role: 'all' });

  const fetchUsers = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('accessToken');
      const response = await fetch(`${HOST_API}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const users = await response.json();
        setTableData(users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      enqueueSnackbar('Error loading users', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const dataFiltered = applyFilter({
    inputData: tableData,
    filters,
  });

  // const denseHeight = table.dense ? 56 : 76;
  const canReset = !!filters.name || filters.role !== 'all';
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleFilters = useCallback(
    (name: string, value: string) => {
      table.onResetPage();
      setFilters((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    },
    [table]
  );

  const handleResetFilters = useCallback(() => {
    setFilters({
      name: '',
      role: 'all',
    });
  }, []);

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        const token = sessionStorage.getItem('accessToken');
        const response = await fetch(`${HOST_API}/user/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const deleteRow = tableData.filter((row) => row.username !== id);
          setTableData(deleteRow);
          table.onUpdatePageDeleteRow(dataFiltered.length);
          enqueueSnackbar('User deleted successfully');
        } else {
          throw new Error('Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        enqueueSnackbar('Error deleting user', { variant: 'error' });
      }
    },
    [dataFiltered.length, enqueueSnackbar, table, tableData]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('accessToken');

      await Promise.all(
        table.selected.map((id) =>
          fetch(`${HOST_API}/user/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
        )
      );

      const deleteRows = tableData.filter(
        (row) => !table.selected.includes(row.username)
      );

      setTableData(deleteRows);
      table.onUpdatePageDeleteRows({
        totalRowsInPage: dataFiltered.length,
        totalRowsFiltered: dataFiltered.length,
      });
      enqueueSnackbar('Users deleted successfully');
    } catch (error) {
      console.error('Error deleting users:', error);
      enqueueSnackbar('Error deleting users', { variant: 'error' });
    }
  }, [dataFiltered.length, enqueueSnackbar, table, tableData]);

  const handleEditRow = useCallback(
    (id: string) => {
      router.push(paths.dashboard.user.edit(id));
    },
    [router]
  );

  return (
    <Container maxWidth="lg">
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 5 }}
      >
        <Typography variant="h4">User Management</Typography>

        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => router.push(paths.dashboard.user.new)}
        >
          New User
        </Button>
      </Stack>

      <Card>
        <UserTableToolbar
          filters={filters}
          onFilters={handleFilters}
          roleOptions={['all', 'admin', 'manager', 'medic', 'user']}
        />

        {canReset && (
          <Stack
            spacing={1.5}
            direction="row"
            sx={{ px: 3, py: 1.5 }}
          >
            <Button
              color="error"
              onClick={handleResetFilters}
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
            >
              Clear
            </Button>
          </Stack>
        )}

        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <TableSelectedAction
            dense={table.dense}
            numSelected={table.selected.length}
            rowCount={dataFiltered.length}
            onSelectAllRows={(checked) =>
              table.onSelectAllRows(
                checked,
                dataFiltered.map((row) => row.username)
              )
            }
            action={
              <IconButton color="primary" onClick={confirm.onTrue}>
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            }
          />

          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headLabel={TABLE_HEAD}
                rowCount={dataFiltered.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
                onSelectAllRows={(checked) =>
                  table.onSelectAllRows(
                    checked,
                    dataFiltered.map((row) => row.username)
                  )
                }
              />

              <TableBody>
                {dataFiltered
                  .slice(
                    table.page * table.rowsPerPage,
                    table.page * table.rowsPerPage + table.rowsPerPage
                  )
                  .map((row) => (
                    <UserTableRow
                      key={row.username}
                      row={row}
                      selected={table.selected.includes(row.username)}
                      onSelectRow={() => table.onSelectRow(row.username)}
                      onDeleteRow={() => handleDeleteRow(row.username)}
                      onEditRow={() => handleEditRow(row.username)}
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
          count={dataFiltered.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          rowsPerPageOptions={[5, 10, 25]}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete <strong> {table.selected.length} </strong> users?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteRows();
              confirm.onFalse();
            }}
          >
            Delete
          </Button>
        }
      />
    </Container>
  );
}

// ----------------------------------------------------------------------

function applyFilter({
  inputData,
  filters,
}: {
  inputData: IUserItem[];
  filters: {
    name: string;
    role: string;
  };
}) {
  const { name, role } = filters;

  if (name) {
    inputData = inputData.filter(
      (user) =>
        user.username.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        user.firstName.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        user.lastName.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        user.email.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (role !== 'all') {
    inputData = inputData.filter((user) => user.role === role);
  }

  return inputData;
}