import axios from 'axios';
import { useSnackbar } from 'notistack';
import { KeyboardEvent, SetStateAction, useCallback, useState } from 'react';

import SendIcon from '@mui/icons-material/Send';
import { Box, IconButton, Stack, TextField, Typography, useTheme } from '@mui/material';

import { HOST_API } from 'src/config-global';

import Markdown from 'src/components/markdown';

interface OpenAIConfig {
  apiKey: string;
  model: string;
}

interface ChatBoxProps {
  question: string;
  setQuestion: (value: SetStateAction<string>) => void;
  originalPatientInfo: any;
  initialResponse: any;
  openAIConfig?: OpenAIConfig | null;
}

export default function ChatBox({
  question,
  setQuestion,
  originalPatientInfo,
  initialResponse,
  openAIConfig,
}: ChatBoxProps) {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [currentContext, setCurrentContext] = useState(initialResponse);

  const handleQuestionChange = (event: { target: { value: SetStateAction<string> } }) => {
    setQuestion(event.target.value);
  };

  const handleSubmitQuestion = useCallback(async () => {
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const token = sessionStorage.getItem('accessToken');

      if (!token) {
        enqueueSnackbar('No access token found. Please log in again.', { variant: 'error' });
        setIsLoading(false);
        return;
      }

      const contextWithHistory = {
        ...currentContext,
        conversationHistory: conversationHistory.map((conv) => ({
          question: conv.question,
          response: conv.response,
        })),
      };

      const requestPayload = {
        originalPatientInfo: {
          ...originalPatientInfo,
          ...(openAIConfig && { openaiConfig: openAIConfig }),
        },
        initialResponse: contextWithHistory,
        followUpQuestion: question,
        conversationHistory: [...conversationHistory, { question }],
        ...(openAIConfig && { openaiConfig: openAIConfig }),
      };

      const rawResponse = await axios.post(`${HOST_API}/diagnosis/followup`, requestPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const newResponse = rawResponse.data.followUpResponse.response;

      const updatedHistory = [...conversationHistory, { question, response: newResponse }];
      setConversationHistory(updatedHistory);

      setCurrentContext({
        ...contextWithHistory,
        conversationHistory: updatedHistory,
      });

      setQuestion('');
    } catch (error) {
      console.error('Error submitting question:', error);
      enqueueSnackbar('Failed to get a response. Please try again.', { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [question, isLoading, currentContext, conversationHistory, originalPatientInfo, openAIConfig, setQuestion, enqueueSnackbar]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmitQuestion();
    }
  };

  return (
    <Box
      sx={{
        mt: 5,
        p: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        backgroundColor: theme.palette.background.neutral,
      }}
    >
      <Typography variant="h6" gutterBottom>
        Ask a Follow-up Question
      </Typography>

      {conversationHistory.length > 0 && (
        <Box sx={{ mb: 3, maxHeight: 400, overflow: 'auto', px: 1 }}>
          <Stack spacing={2}>
            {conversationHistory.map((conv, index) => (
              <Stack key={index} spacing={1.5}>
                {/* User bubble - right aligned */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Box
                    sx={{
                      maxWidth: '75%',
                      px: 2,
                      py: 1.5,
                      borderRadius: 2,
                      borderTopRightRadius: 4,
                      bgcolor: theme.palette.primary.lighter,
                      color: theme.palette.primary.darker,
                    }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      {conv.question}
                    </Typography>
                  </Box>
                </Box>

                {/* AI bubble - left aligned */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Box
                    sx={{
                      maxWidth: '75%',
                      px: 2,
                      py: 1.5,
                      borderRadius: 2,
                      borderTopLeftRadius: 4,
                      bgcolor: theme.palette.grey[100],
                    }}
                  >
                    <Markdown>{conv.response}</Markdown>
                  </Box>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Box>
      )}

      {/* Always-visible input */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
        }}
      >
        <TextField
          variant="outlined"
          value={question}
          onChange={handleQuestionChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your question here... (Shift+Enter for newline)"
          multiline
          maxRows={4}
          fullWidth
          size="small"
        />
        <IconButton
          color="primary"
          onClick={handleSubmitQuestion}
          disabled={isLoading || !question.trim()}
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': { bgcolor: 'primary.dark' },
            '&.Mui-disabled': { bgcolor: theme.palette.action.disabledBackground },
            width: 40,
            height: 40,
          }}
        >
          <SendIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
