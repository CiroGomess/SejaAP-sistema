'use client';

import React, { useMemo } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  TextField,
  Typography,
  Stack,
  Avatar,
  alpha,
  Paper,
  Fade,
  Tooltip,
  Badge,
  CircularProgress,
} from '@mui/material';

import {
  Add as AddIcon,
  ReceiptLong as ReceiptIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Inventory as InventoryIcon,
  AttachMoney as AttachMoneyIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  AccountTree as AccountTreeIcon,
  InfoOutlined as InfoIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';

// --- PALETA DE CORES PREMIUM ---
const GOLD_PRIMARY = '#E6C969';
const GOLD_DARK = '#C4A052';
const GOLD_LIGHT = '#F5E6B8';
const DARK_BG = '#0F172A';
const WHITE = '#FFFFFF';
const GRAY_MAIN = '#64748B';
const GRAY_LIGHT = '#94A3B8';
const GRAY_EXTRA_LIGHT = '#F1F5F9';
const BORDER_LIGHT = 'rgba(100, 116, 139, 0.2)';
const TEXT_DARK = '#0F172A';

type ProdutoOuServico = 'PRODUTO' | 'SERVICO';

export type ReceitaForm = {
  numero_orcamento: string;
  nome_cliente: string;
  data_emissao: string;
  data_vencimento: string;
  produto_ou_servico: ProdutoOuServico;
  nome_produto_ou_servico: string;
  quantidade: number;
  valor_unitario: number;
  unidade_filial: string;
  projeto: string;
  centro_de_resultado: string;
};

type CustomerMin = {
  id: number;
  code: string;
  display_name: string;
};

const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: WHITE,
    borderRadius: 2,
    transition: 'all 0.2s ease',
    '& fieldset': { 
      borderColor: BORDER_LIGHT,
      borderWidth: '1.5px',
    },
    '&:hover fieldset': { 
      borderColor: GRAY_MAIN,
    },
    '&.Mui-focused': {
      '& fieldset': { 
        borderColor: GOLD_PRIMARY,
        borderWidth: '2px',
      },
      '& .MuiInputAdornment-root .MuiSvgIcon-root': {
        color: GOLD_PRIMARY,
      },
    },
    '& .MuiInputBase-input': {
      color: TEXT_DARK,
      fontWeight: 500,
      fontSize: '0.95rem',
      padding: '14px 16px',
    },
  },
  '& .MuiInputLabel-root': { 
    color: GRAY_MAIN, 
    fontWeight: 500,
    fontSize: '0.9rem',
    '&.Mui-focused': { 
      color: GOLD_PRIMARY,
      fontWeight: 600,
    },
  },
  '& .MuiInputAdornment-root': {
    '& .MuiSvgIcon-root': {
      color: GRAY_LIGHT,
      fontSize: '1.2rem',
    },
  },
} as const;

type Props = {
  open: boolean;
  saving: boolean;
  customer: CustomerMin | null;
  form: ReceitaForm;
  setForm: React.Dispatch<React.SetStateAction<ReceitaForm>>;
  onClose: () => void;
  onSubmit: () => void;
};

