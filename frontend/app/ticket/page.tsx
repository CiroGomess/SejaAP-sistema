'use client';

import React, { useEffect, useState } from 'react';
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
  Alert,
  Avatar,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Select,
  MenuItem,
  FormControl,
  Pagination,
  Grid,
  FormLabel,
  IconButton,
  alpha,
  Fade,
  Badge,
  LinearProgress,
  CircularProgress 
} from '@mui/material';

import {
 
  PersonSearch as PersonSearchIcon,

  Search as SearchIcon,
  CalendarMonth as CalendarIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
  FilterAlt as FilterAltIcon,
 
  ArrowBack as ArrowBackIcon,
  Verified as VerifiedIcon,
  AttachMoney as AttachMoneyIcon,
  Analytics as AnalyticsIcon,

} from '@mui/icons-material';

import AppAlert, { AlertType } from '../../components/AppAlert';
import services from '@/services/service';

// ✅ IMPORT DO COMPONENTE NOVO (IA)
import AnaliseTicketMedio_IA from '@/components/ticket/analiseTicketMedio_IA';

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
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  purple: '#8B5CF6',
  purpleLight: '#EDE9FE',
};

const STORAGE_KEY = 'selectedClient';

type SelectedClient = {
  id: number;
  code: string;
  name: string;
};

type TicketItem = {
  rank: number;
  produto_ou_servico: string;
  nome_produto_ou_servico: string;
  [key: string]: any;
  delta_qtd: string;
  delta_ticket_pct: string | null;
  ipca_delta_pct: string | null;
};

