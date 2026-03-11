'use client';

import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Typography,
    alpha,
    CircularProgress,
} from '@mui/material';
import {
    FilterAlt as FilterIcon,
} from '@mui/icons-material';
import { ContabilidadeData } from './types';

interface DataTableProps {
    data: ContabilidadeData[];
    loading: boolean;
    brand?: string;
}

function moneyBR(v: number | string | null): string {
    const n = Number(v);
    if (!Number.isFinite(n)) return 'R$ 0,00';
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
}

export default function DataTable({ data, loading, brand = '#E6C969' }: DataTableProps) {
    const columns = ['Ano', 'Categoria', 'Descrição', 'Valor', 'Data Importação'];

    if (loading) {
        return (
            <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                    backgroundColor: '#FFFFFF',
                    minHeight: 400,
                    position: 'relative',
                }}
            >
                <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                        <TableRow>
                            {columns.map((col) => (
                                <TableCell
                                    key={col}
                                    sx={{
                                        fontWeight: 700,
                                        color: '#64748B',
                                        backgroundColor: '#F8FAFC',
                                        borderBottom: '1px solid rgba(230, 201, 105, 0.1)',
                                    }}
                                    align={col === 'Valor' ? 'right' : 'left'}
                                >
                                    {col}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                <CircularProgress size={40} sx={{ color: brand, mb: 2 }} />
                                <Typography sx={{ color: '#64748B' }}>Carregando dados...</Typography>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        );
    }

    if (data.length === 0) {
        return (
            <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                    backgroundColor: '#FFFFFF',
                    minHeight: 400,
                    position: 'relative',
                }}
            >
                <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                        <TableRow>
                            {columns.map((col) => (
                                <TableCell
                                    key={col}
                                    sx={{
                                        fontWeight: 700,
                                        color: '#64748B',
                                        backgroundColor: '#F8FAFC',
                                        borderBottom: '1px solid rgba(230, 201, 105, 0.1)',
                                    }}
                                    align={col === 'Valor' ? 'right' : 'left'}
                                >
                                    {col}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                <FilterIcon sx={{ fontSize: 48, color: '#94A3B8', opacity: 0.5, mb: 2 }} />
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#0F172A', mb: 1 }}>
                                    Nenhum registro encontrado
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                                    Verifique o ano selecionado ou faça uma nova importação
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        );
    }

    return (
        <TableContainer
            component={Paper}
            elevation={0}
            sx={{
                backgroundColor: '#FFFFFF',
                maxHeight: 600,
                overflow: 'auto',
                position: 'relative',
            }}
        >
            <Table
                stickyHeader
                sx={{
                    minWidth: 650,
                    tableLayout: 'fixed',
                }}
            >
                <TableHead>
                    <TableRow>
                        {columns.map((col) => (
                            <TableCell
                                key={col}
                                sx={{
                                    fontWeight: 700,
                                    color: '#64748B',
                                    backgroundColor: '#F8FAFC',
                                    borderBottom: '1px solid rgba(230, 201, 105, 0.1)',
                                    whiteSpace: 'nowrap',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 10,
                                }}
                                align={col === 'Valor' ? 'right' : 'left'}
                            >
                                {col}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map((row) => (
                        <TableRow
                            key={row.id}
                            hover
                            sx={{
                                '&:hover': { backgroundColor: alpha(brand, 0.02) },
                                '& td': { borderBottom: '1px solid rgba(230, 201, 105, 0.05)' },
                            }}
                        >
                            <TableCell sx={{ color: '#0F172A', fontWeight: 500 }}>{row.ano}</TableCell>

                            <TableCell>
                                <Chip
                                    label={row.categoria || 'Geral'}
                                    size="small"
                                    sx={{
                                        fontWeight: 600,
                                        borderRadius: 1.5,
                                        bgcolor: alpha(brand, 0.1),
                                        color: brand,
                                        border: 'none',
                                    }}
                                />
                            </TableCell>

                            <TableCell sx={{ color: '#0F172A', fontWeight: 500 }}>
                                {row.descricao}
                            </TableCell>

                            <TableCell
                                align="right"
                                sx={{
                                    fontWeight: 700,
                                    color: Number(row.valor) < 0 ? '#EF4444' : brand,
                                }}
                            >
                                {moneyBR(row.valor)}
                            </TableCell>

                            <TableCell sx={{ color: '#94A3B8', fontSize: '0.85rem' }}>
                                {formatDate(row.data_importacao)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}