'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,

  DialogContent,
  TextField,
  Typography,
  CircularProgress,
  InputAdornment,
 
  Stack,
  IconButton,
  alpha,
  Avatar,

  Tooltip,
  Fade,
  Zoom,
  Paper,
  Badge,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Slide,
  Grow,
} from '@mui/material';

import {
  Search as SearchIcon,
  Business as BusinessIcon,
  Close as CloseIcon,
  BadgeOutlined as BadgeIcon,
  EmailOutlined as EmailIcon,
  Phone as PhoneIcon,
  Refresh as RefreshIcon,
  ChevronRight as ChevronRightIcon,

  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
} from '@mui/icons-material';

import services from '@/services/service';

// --- PALETA DE CORES PREMIUM ---
const GOLD_PRIMARY = '#E6C969';

const DARK_BG = '#0F172A';
const WHITE = '#FFFFFF';
const GRAY_MAIN = '#64748B';
const GRAY_LIGHT = '#94A3B8';
const GRAY_EXTRA_LIGHT = '#F1F5F9';
const BORDER_LIGHT = 'rgba(100, 116, 139, 0.2)';
const TEXT_DARK = '#0F172A';



export type SelectedClient = {
  id: number;
  code: string;
  name: string;
};

type ApiCustomer = {
  id: number;
  code: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  document?: string;
  phone?: string;
  status?: 'active' | 'pending' | 'inactive';
  avatar?: string;
};

