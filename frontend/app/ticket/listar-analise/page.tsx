'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Chip,
  Stack,
  Tooltip,
  Avatar,
  alpha,
  Fade,
  Paper,
  IconButton,
  Grid,
  CircularProgress,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import {
  ArrowBack as ArrowBackIcon,
  Psychology as PsychologyIcon,
  Schedule as ScheduleIcon,
  FactCheck as FactCheckIcon,
  ReportProblem as ReportProblemIcon,
  Checklist as ChecklistIcon,
  Assessment as AssessmentIcon,
  Lightbulb as LightbulbIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';

import AppAlert, { AlertType } from '@/components/AppAlert';
import services from '@/services/service';

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

// Cores de status
const STATUS_COLORS = {
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  purple: '#8B5CF6',
};

const STORAGE_KEY = 'selectedClient';

type SelectedClient = {
  id: number;
  code: string;
  name: string;
};

type Evidencia = {
  detalhe: string;
  tipo: 'quantitativa' | 'qualitativa' | string;
};

type Analise = {
  id: number;
  user_id: number;
  aspecto_avaliado: string;
  created_at: string;
  situacao_identificada: string[];
  evidencias: Evidencia[];
  riscos_associados: string[];
  plano_de_acao: string[];
  categoria?: string;
};

type ApiResponse = {
  analises: Analise[];
  created_at_ref: string;
  user_id: number;
  categoria?: string;
  summary?: {
    year?: number;
    year_a?: number;
    year_b?: number;
    customer_ipca?: string | null;
  };
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getSelectedClientFromStorage(): SelectedClient | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.id && parsed?.code && parsed?.name) {
      return {
        id: Number(parsed.id),
        code: String(parsed.code),
        name: String(parsed.name),
      };
    }
  } catch {
    // ignore
  }
  return null;
}

function chipCountSx(kind: 'evidence' | 'risk' | 'action') {
  if (kind === 'evidence') {
    return {
      bgcolor: alpha(STATUS_COLORS.info, 0.1),
      color: STATUS_COLORS.info,
      borderColor: alpha(STATUS_COLORS.info, 0.2),
      fontWeight: 600,
    };
  }
  if (kind === 'risk') {
    return {
      bgcolor: alpha(STATUS_COLORS.error, 0.1),
      color: STATUS_COLORS.error,
      borderColor: alpha(STATUS_COLORS.error, 0.2),
      fontWeight: 600,
    };
  }
  if (kind === 'action') {
    return {
      bgcolor: alpha(STATUS_COLORS.success, 0.1),
      color: STATUS_COLORS.success,
      borderColor: alpha(STATUS_COLORS.success, 0.2),
      fontWeight: 600,
    };
  }
  return {
    bgcolor: alpha(GRAY_MAIN, 0.1),
    color: GRAY_MAIN,
    borderColor: alpha(GRAY_MAIN, 0.2),
    fontWeight: 600,
  };
}

function chipTipoSx(tipo: string) {
  if (tipo === 'quantitativa') {
    return {
      bgcolor: alpha(STATUS_COLORS.info, 0.1),
      color: STATUS_COLORS.info,
      borderColor: alpha(STATUS_COLORS.info, 0.2),
      fontWeight: 600,
    };
  }
  if (tipo === 'qualitativa') {
    return {
      bgcolor: alpha(GOLD_PRIMARY, 0.1),
      color: GOLD_PRIMARY,
      borderColor: alpha(GOLD_PRIMARY, 0.2),
      fontWeight: 600,
    };
  }
  return {
    bgcolor: alpha(GRAY_MAIN, 0.1),
    color: GRAY_MAIN,
    borderColor: alpha(GRAY_MAIN, 0.2),
    fontWeight: 600,
  };
}

