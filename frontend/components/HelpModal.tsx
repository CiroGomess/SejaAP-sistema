'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  Typography,
  Avatar,
  alpha,
  IconButton,
  Button,
  Divider,
  Chip,
  Fade,
  Zoom,
  Paper,
  Grid
} from '@mui/material';
import {
  Close as CloseIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  AccessTime as AccessTimeIcon,
  Phone as PhoneIcon,
  CheckCircle as CheckCircleIcon,
  Help as HelpIcon,
} from '@mui/icons-material';

// --- PALETA DE CORES ---
const GOLD_PRIMARY = '#E6C969';
const GOLD_DARK = '#C4A052';
const GOLD_LIGHT = '#F5E6B8';
const DARK_BG = '#11192B'; // Fundo escuro principal
const WHITE = '#FFFFFF';
const GRAY_MAIN = '#94A3B8';

// Cores de status
const STATUS_COLORS = {
  success: '#10B981',
  info: '#3B82F6',
};

// Logo da empresa (ajustada para fundo escuro)
const EAPLogoSmall = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="150" height="40" viewBox="0 0 172 54" fill="none">
    <path d="M16.1147 39.2606C13.6438 39.2606 11.4594 38.8309 9.56147 37.9714C7.69935 37.112 6.23115 35.9124 5.15685 34.3725C4.08255 32.8327 3.50959 31.1138 3.43797 29.2159H7.41287C7.59192 31.0422 8.39765 32.6536 9.83005 34.0502C11.2624 35.411 13.3573 36.0914 16.1147 36.0914C18.6572 36.0914 20.6626 35.4468 22.1308 34.1577C23.6348 32.8327 24.3868 31.1675 24.3868 29.1622C24.3868 27.5507 23.975 26.2616 23.1513 25.2947C22.3277 24.292 21.3071 23.5579 20.0896 23.0924C18.8721 22.5911 17.189 22.0539 15.0404 21.4809C12.5337 20.8006 10.5462 20.1381 9.07804 19.4935C7.60983 18.8489 6.35648 17.8462 5.31799 16.4855C4.2795 15.1247 3.76026 13.2805 3.76026 10.9528C3.76026 9.01908 4.2616 7.3002 5.26428 5.79618C6.26695 4.25635 7.68145 3.05672 9.50776 2.19728C11.3341 1.33784 13.4289 0.908122 15.7924 0.908122C19.266 0.908122 22.0591 1.76756 24.1719 3.48644C26.3205 5.16951 27.556 7.35391 27.8783 10.0397H23.7959C23.5453 8.49983 22.7037 7.13905 21.2713 5.95733C19.8389 4.73979 17.9052 4.13102 15.4701 4.13102C13.2141 4.13102 11.3341 4.73979 9.83005 5.95733C8.32603 7.13905 7.57402 8.76841 7.57402 10.8454C7.57402 12.421 7.98583 13.6923 8.80946 14.6591C9.63309 15.626 10.6537 16.3601 11.8712 16.8615C13.1246 17.3628 14.8076 17.8999 16.9204 18.4729C19.3555 19.1533 21.325 19.8337 22.8291 20.5141C24.3331 21.1587 25.6043 22.1613 26.6428 23.5221C27.6813 24.8829 28.2006 26.7092 28.2006 29.001C28.2006 30.7557 27.735 32.4209 26.804 33.9965C25.8729 35.5722 24.4942 36.8434 22.6679 37.8103C20.8416 38.7772 18.6572 39.2606 16.1147 39.2606ZM35.4663 4.39959V18.4192H49.7008V21.5347H35.4663V35.7691H51.3122V38.8846H31.7063V1.28413H51.3122V4.39959H35.4663ZM72.311 1.33784V29.753C72.311 32.6178 71.4337 34.9276 69.679 36.6823C67.9243 38.4011 65.5787 39.2606 62.6423 39.2606C59.5985 39.2606 57.1634 38.3474 55.3371 36.5211C53.5466 34.659 52.6513 32.1523 52.6513 29.001H56.4651C56.5009 31.0422 57.0022 32.7074 57.9691 33.9965C58.9718 35.2857 60.5295 35.9303 62.6423 35.9303C64.6477 35.9303 66.1338 35.3394 67.1007 34.1577C68.0675 32.9759 68.551 31.5077 68.551 29.753V1.33784H72.311ZM99.7606 29.9679H82.6792L79.4026 38.8846H75.4277L89.125 1.82127H93.3685L107.012 38.8846H103.037L99.7606 29.9679ZM98.6326 26.8524L91.2199 6.54819L83.8073 26.8524H98.6326Z" fill={GOLD_PRIMARY} />
    <path d="M137.78 39L135.739 32.8228H122.311L120.269 39H109.204L123.009 1.13094H135.148L148.899 39H137.78ZM133.107 24.7655L129.025 12.5185L124.996 24.7655H133.107Z" fill={GOLD_PRIMARY} />
    <path d="M151.177 17.8363H158.829C161.998 17.8363 163.287 16.2248 163.287 13.7539C163.287 11.2293 161.998 9.6179 158.829 9.6179H151.177V17.8363ZM170.568 13.7539C170.568 20.3609 166.002 26.2158 156.387 26.2158H151.177V39H148.899L135.148 1.13094H156.387C165.787 1.13094 170.568 6.44872 170.568 13.7539Z" fill={GOLD_PRIMARY} />
    <path d="M137.78 39L135.739 32.8228H122.311L120.269 39H109.204L123.009 1.13094H135.148L148.899 39H137.78ZM133.107 24.7655L129.025 12.5185L124.996 24.7655H133.107Z" fill="url(#paint0_linear_91_159)" />
    <path d="M171.346 0.908325H162.392C168.094 2.70836 170.053 4.85787 171.346 10.6416V0.908325Z" fill="url(#paint1_linear_91_159)" />
    <defs>
      <linearGradient id="paint0_linear_91_159" x1="123.502" y1="20.0655" x2="148.899" y2="20.0655" gradientUnits="userSpaceOnUse"><stop stopColor={GOLD_PRIMARY} /><stop offset="1" stopColor={GOLD_DARK} /></linearGradient>
      <linearGradient id="paint1_linear_91_159" x1="165.617" y1="5.77496" x2="171.346" y2="5.77496" gradientUnits="userSpaceOnUse"><stop stopColor={GOLD_PRIMARY} /><stop offset="1" stopColor={GOLD_DARK} /></linearGradient>
    </defs>
  </svg>
);

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export default function HelpModal({ open, onClose }: HelpModalProps) {
  // Contatos
  const contatos = {
    email: 'suporte@eap.com.br',
    whatsapp: '+55 (11) 9 9999-9999',
    telefone: '(11) 3333-4444',
    tempoMedio: '2 horas',
    horarioAtendimento: 'Segunda a Sexta, 8h às 18h',
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      TransitionComponent={Fade}
      transitionDuration={400}
      PaperProps={{
        sx: {
          bgcolor: DARK_BG,
          borderRadius: 4,
          overflow: 'auto', // Torna o modal inteiro rolável
          border: `1px solid ${alpha(GOLD_PRIMARY, 0.2)}`,
          boxShadow: `0 32px 64px ${alpha('#000', 0.5)}`,
          maxHeight: '90vh', // Limita a altura máxima
        },
      }}
    >
      {/* Barra superior decorativa */}
      <Box sx={{ height: 6, background: `linear-gradient(90deg, ${GOLD_PRIMARY}, ${GOLD_LIGHT})` }} />

      <DialogTitle sx={{ p: 0 }}>
        <Box sx={{ px: 4, py: 3, bgcolor: 'transparent' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  bgcolor: alpha(GOLD_PRIMARY, 0.1),
                  color: GOLD_PRIMARY,
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                }}
              >
                <HelpIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: WHITE }}>
                  Central de Ajuda
                </Typography>
                <Typography variant="body1" sx={{ color: GRAY_MAIN }}>
                  Estamos aqui para ajudar você
                </Typography>
              </Box>
            </Stack>

            <IconButton
              onClick={onClose}
              sx={{
                border: `1px solid ${alpha(GOLD_PRIMARY, 0.3)}`,
                borderRadius: 2,
                color: GRAY_MAIN,
                '&:hover': { borderColor: GOLD_PRIMARY, color: GOLD_PRIMARY },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>
        <Divider sx={{ borderColor: alpha(GOLD_PRIMARY, 0.2) }} />
      </DialogTitle>

      <DialogContent sx={{ bgcolor: 'transparent', p: 4 }}>
        <Stack spacing={4}>
          {/* Logo e Boas-vindas */}
          <Fade in timeout={500}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 3,
                bgcolor: alpha(GOLD_PRIMARY, 0.03),
                border: `1px solid ${alpha(GOLD_PRIMARY, 0.15)}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <Zoom in timeout={500}>
                <Box sx={{ mb: 2 }}>
                  <EAPLogoSmall />
                </Box>
              </Zoom>
              <Typography variant="h5" sx={{ fontWeight: 600, color: WHITE, mb: 1 }}>
                Bem-vindo à Central de Ajuda
              </Typography>
              <Typography sx={{ color: GRAY_MAIN, maxWidth: 500 }}>
                Estamos aqui para oferecer o melhor suporte e garantir que sua experiência com o sistema seja a melhor possível.
              </Typography>
            </Paper>
          </Fade>

          {/* Cards de Contato */}
          <Grid container spacing={3}>
            {/* Email */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Zoom in timeout={300} style={{ transitionDelay: '100ms' }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: alpha(STATUS_COLORS.info, 0.05),
                    border: `1px solid ${alpha(STATUS_COLORS.info, 0.2)}`,
                    height: '100%',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 24px ${alpha(STATUS_COLORS.info, 0.2)}`,
                      borderColor: STATUS_COLORS.info,
                    },
                  }}
                >
                  <Stack spacing={2} alignItems="center">
                    <Avatar
                      sx={{
                        bgcolor: alpha(STATUS_COLORS.info, 0.15),
                        color: STATUS_COLORS.info,
                        width: 64,
                        height: 64,
                        mb: 1,
                      }}
                    >
                      <EmailIcon sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: WHITE }}>
                      E-mail
                    </Typography>
                    <Typography sx={{ color: GRAY_MAIN, textAlign: 'center', wordBreak: 'break-all' }}>
                      {contatos.email}
                    </Typography>
                    <Chip
                      label="Respondemos em até 2h"
                      size="small"
                      sx={{
                        bgcolor: alpha(STATUS_COLORS.info, 0.15),
                        color: STATUS_COLORS.info,
                        fontWeight: 600,
                      }}
                    />
                  </Stack>
                </Paper>
              </Zoom>
            </Grid>

            {/* WhatsApp */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Zoom in timeout={300} style={{ transitionDelay: '200ms' }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: alpha('#25D366', 0.05),
                    border: `1px solid ${alpha('#25D366', 0.2)}`,
                    height: '100%',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 24px ${alpha('#25D366', 0.2)}`,
                      borderColor: '#25D366',
                    },
                  }}
                >
                  <Stack spacing={2} alignItems="center">
                    <Avatar
                      sx={{
                        bgcolor: alpha('#25D366', 0.15),
                        color: '#25D366',
                        width: 64,
                        height: 64,
                        mb: 1,
                      }}
                    >
                      <WhatsAppIcon sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: WHITE }}>
                      WhatsApp
                    </Typography>
                    <Typography sx={{ color: GRAY_MAIN, textAlign: 'center' }}>
                      {contatos.whatsapp}
                    </Typography>
                    <Chip
                      label="Atendimento imediato"
                      size="small"
                      sx={{
                        bgcolor: alpha('#25D366', 0.15),
                        color: '#25D366',
                        fontWeight: 600,
                      }}
                    />
                  </Stack>
                </Paper>
              </Zoom>
            </Grid>

            {/* Telefone */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Zoom in timeout={300} style={{ transitionDelay: '300ms' }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: alpha(GOLD_PRIMARY, 0.05),
                    border: `1px solid ${alpha(GOLD_PRIMARY, 0.2)}`,
                    height: '100%',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 24px ${alpha(GOLD_PRIMARY, 0.2)}`,
                      borderColor: GOLD_PRIMARY,
                    },
                  }}
                >
                  <Stack spacing={2} alignItems="center">
                    <Avatar
                      sx={{
                        bgcolor: alpha(GOLD_PRIMARY, 0.15),
                        color: GOLD_PRIMARY,
                        width: 64,
                        height: 64,
                        mb: 1,
                      }}
                    >
                      <PhoneIcon sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: WHITE }}>
                      Telefone
                    </Typography>
                    <Typography sx={{ color: GRAY_MAIN, textAlign: 'center' }}>
                      {contatos.telefone}
                    </Typography>
                    <Chip
                      label={contatos.horarioAtendimento}
                      size="small"
                      sx={{
                        bgcolor: alpha(GOLD_PRIMARY, 0.15),
                        color: GOLD_PRIMARY,
                        fontWeight: 600,
                      }}
                    />
                  </Stack>
                </Paper>
              </Zoom>
            </Grid>
          </Grid>

          {/* Informações Adicionais */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: alpha(GOLD_PRIMARY, 0.02),
              border: `1px solid ${alpha(GOLD_PRIMARY, 0.15)}`,
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: alpha(GOLD_PRIMARY, 0.1), color: GOLD_PRIMARY }}>
                  <AccessTimeIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: WHITE }}>
                    Tempo médio de atendimento
                  </Typography>
                  <Typography variant="body2" sx={{ color: GRAY_MAIN }}>
                    Nossa equipe responde em até {contatos.tempoMedio} durante o horário comercial.
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ borderColor: alpha(GOLD_PRIMARY, 0.1) }} />

              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: alpha(GOLD_PRIMARY, 0.1), color: GOLD_PRIMARY }}>
                  <CheckCircleIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: WHITE }}>
                    Suporte prioritário
                  </Typography>
                  <Typography variant="body2" sx={{ color: GRAY_MAIN }}>
                    Clientes com contrato ativo têm prioridade no atendimento. Em breve você receberá uma resposta da nossa equipe especializada.
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Paper>

          {/* Dúvidas Frequentes */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: alpha(GOLD_PRIMARY, 0.02),
              border: `1px solid ${alpha(GOLD_PRIMARY, 0.15)}`,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: WHITE, mb: 2 }}>
              Dúvidas Frequentes
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={1}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: GOLD_PRIMARY }}>
                    • Como gerar relatórios?
                  </Typography>
                  <Typography variant="caption" sx={{ color: GRAY_MAIN, display: 'block', mb: 1 }}>
                    Acesse o módulo desejado e utilize os filtros disponíveis.
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: GOLD_PRIMARY }}>
                    • Esqueci minha senha
                  </Typography>
                  <Typography variant="caption" sx={{ color: GRAY_MAIN, display: 'block' }}>
                    Clique em "Esqueci minha senha" na tela de login.
                  </Typography>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={1}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: GOLD_PRIMARY }}>
                    • Como importar dados?
                  </Typography>
                  <Typography variant="caption" sx={{ color: GRAY_MAIN, display: 'block', mb: 1 }}>
                    Utilize os modelos XLSX disponíveis em cada módulo.
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: GOLD_PRIMARY }}>
                    • Preciso de treinamento
                  </Typography>
                  <Typography variant="caption" sx={{ color: GRAY_MAIN, display: 'block' }}>
                    Entre em contato pelo WhatsApp para agendar.
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Stack>
      </DialogContent>

      <Divider sx={{ borderColor: alpha(GOLD_PRIMARY, 0.2) }} />

      <DialogActions sx={{ px: 4, py: 2.5, bgcolor: 'transparent' }}>
        <Button
          onClick={onClose}
          variant="contained"
          size="large"
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            px: 5,
            py: 1.2,
            bgcolor: GOLD_PRIMARY,
            color: DARK_BG,
            '&:hover': {
              bgcolor: GOLD_DARK,
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 16px ${alpha(GOLD_PRIMARY, 0.3)}`,
            },
            transition: 'all 0.2s ease',
          }}
        >
          Entendi
        </Button>
      </DialogActions>
    </Dialog>
  );
}