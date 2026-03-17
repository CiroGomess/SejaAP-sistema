'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Container,
    Fade,
    Typography,
    alpha,
} from '@mui/material';

import services from '@/services/service';

import DashHeader from '@/components/dash-cliente/DashHeader';
import ResumoCards from '@/components/dash-cliente/ResumoCards';
import ReceitaChart from '@/components/dash-cliente/ReceitaChart';
import AnaliseABC from '@/components/dash-cliente/AnaliseABC';
import TicketMedio from '@/components/dash-cliente/TicketMedio';
import AnaliseContabil from '@/components/dash-cliente/AnaliseContabil';
// import InsightsRapidos from '@/components/dash-cliente/InsightsRapidos';
import AppAlert, { AlertType } from '@/components/AppAlert';

const readEndpoint = '/dashcliente';

const GOLD_PRIMARY = '#E6C969';
const GOLD_DARK = '#C4A052';
const DARK_BG = '#fff';
const WHITE = '#FFFFFF';
const GRAY_MAIN = '#94A3B8';

const EAPLogoSmall = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="150" height="40" viewBox="0 0 172 54" fill="none">
        <path d="M16.1147 39.2606C13.6438 39.2606 11.4594 38.8309 9.56147 37.9714C7.69935 37.112 6.23115 35.9124 5.15685 34.3725C4.08255 32.8327 3.50959 31.1138 3.43797 29.2159H7.41287C7.59192 31.0422 8.39765 32.6536 9.83005 34.0502C11.2624 35.411 13.3573 36.0914 16.1147 36.0914C18.6572 36.0914 20.6626 35.4468 22.1308 34.1577C23.6348 32.8327 24.3868 31.1675 24.3868 29.1622C24.3868 27.5507 23.975 26.2616 23.1513 25.2947C22.3277 24.292 21.3071 23.5579 20.0896 23.0924C18.8721 22.5911 17.189 22.0539 15.0404 21.4809C12.5337 20.8006 10.5462 20.1381 9.07804 19.4935C7.60983 18.8489 6.35648 17.8462 5.31799 16.4855C4.2795 15.1247 3.76026 13.2805 3.76026 10.9528C3.76026 9.01908 4.2616 7.3002 5.26428 5.79618C6.26695 4.25635 7.68145 3.05672 9.50776 2.19728C11.3341 1.33784 13.4289 0.908122 15.7924 0.908122C19.266 0.908122 22.0591 1.76756 24.1719 3.48644C26.3205 5.16951 27.556 7.35391 27.8783 10.0397H23.7959C23.5453 8.49983 22.7037 7.13905 21.2713 5.95733C19.8389 4.73979 17.9052 4.13102 15.4701 4.13102C13.2141 4.13102 11.3341 4.73979 9.83005 5.95733C8.32603 7.13905 7.57402 8.76841 7.57402 10.8454C7.57402 12.421 7.98583 13.6923 8.80946 14.6591C9.63309 15.626 10.6537 16.3601 11.8712 16.8615C13.1246 17.3628 14.8076 17.8999 16.9204 18.4729C19.3555 19.1533 21.325 19.8337 22.8291 20.5141C24.3331 21.1587 25.6043 22.1613 26.6428 23.5221C27.6813 24.8829 28.2006 26.7092 28.2006 29.001C28.2006 30.7557 27.735 32.4209 26.804 33.9965C25.8729 35.5722 24.4942 36.8434 22.6679 37.8103C20.8416 38.7772 18.6572 39.2606 16.1147 39.2606ZM35.4663 4.39959V18.4192H49.7008V21.5347H35.4663V35.7691H51.3122V38.8846H31.7063V1.28413H51.3122V4.39959H35.4663ZM72.311 1.33784V29.753C72.311 32.6178 71.4337 34.9276 69.679 36.6823C67.9243 38.4011 65.5787 39.2606 62.6423 39.2606C59.5985 39.2606 57.1634 38.3474 55.3371 36.5211C53.5466 34.659 52.6513 32.1523 52.6513 29.001H56.4651C56.5009 31.0422 57.0022 32.7074 57.9691 33.9965C58.9718 35.2857 60.5295 35.9303 62.6423 35.9303C64.6477 35.9303 66.1338 35.3394 67.1007 34.1577C68.0675 32.9759 68.551 31.5077 68.551 29.753V1.33784H72.311ZM99.7606 29.9679H82.6792L79.4026 38.8846H75.4277L89.125 1.82127H93.3685L107.012 38.8846H103.037L99.7606 29.9679ZM98.6326 26.8524L91.2199 6.54819L83.8073 26.8524H98.6326Z" fill={GOLD_PRIMARY} />
        <path d="M137.78 39L135.739 32.8228H122.311L120.269 39H109.204L123.009 1.13094H135.148L148.899 39H137.78ZM133.107 24.7655L129.025 12.5185L124.996 24.7655H133.107Z" fill={GOLD_PRIMARY} />
        <path d="M151.177 17.8363H158.829C161.998 17.8363 163.287 16.2248 163.287 13.7539C163.287 11.2293 161.998 9.6179 158.829 9.6179H151.177V17.8363ZM170.568 13.7539C170.568 20.3609 166.002 26.2158 156.387 26.2158H151.177V39H148.899L135.148 1.13094H156.387C165.787 1.13094 170.568 6.44872 170.568 13.7539Z" fill={GOLD_PRIMARY} />
        <path d="M137.78 39L135.739 32.8228H122.311L120.269 39H109.204L123.009 1.13094H135.148L148.899 39H137.78ZM133.107 24.7655L129.025 12.5185L124.996 24.7655H133.107Z" fill="url(#paint0_linear_91_159)" />
        <path d="M171.346 0.908325H162.392C168.094 2.70836 170.053 4.85787 171.346 10.6416V0.908325Z" fill="url(#paint1_linear_91_159)" />
        <defs>
            <linearGradient id="paint0_linear_91_159" x1="123.502" y1="20.0655" x2="148.899" y2="20.0655" gradientUnits="userSpaceOnUse">
                <stop stopColor={GOLD_PRIMARY} />
                <stop offset="1" stopColor={GOLD_DARK} />
            </linearGradient>
            <linearGradient id="paint1_linear_91_159" x1="165.617" y1="5.77496" x2="171.346" y2="5.77496" gradientUnits="userSpaceOnUse">
                <stop stopColor={GOLD_PRIMARY} />
                <stop offset="1" stopColor={GOLD_DARK} />
            </linearGradient>
        </defs>
    </svg>
);

