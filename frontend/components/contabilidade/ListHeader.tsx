'use client';

import React from 'react';
import {
    Box,
    Stack,
    Typography,
    Chip,
    Avatar,
    alpha,
} from '@mui/material';
import {
    Person as PersonIcon,
    AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { SelectedClient } from './types';

interface ListHeaderProps {
    client: SelectedClient | null;
    totalItems?: number;
    totalValue?: number;
}

function moneyBR(v: number): string {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ListHeader({ client, totalItems, totalValue }: ListHeaderProps) {
    if (!client) {
        return (
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
                    Dados Contábeis
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748B' }}>
                    Selecione um cliente no menu lateral para visualizar os dados
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A', mb: 1 }}>
                Dados Contábeis
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar
                        sx={{
                            width: 32,
                            height: 32,
                            bgcolor: alpha('#E6C969', 0.1),
                            color: '#E6C969',
                        }}
                    >
                        <PersonIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Typography variant="body1" sx={{ color: '#64748B' }}>
                        <strong>{client.name}</strong> • Código: {client.code}
                    </Typography>
                </Stack>

                {totalItems !== undefined && (
                    <Chip
                        icon={<AccountBalanceIcon />}
                        label={`${totalItems} registros`}
                        size="small"
                        sx={{
                            bgcolor: alpha('#E6C969', 0.1),
                            color: '#E6C969',
                            fontWeight: 600,
                        }}
                    />
                )}

            </Stack>
        </Box>
    );
}