export default function ListarAnaliseTicketPage() {
  const router = useRouter();
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [analises, setAnalises] = useState<Analise[]>([]);
  const [selected, setSelected] = useState<Analise | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [summary, setSummary] = useState<ApiResponse['summary'] | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<AlertType>('info');

  const showAlert = (message: string, severity: AlertType) => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  const loadAnalises = async () => {
    const client = getSelectedClientFromStorage();
    setSelectedClient(client);

    if (!client?.id) {
      setAnalises([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLastUpdated(new Date().toLocaleString());

    const params = new URLSearchParams({
      user_id: String(client.id),
    });

    const res = await services(`/ticket-medio/insights/saved/latest?${params.toString()}`, { method: 'GET' });

    if (!res.success) {
      setAnalises([]);
      setLoading(false);
      return;
    }

    const payload: ApiResponse | null = res.data as ApiResponse;
    setAnalises(payload?.analises || []);
    setSummary(payload?.summary || null);
    setLoading(false);
  };

  useEffect(() => {
    loadAnalises();
  }, []);

  const handleViewDetails = (analise: Analise) => {
    setSelected(analise);
    setModalOpen(true);
  };

  const totalEvidencias = analises.reduce((acc, a) => acc + (a.evidencias?.length || 0), 0);
  const totalRiscos = analises.reduce((acc, a) => acc + (a.riscos_associados?.length || 0), 0);
  const totalAcoes = analises.reduce((acc, a) => acc + (a.plano_de_acao?.length || 0), 0);

  if (!selectedClient) {
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
              boxShadow: `0 20px 40px ${alpha(DARK_BG, 0.1)}`,
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
                <AttachMoneyIcon sx={{ fontSize: 40 }} />
              </Avatar>

              <Typography variant="h4" sx={{ fontWeight: 700, color: TEXT_DARK, mb: 1 }}>
                Nenhum cliente selecionado
              </Typography>
              
              <Typography sx={{ color: GRAY_MAIN, mb: 4, maxWidth: 360, mx: 'auto' }}>
                Para visualizar as análises de ticket médio, primeiro selecione um cliente no menu lateral.
              </Typography>

              <Button
                variant="contained"
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
            </CardContent>
          </Paper>
        </Fade>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: GRAY_EXTRA_LIGHT, minHeight: '100vh' }}>
      {/* Header com gradiente */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(GOLD_PRIMARY, 0.05)} 0%, ${alpha(DARK_BG, 0.02)} 100%)`,
          borderBottom: `1px solid ${BORDER_LIGHT}`,
          pt: 3,
          pb: 2,
          mb: 3,
        }}
      >
        <Container maxWidth={false} sx={{ maxWidth: '95%', mx: 'auto' }}>
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
                Análises de Ticket Médio
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: alpha(GOLD_PRIMARY, 0.1),
                    color: GOLD_PRIMARY,
                  }}
                >
                  {selectedClient.name.charAt(0)}
                </Avatar>
                <Typography variant="body1" sx={{ color: GRAY_MAIN }}>
                  <strong>{selectedClient.name}</strong> • Código: {selectedClient.code}
                </Typography>
                {summary?.year && (
                  <Chip
                    size="small"
                    label={`Análise: ${summary.year}`}
                    sx={{ bgcolor: alpha(GOLD_PRIMARY, 0.1), color: GOLD_PRIMARY, fontWeight: 600 }}
                  />
                )}
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth={false} sx={{ maxWidth: '95%', mx: 'auto' }}>
        {/* Cards de Estatísticas */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: `1px solid ${BORDER_LIGHT}`,
                bgcolor: WHITE,
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 24px ${alpha(DARK_BG, 0.1)}` },
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: alpha(GOLD_PRIMARY, 0.1), color: GOLD_PRIMARY, width: 48, height: 48 }}>
                  <AssessmentIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" sx={{ color: GRAY_MAIN, fontWeight: 600 }}>
                    Total de Análises
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                    {analises.length}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: `1px solid ${BORDER_LIGHT}`,
                bgcolor: WHITE,
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 24px ${alpha(DARK_BG, 0.1)}` },
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: alpha(STATUS_COLORS.info, 0.1), color: STATUS_COLORS.info, width: 48, height: 48 }}>
                  <FactCheckIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" sx={{ color: GRAY_MAIN, fontWeight: 600 }}>
                    Evidências
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: STATUS_COLORS.info }}>
                    {totalEvidencias}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: `1px solid ${BORDER_LIGHT}`,
                bgcolor: WHITE,
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 24px ${alpha(DARK_BG, 0.1)}` },
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: alpha(STATUS_COLORS.error, 0.1), color: STATUS_COLORS.error, width: 48, height: 48 }}>
                  <ReportProblemIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" sx={{ color: GRAY_MAIN, fontWeight: 600 }}>
                    Riscos
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: STATUS_COLORS.error }}>
                    {totalRiscos}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: `1px solid ${BORDER_LIGHT}`,
                bgcolor: WHITE,
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 24px ${alpha(DARK_BG, 0.1)}` },
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: alpha(STATUS_COLORS.success, 0.1), color: STATUS_COLORS.success, width: 48, height: 48 }}>
                  <ChecklistIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" sx={{ color: GRAY_MAIN, fontWeight: 600 }}>
                    Ações
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: STATUS_COLORS.success }}>
                    {totalAcoes}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Card Principal */}
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
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    sx={{
                      bgcolor: alpha(GOLD_PRIMARY, 0.1),
                      color: GOLD_PRIMARY,
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                    }}
                  >
                    <PsychologyIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                      Análises Salvas
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                      <Chip
                        size="small"
                        label={`${analises.length} ${analises.length === 1 ? 'análise' : 'análises'}`}
                        sx={{ bgcolor: alpha(GOLD_PRIMARY, 0.1), color: GOLD_PRIMARY, fontWeight: 600 }}
                      />
                      {lastUpdated && (
                        <Typography variant="caption" sx={{ color: GRAY_LIGHT }}>
                          Última atualização: {lastUpdated}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                </Stack>

                <Tooltip title="Atualizar lista" arrow>
                  <IconButton
                    onClick={loadAnalises}
                    disabled={loading}
                    sx={{
                      border: `1px solid ${BORDER_LIGHT}`,
                      borderRadius: 2,
                      bgcolor: WHITE,
                      width: 40,
                      height: 40,
                      '&:hover': { borderColor: GOLD_PRIMARY, color: GOLD_PRIMARY },
                    }}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Divider sx={{ borderColor: BORDER_LIGHT, mb: 4 }} />

              {loading ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <CircularProgress size={60} sx={{ color: GOLD_PRIMARY, mb: 3 }} />
                  <Typography variant="h6" sx={{ color: GRAY_MAIN, fontWeight: 500 }}>
                    Carregando análises...
                  </Typography>
                </Box>
              ) : analises.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 6,
                    borderRadius: 3,
                    bgcolor: alpha(GRAY_MAIN, 0.02),
                    border: `1px dashed ${BORDER_LIGHT}`,
                    textAlign: 'center',
                  }}
                >
                  <LightbulbIcon sx={{ fontSize: 64, color: GRAY_LIGHT, opacity: 0.5, mb: 2 }} />
                  <Typography variant="h5" sx={{ fontWeight: 600, color: TEXT_DARK, mb: 1 }}>
                    Nenhuma análise encontrada
                  </Typography>
                  <Typography sx={{ color: GRAY_MAIN, mb: 3 }}>
                    Gere uma nova análise no componente de IA para começar.
                  </Typography>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {analises.map((analise, index) => (
                    <Grid size={{ xs: 12, md: 6, lg: 4 }} key={analise.id}>
                      <Fade in timeout={300 + index * 50}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 3,
                            borderRadius: 3,
                            border: `1px solid ${BORDER_LIGHT}`,
                            height: '100%',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: `0 12px 32px ${alpha(DARK_BG, 0.12)}`,
                              borderColor: GOLD_PRIMARY,
                            },
                          }}
                          onClick={() => handleViewDetails(analise)}
                        >
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              height: 4,
                              background: `linear-gradient(90deg, ${GOLD_PRIMARY}, ${alpha(GOLD_PRIMARY, 0.3)})`,
                            }}
                          />

                          <Stack spacing={2.5}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                              <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar
                                  sx={{
                                    width: 48,
                                    height: 48,
                                    bgcolor: alpha(GOLD_PRIMARY, 0.1),
                                    color: GOLD_PRIMARY,
                                    borderRadius: 2,
                                  }}
                                >
                                  <AssessmentIcon />
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                                    {analise.aspecto_avaliado}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: GRAY_LIGHT }}>
                                    {formatDateShort(analise.created_at)}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Stack>

                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: GRAY_MAIN, 
                                lineHeight: 1.6,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {analise.situacao_identificada?.[0] || 'Sem descrição'}
                            </Typography>

                            <Divider sx={{ borderColor: BORDER_LIGHT }} />

                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                              <Badge
                                badgeContent={analise.evidencias?.length || 0}
                                color="info"
                                sx={{
                                  '& .MuiBadge-badge': { 
                                    bgcolor: STATUS_COLORS.info,
                                    color: WHITE,
                                    fontWeight: 600,
                                  },
                                }}
                              >
                                <Chip
                                  icon={<FactCheckIcon />}
                                  label="Evidências"
                                  size="small"
                                  sx={{
                                    bgcolor: alpha(STATUS_COLORS.info, 0.1),
                                    color: STATUS_COLORS.info,
                                    fontWeight: 600,
                                    border: 'none',
                                  }}
                                />
                              </Badge>

                              <Badge
                                badgeContent={analise.riscos_associados?.length || 0}
                                color="error"
                                sx={{
                                  '& .MuiBadge-badge': { 
                                    bgcolor: STATUS_COLORS.error,
                                    color: WHITE,
                                    fontWeight: 600,
                                  },
                                }}
                              >
                                <Chip
                                  icon={<ReportProblemIcon />}
                                  label="Riscos"
                                  size="small"
                                  sx={{
                                    bgcolor: alpha(STATUS_COLORS.error, 0.1),
                                    color: STATUS_COLORS.error,
                                    fontWeight: 600,
                                    border: 'none',
                                  }}
                                />
                              </Badge>

                              <Badge
                                badgeContent={analise.plano_de_acao?.length || 0}
                                color="success"
                                sx={{
                                  '& .MuiBadge-badge': { 
                                    bgcolor: STATUS_COLORS.success,
                                    color: WHITE,
                                    fontWeight: 600,
                                  },
                                }}
                              >
                                <Chip
                                  icon={<ChecklistIcon />}
                                  label="Ações"
                                  size="small"
                                  sx={{
                                    bgcolor: alpha(STATUS_COLORS.success, 0.1),
                                    color: STATUS_COLORS.success,
                                    fontWeight: 600,
                                    border: 'none',
                                  }}
                                />
                              </Badge>
                            </Stack>

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <Tooltip title="Ver detalhes">
                                <VisibilityIcon sx={{ color: GRAY_LIGHT, fontSize: 20 }} />
                              </Tooltip>
                            </Box>
                          </Stack>
                        </Paper>
                      </Fade>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Fade>
      </Container>

      {/* Modal de Detalhes */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        fullWidth
        maxWidth="lg"
        TransitionComponent={Fade}
        transitionDuration={400}
        PaperProps={{
          sx: {
            width: '80%',
            maxWidth: '1000px',
            bgcolor: WHITE,
            borderRadius: 4,
            overflow: 'hidden',
            border: `1px solid ${alpha(GOLD_PRIMARY, 0.1)}`,
            boxShadow: `0 32px 64px ${alpha(DARK_BG, 0.2)}`,
          },
        }}
      >
        <Box sx={{ height: 6, background: `linear-gradient(90deg, ${GOLD_PRIMARY}, ${GOLD_LIGHT})` }} />

        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{ px: 4, py: 3, bgcolor: WHITE }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  sx={{
                    bgcolor: alpha(GOLD_PRIMARY, 0.1),
                    color: GOLD_PRIMARY,
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                  }}
                >
                  <PsychologyIcon sx={{ fontSize: 28 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                    {selected?.aspecto_avaliado || 'Detalhes da Análise'}
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                    <Chip
                      icon={<ScheduleIcon />}
                      label={selected?.created_at ? formatDate(selected.created_at) : '-'}
                      size="small"
                      sx={{ bgcolor: alpha(GRAY_MAIN, 0.05), color: GRAY_MAIN }}
                    />
                  </Stack>
                </Box>
              </Stack>

              <IconButton
                onClick={() => setModalOpen(false)}
                sx={{
                  border: `1px solid ${BORDER_LIGHT}`,
                  borderRadius: 2,
                  '&:hover': { borderColor: GOLD_PRIMARY, color: GOLD_PRIMARY },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Stack>
          </Box>
          <Divider sx={{ borderColor: BORDER_LIGHT }} />
        </DialogTitle>

        <DialogContent sx={{ bgcolor: WHITE, p: 4 }}>
          {selected && (
            <Fade in timeout={500}>
              <Stack spacing={4}>
                {/* Situação Identificada */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: alpha(GOLD_PRIMARY, 0.02),
                    border: `1px solid ${alpha(GOLD_PRIMARY, 0.15)}`,
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: TEXT_DARK, mb: 1 }}>
                    Situação Identificada
                  </Typography>
                  <Stack spacing={1}>
                    {selected.situacao_identificada?.map((sit, idx) => (
                      <Typography key={idx} variant="body1" sx={{ color: GRAY_MAIN, lineHeight: 1.6 }}>
                        • {sit}
                      </Typography>
                    ))}
                  </Stack>
                </Paper>

                {/* Evidências */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: TEXT_DARK, mb: 2 }}>
                    Evidências
                  </Typography>
                  <Grid container spacing={2}>
                    {selected.evidencias?.map((ev, idx) => (
                      <Grid size={{ xs: 12, md: 6 }} key={`${selected.id}-ev-${idx}`}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2.5,
                            borderRadius: 3,
                            border: `1px solid ${BORDER_LIGHT}`,
                            bgcolor: WHITE,
                            height: '100%',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: `0 8px 16px ${alpha(DARK_BG, 0.05)}`,
                              borderColor: GOLD_PRIMARY,
                            },
                          }}
                        >
                          <Stack spacing={1.5}>
                            <Chip
                              label={ev.tipo === 'quantitativa' ? '📊 Quantitativa' : '📝 Qualitativa'}
                              size="small"
                              sx={chipTipoSx(ev.tipo)}
                            />
                            <Typography variant="body2" sx={{ color: TEXT_DARK, lineHeight: 1.6 }}>
                              {ev.detalhe}
                            </Typography>
                          </Stack>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                {/* Riscos e Planos */}
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        bgcolor: alpha(STATUS_COLORS.error, 0.02),
                        border: `1px solid ${alpha(STATUS_COLORS.error, 0.15)}`,
                        height: '100%',
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                        <Avatar sx={{ bgcolor: alpha(STATUS_COLORS.error, 0.1), color: STATUS_COLORS.error }}>
                          <ReportProblemIcon />
                        </Avatar>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                          Riscos Associados
                        </Typography>
                      </Stack>

                      <Stack spacing={1.5}>
                        {selected.riscos_associados?.map((risco, idx) => (
                          <Paper
                            key={`${selected.id}-r-${idx}`}
                            elevation={0}
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: WHITE,
                              border: `1px solid ${BORDER_LIGHT}`,
                            }}
                          >
                            <Typography variant="body2" sx={{ color: GRAY_MAIN }}>
                              • {risco}
                            </Typography>
                          </Paper>
                        ))}
                      </Stack>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        bgcolor: alpha(STATUS_COLORS.success, 0.02),
                        border: `1px solid ${alpha(STATUS_COLORS.success, 0.15)}`,
                        height: '100%',
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                        <Avatar sx={{ bgcolor: alpha(STATUS_COLORS.success, 0.1), color: STATUS_COLORS.success }}>
                          <ChecklistIcon />
                        </Avatar>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                          Plano de Ação
                        </Typography>
                      </Stack>

                      <Stack spacing={1.5}>
                        {selected.plano_de_acao?.map((acao, idx) => (
                          <Paper
                            key={`${selected.id}-p-${idx}`}
                            elevation={0}
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: WHITE,
                              border: `1px solid ${BORDER_LIGHT}`,
                            }}
                          >
                            <Typography variant="body2" sx={{ color: GRAY_MAIN }}>
                              • {acao}
                            </Typography>
                          </Paper>
                        ))}
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
              </Stack>
            </Fade>
          )}
        </DialogContent>

        <Divider sx={{ borderColor: BORDER_LIGHT }} />

        <DialogActions sx={{ px: 4, py: 2.5, bgcolor: WHITE }}>
          <Button
            onClick={() => setModalOpen(false)}
            variant="outlined"
            size="large"
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
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      <AppAlert open={alertOpen} message={alertMessage} severity={alertSeverity} onClose={() => setAlertOpen(false)} />
    </Box>
  );
}