function fullName(c: ApiCustomer) {
  return `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim();
}

function normalizeCustomerList(data: any): ApiCustomer[] {
  const list = Array.isArray(data?.customers) ? data.customers : Array.isArray(data) ? data : [];
  return list
    .map((c: any, index: number) => {
      const x = c?.customer ?? c ?? {};
      return {
        id: Number(x.id ?? 0),
        code: String(x.code ?? ''),
        first_name: String(x.first_name ?? ''),
        last_name: String(x.last_name ?? ''),
        email: String(x.email ?? ''),
        document: String(x.document ?? ''),
        phone: x.phone ? String(x.phone) : '(11) 99999-9999',
        status: index % 3 === 0 ? 'active' : index % 3 === 1 ? 'pending' : 'inactive',
      };
    })
    .filter((c) => !!c.id && !!c.code);
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (client: SelectedClient) => void;
};

// Componente de Card Cliente Premium (simplificado)
const ClientCard = ({ 
  client, 
  onSelect, 
  viewMode,
  index,
}: { 
  client: ApiCustomer; 
  onSelect: (client: SelectedClient) => void;
  viewMode: 'grid' | 'list';
  index: number;
}) => {
  const customerName = fullName(client) || '(Sem nome)';
  const [isHovered, setIsHovered] = useState(false);

  



  if (viewMode === 'grid') {
    return (
      <Grow in={true} timeout={300 + index * 50}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${isHovered ? GOLD_PRIMARY : BORDER_LIGHT}`,
              bgcolor: WHITE,
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              height: '100%',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 20px 40px ${alpha(DARK_BG, 0.1)}`,
              },
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onSelect({ id: client.id, code: client.code, name: customerName })}
          >
            <CardActionArea sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2.5}>
                  {/* Avatar e Nome com indicador de status */}
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                     
                    >
                      <Avatar
                        sx={{
                          width: 60,
                          height: 60,
                          bgcolor: alpha(GOLD_PRIMARY, 0.1),
                          color: GOLD_PRIMARY,
                          fontSize: '1.3rem',
                          fontWeight: 700,
                          border: `2px solid ${isHovered ? GOLD_PRIMARY : 'transparent'}`,
                          transition: 'border 0.2s ease',
                        }}
                      >
                        {customerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </Avatar>
                    </Badge>

                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 700, color: TEXT_DARK, fontSize: '1.1rem', mb: 0.5 }}>
                        {customerName}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Informações de Contato */}
                  <Stack spacing={1.5} sx={{ pl: 1 }}>
                    {client.email && (
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <EmailIcon sx={{ fontSize: '1.1rem', color: GRAY_MAIN }} />
                        <Typography variant="body2" sx={{ color: TEXT_DARK, fontWeight: 500 }}>
                          {client.email}
                        </Typography>
                      </Stack>
                    )}

                    {client.phone && (
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <PhoneIcon sx={{ fontSize: '1.1rem', color: GRAY_MAIN }} />
                        <Typography variant="body2" sx={{ color: TEXT_DARK, fontWeight: 500 }}>
                          {client.phone}
                        </Typography>
                      </Stack>
                    )}

                    {client.document && (
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <BadgeIcon sx={{ fontSize: '1.1rem', color: GRAY_MAIN }} />
                        <Typography variant="body2" sx={{ color: TEXT_DARK, fontWeight: 500 }}>
                          {client.document}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>

                  {/* Apenas o ícone de seleção */}
                  <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
                    <ChevronRightIcon sx={{ color: GRAY_LIGHT, fontSize: '1.2rem' }} />
                  </Stack>
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grow>
    );
  }

  // View Mode List
  return (
    <Grow in={true} timeout={300 + index * 50}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          border: `1px solid ${isHovered ? GOLD_PRIMARY : BORDER_LIGHT}`,
          bgcolor: WHITE,
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateX(4px)',
            boxShadow: `0 8px 24px ${alpha(DARK_BG, 0.08)}`,
          },
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onSelect({ id: client.id, code: client.code, name: customerName })}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Avatar com status */}
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
           
          >
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: alpha(GOLD_PRIMARY, 0.1),
                color: GOLD_PRIMARY,
                fontWeight: 700,
                border: `2px solid ${isHovered ? GOLD_PRIMARY : 'transparent'}`,
                transition: 'border 0.2s ease',
              }}
            >
              {customerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </Avatar>
          </Badge>

          {/* Informações principais */}
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 700, color: TEXT_DARK, fontSize: '1rem', mb: 0.5 }}>
              {customerName}
            </Typography>

            <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1.5}>
              {client.email && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <EmailIcon sx={{ fontSize: '0.9rem', color: GRAY_MAIN }} />
                  <Typography variant="caption" sx={{ color: GRAY_MAIN }}>
                    {client.email}
                  </Typography>
                </Stack>
              )}

              {client.document && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <BadgeIcon sx={{ fontSize: '0.9rem', color: GRAY_MAIN }} />
                  <Typography variant="caption" sx={{ color: GRAY_MAIN }}>
                    {client.document}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Box>

          {/* Ícone de seleção */}
          <ChevronRightIcon sx={{ color: GRAY_LIGHT, fontSize: '1.2rem' }} />
        </Stack>
      </Paper>
    </Grow>
  );
};

export default function SelectClientModal({ open, onClose, onSelect }: Props) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ApiCustomer[]>([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const load = async () => {
    setLoading(true);
    const res = await services('/customers', { method: 'GET' });
    setLoading(false);

    if (!res.success) {
      setRows([]);
      return;
    }

    setRows(normalizeCustomerList(res.data));
  };

  useEffect(() => {
    if (open) {
      setSearch('');
      load();
    }
  }, [open]);

  const filtered = useMemo(() => {
    let filtered = rows;

    // Filtro por busca
    const q = search.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((c) => {
        const name = fullName(c).toLowerCase();
        const email = (c.email ?? '').toLowerCase();
        const doc = (c.document ?? '').toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          doc.includes(q)
        );
      });
    }

    return filtered;
  }, [rows, search]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      TransitionComponent={Slide}
      transitionDuration={400}
      PaperProps={{
        sx: {
          bgcolor: WHITE,
          borderRadius: 4,
          boxShadow: `0 32px 64px ${alpha(DARK_BG, 0.2)}`,
          overflow: 'hidden',
          border: `1px solid ${alpha(GOLD_PRIMARY, 0.1)}`,
          height: '85vh',
          maxHeight: '900px',
        }
      }}
    >
      {/* Header Premium com Gradiente */}
      <Box sx={{
        background: `linear-gradient(135deg, ${alpha(GOLD_PRIMARY, 0.05)} 0%, ${alpha(DARK_BG, 0.02)} 100%)`,
        borderBottom: `1px solid ${BORDER_LIGHT}`,
      }}>
        <Box sx={{ px: 4, py: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  bgcolor: alpha(GOLD_PRIMARY, 0.15),
                  color: GOLD_PRIMARY,
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                }}
              >
                <BusinessIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: TEXT_DARK, lineHeight: 1.2, mb: 0.5 }}>
                  Selecionar Cliente
                </Typography>
                <Typography variant="body1" sx={{ color: GRAY_MAIN }}>
                  Escolha um cliente para acessar todas as informações
                </Typography>
              </Box>
            </Stack>

            <Tooltip title="Fechar" arrow TransitionComponent={Zoom}>
              <IconButton
                onClick={onClose}
                sx={{
                  bgcolor: WHITE,
                  border: `1px solid ${BORDER_LIGHT}`,
                  borderRadius: 2,
                  width: 44,
                  height: 44,
                  '&:hover': {
                    bgcolor: alpha(GOLD_PRIMARY, 0.05),
                    borderColor: GOLD_PRIMARY,
                    transform: 'rotate(90deg)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Barra de ferramentas simplificada */}
        <Box sx={{ px: 4, pb: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
            {/* Busca */}
            <TextField
              placeholder="Buscar por nome, e-mail ou documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: GRAY_MAIN }} />
                  </InputAdornment>
                ),
                endAdornment: search && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch('')}>
                      <CloseIcon fontSize="small" sx={{ color: GRAY_MAIN }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                maxWidth: { md: 400 },
                '& .MuiOutlinedInput-root': {
                  bgcolor: WHITE,
                  borderRadius: 3,
                  transition: 'all 0.2s ease',
                  '& fieldset': { borderColor: BORDER_LIGHT },
                  '&:hover fieldset': { borderColor: GRAY_MAIN },
                  '&.Mui-focused': {
                    boxShadow: `0 0 0 3px ${alpha(GOLD_PRIMARY, 0.2)}`,
                    '& fieldset': { borderColor: GOLD_PRIMARY, borderWidth: 2 },
                  },
                },
              }}
            />

            <Stack direction="row" spacing={1} alignItems="center">
              {/* Toggle View */}
              <Tooltip title={viewMode === 'list' ? 'Visualizar em grade' : 'Visualizar em lista'} arrow>
                <IconButton
                  onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                  sx={{
                    border: `1px solid ${BORDER_LIGHT}`,
                    borderRadius: 2,
                    width: 36,
                    height: 36,
                    color: GRAY_MAIN,
                    '&:hover': { borderColor: GOLD_PRIMARY, color: GOLD_PRIMARY, bgcolor: alpha(GOLD_PRIMARY, 0.05) },
                  }}
                >
                  {viewMode === 'list' ? <ViewModuleIcon fontSize="small" /> : <ViewListIcon fontSize="small" />}
                </IconButton>
              </Tooltip>

              <Tooltip title="Atualizar lista" arrow>
                <IconButton
                  onClick={load}
                  disabled={loading}
                  sx={{
                    border: `1px solid ${BORDER_LIGHT}`,
                    borderRadius: 2,
                    width: 36,
                    height: 36,
                    color: GRAY_MAIN,
                    '&:hover': { borderColor: GOLD_PRIMARY, color: GOLD_PRIMARY },
                  }}
                >
                  <RefreshIcon fontSize="small" className={loading ? 'rotate' : ''} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>
      </Box>

      <DialogContent sx={{ p: 3, bgcolor: GRAY_EXTRA_LIGHT }}>
        {/* Contador de resultados */}
        <Fade in={!loading} timeout={500}>
          <Box sx={{ mb: 2, px: 1 }}>
            <Typography variant="body2" sx={{ color: GRAY_MAIN, fontWeight: 500 }}>
              {filtered.length} {filtered.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
            </Typography>
          </Box>
        </Fade>

        {/* Grid de Clientes */}
        <Box sx={{ 
          height: 'calc(100% - 40px)',
          overflowY: 'auto',
          px: 1,
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { 
            background: alpha(GRAY_MAIN, 0.2), 
            borderRadius: '4px',
            '&:hover': { background: alpha(GRAY_MAIN, 0.4) },
          },
        }}>
          {loading ? (
            <Box sx={{ 
              height: 500, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 2,
            }}>
              <CircularProgress size={60} sx={{ color: GOLD_PRIMARY }} />
              <Typography variant="h6" sx={{ color: GRAY_MAIN, fontWeight: 500 }}>
                Carregando clientes...
              </Typography>
            </Box>
          ) : filtered.length === 0 ? (
            <Fade in={true} timeout={500}>
              <Box sx={{ 
                height: 500, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 2,
                bgcolor: WHITE,
                borderRadius: 4,
                border: `1px dashed ${BORDER_LIGHT}`,
              }}>
                <SearchIcon sx={{ fontSize: 80, color: GRAY_LIGHT, opacity: 0.5 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                  Nenhum cliente encontrado
                </Typography>
                <Typography variant="body1" sx={{ color: GRAY_MAIN }}>
                  {search ? 'Tente ajustar os termos da busca' : 'Nenhum cliente cadastrado no sistema'}
                </Typography>
                {search && (
                  <Button
                    variant="contained"
                    onClick={() => setSearch('')}
                    sx={{
                      mt: 2,
                      bgcolor: GOLD_PRIMARY,
                      color: TEXT_DARK,
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: 2,
                      px: 4,
                      py: 1,
                      '&:hover': { 
                        bgcolor: alpha(GOLD_PRIMARY, 0.8),
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 12px ${alpha(GOLD_PRIMARY, 0.3)}`,
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Limpar busca
                  </Button>
                )}
              </Box>
            </Fade>
          ) : viewMode === 'grid' ? (
            <Grid container spacing={2}>
              {filtered.map((client, index) => (
                <ClientCard
                  key={client.code}
                  client={client}
                  onSelect={onSelect}
                  viewMode="grid"
                  index={index}
                />
              ))}
            </Grid>
          ) : (
            <Stack spacing={1.5}>
              {filtered.map((client, index) => (
                <ClientCard
                  key={client.code}
                  client={client}
                  onSelect={onSelect}
                  viewMode="list"
                  index={index}
                />
              ))}
            </Stack>
          )}
        </Box>
      </DialogContent>

      {/* Footer */}
      <Box sx={{ 
        p: 2, 
        borderTop: `1px solid ${BORDER_LIGHT}`,
        bgcolor: WHITE,
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" sx={{ color: GRAY_LIGHT }}>
            {filtered.length} cliente{filtered.length !== 1 ? 's' : ''} disponívei{filtered.length !== 1 ? 's' : ''}
          </Typography>
          <Button
            onClick={onClose}
            variant="text"
            sx={{
              textTransform: 'none',
              color: GRAY_MAIN,
              fontWeight: 600,
              '&:hover': { 
                color: GOLD_PRIMARY,
                bgcolor: alpha(GOLD_PRIMARY, 0.05),
              },
            }}
          >
            Cancelar
          </Button>
        </Stack>
      </Box>

      <style jsx global>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .rotate {
          animation: rotate 1s linear infinite;
        }
      `}</style>
    </Dialog>
  );
}