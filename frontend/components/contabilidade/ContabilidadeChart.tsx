'use client';

import { useMemo, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
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
    IconButton,
    ToggleButtonGroup,
    Tooltip as MuiTooltip,
} from '@mui/material';

import {
    TrendingUp,
    TrendingDown,
    AttachMoney,
    Timeline,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Percent,
    Category as CategoryIcon,
    AccountBalance as AccountBalanceIcon,
    Description as DescriptionIcon,
} from '@mui/icons-material';

// --- PALETA DE CORES PREMIUM ---
const GOLD_PRIMARY = '#E6C969';
const GOLD_LIGHT = '#F5E6B8';
const DARK_BG = '#0F172A';
const WHITE = '#FFFFFF';
const GRAY_MAIN = '#64748B';
const GRAY_LIGHT = '#94A3B8';
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

// Cores para os gráficos
const CHART_COLORS = {
    primary: GOLD_PRIMARY,
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    purple: '#8B5CF6',
    cyan: '#06B6D4',
    pink: '#EC4899',
};

const PIE_COLORS = [
    GOLD_PRIMARY,
    '#10B981',
    '#F59E0B',
    '#3B82F6',
    '#8B5CF6',
    '#EC4899',
    '#06B6D4',
    '#EF4444',
];

/* =========================
   TIPOS
========================= */
type DashboardResumo = {
    receitas: number;
    despesas: number;
    resultado: number;
    margem_percentual: number;
    total_registros_ano: number;
    label_total_registros: string;
};

type DashboardMensal = {
    mes_numero: number;
    mes: string;
    receitas: number;
    despesas: number;
    resultado: number;
};

type DashboardTopDescricao = {
    rank: number;
    descricao: string;
    categoria: string;
    valor: number;
    total_itens: number;
    percentual_sobre_receitas: number;
    tipo: 'receita' | 'despesa';
    label_rank: string;
};

type DashboardTopCategoria = {
    rank: number;
    categoria: string;
    valor: number;
    total_itens: number;
    percentual_sobre_receitas: number;
    tipo: 'receita' | 'despesa';
    label_rank: string;
};

type DashboardFiltros = {
    user_id: number;
    ano: number;
    anos_disponiveis: number[];
};

type ContabilidadeDashboard = {
    filtros: DashboardFiltros;
    resumo: DashboardResumo;
    mensal: DashboardMensal[];
    top_descricoes: DashboardTopDescricao[];
    top_categorias: DashboardTopCategoria[];
};

type Props = {
    userId: number;
    ano: number | null;
    onAnoChange: (ano: number | null) => void;
    dashboard: ContabilidadeDashboard | null;
    loading?: boolean;
};

type ChartType = 'bar' | 'line' | 'area' | 'pie';
type DataType = 'resultado' | 'descricao' | 'categoria';

