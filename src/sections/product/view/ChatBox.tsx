/* eslint-disable react/no-danger */
import axios from 'axios';
import DOMPurify from 'dompurify';
import { useState, SetStateAction } from 'react';

import { Box, List, Button, Collapse, ListItem, TextField, Typography, ListItemText, CircularProgress } from '@mui/material';

import { HOST_API } from 'src/config-global';

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
  openAIConfig
}: ChatBoxProps) {
  const [askInputShown, setAskInputShown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [currentContext, setCurrentContext] = useState(initialResponse);

  const handleAskNowClick = () => {
    setAskInputShown((prev) => !prev);
  };

  const handleQuestionChange = (event: { target: { value: SetStateAction<string> } }) => {
    setQuestion(event.target.value);
  };

  const handleSubmitQuestion = async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem('accessToken');

      if (!token) {
        console.error('No access token found in sessionStorage');
        setIsLoading(false);
        return;
      }

      // Construir el contexto acumulado incluyendo el historial de conversación
      const contextWithHistory = {
        ...currentContext,
        conversationHistory: conversationHistory.map(conv => ({
          question: conv.question,
          response: conv.response
        }))
      };

      const requestPayload = {
        originalPatientInfo: {
          ...originalPatientInfo,
          ...(openAIConfig && { openaiConfig: openAIConfig }), // Include OpenAI config
        },
        initialResponse: contextWithHistory, // Enviar el contexto completo como initialResponse
        followUpQuestion: question,
        conversationHistory: [...conversationHistory, { question }],
        ...(openAIConfig && { openaiConfig: openAIConfig }), // Include OpenAI config at root level too
      };

      console.log('requestPayload with full context', requestPayload);

      const rawResponse = await axios.post(`${HOST_API}/diagnosis/followup`, requestPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const newResponse = rawResponse.data.followUpResponse.response;

      // Actualizar el historial y el contexto
      const updatedHistory = [...conversationHistory, { question, response: newResponse }];
      setConversationHistory(updatedHistory);

      // Actualizar el contexto actual para futuras preguntas
      setCurrentContext({
        ...contextWithHistory,
        conversationHistory: updatedHistory
      });

      // Limpiar la pregunta
      setQuestion('');
      setIsLoading(false);
    } catch (error) {
      console.error('Error submitting question:', error);
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        mt: 5,
        p: 3,
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        backgroundColor: '#fafafa',
      }}
    >
      <Typography variant="h6" gutterBottom>
        Ask a Follow-up Question
      </Typography>

      {conversationHistory.length > 0 && (
        <Box sx={{ mb: 3, maxHeight: 300, overflow: 'auto' }}>
          <Typography variant="subtitle2" gutterBottom>
            Conversation History:
          </Typography>
          <List dense>
            {conversationHistory.map((conv, index) => (
              <div key={index}>
                <ListItem sx={{ py: 0.5, bgcolor: 'background.paper', mb: 1, borderRadius: 1 }}>
                  <ListItemText
                    primary={`Q: ${conv.question}`}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }}
                  />
                </ListItem>
                <ListItem sx={{ py: 0.5, bgcolor: 'primary.lighter', mb: 2, borderRadius: 1 }}>
                  <ListItemText
                    primary={
                      <div
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(conv.response.replace(/\n/g, '<br>')),
                        }}
                      />
                    }
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              </div>
            ))}
          </List>
        </Box>
      )}

      <Collapse in={!askInputShown}>
        <Button
          variant="contained"
          color="primary"
          sx={{
            borderRadius: '20px',
            textTransform: 'none',
            px: 4,
            py: '6px',
            boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
            ':hover': {
              boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)',
            },
          }}
          onClick={handleAskNowClick}
        >
          Ask Now
        </Button>
      </Collapse>
      <Collapse in={askInputShown}>
        <Box
          sx={{
            mt: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TextField
            variant="outlined"
            value={question}
            onChange={handleQuestionChange}
            placeholder="Type your question here..."
            sx={{
              width: '100%',
              maxWidth: '600px',
              mr: 1,
            }}
            autoFocus
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmitQuestion}
            sx={{
              borderRadius: '20px',
              textTransform: 'none',
              px: 2,
              py: '6px',
              boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
              ':hover': {
                boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)',
              },
            }}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
          </Button>
        </Box>
      </Collapse>
    </Box>
  );
}
