'use client';

import { useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Paper,
  FormControlLabel,
  Switch,
  Fade,
} from '@mui/material';

import {

  Psychology as PsychologyIcon,
  Slideshow as SlideshowIcon,
  Settings as SettingsIcon,

  ColorLens as ColorLensIcon,

  Close as CloseIcon,
  Tune as TuneIcon,
} from '@mui/icons-material';

import services from '@/services/service';
import AppAlert, { AlertType } from '@/components/AppAlert';

// --- PALETA DE CORES PREMIUM ---
const GOLD_PRIMARY = '#E6C969';
const GOLD_DARK = '#C4A052';
const GOLD_LIGHT = '#F5E6B8';
const DARK_BG = '#0F172A';
const WHITE = '#FFFFFF';
const GRAY_MAIN = '#64748B';
const BORDER_LIGHT = 'rgba(100, 116, 139, 0.2)';
const TEXT_DARK = '#0F172A';

// Cores de status
const STATUS_COLORS = {
  success: '#10B981',
  error: '#EF4444',
};

interface Props {
  userId: string;
  brand?: string;
  type?: 'produto' | 'clientes';
}

type GamaConfig = {
  themeId: string;
  numCards: number;
  language: string;
  tone: string;
  imageStyle: string;
  includeCharts: boolean;
  detailedAnalysis: boolean;
};

