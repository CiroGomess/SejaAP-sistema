'use client';

import React from 'react';
import {
    Grid,
    Paper,
    Stack,
    Avatar,
    Typography,
    alpha,
    Box,
    Chip,
} from '@mui/material';
import {
    AttachMoney as AttachMoneyIcon,
    TrendingUp as TrendingUpIcon,
    Timeline as TimelineIcon,
    Percent as PercentIcon,
} from '@mui/icons-material';

// --- PALETA DE CORES ---
const GOLD_PRIMARY = '#E6C969';
const GRAY_MAIN = '#64748B';
const TEXT_DARK = '#0F172A';

const STATUS_COLORS = {
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    purple: '#8B5CF6',
};

interface AnaliseResumoCardsProps {
    stats: {
        totalCusto: number;
        totalMargem: number;
        mediaMargem: number;
        qtdItens: number;
        melhorMargem: { produto: string; valor: number };
        piorMargem: { produto: string; valor: number };
    };
}

function moneyBR(value: number): string {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function AnaliseResumoCards({ stats }: AnaliseResumoCardsProps) {
    return (
        <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        borderRadius: 3,
                        bgcolor: alpha(STATUS_COLORS.success, 0.04),
                        border: `1px solid ${alpha(STATUS_COLORS.success, 0.15)}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px ${alpha(STATUS_COLORS.success, 0.1)}`,
                        },
                    }}
                >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                            sx={{
                                bgcolor: alpha(STATUS_COLORS.success, 0.1),
                                color: STATUS_COLORS.success,
                                width: 40,
                                height: 40,
                            }}
                        >
                            <AttachMoneyIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="caption" sx={{ color: GRAY_MAIN, fontWeight: 500 }}>
                                Margem Total
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                                {moneyBR(stats.totalMargem)}
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
                        bgcolor: alpha(GRAY_MAIN, 0.04),
                        border: `1px solid ${alpha(GRAY_MAIN, 0.15)}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px ${alpha(GRAY_MAIN, 0.1)}`,
                        },
                    }}
                >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                            sx={{
                                bgcolor: alpha(GRAY_MAIN, 0.1),
                                color: GRAY_MAIN,
                                width: 40,
                                height: 40,
                            }}
                        >
                            <TimelineIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="caption" sx={{ color: GRAY_MAIN, fontWeight: 500 }}>
                                Custo Total
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                                {moneyBR(stats.totalCusto)}
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
                        bgcolor: alpha(STATUS_COLORS.info, 0.04),
                        border: `1px solid ${alpha(STATUS_COLORS.info, 0.15)}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px ${alpha(STATUS_COLORS.info, 0.1)}`,
                        },
                    }}
                >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                            sx={{
                                bgcolor: alpha(STATUS_COLORS.info, 0.1),
                                color: STATUS_COLORS.info,
                                width: 40,
                                height: 40,
                            }}
                        >
                            <PercentIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="caption" sx={{ color: GRAY_MAIN, fontWeight: 500 }}>
                                Média por Item
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                                {moneyBR(stats.mediaMargem)}
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
                        bgcolor: alpha(STATUS_COLORS.purple, 0.04),
                        border: `1px solid ${alpha(STATUS_COLORS.purple, 0.15)}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px ${alpha(STATUS_COLORS.purple, 0.1)}`,
                        },
                    }}
                >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                            sx={{
                                bgcolor: alpha(STATUS_COLORS.purple, 0.1),
                                color: STATUS_COLORS.purple,
                                width: 40,
                                height: 40,
                            }}
                        >
                            <TrendingUpIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="caption" sx={{ color: GRAY_MAIN, fontWeight: 500 }}>
                                Itens Analisados
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                                {stats.qtdItens}
                            </Typography>
                        </Box>
                    </Stack>
                </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        borderRadius: 3,
                        bgcolor: alpha(STATUS_COLORS.success, 0.04),
                        border: `1px solid ${alpha(STATUS_COLORS.success, 0.15)}`,
                    }}
                >
                    <Typography variant="caption" sx={{ color: GRAY_MAIN, fontWeight: 500 }}>
                        Melhor Margem
                    </Typography>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: TEXT_DARK }}>
                            {stats.melhorMargem.produto}
                        </Typography>
                        <Chip
                            label={moneyBR(stats.melhorMargem.valor)}
                            size="small"
                            sx={{
                                bgcolor: alpha(STATUS_COLORS.success, 0.1),
                                color: STATUS_COLORS.success,
                                fontWeight: 600,
                            }}
                        />
                    </Stack>
                </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        borderRadius: 3,
                        bgcolor: alpha(STATUS_COLORS.warning, 0.04),
                        border: `1px solid ${alpha(STATUS_COLORS.warning, 0.15)}`,
                    }}
                >
                    <Typography variant="caption" sx={{ color: GRAY_MAIN, fontWeight: 500 }}>
                        Pior Margem
                    </Typography>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: TEXT_DARK }}>
                            {stats.piorMargem.produto}
                        </Typography>
                        <Chip
                            label={moneyBR(stats.piorMargem.valor)}
                            size="small"
                            sx={{
                                bgcolor: alpha(STATUS_COLORS.warning, 0.1),
                                color: STATUS_COLORS.warning,
                                fontWeight: 600,
                            }}
                        />
                    </Stack>
                </Paper>
            </Grid>
        </Grid>
    );
}