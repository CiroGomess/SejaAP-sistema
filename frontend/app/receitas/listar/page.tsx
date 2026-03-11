'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
  alpha,
  Fade,
  Tooltip,
  Badge,
  Container,
  Grid,
} from '@mui/material';

import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarMonth as CalendarMonthIcon,
  MonetizationOn as MonetizationOnIcon,
  ReceiptLong as ReceiptIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Inventory as InventoryIcon,
  AttachMoney as AttachMoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

import AppAlert, { AlertType } from '../../../components/AppAlert';
import ReceitaEvolutivaChart from '../../../components/receita/ReceitaEvolutivaChart';
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
  purple: '#8B5CF6',
};

const STORAGE_KEY = 'selectedClient';

type Receita = {
  id: number;
  user_id: number;
  numero_orcamento: string | null;
  nome_cliente: string | null;
  data_emissao: string | null;
  data_vencimento: string | null;
  produto_ou_servico: string | null;
  nome_produto_ou_servico: string | null;
  quantidade: string | null;
  valor_unitario: string | null;
  valor_total: string | null;
  unidade_filial: string | null;
  projeto: string | null;
  centro_de_resultado: string | null;
};

type ProdutoOuServico = 'PRODUTO' | 'SERVICO';

type ReceitaForm = {
  user_id: number;
  numero_orcamento: string;
  nome_cliente: string;
  data_emissao: string;
  data_vencimento: string;
  produto_ou_servico: ProdutoOuServico;
  nome_produto_ou_servico: string;
  quantidade: number;
  valor_unitario: number;
  unidade_filial: string;
  projeto: string;
  centro_de_resultado: string;
};

type Pagination = {
  page: number;
  per_page: number;
  items_on_page: number;
  total_items: number;
  total_pages: number;
};

type FaturamentoMes = {
  mes: string;
  faturamento: number;
};

type Stats = {
  mes_maior_faturamento: FaturamentoMes | null;
  mes_menor_faturamento: FaturamentoMes | null;
};