type TicketResponse = {
  items: TicketItem[];
  pagination: {
    items_on_page: number;
    page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
  summary: {
    user_id: number;
    year_a: number;
    year_b: number;
    date_from: string | null;
    date_to: string | null;
    q: string | null;
    customer_ipca: string | null;
  };
};

function firstDayOfYearISO(year: number) {
  return `${year}-01-01`;
}

function lastDayOfYearISO(year: number) {
  return `${year}-12-31`;
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

function toNumberSafe(v: any): number {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function fmtQty(v: any): string {
  const n = toNumberSafe(v);
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
}

function fmtMoney(v: any): string {
  const n = toNumberSafe(v);
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtPct(v: any): string {
  if (v === null || v === undefined) return '-';
  const n = toNumberSafe(v);
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function pctColor(v: any): string {
  if (v === null || v === undefined) return GRAY_MAIN;
  const n = toNumberSafe(v);
  if (n > 0) return STATUS_COLORS.success;
  if (n < 0) return STATUS_COLORS.error;
  return GRAY_MAIN;
}

export default function TicketMedioPage() {
  const router = useRouter();

  const [activeClient, setActiveClient] = useState<SelectedClient | null>(null);

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<AlertType>('info');

  const showAlert = (message: string, severity: AlertType) => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TicketResponse | null>(null);

  const [yearA, setYearA] = useState<number>(2024);
  const [yearB, setYearB] = useState<number>(2025);

  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [query, setQuery] = useState<string>('');

  const [perPage, setPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

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

  useEffect(() => {
    if (!dateFrom) setDateFrom(firstDayOfYearISO(yearA));
    if (!dateTo) setDateTo(lastDayOfYearISO(yearB));
  }, [yearA, yearB]);

  const totalPages = data?.pagination?.total_pages ?? 0;
  const totalItems = data?.pagination?.total_items ?? 0;

  const currentIpca = data?.summary?.customer_ipca || null;

  const endpoint = '/ticket-medio-produtos';

  const fetchData = async (targetPage?: number) => {
    if (!activeClient) return;

    const p = targetPage ?? page;

    setLoading(true);

    const params = new URLSearchParams();
    params.set('user_id', String(activeClient.id));
    params.set('page', String(p));
    params.set('per_page', String(perPage));
    params.set('year_a', String(yearA));
    params.set('year_b', String(yearB));

    if (dateFrom?.trim()) params.set('date_from', dateFrom.trim());
    if (dateTo?.trim()) params.set('date_to', dateTo.trim());
    if (query?.trim()) params.set('q', query.trim());

    const res = await services(`${endpoint}?${params.toString()}`, { method: 'GET' });

    setLoading(false);

    if (!res.success) {
      showAlert(pickApiError(res.data), 'error');
      setData(null);
      return;
    }

    setData(res.data as TicketResponse);
  };

  useEffect(() => {
    if (!activeClient) return;
    fetchData(1);
    setPage(1);
  }, [activeClient, perPage, yearA, yearB]);

  const handleApplyFilters = async () => {
    if (!activeClient) return;
    setPage(1);
    await fetchData(1);
  };

  const handleReset = async () => {
    setQuery('');
    setYearA(2024);
    setYearB(2025);
    setPerPage(10);
    setPage(1);
    setDateFrom(firstDayOfYearISO(2024));
    setDateTo(lastDayOfYearISO(2025));

    if (activeClient) {
      await fetchData(1);
      showAlert('Filtros resetados.', 'success');
    }
  };

  const handlePageChange = async (_: any, value: number) => {
    setPage(value);
    await fetchData(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const yearAKey = `qtd_${yearA}`;
  const yearBKey = `qtd_${yearB}`;
  const ticketAKey = `ticket_${yearA}`;
  const ticketBKey = `ticket_${yearB}`;

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
                Para visualizar o Ticket Médio, primeiro selecione um cliente no menu lateral.
              </Typography>

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
            </CardContent>
          </Paper>
        </Fade>

        <AppAlert open={alertOpen} message={alertMessage} severity={alertSeverity} onClose={() => setAlertOpen(false)} />
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
                Ticket Médio
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
                  {activeClient.name.charAt(0)}
                </Avatar>
                <Typography variant="body1" sx={{ color: GRAY_MAIN }}>
                  <strong>{activeClient.name}</strong> • Código: {activeClient.code}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth={false} sx={{ maxWidth: '95%', mx: 'auto' }}>
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
              mb: 4,
            }}
          >
            <Box sx={{ height: 6, background: `linear-gradient(90deg, ${GOLD_PRIMARY}, ${GOLD_LIGHT})` }} />

            <CardContent sx={{ p: 4 }}>
              {/* Container principal com 2 colunas */}
              <Grid container spacing={4} sx={{ mb: 4 }}>
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

                    {/* Cards de Informações Rápidas */}
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: 3,
                            bgcolor: alpha(GOLD_PRIMARY, 0.04),
                            border: `1px solid ${alpha(GOLD_PRIMARY, 0.15)}`,
                          }}
                        >
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ bgcolor: alpha(GOLD_PRIMARY, 0.1), color: GOLD_PRIMARY, width: 40, height: 40 }}>
                              <CalendarIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="caption" sx={{ color: GRAY_MAIN, fontWeight: 500 }}>
                                Período
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: TEXT_DARK }}>
                                {yearA} → {yearB}
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: 3,
                            bgcolor: alpha(STATUS_COLORS.info, 0.04),
                            border: `1px solid ${alpha(STATUS_COLORS.info, 0.15)}`,
                          }}
                        >
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ bgcolor: alpha(STATUS_COLORS.info, 0.1), color: STATUS_COLORS.info, width: 40, height: 40 }}>
                              <TimelineIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="caption" sx={{ color: GRAY_MAIN, fontWeight: 500 }}>
                                IPCA do Cliente
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: TEXT_DARK }}>
                                {currentIpca ? `${currentIpca}%` : 'Não definido'}
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: 3,
                            bgcolor: alpha(STATUS_COLORS.success, 0.04),
                            border: `1px solid ${alpha(STATUS_COLORS.success, 0.15)}`,
                          }}
                        >
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ bgcolor: alpha(STATUS_COLORS.success, 0.1), color: STATUS_COLORS.success, width: 40, height: 40 }}>
                              <AnalyticsIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="caption" sx={{ color: GRAY_MAIN, fontWeight: 500 }}>
                                Produtos
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: TEXT_DARK }}>
                                {totalItems ? totalItems.toLocaleString('pt-BR') : '—'}
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Stack>
                </Grid>

                {/* COLUNA DIREITA - Card de IA (30%) */}
                <Grid size={{ xs: 12, md: 3.6 }}>
                  <AnaliseTicketMedio_IA userId={activeClient.id} year={yearB} brand={GOLD_PRIMARY} />
                </Grid>
              </Grid>

              {/* Filtros */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 4,
                  borderRadius: 3,
                  bgcolor: alpha(GRAY_MAIN, 0.02),
                  border: `1px solid ${BORDER_LIGHT}`,
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ bgcolor: alpha(GOLD_PRIMARY, 0.1), color: GOLD_PRIMARY, width: 32, height: 32 }}>
                      <FilterAltIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: TEXT_DARK }}>
                      Filtros
                    </Typography>
                  </Stack>
                  <Typography variant="caption" sx={{ color: GRAY_MAIN }}>
                    {loading ? <LinearProgress sx={{ width: 100 }} /> : `Página ${page} de ${totalPages || 1}`}
                  </Typography>
                </Stack>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <FormLabel sx={{ fontSize: 12, fontWeight: 600, color: GRAY_MAIN, mb: 1, display: 'block' }}>
                      Ano Base
                    </FormLabel>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={yearA}
                        onChange={(e) => setYearA(Number(e.target.value))}
                        sx={{
                          borderRadius: 2,
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER_LIGHT },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: GRAY_MAIN },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: GOLD_PRIMARY },
                        }}
                      >
                        {[2021, 2022, 2023, 2024, 2025, 2026].map((y) => (
                          <MenuItem key={y} value={y}>
                            {y}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <FormLabel sx={{ fontSize: 12, fontWeight: 600, color: GRAY_MAIN, mb: 1, display: 'block' }}>
                      Ano Comparativo
                    </FormLabel>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={yearB}
                        onChange={(e) => setYearB(Number(e.target.value))}
                        sx={{
                          borderRadius: 2,
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER_LIGHT },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: GRAY_MAIN },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: GOLD_PRIMARY },
                        }}
                      >
                        {[2021, 2022, 2023, 2024, 2025, 2026].map((y) => (
                          <MenuItem key={y} value={y}>
                            {y}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <FormLabel sx={{ fontSize: 12, fontWeight: 600, color: GRAY_MAIN, mb: 1, display: 'block' }}>
                      Data Início
                    </FormLabel>
                    <TextField
                      size="small"
                      type="date"
                      fullWidth
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '& fieldset': { borderColor: BORDER_LIGHT },
                          '&:hover fieldset': { borderColor: GRAY_MAIN },
                          '&.Mui-focused fieldset': { borderColor: GOLD_PRIMARY },
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <FormLabel sx={{ fontSize: 12, fontWeight: 600, color: GRAY_MAIN, mb: 1, display: 'block' }}>
                      Data Fim
                    </FormLabel>
                    <TextField
                      size="small"
                      type="date"
                      fullWidth
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '& fieldset': { borderColor: BORDER_LIGHT },
                          '&:hover fieldset': { borderColor: GRAY_MAIN },
                          '&.Mui-focused fieldset': { borderColor: GOLD_PRIMARY },
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormLabel sx={{ fontSize: 12, fontWeight: 600, color: GRAY_MAIN, mb: 1, display: 'block' }}>
                      Buscar Produto
                    </FormLabel>
                    <TextField
                      size="small"
                      fullWidth
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Nome do produto..."
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" sx={{ color: GRAY_LIGHT }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '& fieldset': { borderColor: BORDER_LIGHT },
                          '&:hover fieldset': { borderColor: GRAY_MAIN },
                          '&.Mui-focused fieldset': { borderColor: GOLD_PRIMARY },
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <FormLabel sx={{ fontSize: 12, fontWeight: 600, color: GRAY_MAIN, mb: 1, display: 'block' }}>
                      Por Página
                    </FormLabel>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={perPage}
                        onChange={(e) => setPerPage(Number(e.target.value))}
                        sx={{
                          borderRadius: 2,
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER_LIGHT },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: GRAY_MAIN },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: GOLD_PRIMARY },
                        }}
                      >
                        {[10, 25, 50, 100].map((n) => (
                          <MenuItem key={n} value={n}>
                            {n} itens
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 2 }} sx={{ display: 'flex', alignItems: 'flex-end' }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleApplyFilters}
                      disabled={loading}
                      startIcon={<SearchIcon />}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 2,
                        py: 1,
                        bgcolor: GOLD_PRIMARY,
                        color: TEXT_DARK,
                        '&:hover': { bgcolor: GOLD_DARK },
                      }}
                    >
                      Aplicar
                    </Button>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 2 }} sx={{ display: 'flex', alignItems: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={handleReset}
                      disabled={loading}
                      startIcon={<RefreshIcon />}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 2,
                        py: 1,
                        borderColor: BORDER_LIGHT,
                        color: GRAY_MAIN,
                        '&:hover': { borderColor: GOLD_PRIMARY, color: GOLD_PRIMARY },
                      }}
                    >
                      Resetar
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              {/* Tabela de Dados */}
              <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${BORDER_LIGHT}`, borderRadius: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: GRAY_EXTRA_LIGHT }}>
                      <TableCell sx={{ fontWeight: 700, color: GRAY_MAIN }}>Produto</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: GRAY_MAIN }}>{`Qtd ${yearA}`}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: GRAY_MAIN }}>{`Qtd ${yearB}`}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: GRAY_MAIN }}>Δ Qtd</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: GRAY_MAIN }}>{`Ticket ${yearA}`}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: GRAY_MAIN }}>{`Ticket ${yearB}`}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: GRAY_MAIN }}>Δ Ticket</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: GRAY_MAIN }}>Ganho Real</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {loading && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                          <CircularProgress size={48} sx={{ color: GOLD_PRIMARY, mb: 2 }} />
                          <Typography sx={{ color: GRAY_MAIN }}>Carregando dados...</Typography>
                        </TableCell>
                      </TableRow>
                    )}

                    {!loading && (!data?.items || data.items.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                          <AttachMoneyIcon sx={{ fontSize: 48, color: GRAY_LIGHT, opacity: 0.5, mb: 2 }} />
                          <Typography variant="h6" sx={{ fontWeight: 600, color: TEXT_DARK, mb: 1 }}>
                            Nenhum dado encontrado
                          </Typography>
                          <Typography sx={{ color: GRAY_MAIN }}>
                            Ajuste os filtros ou tente outro período.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}

                    {!loading && data?.items?.map((it) => {
                      const qtdA = it[yearAKey];
                      const qtdB = it[yearBKey];
                      const ticketA = it[ticketAKey];
                      const ticketB = it[ticketBKey];
                      const deltaQtd = it.delta_qtd;
                      const deltaTicketPct = it.delta_ticket_pct;
                      const ipcaPct = it.ipca_delta_pct;

                      return (
                        <TableRow key={`${it.rank}-${it.nome_produto_ou_servico}`} hover>
                          <TableCell>
                            <Stack spacing={0.5}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: TEXT_DARK }}>
                                {it.nome_produto_ou_servico}
                              </Typography>
                              <Chip
                                label={it.produto_ou_servico}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.65rem',
                                  bgcolor: alpha(GRAY_MAIN, 0.05),
                                  color: GRAY_MAIN,
                                  width: 'fit-content',
                                }}
                              />
                            </Stack>
                          </TableCell>

                          <TableCell align="right">
                            <Typography sx={{ fontWeight: 500, color: TEXT_DARK }}>
                              {fmtQty(qtdA)}
                            </Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Typography sx={{ fontWeight: 500, color: TEXT_DARK }}>
                              {fmtQty(qtdB)}
                            </Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Typography
                              sx={{
                                fontWeight: 600,
                                color: toNumberSafe(deltaQtd) > 0 ? STATUS_COLORS.success : toNumberSafe(deltaQtd) < 0 ? STATUS_COLORS.error : GRAY_MAIN,
                              }}
                            >
                              {fmtQty(deltaQtd)}
                            </Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Typography sx={{ fontWeight: 500, color: TEXT_DARK }}>
                              {fmtMoney(ticketA)}
                            </Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Typography sx={{ fontWeight: 500, color: TEXT_DARK }}>
                              {fmtMoney(ticketB)}
                            </Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Chip
                              label={fmtPct(deltaTicketPct)}
                              size="small"
                              sx={{
                                bgcolor: alpha(pctColor(deltaTicketPct), 0.1),
                                color: pctColor(deltaTicketPct),
                                fontWeight: 600,
                                height: 22,
                              }}
                            />
                          </TableCell>

                          <TableCell align="right">
                            <Chip
                              label={fmtPct(ipcaPct)}
                              size="small"
                              sx={{
                                bgcolor: alpha(pctColor(ipcaPct), 0.1),
                                color: pctColor(ipcaPct),
                                fontWeight: 600,
                                height: 22,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Paginação */}
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: GRAY_LIGHT }}>
                  {totalItems} {totalItems === 1 ? 'item encontrado' : 'itens encontrados'}
                </Typography>

                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  shape="rounded"
                  disabled={loading || totalPages <= 1}
                  sx={{
                    '& .MuiPaginationItem-root': {
                      color: GRAY_MAIN,
                      '&.Mui-selected': {
                        bgcolor: alpha(GOLD_PRIMARY, 0.1),
                        color: GOLD_PRIMARY,
                        fontWeight: 600,
                        '&:hover': { bgcolor: alpha(GOLD_PRIMARY, 0.2) },
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Fade>
      </Container>

      <AppAlert open={alertOpen} message={alertMessage} severity={alertSeverity} onClose={() => setAlertOpen(false)} />
    </Box>
  );
}