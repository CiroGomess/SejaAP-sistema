'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';

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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  Stack,
  Avatar,
  Tooltip,
  alpha,
  Fade,
  Container,
} from '@mui/material';

import Grid from '@mui/material/Grid';

import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  ArrowBack as ArrowBackIcon,
  AttachMoney as AttachMoneyIcon,
  Percent as PercentIcon,
  Calculate as CalculateIcon,
} from '@mui/icons-material';

// Componentes de gráficos
import AnaliseResumoCards from '@/components/analise/AnaliseResumoCards';
import AnaliseMargemChart from '@/components/analise/AnaliseMargemChart';
import AnaliseCategoriaChart from '@/components/analise/AnaliseCategoriaChart';

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
  id: string;
  code: string;
  name: string;
};

type Pagination = {
  page: number;
  per_page: number;
  items_on_page: number;
  total_items: number;
  total_pages: number;
};

type AnaliseMargem = {
  id: string;
  user_id: string;
  produto_ou_servico: string | null;
  custo: string | null;
  hora_homem: string | null;
  frete: string | null;
  imposto: string | null;
  comissao: string | null;
  margem_bruta: string | null;
};

type AnaliseMargemForm = {
  produto_ou_servico: string;
  custo: number;
  hora_homem: number;
  frete: number;
  imposto: number;
  comissao: number;
};

type DashboardResumo = {
  margem_total: number;
  custo_total: number;
  media_por_item: number;
  itens_analisados: number;
  melhor_margem: {
    produto_ou_servico: string;
    margem_bruta: number;
    custo: number;
    id: string;
  } | null;
  pior_margem: {
    produto_ou_servico: string;
    margem_bruta: number;
    custo: number;
    id: string;
  } | null;
};

type DashboardTopItem = {
  id: string;
  produto_ou_servico: string;
  margem_bruta: number;
  custo: number;
};

type DashboardCategoria = {
  categoria: string;
  total_itens: number;
  margem_total: number;
  custo_total: number;
  percentual_margem: number;
};

type DashboardFiltros = {
  user_id: string | null;
  ano: number | null;
  anos_disponiveis: number[];
};

type DashboardAnaliseMargem = {
  filtros: DashboardFiltros;
  resumo: DashboardResumo;
  top10_margem: DashboardTopItem[];
  top10_custo: DashboardTopItem[];
  distribuicao_categoria: DashboardCategoria[];
};

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

