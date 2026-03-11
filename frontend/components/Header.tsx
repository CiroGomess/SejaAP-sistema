'use client';

import { useEffect, useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Menu,
    MenuItem,
    Avatar,
    Box,
    Divider,
    ListItemIcon,
    alpha,
    Tooltip,
} from '@mui/material';

import {
    Settings as SettingsIcon,
    Logout as LogoutIcon,
    Menu as MenuIcon,
    Business as BusinessIcon,
    ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

import { useRouter } from 'next/navigation';
import SelectClientModal, { SelectedClient } from '@/components/clientProfile/SelectClientModal';
import services from '@/services/service'; // ✅ ajuste o caminho se precisar

// --- CORES DA MARCA (Selo EAP) ---
const GOLD_PRIMARY = '#E6C969';
const DARK_BG = '#0F172A';
const WHITE = '#FFFFFF';
const STORAGE_KEY = 'selectedClient';

interface HeaderProps {
    onMenuOpen: () => void;
}

// --- LOGO SVG INTEGRADA (Corrigido stopColor) ---
const EAPLogoSmall = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="130" height="35" viewBox="0 0 172 54" fill="none">
        <path d="M16.1147 39.2606C13.6438 39.2606 11.4594 38.8309 9.56147 37.9714C7.69935 37.112 6.23115 35.9124 5.15685 34.3725C4.08255 32.8327 3.50959 31.1138 3.43797 29.2159H7.41287C7.59192 31.0422 8.39765 32.6536 9.83005 34.0502C11.2624 35.411 13.3573 36.0914 16.1147 36.0914C18.6572 36.0914 20.6626 35.4468 22.1308 34.1577C23.6348 32.8327 24.3868 31.1675 24.3868 29.1622C24.3868 27.5507 23.975 26.2616 23.1513 25.2947C22.3277 24.292 21.3071 23.5579 20.0896 23.0924C18.8721 22.5911 17.189 22.0539 15.0404 21.4809C12.5337 20.8006 10.5462 20.1381 9.07804 19.4935C7.60983 18.8489 6.35648 17.8462 5.31799 16.4855C4.2795 15.1247 3.76026 13.2805 3.76026 10.9528C3.76026 9.01908 4.2616 7.3002 5.26428 5.79618C6.26695 4.25635 7.68145 3.05672 9.50776 2.19728C11.3341 1.33784 13.4289 0.908122 15.7924 0.908122C19.266 0.908122 22.0591 1.76756 24.1719 3.48644C26.3205 5.16951 27.556 7.35391 27.8783 10.0397H23.7959C23.5453 8.49983 22.7037 7.13905 21.2713 5.95733C19.8389 4.73979 17.9052 4.13102 15.4701 4.13102C13.2141 4.13102 11.3341 4.73979 9.83005 5.95733C8.32603 7.13905 7.57402 8.76841 7.57402 10.8454C7.57402 12.421 7.98583 13.6923 8.80946 14.6591C9.63309 15.626 10.6537 16.3601 11.8712 16.8615C13.1246 17.3628 14.8076 17.8999 16.9204 18.4729C19.3555 19.1533 21.325 19.8337 22.8291 20.5141C24.3331 21.1587 25.6043 22.1613 26.6428 23.5221C27.6813 24.8829 28.2006 26.7092 28.2006 29.001C28.2006 30.7557 27.735 32.4209 26.804 33.9965C25.8729 35.5722 24.4942 36.8434 22.6679 37.8103C20.8416 38.7772 18.6572 39.2606 16.1147 39.2606ZM35.4663 4.39959V18.4192H49.7008V21.5347H35.4663V35.7691H51.3122V38.8846H31.7063V1.28413H51.3122V4.39959H35.4663ZM72.311 1.33784V29.753C72.311 32.6178 71.4337 34.9276 69.679 36.6823C67.9243 38.4011 65.5787 39.2606 62.6423 39.2606C59.5985 39.2606 57.1634 38.3474 55.3371 36.5211C53.5466 34.659 52.6513 32.1523 52.6513 29.001H56.4651C56.5009 31.0422 57.0022 32.7074 57.9691 33.9965C58.9718 35.2857 60.5295 35.9303 62.6423 35.9303C64.6477 35.9303 66.1338 35.3394 67.1007 34.1577C68.0675 32.9759 68.551 31.5077 68.551 29.753V1.33784H72.311ZM99.7606 29.9679H82.6792L79.4026 38.8846H75.4277L89.125 1.82127H93.3685L107.012 38.8846H103.037L99.7606 29.9679ZM98.6326 26.8524L91.2199 6.54819L83.8073 26.8524H98.6326Z" fill="white" />
        <path d="M137.78 39L135.739 32.8228H122.311L120.269 39H109.204L123.009 1.13094H135.148L148.899 39H137.78ZM133.107 24.7655L129.025 12.5185L124.996 24.7655H133.107Z" fill="white" />
        <path d="M151.177 17.8363H158.829C161.998 17.8363 163.287 16.2248 163.287 13.7539C163.287 11.2293 161.998 9.6179 158.829 9.6179H151.177V17.8363ZM170.568 13.7539C170.568 20.3609 166.002 26.2158 156.387 26.2158H151.177V39H148.899L135.148 1.13094H156.387C165.787 1.13094 170.568 6.44872 170.568 13.7539Z" fill="white" />
        <path d="M137.78 39L135.739 32.8228H122.311L120.269 39H109.204L123.009 1.13094H135.148L148.899 39H137.78ZM133.107 24.7655L129.025 12.5185L124.996 24.7655H133.107Z" fill="url(#paint0_linear_91_159)" />
        <path d="M171.346 0.908325H162.392C168.094 2.70836 170.053 4.85787 171.346 10.6416V0.908325Z" fill="url(#paint1_linear_91_159)" />
        <defs>
            <linearGradient id="paint0_linear_91_159" x1="123.502" y1="20.0655" x2="148.899" y2="20.0655" gradientUnits="userSpaceOnUse">
                <stop stopColor="#E6C969" />
                <stop offset="1" stopColor="#705829" />
            </linearGradient>
            <linearGradient id="paint1_linear_91_159" x1="165.617" y1="5.77496" x2="171.346" y2="5.77496" gradientUnits="userSpaceOnUse">
                <stop stopColor="#E6C969" />
                <stop offset="1" stopColor="#705829" />
            </linearGradient>
        </defs>
    </svg>
);

