'use client';

import React from 'react';
import {
  Stack,
  TextField,
  IconButton,
  Tooltip,
  MenuItem,
  InputAdornment,

} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface ListFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  anoFilter: string;
  onAnoChange: (value: string) => void;
  perPage: number;
  onPerPageChange: (value: number) => void;
  onRefresh: () => void;
  loading: boolean;
  brand?: string;
}

export default function ListFilters({
  search,
  onSearchChange,
  anoFilter,
  onAnoChange,
  perPage,
  onPerPageChange,
  onRefresh,
  loading,
  brand = '#E6C969',
}: ListFiltersProps) {
  const inputSx = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#FFFFFF',
      borderRadius: 2,
      transition: 'all 0.2s ease',
      '& fieldset': { 
        borderColor: 'rgba(230, 201, 105, 0.2)',
        borderWidth: '1.5px',
      },
      '&:hover fieldset': { 
        borderColor: '#64748B',
      },
      '&.Mui-focused': {
        '& fieldset': { 
          borderColor: brand,
          borderWidth: '2px',
        },
      },
      '& .MuiInputBase-input': {
        color: '#0F172A',
        fontWeight: 500,
        fontSize: '0.9rem',
        padding: '10px 14px',
      },
    },
    '& .MuiInputLabel-root': { 
      color: '#64748B', 
      fontWeight: 500,
      fontSize: '0.85rem',
      '&.Mui-focused': { 
        color: brand,
        fontWeight: 600,
      },
    },
  };

  return (
    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
      {/* Filtro de Ano */}
      <TextField
        size="small"
        label="Ano"
        type="number"
        value={anoFilter}
        onChange={(e) => onAnoChange(e.target.value)}
        sx={{ width: 100, ...inputSx }}
        InputProps={{
          inputProps: { min: 2000, max: 2100 },
        }}
      />

      {/* Busca */}
      <TextField
        size="small"
        placeholder="Buscar descrição..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" sx={{ color: '#94A3B8' }} />
            </InputAdornment>
          ),
        }}
        sx={{
          minWidth: 260,
          ...inputSx,
        }}
      />

      {/* Select por página */}
      <TextField
        size="small"
        select
        label="Por página"
        value={perPage}
        onChange={(e) => onPerPageChange(Number(e.target.value))}
        sx={{ width: 120, ...inputSx }}
      >
        <MenuItem value={10}>10 linhas</MenuItem>
        <MenuItem value={25}>25 linhas</MenuItem>
        <MenuItem value={50}>50 linhas</MenuItem>
        <MenuItem value={100}>100 linhas</MenuItem>
      </TextField>

      {/* Botão Atualizar */}
      <Tooltip title="Atualizar dados" arrow>
        <IconButton
          onClick={onRefresh}
          disabled={loading}
          sx={{
            border: '1px solid rgba(230, 201, 105, 0.2)',
            borderRadius: 2,
            bgcolor: '#FFFFFF',
            width: 40,
            height: 40,
            '&:hover': { borderColor: brand, color: brand },
          }}
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}