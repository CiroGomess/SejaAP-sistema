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
  Alert,
  Chip,
  Fade,
  Stack,
} from '@mui/material';

import {
  Close as CloseIcon,
  UploadFile as UploadFileIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorOutlineIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

type Props = {
  open: boolean;
  state: UploadState;
  fileName?: string;
  fileSizeBytes?: number;
  errorMessage?: string;
  rowsMapped?: number;
  rowsInserted?: number;
  categoria?: string;
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

export default function AnaliseMargemXlsxUploadModal({
  open,
  state,
  fileName,
  fileSizeBytes,
  errorMessage,
  rowsMapped,
  rowsInserted,
  categoria,
  onClose,
}: Props) {
  const isBlocking = state === 'uploading';

  return (
    <Dialog
      open={open}
      fullScreen
      TransitionComponent={Fade}
      PaperProps={{
        style: { backgroundColor: 'transparent', boxShadow: 'none' },
      }}
    >
      <Box
        sx={{
          height: '100%',
          width: '100%',
          bgcolor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(16px)',
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
            maxWidth: 650,
            borderRadius: '20px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            bgcolor: '#1e293b',
            color: '#f8fafc',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          }}
        >
          {/* Header */}
          <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  bgcolor: 'rgba(255, 184, 0, 0.1)',
                  p: 1.2,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <AssessmentIcon sx={{ color: '#ffb800' }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
                  Análise de Margem
                </Typography>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  Importação XLSX • Sincronização
                </Typography>
              </Box>
            </Box>

            {!isBlocking && (
              <IconButton
                onClick={onClose}
                sx={{
                  color: '#94a3b8',
                  '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)' },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

          {/* Body */}
          <Box sx={{ p: 4 }}>
            {/* Info do Arquivo */}
            <Box
              sx={{
                p: 3,
                borderRadius: '16px',
                bgcolor: 'rgba(15, 23, 42, 0.3)',
                border: '1px solid rgba(255,255,255,0.05)',
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <UploadFileIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', wordBreak: 'break-word' }}>
                  {fileName || 'Arquivo não identificado'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={formatBytes(fileSizeBytes)}
                  size="small"
                  sx={{ bgcolor: '#334155', color: '#cbd5e1', fontWeight: 600 }}
                />
                {categoria && (
                  <Chip
                    label={categoria}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255, 184, 0, 0.1)',
                      color: '#ffb800',
                      fontWeight: 600,
                      border: '1px solid rgba(255, 184, 0, 0.2)',
                    }}
                  />
                )}
              </Box>
            </Box>

            {/* Status do Processamento */}
            <Box>
              {state === 'uploading' && (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <CircularProgress size={32} thickness={5} sx={{ color: '#ffb800', mb: 2 }} />
                  <Typography sx={{ fontWeight: 600 }}>Processando dados...</Typography>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', mt: 0.5 }}>
                    Isso pode levar um momento, não feche a janela.
                  </Typography>
                </Box>
              )}

              {state === 'success' && (
                <Fade in>
                  <Box>
                    <Alert
                      icon={<CheckCircleIcon />}
                      severity="success"
                      sx={{
                        borderRadius: '12px',
                        bgcolor: 'rgba(34, 197, 94, 0.1)',
                        color: '#bbf7d0',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                        mb: 3,
                      }}
                    >
                      Processamento concluído com sucesso!
                    </Alert>

                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: '16px',
                        bgcolor: 'rgba(15, 23, 42, 0.35)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <Stack spacing={1.5}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
                          Resumo da importação
                        </Typography>

                        <Typography sx={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                          <strong>Linhas mapeadas:</strong> {typeof rowsMapped === 'number' ? rowsMapped : '-'}
                        </Typography>

                        <Typography sx={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                          <strong>Linhas inseridas:</strong> {typeof rowsInserted === 'number' ? rowsInserted : '-'}
                        </Typography>
                      </Stack>
                    </Paper>
                  </Box>
                </Fade>
              )}

              {state === 'error' && (
                <Fade in>
                  <Alert
                    icon={<ErrorOutlineIcon />}
                    severity="error"
                    sx={{
                      borderRadius: '12px',
                      bgcolor: 'rgba(239, 68, 68, 0.1)',
                      color: '#fecaca',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                    }}
                  >
                    {errorMessage || 'Erro ao processar a planilha.'}
                  </Alert>
                </Fade>
              )}
            </Box>
          </Box>

          {/* Footer */}
          <Box
            sx={{
              p: 3,
              bgcolor: 'rgba(15, 23, 42, 0.2)',
              display: 'flex',
              justifyContent: 'center',
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
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.95rem',
                bgcolor: state === 'error' ? '#ef4444' : '#ffb800',
                color: '#1e293b',
                '&:hover': {
                  bgcolor: state === 'error' ? '#dc2626' : '#e6a600',
                },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.2)',
                },
              }}
            >
              {state === 'uploading' ? 'Sincronizando...' : 'Concluir e Voltar'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Dialog>
  );
}