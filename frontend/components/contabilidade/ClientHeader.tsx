'use client';

import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Stack,
  Avatar,
  Typography,
  Divider,

  alpha,
  Badge,
  Button,
  Tooltip,
} from '@mui/material';
import {

  AccountBalance as AccountBalanceIcon,
  Verified as VerifiedIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { SelectedClient } from './types';

interface ClientHeaderProps {
  client: SelectedClient;
}

export default function ClientHeader({ client }: ClientHeaderProps) {
  // Ajuste o path conforme onde você salvou o arquivo no /public
  const XLSX_CONTABILIDADE_MODEL_PATH = './xlsx_models/modelo-contabilidade-sejaap.xlsx';

  const downloadContabilidadeModel = () => {
    try {
      const a = document.createElement('a');
      a.href = XLSX_CONTABILIDADE_MODEL_PATH;
      a.download = 'modelo-contabilidade-sejaap.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();

    } catch {
      
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 4,
        borderRadius: 4,
        bgcolor: alpha('#E6C969', 0.02),
        border: `1px solid ${alpha('#E6C969', 0.15)}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Efeito decorativo de fundo */}
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 180,
          height: 180,
          borderRadius: '50%',
          bgcolor: alpha('#E6C969', 0.03),
        }}
      />

      {/* Container principal com 2 colunas */}
      <Grid container spacing={4}>
        {/* COLUNA ESQUERDA - Dados do Cliente (70%) */}
        <Grid size={{ xs: 12, md: 8.4 }}>
          <Stack spacing={3} sx={{ width: '100%' }}>
            {/* Linha 1: Avatar e Título lado a lado */}
            <Stack direction="row" spacing={2.5} alignItems="center">
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <Avatar
                    sx={{
                      width: 22,
                      height: 22,
                      bgcolor: '#E6C969',
                      color: '#0F172A',
                      border: `2px solid #FFFFFF`,
                    }}
                  >
                    <VerifiedIcon sx={{ fontSize: 14 }} />
                  </Avatar>
                }
              >
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: alpha('#E6C969', 0.15),
                    color: '#E6C969',
                    fontSize: '2rem',
                    fontWeight: 700,
                  }}
                >
                  {client.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </Avatar>
              </Badge>

              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#64748B',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  Cliente Ativo
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: '#0F172A', mt: 0.5 }}
                >
                  {client.name}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Grid>

        {/* COLUNA DIREITA - Card de Resumo (30%) */}
        <Grid size={{ xs: 12, md: 3.6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: alpha('#E6C969', 0.03),
              border: `1px solid ${alpha('#E6C969', 0.15)}`,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  sx={{
                    bgcolor: alpha('#E6C969', 0.1),
                    color: '#E6C969',
                    width: 40,
                    height: 40,
                  }}
                >
                  <AccountBalanceIcon />
                </Avatar>
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: '#0F172A' }}
                  >
                    Importação Contábil
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Upload de planilhas XLSX
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ borderColor: alpha('#E6C969', 0.1) }} />

              <Typography
                variant="caption"
                sx={{ color: '#64748B', lineHeight: 1.6 }}
              >
                • Os dados serão vinculados ao cliente ativo
                <br />
                • Formatos aceitos: .xlsx
              </Typography>

              {/* Botão de download do modelo */}
              <Tooltip title="Baixar modelo XLSX (Contabilidade)" arrow>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  startIcon={<DownloadIcon />}
                  onClick={downloadContabilidadeModel}
                  sx={{
                    mt: 0.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    py: 1.6,
                    borderColor: alpha('#E6C969', 0.35),
                    color: '#0F172A',
                    '&:hover': {
                      borderColor: '#E6C969',
                      color: '#E6C969',
                      bgcolor: alpha('#E6C969', 0.06),
                    },
                  }}
                >
                  Baixar Modelo XLSX
                </Button>
              </Tooltip>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
}