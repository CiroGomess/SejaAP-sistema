'use client';

import React from 'react';
import {
  Stack,
  Typography,
  Chip,
  Button,
  Box,
  
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

interface CycleHeaderProps {
  periodLabel: string;
  onSave: () => void;
  saving: boolean;
  loading: boolean;
}

export default function CycleHeader({ periodLabel, onSave, saving, loading }: CycleHeaderProps) {
  return (
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ lg: 'center' }} sx={{ mb: 2 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h4" fontWeight={700} sx={{ color: '#111827', letterSpacing: -0.3, lineHeight: 1.15 }}>
          Ciclo Operacional e Financeiro
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75, flexWrap: 'wrap' }}>
          <Chip 
            icon={<CalendarIcon />} 
            label={periodLabel} 
            size="small" 
            sx={{ 
              fontWeight: 600, 
              borderRadius: 2, 
              bgcolor: 'rgba(230, 201, 105, 0.1)', 
              color: '#E6C969',
            }} 
          />
          <Chip 
            label="Configuração por cliente" 
            size="small" 
            sx={{ 
              fontWeight: 600, 
              borderRadius: 2, 
              bgcolor: 'rgba(230, 201, 105, 0.05)', 
              color: '#E6C969',
            }} 
          />
        </Stack>

        <Typography variant="body2" sx={{ color: '#6b7280', mt: 1 }}>
          Reordene, ajuste dias e selecione <strong>Operacional OU Financeiro</strong> em cada etapa.
        </Typography>
      </Box>

      <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
        <Button
          variant="contained"
          onClick={onSave}
          disabled={saving || loading}
          startIcon={<SaveIcon />}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            fontWeight: 600,
            bgcolor: '#E6C969',
            color: '#0F172A',
            '&:hover': { bgcolor: '#C4A052' },
          }}
        >
          {saving ? 'Salvando...' : 'Salvar ciclo'}
        </Button>
      </Stack>
    </Stack>
  );
}