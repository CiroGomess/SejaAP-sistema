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
    Grid2 as Grid,
    Paper,
    Chip,
    Tooltip as MuiTooltip,
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

type TicketMedioProps = {
    data: {
        mediaTop5: number;
        variacaoMediaVsAnoAnterior: number;
        top5Produtos: Array<{
            rank: number;
            produto: string;
            ticket: number;
            variacao: number | null;
        }>;
    };
};

function money(value: number): string {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function TicketMedio({ data }: TicketMedioProps) {
    const dadosTicket = data?.top5Produtos || [];
    const variacaoMedia = Number(data?.variacaoMediaVsAnoAnterior || 0);
    const variacaoPositiva = variacaoMedia >= 0;

    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: 3,
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                overflow: 'hidden',
                width: '50%',
                height: 'fit-content',
            }}
        >
            {/* Header */}
            <Box sx={{ p: 3, pb: 0 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                            sx={{
                                bgcolor: alpha('#E6C969', 0.1),
                                color: '#E6C969',
                                width: 40,
                                height: 40,
                            }}
                        >
                            <AttachMoneyIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#0F172A' }}>
                                Ticket Médio
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748B' }}>
                                Top 5 produtos • {money(data?.mediaTop5 || 0)} média
                            </Typography>
                        </Box>
                    </Stack>

                    <Chip
                        label={`${variacaoPositiva ? '+' : ''}${variacaoMedia.toFixed(1)}%`}
                        size="small"
                        icon={variacaoPositiva ? <TrendingUpIcon /> : <TrendingDownIcon />}
                        sx={{
                            bgcolor: alpha(variacaoPositiva ? '#10B981' : '#EF4444', 0.1),
                            color: variacaoPositiva ? '#10B981' : '#EF4444',
                            fontWeight: 500,
                            '& .MuiChip-icon': {
                                color: 'inherit',
                                fontSize: 16,
                            },
                        }}
                    />
                </Stack>

                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1 }}>
                    vs ano anterior
                </Typography>
            </Box>

            {/* Gráfico */}
            <Box sx={{ height: 240, px: 3, py: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={dadosTicket}
                        layout="vertical"
                        margin={{ top: 0, right: 0, left: 20, bottom: 0 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={alpha('#64748B', 0.1)}
                            horizontal={false}
                        />
                        <XAxis
                            type="number"
                            tickFormatter={(v) => money(Number(v)).replace('R$', '').trim()}
                            stroke="#94A3B8"
                            fontSize={11}
                        />
                        <YAxis
                            dataKey="produto"
                            type="category"
                            width={140}
                            stroke="#94A3B8"
                            tick={({ x, y, payload }) => {
                                const produto = String(payload.value);
                                const codigo = produto.match(/\[\d+\]/)?.[0] || '';
                                const nome = produto.replace(/\[\d+\]\s*/, '');

                                return (
                                    <g transform={`translate(${x},${y})`}>
                                        <text
                                            x={-10}
                                            y={0}
                                            dy={4}
                                            textAnchor="end"
                                            fill="#0F172A"
                                            fontSize={11}
                                            fontWeight={500}
                                        >
                                            <tspan>{codigo}</tspan>
                                            <tspan dx={5} fill="#64748B" fontSize={10}>
                                                {nome.length > 20 ? `${nome.substring(0, 20)}...` : nome}
                                            </tspan>
                                        </text>
                                    </g>
                                );
                            }}
                            interval={0}
                        />
                        <Tooltip
                            formatter={(value: number) => money(Number(value))}
                            labelFormatter={(label) => {
                                const nome = String(label).replace(/\[\d+\]\s*/, '');
                                return nome;
                            }}
                            contentStyle={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: 8,
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                fontSize: 12,
                            }}
                        />
                        <Bar 
                            dataKey="ticket" 
                            fill="#E6C969" 
                            radius={[0, 4, 4, 0]} 
                            maxBarSize={20}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </Box>

            {/* Lista de produtos */}
            <Box sx={{ p: 3, pt: 0 }}>
                <Typography variant="subtitle2" sx={{ color: '#0F172A', fontWeight: 600, mb: 2 }}>
                    Detalhamento
                </Typography>

                <Stack spacing={1.5}>
                    {dadosTicket.map((item, index) => {
                        const variacao = item.variacao ?? 0;
                        const positiva = variacao >= 0;
                        const codigo = item.produto.match(/\[\d+\]/)?.[0] || '';
                        const nome = item.produto.replace(/\[\d+\]\s*/, '');

                        return (
                            <Paper
                                key={index}
                                elevation={0}
                                sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    border: '1px solid #E2E8F0',
                                    bgcolor: index % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: '#E6C969',
                                                    fontWeight: 600,
                                                    fontSize: 11,
                                                }}
                                            >
                                                {codigo}
                                            </Typography>
                                            <MuiTooltip title={nome} arrow>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 500,
                                                        color: '#0F172A',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                    }}
                                                >
                                                    {nome}
                                                </Typography>
                                            </MuiTooltip>
                                        </Stack>
                                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                                            Rank #{index + 1}
                                        </Typography>
                                    </Box>

                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: 600,
                                                color: '#0F172A',
                                            }}
                                        >
                                            {money(item.ticket)}
                                        </Typography>
                                        <Chip
                                            label={`${positiva ? '+' : ''}${variacao.toFixed(1)}%`}
                                            size="small"
                                            sx={{
                                                bgcolor: alpha(positiva ? '#10B981' : '#EF4444', 0.1),
                                                color: positiva ? '#10B981' : '#EF4444',
                                                height: 20,
                                                fontSize: 10,
                                                fontWeight: 600,
                                                minWidth: 50,
                                            }}
                                        />
                                    </Stack>
                                </Stack>
                            </Paper>
                        );
                    })}
                </Stack>
            </Box>
        </Card>
    );
}