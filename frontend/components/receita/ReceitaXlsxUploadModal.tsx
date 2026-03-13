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
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

type Props = {
  open: boolean;
  state: UploadState;
  fileName?: string;
  fileSizeBytes?: number;
  errorMessage?: string;
  result?: any;
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

export default function ReceitaXlsxUploadModal({
  open,
  state,
  fileName,
  fileSizeBytes,
  errorMessage,
  result,
  onClose,
}: Props) {
  const isBlocking = state === 'uploading';

  const rowsMapped = result?.rows_mapped;
  const rowsInserted = result?.rows_inserted;

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
            maxWidth: 550,
            borderRadius: '20px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            bgcolor: '#1e293b',
            color: '#f8fafc',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
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
                <TrendingUpIcon sx={{ color: '#ffb800' }} />
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Gestão de Receitas
                </Typography>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  Importação de faturamento XLSX
                </Typography>
              </Box>
            </Box>

            {!isBlocking && (
              <IconButton
                onClick={onClose}
                sx={{
                  color: '#94a3b8',
                  '&:hover': {
                    color: '#fff',
                    bgcolor: 'rgba(255,255,255,0.05)',
                  },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

          {/* Body */}
          <Box sx={{ p: 4 }}>
            {/* Card do Arquivo */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: '16px',
                bgcolor: 'rgba(15, 23, 42, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 4,
              }}
            >
              <UploadFileIcon sx={{ color: '#64748b', fontSize: 32, mb: 1.5 }} />

              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  mb: 1,
                  textAlign: 'center',
                  wordBreak: 'break-word',
                }}
              >
                {fileName || 'Nenhum arquivo selecionado'}
              </Typography>

              <Chip
                label={formatBytes(fileSizeBytes)}
                size="small"
                sx={{
                  bgcolor: '#334155',
                  color: '#cbd5e1',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                }}
              />
            </Box>

            {/* Status do Processamento */}
            <Box
              sx={{
                minHeight: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {state === 'uploading' && (
                <Box sx={{ textAlign: 'center' }}>
                  <CircularProgress
                    size={28}
                    thickness={5}
                    sx={{ color: '#ffb800', mb: 2 }}
                  />
                  <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    Sincronizando faturamento...
                  </Typography>
                </Box>
              )}

              {state === 'success' && (
                <Fade in>
                  <Box sx={{ width: '100%' }}>
                    <Alert
                      icon={<CheckCircleIcon />}
                      severity="success"
                      sx={{
                        width: '100%',
                        borderRadius: '12px',
                        bgcolor: 'rgba(34, 197, 94, 0.1)',
                        color: '#bbf7d0',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                        mb: result ? 2 : 0,
                      }}
                    >
                      Receitas importadas com sucesso!
                    </Alert>

                    {result && (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: '12px',
                          bgcolor: 'rgba(15, 23, 42, 0.35)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          color: '#e2e8f0',
                        }}
                      >
                        <Stack spacing={1}>
                          {typeof rowsMapped !== 'undefined' && (
                            <Typography sx={{ fontSize: '0.9rem' }}>
                              <strong>Linhas mapeadas:</strong> {rowsMapped}
                            </Typography>
                          )}

                          {typeof rowsInserted !== 'undefined' && (
                            <Typography sx={{ fontSize: '0.9rem' }}>
                              <strong>Linhas inseridas:</strong> {rowsInserted}
                            </Typography>
                          )}

                          {result?.message && (
                            <Typography sx={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                              {result.message}
                            </Typography>
                          )}
                        </Stack>
                      </Paper>
                    )}
                  </Box>
                </Fade>
              )}

              {state === 'error' && (
                <Fade in>
                  <Box sx={{ width: '100%' }}>
                    <Alert
                      icon={<ErrorOutlineIcon />}
                      severity="error"
                      sx={{
                        width: '100%',
                        borderRadius: '12px',
                        bgcolor: 'rgba(239, 68, 68, 0.1)',
                        color: '#fecaca',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        mb: result ? 2 : 0,
                      }}
                    >
                      {errorMessage || 'Erro ao processar arquivo de receita.'}
                    </Alert>

                    {result && (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: '12px',
                          bgcolor: 'rgba(15, 23, 42, 0.35)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          color: '#e2e8f0',
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '0.82rem',
                            color: '#cbd5e1',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {JSON.stringify(result, null, 2)}
                        </Typography>
                      </Paper>
                    )}
                  </Box>
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
            }}
          >
            <Button
              fullWidth
              variant="contained"
              onClick={onClose}
              disabled={isBlocking}
              sx={{
                py: 1.8,
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
                  color: 'rgba(255,255,255,0.3)',
                },
              }}
            >
              {state === 'uploading' ? 'Aguarde o processamento...' : 'Finalizar'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Dialog>
  );
}