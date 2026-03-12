'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Avatar,
  Typography,
  TextField,
  Chip,
  Stack,
  alpha,
  IconButton,
} from '@mui/material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragIndicator as DragIndicatorIcon } from '@mui/icons-material';
import { DragStep } from './types';

interface DraggableStepCardProps {
  step: DragStep;
  onSelectOperacional: (id: string) => void;
  onSelectFinanceiro: (id: string) => void;
  onDaysChange: (id: string, nextDays: number) => void;
  disabled?: boolean;
}

export default function DraggableStepCard({
  step,
  onSelectOperacional,
  onSelectFinanceiro,
  onDaysChange,
  disabled,
}: DraggableStepCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  function handleSelectOperacional(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    if (disabled) return;
    onSelectOperacional(step.id);
  }

  function handleSelectFinanceiro(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    if (disabled) return;
    onSelectFinanceiro(step.id);
  }

  function handleDaysClick(e: React.MouseEvent) {
    e.stopPropagation();
  }

  function handleDaysChangeLocal(e: React.ChangeEvent<HTMLInputElement>) {
    e.stopPropagation();

    const value = Number(e.target.value);
    const nextDays = Number.isNaN(value) ? 0 : Math.max(0, Math.trunc(value));

    onDaysChange(step.id, nextDays);
  }

  return (
    <Card
      ref={setNodeRef}
      variant="outlined"
      sx={{
        mb: 1.5,
        opacity: disabled ? 0.75 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
        userSelect: 'none',
        border: '1px solid rgba(230, 201, 105, 0.2)',
        borderRadius: 3,
        boxShadow: isDragging ? `0 8px 20px ${alpha('#E6C969', 0.18)}` : 'none',
        bgcolor: isDragging ? alpha('#E6C969', 0.03) : 'transparent',
        '&:hover': {
          borderColor: '#E6C969',
          boxShadow: `0 4px 12px ${alpha('#E6C969', 0.15)}`,
        },
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          sx={{
            bgcolor: alpha('#E6C969', 0.1),
            color: '#E6C969',
            width: 48,
            height: 48,
            borderRadius: 2,
            flex: '0 0 auto',
          }}
        >
          {step.icon}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={700} sx={{ color: '#111827' }} noWrap>
            {step.label}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75, flexWrap: 'wrap' }}>
            <Box onClick={handleDaysClick}>
              <TextField
                label="Dias"
                type="number"
                size="small"
                value={step.days}
                disabled={!!disabled}
                onChange={handleDaysChangeLocal}
                inputProps={{ min: 0 }}
                sx={{
                  width: 100,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': { borderColor: 'rgba(230, 201, 105, 0.2)' },
                    '&:hover fieldset': { borderColor: '#E6C969' },
                    '&.Mui-focused fieldset': { borderColor: '#E6C969' },
                  },
                }}
              />
            </Box>

            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              tempo médio
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} sx={{ flex: '0 0 auto' }}>
          <Chip
            label="Operacional"
            clickable
            onClick={handleSelectOperacional}
            sx={{
              fontWeight: 600,
              cursor: disabled ? 'not-allowed' : 'pointer',
              bgcolor: step.operacional ? alpha('#10B981', 0.1) : 'transparent',
              color: step.operacional ? '#10B981' : '#6b7280',
              border: step.operacional
                ? '1px solid rgba(16, 185, 129, 0.2)'
                : '1px solid rgba(107, 114, 128, 0.2)',
              '&:hover': {
                bgcolor: step.operacional ? alpha('#10B981', 0.15) : alpha('#10B981', 0.05),
              },
            }}
          />

          <Chip
            label="Financeiro"
            clickable
            onClick={handleSelectFinanceiro}
            sx={{
              fontWeight: 600,
              cursor: disabled ? 'not-allowed' : 'pointer',
              bgcolor: step.financeiro ? alpha('#F59E0B', 0.1) : 'transparent',
              color: step.financeiro ? '#F59E0B' : '#6b7280',
              border: step.financeiro
                ? '1px solid rgba(245, 158, 11, 0.2)'
                : '1px solid rgba(107, 114, 128, 0.2)',
              '&:hover': {
                bgcolor: step.financeiro ? alpha('#F59E0B', 0.15) : alpha('#F59E0B', 0.05),
              },
            }}
          />
        </Stack>

        <Box
          {...attributes}
          {...listeners}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: '0 0 auto',
            cursor: disabled ? 'not-allowed' : 'grab',
            color: '#6b7280',
            ml: 1,
          }}
        >
          <IconButton
            size="small"
            disabled={!!disabled}
            sx={{
              color: '#6b7280',
              '&:hover': {
                color: '#E6C969',
                bgcolor: alpha('#E6C969', 0.08),
              },
            }}
          >
            <DragIndicatorIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
}