export default function GamaPresentationGenerator({ userId, brand = GOLD_PRIMARY, type = 'produto' }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<AlertType>('info');

  const [config, setConfig] = useState<GamaConfig>({
    themeId: 'Oasis',
    numCards: 10,
    language: 'pt-br',
    tone: 'executive',
    imageStyle: 'minimal, clean',
    includeCharts: true,
    detailedAnalysis: true,
  });

  const contextTitle = type === 'clientes' ? 'Carteira de Clientes' : 'Curva ABC (Produtos)';

  const showAlert = (message: string, severity: AlertType) => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  const handleGenerate = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const endpoint = `/gama/presentation/from-latest?user_id=${userId}&type=${type}`;
      
      const payload = {
        themeId: config.themeId,
        exportAs: "pptx",
        numCards: config.numCards,
        cardSplit: "inputTextBreaks",
        additionalInstructions: `Crie uma apresentação para diretoria baseada nos dados. 
          ${config.detailedAnalysis ? 'Inclua análise detalhada e insights estratégicos.' : 'Seja conciso e direto.'}
          ${config.includeCharts ? 'Inclua gráficos ilustrativos.' : ''}`,
        textOptions: { 
          language: config.language, 
          tone: config.tone, 
          amount: config.detailedAnalysis ? "detailed" : "concise" 
        },
        imageOptions: { source: "aiGenerated", style: config.imageStyle }
      };

      const response = await services(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.success || response.status === 200) {
        const result = response.data || response;
        if (result.gamma_link) {
          window.open(result.gamma_link, '_blank');
          showAlert('Apresentação gerada com sucesso!', 'success');
        } else {
          setError('Link da apresentação não encontrado.');
        }
      } else {
        const msg = response.message || response.error || 'Erro ao gerar apresentação.';
        setError(msg);
      }
    } catch (err: any) {
      setError(err.message || 'Falha de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (field: keyof GamaConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

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
                    Gerar Apresentação
                  </Typography>
                  <Typography variant="body2" sx={{ color: GRAY_MAIN }}>
                    {contextTitle}
                  </Typography>
                </Box>
              </Stack>

              <Tooltip title="Configurações da apresentação" arrow TransitionComponent={Zoom}>
                <IconButton
                  onClick={() => setConfigOpen(true)}
                  sx={{
                    border: `1px solid ${BORDER_LIGHT}`,
                    borderRadius: 2,
                    width: 36,
                    height: 36,
                    color: GRAY_MAIN,
                    '&:hover': { borderColor: brand, color: brand, bgcolor: alpha(brand, 0.05) },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <SettingsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>

            <Divider sx={{ borderColor: BORDER_LIGHT }} />

            {/* Mensagem de erro */}
            {error && (
              <Fade in timeout={300}>
                <Typography variant="caption" sx={{ color: STATUS_COLORS.error, textAlign: 'center', display: 'block' }}>
                  {error}
                </Typography>
              </Fade>
            )}

            {/* Actions */}
            <Stack direction="row" spacing={1.5} justifyContent="flex-end" alignItems="center">
              <Button
                variant="contained"
                onClick={handleGenerate}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SlideshowIcon />}
                size="medium"
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
                {loading ? 'Gerando...' : 'Gerar Apresentação'}
              </Button>

              
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* MODAL DE CONFIGURAÇÕES */}
      <Dialog
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        fullWidth
        maxWidth="sm"
        TransitionComponent={Fade}
        transitionDuration={400}
        PaperProps={{
          sx: {
            bgcolor: WHITE,
            borderRadius: 4,
            overflow: 'hidden',
            border: `1px solid ${alpha(brand, 0.1)}`,
            boxShadow: `0 32px 64px ${alpha(DARK_BG, 0.2)}`,
          },
        }}
      >
        <Box sx={{ height: 6, background: `linear-gradient(90deg, ${brand}, ${GOLD_LIGHT})` }} />

        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{ px: 3, py: 2.5, bgcolor: WHITE }}>
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
                  <TuneIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: TEXT_DARK }}>
                    Configurações da Apresentação
                  </Typography>
                  <Typography variant="caption" sx={{ color: GRAY_MAIN }}>
                    Personalize como a IA irá gerar os slides
                  </Typography>
                </Box>
              </Stack>

              <IconButton
                onClick={() => setConfigOpen(false)}
                sx={{
                  border: `1px solid ${BORDER_LIGHT}`,
                  borderRadius: 2,
                  '&:hover': { borderColor: brand, color: brand },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>
          <Divider sx={{ borderColor: BORDER_LIGHT }} />
        </DialogTitle>

        <DialogContent sx={{ bgcolor: WHITE, p: 3 }}>
          <Stack spacing={3}>
            {/* Seção 1: Conteúdo */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: alpha(GRAY_MAIN, 0.02),
                borderRadius: 3,
                border: `1px solid ${BORDER_LIGHT}`,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: TEXT_DARK, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SettingsIcon sx={{ fontSize: 18, color: brand }} />
                Configurações de Conteúdo
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Tema"
                    value={config.themeId}
                    onChange={(e) => handleConfigChange('themeId', e.target.value)}
                    disabled={loading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: WHITE,
                        '& fieldset': { borderColor: BORDER_LIGHT },
                        '&:hover fieldset': { borderColor: GRAY_MAIN },
                        '&.Mui-focused fieldset': { borderColor: brand },
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Número de Cards"
                    value={config.numCards}
                    onChange={(e) => handleConfigChange('numCards', Number(e.target.value))}
                    disabled={loading}
                    InputProps={{ inputProps: { min: 5, max: 20 } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: WHITE,
                        '& fieldset': { borderColor: BORDER_LIGHT },
                        '&:hover fieldset': { borderColor: GRAY_MAIN },
                        '&.Mui-focused fieldset': { borderColor: brand },
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.detailedAnalysis}
                      onChange={(e) => handleConfigChange('detailedAnalysis', e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: brand,
                          '&:hover': { backgroundColor: alpha(brand, 0.1) },
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: brand,
                        },
                      }}
                    />
                  }
                  label="Análise detalhada"
                />
              </Box>
            </Paper>

            {/* Seção 2: Estilo e Idioma */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: alpha(GRAY_MAIN, 0.02),
                borderRadius: 3,
                border: `1px solid ${BORDER_LIGHT}`,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: TEXT_DARK, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ColorLensIcon sx={{ fontSize: 18, color: brand }} />
                Estilo e Idioma
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Idioma"
                    value={config.language}
                    onChange={(e) => handleConfigChange('language', e.target.value)}
                    disabled={loading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: WHITE,
                        '& fieldset': { borderColor: BORDER_LIGHT },
                        '&:hover fieldset': { borderColor: GRAY_MAIN },
                        '&.Mui-focused fieldset': { borderColor: brand },
                      },
                    }}
                  >
                    <MenuItem value="pt-br">🇧🇷 Português</MenuItem>
                    <MenuItem value="en">🇺🇸 Inglês</MenuItem>
                    <MenuItem value="es">🇪🇸 Espanhol</MenuItem>
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Tom da Apresentação"
                    value={config.tone}
                    onChange={(e) => handleConfigChange('tone', e.target.value)}
                    disabled={loading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: WHITE,
                        '& fieldset': { borderColor: BORDER_LIGHT },
                        '&:hover fieldset': { borderColor: GRAY_MAIN },
                        '&.Mui-focused fieldset': { borderColor: brand },
                      },
                    }}
                  >
                    <MenuItem value="executive">📊 Executivo</MenuItem>
                    <MenuItem value="creative">💡 Criativo</MenuItem>
                    <MenuItem value="technical">🔧 Técnico</MenuItem>
                    <MenuItem value="persuasive">🎯 Persuasivo</MenuItem>
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Estilo das Imagens"
                    value={config.imageStyle}
                    onChange={(e) => handleConfigChange('imageStyle', e.target.value)}
                    disabled={loading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: WHITE,
                        '& fieldset': { borderColor: BORDER_LIGHT },
                        '&:hover fieldset': { borderColor: GRAY_MAIN },
                        '&.Mui-focused fieldset': { borderColor: brand },
                      },
                    }}
                  >
                    <MenuItem value="minimal, clean">✨ Minimalista</MenuItem>
                    <MenuItem value="modern, bold">🎨 Moderno</MenuItem>
                    <MenuItem value="corporate, formal">🏢 Corporativo</MenuItem>
                    <MenuItem value="infographic, data-driven">📈 Infográfico</MenuItem>
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.includeCharts}
                        onChange={(e) => handleConfigChange('includeCharts', e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: brand,
                            '&:hover': { backgroundColor: alpha(brand, 0.1) },
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: brand,
                          },
                        }}
                      />
                    }
                    label="Incluir gráficos ilustrativos"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Stack>
        </DialogContent>

        <Divider sx={{ borderColor: BORDER_LIGHT }} />

        <DialogActions sx={{ px: 3, py: 2, bgcolor: WHITE }}>
          <Button
            onClick={() => setConfigOpen(false)}
            variant="outlined"
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: 2,
              px: 3,
              borderColor: BORDER_LIGHT,
              color: GRAY_MAIN,
              '&:hover': { borderColor: brand, color: brand },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => setConfigOpen(false)}
            variant="contained"
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: 2,
              px: 4,
              bgcolor: brand,
              color: TEXT_DARK,
              '&:hover': { bgcolor: GOLD_DARK },
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <AppAlert open={alertOpen} message={alertMessage} severity={alertSeverity} onClose={() => setAlertOpen(false)} />
    </>
  );
}