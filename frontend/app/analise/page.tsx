'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Chip,
  Stack,
  Tooltip,
  Alert,
  Avatar,
  alpha,
  Fade,
  Paper,
  Badge,
  IconButton,
} from '@mui/material';

import {
  UploadFile as UploadFileIcon,
  InfoOutlined as InfoIcon,

  Badge as BadgeIcon,
  PersonSearch as PersonSearchIcon,
 
  Download as DownloadIcon,

  Verified as VerifiedIcon,
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';

import AppAlert, { AlertType } from '@/components/AppAlert';
import services from '@/services/service';

import AnaliseMargemXlsxUploadModal from '@/components/analise/AnaliseMargemXlsxUploadModal';

// --- PALETA DE CORES PREMIUM ---
const GOLD_PRIMARY = '#E6C969';
const GOLD_DARK = '#C4A052';
const GOLD_LIGHT = '#F5E6B8';
const DARK_BG = '#0F172A';
const WHITE = '#FFFFFF';
const GRAY_MAIN = '#64748B';
const GRAY_LIGHT = '#94A3B8';
const GRAY_EXTRA_LIGHT = '#F1F5F9';
const BORDER_LIGHT = 'rgba(100, 116, 139, 0.2)';
const TEXT_DARK = '#0F172A';

const STORAGE_KEY = 'selectedClient';

type SelectedClient = {
  id: number;
  code: string;
  name: string;
};

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

function pickApiError(data: any): string {
  if (!data) return 'Erro inesperado.';
  if (typeof data === 'string') return data;
  if (typeof data.detail === 'string') return data.detail;
  if (typeof data === 'object') {
    if (typeof data.details === 'string') return data.details;
    if (typeof data.error === 'string') return data.error;
    const firstKey = Object.keys(data)[0];
    const val = (data as any)[firstKey];
    if (Array.isArray(val) && val.length) return `${firstKey}: ${val[0]}`;
    if (typeof val === 'string') return `${firstKey}: ${val}`;
  }
  return 'Falha ao processar a requisição.';
}

export default function AnalisePage() {
  const router = useRouter();
  const [activeClient, setActiveClient] = useState<SelectedClient | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<AlertType>('info');

  /* XLSX IMPORT */
  const IMPORT_ENDPOINT = '/analise-margem/import-xlsx';
  const DEFAULT_CATEGORIA = 'ANALISE_MARGEM_XLSX';
  const XLSX_MODEL_PUBLIC_PATH = '/models_xlsx/Modelo_Análise_Margem.xlsx';

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [uploadFileSize, setUploadFileSize] = useState<number>(0);
  const [rowsMapped, setRowsMapped] = useState<number | undefined>(undefined);
  const [rowsInserted, setRowsInserted] = useState<number | undefined>(undefined);

  const showAlert = (message: string, severity: AlertType) => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  const closeUploadModal = () => {
    if (uploadState === 'uploading') return;
    setUploadOpen(false);
    setUploadState('idle');
    setUploadError('');
    setUploadFileName('');
    setUploadFileSize(0);
    setRowsMapped(undefined);
    setRowsInserted(undefined);
  };

  async function handleImportAnaliseMargemXlsx(file: File) {
    if (!activeClient) {
      showAlert('Selecione um cliente antes de importar.', 'warning');
      return;
    }

    const isXlsx =
      file.name.toLowerCase().endsWith('.xlsx') ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    if (!isXlsx) {
      showAlert('Arquivo inválido. Envie um .xlsx.', 'warning');
      return;
    }

    setUploadFileName(file.name);
    setUploadFileSize(file.size);
    setUploadError('');
    setRowsMapped(undefined);
    setRowsInserted(undefined);
    setUploadState('uploading');
    setUploadOpen(true);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('id_cliente', String(activeClient.id));
      fd.append('categoria', DEFAULT_CATEGORIA);

      const res = await services(IMPORT_ENDPOINT, {
        method: 'POST',
        data: fd,
      });

      if (!res.success) {
        const msg = pickApiError(res.data) || 'Falha ao importar XLSX.';
        setUploadError(msg);
        setUploadState('error');
        return;
      }

      const json = res.data || {};
      setRowsMapped(typeof json?.rows_mapped === 'number' ? json.rows_mapped : undefined);
      setRowsInserted(typeof json?.rows_inserted === 'number' ? json.rows_inserted : undefined);

      setUploadState('success');
      showAlert('Upload XLSX concluído. Retorno disponível no modal.', 'success');
    } catch (e: any) {
      setUploadError(e?.message || 'Erro inesperado ao importar XLSX.');
      setUploadState('error');
    }
  }

  const downloadXlsxModel = () => {
    try {
      const a = document.createElement('a');
      a.href = XLSX_MODEL_PUBLIC_PATH;
      a.download = 'modelo-analise-margem-sejaap.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      showAlert('Download do modelo XLSX iniciado.', 'info');
    } catch {
      showAlert('Não foi possível iniciar o download do modelo XLSX.', 'error');
    }
  };

  // Carrega cliente ativo do localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setActiveClient(null);
        return;
      }

      const parsed = JSON.parse(raw);
      if (parsed?.id && parsed?.code && parsed?.name) {
        setActiveClient({
          id: Number(parsed.id),
          code: String(parsed.code),
          name: String(parsed.name),
        });
      } else {
        setActiveClient(null);
      }
    } catch {
      setActiveClient(null);
    }
  }, []);

  // UI quando NÃO tem cliente selecionado
  if (!activeClient) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        bgcolor: GRAY_EXTRA_LIGHT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}>
        <Fade in timeout={500}>
          <Paper
            elevation={0}
            sx={{
              maxWidth: 520,
              width: '100%',
              borderRadius: 4,
              border: `1px solid ${BORDER_LIGHT}`,
              bgcolor: WHITE,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Box sx={{ height: 6, background: `linear-gradient(90deg, ${GOLD_PRIMARY}, ${GOLD_LIGHT})` }} />
            
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: alpha(GOLD_PRIMARY, 0.1),
                  color: GOLD_PRIMARY,
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <AnalyticsIcon sx={{ fontSize: 40 }} />
              </Avatar>

              <Typography variant="h4" sx={{ fontWeight: 700, color: TEXT_DARK, mb: 1 }}>
                Nenhum cliente selecionado
              </Typography>
              
              <Typography sx={{ color: GRAY_MAIN, mb: 4, maxWidth: 360, mx: 'auto' }}>
                Para importar análises de margem, primeiro selecione um cliente no menu lateral ou na lista de clientes.
              </Typography>

              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  startIcon={<PersonSearchIcon />}
                  onClick={() => router.push('/clients')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 4,
                    py: 1.2,
                    bgcolor: GOLD_PRIMARY,
                    color: TEXT_DARK,
                    '&:hover': {
                      bgcolor: GOLD_DARK,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 16px ${alpha(GOLD_PRIMARY, 0.3)}`,
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  Ir para Clientes
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => router.back()}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 4,
                    borderColor: BORDER_LIGHT,
                    color: GRAY_MAIN,
                    '&:hover': { borderColor: GOLD_PRIMARY, color: GOLD_PRIMARY },
                  }}
                >
                  Voltar
                </Button>
              </Stack>
            </CardContent>
          </Paper>
        </Fade>

        <AppAlert open={alertOpen} message={alertMessage} severity={alertSeverity} onClose={() => setAlertOpen(false)} />
      </Box>
    );
  }

  // UI normal com cliente ativo - usando 90% da tela
  return (
    <Box sx={{ bgcolor: GRAY_EXTRA_LIGHT, minHeight: '100vh', py: 3 }}>
      <Container maxWidth={false} sx={{ maxWidth: '90%', mx: 'auto' }}>
        {/* Header */}
        <Fade in timeout={500}>
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton
                onClick={() => router.back()}
                sx={{
                  border: `1px solid ${BORDER_LIGHT}`,
                  borderRadius: 2,
                  bgcolor: WHITE,
                  '&:hover': { borderColor: GOLD_PRIMARY, color: GOLD_PRIMARY },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                  Análise de Margem
                </Typography>
                <Typography variant="body1" sx={{ color: GRAY_MAIN }}>
                  Importação em lote via planilha XLSX
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Fade>

        {/* Main Card */}
        <Fade in timeout={600}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: `1px solid ${BORDER_LIGHT}`,
              bgcolor: WHITE,
              overflow: 'hidden',
              boxShadow: `0 20px 40px ${alpha(DARK_BG, 0.05)}`,
            }}
          >
            <Box sx={{ height: 6, background: `linear-gradient(90deg, ${GOLD_PRIMARY}, ${GOLD_LIGHT})` }} />

            <CardContent sx={{ p: 4 }}>
              {/* Cliente Ativo Card - Versão simplificada */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 4,
                  borderRadius: 3,
                  bgcolor: alpha(GOLD_PRIMARY, 0.03),
                  border: `1px solid ${alpha(GOLD_PRIMARY, 0.15)}`,
                }}
              >
                <Stack direction="row" spacing={2.5} alignItems="center">
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      <Avatar
                        sx={{
                          width: 22,
                          height: 22,
                          bgcolor: GOLD_PRIMARY,
                          color: TEXT_DARK,
                          border: `2px solid ${WHITE}`,
                        }}
                      >
                        <VerifiedIcon sx={{ fontSize: 14 }} />
                      </Avatar>
                    }
                  >
                    <Avatar
                      sx={{
                        width: 64,
                        height: 64,
                        bgcolor: alpha(GOLD_PRIMARY, 0.15),
                        color: GOLD_PRIMARY,
                        fontSize: '1.5rem',
                        fontWeight: 700,
                      }}
                    >
                      {activeClient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </Avatar>
                  </Badge>

                  <Box>
                    <Typography variant="caption" sx={{ color: GRAY_MAIN, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Cliente Ativo
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: TEXT_DARK, mt: 0.5 }}>
                      {activeClient.name}
                    </Typography>
                    <Chip
                      icon={<BadgeIcon sx={{ fontSize: '0.9rem' }} />}
                      label={`Código: ${activeClient.code}`}
                      size="small"
                      sx={{
                        mt: 1,
                        bgcolor: alpha(GOLD_PRIMARY, 0.1),
                        color: GOLD_PRIMARY,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    />
                  </Box>
                </Stack>
              </Paper>

              {/* Ações - Usando 2 colunas com tamanhos iguais */}
              <Grid container spacing={3}>
                {/* Card de Upload */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      borderRadius: 3,
                      border: `1px solid ${BORDER_LIGHT}`,
                      height: '100%',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': { borderColor: GOLD_PRIMARY, boxShadow: `0 8px 24px ${alpha(GOLD_PRIMARY, 0.1)}` },
                    }}
                  >
                    <Stack spacing={3} sx={{ height: '100%' }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: alpha(GOLD_PRIMARY, 0.1), color: GOLD_PRIMARY, width: 56, height: 56 }}>
                          <CloudUploadIcon sx={{ fontSize: 28 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                            Importar Planilha
                          </Typography>
                          <Typography variant="body2" sx={{ color: GRAY_MAIN }}>
                            Upload de arquivo XLSX com as análises de margem
                          </Typography>
                        </Box>
                      </Stack>

                      <Divider sx={{ borderColor: BORDER_LIGHT }} />

                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ color: GRAY_MAIN, mb: 2, fontWeight: 600 }}>
                          Formatos aceitos:
                        </Typography>
                        <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
                          <Chip 
                            icon={<DescriptionIcon />} 
                            label=".xlsx" 
                            sx={{ bgcolor: alpha(GRAY_MAIN, 0.05), fontWeight: 500 }} 
                          />
                        </Stack>

                        <Alert
                          severity="info"
                          icon={<InfoIcon />}
                          sx={{
                            borderRadius: 2,
                            bgcolor: alpha(GOLD_PRIMARY, 0.05),
                            color: GRAY_MAIN,
                            '& .MuiAlert-icon': { color: GOLD_PRIMARY },
                          }}
                        >
                          Baixe o modelo para garantir o formato correto da planilha.
                        </Alert>
                      </Box>

                      <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        startIcon={<UploadFileIcon />}
                        component="label"
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          borderRadius: 2,
                          py: 1.8,
                          bgcolor: GOLD_PRIMARY,
                          color: TEXT_DARK,
                          '&:hover': {
                            bgcolor: GOLD_DARK,
                            transform: 'translateY(-2px)',
                            boxShadow: `0 8px 16px ${alpha(GOLD_PRIMARY, 0.3)}`,
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        Selecionar Arquivo
                        <input
                          hidden
                          type="file"
                          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null;
                            if (f) handleImportAnaliseMargemXlsx(f);
                            e.currentTarget.value = '';
                          }}
                        />
                      </Button>
                    </Stack>
                  </Paper>
                </Grid>

                {/* Card de Informações */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      borderRadius: 3,
                      border: `1px solid ${BORDER_LIGHT}`,
                      height: '100%',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': { borderColor: GOLD_PRIMARY, boxShadow: `0 8px 24px ${alpha(GOLD_PRIMARY, 0.1)}` },
                    }}
                  >
                    <Stack spacing={3} sx={{ height: '100%' }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: alpha('#5e5e5e', 0.1), color: '#858585', width: 56, height: 56 }}>
                          <InfoIcon sx={{ fontSize: 28 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                            Informações
                          </Typography>
                          <Typography variant="body2" sx={{ color: GRAY_MAIN }}>
                            Detalhes sobre a importação
                          </Typography>
                        </Box>
                      </Stack>

                      <Divider sx={{ borderColor: BORDER_LIGHT }} />

                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ color: GRAY_MAIN, mb: 2, fontWeight: 600 }}>
                          Detalhes técnicos:
                        </Typography>
                        
                        <Stack spacing={2}>
                          

                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              bgcolor: alpha(GRAY_MAIN, 0.03),
                              border: `1px solid ${BORDER_LIGHT}`,
                            }}
                          >
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar sx={{ bgcolor: alpha(GOLD_PRIMARY, 0.1), color: GOLD_PRIMARY, width: 32, height: 32 }}>
                                <AnalyticsIcon fontSize="small" />
                              </Avatar>
                              <Box>
                                <Typography variant="caption" sx={{ color: GRAY_MAIN }}>
                                  Categoria
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: TEXT_DARK }}>
                                  {DEFAULT_CATEGORIA}
                                </Typography>
                              </Box>
                            </Stack>
                          </Paper>
                        </Stack>
                      </Box>

                      <Tooltip title="Baixar modelo XLSX" arrow>
                        <Button
                          variant="outlined"
                          fullWidth
                          size="large"
                          startIcon={<DownloadIcon />}
                          onClick={downloadXlsxModel}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: 2,
                            py: 1.8,
                            borderColor: BORDER_LIGHT,
                            color: TEXT_DARK,
                            '&:hover': {
                              borderColor: GOLD_PRIMARY,
                              color: GOLD_PRIMARY,
                              bgcolor: alpha(GOLD_PRIMARY, 0.05),
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
            </CardContent>
          </Card>
        </Fade>
      </Container>

      {/* Modal de Upload */}
      <AnaliseMargemXlsxUploadModal
        open={uploadOpen}
        state={uploadState}
        fileName={uploadFileName}
        fileSizeBytes={uploadFileSize}
        errorMessage={uploadError}
        rowsMapped={rowsMapped}
        rowsInserted={rowsInserted}
        categoria={DEFAULT_CATEGORIA}
        onClose={closeUploadModal}
      />

      <AppAlert open={alertOpen} message={alertMessage} severity={alertSeverity} onClose={() => setAlertOpen(false)} />
    </Box>
  );
}