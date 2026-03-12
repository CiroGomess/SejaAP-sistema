'use client';

import {
  Card,
  CardContent,
  Box,
  Stack,
  Avatar,
  Typography,  // <-- VERIFIQUE SE ESTÁ AQUI
  Chip,
  alpha,
} from '@mui/material';
import {
  Badge as BadgeIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import { SelectedClient } from './types';

interface ClientCardProps {
  client: SelectedClient;
}

export default function ClientCard({ client }: ClientCardProps) {
  return (
    <Card 
      elevation={0} 
      sx={{ 
        borderRadius: 3, 
        border: '1px solid rgba(230, 201, 105, 0.2)', 
        mb: 2, 
        width: '100%',
        bgcolor: 'rgba(230, 201, 105, 0.02)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box 
        sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(90deg, #E6C969, rgba(230, 201, 105, 0.3))',
        }} 
      />
      
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar 
            sx={{ 
              width: 56, 
              height: 56, 
              bgcolor: alpha('#E6C969', 0.15), 
              color: '#E6C969',
              fontSize: '1.5rem',
              fontWeight: 700,
            }}
          >
            {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </Avatar>

          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="h6" fontWeight={700} sx={{ color: '#111827', lineHeight: 1.1 }}>
                {client.name}
              </Typography>

              <Chip 
                icon={<BadgeIcon sx={{ fontSize: '0.9rem' }} />}
                label={`Cód: ${client.code}`} 
                size="small" 
                sx={{ 
                  fontWeight: 600, 
                  borderRadius: 2,
                  bgcolor: alpha('#E6C969', 0.1),
                  color: '#E6C969',
                }} 
              />
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <VerifiedIcon sx={{ fontSize: 14, color: '#E6C969', opacity: 0.7 }} />
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                Cliente ativo no sistema
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}