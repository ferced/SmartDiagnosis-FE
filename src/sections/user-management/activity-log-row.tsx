import { format } from 'date-fns';

import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

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

type Props = {
  log: ActivityLog;
  getStatusColor: (status: number) => 'success' | 'info' | 'warning' | 'error';
};

export default function ActivityLogRow({ log, getStatusColor }: Props) {
  const formattedDate = format(new Date(log.createdAt), 'MMM dd, HH:mm:ss');
  
  const getActionLabel = (action: string) => {
    const actionMap: { [key: string]: string } = {
      'USER_LOGIN': 'Login',
      'CREATE_USER': 'Create User',
      'UPDATE_USER': 'Update User',
      'DELETE_USER': 'Delete User',
      'SUBMIT_DIAGNOSIS': 'Submit Diagnosis',
      'SUBMIT_FOLLOWUP': 'Follow-up',
      'GET_USER': 'View User',
      'LIST_USERS': 'List Users',
    };
    return actionMap[action] || action;
  };

  const getDurationColor = (ms: number) => {
    if (ms < 100) return 'success.main';
    if (ms < 500) return 'warning.main';
    return 'error.main';
  };

  return (
    <TableRow hover>
      <TableCell>
        <Tooltip title={new Date(log.createdAt).toLocaleString()}>
          <Typography variant="caption">{formattedDate}</Typography>
        </Tooltip>
      </TableCell>

      <TableCell>
        <Typography variant="body2">{log.username}</Typography>
      </TableCell>

      <TableCell>
        <Chip
          label={getActionLabel(log.action)}
          size="small"
          variant="outlined"
        />
      </TableCell>

      <TableCell>
        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
          {log.method} {log.endpoint}
        </Typography>
      </TableCell>

      <TableCell>
        <Chip
          label={log.responseStatus}
          size="small"
          color={getStatusColor(log.responseStatus)}
          variant="filled"
        />
      </TableCell>

      <TableCell>
        <Typography 
          variant="caption" 
          sx={{ 
            color: getDurationColor(log.durationMs),
            fontWeight: 'bold'
          }}
        >
          {log.durationMs}ms
        </Typography>
      </TableCell>

      <TableCell>
        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
          {log.ipAddress}
        </Typography>
      </TableCell>
    </TableRow>
  );
}