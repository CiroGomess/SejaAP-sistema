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
    Inventory as InventoryIcon,
    EmojiEvents as EmojiEventsIcon,
    TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';

interface ResumoCardsProps {
    data: {
        faturamentoTotal: number;
        ticketMedio: number;
        crescimentoAnual: number;
        totalProdutos: number;
        melhorMes: {
            mes: string;
            valor: number;
        } | null;
        piorMes: {
            mes: string;
            valor: number;
        } | null;
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
            subtitulo: 'Total faturado no período',
        },
        {
            titulo: 'Ticket Médio',
            valor: money(data.ticketMedio),
            icone: <TimelineIcon />,
            cor: '#3B82F6',
            subtitulo: 'Valor médio por venda',
        },
        {
            titulo: 'Crescimento Anual',
            valor: `${data.crescimentoAnual > 0 ? '+' : ''}${data.crescimentoAnual.toFixed(2)}%`,
            icone: <TrendingUpIcon />,
            cor: data.crescimentoAnual >= 0 ? '#10B981' : '#EF4444',
            subtitulo: 'Comparado ao ano anterior',
        },
        {
            titulo: 'Produtos/Serviços',
            valor: data.totalProdutos.toString(),
            icone: <InventoryIcon />,
            cor: '#F59E0B',
            subtitulo: 'Itens vendidos',
        },
        {
            titulo: 'Melhor Mês',
            valor: data.melhorMes ? data.melhorMes.mes : '-',
            icone: <EmojiEventsIcon />,
            cor: '#10B981',
            subtitulo: data.melhorMes ? money(data.melhorMes.valor) : 'Sem dados',
        },
        {
            titulo: 'Pior Mês',
            valor: data.piorMes ? data.piorMes.mes : '-',
            icone: <TrendingDownIcon />,
            cor: '#F59E0B',
            subtitulo: data.piorMes ? money(data.piorMes.valor) : 'Sem dados',
        }
    ];

    return (
        <Grid container spacing={2} sx={{ mb: 4 }}>
            {cards.map((card, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            height: '100%',
                            minHeight: 80,
                            borderRadius: 3,
                            display: 'flex',
                            alignItems: 'center',
                            bgcolor: alpha(card.cor, 0.04),
                            border: `1px solid ${alpha(card.cor, 0.15)}`,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: `0 8px 16px ${alpha(card.cor, 0.12)}`,
                            },
                        }}
                    >
                        <Stack 
                            direction="row" 
                            spacing={2} 
                            alignItems="center" 
                            sx={{ 
                                width: '100%',
                                height: '100%'
                            }}
                        >
                            <Avatar
                                sx={{
                                    bgcolor: alpha(card.cor, 0.12),
                                    color: card.cor,
                                    width: 40,
                                    height: 40,
                                    flexShrink: 0,
                                }}
                            >
                                {card.icone}
                            </Avatar>

                            <Box sx={{ 
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 2,
                                minWidth: 0,
                                height: '100%'
                            }}>
                                <Box sx={{ 
                                    minWidth: 0,
                                    flex: 1
                                }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: '#64748B',
                                            fontWeight: 500,
                                            letterSpacing: 0.2,
                                            mb: 0.3
                                        }}
                                    >
                                        {card.titulo}
                                    </Typography>

                                    <Typography
                                        variant="body1"
                                        sx={{
                                            fontWeight: 600,
                                            color: '#0F172A',
                                            lineHeight: 1.2,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {card.valor}
                                    </Typography>
                                </Box>

                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: '#94A3B8',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        textAlign: 'right',
                                        minWidth: 80,
                                        maxWidth: 120
                                    }}
                                >
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