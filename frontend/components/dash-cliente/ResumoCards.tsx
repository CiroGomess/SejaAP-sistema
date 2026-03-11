'use client';

import {
    Grid,
    Paper,
    Stack,
    Avatar,
    Typography,
    alpha,
    Box 
} from '@mui/material';
import {
    AttachMoney as AttachMoneyIcon,
    TrendingUp as TrendingUpIcon,
    Timeline as TimelineIcon,
    Percent as PercentIcon,
    Category as CategoryIcon,
    Inventory as InventoryIcon,
} from '@mui/icons-material';

interface ResumoCardsProps {
    data: {
        faturamentoTotal: number;
        ticketMedio: number;
        margemMedia: number;
        totalProdutos: number;
        crescimentoAnual: number;
        categoriasAtivas: number;
    };
}

function money(value: number): string {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function ResumoCards({ data }: ResumoCardsProps) {
    const cards = [
        {
            titulo: 'Faturamento Total',
            valor: money(data.faturamentoTotal),
            icone: <AttachMoneyIcon />,
            cor: '#10B981',
            subtitulo: 'Últimos 12 meses',
        },
        {
            titulo: 'Ticket Médio',
            valor: money(data.ticketMedio),
            icone: <TimelineIcon />,
            cor: '#3B82F6',
            subtitulo: 'Valor médio por venda',
        },
        {
            titulo: 'Margem Média',
            valor: `${data.margemMedia.toFixed(1)}%`,
            icone: <PercentIcon />,
            cor: '#8B5CF6',
            subtitulo: 'Rentabilidade',
        },
        {
            titulo: 'Crescimento Anual',
            valor: `${data.crescimentoAnual > 0 ? '+' : ''}${data.crescimentoAnual.toFixed(1)}%`,
            icone: <TrendingUpIcon />,
            cor: data.crescimentoAnual >= 0 ? '#10B981' : '#EF4444',
            subtitulo: 'Comparado ao ano anterior',
        },
        {
            titulo: 'Produtos/Serviços',
            valor: data.totalProdutos.toString(),
            icone: <InventoryIcon />,
            cor: '#F59E0B',
            subtitulo: 'Itens ativos',
        },
        {
            titulo: 'Categorias',
            valor: data.categoriasAtivas.toString(),
            icone: <CategoryIcon />,
            cor: '#E6C969',
            subtitulo: 'Em análise',
        },
    ];

    return (
        <Grid container spacing={2} sx={{ mb: 3 }}>
            {cards.map((card, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: 3,
                            bgcolor: alpha(card.cor, 0.04),
                            border: `1px solid ${alpha(card.cor, 0.15)}`,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: `0 8px 16px ${alpha(card.cor, 0.1)}`,
                            },
                        }}
                    >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ bgcolor: alpha(card.cor, 0.1), color: card.cor, width: 48, height: 48 }}>
                                {card.icone}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
                                    {card.titulo}
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                    {card.valor}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                                    {card.subtitulo}
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>
            ))}
        </Grid>
    );
}