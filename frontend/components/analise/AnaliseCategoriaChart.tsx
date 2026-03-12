'use client';

import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Avatar,
  alpha,
  Paper,
  Grid,
  Chip,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Category as CategoryIcon,
} from '@mui/icons-material';

// --- PALETA DE CORES ---
const GOLD_PRIMARY = '#E6C969';
const DARK_BG = '#0F172A';
const WHITE = '#FFFFFF';
const GRAY_MAIN = '#64748B';
const GRAY_LIGHT = '#94A3B8';
const BORDER_LIGHT = 'rgba(100, 116, 139, 0.2)';
const TEXT_DARK = '#0F172A';
const GOLD_LIGHT = '#F5E6B8';

const STATUS_COLORS = {
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  purple: '#8B5CF6',
};

const PIE_COLORS = [
  GOLD_PRIMARY,
  STATUS_COLORS.success,
  STATUS_COLORS.info,
  STATUS_COLORS.purple,
  STATUS_COLORS.warning,
  '#EC4899',
  '#06B6D4',
];

interface AnaliseCategoriaChartProps {
  data: Array<{
    categoria: string;
    custo: number;
    margem_bruta: number;
    count: number;
    percentual_margem?: number;
  }>;
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

export default function AnaliseCategoriaChart({ data, loading }: AnaliseCategoriaChartProps) {
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      name: item.categoria,
      value: item.margem_bruta,
      count: item.count,
      custo: item.custo,
      percentual_margem: item.percentual_margem ?? 0,
      color: PIE_COLORS[index % PIE_COLORS.length],
    }));
  }, [data]);

  const totalMargem = useMemo(() => {
    return data.reduce((acc, item) => acc + item.margem_bruta, 0);
  }, [data]);

  const totalCusto = useMemo(() => {
    return data.reduce((acc, item) => acc + item.custo, 0);
  }, [data]);

  const totalItens = useMemo(() => {
    return data.reduce((acc, item) => acc + item.count, 0);
  }, [data]);

  if (loading || data.length === 0) {
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
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
          <Avatar
            sx={{
              bgcolor: alpha(GOLD_PRIMARY, 0.1),
              color: GOLD_PRIMARY,
              width: 40,
              height: 40,
            }}
          >
            <CategoryIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK }}>
              Distribuição por Categoria
            </Typography>
            <Typography variant="body2" sx={{ color: GRAY_MAIN }}>
              {data.length} categorias • Total: {moneyBR(totalMargem)}
            </Typography>
          </Box>
        </Stack>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => moneyBR(value)}
                    contentStyle={{
                      backgroundColor: DARK_BG,
                      border: `1px solid ${BORDER_LIGHT}`,
                      borderRadius: 8,
                      color: WHITE,
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={1.5}>
              {data.map((item, index) => {
                const percent =
                  item.percentual_margem !== undefined
                    ? item.percentual_margem
                    : totalMargem > 0
                      ? (item.margem_bruta / totalMargem) * 100
                      : 0;

                const cor = item.margem_bruta > 0 ? STATUS_COLORS.success : STATUS_COLORS.error;

                return (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: `1px solid ${BORDER_LIGHT}`,
                      '&:hover': { borderColor: GOLD_PRIMARY },
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: TEXT_DARK }}>
                          {item.categoria}
                        </Typography>
                        <Typography variant="caption" sx={{ color: GRAY_LIGHT }}>
                          {item.count} {item.count === 1 ? 'item' : 'itens'} • Custo: {moneyBR(item.custo)}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" sx={{ fontWeight: 700, color: cor }}>
                          {moneyBR(item.margem_bruta)}
                        </Typography>
                        <Chip
                          label={`${percent.toFixed(1)}%`}
                          size="small"
                          sx={{
                            bgcolor: alpha(cor, 0.1),
                            color: cor,
                            fontWeight: 600,
                            height: 20,
                          }}
                        />
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(GOLD_PRIMARY, 0.03),
                border: `1px solid ${alpha(GOLD_PRIMARY, 0.15)}`,
              }}
            >
              <Typography variant="caption" sx={{ color: GRAY_MAIN }}>
                Margem Total
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                {moneyBR(totalMargem)}
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(GRAY_MAIN, 0.03),
                border: `1px solid ${BORDER_LIGHT}`,
              }}
            >
              <Typography variant="caption" sx={{ color: GRAY_MAIN }}>
                Custo Total
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                {moneyBR(totalCusto)}
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(STATUS_COLORS.info, 0.03),
                border: `1px solid ${alpha(STATUS_COLORS.info, 0.15)}`,
              }}
            >
              <Typography variant="caption" sx={{ color: GRAY_MAIN }}>
                Total Itens
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                {totalItens}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}