type SelectedClient = {
    id: string;
    code: string;
    name: string;
};

type DashApiResponse = {
    available_years?: number[];
    selected_year?: number;
    user_id?: string;
    cards?: {
        crescimento_anual?: string;
        faturamento_anterior?: string;
        faturamento_total?: string;
        produtos_servicos?: number;
        ticket_medio?: string;
        total_vendas?: number;
    };
    grafico_receita?: {
        crescimento_periodo?: string;
        media_mensal?: string;
        melhor_mes?: {
            mes: number;
            valor_total: string;
        } | null;
        pior_mes?: {
            mes: number;
            valor_total: string;
        } | null;
        receita_evolutiva?: Array<{
            mes: number;
            valor_total: string;
        }>;
    };
    curva_abc?: {
        faturamento_total?: string;
        classes?: {
            A?: {
                qtd_itens?: number;
                valor_total?: string;
                percentual_faturamento?: string;
                descricao?: string;
            };
            B?: {
                qtd_itens?: number;
                valor_total?: string;
                percentual_faturamento?: string;
                descricao?: string;
            };
            C?: {
                qtd_itens?: number;
                valor_total?: string;
                percentual_faturamento?: string;
                descricao?: string;
            };
        };
        grafico_donut?: Array<{
            classe: 'A' | 'B' | 'C';
            percentual: string;
            qtd_itens: number;
        }>;
    };
    ticket_medio_dashboard?: {
        media_top_5?: string;
        variacao_media_vs_ano_anterior?: string | null;
        top_5_produtos?: Array<{
            rank: number;
            nome_produto_ou_servico: string;
            ticket_medio: string;
            ticket_medio_anterior: string;
            variacao_percentual: string | null;
            qtd_atual: string;
            qtd_anterior: string;
            valor_atual: string;
            valor_anterior: string;
        }>;
        grafico_barras?: Array<{
            label: string;
            valor: string;
            variacao_percentual: string | null;
        }>;
    };
    resumo_contabil?: {
        receitas_totais?: string;
        despesas_totais?: string;
        resultado_liquido?: string;
    };
};

