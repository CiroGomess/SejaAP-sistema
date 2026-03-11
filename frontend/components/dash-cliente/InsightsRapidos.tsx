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
} from '@mui/material';
import {
    Lightbulb as LightbulbIcon,
    TrendingUp as TrendingUpIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Info as InfoIcon,
} from '@mui/icons-material';

const insights = [
    {
        tipo: 'positivo',
        titulo: 'Crescimento Acelerado',
        descricao: 'Faturamento cresceu 22,5% nos últimos 12 meses',
        icone: <TrendingUpIcon />,
        cor: '#10B981',
    },
    {
        tipo: 'atencao',
        titulo: 'Classe C em Atenção',
        descricao: '3 produtos com baixa performance precisam de revisão',
        icone: <WarningIcon />,
        cor: '#F59E0B',
    },
    {
        tipo: 'info',
        titulo: 'Ticket Médio em Alta',
        descricao: 'Aumento de 8,2% comparado ao ano anterior',
        icone: <InfoIcon />,
        cor: '#3B82F6',
    },
    {
        tipo: 'sucesso',
        titulo: 'Margem Saudável',
        descricao: 'Margem média de 42,5% acima da média do setor',
        icone: <CheckCircleIcon />,
        cor: '#8B5CF6',
    },
];

export default function InsightsRapidos() {
    return (
        <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid rgba(230, 201, 105, 0.1)', bgcolor: '#FFFFFF', overflow: 'hidden', mb: 3 }}>
            <Box sx={{ height: 6, background: `linear-gradient(90deg, #E6C969, #F5E6B8)` }} />

            <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                    <Avatar sx={{ bgcolor: alpha('#E6C969', 0.1), color: '#E6C969', width: 40, height: 40 }}>
                        <LightbulbIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                            Insights Rápidos
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>
                            O que está acontecendo com seu negócio
                        </Typography>
                    </Box>
                </Stack>

                <Grid container spacing={2}>
                    {insights.map((insight, index) => (
                        <Grid size={{ xs: 12, sm: 6 }} key={index}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 3,
                                    bgcolor: alpha(insight.cor, 0.04),
                                    border: `1px solid ${alpha(insight.cor, 0.15)}`,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: `0 8px 16px ${alpha(insight.cor, 0.1)}`,
                                    },
                                }}
                            >
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Avatar sx={{ bgcolor: alpha(insight.cor, 0.1), color: insight.cor, width: 40, height: 40 }}>
                                        {insight.icone}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                            {insight.titulo}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                                            {insight.descricao}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </CardContent>
        </Card>
    );
}