type SelectedClient = {
  id: number;
  code: string;
  name: string;
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

function toNumberSafe(v: string | null): number {
  if (!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function moneyBR(v: string | null): string {
  const n = toNumberSafe(v);
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function moneyBRNumber(v: number | null | undefined): string {
  const n = Number(v ?? 0);
  return (Number.isFinite(n) ? n : 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatMesYYYYMM(mes: string | null | undefined): string {
  if (!mes) return '-';
  const [y, m] = String(mes).split('-');
  if (!y || !m) return String(mes);
  return `${m}/${y}`;
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

function normalizeProdutoOuServico(v: any): ProdutoOuServico {
  return String(v || 'SERVICO').toUpperCase() === 'PRODUTO' ? 'PRODUTO' : 'SERVICO';
}

function toISODate(v: string | null): string {
  return v ? String(v).slice(0, 10) : '';
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

function ReceitasListarPage() {
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<10 | 50 | 100>(10);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Receita[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [stats, setStats] = useState<Stats | null>(null);

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
  const [editing, setEditing] = useState<Receita | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<ReceitaForm>({
    user_id: 0,
    numero_orcamento: '',
    nome_cliente: '',
    data_emissao: '',
    data_vencimento: '',
    produto_ou_servico: 'SERVICO',
    nome_produto_ou_servico: '',
    quantidade: 1,
    valor_unitario: 0,
    unidade_filial: '',
    projeto: '',
    centro_de_resultado: '',
  });

  const totalEstimado = useMemo(() => {
    const q = Number(form.quantidade) || 0;
    const vu = Number(form.valor_unitario) || 0;
    return q * vu;
  }, [form.quantidade, form.valor_unitario]);

  const loadReceitas = useCallback(async () => {
    const client = getSelectedClientFromStorage();
    setSelectedClient(client);

    if (!client?.id) {
      setRows([]);
      setPagination(null);
      setStats(null);
      setLoading(false);
      showAlert('Selecione um cliente no menu lateral para listar as receitas.', 'warning');
      return;
    }

    const userId = Number(client.id);
    if (!Number.isFinite(userId) || userId <= 0) {
      setRows([]);
      setPagination(null);
      setStats(null);
      setLoading(false);
      showAlert('Cliente selecionado inválido (id).', 'error');
      return;
    }

    setLoading(true);
    setLastUpdated(new Date().toLocaleString());

    const qs = new URLSearchParams({
      user_id: String(userId),
      page: String(page),
      per_page: String(perPage),
    }).toString();

    const res = await services(`/receitas?${qs}`, { method: 'GET' });

    if (!res.success) {
      showAlert(pickApiError(res.data), 'error');
      setRows([]);
      setPagination(null);
      setStats(null);
      setLoading(false);
      return;
    }

    const list = Array.isArray(res.data?.receitas) ? res.data.receitas : [];
    const pg = res.data?.pagination ?? null;
    const st: Stats | null =
      res.data?.stats && typeof res.data.stats === 'object'
        ? {
          mes_maior_faturamento: res.data.stats.mes_maior_faturamento ?? null,
          mes_menor_faturamento: res.data.stats.mes_menor_faturamento ?? null,
        }
        : null;

    setRows(list);
    setPagination(pg);
    setStats(st);
    setLoading(false);
  }, [page, perPage]);

  useEffect(() => {
    loadReceitas();
  }, [loadReceitas]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setPage(1);
        setSearch('');
        setTimeout(() => loadReceitas(), 0);
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
        setTimeout(() => loadReceitas(), 0);
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
    };
  }, [selectedClient?.id, loadReceitas]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) => {
      const s = [
        r.id,
        r.user_id,
        r.numero_orcamento,
        r.nome_cliente,
        r.unidade_filial,
        r.projeto,
        r.centro_de_resultado,
        r.produto_ou_servico,
        r.nome_produto_ou_servico,
        r.data_emissao,
        r.data_vencimento,
      ]
        .filter((x) => x !== null && x !== undefined)
        .join(' ')
        .toLowerCase();

      return s.includes(q);
    });
  }, [rows, search]);

  const totalGeralPagina = useMemo(() => {
    return filtered.reduce((acc, r) => acc + toNumberSafe(r.valor_total), 0);
  }, [filtered]);

  const countInvalid = useMemo(() => {
    return filtered.reduce((acc, r) => {
      const suspicious =
        !r.numero_orcamento ||
        !r.nome_cliente ||
        !r.nome_produto_ou_servico ||
        !r.data_emissao ||
        !r.data_vencimento ||
        !r.valor_total;
      return acc + (suspicious ? 1 : 0);
    }, 0);
  }, [filtered]);

  const openEdit = (r: Receita) => {
    setEditing(r);
    setForm({
      user_id: Number(r.user_id || 0),
      numero_orcamento: r.numero_orcamento ?? '',
      nome_cliente: r.nome_cliente ?? '',
      data_emissao: toISODate(r.data_emissao),
      data_vencimento: toISODate(r.data_vencimento),
      produto_ou_servico: normalizeProdutoOuServico(r.produto_ou_servico),
      nome_produto_ou_servico: r.nome_produto_ou_servico ?? '',
      quantidade: toNumberSafe(r.quantidade),
      valor_unitario: toNumberSafe(r.valor_unitario),
      unidade_filial: r.unidade_filial ?? '',
      projeto: r.projeto ?? '',
      centro_de_resultado: r.centro_de_resultado ?? '',
    });
    setEditOpen(true);
  };

  const validateEdit = () => {
    if (!editing) return 'Registro inválido.';
    if (!form.numero_orcamento.trim()) return 'Informe o número do orçamento.';
    if (!form.nome_cliente.trim()) return 'Informe o nome do cliente.';
    if (!form.data_emissao.trim()) return 'Informe a data de emissão.';
    if (!form.data_vencimento.trim()) return 'Informe a data de vencimento.';
    if (!form.nome_produto_ou_servico.trim()) return 'Informe o nome do produto/serviço.';
    if (!form.quantidade || form.quantidade <= 0) return 'Quantidade deve ser maior que zero.';
    if (Number(form.valor_unitario) < 0) return 'Valor unitário inválido.';
    if (!form.unidade_filial.trim()) return 'Informe a unidade/filial.';
    if (!form.projeto.trim()) return 'Informe o projeto.';
    if (!form.centro_de_resultado.trim()) return 'Informe o centro de resultado.';
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

    const payload: any = {
      numero_orcamento: form.numero_orcamento.trim(),
      nome_cliente: form.nome_cliente.trim(),
      data_emissao: form.data_emissao,
      data_vencimento: form.data_vencimento,
      produto_ou_servico: form.produto_ou_servico,
      nome_produto_ou_servico: form.nome_produto_ou_servico.trim(),
      quantidade: Number(form.quantidade),
      valor_unitario: Number(form.valor_unitario),
      unidade_filial: form.unidade_filial.trim(),
      projeto: form.projeto.trim(),
      centro_de_resultado: form.centro_de_resultado.trim(),
    };

    const res = await services(`/receitas/${editing.id}`, { method: 'PUT', data: payload });
    setSaving(false);

    if (!res.success) {
      showAlert(pickApiError(res.data), 'error');
      return;
    }

    showAlert('Receita atualizada com sucesso.', 'success');
    setEditOpen(false);
    setEditing(null);
    await loadReceitas();
  };

  const handleDelete = async (r: Receita) => {
    const result = await Swal.fire({
      title: 'Excluir receita?',
      html: `
        <div style="text-align:left; font-family: inherit;">
          <div style="margin-bottom:12px; color: ${TEXT_DARK}; font-size:16px; font-weight:600;">
            ${r.nome_cliente ?? '-'}
          </div>
          <div style="color: ${GRAY_MAIN}; font-size:13px; margin-bottom:8px;">
            Orçamento: <span style="font-family: monospace; background: ${GRAY_EXTRA_LIGHT}; padding: 2px 6px; border-radius: 4px;">${r.numero_orcamento ?? '-'}</span>
          </div>
          <div style="color: ${GRAY_MAIN}; font-size:13px; margin-bottom:16px;">
            Valor: <span style="font-weight:700; color: ${GOLD_PRIMARY};">${moneyBR(r.valor_total)}</span>
          </div>
          <div style="color: ${STATUS_COLORS.error}; font-size:13px; font-weight:500;">
            Esta ação não poderá ser desfeita.
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: STATUS_COLORS.error,
      cancelButtonColor: GRAY_MAIN,
      focusCancel: true,
      reverseButtons: true,
      background: WHITE,
      backdrop: `rgba(0,0,0,0.4)`,
      customClass: { popup: 'rounded-3xl' },
    });

    if (!result.isConfirmed) return;

    const res = await services(`/receitas/${r.id}`, { method: 'DELETE' });

    if (!res.success) {
      showAlert(pickApiError(res.data), 'error');
      return;
    }

    showAlert('Receita removida com sucesso.', 'warning');
    await loadReceitas();
  };

  const pageLabel = useMemo(() => {
    const p = pagination?.page ?? page;
    const tp = pagination?.total_pages ?? 0;
    return tp > 0 ? `Página ${p} de ${tp}` : `Página ${p}`;
  }, [pagination, page]);

  const canPrev = (pagination?.page ?? page) > 1;
  const canNext = pagination ? pagination.page < pagination.total_pages : false;

  // UI quando não há cliente selecionado
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
                <ReceiptIcon sx={{ fontSize: 40 }} />
              </Avatar>

              <Typography variant="h4" sx={{ fontWeight: 700, color: TEXT_DARK, mb: 1 }}>
                Nenhum cliente selecionado
              </Typography>
              
              <Typography sx={{ color: GRAY_MAIN, mb: 4, maxWidth: 360, mx: 'auto' }}>
                Para visualizar as receitas, primeiro selecione um cliente no menu lateral.
              </Typography>

              <Button
                variant="contained"
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
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: TEXT_DARK, mb: 0.5 }}>
                  Receitas do Cliente
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: alpha(GOLD_PRIMARY, 0.1),
                      color: GOLD_PRIMARY,
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Typography variant="body1" sx={{ color: GRAY_MAIN }}>
                    <strong>{selectedClient.name}</strong> • Código: {selectedClient.code}
                  </Typography>
                </Stack>
              </Box>

              <Tooltip title="Última atualização">
                <Chip
                  icon={<RefreshIcon />}
                  label={lastUpdated || 'Carregando...'}
                  size="small"
                  sx={{
                    bgcolor: WHITE,
                    color: GRAY_MAIN,
                    border: `1px solid ${BORDER_LIGHT}`,
                    borderRadius: 2,
                    height: 36,
                  }}
                />
              </Tooltip>
            </Stack>
          </Box>
        </Fade>

        {/* Gráfico Evolutivo */}
        {selectedClient?.id && (
          <Fade in timeout={600}>
            <Box sx={{ mb: 4 }}>
              <ReceitaEvolutivaChart userId={selectedClient.id} />
            </Box>
          </Fade>
        )}

       

        {/* Tabela de Receitas */}
        <Fade in timeout={800}>
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

            {/* Toolbar */}
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
                  Lista de Receitas
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                  <Chip
                    icon={<ReceiptIcon />}
                    label={`${pagination?.total_items || filtered.length} registros`}
                    size="small"
                    sx={{ bgcolor: alpha(GOLD_PRIMARY, 0.1), color: GOLD_PRIMARY, fontWeight: 600 }}
                  />
                  <Chip
                    icon={<AttachMoneyIcon />}
                    label={`Total: ${totalGeralPagina.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                    size="small"
                    sx={{ bgcolor: alpha(STATUS_COLORS.purple, 0.1), color: STATUS_COLORS.purple, fontWeight: 600 }}
                  />
                  {countInvalid > 0 && (
                    <Chip
                      icon={<WarningIcon />}
                      label={`${countInvalid} incompleto(s)`}
                      size="small"
                      sx={{ bgcolor: alpha(STATUS_COLORS.warning, 0.1), color: STATUS_COLORS.warning, fontWeight: 600 }}
                    />
                  )}
                </Stack>
              </Box>

              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                {/* Busca */}
                <TextField
                  size="small"
                  placeholder="Buscar receitas..."
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
                    onClick={() => loadReceitas()}
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
                      'Orçamento',
                      'Produto/Serviço',
                      'Emissão',
                      'Vencimento',
                      'Qtd',
                      'Unitário',
                      'Total',
                      'Filial',
                      'Projeto',
                      'Centro Resultado',
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
                        align={col === 'Ações' ? 'center' : 'left'}
                      >
                        {col}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center" sx={{ py: 8 }}>
                        <CircularProgress size={48} sx={{ color: GOLD_PRIMARY, mb: 2 }} />
                        <Typography sx={{ color: GRAY_MAIN, fontWeight: 500 }}>
                          Carregando receitas...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center" sx={{ py: 8 }}>
                        <ReceiptIcon sx={{ fontSize: 48, color: GRAY_LIGHT, opacity: 0.5, mb: 2 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600, color: TEXT_DARK, mb: 1 }}>
                          Nenhuma receita encontrada
                        </Typography>
                        <Typography sx={{ color: GRAY_MAIN }}>
                          {search ? 'Tente ajustar os termos da busca' : 'Nenhuma receita cadastrada para este cliente'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => {
                      const incomplete =
                        !r.numero_orcamento ||
                        !r.nome_cliente ||
                        !r.nome_produto_ou_servico ||
                        !r.data_emissao ||
                        !r.data_vencimento ||
                        !r.valor_total;

                      return (
                        <TableRow
                          key={r.id}
                          hover
                          sx={{
                            '&:hover': { bgcolor: alpha(GOLD_PRIMARY, 0.02) },
                            ...(incomplete && { bgcolor: alpha(STATUS_COLORS.warning, 0.05) }),
                          }}
                        >
                          <TableCell>
                            <Chip
                              label={r.numero_orcamento ?? '-'}
                              size="small"
                              sx={{
                                fontFamily: 'monospace',
                                bgcolor: alpha(GOLD_PRIMARY, 0.1),
                                color: GOLD_PRIMARY,
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>

                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                label={r.produto_ou_servico === 'PRODUTO' ? '📦' : '📋'}
                                size="small"
                                sx={{
                                  bgcolor: alpha(STATUS_COLORS.purple, 0.1),
                                  color: STATUS_COLORS.purple,
                                  minWidth: 40,
                                }}
                              />
                              <Typography variant="body2" sx={{ color: TEXT_DARK, fontWeight: 500 }}>
                                {r.nome_produto_ou_servico ?? '-'}
                              </Typography>
                            </Stack>
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2" sx={{ color: GRAY_MAIN }}>
                              {r.data_emissao ? new Date(r.data_emissao).toLocaleDateString('pt-BR') : '-'}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2" sx={{ color: GRAY_MAIN }}>
                              {r.data_vencimento ? new Date(r.data_vencimento).toLocaleDateString('pt-BR') : '-'}
                            </Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Typography sx={{ fontWeight: 600, color: TEXT_DARK }}>
                              {r.quantidade ?? '-'}
                            </Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Typography sx={{ fontWeight: 600, color: TEXT_DARK }}>
                              {moneyBR(r.valor_unitario)}
                            </Typography>
                          </TableCell>

                          <TableCell align="right">
                            <Typography sx={{ fontWeight: 700, color: GOLD_PRIMARY }}>
                              {moneyBR(r.valor_total)}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2" sx={{ color: GRAY_MAIN }}>
                              {r.unidade_filial ?? '-'}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2" sx={{ color: GRAY_MAIN }}>
                              {r.projeto ?? '-'}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2" sx={{ color: GRAY_MAIN }}>
                              {r.centro_de_resultado ?? '-'}
                            </Typography>
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

            {/* Footer */}
            <Box sx={{ p: 2, bgcolor: GRAY_EXTRA_LIGHT, borderTop: `1px solid ${BORDER_LIGHT}` }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" sx={{ color: GRAY_MAIN }}>
                  Última atualização: {lastUpdated || '-'}
                </Typography>
                <Typography variant="caption" sx={{ color: GRAY_MAIN }}>
                  Exibindo {filtered.length} de {pagination?.total_items || filtered.length} receitas
                </Typography>
              </Stack>
            </Box>
          </Card>
        </Fade>

        {/* Modal de Edição Premium */}
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
                    Editar Receita
                  </Typography>
                  <Typography variant="body2" sx={{ color: GRAY_MAIN }}>
                    ID: {editing?.id} • {editing?.nome_cliente}
                  </Typography>
                </Box>
              </Stack>
            </Box>
            <Divider sx={{ borderColor: BORDER_LIGHT }} />
          </DialogTitle>

          <DialogContent sx={{ bgcolor: WHITE, p: 0 }}>
            <Box sx={{ px: 4, py: 3 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Nº do Orçamento"
                    value={form.numero_orcamento}
                    onChange={(e) => setForm((p) => ({ ...p, numero_orcamento: e.target.value }))}
                    fullWidth
                    sx={inputSx}
                    InputProps={{
                      startAdornment: <Box component="span" sx={{ mr: 0.5, color: GRAY_LIGHT }}>#</Box>,
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField
                    label="Cliente"
                    value={form.nome_cliente}
                    disabled
                    fullWidth
                    sx={inputSx}
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ mr: 0.5, color: GRAY_LIGHT }} />,
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Data de Emissão"
                    type="date"
                    value={form.data_emissao}
                    onChange={(e) => setForm((p) => ({ ...p, data_emissao: e.target.value }))}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={inputSx}
                    InputProps={{
                      startAdornment: <CalendarMonthIcon sx={{ mr: 0.5, color: GRAY_LIGHT }} />,
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Data de Vencimento"
                    type="date"
                    value={form.data_vencimento}
                    onChange={(e) => setForm((p) => ({ ...p, data_vencimento: e.target.value }))}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={inputSx}
                    InputProps={{
                      startAdornment: <CalendarMonthIcon sx={{ mr: 0.5, color: GRAY_LIGHT }} />,
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    label="Tipo"
                    value={form.produto_ou_servico}
                    onChange={(e) => setForm((p) => ({ ...p, produto_ou_servico: e.target.value as ProdutoOuServico }))}
                    fullWidth
                    sx={inputSx}
                    InputProps={{
                      startAdornment: <InventoryIcon sx={{ mr: 0.5, color: GRAY_LIGHT }} />,
                    }}
                  >
                    <MenuItem value="SERVICO">📋 Serviço</MenuItem>
                    <MenuItem value="PRODUTO">📦 Produto</MenuItem>
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField
                    label="Nome do Produto/Serviço"
                    value={form.nome_produto_ou_servico}
                    onChange={(e) => setForm((p) => ({ ...p, nome_produto_ou_servico: e.target.value }))}
                    fullWidth
                    sx={inputSx}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    label="Quantidade"
                    type="number"
                    value={form.quantidade}
                    onChange={(e) => setForm((p) => ({ ...p, quantidade: Number(e.target.value) }))}
                    fullWidth
                    sx={inputSx}
                    InputProps={{
                      startAdornment: <Box component="span" sx={{ mr: 0.5, color: GRAY_LIGHT }}>x</Box>,
                      inputProps: { min: 1, step: 1 },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    label="Valor Unitário"
                    type="number"
                    value={form.valor_unitario}
                    onChange={(e) => setForm((p) => ({ ...p, valor_unitario: Number(e.target.value) }))}
                    fullWidth
                    sx={inputSx}
                    InputProps={{
                      startAdornment: <AttachMoneyIcon sx={{ mr: 0.5, color: GRAY_LIGHT }} />,
                      inputProps: { min: 0, step: 0.01 },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Unidade / Filial"
                    value={form.unidade_filial}
                    onChange={(e) => setForm((p) => ({ ...p, unidade_filial: e.target.value }))}
                    fullWidth
                    sx={inputSx}
                    InputProps={{
                      startAdornment: <BusinessIcon sx={{ mr: 0.5, color: GRAY_LIGHT }} />,
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Projeto"
                    value={form.projeto}
                    onChange={(e) => setForm((p) => ({ ...p, projeto: e.target.value }))}
                    fullWidth
                    sx={inputSx}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Centro de Resultado"
                    value={form.centro_de_resultado}
                    onChange={(e) => setForm((p) => ({ ...p, centro_de_resultado: e.target.value }))}
                    fullWidth
                    sx={inputSx}
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
                        <AttachMoneyIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: TEXT_DARK }}>
                          Valor Total
                        </Typography>
                        <Typography variant="body2" sx={{ color: GRAY_MAIN }}>
                          {form.quantidade} × {moneyBR(form.valor_unitario?.toString() || '0')}
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: GOLD_PRIMARY }}>
                      R$ {totalEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

// ✅ Exportação padrão corrigida
export default ReceitasListarPage;