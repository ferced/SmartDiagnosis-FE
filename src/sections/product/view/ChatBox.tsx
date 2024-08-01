/* eslint-disable react/no-danger */
import axios from 'axios';
import DOMPurify from 'dompurify';
import { useState, SetStateAction } from 'react';

import { Box, List, Button, Collapse, ListItem, TextField, Typography, ListItemText, CircularProgress } from '@mui/material';

import { HOST_API } from 'src/config-global';

interface ChatBoxProps {
  question: string;
  setQuestion: (value: SetStateAction<string>) => void;
  originalPatientInfo: any;
  initialResponse: any;
}

export default function ChatBox({
  question,
  setQuestion,
  originalPatientInfo,
  initialResponse
}: ChatBoxProps) {
  const [askInputShown, setAskInputShown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);

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

      const newConversationHistory = [...conversationHistory, { question }];
      const requestPayload = {
        originalPatientInfo,
        initialResponse,
        followUpQuestion: question,
        conversationHistory: newConversationHistory,
      };

      console.log('requestPayload', requestPayload);

      const rawResponse = await axios.post(`${HOST_API}/diagnosis/followup`, requestPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const newResponse = rawResponse.data.response;
      setConversationHistory([...conversationHistory, { question, response: newResponse }]);
      setAskInputShown(false);
      setQuestion('');
    } catch (error) {
      console.error(error.response ? error.response.data : error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        mt: 4,
        py: 3,
        px: 2,
        bgcolor: 'background.paper',
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
        borderRadius: '8px',
        textAlign: 'center',
      }}
    >
      <Typography
        variant="h5"
        sx={{ mb: 2, fontWeight: 'medium', color: 'text.primary' }}
      >
        Got More Questions?
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
        If you have any more questions or need further clarification, don&apos;t hesitate to ask.
      </Typography>
      <List>
        {conversationHistory.map((entry, index) => (
          <ListItem key={index} alignItems="flex-start">
            <ListItemText
              primary={<Typography variant="body1" color="text.primary"><strong>Q:</strong> {entry.question}</Typography>}
              secondary={
                entry.response && (
                  <Typography variant="body1" color="text.secondary" component="div">
                    <strong>A:</strong> <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(entry.response) }} />
                  </Typography>
                )
              }
            />
          </ListItem>
        ))}
      </List>
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
