'use client';

import React, { useEffect, useMemo, useState, forwardRef } from 'react';
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
import type { TransitionProps } from '@mui/material/transitions';

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
  id: string;
  code: string;
  name: string;
};

type ApiCustomer = {
  id: string;
  code: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  email?: string;
  document?: string;
  phone?: string;
  status?: 'active' | 'pending' | 'inactive';
  avatar?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (client: SelectedClient) => void;
};

const DialogTransition = forwardRef(function DialogTransition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function fullName(c: ApiCustomer) {
  const personName = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim();

  if (personName) return personName;
  if (c.company_name?.trim()) return c.company_name.trim();
  if (c.code?.trim()) return c.code.trim();

  return '(Sem nome)';
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function normalizeCustomerList(data: any): ApiCustomer[] {
  const list = Array.isArray(data?.customers)
    ? data.customers
    : Array.isArray(data)
      ? data
      : [];

  return list
    .map((c: any) => {
      const x = c?.customer ?? c ?? {};

      return {
        id: String(x.id ?? '').trim(),
        code: String(x.code ?? '').trim(),
        first_name: String(x.first_name ?? '').trim(),
        last_name: String(x.last_name ?? '').trim(),
        company_name: String(x.company_name ?? '').trim(),
        email: String(x.email ?? '').trim(),
        document: String(x.document ?? '').trim(),
        phone: String(x.phone ?? '').trim(),
        status:
          x.status === 'active' || x.status === 'pending' || x.status === 'inactive'
            ? x.status
            : 'active',
        avatar: String(x.avatar ?? '').trim(),
      };
    })
    .filter((c) => c.id !== '' && c.code !== '');
}

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
  const customerName = fullName(client);
  const [isHovered, setIsHovered] = useState(false);

  if (viewMode === 'grid') {
    return (
      <Grow in timeout={300 + index * 50}>
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
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
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
                        {getInitials(customerName)}
                      </Avatar>
                    </Badge>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          color: TEXT_DARK,
                          fontSize: '1.1rem',
                          mb: 0.5,
                        }}
                      >
                        {customerName}
                      </Typography>

                      {client.code && (
                        <Typography variant="caption" sx={{ color: GRAY_MAIN }}>
                          Código: {client.code}
                        </Typography>
                      )}
                    </Box>
                  </Stack>

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

  return (
    <Grow in timeout={300 + index * 50}>
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
          <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
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
              {getInitials(customerName)}
            </Avatar>
          </Badge>

          <Box sx={{ flex: 1, minWidth: 0 }}>
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

              {client.code && (
                <Typography variant="caption" sx={{ color: GRAY_MAIN }}>
                  Código: {client.code}
                </Typography>
              )}
            </Stack>
          </Box>

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
    try {
      setLoading(true);

      const res = await services('/customers', { method: 'GET' });

      console.log('Clientes API Response:', res);

      if (!res?.success) {
        setRows([]);
        return;
      }

      const normalizedRows = normalizeCustomerList(res.data);
      console.log('Clientes normalizados:', normalizedRows);

      setRows(normalizedRows);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setSearch('');
      load();
    }
  }, [open]);

  const filtered = useMemo(() => {
    let filteredRows = rows;

    const q = search.trim().toLowerCase();

    if (q) {
      filteredRows = filteredRows.filter((c) => {
        const name = fullName(c).toLowerCase();
        const email = (c.email ?? '').toLowerCase();
        const doc = (c.document ?? '').toLowerCase();
        const code = (c.code ?? '').toLowerCase();
        const phone = (c.phone ?? '').toLowerCase();
        const companyName = (c.company_name ?? '').toLowerCase();

        return (
          name.includes(q) ||
          email.includes(q) ||
          doc.includes(q) ||
          code.includes(q) ||
          phone.includes(q) ||
          companyName.includes(q)
        );
      });
    }

    return filteredRows;
  }, [rows, search]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      TransitionComponent={DialogTransition}
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
        },
      }}
    >
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(GOLD_PRIMARY, 0.05)} 0%, ${alpha(
            DARK_BG,
            0.02
          )} 100%)`,
          borderBottom: `1px solid ${BORDER_LIGHT}`,
        }}
      >
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
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 800, color: TEXT_DARK, lineHeight: 1.2, mb: 0.5 }}
                >
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

        <Box sx={{ px: 4, pb: 3 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
          >
            <TextField
              placeholder="Buscar por nome, e-mail, documento, código..."
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
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch('')}>
                      <CloseIcon fontSize="small" sx={{ color: GRAY_MAIN }} />
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
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
              <Tooltip
                title={viewMode === 'list' ? 'Visualizar em grade' : 'Visualizar em lista'}
                arrow
              >
                <IconButton
                  onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                  sx={{
                    border: `1px solid ${BORDER_LIGHT}`,
                    borderRadius: 2,
                    width: 36,
                    height: 36,
                    color: GRAY_MAIN,
                    '&:hover': {
                      borderColor: GOLD_PRIMARY,
                      color: GOLD_PRIMARY,
                      bgcolor: alpha(GOLD_PRIMARY, 0.05),
                    },
                  }}
                >
                  {viewMode === 'list' ? (
                    <ViewModuleIcon fontSize="small" />
                  ) : (
                    <ViewListIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>

              <Tooltip title="Atualizar lista" arrow>
                <span>
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
                </span>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>
      </Box>

      <DialogContent sx={{ p: 3, bgcolor: GRAY_EXTRA_LIGHT }}>
        <Fade in={!loading} timeout={500}>
          <Box sx={{ mb: 2, px: 1 }}>
            <Typography variant="body2" sx={{ color: GRAY_MAIN, fontWeight: 500 }}>
              {filtered.length} {filtered.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
            </Typography>
          </Box>
        </Fade>

        <Box
          sx={{
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
          }}
        >
          {loading ? (
            <Box
              sx={{
                height: 500,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <CircularProgress size={60} sx={{ color: GOLD_PRIMARY }} />
              <Typography variant="h6" sx={{ color: GRAY_MAIN, fontWeight: 500 }}>
                Carregando clientes...
              </Typography>
            </Box>
          ) : filtered.length === 0 ? (
            <Fade in timeout={500}>
              <Box
                sx={{
                  height: 500,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  bgcolor: WHITE,
                  borderRadius: 4,
                  border: `1px dashed ${BORDER_LIGHT}`,
                }}
              >
                <SearchIcon sx={{ fontSize: 80, color: GRAY_LIGHT, opacity: 0.5 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                  Nenhum cliente encontrado
                </Typography>
                <Typography variant="body1" sx={{ color: GRAY_MAIN }}>
                  {search ? 'Tente ajustar os termos da busca' : 'Nenhum cliente cadastrado no sistema'}
                </Typography>
                {search ? (
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
                ) : null}
              </Box>
            </Fade>
          ) : viewMode === 'grid' ? (
            <Grid container spacing={2}>
              {filtered.map((client, index) => (
                <ClientCard
                  key={client.id}
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
                  key={client.id}
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

      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${BORDER_LIGHT}`,
          bgcolor: WHITE,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" sx={{ color: GRAY_LIGHT }}>
            {filtered.length} cliente{filtered.length !== 1 ? 's' : ''} disponíve
            {filtered.length !== 1 ? 'is' : 'l'}
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
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .rotate {
          animation: rotate 1s linear infinite;
        }
      `}</style>
    </Dialog>
  );
}