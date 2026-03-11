'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Stack,
  Typography,  // <-- VERIFIQUE SE ESTÁ AQUI
  Tooltip,
  IconButton,
  LinearProgress,
  Divider,
  Alert,
  alpha,
} from '@mui/material';
import {
  InfoOutlined as InfoIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { CycleSummary } from './types';

interface CycleSummaryProps {
  summary: CycleSummary;
}

export default function CycleSummaryCard({ summary }: CycleSummaryProps) {
  const maxOperational = 120;
  const operationalPercent = Math.min(100, (summary.cycleOperational / maxOperational) * 100);
  const financialPercent = Math.min(100, (summary.cycleFinancial / maxOperational) * 100);

  return (
    <Card
      elevation={0}
      sx={{
        width: '100%',
        borderRadius: 3,
        border: '1px solid rgba(230, 201, 105, 0.2)',
        bgcolor: '#0F172A',
        color: '#fff',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
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
      
      <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Typography variant="overline" sx={{ color: '#94a3b8', letterSpacing: 1.2, fontWeight: 600 }}>
            Resumo de Ciclos
          </Typography>
          <Tooltip title="Cálculo baseado nos dias configurados (Pagto/Venda/Recebimento).">
            <IconButton size="small" sx={{ color: '#94a3b8' }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Ciclo Operacional */}
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>
              Ciclo Operacional (PME + PMR)
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <TrendingUpIcon sx={{ fontSize: 16, color: '#E6C969' }} />
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                PME: {summary.pme} | PMR: {summary.pmr}
              </Typography>
            </Stack>
          </Stack>
          
          <Typography variant="h2" fontWeight={700} sx={{ lineHeight: 1.1, color: '#fff', mb: 1 }}>
            {summary.cycleOperational}{' '}
            <span style={{ fontSize: '0.45em', fontWeight: 500, color: '#94a3b8' }}>dias</span>
          </Typography>

          <Box sx={{ mt: 1 }}>
            <LinearProgress
              variant="determinate"
              value={operationalPercent}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'rgba(255,255,255,0.1)',
                '& .MuiLinearProgress-bar': { 
                  bgcolor: '#E6C969', 
                  borderRadius: 4,
                },
              }}
            />
            <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.5, display: 'block' }}>
              Quanto maior, mais capital preso em operação.
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* Ciclo Financeiro */}
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>
              Ciclo Financeiro (Operacional - PMP)
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <TrendingDownIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                PMP: {summary.pmp}
              </Typography>
            </Stack>
          </Stack>
          
          <Typography variant="h2" fontWeight={700} sx={{ lineHeight: 1.1, color: '#F59E0B', mb: 1 }}>
            {summary.cycleFinancial}{' '}
            <span style={{ fontSize: '0.45em', fontWeight: 500, color: '#94a3b8' }}>dias</span>
          </Typography>

          <Box sx={{ mt: 1 }}>
            <LinearProgress
              variant="determinate"
              value={financialPercent}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'rgba(255,255,255,0.1)',
                '& .MuiLinearProgress-bar': { 
                  bgcolor: '#F59E0B', 
                  borderRadius: 4,
                },
              }}
            />
            <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.5, display: 'block' }}>
              Idealmente menor, para reduzir pressão de caixa.
            </Typography>
          </Box>
        </Box>

        <Alert 
          severity="info" 
          icon={<InfoIcon />} 
          sx={{ 
            mt: 'auto', 
            bgcolor: alpha('#E6C969', 0.1), 
            color: '#94a3b8',
            '& .MuiAlert-icon': { color: '#E6C969' },
            border: '1px solid rgba(230, 201, 105, 0.2)',
            borderRadius: 2,
          }}
        >
          Se o ciclo financeiro aumenta, priorize renegociação de prazo e aceleração de recebíveis.
        </Alert>
      </CardContent>
    </Card>
  );
}