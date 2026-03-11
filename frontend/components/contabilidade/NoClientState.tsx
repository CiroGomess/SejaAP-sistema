'use client';

import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,

    Divider,
    Avatar,
    alpha,
} from '@mui/material';
import {
    PersonSearch as PersonSearchIcon,
    AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';

interface NoClientStateProps {
    onGoToClients: () => void;
}

export default function NoClientState({ onGoToClients }: NoClientStateProps) {
    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
        }}>
            <Card
                elevation={0}
                sx={{
                    maxWidth: 520,
                    width: '100%',
                    borderRadius: 4,
                    border: '1px solid rgba(230, 201, 105, 0.2)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 6,
                        background: 'linear-gradient(90deg, #E6C969, rgba(230, 201, 105, 0.3))',
                    }}
                />

                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Avatar
                        sx={{
                            width: 80,
                            height: 80,
                            bgcolor: alpha('#E6C969', 0.1),
                            color: '#E6C969',
                            mx: 'auto',
                            mb: 3,
                        }}
                    >
                        <AccountBalanceIcon sx={{ fontSize: 40 }} />
                    </Avatar>

                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A', mb: 1 }}>
                        Nenhum cliente selecionado
                    </Typography>

                    <Typography sx={{ color: '#64748B', mb: 4, maxWidth: 360, mx: 'auto' }}>
                        Para importar dados contábeis, selecione um cliente no menu lateral.
                    </Typography>

                    <Divider sx={{ my: 3, borderColor: 'rgba(230, 201, 105, 0.1)' }} />

                    <Button
                        variant="contained"
                        startIcon={<PersonSearchIcon />}
                        onClick={onGoToClients}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: 2,
                            px: 4,
                            py: 1.2,
                            bgcolor: '#E6C969',
                            color: '#0F172A',
                            '&:hover': {
                                bgcolor: '#C4A052',
                                transform: 'translateY(-2px)',
                                boxShadow: `0 8px 16px ${alpha('#E6C969', 0.3)}`,
                            },
                            transition: 'all 0.2s ease',
                        }}
                    >
                        Ir para Clientes
                    </Button>
                </CardContent>
            </Card>
        </Box>
    );
}