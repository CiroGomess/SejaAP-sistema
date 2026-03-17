'use client';

import React, { useCallback, useEffect, useState } from 'react';
import services from '@/services/service';

import {
    Card,
    CardContent,
    Typography,
    Box,
    Stack,
    Avatar,
    alpha,
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
} from '@mui/icons-material';

const readEndpoint = '/dashcliente';

const meses = [
    '',
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
];

function money(value: number): string {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

function formatCompactBR(value: number): string {
    const abs = Math.abs(value);

    if (abs >= 1000000000) {
        const formatted = (value / 1000000000).toLocaleString('pt-BR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
        });
        return `${formatted} bi`;
    }

    if (abs >= 1000000) {
        const formatted = (value / 1000000).toLocaleString('pt-BR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
        });
        return `${formatted} mi`;
    }

    if (abs >= 1000) {
        const formatted = (value / 1000).toLocaleString('pt-BR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
        });
        return `${formatted} mil`;
    }

    return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
}

type Props = {
    userId: string;
    year: number;
};

type ChartItem = {
    mes: string;
    valor: number;
};

export default function ReceitaChart(props: Props) {
    const [data, setData] = useState<ChartItem[]>([]);
    const [media, setMedia] = useState<number>(0);
    const [crescimento, setCrescimento] = useState<string>('0');

    const load = useCallback(async () => {
        const safeUserId = String(props.userId || '').trim();

        if (!safeUserId || !props.year) {
            setData([]);
            setMedia(0);
            setCrescimento('0');
            return;
        }

        try {
            const params = new URLSearchParams({
                user_id: safeUserId,
                year: String(props.year),
            });

            const res = await services(`${readEndpoint}?${params.toString()}`, {
                method: 'GET',
            });

            if (!res.success) {
                setData([]);
                setMedia(0);
                setCrescimento('0');
                return;
            }

            const payload = res.data || {};
            const grafico = payload.grafico_receita || {};

            const evolucao = Array.isArray(grafico.receita_evolutiva)
                ? grafico.receita_evolutiva.map((item: { mes: number; valor_total: string }) => ({
                      mes: meses[item.mes] || '',
                      valor: Number(item.valor_total || 0),
                  }))
                : [];

            setData(evolucao);
            setMedia(Number(grafico.media_mensal || 0));
            setCrescimento(String(grafico.crescimento_periodo || '0'));
        } catch {
            setData([]);
            setMedia(0);
            setCrescimento('0');
        }
    }, [props.userId, props.year]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: 4,
                border: '1px solid rgba(230, 201, 105, 0.1)',
                bgcolor: '#FFFFFF',
                overflow: 'hidden',
                mb: 3,
            }}
        >
            <Box sx={{ height: 6, background: 'linear-gradient(90deg, #E6C969, #F5E6B8)' }} />

            <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                            sx={{
                                bgcolor: alpha('#E6C969', 0.1),
                                color: '#E6C969',
                                width: 40,
                                height: 40,
                            }}
                        >
                            <TrendingUpIcon />
                        </Avatar>

                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                Evolução da Receita
                            </Typography>

                            <Typography variant="body2" sx={{ color: '#64748B' }}>
                                Média mensal: {money(media)}
                            </Typography>
                        </Box>
                    </Stack>

                    <Chip
                        label={`Crescimento: ${Number(crescimento) > 0 ? '+' : ''}${crescimento}%`}
                        size="small"
                        sx={{
                            bgcolor: alpha(Number(crescimento) >= 0 ? '#10B981' : '#EF4444', 0.1),
                            color: Number(crescimento) >= 0 ? '#10B981' : '#EF4444',
                            fontWeight: 600,
                        }}
                    />
                </Stack>

                <Box sx={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer>
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#E6C969" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#E6C969" stopOpacity={0} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" stroke={alpha('#64748B', 0.1)} />
                            <XAxis dataKey="mes" stroke="#64748B" />

                            <YAxis
                                tickFormatter={(v) => formatCompactBR(Number(v))}
                                stroke="#64748B"
                                width={60}
                            />

                            <Tooltip
                                formatter={(value: number) => money(value)}
                                contentStyle={{
                                    backgroundColor: '#0F172A',
                                    borderRadius: 8,
                                    color: '#FFFFFF',
                                    border: '1px solid rgba(230, 201, 105, 0.1)',
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
            </CardContent>
        </Card>
    );
}