'use client';

import React from 'react';
import {
    Box,
    Container,
    Stack,
    Typography,
    Avatar,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    alpha,
    SelectChangeEvent
} from '@mui/material';
import {
    Person as PersonIcon,
} from '@mui/icons-material';

interface DashHeaderProps {
    clientName: string;
    clientCode: string;
    period?: string;
    availableYears?: number[];
    onYearChange?: (year: number) => void;
}

export default function DashHeader({ 
    clientName, 
    clientCode, 
    period, 
    availableYears = [],
    onYearChange 
}: DashHeaderProps) {
    
    const handleYearChange = (event: SelectChangeEvent) => {
        const newYear = Number(event.target.value);
        if (onYearChange) {
            onYearChange(newYear);
        }
    };

    const GOLD_PRIMARY = '#E6C969';

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
                <Stack 
                    direction="row" 
                    alignItems="center" 
                    justifyContent="space-between"
                    spacing={2}
                >
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

                    {availableYears.length > 0 && (
                        <FormControl 
                            size="small" 
                            sx={{ 
                                minWidth: 100,
                                '& .MuiOutlinedInput-root': {
                                    '&:hover fieldset': {
                                        borderColor: GOLD_PRIMARY,
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: GOLD_PRIMARY,
                                    },
                                },
                            }}
                        >
                            <InputLabel 
                                id="year-select-label"
                                sx={{
                                    '&.Mui-focused': {
                                        color: GOLD_PRIMARY,
                                    },
                                }}
                            >
                                Ano
                            </InputLabel>
                            <Select
                                labelId="year-select-label"
                                id="year-select"
                                value={period || new Date().getFullYear().toString()}
                                label="Ano"
                                onChange={handleYearChange}
                                sx={{
                                    '& .MuiSelect-icon': {
                                        color: GOLD_PRIMARY,
                                    },
                                    bgcolor: 'white',
                                }}
                            >
                                {availableYears.sort((a, b) => b - a).map((year) => (
                                    <MenuItem key={year} value={year}>
                                        {year}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </Stack>
            </Container>
        </Box>
    );
}