'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';

import {
  Box,
  Container,
  Card,
  Typography,
  Toolbar,
  Divider,
  alpha,
} from '@mui/material';

import AppAlert, { AlertType } from '@/components/AppAlert';
import services from '@/services/service';

import { SelectedClient, ContabilidadeData, Pagination } from '@/components/contabilidade/types';
import NoClientState from '@/components/contabilidade/NoClientState';
import ListHeader from '@/components/contabilidade/ListHeader';
import ListFilters from '@/components/contabilidade/ListFilters';
import TablePagination from '@/components/contabilidade/TablePagination';
import DataTable from '@/components/contabilidade/DataTable';
import ContabilidadeChart from '@/components/contabilidade/ContabilidadeChart';

const STORAGE_KEY = 'selectedClient';
const BRAND = '#E6C969';

type ContabilidadeDashboardResumo = {
  receitas: number;
  despesas: number;
  resultado: number;
  margem_percentual: number;
  total_registros_ano: number;
  label_total_registros: string;
};

type ContabilidadeDashboardMensal = {
  mes_numero: number;
  mes: string;
  receitas: number;
  despesas: number;
  resultado: number;
};

type ContabilidadeDashboardTopDescricao = {
  rank: number;
  descricao: string;
  categoria: string;
  valor: number;
  total_itens: number;
  percentual_sobre_receitas: number;
  tipo: 'receita' | 'despesa';
  label_rank: string;
};

type ContabilidadeDashboardTopCategoria = {
  rank: number;
  categoria: string;
  valor: number;
  total_itens: number;
  percentual_sobre_receitas: number;
  tipo: 'receita' | 'despesa';
  label_rank: string;
};

type ContabilidadeDashboardFiltros = {
  user_id: number;
  ano: number;
  anos_disponiveis: number[];
};

type ContabilidadeDashboard = {
  filtros: ContabilidadeDashboardFiltros;
  resumo: ContabilidadeDashboardResumo;
  mensal: ContabilidadeDashboardMensal[];
  top_descricoes: ContabilidadeDashboardTopDescricao[];
  top_categorias: ContabilidadeDashboardTopCategoria[];
};

