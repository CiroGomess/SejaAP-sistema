'use client';

import React from 'react';
import { Box, Button, IconButton, Typography } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

const BRAND = '#ff6600';

export default function ProfileHeader({
  title = 'Perfil do Cliente',
  subtitle = 'Detalhes do cadastro e documentos vinculados.',
  onBack,
  onRefresh,
  loading,
}: {
  title?: string;
  subtitle?: string;
  onBack: () => void;
  onRefresh: () => void;
  loading?: boolean;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 2,
        alignItems: 'flex-start',
        mb: 3,
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Button
          onClick={onBack}
          startIcon={<ArrowBackRoundedIcon />}
          sx={{
            textTransform: 'none',
            fontWeight: 900,
            borderRadius: 2,
            color: '#111827',
            border: '1px solid #e5e7eb',
            backgroundColor: '#ffffff',
            '&:hover': { backgroundColor: 'rgba(255,102,0,0.06)', borderColor: 'rgba(255,102,0,0.35)' },
          }}
        >
          Voltar
        </Button>

        <Box>
          <Typography sx={{ fontSize: 30, fontWeight: 950, color: '#111827', lineHeight: 1.1 }}>
            {title}
          </Typography>
          <Typography sx={{ mt: 0.4, fontSize: 13, color: '#6b7280' }}>
            {subtitle}
          </Typography>
        </Box>
      </Box>

      <IconButton
        onClick={onRefresh}
        disabled={!!loading}
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          border: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
          color: BRAND,
          '&:hover': { backgroundColor: 'rgba(255,102,0,0.06)', borderColor: 'rgba(255,102,0,0.35)' },
        }}
      >
        <RefreshRoundedIcon />
      </IconButton>
    </Box>
  );
}
