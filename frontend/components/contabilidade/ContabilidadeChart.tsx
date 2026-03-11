'use client';

import { useEffect, useMemo, useState } from 'react';
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
    ShowChart,
    BarChart as BarChartIcon,
    PieChart as PieChartIcon,
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
type ContabilidadeData = {
    id: number;
    ano: number;
    descricao: string;
    valor: number;
    categoria: string | null;
    data_importacao: string | null;
};

type ContabilidadeResumo = {
    totalReceitas: number;
    totalDespesas: number;
    resultado: number;
    margem: number;
    porDescricao: {
        nome: string;
        valor: number;
        percentual: number;
        tipo: 'receita' | 'despesa';
        categoria?: string;
    }[];
    porCategoria: {
        nome: string;
        valor: number;
        percentual: number;
        tipo: 'receita' | 'despesa';
    }[];
    meses: {
        mes: number;
        nome: string;
        receitas: number;
        despesas: number;
        resultado: number;
    }[];
};

type Props = {
    userId: number;
    data: ContabilidadeData[];
    loading?: boolean;
};

type ChartType = 'line' | 'area' | 'bar' | 'pie';
type DataType = 'receitas' | 'despesas' | 'resultado' | 'descricao' | 'categoria';

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

function formatShortNumber(value: number): string {
    if (Math.abs(value) >= 1e9) {
        return (value / 1e9).toFixed(1) + 'Bi';
    }
    if (Math.abs(value) >= 1e6) {
        return (value / 1e6).toFixed(1) + 'Mi';
    }
    if (Math.abs(value) >= 1e3) {
        return (value / 1e3).toFixed(0) + 'mil';
    }
    return value.toString();
}

function formatPercent(v: number) {
    return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
}

