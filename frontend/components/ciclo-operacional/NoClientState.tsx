'use client';

import {
  Box,
  Card,
  CardContent,
  Typography,  // <-- VERIFIQUE SE ESTÁ AQUI
  Button,
  Alert,
  Divider,
  Avatar,
  alpha,
} from '@mui/material';
import {
  PersonSearch as PersonSearchIcon,
  InfoOutlined as InfoIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';

interface NoClientStateProps {
  onGoToClients: () => void;
}

export default function NoClientState({ onGoToClients }: NoClientStateProps) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f8', py: 4 }}>
      <Box sx={{ maxWidth: 760, mx: 'auto', px: 2 }}>
        <Card 
          elevation={0} 
          sx={{ 
            borderRadius: 3, 
            border: '1px solid rgba(230, 201, 105, 0.2)',
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
          
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: alpha('#E6C969', 0.1),
                color: '#E6C969',
                mx: 'auto',
                mb: 3,
              }}
            >
              <TimelineIcon sx={{ fontSize: 40 }} />
            </Avatar>

            <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
              Nenhum cliente selecionado
            </Typography>

            <Typography sx={{ color: '#6b7280', mb: 4, maxWidth: 360, mx: 'auto' }}>
              Para visualizar o Ciclo Operacional e Financeiro, selecione um cliente no menu lateral.
            </Typography>

            <Alert 
              severity="info" 
              icon={<InfoIcon />} 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                bgcolor: alpha('#E6C969', 0.05),
                color: '#6b7280',
                '& .MuiAlert-icon': { color: '#E6C969' },
              }}
            >
              Esta tela permite cadastrar/editar o ciclo no banco por cliente.
            </Alert>

            <Divider sx={{ my: 3, borderColor: 'rgba(230, 201, 105, 0.1)' }} />

            <Button
              variant="contained"
              startIcon={<PersonSearchIcon />}
              onClick={onGoToClients}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                fontWeight: 600,
                px: 4,
                py: 1.2,
                bgcolor: '#E6C969',
                color: '#0F172A',
                '&:hover': {
                  bgcolor: '#C4A052',
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 16px ${alpha('#E6C969', 0.3)}`,
                },
                transition: 'all 0.2s ease',
              }}
            >
              Ir para Clientes
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}