import { Box, Container, Typography, Card, CardContent } from '@mui/material';
import { Chat as ChatIcon } from '@mui/icons-material';

export function ChatPage() {
  return (
    <Container maxWidth="lg">
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box display="flex" alignItems="center" gap={2} mb={4}>
            <Box
              sx={{
                width: 48,
                height: 48,
                bgcolor: '#0071e3',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChatIcon sx={{ fontSize: 24, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h2" sx={{ color: '#1d1d1f' }}>
                Chat
              </Typography>
              <Typography variant="h4" color="text.secondary">
                Interact with your AI agents
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              bgcolor: '#f5f5f7',
              borderRadius: 2,
              p: 8,
              textAlign: 'center',
              border: '2px dashed #d2d2d7',
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: 'white',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <ChatIcon sx={{ fontSize: 32, color: '#86868b' }} />
            </Box>
            <Typography variant="body1" color="text.secondary" fontWeight={500}>
              Chat interface coming soon...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
