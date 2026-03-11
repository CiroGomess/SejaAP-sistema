'use client';

import React from 'react';
import {
    Box,
    IconButton,
    Typography,
} from '@mui/material';
import {
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

interface TablePaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (newPage: number) => void;
    disabled?: boolean;
    loading?: boolean;
    brand?: string;
}

export default function TablePagination({
    page,
    totalPages,
    onPageChange,
    disabled,
    loading,
    brand = '#E6C969',
}: TablePaginationProps) {
    // Garantir que totalPages seja pelo menos 1
    const safeTotalPages = Math.max(1, totalPages || 1);
    const safePage = Math.min(page, safeTotalPages);

    const canPrev = safePage > 1;
    const canNext = safePage < safeTotalPages;

    const pageLabel = safeTotalPages > 0 ? `Página ${safePage} de ${safeTotalPages}` : `Página ${safePage}`;

    const handlePrevPage = () => {
        if (canPrev && !disabled && !loading) {
            onPageChange(safePage - 1);
        }
    };

    const handleNextPage = () => {
        if (canNext && !disabled && !loading) {
            onPageChange(safePage + 1);
        }
    };

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            border: '1px solid rgba(230, 201, 105, 0.2)',
            borderRadius: 2,
            px: 1,
            py: 0.5,
            bgcolor: '#FFFFFF',
        }}>
            <IconButton
                disabled={!canPrev || disabled || loading}
                onClick={handlePrevPage}
                size="small"
                sx={{
                    color: canPrev ? '#0F172A' : '#94A3B8',
                    '&:hover': { color: brand },
                    '&.Mui-disabled': { opacity: 0.5 },
                }}
            >
                <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <Typography variant="caption" fontWeight={600} sx={{ mx: 1, color: '#0F172A' }}>
                {pageLabel}
            </Typography>
            <IconButton
                disabled={!canNext || disabled || loading}
                onClick={handleNextPage}
                size="small"
                sx={{
                    color: canNext ? '#0F172A' : '#94A3B8',
                    '&:hover': { color: brand },
                    '&.Mui-disabled': { opacity: 0.5 },
                }}
            >
                <ChevronRightIcon fontSize="small" />
            </IconButton>
        </Box>
    );
}