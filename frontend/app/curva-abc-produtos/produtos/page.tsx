'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Toolbar,
  IconButton,
  TextField,
  Divider,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Stack,
  Tooltip,
  Avatar,
  MenuItem,
  alpha,
  Fade,
  Container,
  Grid,
  Badge,
  Button
} from '@mui/material';

import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Category as CategoryIcon,
  AttachMoney as AttachMoneyIcon,
  Timeline as TimelineIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';

import AppAlert, { AlertType } from '../../../components/AppAlert';
import services from '@/services/service';

import AnaliseCurvaABC_IA from '../../../components/curva-abc-produto/analiseCurvaABC_IA';
import GamaPresentationGenerator from '../../../components/curva-abc-produto/GamaPresentationGenerator';

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
const ENDPOINT = '/curva-abc-produtos';

type SelectedClient = {
  id: string;
  code: string;
  name: string;
};

type ABCItem = {
  rank: number;
  produto_ou_servico: string | null;
  nome_produto_ou_servico: string | null;
  total_valor: string;
  pct: string;
  pct_acumulado: string;
  classe: 'A' | 'B' | 'C' | string;
  qtd_2024: string;
  qtd_2025: string;
  delta_qtd: string;
  ticket_2024: string;
  ticket_2025: string;
  delta_ticket_pct: string | null;
};

type Pagination = {
  page: number;
  per_page: number;
  items_on_page: number;
  total_items: number;
  total_pages: number;
};

type Summary = {
  user_id: string;
  total_valor: string;
  a_limit: string;
  b_limit: string;
  date_from: string | null;
  date_to: string | null;
  q: string | null;
};

type YearSummaryResponse = {
  available_years: number[];
  selected_year: number;
  summary: {
    faturamento_total: string;
    qtd_produtos_a: number;
    qtd_produtos_b: number;
    qtd_produtos_c: number;
  };
};

function getSelectedClientFromStorage(): SelectedClient | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (parsed?.id && parsed?.code && parsed?.name) {
      return {
        id: String(parsed.id).trim(),
        code: String(parsed.code).trim(),
        name: String(parsed.name).trim(),
      };
    }
  } catch {
    return null;
  }

  return null;
}

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

