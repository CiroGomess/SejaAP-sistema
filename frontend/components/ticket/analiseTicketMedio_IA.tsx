'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  Avatar,
  alpha,
  Zoom,
  Button,
  CircularProgress,
} from '@mui/material';

import {
  AutoAwesome as AutoAwesomeIcon,
  Psychology as PsychologyIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

import { useRouter } from 'next/navigation';
import AppAlert, { AlertType } from '@/components/AppAlert';
import services from '@/services/service';

// --- PALETA DE CORES PREMIUM ---
const GOLD_PRIMARY = '#E6C969';
const GOLD_DARK = '#C4A052';
const GOLD_LIGHT = '#F5E6B8';
const DARK_BG = '#0F172A';
const WHITE = '#FFFFFF';
const GRAY_MAIN = '#64748B';
const BORDER_LIGHT = 'rgba(100, 116, 139, 0.2)';
const TEXT_DARK = '#0F172A';

// --- TIPAGENS ---
type ApiResponse = {
  analises: any[];
  created_at_ref: string;
  user_id: number;
  summary?: {
    year?: number;
    year_a?: number;
    year_b?: number;
    customer_ipca?: string | null;
  };
};

// --- HELPER FUNCTIONS ---
function pickApiError(data: any): string {
  if (!data) return 'Erro inesperado.';
  if (typeof data === 'string') return data;
  if (typeof data.detail === 'string') return data.detail;
  return 'Falha ao processar a requisição.';
}

// --- PROPS ---
type Props = {
  userId: number;
  year: number;
  brand?: string;
};

export default function AnaliseTicketMedio_IA(props: Props) {
  const router = useRouter();
  const brand = props.brand ?? GOLD_PRIMARY;
  const readEndpoint = '/ticket-medio/insights/saved/latest';
  const generateEndpoint = '/ticket-medio/insights';
  const listPageUrl = '/ticket/listar-analise';

  const [loading, setLoading] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [hasAnalises, setHasAnalises] = useState<boolean>(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<AlertType>('info');

  const showAlert = (message: string, severity: AlertType) => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  const load = async () => {
    if (!props.userId || !props.year) return;

    setLoading(true);
    const params = new URLSearchParams({
      user_id: String(props.userId),
      year: String(props.year),
    });

    const res = await services(`${readEndpoint}?${params.toString()}`, { method: 'GET' });

    if (res.success) {
      setHasAnalises(res.data?.analises?.length > 0);
    }
    setLoading(false);
  };

  const handleGenerate = async () => {
    if (!props.userId || !props.year) return;

    setGenerating(true);
    try {
      const params = new URLSearchParams({
        user_id: String(props.userId),
        year: String(props.year),
      });

      const res = await services(`${generateEndpoint}?${params.toString()}`, { method: 'GET' });

      if (res.success) {
        setHasAnalises(true);
        showAlert(`Análise gerada com sucesso!`, 'success');
      } else {
        showAlert(pickApiError(res.data), 'error');
      }
    } catch (error) {
      showAlert('Erro de conexão.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewList = () => {
    router.push(listPageUrl);
  };

  useEffect(() => {
    load();
  }, [props.userId, props.year]);

  return (
    <>
      <Card
        elevation={0}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 4,
          border: `1px solid ${BORDER_LIGHT}`,
          bgcolor: WHITE,
          overflow: 'hidden',
          boxShadow: `0 20px 40px ${alpha(DARK_BG, 0.05)}`,
          width: '100%',
        }}
      >
        <Box sx={{ height: 6, background: `linear-gradient(90deg, ${brand}, ${GOLD_LIGHT})` }} />

        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  sx={{
                    bgcolor: alpha(brand, 0.1),
                    color: brand,
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                  }}
                >
                  <PsychologyIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: TEXT_DARK }}>
                    Insights com IA
                  </Typography>
                  <Typography variant="body2" sx={{ color: GRAY_MAIN }}>
                    Ticket Médio • {props.year}
                  </Typography>
                </Box>
              </Stack>
            </Stack>

            <Divider sx={{ borderColor: BORDER_LIGHT }} />

            {/* Actions */}
            <Stack direction="row" spacing={1.5} justifyContent="flex-end" alignItems="center">
              <Button
                variant="contained"
                onClick={handleGenerate}
                disabled={loading || generating}
                startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
                size="small"
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  bgcolor: brand,
                  color: TEXT_DARK,
                  '&:hover': { bgcolor: GOLD_DARK },
                }}
              >
                {generating ? 'Gerando' : 'Gerar'}
              </Button>

              <Tooltip title="Visualizar análises" arrow TransitionComponent={Zoom}>
                <span>
                  <IconButton
                    onClick={handleViewList}
                    disabled={loading || !hasAnalises}
                    sx={{
                      border: `1px solid ${BORDER_LIGHT}`,
                      borderRadius: 2,
                      width: 36,
                      height: 36,
                      color: hasAnalises ? brand : GRAY_MAIN,
                      '&:hover': hasAnalises ? { borderColor: brand } : {},
                    }}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>

            {/* Status sutil */}
            {hasAnalises && (
              <Typography variant="caption" sx={{ color: GRAY_MAIN, textAlign: 'center', opacity: 0.7 }}>
                Análises disponíveis para visualização
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      <AppAlert open={alertOpen} message={alertMessage} severity={alertSeverity} onClose={() => setAlertOpen(false)} />
    </>
  );
}