function pickApiError(data: any): string {
  if (!data) return 'Erro inesperado.';
  if (typeof data === 'string') return data;
  if (typeof data.detail === 'string') return data.detail;
  if (typeof data.error === 'string') return data.error;
  if (typeof data.details === 'string') return data.details;
  return 'Falha ao processar a requisição.';
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

export default function ContabilidadeListarPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null);

  const [anoFilter, setAnoFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<10 | 25 | 50 | 100>(10);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const [rows, setRows] = useState<ContabilidadeData[]>([]);
  const [dashboard, setDashboard] = useState<ContabilidadeDashboard | null>(null);

  const [lastUpdated, setLastUpdated] = useState<string>('');

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<AlertType>('info');

  const showAlert = (message: string, severity: AlertType) => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadDashboard = useCallback(async () => {
    const client = getSelectedClientFromStorage();
    setSelectedClient(client);

    if (!client?.id) {
      setDashboard(null);
      setDashboardLoading(false);
      return;
    }

    setDashboardLoading(true);

    try {
      const params = new URLSearchParams();
      params.append('user_id', String(client.id));

      if (anoFilter) {
        params.append('ano', anoFilter);
      }

      const res = await services(`/contabilidade/dashboard?${params.toString()}`, {
        method: 'GET',
      });

      if (!res.success) {
        showAlert(pickApiError(res.data), 'error');
        setDashboard(null);
        return;
      }

      const dashboardData = res.data as ContabilidadeDashboard;
      setDashboard(dashboardData);

      if (!anoFilter && dashboardData?.filtros?.ano) {
        setAnoFilter(String(dashboardData.filtros.ano));
      }
    } catch (error) {
      showAlert('Erro ao carregar dashboard contábil', 'error');
      setDashboard(null);
    } finally {
      setDashboardLoading(false);
    }
  }, [anoFilter]);

  const loadData = useCallback(async () => {
    const client = getSelectedClientFromStorage();
    setSelectedClient(client);

    if (!client?.id) {
      setRows([]);
      setPagination(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLastUpdated(new Date().toLocaleString());

    const params = new URLSearchParams();
    params.append('user_id', String(client.id));
    params.append('page', String(page));
    params.append('per_page', String(perPage));

    if (anoFilter) {
      params.append('ano', anoFilter);
    }

    try {
      const res = await services(`/contabilidade?${params.toString()}`, { method: 'GET' });

      if (!res.success) {
        showAlert(pickApiError(res.data), 'error');
        setRows([]);
        setPagination(null);
        setLoading(false);
        return;
      }

      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      const pg = res.data?.pagination ?? null;

      setRows(list);
      setPagination(pg);
    } catch (error) {
      showAlert('Erro ao carregar dados', 'error');
      setRows([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, anoFilter]);

  useEffect(() => {
    if (!mounted) return;
    loadDashboard();
  }, [mounted, loadDashboard]);

  useEffect(() => {
    if (!mounted) return;
    loadData();
  }, [mounted, loadData]);

  useEffect(() => {
    if (!mounted) return;

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setPage(1);
        setSearch('');
        setAnoFilter('');
        setTimeout(() => {
          loadDashboard();
          loadData();
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
        setAnoFilter('');
        setTimeout(() => {
          loadDashboard();
          loadData();
        }, 0);
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
    };
  }, [selectedClient?.id, loadDashboard, loadData, mounted]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) => {
      const s = [
        r.descricao,
        r.categoria,
        String(r.valor),
        String(r.ano),
        (r as any).data_registro ?? '',
      ]
        .filter((x) => x !== null && x !== undefined)
        .join(' ')
        .toLowerCase();

      return s.includes(q);
    });
  }, [rows, search]);

  const totalPagina = useMemo(() => {
    return filtered.reduce((acc, r) => acc + (Number(r.valor) || 0), 0);
  }, [filtered]);

  const totalItems = pagination?.total_items ?? filtered.length;

  if (!mounted) {
    return null;
  }

  if (!selectedClient) {
    return <NoClientState onGoToClients={() => (window.location.href = '/clients')} />;
  }

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', py: 4 }}>
      <Container maxWidth={false} sx={{ maxWidth: '95%', mx: 'auto' }}>
        <ListHeader
          client={selectedClient}
          totalItems={dashboard?.resumo?.total_registros_ano ?? totalItems}
          totalValue={dashboard?.resumo?.resultado ?? totalPagina}
        />

        <ContabilidadeChart
          userId={selectedClient.id}
          ano={anoFilter ? Number(anoFilter) : null}
          onAnoChange={(nextAno) => {
            setAnoFilter(nextAno ? String(nextAno) : '');
            setPage(1);
          }}
          dashboard={dashboard}
          loading={dashboardLoading}
        />

        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            border: `1px solid ${alpha(BRAND, 0.1)}`,
            bgcolor: '#FFFFFF',
            overflow: 'hidden',
            boxShadow: `0 20px 40px ${alpha('#0F172A', 0.05)}`,
          }}
        >
          <Box sx={{ height: 6, background: `linear-gradient(90deg, ${BRAND}, #F5E6B8)` }} />

          <Toolbar
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 2,
              px: 3,
              py: 2.5,
              bgcolor: '#FFFFFF',
              flexWrap: 'wrap',
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
                Extrato / Lançamentos
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                {pagination ? `Total: ${pagination.total_items} registros` : 'Carregando...'}
              </Typography>
            </Box>

            <ListFilters
              search={search}
              onSearchChange={setSearch}
              anoFilter={anoFilter}
              onAnoChange={(value) => {
                setAnoFilter(value);
                setPage(1);
              }}
              perPage={perPage}
              onPerPageChange={(value) => {
                setPerPage(value as 10 | 25 | 50 | 100);
                setPage(1);
              }}
              onRefresh={async () => {
                await loadDashboard();
                await loadData();
              }}
              loading={loading || dashboardLoading}
              brand={BRAND}
            />
          </Toolbar>

          <Divider sx={{ borderColor: alpha(BRAND, 0.1) }} />

          <DataTable data={filtered} loading={loading} brand={BRAND} />

          <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderTop: `1px solid ${alpha(BRAND, 0.1)}` }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                Última atualização: {lastUpdated || '-'}
              </Typography>

              <TablePagination
                page={page}
                totalPages={pagination?.total_pages || 1}
                onPageChange={setPage}
                disabled={loading}
                loading={loading}
                brand={BRAND}
              />
            </Box>
          </Box>
        </Card>
      </Container>

      <AppAlert
        open={alertOpen}
        message={alertMessage}
        severity={alertSeverity}
        onClose={() => setAlertOpen(false)}
      />
    </Box>
  );
}