export default function ReceitaCreateModal({
  open,
  saving,
  customer,
  form,
  setForm,
  onClose,
  onSubmit,
}: Props) {
  // Garantir que form existe com valores padrão
  const safeForm = useMemo(() => {
    return {
      numero_orcamento: form?.numero_orcamento || '',
      nome_cliente: form?.nome_cliente || '',
      data_emissao: form?.data_emissao || new Date().toISOString().split('T')[0],
      data_vencimento: form?.data_vencimento || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      produto_ou_servico: form?.produto_ou_servico || 'SERVICO',
      nome_produto_ou_servico: form?.nome_produto_ou_servico || '',
      quantidade: form?.quantidade || 1,
      valor_unitario: form?.valor_unitario || 0,
      unidade_filial: form?.unidade_filial || '',
      projeto: form?.projeto || '',
      centro_de_resultado: form?.centro_de_resultado || '',
    };
  }, [form]);

  const total = useMemo(() => {
    const q = Number(safeForm.quantidade) || 0;
    const v = Number(safeForm.valor_unitario) || 0;
    return q * v;
  }, [safeForm.quantidade, safeForm.valor_unitario]);

  const handleChange = (field: keyof ReceitaForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleNumberChange = (field: 'quantidade' | 'valor_unitario') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value === '' ? 0 : Number(e.target.value);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      TransitionComponent={Fade}
      transitionDuration={400}
      PaperProps={{
        sx: {
          width: '80%',
          maxWidth: '1200px',
          height: 'auto',
          maxHeight: '90vh',
          bgcolor: WHITE,
          borderRadius: 4,
          overflow: 'hidden',
          border: `1px solid ${alpha(GOLD_PRIMARY, 0.1)}`,
          boxShadow: `0 32px 64px ${alpha(DARK_BG, 0.2)}`,
        },
      }}
    >
      {/* Barra superior decorativa */}
      <Box sx={{ 
        height: 6, 
        background: `linear-gradient(90deg, ${GOLD_PRIMARY}, ${GOLD_LIGHT})` 
      }} />

      <DialogTitle sx={{ p: 0 }}>
        <Box sx={{ px: 4, py: 3, bgcolor: WHITE }}>
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
              <ReceiptIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                Nova Receita
              </Typography>
              <Typography variant="body1" sx={{ color: GRAY_MAIN, mt: 0.5 }}>
                Preencha os dados para cadastrar uma nova receita no sistema
              </Typography>
            </Box>
          </Stack>

          {/* Card do Cliente - Versão simplificada e elegante */}
          {customer && (
            <Paper
              elevation={0}
              sx={{
                mt: 3,
                p: 2.5,
                borderRadius: 3,
                bgcolor: alpha(GOLD_PRIMARY, 0.03),
                border: `1px solid ${alpha(GOLD_PRIMARY, 0.15)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <Avatar
                      sx={{
                        width: 20,
                        height: 20,
                        bgcolor: GOLD_PRIMARY,
                        color: TEXT_DARK,
                        border: `2px solid ${WHITE}`,
                      }}
                    >
                      <VerifiedIcon sx={{ fontSize: 12 }} />
                    </Avatar>
                  }
                >
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: alpha(GOLD_PRIMARY, 0.15),
                      color: GOLD_PRIMARY,
                      fontSize: '1.3rem',
                      fontWeight: 700,
                    }}
                  >
                    {customer.display_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </Avatar>
                </Badge>

                <Box>
                  <Typography variant="subtitle2" sx={{ color: GRAY_MAIN, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Cliente Vinculado
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_DARK, mt: 0.5 }}>
                    {customer.display_name}
                  </Typography>
                </Box>
              </Stack>

              <Tooltip title="Cliente selecionado no menu lateral">
                <InfoIcon sx={{ color: GRAY_LIGHT, fontSize: '1.2rem' }} />
              </Tooltip>
            </Paper>
          )}
        </Box>
        <Divider sx={{ borderColor: BORDER_LIGHT }} />
      </DialogTitle>

      <DialogContent sx={{ bgcolor: WHITE, p: 0 }}>
        <Box sx={{ px: 4, py: 3 }}>
          {/* Grid de campos em 2 colunas para melhor aproveitamento */}
          <Grid container spacing={3}>
            {/* Número do Orçamento */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Número do Orçamento"
                value={safeForm.numero_orcamento}
                onChange={handleChange('numero_orcamento')}
                fullWidth
                sx={inputSx}
                placeholder="Ex: ORC-2025-001"
                InputProps={{
                  startAdornment: (
                    <Box component="span" sx={{ mr: 0.5, color: GRAY_LIGHT }}>#</Box>
                  ),
                }}
              />
            </Grid>

            {/* Nome do Cliente (travado) */}
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                label="Cliente"
                value={safeForm.nome_cliente}
                disabled
                fullWidth
                sx={inputSx}
                InputProps={{
                  startAdornment: (
                    <PersonIcon sx={{ mr: 0.5, color: GRAY_LIGHT, fontSize: '1.2rem' }} />
                  ),
                }}
              />
            </Grid>

            {/* Data Emissão */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Data de Emissão"
                type="date"
                value={safeForm.data_emissao}
                onChange={handleChange('data_emissao')}
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={inputSx}
                InputProps={{
                  startAdornment: (
                    <CalendarIcon sx={{ mr: 0.5, color: GRAY_LIGHT, fontSize: '1.2rem' }} />
                  ),
                }}
              />
            </Grid>

            {/* Data Vencimento */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Data de Vencimento"
                type="date"
                value={safeForm.data_vencimento}
                onChange={handleChange('data_vencimento')}
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={inputSx}
                InputProps={{
                  startAdornment: (
                    <CalendarIcon sx={{ mr: 0.5, color: GRAY_LIGHT, fontSize: '1.2rem' }} />
                  ),
                }}
              />
            </Grid>

            {/* Tipo (Produto/Serviço) */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                label="Tipo"
                value={safeForm.produto_ou_servico}
                onChange={(e) =>
                  setForm((p) => ({ ...p, produto_ou_servico: e.target.value as ProdutoOuServico }))
                }
                fullWidth
                sx={inputSx}
                InputProps={{
                  startAdornment: (
                    <InventoryIcon sx={{ mr: 0.5, color: GRAY_LIGHT, fontSize: '1.2rem' }} />
                  ),
                }}
              >
                <MenuItem value="SERVICO">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>📋</span>
                    <span>Serviço</span>
                  </Stack>
                </MenuItem>
                <MenuItem value="PRODUTO">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>📦</span>
                    <span>Produto</span>
                  </Stack>
                </MenuItem>
              </TextField>
            </Grid>

            {/* Nome do Produto/Serviço */}
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                label="Nome do Produto/Serviço"
                value={safeForm.nome_produto_ou_servico}
                onChange={handleChange('nome_produto_ou_servico')}
                fullWidth
                sx={inputSx}
                placeholder="Digite o nome do produto ou serviço"
              />
            </Grid>

            {/* Quantidade */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                label="Quantidade"
                type="number"
                value={safeForm.quantidade}
                onChange={handleNumberChange('quantidade')}
                fullWidth
                sx={inputSx}
                InputProps={{
                  startAdornment: (
                    <Box component="span" sx={{ mr: 0.5, color: GRAY_LIGHT, fontWeight: 600 }}>x</Box>
                  ),
                  inputProps: { min: 1, step: 1 },
                }}
              />
            </Grid>

            {/* Valor Unitário */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                label="Valor Unitário"
                type="number"
                value={safeForm.valor_unitario}
                onChange={handleNumberChange('valor_unitario')}
                fullWidth
                sx={inputSx}
                InputProps={{
                  startAdornment: (
                    <AttachMoneyIcon sx={{ mr: 0.5, color: GRAY_LIGHT, fontSize: '1.2rem' }} />
                  ),
                  inputProps: { min: 0, step: 0.01 },
                }}
              />
            </Grid>

            {/* Unidade/Filial */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Unidade / Filial"
                value={safeForm.unidade_filial}
                onChange={handleChange('unidade_filial')}
                fullWidth
                sx={inputSx}
                placeholder="Ex: Matriz, Filial SP"
                InputProps={{
                  startAdornment: (
                    <BusinessIcon sx={{ mr: 0.5, color: GRAY_LIGHT, fontSize: '1.2rem' }} />
                  ),
                }}
              />
            </Grid>

            {/* Projeto */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Projeto"
                value={safeForm.projeto}
                onChange={handleChange('projeto')}
                fullWidth
                sx={inputSx}
                placeholder="Ex: Projeto Alpha"
                InputProps={{
                  startAdornment: (
                    <AssignmentIcon sx={{ mr: 0.5, color: GRAY_LIGHT, fontSize: '1.2rem' }} />
                  ),
                }}
              />
            </Grid>

            {/* Centro de Resultado */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Centro de Resultado"
                value={safeForm.centro_de_resultado}
                onChange={handleChange('centro_de_resultado')}
                fullWidth
                sx={inputSx}
                placeholder="Ex: CR-001"
                InputProps={{
                  startAdornment: (
                    <AccountTreeIcon sx={{ mr: 0.5, color: GRAY_LIGHT, fontSize: '1.2rem' }} />
                  ),
                }}
              />
            </Grid>

            {/* Total - Agora ocupando largura total */}
            <Grid size={{ xs: 12 }}>
              <Paper
                elevation={0}
                sx={{
                  mt: 2,
                  p: 3,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${alpha(GOLD_PRIMARY, 0.05)} 0%, ${alpha(GOLD_PRIMARY, 0.02)} 100%)`,
                  border: `1px solid ${alpha(GOLD_PRIMARY, 0.2)}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: alpha(GOLD_PRIMARY, 0.15),
                      color: GOLD_PRIMARY,
                    }}
                  >
                    <AttachMoneyIcon sx={{ fontSize: 24 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: TEXT_DARK }}>
                      Valor Total da Receita
                    </Typography>
                    <Typography variant="body2" sx={{ color: GRAY_MAIN }}>
                      {safeForm.quantidade} × R$ {safeForm.valor_unitario.toFixed(2)}
                    </Typography>
                  </Box>
                </Stack>
                <Typography variant="h3" sx={{ fontWeight: 700, color: GOLD_PRIMARY }}>
                  R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <Divider sx={{ borderColor: BORDER_LIGHT }} />

      <DialogActions sx={{ px: 4, py: 3, bgcolor: WHITE, gap: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          size="large"
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            px: 5,
            py: 1.2,
            borderColor: BORDER_LIGHT,
            color: GRAY_MAIN,
            fontSize: '1rem',
            '&:hover': { 
              borderColor: GOLD_PRIMARY,
              color: GOLD_PRIMARY,
              bgcolor: alpha(GOLD_PRIMARY, 0.05),
            },
          }}
        >
          Cancelar
        </Button>

        <Button
          onClick={onSubmit}
          variant="contained"
          disabled={saving}
          size="large"
          startIcon={saving ? <CircularProgress size={20} sx={{ color: TEXT_DARK }} /> : <AddIcon />}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            px: 6,
            py: 1.2,
            bgcolor: GOLD_PRIMARY,
            color: TEXT_DARK,
            fontSize: '1rem',
            '&:hover': {
              bgcolor: GOLD_DARK,
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 16px ${alpha(GOLD_PRIMARY, 0.3)}`,
            },
            '&.Mui-disabled': {
              bgcolor: alpha(GOLD_PRIMARY, 0.3),
              color: alpha(TEXT_DARK, 0.5),
            },
            transition: 'all 0.2s ease',
          }}
        >
          {saving ? 'Salvando...' : 'Cadastrar Receita'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}