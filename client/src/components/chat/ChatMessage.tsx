import React from 'react';
import { Avatar, Box, Paper, Typography } from '@mui/material';
import { format } from 'date-fns';
import { Message } from '../../types/Message';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  // Solución: Validar la fecha antes de formatearla
  let time = '...';
  const date = new Date(message.timestamp);

  // Comprueba si el timestamp existe, no es un mensaje de streaming y es una fecha válida
  if (message.timestamp && message.timestamp.startsWith('streaming') && isNaN(date.getTime())) {
    time = format(date, 'HH:mm');
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isUser ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
          maxWidth: '80%',
        }}
      >
        <Avatar sx={{ bgcolor: isUser ? 'primary.main' : 'secondary.main', ml: isUser ? 2 : 0, mr: isUser ? 0 : 2 }}>
          {isUser ? 'U' : 'A'}
        </Avatar>
        <Paper
          variant="outlined"
          sx={{
            p: 1,
            bgcolor: isUser ? '#e3f2fd' : '#fce4ec',
            borderRadius: isUser ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
          }}
        >
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right' }}>
            {time}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default ChatMessage;