/* =========================
   HELPERS
========================= */
function money(v?: number | null) {
    return (v ?? 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatShortNumber(value: number): string {
    if (Math.abs(value) >= 1e9) {
        return `${(value / 1e9).toFixed(1)}Bi`;
    }
    if (Math.abs(value) >= 1e6) {
        return `${(value / 1e6).toFixed(1)}Mi`;
    }
    if (Math.abs(value) >= 1e3) {
        return `${(value / 1e3).toFixed(0)}mil`;
    }
    return value.toString();
}

function formatPercent(v: number) {
    return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
}

/* =========================
   COMPONENTE PRINCIPAL
========================= */
export default function ContabilidadeChart({
    userId,
    ano,
    onAnoChange,
    dashboard,
    loading: externalLoading,
}: Props) {
    const [chartType, setChartType] = useState<ChartType>('bar');
    const [dataType, setDataType] = useState<DataType>('resultado');

    const anosDisponiveis = dashboard?.filtros?.anos_disponiveis || [];
    const resumo = dashboard?.resumo || null;
    const topDescricoes = dashboard?.top_descricoes || [];
    const topCategorias = dashboard?.top_categorias || [];
    const dadosMensais = dashboard?.mensal || [];

    const chartData = useMemo(() => {
        if (!dashboard) return [];

        if (dataType === 'descricao') {
            return topDescricoes.map((item) => ({
                name: item.descricao.length > 20 ? `${item.descricao.substring(0, 20)}...` : item.descricao,
                nomeCompleto: item.descricao,
                valor: Math.abs(item.valor),
                valorOriginal: item.valor,
                percentual: item.percentual_sobre_receitas,
                tipo: item.tipo,
                categoria: item.categoria,
            }));
        }

        if (dataType === 'categoria') {
            return topCategorias.map((item) => ({
                name: item.categoria.length > 20 ? `${item.categoria.substring(0, 20)}...` : item.categoria,
                nomeCompleto: item.categoria,
                valor: Math.abs(item.valor),
                valorOriginal: item.valor,
                percentual: item.percentual_sobre_receitas,
                tipo: item.tipo,
            }));
        }

        return dadosMensais.map((mes) => ({
            name: mes.mes,
            receitas: mes.receitas,
            despesas: mes.despesas,
            resultado: mes.resultado,
        }));
    }, [dashboard, dataType, topDescricoes, topCategorias, dadosMensais]);

    if (externalLoading) {
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
                            Carregando dados contábeis...
                        </Typography>
                    </CardContent>
                </Card>
            </Fade>
        );
    }

    if (!dashboard || !resumo) {
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
                        <AccountBalanceIcon sx={{ fontSize: 60, color: GRAY_LIGHT, opacity: 0.5, mb: 2 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600, color: TEXT_DARK, mb: 1 }}>
                            Nenhum dado disponível
                        </Typography>
                        <Typography sx={{ color: GRAY_MAIN }}>
                            Importe dados contábeis para visualizar análises
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
                    mb: 3,
                }}
            >
                <Box sx={{ height: 6, background: `linear-gradient(90deg, ${GOLD_PRIMARY}, ${GOLD_LIGHT})` }} />

                <CardContent sx={{ p: 3 }}>
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
                               <AccountBalanceIcon />
                            </Avatar>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                                    Análise Contábil
                                </Typography>
                                <Typography variant="body2" sx={{ color: GRAY_MAIN }}>
                                    {resumo.label_total_registros || 'Sem dados'}
                                </Typography>
                            </Box>
                        </Stack>

                        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                            <TextField
                                select
                                size="small"
                                label="Ano"
                                value={ano ?? ''}
                                onChange={(e) => onAnoChange(e.target.value ? Number(e.target.value) : null)}
                                sx={{ minWidth: 110 }}
                            >
                                {anosDisponiveis.map((a) => (
                                    <MenuItem key={a} value={a}>
                                        {a}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <ToggleButtonGroup
                                size="small"
                                value={dataType}
                                exclusive
                                onChange={(_, value) => value && setDataType(value)}
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
                                <ToggleButton value="resultado">
                                    <Timeline fontSize="small" />
                                    <Typography variant="caption" sx={{ ml: 0.5 }}>
                                        Resultado
                                    </Typography>
                                </ToggleButton>
                                <ToggleButton value="descricao">
                                    <DescriptionIcon fontSize="small" />
                                    <Typography variant="caption" sx={{ ml: 0.5 }}>
                                        Por Descrição
                                    </Typography>
                                </ToggleButton>
                                <ToggleButton value="categoria">
                                    <CategoryIcon fontSize="small" />
                                    <Typography variant="caption" sx={{ ml: 0.5 }}>
                                        Por Categoria
                                    </Typography>
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Stack>
                    </Stack>

                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 3,
                                    bgcolor: alpha(STATUS_COLORS.success, 0.05),
                                    border: `1px solid ${alpha(STATUS_COLORS.success, 0.2)}`,
                                }}
                            >
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Avatar sx={{ bgcolor: alpha(STATUS_COLORS.success, 0.1), color: STATUS_COLORS.success, width: 40, height: 40 }}>
                                        <AttachMoney />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: GRAY_MAIN }}>
                                            Receitas
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                                            {money(resumo.receitas)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 3,
                                    bgcolor: alpha(STATUS_COLORS.error, 0.05),
                                    border: `1px solid ${alpha(STATUS_COLORS.error, 0.2)}`,
                                }}
                            >
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Avatar sx={{ bgcolor: alpha(STATUS_COLORS.error, 0.1), color: STATUS_COLORS.error, width: 40, height: 40 }}>
                                        <TrendingDown />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: GRAY_MAIN }}>
                                            Despesas
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                                            {money(resumo.despesas)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 3,
                                    bgcolor: alpha(resumo.resultado >= 0 ? STATUS_COLORS.success : STATUS_COLORS.error, 0.05),
                                    border: `1px solid ${alpha(resumo.resultado >= 0 ? STATUS_COLORS.success : STATUS_COLORS.error, 0.2)}`,
                                }}
                            >
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Avatar
                                        sx={{
                                            bgcolor: alpha(resumo.resultado >= 0 ? STATUS_COLORS.success : STATUS_COLORS.error, 0.1),
                                            color: resumo.resultado >= 0 ? STATUS_COLORS.success : STATUS_COLORS.error,
                                            width: 40,
                                            height: 40,
                                        }}
                                    >
                                        {resumo.resultado >= 0 ? <TrendingUp /> : <TrendingDown />}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: GRAY_MAIN }}>
                                            Resultado
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                                            {money(resumo.resultado)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>

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
                                        <Typography variant="caption" sx={{ color: GRAY_MAIN }}>
                                            Margem
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                                            {formatPercent(resumo.margem_percentual)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>
                    </Grid>

                    <Box sx={{ width: '100%', height: 400, mb: 4 }}>
                        <ResponsiveContainer>
                            {dataType !== 'resultado' && chartType === 'pie' ? (
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={140}
                                        paddingAngle={2}
                                        dataKey="valor"
                                        nameKey="name"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
                                        formatter={(value: number, name: string, props: any) => {
                                            const originalValue = props.payload.valorOriginal;
                                            return [
                                                <span key="value">
                                                    {money(Math.abs(originalValue))}
                                                    {props.payload.tipo === 'receita' ? ' (Receita)' : ' (Despesa)'}
                                                </span>,
                                                props.payload.nomeCompleto,
                                            ];
                                        }}
                                    />
                                </PieChart>
                            ) : dataType !== 'resultado' ? (
                                <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(GRAY_MAIN, 0.1)} horizontal={false} />
                                    <XAxis
                                        type="number"
                                        tickFormatter={(v) => formatShortNumber(v)}
                                        stroke={GRAY_MAIN}
                                    />
                                    <YAxis dataKey="name" type="category" width={140} stroke={GRAY_MAIN} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: DARK_BG,
                                            border: `1px solid ${BORDER_LIGHT}`,
                                            borderRadius: 8,
                                            color: WHITE,
                                        }}
                                        formatter={(value: number, name: string, props: any) => {
                                            const originalValue = props.payload.valorOriginal;
                                            return [
                                                <span key="value">
                                                    {money(Math.abs(originalValue))}
                                                    {props.payload.tipo === 'receita' ? ' (Receita)' : ' (Despesa)'}
                                                    {props.payload.categoria ? ` • ${props.payload.categoria}` : ''}
                                                </span>,
                                                props.payload.nomeCompleto,
                                            ];
                                        }}
                                    />
                                    <Bar
                                        dataKey="valor"
                                        radius={[0, 4, 4, 0]}
                                        shape={(props: any) => {
                                            const { x, y, width, height } = props;
                                            const isPositive = props.payload.valorOriginal >= 0;
                                            return (
                                                <rect
                                                    x={x}
                                                    y={y}
                                                    width={width}
                                                    height={height}
                                                    fill={isPositive ? STATUS_COLORS.success : STATUS_COLORS.error}
                                                    rx={4}
                                                    ry={4}
                                                />
                                            );
                                        }}
                                    />
                                </BarChart>
                            ) : (
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(GRAY_MAIN, 0.1)} />
                                    <XAxis dataKey="name" stroke={GRAY_MAIN} />
                                    <YAxis
                                        tickFormatter={(v) => formatShortNumber(v)}
                                        stroke={GRAY_MAIN}
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
                                    <Bar dataKey="receitas" name="Receitas" fill={STATUS_COLORS.success} radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="despesas" name="Despesas" fill={STATUS_COLORS.error} radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="resultado" name="Resultado" fill={GOLD_PRIMARY} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </Box>

                    <Grid container spacing={3}>
                        {topDescricoes.length > 0 && (
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2.5,
                                        borderRadius: 3,
                                        border: `1px solid ${BORDER_LIGHT}`,
                                        bgcolor: alpha(GOLD_PRIMARY, 0.02),
                                        height: '100%',
                                    }}
                                >
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                                            Top Descrições
                                        </Typography>
                                        <Chip
                                            label={`${topDescricoes.length} itens`}
                                            size="small"
                                            sx={{
                                                bgcolor: alpha(GOLD_PRIMARY, 0.1),
                                                color: GOLD_PRIMARY,
                                                fontWeight: 600,
                                            }}
                                        />
                                    </Stack>

                                    <Box
                                        sx={{
                                            position: 'relative',
                                            width: '100%',
                                            '&:hover .scroll-button': {
                                                opacity: 1,
                                            },
                                        }}
                                    >
                                        <IconButton
                                            className="scroll-button"
                                            onClick={() => {
                                                const container = document.getElementById(`descricoes-carousel-${userId}`);
                                                if (container) {
                                                    container.scrollBy({ left: -300, behavior: 'smooth' });
                                                }
                                            }}
                                            sx={{
                                                position: 'absolute',
                                                left: -12,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                zIndex: 10,
                                                bgcolor: WHITE,
                                                border: `1px solid ${BORDER_LIGHT}`,
                                                boxShadow: `0 4px 12px ${alpha(DARK_BG, 0.1)}`,
                                                opacity: 0,
                                                transition: 'opacity 0.2s ease',
                                                '&:hover': { bgcolor: alpha(GOLD_PRIMARY, 0.1), borderColor: GOLD_PRIMARY },
                                                '&.Mui-disabled': { opacity: 0, pointerEvents: 'none' },
                                            }}
                                        >
                                            <ChevronLeftIcon />
                                        </IconButton>

                                        <Box
                                            id={`descricoes-carousel-${userId}`}
                                            sx={{
                                                display: 'flex',
                                                overflowX: 'auto',
                                                scrollSnapType: 'x mandatory',
                                                gap: 2,
                                                pb: 1,
                                                '&::-webkit-scrollbar': {
                                                    height: 6,
                                                },
                                                '&::-webkit-scrollbar-track': {
                                                    background: alpha(GRAY_MAIN, 0.1),
                                                    borderRadius: 3,
                                                },
                                                '&::-webkit-scrollbar-thumb': {
                                                    background: alpha(GOLD_PRIMARY, 0.3),
                                                    borderRadius: 3,
                                                    '&:hover': {
                                                        background: alpha(GOLD_PRIMARY, 0.5),
                                                    },
                                                },
                                            }}
                                        >
                                            {topDescricoes.map((item, index) => (
                                                <Paper
                                                    key={index}
                                                    elevation={0}
                                                    sx={{
                                                        minWidth: 280,
                                                        maxWidth: 280,
                                                        p: 2,
                                                        borderRadius: 2,
                                                        bgcolor: WHITE,
                                                        border: `1px solid ${BORDER_LIGHT}`,
                                                        scrollSnapAlign: 'start',
                                                        transition: 'all 0.2s ease',
                                                        '&:hover': {
                                                            borderColor: GOLD_PRIMARY,
                                                            boxShadow: `0 4px 12px ${alpha(GOLD_PRIMARY, 0.1)}`,
                                                            transform: 'translateY(-2px)',
                                                        },
                                                    }}
                                                >
                                                    <Stack spacing={1.5}>
                                                        <Box>
                                                            <Typography
                                                                variant="subtitle2"
                                                                sx={{
                                                                    fontWeight: 700,
                                                                    color: TEXT_DARK,
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                }}
                                                                title={item.descricao}
                                                            >
                                                                {item.descricao}
                                                            </Typography>

                                                            {item.categoria && (
                                                                <Chip
                                                                    label={item.categoria}
                                                                    size="small"
                                                                    sx={{
                                                                        mt: 0.5,
                                                                        height: 20,
                                                                        fontSize: '0.65rem',
                                                                        bgcolor: alpha(GRAY_MAIN, 0.05),
                                                                        color: GRAY_MAIN,
                                                                    }}
                                                                />
                                                            )}
                                                        </Box>

                                                        <Divider sx={{ borderColor: BORDER_LIGHT }} />

                                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                            <Box>
                                                                <Typography variant="caption" sx={{ color: GRAY_LIGHT }}>
                                                                    Valor
                                                                </Typography>
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{
                                                                        fontWeight: 700,
                                                                        color: item.tipo === 'receita' ? STATUS_COLORS.success : STATUS_COLORS.error,
                                                                    }}
                                                                >
                                                                    {money(Math.abs(item.valor))}
                                                                </Typography>
                                                            </Box>
                                                            <Chip
                                                                label={formatPercent(item.percentual_sobre_receitas)}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: alpha(item.tipo === 'receita' ? STATUS_COLORS.success : STATUS_COLORS.error, 0.1),
                                                                    color: item.tipo === 'receita' ? STATUS_COLORS.success : STATUS_COLORS.error,
                                                                    fontWeight: 600,
                                                                    height: 24,
                                                                }}
                                                            />
                                                        </Stack>

                                                        <Typography variant="caption" sx={{ color: GRAY_LIGHT }}>
                                                            {item.tipo === 'receita' ? 'Receita' : 'Despesa'} • {item.label_rank}
                                                        </Typography>
                                                    </Stack>
                                                </Paper>
                                            ))}
                                        </Box>

                                        <IconButton
                                            className="scroll-button"
                                            onClick={() => {
                                                const container = document.getElementById(`descricoes-carousel-${userId}`);
                                                if (container) {
                                                    container.scrollBy({ left: 300, behavior: 'smooth' });
                                                }
                                            }}
                                            sx={{
                                                position: 'absolute',
                                                right: -12,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                zIndex: 10,
                                                bgcolor: WHITE,
                                                border: `1px solid ${BORDER_LIGHT}`,
                                                boxShadow: `0 4px 12px ${alpha(DARK_BG, 0.1)}`,
                                                opacity: 0,
                                                transition: 'opacity 0.2s ease',
                                                '&:hover': { bgcolor: alpha(GOLD_PRIMARY, 0.1), borderColor: GOLD_PRIMARY },
                                                '&.Mui-disabled': { opacity: 0, pointerEvents: 'none' },
                                            }}
                                        >
                                            <ChevronRightIcon />
                                        </IconButton>
                                    </Box>
                                </Paper>
                            </Grid>
                        )}

                        {topCategorias.length > 0 && (
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2.5,
                                        borderRadius: 3,
                                        border: `1px solid ${BORDER_LIGHT}`,
                                        bgcolor: alpha(GOLD_PRIMARY, 0.02),
                                        height: '100%',
                                    }}
                                >
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                                            Top Categorias
                                        </Typography>
                                        <Chip
                                            label={`${topCategorias.length} itens`}
                                            size="small"
                                            sx={{
                                                bgcolor: alpha(GOLD_PRIMARY, 0.1),
                                                color: GOLD_PRIMARY,
                                                fontWeight: 600,
                                            }}
                                        />
                                    </Stack>

                                    <Box
                                        sx={{
                                            position: 'relative',
                                            width: '100%',
                                            '&:hover .scroll-button': {
                                                opacity: 1,
                                            },
                                        }}
                                    >
                                        <IconButton
                                            className="scroll-button"
                                            onClick={() => {
                                                const container = document.getElementById(`categorias-carousel-${userId}`);
                                                if (container) {
                                                    container.scrollBy({ left: -300, behavior: 'smooth' });
                                                }
                                            }}
                                            sx={{
                                                position: 'absolute',
                                                left: -12,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                zIndex: 10,
                                                bgcolor: WHITE,
                                                border: `1px solid ${BORDER_LIGHT}`,
                                                boxShadow: `0 4px 12px ${alpha(DARK_BG, 0.1)}`,
                                                opacity: 0,
                                                transition: 'opacity 0.2s ease',
                                                '&:hover': { bgcolor: alpha(GOLD_PRIMARY, 0.1), borderColor: GOLD_PRIMARY },
                                                '&.Mui-disabled': { opacity: 0, pointerEvents: 'none' },
                                            }}
                                        >
                                            <ChevronLeftIcon />
                                        </IconButton>

                                        <Box
                                            id={`categorias-carousel-${userId}`}
                                            sx={{
                                                display: 'flex',
                                                overflowX: 'auto',
                                                scrollSnapType: 'x mandatory',
                                                gap: 2,
                                                pb: 1,
                                                '&::-webkit-scrollbar': {
                                                    height: 6,
                                                },
                                                '&::-webkit-scrollbar-track': {
                                                    background: alpha(GRAY_MAIN, 0.1),
                                                    borderRadius: 3,
                                                },
                                                '&::-webkit-scrollbar-thumb': {
                                                    background: alpha(GOLD_PRIMARY, 0.3),
                                                    borderRadius: 3,
                                                    '&:hover': {
                                                        background: alpha(GOLD_PRIMARY, 0.5),
                                                    },
                                                },
                                            }}
                                        >
                                            {topCategorias.map((item, index) => (
                                                <Paper
                                                    key={index}
                                                    elevation={0}
                                                    sx={{
                                                        minWidth: 280,
                                                        maxWidth: 280,
                                                        p: 2,
                                                        borderRadius: 2,
                                                        bgcolor: WHITE,
                                                        border: `1px solid ${BORDER_LIGHT}`,
                                                        scrollSnapAlign: 'start',
                                                        transition: 'all 0.2s ease',
                                                        '&:hover': {
                                                            borderColor: GOLD_PRIMARY,
                                                            boxShadow: `0 4px 12px ${alpha(GOLD_PRIMARY, 0.1)}`,
                                                            transform: 'translateY(-2px)',
                                                        },
                                                    }}
                                                >
                                                    <Stack spacing={1.5}>
                                                        <Typography
                                                            variant="subtitle2"
                                                            sx={{
                                                                fontWeight: 700,
                                                                color: TEXT_DARK,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                            title={item.categoria}
                                                        >
                                                            {item.categoria}
                                                        </Typography>

                                                        <Divider sx={{ borderColor: BORDER_LIGHT }} />

                                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                            <Box>
                                                                <Typography variant="caption" sx={{ color: GRAY_LIGHT }}>
                                                                    Valor
                                                                </Typography>
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{
                                                                        fontWeight: 700,
                                                                        color: item.tipo === 'receita' ? STATUS_COLORS.success : STATUS_COLORS.error,
                                                                    }}
                                                                >
                                                                    {money(Math.abs(item.valor))}
                                                                </Typography>
                                                            </Box>
                                                            <Chip
                                                                label={formatPercent(item.percentual_sobre_receitas)}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: alpha(item.tipo === 'receita' ? STATUS_COLORS.success : STATUS_COLORS.error, 0.1),
                                                                    color: item.tipo === 'receita' ? STATUS_COLORS.success : STATUS_COLORS.error,
                                                                    fontWeight: 600,
                                                                    height: 24,
                                                                }}
                                                            />
                                                        </Stack>

                                                        <Typography variant="caption" sx={{ color: GRAY_LIGHT }}>
                                                            {item.tipo === 'receita' ? 'Receita' : 'Despesa'} • {item.label_rank}
                                                        </Typography>
                                                    </Stack>
                                                </Paper>
                                            ))}
                                        </Box>

                                        <IconButton
                                            className="scroll-button"
                                            onClick={() => {
                                                const container = document.getElementById(`categorias-carousel-${userId}`);
                                                if (container) {
                                                    container.scrollBy({ left: 300, behavior: 'smooth' });
                                                }
                                            }}
                                            sx={{
                                                position: 'absolute',
                                                right: -12,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                zIndex: 10,
                                                bgcolor: WHITE,
                                                border: `1px solid ${BORDER_LIGHT}`,
                                                boxShadow: `0 4px 12px ${alpha(DARK_BG, 0.1)}`,
                                                opacity: 0,
                                                transition: 'opacity 0.2s ease',
                                                '&:hover': { bgcolor: alpha(GOLD_PRIMARY, 0.1), borderColor: GOLD_PRIMARY },
                                                '&.Mui-disabled': { opacity: 0, pointerEvents: 'none' },
                                            }}
                                        >
                                            <ChevronRightIcon />
                                        </IconButton>
                                    </Box>
                                </Paper>
                            </Grid>
                        )}
                    </Grid>

                    <Divider sx={{ my: 3, borderColor: BORDER_LIGHT }} />

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" sx={{ color: GRAY_LIGHT }}>
                            {resumo.label_total_registros}
                        </Typography>
                        <MuiTooltip title="Dados atualizados em tempo real">
                            <Chip
                                size="small"
                                label="Análise contábil"
                                sx={{
                                    bgcolor: alpha(GOLD_PRIMARY, 0.1),
                                    color: GOLD_PRIMARY,
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