type ResumoData = {
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

type AnaliseABCData = {
    faturamentoTotal: number;
    classes: {
        A: {
            qtdItens: number;
            valorTotal: number;
            percentualFaturamento: number;
            descricao: string;
        };
        B: {
            qtdItens: number;
            valorTotal: number;
            percentualFaturamento: number;
            descricao: string;
        };
        C: {
            qtdItens: number;
            valorTotal: number;
            percentualFaturamento: number;
            descricao: string;
        };
    };
    graficoDonut: Array<{
        classe: 'A' | 'B' | 'C';
        valor: number;
        cor: string;
        label: string;
    }>;
};

type TicketMedioData = {
    mediaTop5: number;
    variacaoMediaVsAnoAnterior: number;
    top5Produtos: Array<{
        rank: number;
        produto: string;
        ticket: number;
        variacao: number | null;
    }>;
};

type AnaliseContabilData = {
    receitas: number;
    despesas: number;
    resultadoLiquido: number;
};

const meses = [
    '',
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
];

export default function DashClientePage() {
    const [loading, setLoading] = useState(true);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertSeverity, setAlertSeverity] = useState<AlertType>('info');

    const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [availableYears, setAvailableYears] = useState<number[]>([]);

    const [resumoData, setResumoData] = useState<ResumoData>({
        faturamentoTotal: 0,
        ticketMedio: 0,
        crescimentoAnual: 0,
        totalProdutos: 0,
        melhorMes: null,
        piorMes: null,
    });

    const [analiseABCData, setAnaliseABCData] = useState<AnaliseABCData>({
        faturamentoTotal: 0,
        classes: {
            A: {
                qtdItens: 0,
                valorTotal: 0,
                percentualFaturamento: 0,
                descricao: 'Maior relevância',
            },
            B: {
                qtdItens: 0,
                valorTotal: 0,
                percentualFaturamento: 0,
                descricao: 'Relevância intermediária',
            },
            C: {
                qtdItens: 0,
                valorTotal: 0,
                percentualFaturamento: 0,
                descricao: 'Menor relevância',
            },
        },
        graficoDonut: [],
    });

    const [ticketMedioData, setTicketMedioData] = useState<TicketMedioData>({
        mediaTop5: 0,
        variacaoMediaVsAnoAnterior: 0,
        top5Produtos: [],
    });

    const [analiseContabilData, setAnaliseContabilData] = useState<AnaliseContabilData>({
        receitas: 0,
        despesas: 0,
        resultadoLiquido: 0,
    });

    const showAlert = (message: string, severity: AlertType) => {
        setAlertMessage(message);
        setAlertSeverity(severity);
        setAlertOpen(true);
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const raw = localStorage.getItem('selectedClient');

        if (!raw) {
            setLoading(false);
            showAlert('Cliente não selecionado.', 'warning');
            return;
        }

        try {
            const client = JSON.parse(raw);

            if (!client?.id) {
                setLoading(false);
                showAlert('Cliente inválido.', 'error');
                return;
            }

            setSelectedClient({
                id: String(client.id).trim(),
                code: String(client.code || '').trim(),
                name: String(client.name || '').trim(),
            });
        } catch (error) {
            console.error('Erro ao ler selectedClient do localStorage:', error);
            setLoading(false);
            showAlert('Erro ao carregar cliente selecionado.', 'error');
        }
    }, []);

    const loadDashboard = useCallback(async () => {
        let safeUserId = String(selectedClient?.id || '').trim();

        if (!safeUserId) {
            try {
                const storedSelectedClient = localStorage.getItem('selectedClient');

                if (storedSelectedClient) {
                    const parsedClient = JSON.parse(storedSelectedClient);
                    safeUserId = String(parsedClient?.id || '').trim();
                }
            } catch (error) {
                console.error('Erro ao ler selectedClient do localStorage:', error);
            }
        }

        if (!safeUserId) {
            return;
        }

        setLoading(true);

        try {
            const params = new URLSearchParams({
                user_id: safeUserId,
                year: String(selectedYear),
            });

            const res = await services(`${readEndpoint}?${params.toString()}`, {
                method: 'GET',
            });

            if (!res.success) {
                const message =
                    res?.data?.error ||
                    res?.message ||
                    'Não foi possível carregar o dashboard.';

                showAlert(message, 'error');
                return;
            }

            const payload = (res.data || {}) as DashApiResponse;
            const cards = payload.cards || {};
            const grafico = payload.grafico_receita || {};
            const curvaAbc = payload.curva_abc || {};
            const curvaClasses = curvaAbc.classes || {};
            const ticketDashboard = payload.ticket_medio_dashboard || {};
            const resumoContabil = payload.resumo_contabil || {};

            setAvailableYears(Array.isArray(payload.available_years) ? payload.available_years : []);

            if (payload.selected_year) {
                setSelectedYear(payload.selected_year);
            }

            setResumoData({
                faturamentoTotal: Number(cards.faturamento_total || 0),
                ticketMedio: Number(cards.ticket_medio || 0),
                crescimentoAnual: Number(cards.crescimento_anual || 0),
                totalProdutos: Number(cards.produtos_servicos || 0),
                melhorMes: grafico.melhor_mes
                    ? {
                        mes: meses[grafico.melhor_mes.mes] || '',
                        valor: Number(grafico.melhor_mes.valor_total || 0),
                    }
                    : null,
                piorMes: grafico.pior_mes
                    ? {
                        mes: meses[grafico.pior_mes.mes] || '',
                        valor: Number(grafico.pior_mes.valor_total || 0),
                    }
                    : null,
            });

            setAnaliseABCData({
                faturamentoTotal: Number(curvaAbc.faturamento_total || 0),
                classes: {
                    A: {
                        qtdItens: Number(curvaClasses.A?.qtd_itens || 0),
                        valorTotal: Number(curvaClasses.A?.valor_total || 0),
                        percentualFaturamento: Number(curvaClasses.A?.percentual_faturamento || 0),
                        descricao: curvaClasses.A?.descricao || 'Maior relevância',
                    },
                    B: {
                        qtdItens: Number(curvaClasses.B?.qtd_itens || 0),
                        valorTotal: Number(curvaClasses.B?.valor_total || 0),
                        percentualFaturamento: Number(curvaClasses.B?.percentual_faturamento || 0),
                        descricao: curvaClasses.B?.descricao || 'Relevância intermediária',
                    },
                    C: {
                        qtdItens: Number(curvaClasses.C?.qtd_itens || 0),
                        valorTotal: Number(curvaClasses.C?.valor_total || 0),
                        percentualFaturamento: Number(curvaClasses.C?.percentual_faturamento || 0),
                        descricao: curvaClasses.C?.descricao || 'Menor relevância',
                    },
                },
                graficoDonut: [
                    {
                        classe: 'A',
                        valor: Number(curvaClasses.A?.percentual_faturamento || 0),
                        cor: '#10B981',
                        label: `${Number(curvaClasses.A?.percentual_faturamento || 0).toFixed(0)}% do faturamento`,
                    },
                    {
                        classe: 'B',
                        valor: Number(curvaClasses.B?.percentual_faturamento || 0),
                        cor: '#E6C969',
                        label: `${Number(curvaClasses.B?.percentual_faturamento || 0).toFixed(0)}% do faturamento`,
                    },
                    {
                        classe: 'C',
                        valor: Number(curvaClasses.C?.percentual_faturamento || 0),
                        cor: '#F59E0B',
                        label: `${Number(curvaClasses.C?.percentual_faturamento || 0).toFixed(0)}% do faturamento`,
                    },
                ],
            });

            setTicketMedioData({
                mediaTop5: Number(ticketDashboard.media_top_5 || 0),
                variacaoMediaVsAnoAnterior: Number(ticketDashboard.variacao_media_vs_ano_anterior || 0),
                top5Produtos: Array.isArray(ticketDashboard.top_5_produtos)
                    ? ticketDashboard.top_5_produtos.map((item) => ({
                        rank: Number(item.rank || 0),
                        produto: item.nome_produto_ou_servico || '-',
                        ticket: Number(item.ticket_medio || 0),
                        variacao:
                            item.variacao_percentual !== null && item.variacao_percentual !== undefined
                                ? Number(item.variacao_percentual)
                                : null,
                    }))
                    : [],
            });

            setAnaliseContabilData({
                receitas: Number(resumoContabil.receitas_totais || 0),
                despesas: Number(resumoContabil.despesas_totais || 0),
                resultadoLiquido: Number(resumoContabil.resultado_liquido || 0),
            });
        } catch (error) {
            console.error('Erro ao buscar dashboard:', error);
            showAlert('Erro ao buscar dados do dashboard.', 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedClient?.id, selectedYear, readEndpoint]);

    useEffect(() => {
        if (!selectedClient?.id) return;
        loadDashboard();
    }, [selectedClient?.id, loadDashboard]);

    const handleYearChange = (newYear: number) => {
        setSelectedYear(newYear);
    };

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: DARK_BG,
                    backgroundImage: `linear-gradient(180deg, ${alpha(GOLD_PRIMARY, 0.08)} 0%, transparent 55%)`,
                    px: 2,
                }}
            >
                <Fade in timeout={500}>
                    <Box sx={{ textAlign: 'center' }}>
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                            <EAPLogoSmall />
                        </Box>

                        <Typography variant="h6" sx={{ color: GRAY_MAIN }}>
                            Carregando dashboard...
                        </Typography>

                        <Typography
                            variant="caption"
                            sx={{ display: 'block', mt: 1.2, color: alpha(WHITE, 0.35) }}
                        >
                            Aguarde um instante, estamos preparando seus dados.
                        </Typography>
                    </Box>
                </Fade>
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh' }}>
            <DashHeader
                clientName={selectedClient?.name || 'Cliente'}
                clientCode={selectedClient?.code || '-'}
                period={String(selectedYear)}
                availableYears={availableYears}
                onYearChange={handleYearChange}
            />

            <Container maxWidth={false} sx={{ maxWidth: '95%', mx: 'auto', pb: 4 }}>
                <Fade in timeout={600}>
                    <Box>
                        <ResumoCards data={resumoData} />

                        <ReceitaChart
                            userId={selectedClient?.id || ''}
                            year={selectedYear}
                        />

                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                gap: 24,
                                flexWrap: 'wrap',
                                marginBottom: 24,
                            }}
                        >
                            <AnaliseABC data={analiseABCData} />
                            <TicketMedio data={ticketMedioData} />
                        </div>

                        <AnaliseContabil data={analiseContabilData} />
                        {/* <InsightsRapidos /> */}

                        <Box sx={{ mt: 4, textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                                Dados atualizados em tempo real • Última atualização:{' '}
                                {new Date().toLocaleDateString('pt-BR')}
                            </Typography>

                            {availableYears.length > 0 && (
                                <Typography
                                    variant="caption"
                                    sx={{ display: 'block', mt: 1, color: '#94A3B8' }}
                                >
                                    Anos disponíveis: {availableYears.sort((a, b) => b - a).join(' • ')}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Fade>
            </Container>

            <AppAlert
                open={alertOpen}
                message={alertMessage}
                severity={alertSeverity}
                onClose={() => setAlertOpen(false)}
            />
        </Box>
    );
}