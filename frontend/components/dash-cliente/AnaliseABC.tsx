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

type AnaliseABCProps = {
    data: {
        faturamentoTotal: number;
        classes: {
            A: {
                qtdItens: number;
                valorTotal: number;
                percentualFaturamento: number;
                descricao: string;
            };
            B: {
                qtdItens: number;
                valorTotal: number;
                percentualFaturamento: number;
                descricao: string;
            };
            C: {
                qtdItens: number;
                valorTotal: number;
                percentualFaturamento: number;
                descricao: string;
            };
        };
        graficoDonut: Array<{
            classe: 'A' | 'B' | 'C';
            valor: number;
            cor: string;
            label: string;
        }>;
    };
};

const PIE_COLORS = ['#10B981', '#E6C969', '#F59E0B'];

export default function AnaliseABC({ data }: AnaliseABCProps) {
    const dadosABC = data?.graficoDonut || [];

    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: 4,
                border: '1px solid rgba(0, 0, 0, 0.1)',
                bgcolor: '#FFFFFF',
                overflow: 'hidden',
                width: '49%',
                minWidth: 340,
                flex: 1,
            }}
        >
        

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
                                        label={({ classe, percent }) => `${classe} ${((percent || 0) * 100).toFixed(0)}%`}
                                    >
                                        {dadosABC.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.cor || PIE_COLORS[index]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => `${Number(value).toFixed(2)}%`}
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
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 3,
                                    bgcolor: alpha('#10B981', 0.04),
                                    border: `1px solid ${alpha('#10B981', 0.15)}`,
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                            Classe A
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                                            {data.classes.A.descricao}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={`${data.classes.A.qtdItens} itens`}
                                        size="small"
                                        sx={{ bgcolor: alpha('#10B981', 0.1), color: '#10B981', fontWeight: 600 }}
                                    />
                                </Stack>
                            </Paper>

                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 3,
                                    bgcolor: alpha('#E6C969', 0.04),
                                    border: `1px solid ${alpha('#E6C969', 0.15)}`,
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                            Classe B
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                                            {data.classes.B.descricao}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={`${data.classes.B.qtdItens} itens`}
                                        size="small"
                                        sx={{ bgcolor: alpha('#E6C969', 0.1), color: '#E6C969', fontWeight: 600 }}
                                    />
                                </Stack>
                            </Paper>

                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 3,
                                    bgcolor: alpha('#F59E0B', 0.04),
                                    border: `1px solid ${alpha('#F59E0B', 0.15)}`,
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                            Classe C
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                                            {data.classes.C.descricao}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={`${data.classes.C.qtdItens} itens`}
                                        size="small"
                                        sx={{ bgcolor: alpha('#F59E0B', 0.1), color: '#F59E0B', fontWeight: 600 }}
                                    />
                                </Stack>
                            </Paper>
                        </Stack>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}