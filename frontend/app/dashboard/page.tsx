'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Chip,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Stack,
    Avatar,
    Tooltip,
    IconButton,
    LinearProgress,
    alpha,
    Fade,
    Zoom,
    Button,
    Badge,
    useTheme,
    useMediaQuery,
    Container,
    Card,
    CardContent,
} from '@mui/material';

import {
    PeopleAlt as PeopleIcon,
    CheckCircle as ActiveIcon,
    Block as InactiveIcon,
    HourglassEmpty as PendingIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Refresh as RefreshIcon,
    Bolt as BoltIcon,
    Timeline as TimelineIcon,
    Assessment as AssessmentIcon,
    Download as DownloadIcon,
    Visibility as VisibilityIcon,
    CalendarToday as CalendarIcon,
    Info as InfoIcon,
    Share as ShareIcon,
    ArrowUpward as ArrowUpIcon,
    ArrowDownward as ArrowDownIcon,
} from '@mui/icons-material';

import { Line, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip as ChartTooltip,
    Legend,
    ArcElement,
    Filler,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    ChartTooltip,
    Legend,
    ArcElement,
    Filler
);

// --- PALETA DE CORES SOFISTICADA ---
const COLORS = {
    primary: '#E6C969', // Dourado principal
    primaryLight: '#F5E9CC',
    primaryDark: '#C4A052',
    secondary: '#E8ECF2', // Cinza azulado suave
    secondaryDark: '#CBD5E1',
    background: '#F9FBFF',
    success: '#10B981', // Verde
    successLight: '#D1FAE5',
    warning: '#F59E0B', // Laranja
    warningLight: '#FEF3C7',
    error: '#EF4444', // Vermelho
    errorLight: '#FEE2E2',
    dark: '#1E293B',
    darkLight: '#334155',
    gray: '#64748B',
    grayLight: '#94A3B8',
    white: '#FFFFFF',
    border: '#E2E8F0',
};

type ClienteStatus = 'Ativo' | 'Inativo' | 'Pendente';

type Cliente = {
    id: number;
    nome: string;
    email: string;
    telefone: string;
    status: ClienteStatus;
    empresa: string;
    ultimoProcessamentoEm: string;
};

const clientesMock: Cliente[] = [
    { id: 1, nome: 'Ana Silva', email: 'ana.silva@techsolutions.com', telefone: '(11) 98765-4321', status: 'Ativo', empresa: 'Tech Solutions', ultimoProcessamentoEm: '16/12/2025 02:20' },
    { id: 2, nome: 'Bruno Costa', email: 'bruno.costa@costaassociados.com', telefone: '(21) 91234-5678', status: 'Pendente', empresa: 'Costa & Associados', ultimoProcessamentoEm: '16/12/2025 02:18' },
    { id: 3, nome: 'Carla Dias', email: 'carla.dias@diasmarketing.com', telefone: '(31) 99887-7665', status: 'Ativo', empresa: 'Dias Marketing', ultimoProcessamentoEm: '16/12/2025 02:15' },
    { id: 4, nome: 'David Souza', email: 'david.souza@techsolutions.com', telefone: '(41) 95544-3322', status: 'Inativo', empresa: 'Souza Tech', ultimoProcessamentoEm: '16/12/2025 02:10' },
    { id: 5, nome: 'Elisa Lima', email: 'elisa.lima@limacorp.com', telefone: '(51) 97766-5544', status: 'Ativo', empresa: 'Lima Corp', ultimoProcessamentoEm: '16/12/2025 02:05' },
    { id: 6, nome: 'Fernando Santos', email: 'fernando@santosgroup.com', telefone: '(61) 98877-6655', status: 'Pendente', empresa: 'Santos Group', ultimoProcessamentoEm: '16/12/2025 01:55' },
    { id: 7, nome: 'Gabriela Oliveira', email: 'gabriela@oliveira.com', telefone: '(71) 97766-5544', status: 'Ativo', empresa: 'Oliveira Consultoria', ultimoProcessamentoEm: '16/12/2025 01:45' },
    { id: 8, nome: 'Hugo Pereira', email: 'hugo@pereiradev.com', telefone: '(81) 96655-4433', status: 'Inativo', empresa: 'Pereira Dev', ultimoProcessamentoEm: '16/12/2025 01:30' },
];

