import axios from 'axios';
import { useState, useEffect } from 'react';

import { Stack, Tooltip, Typography, LinearProgress } from '@mui/material';

import { HOST_API } from 'src/config-global';

import Iconify from 'src/components/iconify';

// GET /users/me/usage → { usage: RequestUsage, limit: UserLimit | null }
interface UsageResponse {
  usage?: { userId?: number; requestCount?: number } | null;
  limit?: { dailyLimit?: number } | null;
}

interface Props {
  // Bump to re-fetch (e.g. after a diagnosis completes).
  refreshKey?: number;
}

// Discreet "N of M requests today" line. The backend counts every logged API
// request (diagnoses, follow-ups, chat, history…), not only diagnoses, so the
// label says "requests". Renders nothing when the endpoint fails or returns
// data that can't be attributed to this user, rather than showing a wrong 0.
export default function DailyUsage({ refreshKey = 0 }: Props) {
  const [used, setUsed] = useState<number | null>(null);
  const [limit, setLimit] = useState<number | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) return undefined;

    const controller = new AbortController();

    axios
      .get<UsageResponse>(`${HOST_API}/users/me/usage`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      })
      .then(({ data }) => {
        const usage = data?.usage;
        // userId 0 means the server could not resolve the caller; the count
        // would not be this user's.
        if (!usage || !usage.userId || typeof usage.requestCount !== 'number') {
          setUsed(null);
          return;
        }
        setUsed(usage.requestCount);
        const dailyLimit = data?.limit?.dailyLimit;
        setLimit(typeof dailyLimit === 'number' && dailyLimit > 0 ? dailyLimit : null);
      })
      .catch(() => {
        setUsed(null);
      });

    return () => controller.abort();
  }, [refreshKey]);

  if (used === null) return null;

  const ratio = limit ? Math.min(used / limit, 1) : 0;
  let barColor: 'primary' | 'warning' | 'error' = 'primary';
  if (ratio >= 1) barColor = 'error';
  else if (ratio >= 0.8) barColor = 'warning';

  return (
    <Tooltip title="Requests to AI Professor today — diagnoses, follow-ups, questions and history views all count. Resets daily.">
      <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'text.secondary' }}>
        <Iconify icon="solar:chart-2-bold-duotone" width={18} />
        <Typography variant="caption">
          {limit ? `${used} of ${limit} requests today` : `${used} requests today`}
        </Typography>
        {limit && (
          <LinearProgress
            variant="determinate"
            color={barColor}
            value={ratio * 100}
            sx={{ width: 64, height: 4, borderRadius: 1 }}
          />
        )}
      </Stack>
    </Tooltip>
  );
}
