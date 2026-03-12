'use client';

import React, { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Avatar,
  alpha,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  ShowChart as ShowChartIcon,
} from '@mui/icons-material';

// --- PALETA DE CORES ---
const GOLD_PRIMARY = '#E6C969';
const GOLD_LIGHT = '#F5E6B8';
const DARK_BG = '#0F172A';
const WHITE = '#FFFFFF';
const GRAY_MAIN = '#64748B';
const BORDER_LIGHT = 'rgba(100, 116, 139, 0.2)';
const TEXT_DARK = '#0F172A';

const STATUS_COLORS = {
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  purple: '#8B5CF6',
};

type ChartItem = {
  id: number;
  produto_ou_servico: string;
  margem_bruta: number;
  custo: number;
};

interface AnaliseMargemChartProps {
  dataMargem: ChartItem[];
  dataCusto: ChartItem[];
  loading?: boolean;
}

function moneyBR(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function AnaliseMargemChart({
  dataMargem,
  dataCusto,
  loading,
}: AnaliseMargemChartProps) {
  const [orderBy, setOrderBy] = useState<'margem' | 'custo'>('margem');

  const sourceData = useMemo(() => {
    return orderBy === 'margem' ? dataMargem : dataCusto;
  }, [orderBy, dataMargem, dataCusto]);

  const chartData = useMemo(() => {
    return sourceData.map((item) => ({
      id: item.id,
      name:
        item.produto_ou_servico.length > 18
          ? `${item.produto_ou_servico.substring(0, 18)}...`
          : item.produto_ou_servico,
      nomeCompleto: item.produto_ou_servico,
      margem: item.margem_bruta,
      custo: item.custo,
    }));
  }, [sourceData]);

  const totalItems = useMemo(() => {
    return Math.max(dataMargem.length, dataCusto.length);
  }, [dataMargem.length, dataCusto.length]);

  const getBarColor = (value: number) => {
    if (value > 10000) return STATUS_COLORS.success;
    if (value > 5000) return GOLD_PRIMARY;
    if (value > 1000) return STATUS_COLORS.warning;
    return STATUS_COLORS.error;
  };

  if (loading || (dataMargem.length === 0 && dataCusto.length === 0)) {
    return (
      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          border: `1px solid ${BORDER_LIGHT}`,
          bgcolor: WHITE,
          p: 3,
        }}
      >
        <Typography sx={{ color: GRAY_MAIN, textAlign: 'center' }}>
          {loading ? 'Carregando dados...' : 'Nenhum dado disponível'}
        </Typography>
      </Card>
    );
  }

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: `1px solid ${BORDER_LIGHT}`,
        bgcolor: WHITE,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ height: 6, background: `linear-gradient(90deg, ${GOLD_PRIMARY}, ${GOLD_LIGHT})` }} />

      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              sx={{
                bgcolor: alpha(GOLD_PRIMARY, 0.1),
                color: GOLD_PRIMARY,
                width: 40,
                height: 40,
              }}
            >
              <BarChartIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                {orderBy === 'margem' ? 'Top 10 por Margem' : 'Top 10 por Custo'}
              </Typography>
              <Typography variant="body2" sx={{ color: GRAY_MAIN }}>
                {totalItems} produtos/serviços analisados
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1}>
            <ToggleButtonGroup
              size="small"
              value={orderBy}
              exclusive
              onChange={(_, value) => {
                if (value) setOrderBy(value);
              }}
              sx={{
                '& .MuiToggleButton-root': {
                  borderColor: BORDER_LIGHT,
                  color: GRAY_MAIN,
                  '&.Mui-selected': {
                    bgcolor: alpha(GOLD_PRIMARY, 0.1),
                    color: GOLD_PRIMARY,
                    borderColor: GOLD_PRIMARY,
                  },
                },
              }}
            >
              <ToggleButton value="margem">
                <TrendingUpIcon fontSize="small" />
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  Margem
                </Typography>
              </ToggleButton>

              <ToggleButton value="custo">
                <ShowChartIcon fontSize="small" />
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  Custo
                </Typography>
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>

        <Box sx={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 10, left: 90, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={alpha(GRAY_MAIN, 0.1)} horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v) => moneyBR(Number(v)).replace('R$', '').trim()}
                stroke={GRAY_MAIN}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={110}
                stroke={GRAY_MAIN}
              />
              <Tooltip
                formatter={(value: number) => moneyBR(value)}
                labelFormatter={(_, payload) => {
                  const item = payload && payload[0] && payload[0].payload;
                  return `Produto: ${item?.nomeCompleto || '-'}`;
                }}
                contentStyle={{
                  backgroundColor: DARK_BG,
                  border: `1px solid ${BORDER_LIGHT}`,
                  borderRadius: 8,
                  color: WHITE,
                }}
              />
              <Bar
                dataKey={orderBy === 'margem' ? 'margem' : 'custo'}
                radius={[0, 4, 4, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(orderBy === 'margem' ? entry.margem : entry.custo)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>

        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2, flexWrap: 'wrap' }}>
          <Chip
            label="> R$ 10k"
            size="small"
            sx={{ bgcolor: alpha(STATUS_COLORS.success, 0.1), color: STATUS_COLORS.success }}
          />
          <Chip
            label="R$ 5k - 10k"
            size="small"
            sx={{ bgcolor: alpha(GOLD_PRIMARY, 0.1), color: GOLD_PRIMARY }}
          />
          <Chip
            label="R$ 1k - 5k"
            size="small"
            sx={{ bgcolor: alpha(STATUS_COLORS.warning, 0.1), color: STATUS_COLORS.warning }}
          />
          <Chip
            label="< R$ 1k"
            size="small"
            sx={{ bgcolor: alpha(STATUS_COLORS.error, 0.1), color: STATUS_COLORS.error }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}