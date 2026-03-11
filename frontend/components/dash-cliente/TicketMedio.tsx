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
    AttachMoney as AttachMoneyIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,

} from '@mui/icons-material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

const dadosTicket = [
    { produto: 'Produto A', ticket: 245.67, variacao: 12.3 },
    { produto: 'Produto B', ticket: 189.34, variacao: 8.5 },
    { produto: 'Produto C', ticket: 156.78, variacao: -3.2 },
    { produto: 'Produto D', ticket: 134.56, variacao: 15.7 },
    { produto: 'Produto E', ticket: 98.45, variacao: -5.1 },
];

function money(value: number): string {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function TicketMedio() {
    return (
        <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid rgba(230, 201, 105, 0.1)', bgcolor: '#FFFFFF', overflow: 'hidden',  width: '49%' }}>
            <Box sx={{ height: 6, background: `linear-gradient(90deg, #E6C969, #F5E6B8)` }} />

            <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: alpha('#E6C969', 0.1), color: '#E6C969', width: 40, height: 40 }}>
                            <AttachMoneyIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                Ticket Médio
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748B' }}>
                                Top 5 produtos • {money(185.45)} média
                            </Typography>
                        </Box>
                    </Stack>

                    <Chip
                        label="+8.2% vs ano anterior"
                        size="small"
                        sx={{ bgcolor: alpha('#10B981', 0.1), color: '#10B981', fontWeight: 600 }}
                    />
                </Stack>

                <Box sx={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                        <BarChart data={dadosTicket} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke={alpha('#64748B', 0.1)} horizontal={false} />
                            <XAxis type="number" tickFormatter={(v) => money(v).replace('R$', '')} stroke="#64748B" />
                            <YAxis dataKey="produto" type="category" width={80} stroke="#64748B" />
                            <Tooltip
                                formatter={(value: number) => money(value)}
                                contentStyle={{
                                    backgroundColor: '#0F172A',
                                    border: '1px solid rgba(230, 201, 105, 0.1)',
                                    borderRadius: 8,
                                    color: '#FFFFFF',
                                }}
                            />
                            <Bar dataKey="ticket" fill="#E6C969" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>

                <Grid container spacing={2} sx={{ mt: 2 }}>
                    {dadosTicket.slice(0, 3).map((item, index) => (
                        <Grid size={{ xs: 12, sm: 4 }} key={index}>
                            <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid rgba(230, 201, 105, 0.1)' }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#0F172A' }}>{item.produto}</Typography>
                                    <Chip
                                        icon={item.variacao > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                                        label={`${item.variacao > 0 ? '+' : ''}${item.variacao}%`}
                                        size="small"
                                        sx={{
                                            bgcolor: alpha(item.variacao > 0 ? '#10B981' : '#EF4444', 0.1),
                                            color: item.variacao > 0 ? '#10B981' : '#EF4444',
                                            height: 20,
                                        }}
                                    />
                                </Stack>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#E6C969' }}>{money(item.ticket)}</Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </CardContent>
        </Card>
    );
}