function toNumberSafe(v: any): number {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function moneyBRFromString(v: string | null): string {
  const n = toNumberSafe(v);
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function percentBRFromString(v: string | null): string {
  const n = toNumberSafe(v);
  return `${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

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
    // ignore
  }

  return null;
}

export default function AnaliseListarPage() {
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<10 | 50 | 100>(10);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AnaliseMargem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const [dashboard, setDashboard] = useState<DashboardAnaliseMargem | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [anoSelecionado, setAnoSelecionado] = useState<number | ''>('');

  /* ALERT */
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<AlertType>('info');

  const showAlert = (message: string, severity: AlertType) => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  /* EDIT MODAL */
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<AnaliseMargem | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<AnaliseMargemForm>({
    produto_ou_servico: '',
    custo: 0,
    hora_homem: 0,
    frete: 0,
    imposto: 0,
    comissao: 0,
  });

  const margemPreview = useMemo(() => {
    const base = toNumberSafe(form.custo) + toNumberSafe(form.hora_homem) + toNumberSafe(form.frete);
    const impostos = base * (toNumberSafe(form.imposto) / 100);
    const comissao = base * (toNumberSafe(form.comissao) / 100);
    const total = base + impostos + comissao;
    return Math.round(total * 100) / 100;
  }, [form]);

  const loadAnalises = useCallback(async () => {
    const client = getSelectedClientFromStorage();
    setSelectedClient(client);

    if (!client?.id) {
      setRows([]);
      setPagination(null);
      setLoading(false);
      showAlert('Selecione um cliente no menu lateral para listar as análises.', 'warning');
      return;
    }

    const userId = String(client.id).trim();

    if (!userId) {
      setRows([]);
      setPagination(null);
      setLoading(false);
      showAlert('Cliente selecionado inválido (id).', 'error');
      return;
    }

    setLoading(true);
    setLastUpdated(new Date().toLocaleString());

    try {
      const qs = new URLSearchParams({
        user_id: String(userId),
        page: String(page),
        per_page: String(perPage),
      }).toString();

      const res = await services(`/analise-margem?${qs}`, { method: 'GET' });

      if (!res.success) {
        showAlert(pickApiError(res.data), 'error');
        setRows([]);
        setPagination(null);
        setLoading(false);
        return;
      }

      const list = Array.isArray(res.data?.analises_margem) ? res.data.analises_margem : [];
      const pg = res.data?.pagination ?? null;

      setRows(list);
      setPagination(pg);
    } catch (e: any) {
      showAlert(e?.message || 'Erro ao carregar análises.', 'error');
      setRows([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, perPage]);

  const loadDashboard = useCallback(async () => {
    const client = getSelectedClientFromStorage();
    setSelectedClient(client);

    if (!client?.id) {
      setDashboard(null);
      return;
    }

    setDashboardLoading(true);

    try {
      const qs = new URLSearchParams({
        user_id: client.id,
        ...(anoSelecionado !== '' ? { ano: String(anoSelecionado) } : {}),
      }).toString();

      const res = await services(`/analise-margem/dashboard?${qs}`, {
        method: 'GET',
      });

      if (!res.success) {
        showAlert(pickApiError(res.data), 'error');
        setDashboard(null);
        return;
      }

      const data = res.data as DashboardAnaliseMargem;
      setDashboard(data);

      if (anoSelecionado === '' && data?.filtros?.ano) {
        setAnoSelecionado(data.filtros.ano);
      }
    } catch (e: any) {
      showAlert(e?.message || 'Erro ao carregar dashboard.', 'error');
      setDashboard(null);
    } finally {
      setDashboardLoading(false);
    }
  }, [anoSelecionado]);

  useEffect(() => {
    loadAnalises();
  }, [loadAnalises]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setPage(1);
        setSearch('');
        setAnoSelecionado('');
        setTimeout(() => {
          loadAnalises();
          loadDashboard();
        }, 0);
      }
    };

    const onFocus = () => {
      const current = getSelectedClientFromStorage();
      const prevId = selectedClient?.id ?? null;
      const nextId = current?.id ?? null;

      if (prevId !== nextId) {
        setSelectedClient(current);
        setPage(1);
        setSearch('');
        setAnoSelecionado('');
        setTimeout(() => {
          loadAnalises();
          loadDashboard();
        }, 0);
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
    };
  }, [selectedClient?.id, loadAnalises, loadDashboard]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) => {
      const s = [
        String(r.id),
        String(r.user_id),
        r.produto_ou_servico,
        r.custo,
        r.hora_homem,
        r.frete,
        r.imposto,
        r.comissao,
        r.margem_bruta,
      ]
        .filter((x) => x !== null && x !== undefined)
        .join(' ')
        .toLowerCase();

      return s.includes(q);
    });
  }, [rows, search]);

  const resumoCardsData = useMemo(() => {
    if (!dashboard?.resumo) return null;

    return {
      totalCusto: dashboard.resumo.custo_total || 0,
      totalMargem: dashboard.resumo.margem_total || 0,
      mediaMargem: dashboard.resumo.media_por_item || 0,
      qtdItens: dashboard.resumo.itens_analisados || 0,
      melhorMargem: {
        produto: dashboard.resumo.melhor_margem?.produto_ou_servico || '-',
        valor: dashboard.resumo.melhor_margem?.margem_bruta || 0,
      },
      piorMargem: {
        produto: dashboard.resumo.pior_margem?.produto_ou_servico || '-',
        valor: dashboard.resumo.pior_margem?.margem_bruta || 0,
      },
    };
  }, [dashboard]);

  const margemChartMargemData = useMemo(() => {
    if (!dashboard) return [];

    return (dashboard.top10_margem || []).map((item) => ({
      id: item.id,
      produto_ou_servico: item.produto_ou_servico || 'Sem nome',
      margem_bruta: toNumberSafe(item.margem_bruta),
      custo: toNumberSafe(item.custo),
    }));
  }, [dashboard]);

  const margemChartCustoData = useMemo(() => {
    if (!dashboard) return [];

    return (dashboard.top10_custo || []).map((item) => ({
      id: item.id,
      produto_ou_servico: item.produto_ou_servico || 'Sem nome',
      margem_bruta: toNumberSafe(item.margem_bruta),
      custo: toNumberSafe(item.custo),
    }));
  }, [dashboard]);

  const categoriaChartData = useMemo(() => {
    if (!dashboard) return [];

    return (dashboard.distribuicao_categoria || []).map((item) => ({
      categoria: item.categoria || 'Sem categoria',
      custo: toNumberSafe(item.custo_total),
      margem_bruta: toNumberSafe(item.margem_total),
      count: toNumberSafe(item.total_itens),
      percentual_margem: toNumberSafe(item.percentual_margem),
    }));
  }, [dashboard]);

  const openEdit = (r: AnaliseMargem) => {
    setEditing(r);
    setForm({
      produto_ou_servico: r.produto_ou_servico ?? '',
      custo: toNumberSafe(r.custo),
      hora_homem: toNumberSafe(r.hora_homem),
      frete: toNumberSafe(r.frete),
      imposto: toNumberSafe(r.imposto),
      comissao: toNumberSafe(r.comissao),
    });
    setEditOpen(true);
  };

  const validateEdit = () => {
    if (!editing) return 'Registro inválido.';
    if (!String(form.produto_ou_servico || '').trim()) return 'Informe Produto/Serviço.';
    if (toNumberSafe(form.custo) < 0) return 'Custo não pode ser negativo.';
    if (toNumberSafe(form.hora_homem) < 0) return 'Hora homem não pode ser negativo.';
    if (toNumberSafe(form.frete) < 0) return 'Frete não pode ser negativo.';
    if (toNumberSafe(form.imposto) < 0) return 'Imposto não pode ser negativo.';
    if (toNumberSafe(form.comissao) < 0) return 'Comissão não pode ser negativo.';
    return null;
  };

  const handleUpdate = async () => {
    const err = validateEdit();
    if (err) {
      showAlert(err, 'warning');
      return;
    }
    if (!editing) return;

    setSaving(true);

    try {
      const payload: any = {
        produto_ou_servico: String(form.produto_ou_servico).trim(),
        custo: toNumberSafe(form.custo),
        hora_homem: toNumberSafe(form.hora_homem),
        frete: toNumberSafe(form.frete),
        imposto: toNumberSafe(form.imposto),
        comissao: toNumberSafe(form.comissao),
      };

      const res = await services(`/analise-margem/${editing.id}`, { method: 'PUT', data: payload });

      if (!res.success) {
        showAlert(pickApiError(res.data), 'error');
        return;
      }

      showAlert('Análise atualizada com sucesso.', 'success');
      setEditOpen(false);
      setEditing(null);
      await loadAnalises();
      await loadDashboard();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (r: AnaliseMargem) => {
    const result = await Swal.fire({
      title: '',
      html: `
    <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; padding: 8px 0;">
      <div style="
        width: 72px;
        height: 72px;
        margin: 0 auto 20px auto;
        background: ${alpha(STATUS_COLORS.error, 0.1)};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid ${alpha(STATUS_COLORS.error, 0.2)};
      ">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 9V14M12 17V17.5M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3Z"
            stroke="${STATUS_COLORS.error}"
            stroke-width="1.8"
            stroke-linecap="round"
          />
          <circle cx="12" cy="17" r="0.5" fill="${STATUS_COLORS.error}" stroke="${STATUS_COLORS.error}" stroke-width="0.5"/>
        </svg>
      </div>

      <h2 style="
        margin: 0 0 8px 0;
        color: ${TEXT_DARK};
        font-size: 24px;
        font-weight: 700;
        letter-spacing: -0.02em;
        line-height: 1.2;
      ">
        Excluir análise?
      </h2>

      <p style="
        margin: 0 0 24px 0;
        color: ${GRAY_MAIN};
        font-size: 14px;
        font-weight: 400;
      ">
        Esta ação é irreversível e removerá permanentemente este registro.
      </p>

      <div style="
        background: ${alpha(GOLD_PRIMARY, 0.03)};
        border: 1px solid ${alpha(GOLD_PRIMARY, 0.15)};
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 20px;
      ">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="
            width: 48px;
            height: 48px;
            background: ${alpha(GOLD_PRIMARY, 0.1)};
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${GOLD_PRIMARY};
            font-weight: 700;
            font-size: 18px;
            border: 1px solid ${alpha(GOLD_PRIMARY, 0.2)};
            flex-shrink: 0;
          ">
            ${(r.produto_ou_servico?.charAt(0) || '?').toUpperCase()}
          </div>

          <div style="flex: 1; min-width: 0; text-align: left;">
            <div style="
              color: ${TEXT_DARK};
              font-size: 18px;
              font-weight: 700;
              margin-bottom: 6px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            ">
              ${r.produto_ou_servico ?? 'Sem nome'}
            </div>
          </div>
        </div>

        <div style="
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid ${alpha(BORDER_LIGHT, 0.5)};
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <span style="color: ${GRAY_MAIN}; font-size: 13px; font-weight: 500;">
            Valor da margem
          </span>
          <span style="
            color: ${GOLD_PRIMARY};
            font-size: 20px;
            font-weight: 800;
            letter-spacing: -0.02em;
          ">
            ${moneyBRFromString(r.margem_bruta)}
          </span>
        </div>
      </div>

      <div style="
        background: ${alpha(STATUS_COLORS.error, 0.05)};
        border: 1px solid ${alpha(STATUS_COLORS.error, 0.15)};
        border-radius: 12px;
        padding: 14px;
        display: flex;
        align-items: center;
        gap: 12px;
      ">
        <span style="
          color: ${STATUS_COLORS.error};
          font-size: 20px;
          line-height: 1;
        ">⚠️</span>
        <span style="
          color: ${TEXT_DARK};
          font-size: 13px;
          font-weight: 500;
          line-height: 1.4;
          text-align: left;
        ">
          Esta ação <strong style="color: ${STATUS_COLORS.error};">não poderá ser desfeita</strong>.
          Todos os dados associados serão permanentemente removidos.
        </span>
      </div>
    </div>
  `,
      icon: undefined,
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: STATUS_COLORS.error,
      cancelButtonColor: GRAY_MAIN,
      focusCancel: true,
      reverseButtons: true,
      background: WHITE,
      backdrop: `rgba(0,0,0,0.5)`,
      customClass: {
        popup: 'rounded-3xl',
      },
      padding: '24px',
      width: '520px',
    });

    if (!result.isConfirmed) return;

    const res = await services(`/analise-margem/${r.id}`, { method: 'DELETE' });

    if (!res.success) {
      showAlert(pickApiError(res.data), 'error');
      return;
    }

    showAlert('Análise removida com sucesso.', 'warning');
    await loadAnalises();
    await loadDashboard();
  };

  const pageLabel = useMemo(() => {
    const p = pagination?.page ?? page;
    const tp = pagination?.total_pages ?? 0;
    return tp > 0 ? `Página ${p} de ${tp}` : `Página ${p}`;
  }, [pagination, page]);

  const canPrev = (pagination?.page ?? page) > 1;
  const canNext = pagination ? pagination.page < pagination.total_pages : false;

  if (!selectedClient) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: GRAY_EXTRA_LIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
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
                <AssessmentIcon sx={{ fontSize: 40 }} />
              </Avatar>

              <Typography variant="h4" sx={{ fontWeight: 700, color: TEXT_DARK, mb: 1 }}>
                Nenhum cliente selecionado
              </Typography>

              <Typography sx={{ color: GRAY_MAIN, mb: 4, maxWidth: 360, mx: 'auto' }}>
                Para visualizar as análises de margem, primeiro selecione um cliente no menu lateral.
              </Typography>

              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  startIcon={<PersonIcon />}
                  onClick={() => (window.location.href = '/clients')}
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
                  Análises de Margem
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
                    <strong>{selectedClient.name}</strong> • Código: {selectedClient.code}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Box>
        </Fade>

        {dashboard && resumoCardsData && (
          <Box sx={{ mb: 4 }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', md: 'center' }}
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                  Resumo Analítico
                </Typography>
                <Typography variant="body2" sx={{ color: GRAY_MAIN }}>
                  Dados consolidados do ano selecionado
                </Typography>
              </Box>

              <TextField
                select
                size="small"
                label="Ano"
                value={anoSelecionado}
                onChange={(e) => {
                  const value = e.target.value;
                  setAnoSelecionado(value === '' ? '' : Number(value));
                }}
                sx={{ width: 160, ...inputSx }}
              >
                {(dashboard.filtros?.anos_disponiveis || []).map((ano) => (
                  <MenuItem key={ano} value={ano}>
                    {ano}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <AnaliseResumoCards stats={resumoCardsData} />

            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid size={{ xs: 12, lg: 6 }}>
                <AnaliseMargemChart
                  dataMargem={margemChartMargemData}
                  dataCusto={margemChartCustoData}
                  loading={dashboardLoading}
                />
              </Grid>

              <Grid size={{ xs: 12, lg: 6 }}>
                <AnaliseCategoriaChart data={categoriaChartData} loading={dashboardLoading} />
              </Grid>
            </Grid>
          </Box>
        )}

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

            <Toolbar
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 2,
                px: 3,
                py: 2.5,
                bgcolor: WHITE,
                flexWrap: 'wrap',
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK, mb: 0.5 }}>
                  Lista de Análises
                </Typography>

                <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                  <Chip
                    icon={<AssessmentIcon />}
                    label={`${pagination?.total_items || filtered.length} registros`}
                    size="small"
                    sx={{ bgcolor: alpha(GOLD_PRIMARY, 0.1), color: GOLD_PRIMARY, fontWeight: 600 }}
                  />

                  {!!lastUpdated && (
                    <Chip
                      label={`Atualizado em ${lastUpdated}`}
                      size="small"
                      sx={{
                        bgcolor: alpha(GRAY_MAIN, 0.05),
                        color: GRAY_MAIN,
                        fontWeight: 500,
                        border: `1px solid ${BORDER_LIGHT}`,
                      }}
                    />
                  )}
                </Stack>
              </Box>

              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                <TextField
                  size="small"
                  placeholder="Buscar análises..."
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
                    onClick={async () => {
                      await loadAnalises();
                      await loadDashboard();
                    }}
                    disabled={loading || dashboardLoading}
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

            <TableContainer sx={{ bgcolor: WHITE }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    {[
                      'Produto/Serviço',
                      'Custo',
                      'Hora Homem',
                      'Frete',
                      'Imposto',
                      'Comissão',
                      'Margem Bruta',
                      'Ações',
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
                        align={col === 'Ações' ? 'center' : 'right'}
                      >
                        {col}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                        <CircularProgress size={48} sx={{ color: GOLD_PRIMARY, mb: 2 }} />
                        <Typography sx={{ color: GRAY_MAIN, fontWeight: 500 }}>
                          Carregando análises...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                        <AssessmentIcon sx={{ fontSize: 48, color: GRAY_LIGHT, opacity: 0.5, mb: 2 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600, color: TEXT_DARK, mb: 1 }}>
                          Nenhuma análise encontrada
                        </Typography>
                        <Typography sx={{ color: GRAY_MAIN }}>
                          {search ? 'Tente ajustar os termos da busca' : 'Nenhuma análise cadastrada para este cliente'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => {
                      const margem = toNumberSafe(r.margem_bruta);
                      const margemColor =
                        margem > 10000
                          ? STATUS_COLORS.success
                          : margem > 5000
                            ? GOLD_PRIMARY
                            : margem > 1000
                              ? STATUS_COLORS.warning
                              : STATUS_COLORS.error;

                      return (
                        <TableRow
                          key={r.id}
                          hover
                          sx={{
                            '&:hover': { bgcolor: alpha(GOLD_PRIMARY, 0.02) },
                          }}
                        >
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  bgcolor: alpha(GOLD_PRIMARY, 0.1),
                                  color: GOLD_PRIMARY,
                                  fontSize: '0.8rem',
                                }}
                              >
                                {r.produto_ou_servico?.charAt(0) || '?'}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontWeight: 500, color: TEXT_DARK }}>
                                {r.produto_ou_servico ?? '-'}
                              </Typography>
                            </Stack>
                          </TableCell>

                          <TableCell align="right">
                            <Typography sx={{ fontWeight: 600, color: TEXT_DARK }}>
                              {moneyBRFromString(r.custo)}
                            </Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Typography sx={{ fontWeight: 600, color: TEXT_DARK }}>
                              {moneyBRFromString(r.hora_homem)}
                            </Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Typography sx={{ fontWeight: 600, color: TEXT_DARK }}>
                              {moneyBRFromString(r.frete)}
                            </Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Typography sx={{ fontWeight: 600, color: TEXT_DARK }}>
                              {percentBRFromString(r.imposto)}
                            </Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Typography sx={{ fontWeight: 600, color: TEXT_DARK }}>
                              {percentBRFromString(r.comissao)}
                            </Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Chip
                              label={moneyBRFromString(r.margem_bruta)}
                              size="small"
                              sx={{
                                bgcolor: alpha(margemColor, 0.1),
                                color: margemColor,
                                fontWeight: 700,
                              }}
                            />
                          </TableCell>

                          <TableCell align="center">
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <Tooltip title="Editar">
                                <IconButton
                                  size="small"
                                  onClick={() => openEdit(r)}
                                  sx={{
                                    color: GRAY_MAIN,
                                    '&:hover': { color: GOLD_PRIMARY, bgcolor: alpha(GOLD_PRIMARY, 0.1) },
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Excluir">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(r)}
                                  sx={{
                                    color: GRAY_MAIN,
                                    '&:hover': { color: STATUS_COLORS.error, bgcolor: alpha(STATUS_COLORS.error, 0.1) },
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Fade>

        <Dialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
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
                  <EditIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                    Editar Análise
                  </Typography>
                  <Typography variant="body2" sx={{ color: GRAY_MAIN }}>
                    ID: {editing?.id} • {editing?.produto_ou_servico}
                  </Typography>
                </Box>
              </Stack>
            </Box>
            <Divider sx={{ borderColor: BORDER_LIGHT }} />
          </DialogTitle>

          <DialogContent sx={{ bgcolor: WHITE, p: 0 }}>
            <Box sx={{ px: 4, py: 3 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Produto/Serviço"
                    value={form.produto_ou_servico}
                    onChange={(e) => setForm((p) => ({ ...p, produto_ou_servico: e.target.value }))}
                    fullWidth
                    sx={inputSx}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Custo"
                    type="number"
                    value={form.custo}
                    onChange={(e) => setForm((p) => ({ ...p, custo: Number(e.target.value) }))}
                    fullWidth
                    sx={inputSx}
                    InputProps={{
                      startAdornment: <AttachMoneyIcon sx={{ mr: 0.5, color: GRAY_LIGHT, fontSize: '1.1rem' }} />,
                      inputProps: { min: 0, step: 0.01 },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Hora Homem"
                    type="number"
                    value={form.hora_homem}
                    onChange={(e) => setForm((p) => ({ ...p, hora_homem: Number(e.target.value) }))}
                    fullWidth
                    sx={inputSx}
                    InputProps={{
                      startAdornment: <AttachMoneyIcon sx={{ mr: 0.5, color: GRAY_LIGHT, fontSize: '1.1rem' }} />,
                      inputProps: { min: 0, step: 0.01 },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Frete"
                    type="number"
                    value={form.frete}
                    onChange={(e) => setForm((p) => ({ ...p, frete: Number(e.target.value) }))}
                    fullWidth
                    sx={inputSx}
                    InputProps={{
                      startAdornment: <AttachMoneyIcon sx={{ mr: 0.5, color: GRAY_LIGHT, fontSize: '1.1rem' }} />,
                      inputProps: { min: 0, step: 0.01 },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Imposto (%)"
                    type="number"
                    value={form.imposto}
                    onChange={(e) => setForm((p) => ({ ...p, imposto: Number(e.target.value) }))}
                    fullWidth
                    sx={inputSx}
                    InputProps={{
                      startAdornment: <PercentIcon sx={{ mr: 0.5, color: GRAY_LIGHT, fontSize: '1.1rem' }} />,
                      inputProps: { min: 0, step: 0.01 },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Comissão (%)"
                    type="number"
                    value={form.comissao}
                    onChange={(e) => setForm((p) => ({ ...p, comissao: Number(e.target.value) }))}
                    fullWidth
                    sx={inputSx}
                    InputProps={{
                      startAdornment: <PercentIcon sx={{ mr: 0.5, color: GRAY_LIGHT, fontSize: '1.1rem' }} />,
                      inputProps: { min: 0, step: 0.01 },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      bgcolor: alpha(GOLD_PRIMARY, 0.03),
                      border: `1px solid ${alpha(GOLD_PRIMARY, 0.15)}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: alpha(GOLD_PRIMARY, 0.1),
                          color: GOLD_PRIMARY,
                        }}
                      >
                        <CalculateIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: TEXT_DARK }}>
                          Margem Bruta
                        </Typography>
                        <Typography variant="body2" sx={{ color: GRAY_MAIN }}>
                          Calculada com base nos valores informados
                        </Typography>
                      </Box>
                    </Stack>

                    <Typography variant="h3" sx={{ fontWeight: 700, color: GOLD_PRIMARY }}>
                      {moneyBRFromString(margemPreview.toString())}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>

          <Divider sx={{ borderColor: BORDER_LIGHT }} />

          <DialogActions sx={{ px: 4, py: 2.5, bgcolor: WHITE, gap: 2 }}>
            <Button
              onClick={() => setEditOpen(false)}
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
              Cancelar
            </Button>

            <Button
              onClick={handleUpdate}
              variant="contained"
              disabled={saving}
              size="large"
              startIcon={saving ? <CircularProgress size={20} sx={{ color: TEXT_DARK }} /> : <EditIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 5,
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
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogActions>
        </Dialog>

        <AppAlert open={alertOpen} message={alertMessage} severity={alertSeverity} onClose={() => setAlertOpen(false)} />
      </Container>
    </Box>
  );
}