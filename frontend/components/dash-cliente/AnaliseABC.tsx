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
    Grid,
    Paper,
    Chip,
} from '@mui/material';
import {
    Category as CategoryIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const dadosABC = [
    { classe: 'A', valor: 65, cor: '#10B981', label: '65% do faturamento' },
    { classe: 'B', valor: 20, cor: '#E6C969', label: '20% do faturamento' },
    { classe: 'C', valor: 15, cor: '#F59E0B', label: '15% do faturamento' },
];

const PIE_COLORS = ['#10B981', '#E6C969', '#F59E0B'];

function money(value: number): string {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function AnaliseABC() {
    return (
        <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid rgba(230, 201, 105, 0.1)', bgcolor: '#FFFFFF', overflow: 'hidden', width: '49%' }}>
            <Box sx={{ height: 6, background: `linear-gradient(90deg, #E6C969, #F5E6B8)` }} />

            <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                    <Avatar sx={{ bgcolor: alpha('#E6C969', 0.1), color: '#E6C969', width: 40, height: 40 }}>
                        <CategoryIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                            Análise ABC
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>
                            Distribuição do faturamento por categoria
                        </Typography>
                    </Box>
                </Stack>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Box sx={{ width: '100%', height: 200 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={dadosABC}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="valor"
                                        nameKey="classe"
                                        label={({ classe, percent }) => `${classe} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {dadosABC.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => `${value}%`}
                                        contentStyle={{
                                            backgroundColor: '#0F172A',
                                            border: '1px solid rgba(230, 201, 105, 0.1)',
                                            borderRadius: 8,
                                            color: '#FFFFFF',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 7 }}>
                        <Stack spacing={2}>
                            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: alpha('#10B981', 0.04), border: `1px solid ${alpha('#10B981', 0.15)}` }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>Classe A</Typography>
                                        <Typography variant="caption" sx={{ color: '#64748B' }}>Maior relevância</Typography>
                                    </Box>
                                    <Chip label="10 itens" size="small" sx={{ bgcolor: alpha('#10B981', 0.1), color: '#10B981', fontWeight: 600 }} />
                                </Stack>
                            </Paper>

                            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: alpha('#E6C969', 0.04), border: `1px solid ${alpha('#E6C969', 0.15)}` }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>Classe B</Typography>
                                        <Typography variant="caption" sx={{ color: '#64748B' }}>Relevância intermediária</Typography>
                                    </Box>
                                    <Chip label="5 itens" size="small" sx={{ bgcolor: alpha('#E6C969', 0.1), color: '#E6C969', fontWeight: 600 }} />
                                </Stack>
                            </Paper>

                            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: alpha('#F59E0B', 0.04), border: `1px solid ${alpha('#F59E0B', 0.15)}` }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>Classe C</Typography>
                                        <Typography variant="caption" sx={{ color: '#64748B' }}>Menor relevância</Typography>
                                    </Box>
                                    <Chip label="3 itens" size="small" sx={{ bgcolor: alpha('#F59E0B', 0.1), color: '#F59E0B', fontWeight: 600 }} />
                                </Stack>
                            </Paper>
                        </Stack>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}