function toNumberSafe(v: string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function moneyBRFromString(v: string | null | undefined): string {
  const n = toNumberSafe(v);
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function qtyFromString(v: string | null | undefined): string {
  const n = toNumberSafe(v);
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

function percentFromString(v: string | null | undefined): string {
  const n = toNumberSafe(v);
  return `${n.toFixed(2)}%`;
}

const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: WHITE,
    borderRadius: 2,
    transition: 'all 0.2s ease',
    '& fieldset': {
      borderColor: BORDER_LIGHT,
      borderWidth: '1.5px',
    },
    '&:hover fieldset': {
      borderColor: GRAY_MAIN,
    },
    '&.Mui-focused': {
      '& fieldset': {
        borderColor: GOLD_PRIMARY,
        borderWidth: '2px',
      },
      '& .MuiInputAdornment-root .MuiSvgIcon-root': {
        color: GOLD_PRIMARY,
      },
    },
    '& .MuiInputBase-input': {
      color: TEXT_DARK,
      fontWeight: 500,
      fontSize: '0.95rem',
      padding: '12px 14px',
    },
  },
  '& .MuiInputLabel-root': {
    color: GRAY_MAIN,
    fontWeight: 500,
    fontSize: '0.9rem',
    '&.Mui-focused': {
      color: GOLD_PRIMARY,
      fontWeight: 600,
    },
  },
} as const;

function classeChipSx(classe: string) {
  if (classe === 'A') {
    return {
      bgcolor: alpha(STATUS_COLORS.success, 0.1),
      color: STATUS_COLORS.success,
      borderColor: alpha(STATUS_COLORS.success, 0.2),
      fontWeight: 700,
    };
  }
  if (classe === 'B') {
    return {
      bgcolor: alpha(GOLD_PRIMARY, 0.1),
      color: GOLD_PRIMARY,
      borderColor: alpha(GOLD_PRIMARY, 0.2),
      fontWeight: 700,
    };
  }
  return {
    bgcolor: alpha(STATUS_COLORS.warning, 0.1),
    color: STATUS_COLORS.warning,
    borderColor: alpha(STATUS_COLORS.warning, 0.2),
    fontWeight: 700,
  };
}

export default function CurvaABCProdutosPage() {
  const [activeClient, setActiveClient] = useState<SelectedClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ABCItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const [search, setSearch] = useState('');
  const [q, setQ] = useState<string>('');
  const qDebounceRef = useRef<any>(null);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<10 | 50 | 100>(10);

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<AlertType>('info');


  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [yearSummary, setYearSummary] = useState<YearSummaryResponse['summary'] | null>(null);
  const [loadingYearSummary, setLoadingYearSummary] = useState(false);

  const showAlert = (message: string, severity: AlertType) => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  useEffect(() => {
    const c = getSelectedClientFromStorage();
    setActiveClient(c);
  }, []);

  useEffect(() => {
    if (qDebounceRef.current) clearTimeout(qDebounceRef.current);
    qDebounceRef.current = setTimeout(() => {
      setPage(1);
      setQ(search.trim());
    }, 350);

    return () => {
      if (qDebounceRef.current) clearTimeout(qDebounceRef.current);
    };
  }, [search]);

  const loadABC = async () => {
    const client = getSelectedClientFromStorage();
    setActiveClient(client);

    if (!client?.id) {
      setItems([]);
      setPagination(null);
      setSummary(null);
      setLoading(false);
      showAlert('Selecione um cliente no menu lateral para visualizar a Curva ABC.', 'warning');
      return;
    }

    const userId = String(client.id).trim();

    if (!userId) {
      setItems([]);
      setPagination(null);
      setSummary(null);
      setLoading(false);
      showAlert('Cliente selecionado inválido (id).', 'error');
      return;
    }

    setLoading(true);
    setLastUpdated(new Date().toLocaleString());

    const params = new URLSearchParams({
      user_id: userId,
      page: String(page),
      per_page: String(perPage),
    });

    if (q) params.set('q', q);

    const res = await services(`${ENDPOINT}?${params.toString()}&tipo=produto`, { method: 'GET' });

    if (!res.success) {
      showAlert(pickApiError(res.data), 'error');
      setItems([]);
      setPagination(null);
      setSummary(null);
      setLoading(false);
      return;
    }

    const list: ABCItem[] = Array.isArray(res.data?.items) ? res.data.items : [];
    const pg: Pagination | null = res.data?.pagination ?? null;
    const sm: Summary | null = res.data?.summary ?? null;

    setItems(list);
    setPagination(pg);
    setSummary(sm);
    setLoading(false);
  };

  useEffect(() => {
    loadABC();
  }, [page, perPage, q]);

  const pageLabel = useMemo(() => {
    const p = pagination?.page ?? page;
    const tp = pagination?.total_pages ?? 0;
    return tp > 0 ? `Página ${p} de ${tp}` : `Página ${p}`;
  }, [pagination, page]);

  const canPrev = (pagination?.page ?? page) > 1;
  const canNext = pagination ? pagination.page < pagination.total_pages : false;

  const totalPagina = useMemo(() => {
    return items.reduce((acc, it) => acc + toNumberSafe(it.total_valor), 0);
  }, [items]);

  const countA = useMemo(() => items.filter((x) => x.classe === 'A').length, [items]);
  const countB = useMemo(() => items.filter((x) => x.classe === 'B').length, [items]);
  const countC = useMemo(() => items.filter((x) => x.classe === 'C').length, [items]);


  const loadYearSummary = async (yearParam?: number) => {
    const client = getSelectedClientFromStorage();
    setActiveClient(client);

    if (!client?.id) {
      setYearSummary(null);
      setAvailableYears([]);
      return;
    }

    const userId = String(client.id).trim();
    if (!userId) {
      setYearSummary(null);
      setAvailableYears([]);
      return;
    }

    const yearToUse = yearParam ?? selectedYear;

    setLoadingYearSummary(true);

    const params = new URLSearchParams({
      user_id: String(userId),
      year: String(yearToUse),
    });

    const res = await services(`/curva-abc-summary?${params.toString()}`, { method: 'GET' });

    if (!res.success) {
      showAlert(pickApiError(res.data), 'error');
      setYearSummary(null);
      setAvailableYears([]);
      setLoadingYearSummary(false);
      return;
    }

    const data = res.data as YearSummaryResponse;

    setAvailableYears(Array.isArray(data?.available_years) ? data.available_years : []);
    setYearSummary(data?.summary ?? null);

    if (data?.selected_year && data.selected_year !== selectedYear) {
      setSelectedYear(data.selected_year);
    }

    setLoadingYearSummary(false);
  };

  useEffect(() => {
    if (!activeClient?.id) return;
    loadYearSummary(selectedYear);
  }, [activeClient?.id, selectedYear]);

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
                <CategoryIcon sx={{ fontSize: 40 }} />
              </Avatar>

              <Typography variant="h4" sx={{ fontWeight: 700, color: TEXT_DARK, mb: 1 }}>
                Nenhum cliente selecionado
              </Typography>

              <Typography sx={{ color: GRAY_MAIN, mb: 4, maxWidth: 360, mx: 'auto' }}>
                Para visualizar a Curva ABC, primeiro selecione um cliente no menu lateral.
              </Typography>

              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  startIcon={<PersonIcon />}
                  onClick={() => window.location.href = '/clients'}
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
                  onClick={() => window.history.back()}
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

  return (
    <Box sx={{ bgcolor: GRAY_EXTRA_LIGHT, minHeight: '100vh', py: 4 }}>
      <Container maxWidth={false} sx={{ maxWidth: '95%', mx: 'auto' }}>
        {/* Header */}
        <Fade in timeout={500}>
          <Box sx={{ mb: 4 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
              <IconButton
                onClick={() => window.history.back()}
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
                  Curva ABC - Produtos/Serviços
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: alpha(GOLD_PRIMARY, 0.1),
                      color: GOLD_PRIMARY,
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Typography variant="body1" sx={{ color: GRAY_MAIN }}>
                    <strong>{activeClient.name}</strong> • Código: {activeClient.code}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Box>
        </Fade>

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
              {/* Cliente Ativo Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 4,
                  borderRadius: 4,
                  bgcolor: alpha(GOLD_PRIMARY, 0.02),
                  border: `1px solid ${alpha(GOLD_PRIMARY, 0.1)}`,
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
                    bgcolor: alpha(GOLD_PRIMARY, 0.03),
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
                              width: 80,
                              height: 80,
                              bgcolor: alpha(GOLD_PRIMARY, 0.15),
                              color: GOLD_PRIMARY,
                              fontSize: '2rem',
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
                          <Typography variant="h4" sx={{ fontWeight: 700, color: TEXT_DARK, mt: 0.5 }}>
                            {activeClient.name}
                          </Typography>
                        </Box>
                      </Stack>

                      {/* Linha 2: Informações em Cards (2x2) */}

                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                        spacing={2}
                        sx={{ mb: 2 }}
                      >
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              color: GRAY_MAIN,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: 0.6,
                              mb: 0.5,
                            }}
                          >
                            Resumo por ano
                          </Typography>
                          <Typography variant="body2" sx={{ color: GRAY_LIGHT }}>
                            Os cards abaixo refletem os dados do ano selecionado.
                          </Typography>
                        </Box>

                        <TextField
                          size="small"
                          select
                          label="Ano"
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(Number(e.target.value))}
                          sx={{ width: { xs: '100%', sm: 160 }, ...inputSx }}
                        >
                          {availableYears.map((year) => (
                            <MenuItem key={year} value={year}>
                              {year}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Stack>
                      <Grid container spacing={2}>
                        {/* Card 1 - Total */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2.5,
                              borderRadius: 3,
                              height: '10em',
                              background: `linear-gradient(135deg, ${alpha(STATUS_COLORS.success, 0.02)} 0%, ${alpha(STATUS_COLORS.success, 0.05)} 100%)`,
                              border: `1px solid ${alpha(STATUS_COLORS.success, 0.15)}`,
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              position: 'relative',
                              overflow: 'hidden',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 3,
                                background: `linear-gradient(90deg, ${STATUS_COLORS.success}, ${alpha(STATUS_COLORS.success, 0.3)})`,
                              },
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 12px 24px -8px ${alpha(STATUS_COLORS.success, 0.2)}`,
                                borderColor: alpha(STATUS_COLORS.success, 0.3),
                              },
                            }}
                          >
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ height: '100%' }}>
                              <Avatar
                                sx={{
                                  bgcolor: alpha(STATUS_COLORS.success, 0.1),
                                  color: STATUS_COLORS.success,
                                  width: 48,
                                  height: 48,
                                  borderRadius: 2,
                                }}
                              >
                                <AttachMoneyIcon />
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" sx={{ color: GRAY_MAIN, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                  Total do Cliente
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: TEXT_DARK, mt: 0.5, lineHeight: 1.2 }}>
                                  {yearSummary?.faturamento_total ? moneyBRFromString(yearSummary.faturamento_total) : 'R$ 0,00'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: GRAY_LIGHT, display: 'block', mt: 0.5 }}>
                                  Faturamento total
                                </Typography>
                              </Box>
                            </Stack>
                          </Paper>
                        </Grid>

                        {/* Card 2 - Classe A */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2.5,
                              borderRadius: 3,
                              height: '10em',
                              background: `linear-gradient(135deg, ${alpha(STATUS_COLORS.success, 0.02)} 0%, ${alpha(STATUS_COLORS.success, 0.05)} 100%)`,
                              border: `1px solid ${alpha(STATUS_COLORS.success, 0.15)}`,
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              position: 'relative',
                              overflow: 'hidden',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 3,
                                background: `linear-gradient(90deg, ${STATUS_COLORS.success}, ${alpha(STATUS_COLORS.success, 0.3)})`,
                              },
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 12px 24px -8px ${alpha(STATUS_COLORS.success, 0.2)}`,
                                borderColor: alpha(STATUS_COLORS.success, 0.3),
                              },
                            }}
                          >
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ height: '100%' }}>
                              <Avatar
                                sx={{
                                  bgcolor: alpha(STATUS_COLORS.success, 0.1),
                                  color: STATUS_COLORS.success,
                                  width: 48,
                                  height: 48,
                                  borderRadius: 2,
                                }}
                              >
                                <TrendingUpIcon />
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" sx={{ color: GRAY_MAIN, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                  Classe A
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: STATUS_COLORS.success, mt: 0.5, lineHeight: 1.2 }}>
                                  {loadingYearSummary ? '...' : `${yearSummary?.qtd_produtos_a ?? 0} itens`}
                                </Typography>
                                <Typography variant="caption" sx={{ color: GRAY_LIGHT, display: 'block', mt: 0.5 }}>
                                  Maior relevância
                                </Typography>
                              </Box>
                            </Stack>
                          </Paper>
                        </Grid>

                        {/* Card 3 - Classe B */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2.5,
                              borderRadius: 3,
                              height: '10em',
                              background: `linear-gradient(135deg, ${alpha(GOLD_PRIMARY, 0.02)} 0%, ${alpha(GOLD_PRIMARY, 0.05)} 100%)`,
                              border: `1px solid ${alpha(GOLD_PRIMARY, 0.15)}`,
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              position: 'relative',
                              overflow: 'hidden',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 3,
                                background: `linear-gradient(90deg, ${GOLD_PRIMARY}, ${alpha(GOLD_PRIMARY, 0.3)})`,
                              },
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 12px 24px -8px ${alpha(GOLD_PRIMARY, 0.2)}`,
                                borderColor: alpha(GOLD_PRIMARY, 0.3),
                              },
                            }}
                          >
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ height: '100%' }}>
                              <Avatar
                                sx={{
                                  bgcolor: alpha(GOLD_PRIMARY, 0.1),
                                  color: GOLD_PRIMARY,
                                  width: 48,
                                  height: 48,
                                  borderRadius: 2,
                                }}
                              >
                                <TimelineIcon />
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" sx={{ color: GRAY_MAIN, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                  Classe B
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: GOLD_PRIMARY, mt: 0.5, lineHeight: 1.2 }}>
                                  {loadingYearSummary ? '...' : `${yearSummary?.qtd_produtos_b ?? 0} itens`}
                                </Typography>
                                <Typography variant="caption" sx={{ color: GRAY_LIGHT, display: 'block', mt: 0.5 }}>
                                  Relevância intermediária
                                </Typography>
                              </Box>
                            </Stack>
                          </Paper>
                        </Grid>

                        {/* Card 4 - Classe C */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2.5,
                              borderRadius: 3,
                              height: '10em',
                              background: `linear-gradient(135deg, ${alpha(STATUS_COLORS.warning, 0.02)} 0%, ${alpha(STATUS_COLORS.warning, 0.05)} 100%)`,
                              border: `1px solid ${alpha(STATUS_COLORS.warning, 0.15)}`,
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              position: 'relative',
                              overflow: 'hidden',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 3,
                                background: `linear-gradient(90deg, ${STATUS_COLORS.warning}, ${alpha(STATUS_COLORS.warning, 0.3)})`,
                              },
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 12px 24px -8px ${alpha(STATUS_COLORS.warning, 0.2)}`,
                                borderColor: alpha(STATUS_COLORS.warning, 0.3),
                              },
                            }}
                          >
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ height: '100%' }}>
                              <Avatar
                                sx={{
                                  bgcolor: alpha(STATUS_COLORS.warning, 0.1),
                                  color: STATUS_COLORS.warning,
                                  width: 48,
                                  height: 48,
                                  borderRadius: 2,
                                }}
                              >
                                <TrendingDownIcon />
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" sx={{ color: GRAY_MAIN, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                  Classe C
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: STATUS_COLORS.warning, mt: 0.5, lineHeight: 1.2 }}>
                                  {loadingYearSummary ? '...' : `${yearSummary?.qtd_produtos_c ?? 0} itens`}
                                </Typography>
                                <Typography variant="caption" sx={{ color: GRAY_LIGHT, display: 'block', mt: 0.5 }}>
                                  Menor relevância
                                </Typography>
                              </Box>
                            </Stack>
                          </Paper>
                        </Grid>
                      </Grid>
                    </Stack>
                  </Grid>

                  {/* COLUNA DIREITA - Cards de IA (30%) */}
                  <Grid size={{ xs: 12, md: 3.6 }}>
                    <Stack spacing={3}>
                      {/* Card 1 - Insights com IA */}
                      <AnaliseCurvaABC_IA userId={activeClient.id} brand={GOLD_PRIMARY} type="produto" />

                      {/* Card 2 - Gerar Apresentação */}
                      <GamaPresentationGenerator userId={activeClient.id} brand={GOLD_PRIMARY} type="produto" />
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>



              {/* Toolbar */}
              <Toolbar
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 2,
                  px: 0,
                  py: 2,
                  bgcolor: WHITE,
                  flexWrap: 'wrap',
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK, mb: 0.5 }}>
                    Ranking por Faturamento
                  </Typography>
                 
                </Box>

                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                  {/* Busca */}
                  <TextField
                    size="small"
                    placeholder="Buscar produtos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: GRAY_LIGHT }} />,
                    }}
                    sx={{
                      minWidth: 280,
                      ...inputSx,
                    }}
                  />

                  {/* Select por página */}
                  <TextField
                    size="small"
                    select
                    label="Por página"
                    value={perPage}
                    onChange={(e) => {
                      const v = Number(e.target.value) as 10 | 50 | 100;
                      setPage(1);
                      setPerPage(v);
                    }}
                    sx={{ width: 120, ...inputSx }}
                  >
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                    <MenuItem value={100}>100</MenuItem>
                  </TextField>

                  {/* Paginação */}
                  <Chip
                    label={pageLabel}
                    sx={{
                      bgcolor: alpha(GRAY_MAIN, 0.05),
                      color: GRAY_MAIN,
                      fontWeight: 600,
                      border: `1px solid ${BORDER_LIGHT}`,
                    }}
                  />

                  <IconButton
                    disabled={!canPrev || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    sx={{
                      border: `1px solid ${BORDER_LIGHT}`,
                      borderRadius: 2,
                      bgcolor: WHITE,
                      '&:hover': { borderColor: GOLD_PRIMARY, color: GOLD_PRIMARY },
                    }}
                  >
                    <ChevronLeftIcon fontSize="small" />
                  </IconButton>

                  <IconButton
                    disabled={!canNext || loading}
                    onClick={() => setPage((p) => p + 1)}
                    sx={{
                      border: `1px solid ${BORDER_LIGHT}`,
                      borderRadius: 2,
                      bgcolor: WHITE,
                      '&:hover': { borderColor: GOLD_PRIMARY, color: GOLD_PRIMARY },
                    }}
                  >
                    <ChevronRightIcon fontSize="small" />
                  </IconButton>

                  <Tooltip title="Atualizar">
                    <IconButton
                      onClick={loadABC}
                      disabled={loading}
                      sx={{
                        border: `1px solid ${BORDER_LIGHT}`,
                        borderRadius: 2,
                        bgcolor: WHITE,
                        '&:hover': { borderColor: GOLD_PRIMARY, color: GOLD_PRIMARY },
                      }}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Toolbar>

              <Divider sx={{ borderColor: BORDER_LIGHT }} />

              {/* Tabela */}
              <TableContainer sx={{ bgcolor: WHITE }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      {[
                        'Rank',
                        'Classe',
                        'Tipo',
                        'Produto/Serviço',
                        'Total',
                        '%',
                        '% Acum.',
                        'Qtd 2024',
                        'Qtd 2025',
                        'Δ Qtd',
                        'Ticket 2024',
                        'Ticket 2025',
                        'Δ Ticket',
                      ].map((col) => (
                        <TableCell
                          key={col}
                          sx={{
                            fontWeight: 700,
                            color: GRAY_MAIN,
                            bgcolor: GRAY_EXTRA_LIGHT,
                            borderBottom: `1px solid ${BORDER_LIGHT}`,
                            whiteSpace: 'nowrap',
                          }}
                          align={
                            ['Total', '%', '% Acum.', 'Qtd 2024', 'Qtd 2025', 'Δ Qtd', 'Ticket 2024', 'Ticket 2025', 'Δ Ticket'].includes(col)
                              ? 'right'
                              : 'left'
                          }
                        >
                          {col}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={13} align="center" sx={{ py: 8 }}>
                          <CircularProgress size={48} sx={{ color: GOLD_PRIMARY, mb: 2 }} />
                          <Typography sx={{ color: GRAY_MAIN, fontWeight: 500 }}>
                            Carregando Curva ABC...
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={13} align="center" sx={{ py: 8 }}>
                          <CategoryIcon sx={{ fontSize: 48, color: GRAY_LIGHT, opacity: 0.5, mb: 2 }} />
                          <Typography variant="h6" sx={{ fontWeight: 600, color: TEXT_DARK, mb: 1 }}>
                            Nenhum item encontrado
                          </Typography>
                          <Typography sx={{ color: GRAY_MAIN }}>
                            {search ? 'Tente ajustar os termos da busca' : 'Nenhum produto/serviço cadastrado para este cliente'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((it) => {
                        const deltaQtdNum = toNumberSafe(it.delta_qtd);
                        const deltaTicketPctNum = toNumberSafe(it.delta_ticket_pct);

                        return (
                          <TableRow
                            key={`${it.rank}-${it.nome_produto_ou_servico}`}
                            hover
                            sx={{ '&:hover': { bgcolor: alpha(GOLD_PRIMARY, 0.02) } }}
                          >
                            <TableCell>
                              <Chip
                                label={`#${it.rank}`}
                                size="small"
                                sx={{
                                  bgcolor: alpha(GRAY_MAIN, 0.05),
                                  color: GRAY_MAIN,
                                  fontWeight: 600,
                                  fontFamily: 'monospace',
                                }}
                              />
                            </TableCell>

                            <TableCell>
                              <Chip
                                label={it.classe}
                                size="small"
                                sx={{
                                  ...classeChipSx(it.classe),
                                  minWidth: 40,
                                }}
                              />
                            </TableCell>

                            <TableCell>
                              <Chip
                                label={it.produto_ou_servico ?? '-'}
                                size="small"
                                sx={{
                                  bgcolor: alpha(GRAY_MAIN, 0.05),
                                  color: GRAY_MAIN,
                                  fontWeight: 500,
                                }}
                              />
                            </TableCell>

                            <TableCell>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Avatar
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    bgcolor: alpha(GOLD_PRIMARY, 0.1),
                                    color: GOLD_PRIMARY,
                                    fontSize: '0.7rem',
                                  }}
                                >
                                  {it.nome_produto_ou_servico?.charAt(0) || '?'}
                                </Avatar>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: TEXT_DARK }}>
                                  {it.nome_produto_ou_servico ?? '-'}
                                </Typography>
                              </Stack>
                            </TableCell>

                            <TableCell align="right">
                              <Typography sx={{ fontWeight: 700, color: GOLD_PRIMARY }}>
                                {moneyBRFromString(it.total_valor)}
                              </Typography>
                            </TableCell>

                            <TableCell align="right">
                              <Typography sx={{ fontWeight: 600, color: TEXT_DARK }}>
                                {percentFromString(it.pct)}
                              </Typography>
                            </TableCell>

                            <TableCell align="right">
                              <Typography sx={{ fontWeight: 600, color: TEXT_DARK }}>
                                {percentFromString(it.pct_acumulado)}
                              </Typography>
                            </TableCell>

                            <TableCell align="right">
                              <Typography sx={{ fontWeight: 500, color: GRAY_MAIN }}>
                                {qtyFromString(it.qtd_2024)}
                              </Typography>
                            </TableCell>

                            <TableCell align="right">
                              <Typography sx={{ fontWeight: 500, color: GRAY_MAIN }}>
                                {qtyFromString(it.qtd_2025)}
                              </Typography>
                            </TableCell>

                            <TableCell align="right">
                              <Chip
                                label={qtyFromString(it.delta_qtd)}
                                size="small"
                                sx={{
                                  bgcolor: alpha(deltaQtdNum >= 0 ? STATUS_COLORS.success : STATUS_COLORS.error, 0.1),
                                  color: deltaQtdNum >= 0 ? STATUS_COLORS.success : STATUS_COLORS.error,
                                  fontWeight: 600,
                                }}
                              />
                            </TableCell>

                            <TableCell align="right">
                              <Typography sx={{ fontWeight: 600, color: TEXT_DARK }}>
                                {moneyBRFromString(it.ticket_2024)}
                              </Typography>
                            </TableCell>

                            <TableCell align="right">
                              <Typography sx={{ fontWeight: 600, color: TEXT_DARK }}>
                                {moneyBRFromString(it.ticket_2025)}
                              </Typography>
                            </TableCell>

                            <TableCell align="right">
                              {it.delta_ticket_pct !== null ? (
                                <Chip
                                  label={percentFromString(it.delta_ticket_pct)}
                                  size="small"
                                  sx={{
                                    bgcolor: alpha(deltaTicketPctNum >= 0 ? STATUS_COLORS.success : STATUS_COLORS.error, 0.1),
                                    color: deltaTicketPctNum >= 0 ? STATUS_COLORS.success : STATUS_COLORS.error,
                                    fontWeight: 600,
                                  }}
                                />
                              ) : (
                                <Typography sx={{ color: GRAY_LIGHT }}>-</Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Footer */}
              <Box sx={{ p: 2, bgcolor: GRAY_EXTRA_LIGHT, borderTop: `1px solid ${BORDER_LIGHT}`, mt: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" sx={{ color: GRAY_MAIN }}>
                    Última atualização: {lastUpdated || '-'}
                  </Typography>
                  {q && (
                    <Typography variant="caption" sx={{ color: GRAY_MAIN }}>
                      Filtro: "{q}"
                    </Typography>
                  )}
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Fade>

        <AppAlert open={alertOpen} message={alertMessage} severity={alertSeverity} onClose={() => setAlertOpen(false)} />
      </Container>
    </Box>
  );
}