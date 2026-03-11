'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Chip,
  Stack,
  TextField,
  MenuItem,
  Avatar,
  alpha,
  Fade,
  Paper,
  Divider,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip as MuiTooltip,
} from '@mui/material';

import {
  TrendingUp,
  TrendingDown,
  CalendarMonth,
  AttachMoney,
  ShowChart,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline,
  TrendingFlat,
  Calculate,
  Percent,
} from '@mui/icons-material';

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

// Cores para os gráficos
const CHART_COLORS = {
  primary: GOLD_PRIMARY,
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  purple: '#8B5CF6',
};

const PIE_COLORS = [GOLD_PRIMARY, '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];

/* =========================
   TIPOS (baseados na API real)
========================= */
type EvolucaoItem = {
  mes: number;
  valor_total: number;
};

type Destaque = {
  mes: number;
  valor_total: number;
};

type ApiResponse = {
  receita_evolutiva: EvolucaoItem[];
  destaques: {
    mes_maior_faturamento: Destaque | null;
    mes_menor_faturamento: Destaque | null;
  };
};

type Props = {
  userId: number;
};

type ChartType = 'line' | 'area' | 'bar' | 'pie';

/* =========================
   HELPERS
========================= */
function nomeMes(m: number) {
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return meses[m - 1] ?? '-';
}

function nomeMesAbreviado(m: number) {
  const meses = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ];
  return meses[m - 1] ?? '-';
}

