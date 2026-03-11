'use client';

import React from 'react';
import {
    Box,
    Container,
    Stack,
    Typography,
    Avatar,
    alpha
} from '@mui/material';
import {
 
    Person as PersonIcon,
} from '@mui/icons-material';
interface DashHeaderProps {
    clientName: string;
    clientCode: string;
    period?: string;
}

export default function DashHeader({ clientName, clientCode, period }: DashHeaderProps) {


    return (
        <Box
            sx={{
                background: `linear-gradient(135deg, ${alpha('#E6C969', 0.05)} 0%, ${alpha('#0F172A', 0.02)} 100%)`,
                borderBottom: '1px solid rgba(230, 201, 105, 0.1)',
                pt: 3,
                pb: 2,
                mb: 3,
            }}
        >
            <Container maxWidth={false} sx={{ maxWidth: '95%', mx: 'auto' }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A' }}>
                            Dashboard do Cliente
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                            <Avatar
                                sx={{
                                    width: 28,
                                    height: 28,
                                    bgcolor: alpha('#E6C969', 0.1),
                                    color: '#E6C969',
                                }}
                            >
                                <PersonIcon sx={{ fontSize: 16 }} />
                            </Avatar>
                            <Typography variant="body1" sx={{ color: '#64748B' }}>
                                <strong>{clientName}</strong> • Código: {clientCode}
                                {period && ` • ${period}`}
                            </Typography>
                        </Stack>
                    </Box>
                </Stack>
            </Container>
        </Box>
    );
}