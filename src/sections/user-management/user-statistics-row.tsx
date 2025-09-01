import { format } from 'date-fns';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import LinearProgress from '@mui/material/LinearProgress';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

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

type Props = {
  statistics: UserStatistics;
  onEditLimit: (user: UserStatistics) => void;
  getUsagePercentage: (used: number, limit: number) => number;
  getUsageColor: (percentage: number) => 'success' | 'warning' | 'error';
};

export default function UserStatisticsRow({ 
  statistics, 
  onEditLimit,
  getUsagePercentage,
  getUsageColor 
}: Props) {
  const usagePercentage = getUsagePercentage(statistics.requestsToday, statistics.dailyLimit);
  const usageColor = getUsageColor(usagePercentage);
  
  const getRoleColor = (role: string) => {
    switch(role) {
      case 'admin': return 'error';
      case 'manager': return 'info';
      case 'medic': return 'warning';
      default: return 'default';
    }
  };

  return (
    <TableRow hover>
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {statistics.username.charAt(0).toUpperCase()}
          </Avatar>
          <ListItemText
            primary={statistics.username}
            secondary={statistics.email}
            primaryTypographyProps={{ typography: 'body2' }}
            secondaryTypographyProps={{ 
              component: 'span', 
              typography: 'caption',
              color: 'text.disabled' 
            }}
          />
        </Stack>
      </TableCell>

      <TableCell>
        <Label variant="soft" color={getRoleColor(statistics.role)}>
          {statistics.role}
        </Label>
      </TableCell>

      <TableCell>
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: '100%', mr: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={usagePercentage} 
                color={usageColor}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>
            <Box sx={{ minWidth: 80 }}>
              <Typography variant="caption" color="text.secondary">
                {statistics.requestsToday} / {statistics.dailyLimit === -1 ? '∞' : statistics.dailyLimit}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </TableCell>

      <TableCell align="center">
        <Typography variant="body2">
          {statistics.requestsLast7Days}
        </Typography>
      </TableCell>

      <TableCell align="center">
        <Typography variant="body2">
          {statistics.requestsLast30Days}
        </Typography>
      </TableCell>

      <TableCell>
        {statistics.lastRequestAt ? (
          <Typography variant="caption" color="text.secondary">
            {format(new Date(statistics.lastRequestAt), 'MMM dd, HH:mm')}
          </Typography>
        ) : (
          <Typography variant="caption" color="text.disabled">
            Never
          </Typography>
        )}
      </TableCell>

      <TableCell align="right">
        <IconButton 
          size="small" 
          onClick={() => onEditLimit(statistics)}
          disabled={statistics.role === 'admin'}
        >
          <Iconify icon="solar:pen-bold" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}