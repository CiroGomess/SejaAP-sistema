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
    AccountBalance as AccountBalanceIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,

} from '@mui/icons-material';

const dadosContabeis = {
    receitas: 38872169,
    despesas: 15234678,
    ativo: 52345678,
    passivo: 18765432,
    margem: 42.5,
};

function money(value: number): string {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function AnaliseContabil() {
    const resultado = dadosContabeis.receitas - dadosContabeis.despesas;
    const margem = (resultado / dadosContabeis.receitas) * 100;

    return (
        <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid rgba(230, 201, 105, 0.1)', bgcolor: '#FFFFFF', overflow: 'hidden', mb: 3 }}>
            <Box sx={{ height: 6, background: `linear-gradient(90deg, #E6C969, #F5E6B8)` }} />

            <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                    <Avatar sx={{ bgcolor: alpha('#E6C969', 0.1), color: '#E6C969', width: 40, height: 40 }}>
                        <AccountBalanceIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                            Resumo Contábil
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>
                            Principais indicadores financeiros
                        </Typography>
                    </Box>
                </Stack>

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: alpha('#10B981', 0.04), border: `1px solid ${alpha('#10B981', 0.15)}` }}>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>Receitas Totais</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#10B981' }}>{money(dadosContabeis.receitas)}</Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: alpha('#EF4444', 0.04), border: `1px solid ${alpha('#EF4444', 0.15)}` }}>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>Despesas Totais</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#EF4444' }}>{money(dadosContabeis.despesas)}</Typography>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: alpha('#E6C969', 0.03), border: `1px solid ${alpha('#E6C969', 0.15)}` }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#64748B' }}>Resultado Líquido</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: resultado >= 0 ? '#10B981' : '#EF4444' }}>
                                        {money(resultado)}
                                    </Typography>
                                </Box>
                                <Chip
                                    icon={margem >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                                    label={`${margem.toFixed(1)}%`}
                                    sx={{ bgcolor: alpha(margem >= 0 ? '#10B981' : '#EF4444', 0.1), color: margem >= 0 ? '#10B981' : '#EF4444' }}
                                />
                            </Stack>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: `1px solid ${alpha('#3B82F6', 0.15)}` }}>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>Ativo Total</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>{money(dadosContabeis.ativo)}</Typography>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: `1px solid ${alpha('#64748B', 0.15)}` }}>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>Passivo Total</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>{money(dadosContabeis.passivo)}</Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}