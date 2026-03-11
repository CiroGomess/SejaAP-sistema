'use client';

import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Stack,
    Avatar,
    alpha,
    Paper,
    Grid,
    Chip,
} from '@mui/material';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts';
import {
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,

} from '@mui/icons-material';

// Dados mock
const receitaMensal = [
    { mes: 'Jan', valor: 1250000 },
    { mes: 'Fev', valor: 1380000 },
    { mes: 'Mar', valor: 1520000 },
    { mes: 'Abr', valor: 1680000 },
    { mes: 'Mai', valor: 1590000 },
    { mes: 'Jun', valor: 1450000 },
    { mes: 'Jul', valor: 1720000 },
    { mes: 'Ago', valor: 1850000 },
    { mes: 'Set', valor: 1980000 },
    { mes: 'Out', valor: 2100000 },
    { mes: 'Nov', valor: 2250000 },
    { mes: 'Dez', valor: 2450000 },
];

function money(value: number): string {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function ReceitaChart() {
    const total = receitaMensal.reduce((acc, item) => acc + item.valor, 0);
    const media = total / receitaMensal.length;
    const crescimento = ((receitaMensal[receitaMensal.length - 1].valor / receitaMensal[0].valor - 1) * 100).toFixed(1);

    const maior = [...receitaMensal].sort((a, b) => b.valor - a.valor)[0];
    const menor = [...receitaMensal].sort((a, b) => a.valor - b.valor)[0];

    return (
        <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid rgba(230, 201, 105, 0.1)', bgcolor: '#FFFFFF', overflow: 'hidden', mb: 3 }}>
            <Box sx={{ height: 6, background: `linear-gradient(90deg, #E6C969, #F5E6B8)` }} />

            <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: alpha('#E6C969', 0.1), color: '#E6C969', width: 40, height: 40 }}>
                            <TrendingUpIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                Evolução da Receita
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748B' }}>
                                Últimos 12 meses • Média: {money(media)}
                            </Typography>
                        </Box>
                    </Stack>

                    <Chip
                        label={`Crescimento: +${crescimento}%`}
                        size="small"
                        sx={{ bgcolor: alpha('#10B981', 0.1), color: '#10B981', fontWeight: 600 }}
                    />
                </Stack>

                <Box sx={{ width: '100%', height: 300, mb: 3 }}>
                    <ResponsiveContainer>
                        <AreaChart data={receitaMensal}>
                            <defs>
                                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#E6C969" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#E6C969" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={alpha('#64748B', 0.1)} />
                            <XAxis dataKey="mes" stroke="#64748B" />
                            <YAxis tickFormatter={(v) => money(v).replace('R$', '')} stroke="#64748B" />
                            <Tooltip
                                formatter={(value: number) => money(value)}
                                contentStyle={{
                                    backgroundColor: '#0F172A',
                                    border: '1px solid rgba(230, 201, 105, 0.1)',
                                    borderRadius: 8,
                                    color: '#FFFFFF',
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="valor"
                                stroke="#E6C969"
                                strokeWidth={3}
                                fill="url(#colorReceita)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </Box>

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: alpha('#10B981', 0.03), border: `1px solid ${alpha('#10B981', 0.15)}` }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar sx={{ bgcolor: alpha('#10B981', 0.1), color: '#10B981', width: 40, height: 40 }}>
                                    <TrendingUpIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#64748B' }}>Melhor Mês</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>{maior.mes}</Typography>
                                    <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 600 }}>{money(maior.valor)}</Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: alpha('#F59E0B', 0.03), border: `1px solid ${alpha('#F59E0B', 0.15)}` }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar sx={{ bgcolor: alpha('#F59E0B', 0.1), color: '#F59E0B', width: 40, height: 40 }}>
                                    <TrendingDownIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#64748B' }}>Pior Mês</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>{menor.mes}</Typography>
                                    <Typography variant="body2" sx={{ color: '#F59E0B', fontWeight: 600 }}>{money(menor.valor)}</Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}