// Dados para gráficos
const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const baseClientesSerie = [98, 112, 120, 133, 147, 160, 175, 188, 203, 215, 228, 245];

function formatNumber(value: number) {
    return new Intl.NumberFormat('pt-BR').format(value);
}

function formatPercent(value: number) {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function calcGrowth(series: number[]) {
    if (!series || series.length < 2) return 0;
    const last = series[series.length - 1];
    const prev = series[series.length - 2];
    if (prev === 0) return 0;
    return ((last - prev) / prev) * 100;
}

// Status Chip Premium
const StatusChip = ({ status }: { status: ClienteStatus }) => {
    const config = {
        Ativo: {
            color: COLORS.success,
            bg: COLORS.successLight,
            icon: <ActiveIcon sx={{ fontSize: 14 }} />,
            label: 'Ativo',
        },
        Inativo: {
            color: COLORS.error,
            bg: COLORS.errorLight,
            icon: <InactiveIcon sx={{ fontSize: 14 }} />,
            label: 'Inativo',
        },
        Pendente: {
            color: COLORS.warning,
            bg: COLORS.warningLight,
            icon: <PendingIcon sx={{ fontSize: 14 }} />,
            label: 'Pendente',
        },
    }[status];

    return (
        <Chip
            icon={config.icon}
            label={config.label}
            size="small"
            sx={{
                bgcolor: config.bg,
                color: config.color,
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24,
                '& .MuiChip-icon': { color: config.color, fontSize: 14 },
                border: 'none',
                borderRadius: 1.5,
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            }}
        />
    );
};

// Metric Card Premium para Diretoria
const MetricCard = ({
    title,
    value,
    subtitle,
    icon,
    trend,
    color = COLORS.primary,
    bgColor = COLORS.primaryLight,
}: {
    title: string;
    value: number | string;
    subtitle: string;
    icon: React.ReactNode;
    trend?: { value: number; isPositive: boolean };
    color?: string;
    bgColor?: string;
}) => {
    return (
        <Card
            elevation={0}
            sx={{
                height: '100%',
                borderRadius: 3,
                border: `1px solid ${COLORS.border}`,
                bgcolor: COLORS.white,
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 24px -8px ${alpha(COLORS.dark, 0.15)}`,
                    '& .metric-icon': {
                        transform: 'scale(1.1)',
                    },
                },
            }}
        >
            {/* Barra superior decorativa */}
            <Box sx={{ height: 4, bgcolor: color, width: '100%' }} />

            <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Avatar
                            className="metric-icon"
                            sx={{
                                bgcolor: alpha(color, 0.12),
                                color: color,
                                width: 52,
                                height: 52,
                                transition: 'transform 0.3s ease',
                            }}
                        >
                            {icon}
                        </Avatar>

                        {trend && (
                            <Chip
                                icon={trend.isPositive ? <ArrowUpIcon sx={{ fontSize: 14 }} /> : <ArrowDownIcon sx={{ fontSize: 14 }} />}
                                label={formatPercent(trend.value)}
                                size="small"
                                sx={{
                                    bgcolor: alpha(trend.isPositive ? COLORS.success : COLORS.error, 0.1),
                                    color: trend.isPositive ? COLORS.success : COLORS.error,
                                    fontWeight: 600,
                                    height: 24,
                                    fontSize: '0.7rem',
                                }}
                            />
                        )}
                    </Stack>

                    <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: COLORS.dark, lineHeight: 1.2, mb: 0.5 }}>
                            {typeof value === 'number' ? formatNumber(value) : value}
                        </Typography>
                        <Typography variant="body1" sx={{ color: COLORS.gray, fontWeight: 500 }}>
                            {title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.grayLight, display: 'block', mt: 1 }}>
                            {subtitle}
                        </Typography>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
};

// Line Chart Premium
const LineChart = ({ data, color, label }: { data: number[]; color: string; label: string }) => {
    const chartData = {
        labels: meses,
        datasets: [
            {
                label,
                data,
                borderColor: color,
                backgroundColor: alpha(color, 0.04),
                borderWidth: 3,
                tension: 0.3,
                fill: true,
                pointBackgroundColor: color,
                pointBorderColor: COLORS.white,
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: color,
                pointHoverBorderColor: COLORS.white,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: COLORS.dark,
                titleColor: COLORS.white,
                bodyColor: COLORS.white,
                borderColor: COLORS.border,
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8,
                titleFont: { size: 12, weight: '600' },
                bodyFont: { size: 11 },
                callbacks: {
                    label: (context: any) => ` ${context.parsed.y} clientes`,
                },
            },
        },
        scales: {
            y: {
                grid: { color: alpha(COLORS.gray, 0.1), drawBorder: false },
                ticks: { color: COLORS.gray, font: { size: 11, weight: '500' } },
                beginAtZero: false,
            },
            x: {
                grid: { display: false },
                ticks: { color: COLORS.gray, font: { size: 11, weight: '500' } },
            },
        },
    };

    return (
        <Box sx={{ height: 220, width: '100%' }}>
            <Line data={chartData} options={options} />
        </Box>
    );
};

// Doughnut Chart Premium
const DoughnutChart = ({ data, labels }: { data: number[]; labels: string[] }) => {
    const total = data.reduce((a, b) => a + b, 0);
    const chartData = {
        labels,
        datasets: [
            {
                data,
                backgroundColor: [COLORS.success, COLORS.warning, COLORS.error],
                borderColor: COLORS.white,
                borderWidth: 3,
                hoverOffset: 8,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: COLORS.dark,
                titleColor: COLORS.white,
                bodyColor: COLORS.white,
                borderColor: COLORS.border,
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                    label: (context: any) => ` ${context.raw} clientes (${((context.raw / total) * 100).toFixed(1)}%)`,
                },
            },
        },
    };

    return (
        <Box sx={{ height: 180, width: '100%', position: 'relative' }}>
            <Doughnut data={chartData} options={options} />
        </Box>
    );
};

export default function HomePage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [refreshing, setRefreshing] = useState(false);

    const total = clientesMock.length;
    const ativos = clientesMock.filter((c) => c.status === 'Ativo').length;
    const inativos = clientesMock.filter((c) => c.status === 'Inativo').length;
    const pendentes = clientesMock.filter((c) => c.status === 'Pendente').length;

    const ultimosProcessados = [...clientesMock]
        .sort((a, b) => (a.ultimoProcessamentoEm < b.ultimoProcessamentoEm ? 1 : -1))
        .slice(0, 6);

    const crescimentoBase = calcGrowth(baseClientesSerie);
    const crescimentoAtivos = 2.8; // Mock

    const atualizadoEm = new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const handleRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    return (
        <Box sx={{ minHeight: '100vh' }}>
            {/* Header Premium */}
            <Container maxWidth="xl" sx={{ pt: 4, pb: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: COLORS.dark, letterSpacing: '-0.02em', mb: 0.5 }}>
                            Dashboard de Clientes
                        </Typography>
                        <Typography variant="body1" sx={{ color: COLORS.gray }}>
                            Acompanhamento estratégico da base de clientes
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1.5}>
                        <Button
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            sx={{
                                bgcolor: COLORS.primary,
                                color: COLORS.dark,
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 3,
                                py: 1,
                                boxShadow: 'none',
                                '&:hover': {
                                    bgcolor: COLORS.primaryDark,
                                    color: COLORS.white,
                                    boxShadow: `0 4px 12px ${alpha(COLORS.primary, 0.3)}`,
                                },
                            }}
                        >
                            Exportar Relatório
                        </Button>
                        <IconButton
                            onClick={handleRefresh}
                            disabled={refreshing}
                            sx={{
                                bgcolor: COLORS.white,
                                border: `1px solid ${COLORS.border}`,
                                borderRadius: 2,
                                width: 42,
                                height: 42,
                                color: COLORS.primary,
                                '&:hover': { bgcolor: alpha(COLORS.primary, 0.05), borderColor: COLORS.primary },
                            }}
                        >
                            <RefreshIcon />
                        </IconButton>
                        <Chip
                            icon={<CalendarIcon />}
                            label={atualizadoEm}
                            sx={{
                                bgcolor: COLORS.white,
                                color: COLORS.gray,
                                border: `1px solid ${COLORS.border}`,
                                borderRadius: 2,
                                height: 42,
                                '& .MuiChip-icon': { color: COLORS.primary },
                                fontWeight: 500,
                            }}
                        />
                    </Stack>
                </Stack>
            </Container>

            {/* KPI Cards - 4 indicadores principais */}
            <Container maxWidth="xl" sx={{ mt: 3 }}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <MetricCard
                            title="Total de Clientes"
                            value={total}
                            subtitle="Base cadastrada no sistema"
                            icon={<PeopleIcon fontSize="large" />}
                            trend={{ value: crescimentoBase, isPositive: true }}
                            color={COLORS.primary}
                            bgColor={COLORS.primaryLight}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <MetricCard
                            title="Clientes Ativos"
                            value={ativos}
                            subtitle={`${Math.round((ativos / total) * 100)}% da base`}
                            icon={<ActiveIcon fontSize="large" />}
                            trend={{ value: crescimentoAtivos, isPositive: true }}
                            color={COLORS.success}
                            bgColor={COLORS.successLight}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <MetricCard
                            title="Pendentes"
                            value={pendentes}
                            subtitle="Aguardando validação"
                            icon={<PendingIcon fontSize="large" />}
                            trend={{ value: -1.2, isPositive: false }}
                            color={COLORS.warning}
                            bgColor={COLORS.warningLight}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <MetricCard
                            title="Inativos"
                            value={inativos}
                            subtitle="Churn rate"
                            icon={<InactiveIcon fontSize="large" />}
                            trend={{ value: -0.6, isPositive: false }}
                            color={COLORS.error}
                            bgColor={COLORS.errorLight}
                        />
                    </Grid>
                </Grid>
            </Container>

            {/* Gráficos e Análises */}
            <Container maxWidth="xl" sx={{ mt: 4 }}>
                <Grid container spacing={3}>
                    {/* Evolução da Base */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                border: `1px solid ${COLORS.border}`,
                                bgcolor: COLORS.white,
                                height: '100%',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    boxShadow: `0 8px 24px ${alpha(COLORS.dark, 0.05)}`,
                                },
                            }}
                        >
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Avatar sx={{ bgcolor: alpha(COLORS.primary, 0.1), color: COLORS.primary, width: 48, height: 48 }}>
                                        <TimelineIcon />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.dark }}>
                                            Evolução da Base
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: COLORS.gray }}>
                                            Crescimento mensal de clientes
                                        </Typography>
                                    </Box>
                                </Stack>
                                <Chip
                                    icon={<TrendingUpIcon />}
                                    label={`${formatPercent(crescimentoBase)} vs mês anterior`}
                                    sx={{
                                        bgcolor: alpha(COLORS.success, 0.1),
                                        color: COLORS.success,
                                        fontWeight: 600,
                                        borderRadius: 2,
                                    }}
                                />
                            </Stack>
                            <LineChart data={baseClientesSerie} color={COLORS.primary} label="Total de Clientes" />
                        </Paper>
                    </Grid>

                    {/* Distribuição por Status */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                border: `1px solid ${COLORS.border}`,
                                bgcolor: COLORS.white,
                                height: '100%',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    boxShadow: `0 8px 24px ${alpha(COLORS.dark, 0.05)}`,
                                },
                            }}
                        >
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                                <Avatar sx={{ bgcolor: alpha(COLORS.gray, 0.1), color: COLORS.gray, width: 48, height: 48 }}>
                                    <AssessmentIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.dark }}>
                                        Distribuição
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: COLORS.gray }}>
                                        Por status do cliente
                                    </Typography>
                                </Box>
                            </Stack>

                            <DoughnutChart data={[ativos, pendentes, inativos]} labels={['Ativos', 'Pendentes', 'Inativos']} />

                            <Stack direction="row" justifyContent="space-around" sx={{ mt: 3 }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.success }}>{ativos}</Typography>
                                    <Typography variant="caption" sx={{ color: COLORS.gray }}>Ativos</Typography>
                                    <Typography variant="caption" sx={{ color: COLORS.gray, display: 'block' }}>
                                        {Math.round((ativos / total) * 100)}%
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.warning }}>{pendentes}</Typography>
                                    <Typography variant="caption" sx={{ color: COLORS.gray }}>Pendentes</Typography>
                                    <Typography variant="caption" sx={{ color: COLORS.gray, display: 'block' }}>
                                        {Math.round((pendentes / total) * 100)}%
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.error }}>{inativos}</Typography>
                                    <Typography variant="caption" sx={{ color: COLORS.gray }}>Inativos</Typography>
                                    <Typography variant="caption" sx={{ color: COLORS.gray, display: 'block' }}>
                                        {Math.round((inativos / total) * 100)}%
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* Insights Estratégicos */}
                    <Grid size={{ xs: 12 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                border: `1px solid ${COLORS.border}`,
                                background: `linear-gradient(135deg, ${alpha(COLORS.primary, 0.02)} 0%, ${alpha(COLORS.secondary, 0.02)} 100%)`,
                            }}
                        >
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                                <Avatar sx={{ bgcolor: alpha(COLORS.primary, 0.1), color: COLORS.primary, width: 44, height: 44 }}>
                                    <BoltIcon />
                                </Avatar>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.dark }}>
                                    Insights Estratégicos
                                </Typography>
                            </Stack>

                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2.5,
                                            borderRadius: 2,
                                            bgcolor: COLORS.white,
                                            border: `1px solid ${alpha(COLORS.success, 0.2)}`,
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                boxShadow: `0 4px 12px ${alpha(COLORS.success, 0.1)}`,
                                            },
                                        }}
                                    >
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Avatar sx={{ bgcolor: alpha(COLORS.success, 0.1), color: COLORS.success }}>
                                                <TrendingUpIcon />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.dark }}>
                                                    Crescimento Acelerado
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: COLORS.gray }}>
                                                    A base cresceu {formatPercent(crescimentoBase)} no último mês
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Paper>
                                </Grid>

                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2.5,
                                            borderRadius: 2,
                                            bgcolor: COLORS.white,
                                            border: `1px solid ${alpha(COLORS.warning, 0.2)}`,
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                boxShadow: `0 4px 12px ${alpha(COLORS.warning, 0.1)}`,
                                            },
                                        }}
                                    >
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Avatar sx={{ bgcolor: alpha(COLORS.warning, 0.1), color: COLORS.warning }}>
                                                <PendingIcon />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.dark }}>
                                                    Pendentes em Atenção
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: COLORS.gray }}>
                                                    {pendentes} clientes aguardando validação
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Paper>
                                </Grid>

                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2.5,
                                            borderRadius: 2,
                                            bgcolor: COLORS.white,
                                            border: `1px solid ${alpha(COLORS.primary, 0.2)}`,
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                boxShadow: `0 4px 12px ${alpha(COLORS.primary, 0.1)}`,
                                            },
                                        }}
                                    >
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Avatar sx={{ bgcolor: alpha(COLORS.primary, 0.1), color: COLORS.primary }}>
                                                <InfoIcon />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.dark }}>
                                                    Taxa de Conversão
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: COLORS.gray }}>
                                                    {Math.round((ativos / total) * 100)}% dos clientes estão ativos
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Tabela de Clientes Recentes */}
                    <Grid size={{ xs: 12 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: 3,
                                border: `1px solid ${COLORS.border}`,
                                bgcolor: COLORS.white,
                                overflow: 'hidden',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    boxShadow: `0 8px 24px ${alpha(COLORS.dark, 0.05)}`,
                                },
                            }}
                        >
                            <Box sx={{ p: 3 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar sx={{ bgcolor: alpha(COLORS.primary, 0.1), color: COLORS.primary, width: 44, height: 44 }}>
                                            <PeopleIcon />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.dark }}>
                                                Últimas Movimentações
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: COLORS.gray }}>
                                                Clientes processados recentemente
                                            </Typography>
                                        </Box>
                                    </Stack>
                                    <Badge
                                        badgeContent={ultimosProcessados.length}
                                        sx={{
                                            '& .MuiBadge-badge': {
                                                bgcolor: COLORS.primary,
                                                color: COLORS.dark,
                                                fontWeight: 700,
                                            },
                                        }}
                                    >
                                        <Chip
                                            label="Atualizado"
                                            size="small"
                                            sx={{ bgcolor: alpha(COLORS.primary, 0.1), color: COLORS.primary, fontWeight: 600 }}
                                        />
                                    </Badge>
                                </Stack>
                            </Box>

                            <Divider />

                            <Box sx={{ overflowX: 'auto' }}>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: alpha(COLORS.gray, 0.03) }}>
                                            <TableCell sx={{ fontWeight: 700, color: COLORS.gray }}>Cliente</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: COLORS.gray }}>Empresa</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: COLORS.gray }}>Contato</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: COLORS.gray }}>Status</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: COLORS.gray }}>Processado</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 700, color: COLORS.gray }}>Ações</TableCell>
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {ultimosProcessados.map((cliente) => (
                                            <TableRow
                                                key={cliente.id}
                                                hover
                                                sx={{
                                                    '&:hover': {
                                                        bgcolor: alpha(COLORS.primary, 0.02),
                                                    },
                                                    transition: 'background-color 0.2s ease',
                                                }}
                                            >
                                                <TableCell>
                                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                                        <Avatar
                                                            sx={{
                                                                width: 36,
                                                                height: 36,
                                                                bgcolor: alpha(COLORS.primary, 0.1),
                                                                color: COLORS.primary,
                                                                fontSize: '0.85rem',
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {cliente.nome.split(' ').map(n => n[0]).join('')}
                                                        </Avatar>
                                                        <Typography sx={{ fontWeight: 600, color: COLORS.dark }}>
                                                            {cliente.nome}
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ color: COLORS.gray, fontWeight: 500 }}>
                                                        {cliente.empresa}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ color: COLORS.dark }}>
                                                        {cliente.email}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: COLORS.grayLight }}>
                                                        {cliente.telefone}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <StatusChip status={cliente.status} />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ color: COLORS.gray }}>
                                                        {cliente.ultimoProcessamentoEm}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Tooltip title="Visualizar perfil">
                                                        <IconButton
                                                            size="small"
                                                            sx={{
                                                                color: COLORS.gray,
                                                                '&:hover': {
                                                                    color: COLORS.primary,
                                                                    bgcolor: alpha(COLORS.primary, 0.1),
                                                                },
                                                            }}
                                                        >
                                                            <VisibilityIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>

                            <Divider />

                            <Box sx={{ p: 2, bgcolor: alpha(COLORS.gray, 0.02) }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" sx={{ color: COLORS.gray }}>
                                        Exibindo {ultimosProcessados.length} de {total} clientes
                                    </Typography>
                                    <Button
                                        size="small"
                                        sx={{
                                            textTransform: 'none',
                                            color: COLORS.primary,
                                            fontWeight: 600,
                                            '&:hover': {
                                                bgcolor: alpha(COLORS.primary, 0.05),
                                            },
                                        }}
                                    >
                                        Ver relatório completo →
                                    </Button>
                                </Stack>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>

            
        </Box>
    );
}