import axios from 'axios';
import { useState, useEffect } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import { HOST_API } from 'src/config-global';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

interface Message {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  updated_at: string;
}

export default function ConversationDetailView() {
  const settings = useSettingsContext();
  const params = useParams();
  const conversationId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem('accessToken');
        if (!token) {
          throw new Error('No access token found');
        }

        const response = await axios.get(`${HOST_API}/conversation/messages/${conversationId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Sort messages by creation date in ascending order
        const sortedMessages = [...response.data].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setMessages(sortedMessages);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError(err.response?.data?.message || 'Error fetching messages');
      } finally {
        setLoading(false);
      }
    };

    if (conversationId) {
      fetchMessages();
    }
  }, [conversationId]);

  if (loading) {
    return (
      <Container>
        <Stack alignItems="center" justifyContent="center" sx={{ height: '50vh' }}>
          <CircularProgress />
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Conversation Details"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'History', href: paths.dashboard.history.root },
          { name: 'Conversation Details' },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <Card>
        <Stack spacing={3} sx={{ p: 3 }}>
          {messages.map((message) => (
            <Stack
              key={message.id}
              direction="row"
              spacing={2}
              sx={{
                width: '100%',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <Card
                sx={{
                  maxWidth: '80%',
                  bgcolor: message.role === 'user' ? 'primary.lighter' : 'grey.100',
                  p: 2,
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {message.content}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    mt: 1,
                    display: 'block',
                  }}
                >
                  {new Date(message.created_at).toLocaleString()}
                </Typography>
              </Card>
            </Stack>
          ))}
        </Stack>
      </Card>
    </Container>
  );
}