export default function Header({ onMenuOpen }: HeaderProps) {
    const router = useRouter();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    // Estados para controle de Cliente
    const [selectModalOpen, setSelectModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null);

    // Usuário vindo do backend (/users/:id)
    const [user, setUser] = useState<any>(null);
    const [loadingUser, setLoadingUser] = useState(true);

    const isAdmin = user?.is_superuser === true;

    // Carregar cliente ao iniciar
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.code && parsed?.name) setSelectedClient(parsed);
            }
        } catch (e) { }
    }, []);

    // Buscar usuário pelo ID salvo no localStorage
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const id = localStorage.getItem('sejaap_user_id');
                if (!id) {
                    setLoadingUser(false);
                    return;
                }

                const result = await services(`/users/${id}`, { method: 'GET' });

                // sua API retorna { requested_by, user }
                if (result.success && result.data?.user) {
                    setUser(result.data.user);
                }
            } catch (err) {
                console.error('Erro ao buscar usuário:', err);
            } finally {
                setLoadingUser(false);
            }
        };

        fetchUser();
    }, []);

    // Função para salvar cliente e disparar evento para o Sidebar atualizar
    const saveSelectedClient = (client: SelectedClient | null) => {
        setSelectedClient(client);
        if (!client) localStorage.removeItem(STORAGE_KEY);
        else localStorage.setItem(STORAGE_KEY, JSON.stringify(client));

        window.dispatchEvent(new Event('clientChanged'));
    };

    const handleCloseMenu = () => setAnchorEl(null);

    const removeCookie = (name: string) => {
        document.cookie = `${name}=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    };

    const handleLogout = async () => {
        try {
            // limpa localStorage do app
            localStorage.removeItem('sejaap_access');
            localStorage.removeItem('sejaap_user');
            localStorage.removeItem('sejaap_user_id');
            localStorage.removeItem('sejaap_is_active');
            localStorage.removeItem('sejaap_is_staff');
            localStorage.removeItem('sejaap_is_superuser');
            localStorage.removeItem('sejaap_last_login');
            localStorage.removeItem('sejaap_client_id');
            localStorage.removeItem(STORAGE_KEY);

            // tenta limpar cookies client-side (o server também limpa no /api/logout)
            removeCookie('sejaap_access');
            removeCookie('sejaap_refresh');

            await fetch('/api/logout', { method: 'POST' });
        } finally {
            handleCloseMenu();
            router.push('/login');
        }
    };

    const fullName = user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : '';
    const email = user?.email ?? '';
    const initials = (() => {
        const a = (user?.first_name || '').trim();
        const b = (user?.last_name || '').trim();
        const i1 = a ? a[0].toUpperCase() : '';
        const i2 = b ? b[0].toUpperCase() : '';
        return (i1 + i2) || 'U';
    })();

    return (
        <>
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    bgcolor: DARK_BG,
                    backgroundImage: `linear-gradient(180deg, ${alpha(GOLD_PRIMARY, 0.02)} 0%, transparent 100%)`,
                    borderBottom: `1px solid ${alpha(GOLD_PRIMARY, 0.1)}`,
                    backdropFilter: 'blur(10px)',
                }}
            >
                <Toolbar sx={{ minHeight: 80, px: { xs: 2, sm: 4 } }}>
                    {/* Menu Mobile */}
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={onMenuOpen}
                        sx={{
                            mr: 2,
                            display: { sm: 'none' },
                            color: alpha(WHITE, 0.7),
                            '&:hover': {
                                color: GOLD_PRIMARY,
                                bgcolor: alpha(GOLD_PRIMARY, 0.08),
                            },
                        }}
                    >
                        <MenuIcon />
                    </IconButton>

                    {/* Logo */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                            sx={{
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    opacity: 0.8,
                                    transform: 'translateY(-1px)',
                                },
                            }}
                            onClick={() => router.push('/home')}
                        >
                            <EAPLogoSmall />
                        </Box>
                    </Box>

                    <>
                        {/* Espaçamento flexível para empurrar o resto para a direita */}
                        <Box sx={{ flexGrow: 1 }} />

                        {/* Área do Usuário (sempre aparece) */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>

                            {/* ✅ Seletor de Cliente: SÓ ADMIN */}
                            {isAdmin && (
                                <>
                                    <Tooltip title="Selecionar cliente" arrow>
                                        <Box
                                            onClick={() => setSelectModalOpen(true)}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1.5,
                                                px: { xs: 1.5, md: 2 },
                                                py: 0.8,
                                                border: `1px solid ${alpha(GOLD_PRIMARY, 0.2)}`,
                                                borderRadius: 2,
                                                bgcolor: alpha(GOLD_PRIMARY, 0.03),
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    bgcolor: alpha(GOLD_PRIMARY, 0.08),
                                                    borderColor: GOLD_PRIMARY,
                                                    transform: 'translateY(-1px)',
                                                },
                                            }}
                                        >
                                            <BusinessIcon sx={{ color: GOLD_PRIMARY, fontSize: { xs: 18, md: 22 } }} />
                                            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                                                <Typography sx={{ color: WHITE, fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.2 }}>
                                                    {selectedClient ? selectedClient.name : 'Selecionar Cliente'}
                                                </Typography>
                                                {selectedClient && (
                                                    <Typography sx={{ color: alpha(WHITE, 0.5), fontSize: '0.65rem', fontWeight: 500, letterSpacing: 0.5 }}>
                                                        ID: {selectedClient.code}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <ChevronRightIcon sx={{ color: alpha(WHITE, 0.3), fontSize: '1rem' }} />
                                        </Box>
                                    </Tooltip>

                                    {/* Divider do seletor (só faz sentido se o seletor existir) */}
                                    <Divider orientation="vertical" flexItem sx={{ borderColor: alpha(GOLD_PRIMARY, 0.1), my: 2 }} />
                                </>
                            )}

                            {/* Info do usuário (sempre aparece) */}
                            <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'right', mr: 1 }}>
                                <Typography variant="body2" sx={{ color: WHITE, fontWeight: 600, lineHeight: 1 }}>
                                    {loadingUser ? 'Carregando...' : (fullName || user?.username || 'Usuário')}
                                </Typography>
                                <Typography variant="caption" sx={{ color: alpha(WHITE, 0.5), fontSize: '0.65rem', letterSpacing: 1 }}>
                                    {isAdmin ? 'ADMINISTRADOR' : 'USUÁRIO'}
                                </Typography>
                            </Box>

                            {/* Avatar (sempre aparece) */}
                            <Tooltip title="Configurações" arrow>
                                <IconButton
                                    onClick={(e) => setAnchorEl(e.currentTarget)}
                                    sx={{
                                        p: 0.5,
                                        border: `1px solid ${alpha(GOLD_PRIMARY, 0.2)}`,
                                        borderRadius: '50%',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            bgcolor: alpha(GOLD_PRIMARY, 0.1),
                                            borderColor: GOLD_PRIMARY,
                                            transform: 'scale(1.05)',
                                        },
                                    }}
                                >
                                    <Avatar
                                        sx={{
                                            width: 38,
                                            height: 38,
                                            bgcolor: alpha(GOLD_PRIMARY, 0.15),
                                            color: GOLD_PRIMARY,
                                            fontWeight: 700,
                                            fontSize: 14,
                                            border: `1px solid ${alpha(GOLD_PRIMARY, 0.3)}`,
                                        }}
                                    >
                                        {initials}
                                    </Avatar>
                                </IconButton>
                            </Tooltip>

                            {/* Menu (sempre aparece) */}
                            <Menu
                                anchorEl={anchorEl}
                                open={open}
                                onClose={handleCloseMenu}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                slotProps={{
                                    paper: {
                                        sx: {
                                            mt: 1.5,
                                            bgcolor: DARK_BG,
                                            backgroundImage: `linear-gradient(180deg, ${alpha(GOLD_PRIMARY, 0.02)} 0%, transparent 100%)`,
                                            border: `1px solid ${alpha(GOLD_PRIMARY, 0.1)}`,
                                            borderRadius: 2,
                                            minWidth: 240,
                                            color: WHITE,
                                            boxShadow: `0 10px 30px ${alpha(DARK_BG, 0.5)}`,
                                        },
                                    },
                                }}
                            >
                                <Box sx={{ px: 2, py: 1.5 }}>
                                    <Typography variant="subtitle2" sx={{ color: WHITE, fontWeight: 600 }}>
                                        {fullName || user?.username || 'Usuário'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: alpha(WHITE, 0.5) }}>
                                        {email || '-'}
                                    </Typography>
                                </Box>

                                <Divider sx={{ borderColor: alpha(GOLD_PRIMARY, 0.1) }} />

                                <MenuItem
                                    onClick={handleCloseMenu}
                                    sx={{
                                        py: 1.5,
                                        px: 2,
                                        fontSize: '0.8rem',
                                        letterSpacing: 0.5,
                                        transition: 'all 0.2s ease',
                                        color: alpha(WHITE, 0.8),
                                        '&:hover': {
                                            bgcolor: alpha(GOLD_PRIMARY, 0.08),
                                            color: GOLD_PRIMARY,
                                            '& .MuiListItemIcon-root': { color: GOLD_PRIMARY },
                                        },
                                    }}
                                >
                                    <ListItemIcon sx={{ color: 'inherit', minWidth: 35 }}>
                                        <SettingsIcon fontSize="small" />
                                    </ListItemIcon>
                                    Configurações
                                </MenuItem>

                                <Divider sx={{ borderColor: alpha(GOLD_PRIMARY, 0.1) }} />

                                <MenuItem
                                    onClick={handleLogout}
                                    sx={{
                                        py: 1.5,
                                        px: 2,
                                        fontSize: '0.8rem',
                                        letterSpacing: 0.5,
                                        color: '#EF4444',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            bgcolor: alpha('#EF4444', 0.08),
                                            '& .MuiListItemIcon-root': { color: '#EF4444' },
                                        },
                                    }}
                                >
                                    <ListItemIcon sx={{ color: 'inherit', minWidth: 35 }}>
                                        <LogoutIcon fontSize="small" />
                                    </ListItemIcon>
                                    Sair do Sistema
                                </MenuItem>
                            </Menu>
                        </Box>
                    </>
                </Toolbar>
            </AppBar>

            {/* Modal de Seleção (só abre se admin clicou) */}
            <SelectClientModal
                open={selectModalOpen}
                onClose={() => setSelectModalOpen(false)}
                onSelect={(client) => {
                    saveSelectedClient(client);
                    setSelectModalOpen(false);
                }}
            />
        </>
    );
}