function money(v?: number | null) {
  return (v ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPercent(v: number) {
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
}

/* =========================
   COMPONENTE PRINCIPAL
========================= */
export default function ReceitaEvolutivaChart({ userId }: Props) {
  const [ano, setAno] = useState<number | null>(null);
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EvolucaoItem[]>([]);
  const [destaques, setDestaques] = useState<ApiResponse['destaques'] | null>(null);
  const [chartType, setChartType] = useState<ChartType>('line');

  // Gerar lista de anos (últimos 5 anos)
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const anos = [];
    for (let i = 0; i < 5; i++) {
      anos.push(currentYear - i);
    }
    setAnosDisponiveis(anos);
    setAno(currentYear); // Define o ano atual como padrão
  }, []);

  /* Load backend - APENAS dados reais */
  useEffect(() => {
    if (!userId || !ano) return;

    const load = async () => {
      setLoading(true);

      const res = await services(
        `/receitas/evolutiva?user_id=${userId}&ano=${ano}`,
        { method: 'GET' }
      );

      if (res.success) {
        setData(res.data?.receita_evolutiva ?? []);
        setDestaques(res.data?.destaques ?? null);
      } else {
        setData([]);
        setDestaques(null);
      }

      setLoading(false);
    };

    load();
  }, [userId, ano]);

  /* Processamento dos dados reais */
  const chartData = useMemo(() => {
    return data
      .sort((a, b) => a.mes - b.mes)
      .map((item) => ({
        mes: item.mes,
        mesLabel: nomeMesAbreviado(item.mes),
        mesCompleto: nomeMes(item.mes),
        faturamento: item.valor_total,
      }));
  }, [data]);

  /* Estatísticas baseadas nos dados reais */
  const estatisticas = useMemo(() => {
    if (chartData.length === 0) return null;

    const valores = chartData.map(d => d.faturamento);
    const total = valores.reduce((acc, v) => acc + v, 0);
    const media = total / valores.length;
    const max = Math.max(...valores);
    const min = Math.min(...valores);
    const mesMax = chartData.find(d => d.faturamento === max)?.mesCompleto || '';
    const mesMin = chartData.find(d => d.faturamento === min)?.mesCompleto || '';
    
    // Variação percentual (último mês vs primeiro mês)
    const primeiro = valores[0];
    const ultimo = valores[valores.length - 1];
    const variacaoAnual = primeiro > 0 ? ((ultimo - primeiro) / primeiro) * 100 : 0;

    // Desvio padrão (volatilidade)
    const variancia = valores.reduce((acc, v) => acc + Math.pow(v - media, 2), 0) / valores.length;
    const desvioPadrao = Math.sqrt(variancia);

    return {
      total,
      media,
      max,
      min,
      mesMax,
      mesMin,
      variacaoAnual,
      desvioPadrao,
      qtdMeses: chartData.length,
    };
  }, [chartData]);

  /* Crescimento mês a mês (baseado nos dados reais) */
  const crescimentoMensal = useMemo(() => {
    return chartData.map((item, index) => {
      if (index === 0) return { ...item, crescimento: 0 };
      const anterior = chartData[index - 1].faturamento;
      const atual = item.faturamento;
      const crescimento = anterior > 0 ? ((atual - anterior) / anterior) * 100 : 0;
      return { ...item, crescimento };
    });
  }, [chartData]);

  if (!ano || loading) {
    return (
      <Fade in timeout={500}>
        <Card
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 4,
            border: `1px solid ${BORDER_LIGHT}`,
            bgcolor: WHITE,
          }}
        >
          <CardContent sx={{ py: 8, textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ color: GOLD_PRIMARY, mb: 3 }} />
            <Typography variant="h6" sx={{ color: GRAY_MAIN, fontWeight: 500 }}>
              Carregando dados de receita...
            </Typography>
          </CardContent>
        </Card>
      </Fade>
    );
  }

  return (
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

        <CardContent sx={{ p: 3 }}>
          {/* Header com controles */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={2}
            sx={{ mb: 3 }}
          >
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
                <Timeline />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                  Análise de Receita
                </Typography>
                <Typography variant="body2" sx={{ color: GRAY_MAIN }}>
                  {chartData.length > 0 ? `${chartData.length} meses com dados` : 'Selecione um ano'}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center">
              {/* Seletor de Ano */}
              <TextField
                select
                size="small"
                label="Ano"
                value={ano}
                onChange={(e) => setAno(Number(e.target.value))}
                sx={{ minWidth: 120 }}
              >
                {anosDisponiveis.map((a) => (
                  <MenuItem key={a} value={a}>
                    {a}
                  </MenuItem>
                ))}
              </TextField>

              {/* Seletor de Tipo de Gráfico - só mostra se houver dados */}
              {chartData.length > 0 && (
                <ToggleButtonGroup
                  size="small"
                  value={chartType}
                  exclusive
                  onChange={(_, value) => value && setChartType(value)}
                  sx={{
                    '& .MuiToggleButton-root': {
                      borderColor: BORDER_LIGHT,
                      color: GRAY_MAIN,
                      '&.Mui-selected': {
                        bgcolor: alpha(GOLD_PRIMARY, 0.1),
                        color: GOLD_PRIMARY,
                        borderColor: GOLD_PRIMARY,
                      },
                    },
                  }}
                >
                  <ToggleButton value="line">
                    <Timeline fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="area">
                    <ShowChart fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="bar">
                    <BarChartIcon fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="pie">
                    <PieChartIcon fontSize="small" />
                  </ToggleButton>
                </ToggleButtonGroup>
              )}
            </Stack>
          </Stack>

          {/* Mensagem quando não há dados */}
          {chartData.length === 0 && (
            <Fade in timeout={500}>
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <AttachMoney sx={{ fontSize: 60, color: GRAY_LIGHT, opacity: 0.5, mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: TEXT_DARK, mb: 1 }}>
                  Nenhum dado encontrado para {ano}
                </Typography>
                <Typography sx={{ color: GRAY_MAIN, mb: 3 }}>
                  Não há receitas cadastradas para o ano selecionado.
                </Typography>
                <Chip
                  label="Tente outro ano"
                  onClick={() => setAno(ano - 1)}
                  sx={{
                    bgcolor: alpha(GOLD_PRIMARY, 0.1),
                    color: GOLD_PRIMARY,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                />
              </Box>
            </Fade>
          )}

          {/* Cards de Estatísticas - só mostra se houver dados */}
          {chartData.length > 0 && estatisticas && (
            <>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {/* Total Anual */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      bgcolor: alpha(GOLD_PRIMARY, 0.05),
                      border: `1px solid ${alpha(GOLD_PRIMARY, 0.2)}`,
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ bgcolor: alpha(GOLD_PRIMARY, 0.1), color: GOLD_PRIMARY, width: 40, height: 40 }}>
                        <AttachMoney />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" sx={{ color: GRAY_MAIN }}>Faturamento Total</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                          {money(estatisticas.total)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                {/* Média Mensal */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      bgcolor: alpha(CHART_COLORS.info, 0.05),
                      border: `1px solid ${alpha(CHART_COLORS.info, 0.2)}`,
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ bgcolor: alpha(CHART_COLORS.info, 0.1), color: CHART_COLORS.info, width: 40, height: 40 }}>
                        <Calculate />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" sx={{ color: GRAY_MAIN }}>Média Mensal</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                          {money(estatisticas.media)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                {/* Variação Anual */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      bgcolor: alpha(estatisticas.variacaoAnual >= 0 ? CHART_COLORS.success : CHART_COLORS.error, 0.05),
                      border: `1px solid ${alpha(estatisticas.variacaoAnual >= 0 ? CHART_COLORS.success : CHART_COLORS.error, 0.2)}`,
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar 
                        sx={{ 
                          bgcolor: alpha(estatisticas.variacaoAnual >= 0 ? CHART_COLORS.success : CHART_COLORS.error, 0.1), 
                          color: estatisticas.variacaoAnual >= 0 ? CHART_COLORS.success : CHART_COLORS.error, 
                          width: 40, 
                          height: 40 
                        }}
                      >
                        {estatisticas.variacaoAnual >= 0 ? <TrendingUp /> : <TrendingDown />}
                      </Avatar>
                      <Box>
                        <Typography variant="caption" sx={{ color: GRAY_MAIN }}>Crescimento Anual</Typography>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 700, 
                            color: estatisticas.variacaoAnual >= 0 ? CHART_COLORS.success : CHART_COLORS.error 
                          }}
                        >
                          {formatPercent(estatisticas.variacaoAnual)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                {/* Volatilidade (Desvio Padrão) */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      bgcolor: alpha(CHART_COLORS.purple, 0.05),
                      border: `1px solid ${alpha(CHART_COLORS.purple, 0.2)}`,
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ bgcolor: alpha(CHART_COLORS.purple, 0.1), color: CHART_COLORS.purple, width: 40, height: 40 }}>
                        <Percent />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" sx={{ color: GRAY_MAIN }}>Volatilidade</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                          {money(estatisticas.desvioPadrao)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              {/* Gráfico Principal */}
              <Box sx={{ width: '100%', height: 400, mb: 4 }}>
                <ResponsiveContainer>
                  {chartType === 'pie' ? (
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={140}
                        paddingAngle={2}
                        dataKey="faturamento"
                        nameKey="mesLabel"
                        label={({ mesLabel, percent }) => `${mesLabel} ${(percent * 100).toFixed(0)}%`}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: DARK_BG,
                          border: `1px solid ${BORDER_LIGHT}`,
                          borderRadius: 8,
                          color: WHITE,
                        }}
                        formatter={(value: number) => money(value)}
                      />
                    </PieChart>
                  ) : chartType === 'line' ? (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(GRAY_MAIN, 0.1)} />
                      <XAxis 
                        dataKey="mesLabel" 
                        stroke={GRAY_MAIN}
                        tick={{ fill: GRAY_MAIN, fontSize: 12 }}
                      />
                      <YAxis
                        stroke={GRAY_MAIN}
                        tick={{ fill: GRAY_MAIN, fontSize: 12 }}
                        tickFormatter={(v) => money(v).replace('R$', '')}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: DARK_BG,
                          border: `1px solid ${BORDER_LIGHT}`,
                          borderRadius: 8,
                          color: WHITE,
                        }}
                        formatter={(value: number) => money(value)}
                        labelFormatter={(label) => `Mês: ${label}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="faturamento"
                        name="Faturamento"
                        stroke={GOLD_PRIMARY}
                        strokeWidth={3}
                        dot={{ r: 4, fill: GOLD_PRIMARY }}
                        activeDot={{ r: 6, fill: GOLD_PRIMARY }}
                      />
                    </LineChart>
                  ) : chartType === 'area' ? (
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={GOLD_PRIMARY} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={GOLD_PRIMARY} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(GRAY_MAIN, 0.1)} />
                      <XAxis 
                        dataKey="mesLabel" 
                        stroke={GRAY_MAIN}
                        tick={{ fill: GRAY_MAIN, fontSize: 12 }}
                      />
                      <YAxis
                        stroke={GRAY_MAIN}
                        tick={{ fill: GRAY_MAIN, fontSize: 12 }}
                        tickFormatter={(v) => money(v).replace('R$', '')}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: DARK_BG,
                          border: `1px solid ${BORDER_LIGHT}`,
                          borderRadius: 8,
                          color: WHITE,
                        }}
                        formatter={(value: number) => money(value)}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="faturamento"
                        name="Faturamento"
                        stroke={GOLD_PRIMARY}
                        strokeWidth={3}
                        fill="url(#colorFaturamento)"
                      />
                    </AreaChart>
                  ) : (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(GRAY_MAIN, 0.1)} />
                      <XAxis 
                        dataKey="mesLabel" 
                        stroke={GRAY_MAIN}
                        tick={{ fill: GRAY_MAIN, fontSize: 12 }}
                      />
                      <YAxis
                        stroke={GRAY_MAIN}
                        tick={{ fill: GRAY_MAIN, fontSize: 12 }}
                        tickFormatter={(v) => money(v).replace('R$', '')}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: DARK_BG,
                          border: `1px solid ${BORDER_LIGHT}`,
                          borderRadius: 8,
                          color: WHITE,
                        }}
                        formatter={(value: number) => money(value)}
                      />
                      <Legend />
                      <Bar dataKey="faturamento" name="Faturamento" fill={GOLD_PRIMARY} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </Box>

              {/* Cards de Destaques */}
              {destaques && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {/* Maior Faturamento */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        bgcolor: alpha(CHART_COLORS.success, 0.05),
                        border: `1px solid ${alpha(CHART_COLORS.success, 0.2)}`,
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          sx={{
                            bgcolor: alpha(CHART_COLORS.success, 0.1),
                            color: CHART_COLORS.success,
                            width: 48,
                            height: 48,
                          }}
                        >
                          <TrendingUp />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: CHART_COLORS.success, fontWeight: 600 }}>
                            Mês de Maior Faturamento
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: TEXT_DARK, mt: 0.5 }}>
                            {money(destaques.mes_maior_faturamento?.valor_total)}
                          </Typography>
                          <Chip
                            icon={<CalendarMonth sx={{ fontSize: '0.8rem' }} />}
                            label={nomeMes(destaques.mes_maior_faturamento?.mes ?? 0)}
                            size="small"
                            sx={{
                              mt: 1,
                              bgcolor: alpha(CHART_COLORS.success, 0.1),
                              color: CHART_COLORS.success,
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>

                  {/* Menor Faturamento */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        bgcolor: alpha(CHART_COLORS.warning, 0.05),
                        border: `1px solid ${alpha(CHART_COLORS.warning, 0.2)}`,
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          sx={{
                            bgcolor: alpha(CHART_COLORS.warning, 0.1),
                            color: CHART_COLORS.warning,
                            width: 48,
                            height: 48,
                          }}
                        >
                          <TrendingDown />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: CHART_COLORS.warning, fontWeight: 600 }}>
                            Mês de Menor Faturamento
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: TEXT_DARK, mt: 0.5 }}>
                            {money(destaques.mes_menor_faturamento?.valor_total)}
                          </Typography>
                          <Chip
                            icon={<CalendarMonth sx={{ fontSize: '0.8rem' }} />}
                            label={nomeMes(destaques.mes_menor_faturamento?.mes ?? 0)}
                            size="small"
                            sx={{
                              mt: 1,
                              bgcolor: alpha(CHART_COLORS.warning, 0.1),
                              color: CHART_COLORS.warning,
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {/* Crescimento Mês a Mês */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: `1px solid ${BORDER_LIGHT}`,
                  bgcolor: alpha(GOLD_PRIMARY, 0.02),
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: TEXT_DARK, mb: 2 }}>
                  Crescimento Mês a Mês
                </Typography>
                
                <Grid container spacing={2}>
                  {crescimentoMensal.slice(1).map((item, index) => (
                    <Grid size={{ xs: 6, sm: 3, md: 2 }} key={index}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: WHITE,
                          border: `1px solid ${alpha(item.crescimento >= 0 ? CHART_COLORS.success : CHART_COLORS.error, 0.2)}`,
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="caption" sx={{ color: GRAY_MAIN }}>
                          {item.mesLabel}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: item.crescimento >= 0 ? CHART_COLORS.success : CHART_COLORS.error,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 0.5,
                          }}
                        >
                          {item.crescimento >= 0 ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                          {formatPercent(item.crescimento)}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </>
          )}

          {/* Rodapé - sempre visível */}
          <Divider sx={{ my: 3, borderColor: BORDER_LIGHT }} />

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" sx={{ color: GRAY_LIGHT }}>
              {chartData.length > 0 
                ? `Análise baseada em ${chartData.length} meses de dados reais`
                : `Nenhum dado disponível para ${ano}`}
            </Typography>
            <MuiTooltip title="Dados atualizados em tempo real">
              <Chip
                size="small"
                label="Dados reais"
                sx={{
                  bgcolor: alpha(CHART_COLORS.success, 0.1),
                  color: CHART_COLORS.success,
                  fontWeight: 600,
                }}
              />
            </MuiTooltip>
          </Stack>
        </CardContent>
      </Card>
    </Fade>
  );
}