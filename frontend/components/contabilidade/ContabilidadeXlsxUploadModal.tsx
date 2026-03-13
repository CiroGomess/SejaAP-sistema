'use client';

import React from 'react';
import {
  Dialog,
  Box,
  Typography,
  CircularProgress,
  Paper,
  Divider,
  Button,
  IconButton,
  Chip,
  Fade,
} from '@mui/material';

import {
  Close as CloseIcon,
  UploadFile as UploadFileIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorOutlineIcon,
} from '@mui/icons-material';

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

type Props = {
  open: boolean;
  state: UploadState;
  fileName?: string;
  fileSizeBytes?: number;
  errorMessage?: string;
  onClose: () => void;
};

function formatBytes(bytes?: number) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let u = 0;
  while (size >= 1024 && u < units.length - 1) {
    size = size / 1024;
    u++;
  }
  return `${size.toFixed(1)} ${units[u]}`;
}

export default function ContabilidadeXlsxUploadModal({
  open,
  state,
  fileName,
  fileSizeBytes,
  errorMessage,
  onClose,
}: Props) {
  const isBlocking = state === 'uploading';

  return (
    <Dialog 
      open={open} 
      fullScreen 
      TransitionComponent={Fade}
      PaperProps={{
        style: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
        },
      }}
    >
      <Box
        sx={{
          height: '100%',
          width: '100%',
          // Efeito Acrílico no Background Geral
          bgcolor: 'rgba(15, 23, 42, 0.7)', 
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2, md: 4 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 600,
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            bgcolor: '#1e293b', // Cor base do seu dashboard
            color: '#f8fafc',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Header */}
          <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box 
                sx={{ 
                  bgcolor: 'rgba(255, 184, 0, 0.1)', 
                  p: 1, 
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <UploadFileIcon sx={{ color: '#ffb800' }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
                  Importação de Dados
                </Typography>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  Contabilidade • {new Date().getFullYear()}
                </Typography>
              </Box>
            </Box>
            {!isBlocking && (
              <IconButton
                onClick={onClose}
                sx={{ 
                  color: '#94a3b8', 
                  '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)' } 
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

          {/* Body */}
          <Box sx={{ p: 4 }}>
            {/* File Info Card */}
            <Box 
              sx={{ 
                p: 2.5, 
                borderRadius: '12px', 
                bgcolor: 'rgba(15, 23, 42, 0.4)', 
                border: '1px dashed rgba(148, 163, 184, 0.3)',
                textAlign: 'center'
              }}
            >
              <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem', mb: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>
                Arquivo Carregado
              </Typography>
              <Typography sx={{ fontWeight: 600, fontSize: '1rem', mb: 1, color: '#f8fafc' }}>
                {fileName || 'Nenhum arquivo detectado'}
              </Typography>
              <Chip 
                label={formatBytes(fileSizeBytes)} 
                size="small"
                sx={{ 
                  bgcolor: '#334155', 
                  color: '#cbd5e1', 
                  fontWeight: 600,
                  fontSize: '0.75rem' 
                }} 
              />
            </Box>

            <Box sx={{ mt: 4 }}>
              {state === 'uploading' && (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <CircularProgress size={32} thickness={5} sx={{ color: '#ffb800', mb: 2 }} />
                  <Typography sx={{ fontWeight: 600, color: '#f8fafc' }}>
                    Sincronizando com o sistema...
                  </Typography>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', mt: 0.5 }}>
                    Isso pode levar alguns segundos.
                  </Typography>
                </Box>
              )}

              {state === 'success' && (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2, 
                    p: 2, 
                    borderRadius: '12px', 
                    bgcolor: 'rgba(34, 197, 94, 0.1)', 
                    border: '1px solid rgba(34, 197, 94, 0.2)' 
                  }}
                >
                  <CheckCircleIcon sx={{ color: '#22c55e' }} />
                  <Typography sx={{ color: '#bbf7d0', fontSize: '0.9rem', fontWeight: 500 }}>
                    Dados importados com sucesso!
                  </Typography>
                </Box>
              )}

              {state === 'error' && (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2, 
                    p: 2, 
                    borderRadius: '12px', 
                    bgcolor: 'rgba(239, 68, 68, 0.1)', 
                    border: '1px solid rgba(239, 68, 68, 0.2)' 
                  }}
                >
                  <ErrorOutlineIcon sx={{ color: '#ef4444' }} />
                  <Typography sx={{ color: '#fecaca', fontSize: '0.9rem', fontWeight: 500 }}>
                    {errorMessage || 'Erro ao processar arquivo.'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Footer */}
          <Box 
            sx={{ 
              p: 3, 
              bgcolor: 'rgba(15, 23, 42, 0.2)', 
              display: 'flex', 
              justifyContent: 'center' 
            }}
          >
            <Button
              fullWidth
              variant="contained"
              onClick={onClose}
              disabled={isBlocking}
              sx={{
                py: 1.5,
                textTransform: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.95rem',
                bgcolor: state === 'error' ? '#ef4444' : '#ffb800',
                color: '#1e293b',
                boxShadow: '0 4px 14px 0 rgba(255, 184, 0, 0.39)',
                '&:hover': {
                  bgcolor: state === 'error' ? '#dc2626' : '#e6a600',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.23)',
                },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.3)'
                }
              }}
            >
              {state === 'uploading' ? 'Aguarde...' : 'Concluir'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Dialog>
  );
}