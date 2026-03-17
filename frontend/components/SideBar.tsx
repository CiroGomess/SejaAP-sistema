'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Collapse,
  Divider,
  Typography,
  alpha,
  Badge,
  Fade,
  Stack,
} from '@mui/material';

import {
  Dashboard as DashboardIcon,
  ReceiptLong as ReceiptIcon,
  Add as AddIcon,
  ExpandLess,
  ExpandMore,
  Assessment as AssessmentIcon,
  AccountBalance as AccountBalanceIcon,
  Autorenew as CycleIcon,
  ChevronRight as ChevronRightIcon,
  PeopleAlt as PeopleIcon,
  BarChart as BarChartIcon,
  Calculate as CalculateIcon,
  AttachMoney as AttachMoneyIcon,
  Folder as FolderIcon,
  Help as HelpIcon,
} from '@mui/icons-material';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { SelectedClient } from '@/components/clientProfile/SelectClientModal';
import HelpModal from '@/components/HelpModal';

import services from '@/services/service'; // ✅ usa seu wrapper axios

const drawerWidth = 280;

const GOLD_PRIMARY = '#E6C969';
const DARK_BG = '#0F172A';
const WHITE = '#FFFFFF';

const STORAGE_KEY = 'selectedClient';

// =======================
// MENUS (ADMIN)
// =======================
const menuItemsAdmin = [
  {
    text: 'Dashboard ADM',
    icon: <DashboardIcon />,
    href: '/dashboard',
    requiresClient: false,
    description: 'Visão geral do sistema',
  },
  {
    text: 'Clientes',
    icon: <PeopleIcon />,
    href: '/clients',
    requiresClient: false,
    description: 'Gestão de clientes',
  },
];

// =======================
// MENUS DE RECEITAS
// =======================
const receitasChildren = [
  { text: 'Importar / Cadastrar', icon: <AddIcon />, href: '/receitas/cadastrar', requiresClient: true },
  { text: 'Listar receitas', icon: <ReceiptIcon />, href: '/receitas/listar', requiresClient: true },
];

// =======================
// MENUS DE ANÁLISE DE MARGEM (INDEPENDENTE)
// =======================
const analiseChildren = [
  { text: 'Importar / Cadastrar', icon: <AddIcon />, href: '/analise', requiresClient: true },
  { text: 'Listar análises', icon: <AssessmentIcon />, href: '/analise/listar', requiresClient: true },
];

// =======================
// MENUS DE CONTABILIDADE
// =======================
const contabilidadeChildren = [
  { text: 'Importar / Cadastrar', icon: <AddIcon />, href: '/contabilidade/cadastro', requiresClient: true },
  { text: 'Listar dados', icon: <FolderIcon />, href: '/contabilidade/listar', requiresClient: true },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant: 'permanent' | 'temporary';
}

