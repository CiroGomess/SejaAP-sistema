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
} from '@mui/material';

import {
  Close as CloseIcon,
  UploadFile as UploadFileIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorOutlineIcon,
  HourglassTop as HourglassTopIcon,
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

  onClose: () => void; // só deve fechar quando success OU error
};

function formatBytes(bytes?: number) {
  if (!bytes || bytes <= 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let u = 0;
  while (size >= 1024 && u < units.length - 1) {
    size = size / 1024;
    u++;
  }
  return `${size.toFixed(u === 0 ? 0 : 2)} ${units[u]}`;
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
    <Dialog open={open} fullScreen>
      <Box
        sx={{
          height: '100%',
          bgcolor: '#0b1220',
          backgroundImage: 'radial-gradient(circle at 25% 20%, rgba(255,102,0,0.16), transparent 42%)',
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
            maxWidth: 920,
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
            bgcolor: 'rgba(17,24,39,0.78)',
            backdropFilter: 'blur(10px)',
            color: '#fff',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <UploadFileIcon sx={{ color: '#ff6600' }} />
                <AssessmentIcon sx={{ color: 'rgba(255,255,255,0.75)' }} />
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 950, fontSize: 18 }}>
                  Importação XLSX — Análise de Margem
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.70)', fontSize: 13 }}>
                  O upload é enviado ao backend e a tela fica bloqueada até finalizar.
                </Typography>
              </Box>
            </Box>

            <IconButton
              onClick={onClose}
              disabled={isBlocking}
              sx={{
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 2,
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

          {/* Body */}
          <Box sx={{ p: 3 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                border: '1px solid rgba(255,255,255,0.10)',
                bgcolor: 'rgba(255,255,255,0.04)',
              }}
            >
              <Typography sx={{ fontWeight: 900, mb: 1 }}>Arquivo selecionado</Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  label={fileName ? fileName : '—'}
                  sx={{
                    bgcolor: 'rgba(255,102,0,0.14)',
                    color: '#fff',
                    fontWeight: 900,
                    borderRadius: 2,
                  }}
                />
                <Chip
                  label={`Tamanho: ${formatBytes(fileSizeBytes)}`}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.06)',
                    color: '#fff',
                    fontWeight: 800,
                    borderRadius: 2,
                  }}
                />
                {categoria && (
                  <Chip
                    label={`Categoria: ${categoria}`}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.06)',
                      color: '#fff',
                      fontWeight: 800,
                      borderRadius: 2,
                    }}
                  />
                )}
              </Box>
            </Box>

            <Box sx={{ mt: 2 }}>
              {state === 'uploading' && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    borderRadius: 3,
                    border: '1px solid rgba(255,102,0,0.25)',
                    bgcolor: 'rgba(255,102,0,0.10)',
                  }}
                >
                  <CircularProgress />
                  <Box>
                    <Typography sx={{ fontWeight: 950 }}>Processando importação…</Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
                      Não feche a página. A importação pode levar alguns segundos dependendo do tamanho da planilha.
                    </Typography>
                  </Box>
                  <HourglassTopIcon sx={{ ml: 'auto', color: 'rgba(255,255,255,0.55)' }} />
                </Box>
              )}

              {state === 'success' && (
                <Box>
                  <Alert
                    icon={<CheckCircleIcon />}
                    severity="success"
                    sx={{
                      mt: 2,
                      borderRadius: 3,
                      bgcolor: 'rgba(34,197,94,0.14)',
                      color: '#d1fae5',
                      border: '1px solid rgba(34,197,94,0.22)',
                      '& .MuiAlert-icon': { color: '#22c55e' },
                    }}
                  >
                    Upload concluído com sucesso. Os dados foram processados pelo backend.
                  </Alert>

                  {(typeof rowsMapped === 'number' || typeof rowsInserted === 'number') && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        borderRadius: 3,
                        border: '1px solid rgba(255,255,255,0.10)',
                        bgcolor: 'rgba(255,255,255,0.04)',
                      }}
                    >
                      <Typography sx={{ fontWeight: 900, mb: 1 }}>Resumo do processamento</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <Chip
                          label={`Linhas mapeadas: ${typeof rowsMapped === 'number' ? rowsMapped : '-'}`}
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.06)',
                            color: '#fff',
                            fontWeight: 800,
                            borderRadius: 2,
                          }}
                        />
                        <Chip
                          label={`Linhas inseridas: ${typeof rowsInserted === 'number' ? rowsInserted : '-'}`}
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.06)',
                            color: '#fff',
                            fontWeight: 800,
                            borderRadius: 2,
                          }}
                        />
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {state === 'error' && (
                <Alert
                  icon={<ErrorOutlineIcon />}
                  severity="error"
                  sx={{
                    mt: 2,
                    borderRadius: 3,
                    bgcolor: 'rgba(239,68,68,0.14)',
                    color: '#fee2e2',
                    border: '1px solid rgba(239,68,68,0.22)',
                    '& .MuiAlert-icon': { color: '#ef4444' },
                  }}
                >
                  Falha ao importar o XLSX. {errorMessage ? `Detalhes: ${errorMessage}` : ''}
                </Alert>
              )}
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

          {/* Footer */}
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            {(state === 'success' || state === 'error') && (
              <Button
                variant="contained"
                onClick={onClose}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 3,
                  fontWeight: 950,
                  bgcolor: '#ff6600',
                  '&:hover': { bgcolor: '#ff7a1a' },
                }}
              >
                Fechar
              </Button>
            )}

            {state === 'uploading' && (
              <Button
                variant="outlined"
                disabled
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 3,
                  fontWeight: 950,
                  borderColor: 'rgba(255,255,255,0.18)',
                  color: 'rgba(255,255,255,0.65)',
                }}
              >
                Processando…
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    </Dialog>
  );
}