/* =========================
   COMPONENTE PRINCIPAL
========================= */
export default function ContabilidadeChart({ userId, data, loading: externalLoading }: Props) {
    const [ano, setAno] = useState<number | null>(null);
    const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
    const [chartType, setChartType] = useState<ChartType>('bar');
    const [dataType, setDataType] = useState<DataType>('resultado');
    const [loading, setLoading] = useState(false);

    // Gerar lista de anos (últimos 5 anos)
    useEffect(() => {
        const currentYear = new Date().getFullYear();
        const anos = [];
        for (let i = 0; i < 5; i++) {
            anos.push(currentYear - i);
        }
        setAnosDisponiveis(anos);
        setAno(currentYear);
    }, []);

    // Processar dados para análise
    const resumo = useMemo((): ContabilidadeResumo | null => {
        if (!data || data.length === 0) return null;

        // Filtrar dados pelo ano selecionado
        const dadosAno = ano ? data.filter(item => item.ano === ano) : data;

        if (dadosAno.length === 0) return null;

        // Calcular totais por descrição e categoria
        const totaisPorDescricao: Record<string, { valor: number; categoria?: string }> = {};
        const totaisPorCategoria: Record<string, number> = {};
        let totalReceitas = 0;
        let totalDespesas = 0;

        dadosAno.forEach(item => {
            const descricao = item.descricao || 'Sem descrição';
            const categoria = item.categoria || 'Sem categoria';

            // Por descrição
            if (!totaisPorDescricao[descricao]) {
                totaisPorDescricao[descricao] = { valor: 0, categoria };
            }
            totaisPorDescricao[descricao].valor += item.valor;

            // Por categoria
            totaisPorCategoria[categoria] = (totaisPorCategoria[categoria] || 0) + item.valor;

            if (item.valor > 0) {
                totalReceitas += item.valor;
            } else {
                totalDespesas += Math.abs(item.valor);
            }
        });

        const resultado = totalReceitas - totalDespesas;
        const margem = totalReceitas > 0 ? (resultado / totalReceitas) * 100 : 0;

        // Preparar dados por descrição
        const porDescricao = Object.entries(totaisPorDescricao)
            .map(([nome, { valor, categoria }]) => ({
                nome,
                valor,
                percentual: (Math.abs(valor) / dadosAno.reduce((acc, i) => acc + Math.abs(i.valor), 0)) * 100,
                tipo: valor > 0 ? 'receita' : 'despesa',
                categoria,
            }))
            .sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor))
            .slice(0, 10); // Top 10 descrições

        // Preparar dados por categoria
        const porCategoria = Object.entries(totaisPorCategoria)
            .map(([nome, valor]) => ({
                nome,
                valor,
                percentual: (Math.abs(valor) / dadosAno.reduce((acc, i) => acc + Math.abs(i.valor), 0)) * 100,
                tipo: valor > 0 ? 'receita' : 'despesa',
            }))
            .sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor))
            .slice(0, 8); // Top 8 categorias

        // Preparar dados por mês (simulado - se não tiver data, distribuir)
        const meses = Array.from({ length: 12 }, (_, i) => {
            const mes = i + 1;
            // Distribuição proporcional (exemplo - idealmente viria do backend)
            const receitas = totalReceitas / 12 * (0.8 + Math.random() * 0.4);
            const despesas = totalDespesas / 12 * (0.8 + Math.random() * 0.4);

            return {
                mes,
                nome: nomeMesAbreviado(mes),
                receitas: Number(receitas.toFixed(2)),
                despesas: Number(despesas.toFixed(2)),
                resultado: Number((receitas - despesas).toFixed(2)),
            };
        });

        return {
            totalReceitas,
            totalDespesas,
            resultado,
            margem,
            porDescricao,
            porCategoria,
            meses,
        };
    }, [data, ano]);

    // Dados para o gráfico baseado no tipo selecionado
    const chartData = useMemo(() => {
        if (!resumo) return [];

        if (dataType === 'descricao') {
            return resumo.porDescricao.map(item => ({
                name: item.nome.length > 20 ? item.nome.substring(0, 20) + '...' : item.nome,
                nomeCompleto: item.nome,
                valor: Math.abs(item.valor),
                valorOriginal: item.valor,
                percentual: item.percentual,
                tipo: item.tipo,
                categoria: item.categoria,
            }));
        }

        if (dataType === 'categoria') {
            return resumo.porCategoria.map(item => ({
                name: item.nome.length > 20 ? item.nome.substring(0, 20) + '...' : item.nome,
                nomeCompleto: item.nome,
                valor: Math.abs(item.valor),
                valorOriginal: item.valor,
                percentual: item.percentual,
                tipo: item.tipo,
            }));
        }

        return resumo.meses.map(mes => ({
            name: mes.nome,
            receitas: mes.receitas,
            despesas: mes.despesas,
            resultado: mes.resultado,
        }));
    }, [resumo, dataType]);

    if (!ano || loading || externalLoading) {
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

    if (!resumo) {
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
                                <AccountBalanceIcon />
                            </Avatar>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                                    Análise Contábil
                                </Typography>
                                <Typography variant="body2" sx={{ color: GRAY_MAIN }}>
                                    {resumo ? `${data.filter(d => d.ano === ano).length} registros` : 'Selecione um ano'}
                                </Typography>
                            </Box>
                        </Stack>

                        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                            {/* Seletor de Ano */}
                            <TextField
                                select
                                size="small"
                                label="Ano"
                                value={ano}
                                onChange={(e) => setAno(Number(e.target.value))}
                                sx={{ minWidth: 100 }}
                            >
                                {anosDisponiveis.map((a) => (
                                    <MenuItem key={a} value={a}>
                                        {a}
                                    </MenuItem>
                                ))}
                            </TextField>

                            {/* Seletor de Tipo de Dado */}
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
                                    <Typography variant="caption" sx={{ ml: 0.5 }}>Resultado</Typography>
                                </ToggleButton>
                                <ToggleButton value="descricao">
                                    <DescriptionIcon fontSize="small" />
                                    <Typography variant="caption" sx={{ ml: 0.5 }}>Por Descrição</Typography>
                                </ToggleButton>
                                <ToggleButton value="categoria">
                                    <CategoryIcon fontSize="small" />
                                    <Typography variant="caption" sx={{ ml: 0.5 }}>Por Categoria</Typography>
                                </ToggleButton>
                            </ToggleButtonGroup>

                            {/* Seletor de Tipo de Gráfico */}
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
                                <ToggleButton value="bar">
                                    <BarChartIcon fontSize="small" />
                                </ToggleButton>
                                <ToggleButton value="line">
                                    <ShowChart fontSize="small" />
                                </ToggleButton>
                                <ToggleButton value="area">
                                    <Timeline fontSize="small" />
                                </ToggleButton>
                                <ToggleButton value="pie" disabled={dataType === 'resultado'}>
                                    <PieChartIcon fontSize="small" />
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Stack>
                    </Stack>

                    {/* Cards de Resumo */}
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
                                        <Typography variant="caption" sx={{ color: GRAY_MAIN }}>Receitas</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                                            {money(resumo.totalReceitas)}
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
                                        <Typography variant="caption" sx={{ color: GRAY_MAIN }}>Despesas</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                                            {money(resumo.totalDespesas)}
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
                                            height: 40
                                        }}
                                    >
                                        {resumo.resultado >= 0 ? <TrendingUp /> : <TrendingDown />}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: GRAY_MAIN }}>Resultado</Typography>
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
                                        <Typography variant="caption" sx={{ color: GRAY_MAIN }}>Margem</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                                            {formatPercent(resumo.margem)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* Gráfico Principal */}
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
                                                props.payload.nomeCompleto
                                            ];
                                        }}
                                    />
                                </PieChart>
                            ) : dataType !== 'resultado' ? (
                                <BarChart data={chartData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(GRAY_MAIN, 0.1)} horizontal={false} />
                                    <XAxis
                                        type="number"
                                        tickFormatter={(v) => formatShortNumber(v)}
                                        stroke={GRAY_MAIN}
                                    />
                                    <YAxis dataKey="name" type="category" width={120} stroke={GRAY_MAIN} />
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
                                                    {props.payload.categoria && ` • ${props.payload.categoria}`}
                                                </span>,
                                                props.payload.nomeCompleto
                                            ];
                                        }}
                                    />
                                    <Bar
                                        dataKey="valor"
                                        fill={GOLD_PRIMARY}
                                        radius={[0, 4, 4, 0]}
                                        shape={(props: any) => {
                                            const { fill, x, y, width, height } = props;
                                            const isPositive = props.payload.valorOriginal > 0;
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
                                    {chartType === 'line' && (
                                        <Bar dataKey="resultado" name="Resultado" fill={GOLD_PRIMARY} radius={[4, 4, 0, 0]} />
                                    )}
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </Box>

                    {/* Cards de Detalhamento */}
                    <Grid container spacing={3}>
                        {/* Por Descrição */}
                        {resumo.porDescricao.length > 0 && (
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
                                            label={`${resumo.porDescricao.length} itens`}
                                            size="small"
                                            sx={{
                                                bgcolor: alpha(GOLD_PRIMARY, 0.1),
                                                color: GOLD_PRIMARY,
                                                fontWeight: 600,
                                            }}
                                        />
                                    </Stack>

                                    {/* Carrossel de Descrições */}
                                    <Box
                                        sx={{
                                            position: 'relative',
                                            width: '100%',
                                            '&:hover .scroll-button': {
                                                opacity: 1,
                                            },
                                        }}
                                    >
                                        {/* Botão Esquerdo */}
                                        <IconButton
                                            className="scroll-button"
                                            onClick={() => {
                                                const container = document.getElementById('descricoes-carousel');
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

                                        {/* Container Scrollável */}
                                        <Box
                                            id="descricoes-carousel"
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
                                            {resumo.porDescricao.map((item, index) => (
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
                                                                title={item.nome}
                                                            >
                                                                {item.nome}
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
                                                                label={formatPercent(item.percentual)}
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
                                                            {item.tipo === 'receita' ? 'Receita' : 'Despesa'} • {index + 1}º mais relevante
                                                        </Typography>
                                                    </Stack>
                                                </Paper>
                                            ))}
                                        </Box>

                                        {/* Botão Direito */}
                                        <IconButton
                                            className="scroll-button"
                                            onClick={() => {
                                                const container = document.getElementById('descricoes-carousel');
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

                        {/* Por Categoria */}
                        {resumo.porCategoria.length > 0 && (
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
                                            label={`${resumo.porCategoria.length} itens`}
                                            size="small"
                                            sx={{
                                                bgcolor: alpha(GOLD_PRIMARY, 0.1),
                                                color: GOLD_PRIMARY,
                                                fontWeight: 600,
                                            }}
                                        />
                                    </Stack>

                                    {/* Carrossel de Categorias */}
                                    <Box
                                        sx={{
                                            position: 'relative',
                                            width: '100%',
                                            '&:hover .scroll-button': {
                                                opacity: 1,
                                            },
                                        }}
                                    >
                                        {/* Botão Esquerdo */}
                                        <IconButton
                                            className="scroll-button"
                                            onClick={() => {
                                                const container = document.getElementById('categorias-carousel');
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

                                        {/* Container Scrollável */}
                                        <Box
                                            id="categorias-carousel"
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
                                            {resumo.porCategoria.map((item, index) => (
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
                                                            title={item.nome}
                                                        >
                                                            {item.nome}
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
                                                                label={formatPercent(item.percentual)}
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
                                                            {item.tipo === 'receita' ? 'Receita' : 'Despesa'} • {index + 1}º mais relevante
                                                        </Typography>
                                                    </Stack>
                                                </Paper>
                                            ))}
                                        </Box>

                                        {/* Botão Direito */}
                                        <IconButton
                                            className="scroll-button"
                                            onClick={() => {
                                                const container = document.getElementById('categorias-carousel');
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

                    {/* Rodapé */}
                    <Divider sx={{ my: 3, borderColor: BORDER_LIGHT }} />

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" sx={{ color: GRAY_LIGHT }}>
                            {data.filter(d => d.ano === ano).length} registros contábeis em {ano}
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