export default function Sidebar({ open, onClose, variant }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null);
  const [receitasOpen, setReceitasOpen] = useState(false);
  const [analiseOpen, setAnaliseOpen] = useState(false);
  const [contabilidadeOpen, setContabilidadeOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // ✅ Admin vindo do backend
  const [loadingUser, setLoadingUser] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // =======================
  // MENU DASH CLIENTE
  // =======================
  const menuItemDashCliente = {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    href: '/dash-cliente',
    requiresClient: true,
    description: 'Painel do cliente',
  };

  // =======================
  // MENUS INDEPENDENTES
  // =======================
  const menuItemTicketMedio = {
    text: 'Ticket Médio',
    icon: <AttachMoneyIcon />,
    href: '/ticket',
    requiresClient: true,
    description: 'Análise de ticket médio',
  };

  const menuItemCicloOperacional = {
    text: 'Ciclo Operacional',
    icon: <CycleIcon />,
    href: '/ciclo-operacional',
    requiresClient: true,
    description: 'Análise do ciclo operacional',
  };

  const menuItemCurvaABC = {
    text: 'Curva ABC Produtos',
    icon: <BarChartIcon />,
    href: '/curva-abc-produtos/produtos',
    requiresClient: true,
    description: 'Classificação ABC de produtos',
  };

  // =======================
  // DETECÇÃO DE ROTAS ATIVAS
  // =======================
  const isReceitasRoute = useMemo(() => {
    return pathname.startsWith('/receitas');
  }, [pathname]);

  const isAnaliseRoute = useMemo(() => {
    return pathname.startsWith('/analise');
  }, [pathname]);

  const isContabilidadeRoute = useMemo(() => {
    return pathname.startsWith('/contabilidade');
  }, [pathname]);

  const isTicketRoute = useMemo(() => {
    return pathname.startsWith('/ticket');
  }, [pathname]);

  const isCicloRoute = useMemo(() => {
    return pathname.startsWith('/ciclo-operacional');
  }, [pathname]);

  const isCurvaABCRoute = useMemo(() => {
    return pathname.startsWith('/curva-abc-produtos');
  }, [pathname]);

  // =========================
  // Load selected client (storage)
  // =========================
  const loadClientFromStorage = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setSelectedClient(null);
        return;
      }

      const parsed = JSON.parse(raw);

      if (parsed?.id) {
        const normalized: SelectedClient = {
          id: parsed.id,
          code: String(parsed.code || ''),
          name: String(parsed.name || ''),
        } as SelectedClient;

        setSelectedClient(normalized);
        return;
      }

      if (parsed?.code && parsed?.name) {
        const normalized: SelectedClient = {
          id: parsed.id,
          code: String(parsed.code || ''),
          name: String(parsed.name || ''),
        } as SelectedClient;

        setSelectedClient(normalized);
        return;
      }

      setSelectedClient(null);
    } catch (e) {
      setSelectedClient(null);
    }
  };

  const forceClientForNonAdmin = async (u: any) => {
    try {
      const clientId = u?.client_id || 0;
      const clientCode = String(u?.client_code ?? u?.code ?? '').trim();

      if (!clientId) {
        localStorage.removeItem(STORAGE_KEY);
        setSelectedClient(null);
        window.dispatchEvent(new Event('clientChanged'));
        return;
      }

      let clientName = String(u?.client_name ?? '').trim();

      if (!clientName) {
        const resCustomers = await services('/customers', { method: 'GET' });

        if (resCustomers.success) {
          const list = Array.isArray(resCustomers.data?.customers)
            ? resCustomers.data.customers
            : Array.isArray(resCustomers.data)
              ? resCustomers.data
              : [];

          const found = list
            .map((x: any) => x?.customer ?? x)
            .find((c: any) => c?.id === clientId);

          if (found) {
            const first = String(found.first_name ?? '').trim();
            const last = String(found.last_name ?? '').trim();
            clientName = `${first} ${last}`.trim();
          }
        }
      }

      const forcedSelectedClient: SelectedClient = {
        id: clientId,
        code: clientCode,
        name: clientName || '',
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(forcedSelectedClient));
      setSelectedClient(forcedSelectedClient);
      window.dispatchEvent(new Event('clientChanged'));
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY);
      setSelectedClient(null);
      window.dispatchEvent(new Event('clientChanged'));
    }
  };

  const loadUserFromApi = async () => {
    setLoadingUser(true);

    try {
      const rawId = localStorage.getItem('sejaap_user_id');
      const token = localStorage.getItem('sejaap_access');

      if (!rawId || !token) {
        setIsAdmin(false);
        setLoadingUser(false);
        return;
      }

      const userId = rawId;
      if (!userId) {
        setIsAdmin(false);
        setLoadingUser(false);
        return;
      }

      const r = await services(`/users/${userId}`, { method: 'GET' });

      if (!r.success) {
        if (r.status === 401 || r.status === 403) {
          setIsAdmin(false);
          setLoadingUser(false);
          router.push('/login');
          return;
        }

        setIsAdmin(false);
        setLoadingUser(false);
        return;
      }

      const payload = r.data || {};
      const u = payload?.user || payload;
      const admin = !!u?.is_superuser;

      setIsAdmin(admin);

      if (!admin) {
        await forceClientForNonAdmin(u);
      } else {
        loadClientFromStorage();
      }

      setLoadingUser(false);
    } catch (e) {
      setIsAdmin(false);
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    loadClientFromStorage();
    loadUserFromApi();

    const onClientChanged = () => loadClientFromStorage();
    window.addEventListener('clientChanged', onClientChanged);

    const onStorage = (ev: StorageEvent) => {
      if (!ev.key) return;

      if (ev.key.startsWith('sejaap_')) loadUserFromApi();
      if (ev.key === STORAGE_KEY) loadClientFromStorage();
    };

    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('clientChanged', onClientChanged);
      window.removeEventListener('storage', onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isReceitasRoute) setReceitasOpen(true);
    if (isAnaliseRoute) setAnaliseOpen(true);
    if (isContabilidadeRoute) setContabilidadeOpen(true);
  }, [isReceitasRoute, isAnaliseRoute, isContabilidadeRoute]);

  // =========================
  // Styles
  // =========================
  const baseItemSx = (isSelected: boolean, isDisabled: boolean) => ({
    mx: 1.5,
    my: 0.3,
    borderRadius: 2,
    py: 1,
    px: 1.5,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: isDisabled ? 0.5 : 1,
    color: isSelected ? GOLD_PRIMARY : alpha(WHITE, 0.7),
    backgroundColor: isSelected ? alpha(GOLD_PRIMARY, 0.08) : 'transparent',
    borderLeft: isSelected ? `3px solid ${GOLD_PRIMARY}` : '3px solid transparent',
    position: 'relative',
    overflow: 'hidden',
    '&::before': isSelected
      ? {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(circle at 30% 50%, ${alpha(GOLD_PRIMARY, 0.1)} 0%, transparent 70%)`,
        pointerEvents: 'none',
      }
      : {},
    '&:hover': {
      backgroundColor: alpha(GOLD_PRIMARY, 0.05),
      color: GOLD_PRIMARY,
      borderLeftColor: alpha(GOLD_PRIMARY, 0.5),
      '& .MuiListItemIcon-root': {
        color: GOLD_PRIMARY,
        transform: 'scale(1.05)',
      },
    },
    '& .MuiListItemIcon-root': {
      minWidth: 40,
      color: isSelected ? GOLD_PRIMARY : alpha(WHITE, 0.6),
      transition: 'all 0.2s ease',
    },
    '& .MuiListItemText-primary': {
      fontSize: '0.9rem',
      fontWeight: isSelected ? 600 : 500,
      letterSpacing: '0.3px',
    },
    '& .MuiListItemText-secondary': {
      fontSize: '0.7rem',
      color: alpha(WHITE, 0.4),
    },
  });

  const canShowAdminMenus = !loadingUser && isAdmin;

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: DARK_BG,
          backgroundImage: `linear-gradient(180deg, ${alpha(GOLD_PRIMARY, 0.02)} 0%, transparent 100%)`,
          borderRight: 'none',
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.3)',
          pt: 2,
        },
      }}
    >
      <Box
        sx={{
          px: 1,
          flex: 1,
          overflowY: 'auto',
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-thumb': { background: alpha(GOLD_PRIMARY, 0.2), borderRadius: '2px' },
          marginTop: 8,
        }}
      >
        <List sx={{ pt: 0 }}>
          {/* =========================
              ITENS PRINCIPAIS (SÓ SUPERADMIN)
             ========================= */}
          {canShowAdminMenus && (
            <>
              {menuItemsAdmin.map((item) => {
                const isSelected = pathname === item.href;
                const isDisabled = !item.requiresClient ? false : !selectedClient;

                return (
                  <ListItem key={item.text} disablePadding>
                    <ListItemButton
                      component={Link}
                      href={item.href}
                      onClick={() => variant === 'temporary' && onClose()}
                      selected={isSelected}
                      disabled={isDisabled}
                      sx={baseItemSx(isSelected, isDisabled)}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        secondary={item.description}
                        secondaryTypographyProps={{
                          fontSize: '0.7rem',
                          color: alpha(WHITE, 0.4),
                        }}
                      />
                      {isSelected && (
                        <Badge
                          variant="dot"
                          sx={{
                            '& .MuiBadge-badge': {
                              bgcolor: GOLD_PRIMARY,
                              right: 8,
                              top: '50%',
                            },
                          }}
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}

              <Divider sx={{ borderColor: alpha(GOLD_PRIMARY, 0.08), my: 1.5, mx: 2 }} />
            </>
          )}

          {/* =========================
              DASHBOARD CLIENTE
             ========================= */}
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              href={menuItemDashCliente.href}
              onClick={() => variant === 'temporary' && onClose()}
              selected={pathname === menuItemDashCliente.href}
              disabled={!selectedClient}
              sx={baseItemSx(pathname === menuItemDashCliente.href, !selectedClient)}
            >
              <ListItemIcon>{menuItemDashCliente.icon}</ListItemIcon>
              <ListItemText
                primary={menuItemDashCliente.text}
                secondary={menuItemDashCliente.description}
                secondaryTypographyProps={{
                  fontSize: '0.7rem',
                  color: alpha(WHITE, 0.4),
                }}
              />
            </ListItemButton>
          </ListItem>

          {/* =========================
              SEÇÃO RECEITAS
             ========================= */}
          <ListItem disablePadding sx={{ mt: 1 }}>
            <ListItemButton
              onClick={() => selectedClient && setReceitasOpen(!receitasOpen)}
              selected={isReceitasRoute}
              disabled={!selectedClient}
              sx={baseItemSx(isReceitasRoute, !selectedClient)}
            >
              <ListItemIcon>
                <ReceiptIcon />
              </ListItemIcon>
              <ListItemText
                primary="Receitas"
                secondary="Gestão de receitas"
                secondaryTypographyProps={{ fontSize: '0.7rem', color: alpha(WHITE, 0.4) }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isReceitasRoute && (
                  <Badge
                    variant="dot"
                    sx={{
                      '& .MuiBadge-badge': {
                        bgcolor: GOLD_PRIMARY,
                      },
                    }}
                  />
                )}
                {receitasOpen ? (
                  <ExpandLess sx={{ color: GOLD_PRIMARY, fontSize: '1.2rem' }} />
                ) : (
                  <ExpandMore sx={{ color: alpha(WHITE, 0.4), fontSize: '1.2rem' }} />
                )}
              </Box>
            </ListItemButton>
          </ListItem>

          <Collapse in={receitasOpen && !!selectedClient} timeout="auto" unmountOnExit>
            <List disablePadding sx={{ position: 'relative', mb: 1 }}>
              <Box
                sx={{
                  position: 'absolute',
                  left: 32,
                  top: 0,
                  bottom: 8,
                  width: '2px',
                  bgcolor: alpha(GOLD_PRIMARY, 0.1),
                }}
              />

              {receitasChildren.map((child) => {
                const isSelected = pathname === child.href;

                return (
                  <Fade in timeout={300} key={child.text}>
                    <ListItemButton
                      component={Link}
                      href={child.href}
                      onClick={() => variant === 'temporary' && onClose()}
                      selected={isSelected}
                      sx={{
                        ...baseItemSx(isSelected, false),
                        ml: 4,
                        py: 0.8,
                        pl: 2,
                        backgroundColor: 'transparent',
                        '&:hover': { backgroundColor: alpha(GOLD_PRIMARY, 0.03) },
                        borderLeft: isSelected ? `2px solid ${GOLD_PRIMARY}` : '2px solid transparent',
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {React.cloneElement(child.icon as React.ReactElement, {
                          sx: {
                            fontSize: '1rem',
                            color: isSelected ? GOLD_PRIMARY : alpha(WHITE, 0.5),
                          },
                        })}
                      </ListItemIcon>
                      <ListItemText
                        primary={child.text}
                        primaryTypographyProps={{
                          fontSize: '0.8rem',
                          fontWeight: isSelected ? 600 : 400,
                          color: isSelected ? GOLD_PRIMARY : alpha(WHITE, 0.8),
                        }}
                      />
                      {isSelected && <ChevronRightIcon sx={{ color: GOLD_PRIMARY, fontSize: '1rem' }} />}
                    </ListItemButton>
                  </Fade>
                );
              })}
            </List>
          </Collapse>

          {/* =========================
              SEÇÃO ANÁLISE DE MARGEM (INDEPENDENTE)
             ========================= */}
          <ListItem disablePadding sx={{ mt: 1 }}>
            <ListItemButton
              onClick={() => selectedClient && setAnaliseOpen(!analiseOpen)}
              selected={isAnaliseRoute}
              disabled={!selectedClient}
              sx={baseItemSx(isAnaliseRoute, !selectedClient)}
            >
              <ListItemIcon>
                <CalculateIcon />
              </ListItemIcon>
              <ListItemText
                primary="Análise de Margem"
                secondary="Análise de rentabilidade"
                secondaryTypographyProps={{ fontSize: '0.7rem', color: alpha(WHITE, 0.4) }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isAnaliseRoute && (
                  <Badge
                    variant="dot"
                    sx={{
                      '& .MuiBadge-badge': {
                        bgcolor: GOLD_PRIMARY,
                      },
                    }}
                  />
                )}
                {analiseOpen ? (
                  <ExpandLess sx={{ color: GOLD_PRIMARY, fontSize: '1.2rem' }} />
                ) : (
                  <ExpandMore sx={{ color: alpha(WHITE, 0.4), fontSize: '1.2rem' }} />
                )}
              </Box>
            </ListItemButton>
          </ListItem>

          <Collapse in={analiseOpen && !!selectedClient} timeout="auto" unmountOnExit>
            <List disablePadding sx={{ position: 'relative', mb: 1 }}>
              <Box
                sx={{
                  position: 'absolute',
                  left: 32,
                  top: 0,
                  bottom: 8,
                  width: '2px',
                  bgcolor: alpha(GOLD_PRIMARY, 0.1),
                }}
              />

              {analiseChildren.map((child) => {
                const isSelected = pathname === child.href;

                return (
                  <Fade in timeout={300} key={child.text}>
                    <ListItemButton
                      component={Link}
                      href={child.href}
                      onClick={() => variant === 'temporary' && onClose()}
                      selected={isSelected}
                      sx={{
                        ...baseItemSx(isSelected, false),
                        ml: 4,
                        py: 0.8,
                        pl: 2,
                        backgroundColor: 'transparent',
                        '&:hover': { backgroundColor: alpha(GOLD_PRIMARY, 0.03) },
                        borderLeft: isSelected ? `2px solid ${GOLD_PRIMARY}` : '2px solid transparent',
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {React.cloneElement(child.icon as React.ReactElement, {
                          sx: {
                            fontSize: '1rem',
                            color: isSelected ? GOLD_PRIMARY : alpha(WHITE, 0.5),
                          },
                        })}
                      </ListItemIcon>
                      <ListItemText
                        primary={child.text}
                        primaryTypographyProps={{
                          fontSize: '0.8rem',
                          fontWeight: isSelected ? 600 : 400,
                          color: isSelected ? GOLD_PRIMARY : alpha(WHITE, 0.8),
                        }}
                      />
                      {isSelected && <ChevronRightIcon sx={{ color: GOLD_PRIMARY, fontSize: '1rem' }} />}
                    </ListItemButton>
                  </Fade>
                );
              })}
            </List>
          </Collapse>

          {/* =========================
              TICKET MÉDIO (INDEPENDENTE)
             ========================= */}
          <ListItem disablePadding sx={{ mt: 1 }}>
            <ListItemButton
              component={Link}
              href={menuItemTicketMedio.href}
              onClick={() => variant === 'temporary' && onClose()}
              selected={isTicketRoute}
              disabled={!selectedClient}
              sx={baseItemSx(isTicketRoute, !selectedClient)}
            >
              <ListItemIcon>{menuItemTicketMedio.icon}</ListItemIcon>
              <ListItemText
                primary={menuItemTicketMedio.text}
                secondary={menuItemTicketMedio.description}
                secondaryTypographyProps={{
                  fontSize: '0.7rem',
                  color: alpha(WHITE, 0.4),
                }}
              />
            </ListItemButton>
          </ListItem>

          {/* =========================
              CURVA ABC (INDEPENDENTE)
             ========================= */}
          <ListItem disablePadding sx={{ mt: 1 }}>
            <ListItemButton
              component={Link}
              href={menuItemCurvaABC.href}
              onClick={() => variant === 'temporary' && onClose()}
              selected={isCurvaABCRoute}
              disabled={!selectedClient}
              sx={baseItemSx(isCurvaABCRoute, !selectedClient)}
            >
              <ListItemIcon>{menuItemCurvaABC.icon}</ListItemIcon>
              <ListItemText
                primary={menuItemCurvaABC.text}
                secondary={menuItemCurvaABC.description}
                secondaryTypographyProps={{
                  fontSize: '0.7rem',
                  color: alpha(WHITE, 0.4),
                }}
              />
            </ListItemButton>
          </ListItem>

          {/* =========================
              CICLO OPERACIONAL (INDEPENDENTE)
             ========================= */}
          <ListItem disablePadding sx={{ mt: 1 }}>
            <ListItemButton
              component={Link}
              href={menuItemCicloOperacional.href}
              onClick={() => variant === 'temporary' && onClose()}
              selected={isCicloRoute}
              disabled={!selectedClient}
              sx={baseItemSx(isCicloRoute, !selectedClient)}
            >
              <ListItemIcon>{menuItemCicloOperacional.icon}</ListItemIcon>
              <ListItemText
                primary={menuItemCicloOperacional.text}
                secondary={menuItemCicloOperacional.description}
                secondaryTypographyProps={{
                  fontSize: '0.7rem',
                  color: alpha(WHITE, 0.4),
                }}
              />
            </ListItemButton>
          </ListItem>

          {/* =========================
              SEÇÃO CONTABILIDADE
             ========================= */}
          <ListItem disablePadding sx={{ mt: 1 }}>
            <ListItemButton
              onClick={() => selectedClient && setContabilidadeOpen(!contabilidadeOpen)}
              selected={isContabilidadeRoute}
              disabled={!selectedClient}
              sx={baseItemSx(isContabilidadeRoute, !selectedClient)}
            >
              <ListItemIcon>
                <AccountBalanceIcon />
              </ListItemIcon>
              <ListItemText
                primary="Contabilidade"
                secondary="Dados contábeis"
                secondaryTypographyProps={{ fontSize: '0.7rem', color: alpha(WHITE, 0.4) }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                {isContabilidadeRoute && (
                  <Badge
                    variant="dot"
                    sx={{
                      '& .MuiBadge-badge': {
                        bgcolor: GOLD_PRIMARY,
                      },
                    }}
                  />
                )}
                {contabilidadeOpen ? (
                  <ExpandLess sx={{ color: GOLD_PRIMARY, fontSize: '1.2rem' }} />
                ) : (
                  <ExpandMore sx={{ color: alpha(WHITE, 0.4), fontSize: '1.2rem' }} />
                )}
              </Box>
            </ListItemButton>
          </ListItem>

          <Collapse in={contabilidadeOpen && !!selectedClient} timeout="auto" unmountOnExit>
            <List disablePadding sx={{ position: 'relative', mb: 1 }}>
              <Box
                sx={{
                  position: 'absolute',
                  left: 32,
                  top: 0,
                  bottom: 8,
                  width: '2px',
                  bgcolor: alpha(GOLD_PRIMARY, 0.1),
                }}
              />

              {contabilidadeChildren.map((child) => {
                const isSelected = pathname === child.href;

                return (
                  <Fade in timeout={300} key={child.text}>
                    <ListItemButton
                      component={Link}
                      href={child.href}
                      onClick={() => variant === 'temporary' && onClose()}
                      selected={isSelected}
                      sx={{
                        ...baseItemSx(isSelected, false),
                        ml: 4,
                        py: 0.8,
                        pl: 2,
                        backgroundColor: 'transparent',
                        '&:hover': { backgroundColor: alpha(GOLD_PRIMARY, 0.03) },
                        borderLeft: isSelected ? `2px solid ${GOLD_PRIMARY}` : '2px solid transparent',
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {React.cloneElement(child.icon as React.ReactElement, {
                          sx: {
                            fontSize: '1rem',
                            color: isSelected ? GOLD_PRIMARY : alpha(WHITE, 0.5),
                          },
                        })}
                      </ListItemIcon>
                      <ListItemText
                        primary={child.text}
                        primaryTypographyProps={{
                          fontSize: '0.8rem',
                          fontWeight: isSelected ? 600 : 400,
                          color: isSelected ? GOLD_PRIMARY : alpha(WHITE, 0.8),
                        }}
                      />
                      {isSelected && <ChevronRightIcon sx={{ color: GOLD_PRIMARY, fontSize: '1rem' }} />}
                    </ListItemButton>
                  </Fade>
                );
              })}
            </List>
          </Collapse>
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ px: 2.5, py: 2, borderTop: `1px solid ${alpha(GOLD_PRIMARY, 0.1)}` }}>
        <Stack spacing={1}>
          <ListItemButton
            onClick={() => setHelpModalOpen(true)}
            sx={{
              borderRadius: 2,
              py: 1,
              px: 1.5,
              color: alpha(WHITE, 0.6),
              '&:hover': { backgroundColor: alpha(GOLD_PRIMARY, 0.05), color: GOLD_PRIMARY },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
              <HelpIcon sx={{ fontSize: '1.2rem' }} />
            </ListItemIcon>
            <ListItemText primary="Ajuda" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }} />
          </ListItemButton>

          <Divider sx={{ borderColor: alpha(GOLD_PRIMARY, 0.1), my: 1 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1 }}>
            <Typography variant="caption" sx={{ color: alpha(WHITE, 0.3) }}>
              v2.0.0
            </Typography>
            <Typography variant="caption" sx={{ color: alpha(GOLD_PRIMARY, 0.5), fontSize: '0.6rem' }}>
              © 2025 EAP
            </Typography>
          </Box>
        </Stack>
      </Box>

      <HelpModal open={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
    </Drawer>
  );
}

export { drawerWidth };