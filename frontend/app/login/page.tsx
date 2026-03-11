'use client';

import { useMemo, useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    InputAdornment,
    IconButton,
    CircularProgress,
    Stack,
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';

// --- CORES DA MARCA (Selo EAP) ---
const GOLD_GRADIENT = 'linear-gradient(135deg, #E6C969 0%, #705829 100%)';
const GOLD_MAIN = '#E6C969';
const DARK_BG = '#0A0A0A';

// --- COMPONENTE DA LOGO SVG ---
const EAPLogo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 172 54" fill="none">
        <path d="M16.1147 39.2606C13.6438 39.2606 11.4594 38.8309 9.56147 37.9714C7.69935 37.112 6.23115 35.9124 5.15685 34.3725C4.08255 32.8327 3.50959 31.1138 3.43797 29.2159H7.41287C7.59192 31.0422 8.39765 32.6536 9.83005 34.0502C11.2624 35.411 13.3573 36.0914 16.1147 36.0914C18.6572 36.0914 20.6626 35.4468 22.1308 34.1577C23.6348 32.8327 24.3868 31.1675 24.3868 29.1622C24.3868 27.5507 23.975 26.2616 23.1513 25.2947C22.3277 24.292 21.3071 23.5579 20.0896 23.0924C18.8721 22.5911 17.189 22.0539 15.0404 21.4809C12.5337 20.8006 10.5462 20.1381 9.07804 19.4935C7.60983 18.8489 6.35648 17.8462 5.31799 16.4855C4.2795 15.1247 3.76026 13.2805 3.76026 10.9528C3.76026 9.01908 4.2616 7.3002 5.26428 5.79618C6.26695 4.25635 7.68145 3.05672 9.50776 2.19728C11.3341 1.33784 13.4289 0.908122 15.7924 0.908122C19.266 0.908122 22.0591 1.76756 24.1719 3.48644C26.3205 5.16951 27.556 7.35391 27.8783 10.0397H23.7959C23.5453 8.49983 22.7037 7.13905 21.2713 5.95733C19.8389 4.73979 17.9052 4.13102 15.4701 4.13102C13.2141 4.13102 11.3341 4.73979 9.83005 5.95733C8.32603 7.13905 7.57402 8.76841 7.57402 10.8454C7.57402 12.421 7.98583 13.6923 8.80946 14.6591C9.63309 15.626 10.6537 16.3601 11.8712 16.8615C13.1246 17.3628 14.8076 17.8999 16.9204 18.4729C19.3555 19.1533 21.325 19.8337 22.8291 20.5141C24.3331 21.1587 25.6043 22.1613 26.6428 23.5221C27.6813 24.8829 28.2006 26.7092 28.2006 29.001C28.2006 30.7557 27.735 32.4209 26.804 33.9965C25.8729 35.5722 24.4942 36.8434 22.6679 37.8103C20.8416 38.7772 18.6572 39.2606 16.1147 39.2606ZM35.4663 4.39959V18.4192H49.7008V21.5347H35.4663V35.7691H51.3122V38.8846H31.7063V1.28413H51.3122V4.39959H35.4663ZM72.311 1.33784V29.753C72.311 32.6178 71.4337 34.9276 69.679 36.6823C67.9243 38.4011 65.5787 39.2606 62.6423 39.2606C59.5985 39.2606 57.1634 38.3474 55.3371 36.5211C53.5466 34.659 52.6513 32.1523 52.6513 29.001H56.4651C56.5009 31.0422 57.0022 32.7074 57.9691 33.9965C58.9718 35.2857 60.5295 35.9303 62.6423 35.9303C64.6477 35.9303 66.1338 35.3394 67.1007 34.1577C68.0675 32.9759 68.551 31.5077 68.551 29.753V1.33784H72.311ZM99.7606 29.9679H82.6792L79.4026 38.8846H75.4277L89.125 1.82127H93.3685L107.012 38.8846H103.037L99.7606 29.9679ZM98.6326 26.8524L91.2199 6.54819L83.8073 26.8524H98.6326Z" fill="white" />
        <path d="M137.78 39L135.739 32.8228H122.311L120.269 39H109.204L123.009 1.13094H135.148L148.899 39H137.78ZM133.107 24.7655L129.025 12.5185L124.996 24.7655H133.107Z" fill="white" />
        <path d="M151.177 17.8363H158.829C161.998 17.8363 163.287 16.2248 163.287 13.7539C163.287 11.2293 161.998 9.6179 158.829 9.6179H151.177V17.8363ZM170.568 13.7539C170.568 20.3609 166.002 26.2158 156.387 26.2158H151.177V39H148.899L135.148 1.13094H156.387C165.787 1.13094 170.568 6.44872 170.568 13.7539Z" fill="white" />
        <path d="M137.78 39L135.739 32.8228H122.311L120.269 39H109.204L123.009 1.13094H135.148L148.899 39H137.78ZM133.107 24.7655L129.025 12.5185L124.996 24.7655H133.107Z" fill="url(#paint0_linear_91_159)" />
        <path d="M171.346 0.908325H162.392C168.094 2.70836 170.053 4.85787 171.346 10.6416V0.908325Z" fill="url(#paint1_linear_91_159)" />
        <defs>
            <linearGradient id="paint0_linear_91_159" x1="123.502" y1="20.0655" x2="148.899" y2="20.0655" gradientUnits="userSpaceOnUse"><stop stop-color="#E6C969" /><stop offset="1" stop-color="#705829" /></linearGradient>
            <linearGradient id="paint1_linear_91_159" x1="165.617" y1="5.77496" x2="171.346" y2="5.77496" gradientUnits="userSpaceOnUse"><stop stop-color="#E6C969" /><stop offset="1" stop-color="#705829" /></linearGradient>
        </defs>
    </svg>
);

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Estados
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const nextPath = useMemo(() => {
        const next = searchParams.get('next');
        return (next && next.startsWith('/')) ? next : '/dashboard';
    }, [searchParams]);

    const canSubmit = identifier.trim().length > 0 && password.length > 0 && !loading;

    // Função para simular delay
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const onSubmit = async () => {
        setErrorMsg(null);
        setLoading(true);

        try {
            const loginPromise = fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password }),
            });

            const [res] = await Promise.all([loginPromise, sleep(3000)]);
            const data = await res.json().catch(() => ({}));

            // ✅ validação correta baseada na sua API real
            if (!res.ok || !data?.token || !data?.user?.id) {
                setErrorMsg(data?.message || "Acesso negado.");
                setLoading(false);
                return;
            }

            const u = data.user;

            // 🔐 Token
            localStorage.setItem("sejaap_access", data.token);

            // 👤 Usuário completo
            localStorage.setItem("sejaap_user", JSON.stringify(u));

            // Campos separados (opcional)
            localStorage.setItem("sejaap_user_id", String(u.id));
            localStorage.setItem("sejaap_is_active", JSON.stringify(!!u.is_active));
            localStorage.setItem("sejaap_is_staff", JSON.stringify(!!u.is_staff));
            localStorage.setItem("sejaap_is_superuser", JSON.stringify(!!u.is_superuser));
            localStorage.setItem("sejaap_last_login", String(u.last_login ?? ""));
            localStorage.setItem("sejaap_client_id", String(u.client_id ?? ""));

            // Objeto completo (melhor prática)
            localStorage.setItem('sejaap_user', JSON.stringify(u));

            // Redireciona
            router.replace(nextPath);

        } catch (err: any) {
            setErrorMsg(err?.message || 'Falha na comunicação com o servidor.');
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            bgcolor: DARK_BG
        }}>

            {/* LADO ESQUERDO: Branding e Frase */}
            <Box
                sx={{
                    flex: 1.2,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                    background: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    p: 4,
                    textAlign: 'center',
                    borderRight: { md: `1px solid rgba(230, 201, 105, 0.15)` }
                }}
            >
                <EAPLogo />
                <Typography
                    variant="h6"
                    sx={{
                        mt: 3,
                        color: GOLD_MAIN,
                        fontWeight: 300,
                        letterSpacing: 6,
                        textTransform: 'uppercase',
                        fontSize: { xs: '0.75rem', md: '0.9rem' },
                        opacity: 0.9
                    }}
                >
                    Nosso negócio é evoluir o seu
                </Typography>
            </Box>

            {/* LADO DIREITO: Formulário de Login */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    px: { xs: 4, lg: 10 },
                    py: 8,
                    bgcolor: DARK_BG
                }}
            >
                <Box sx={{ maxWidth: 450, width: '100%', mx: 'auto' }}>
                    <Stack spacing={1} sx={{ mb: 6 }}>
                        <Typography variant="h4" sx={{ color: '#fff', fontWeight: 800, letterSpacing: -1 }}>
                            Bem-vindo de volta!
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 300 }}>
                            Insira suas credenciais para acessar o painel de alta performance.
                        </Typography>
                    </Stack>

                    {errorMsg && (
                        <Alert
                            severity="error"
                            variant="outlined"
                            sx={{
                                mb: 4,
                                borderRadius: 0,
                                borderColor: 'rgba(211, 47, 47, 0.5)',
                                color: '#ffcdd2',
                                bgcolor: 'rgba(211, 47, 47, 0.05)'
                            }}
                        >
                            {errorMsg}
                        </Alert>
                    )}

                    <Stack spacing={4}>
                        <TextField
                            label="E-mail ou Usuário"
                            variant="standard"
                            fullWidth
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            disabled={loading}
                            InputLabelProps={{
                                sx: { color: 'rgba(255,255,255,0.3)', '&.Mui-focused': { color: GOLD_MAIN } }
                            }}
                            sx={{
                                '& .MuiInput-underline:before': { borderBottomColor: 'rgba(255,255,255,0.1)' },
                                '& .MuiInput-underline:hover:before': { borderBottomColor: 'rgba(255,255,255,0.3) !important' },
                                '& .MuiInput-underline:after': { borderBottomColor: GOLD_MAIN },
                                '& input': { color: '#fff', py: 1.5, fontSize: '1.1rem' }
                            }}
                        />

                        <TextField
                            label="Senha"
                            type={showPass ? 'text' : 'password'}
                            variant="standard"
                            fullWidth
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && canSubmit && onSubmit()}
                            disabled={loading}
                            InputLabelProps={{
                                sx: { color: 'rgba(255,255,255,0.3)', '&.Mui-focused': { color: GOLD_MAIN } }
                            }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPass(!showPass)}
                                            sx={{ color: 'rgba(255,255,255,0.2)' }}
                                            edge="end"
                                        >
                                            {showPass ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiInput-underline:before': { borderBottomColor: 'rgba(255,255,255,0.1)' },
                                '& .MuiInput-underline:hover:before': { borderBottomColor: 'rgba(255,255,255,0.3) !important' },
                                '& .MuiInput-underline:after': { borderBottomColor: GOLD_MAIN },
                                '& input': { color: '#fff', py: 1.5, fontSize: '1.1rem' }
                            }}
                        />

                        <Button
                            fullWidth
                            size="large"
                            variant="contained"
                            disabled={!canSubmit}
                            onClick={onSubmit}
                            sx={{
                                mt: 4,
                                py: 2.2,
                                borderRadius: 0,
                                fontWeight: 800,
                                letterSpacing: 3,
                                textTransform: 'uppercase',
                                background: GOLD_GRADIENT,
                                color: '#000',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                    filter: 'brightness(1.1) saturate(1.2)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: `0 8px 25px rgba(230, 201, 105, 0.2)`
                                },
                                '&:disabled': {
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'rgba(255,255,255,0.1)'
                                }
                            }}
                        >
                            {loading ? (
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <CircularProgress size={20} sx={{ color: '#000' }} thickness={6} />
                                    <Typography variant="button" sx={{ fontWeight: 800 }}>Autenticando...</Typography>
                                </Stack>
                            ) : (
                                'Entrar na Plataforma'
                            )}
                        </Button>
                    </Stack>

                    <Typography
                        variant="caption"
                        sx={{
                            display: 'block',
                            mt: 8,
                            color: 'rgba(255,255,255,0.2)',
                            textAlign: 'center',
                            fontWeight: 300
                        }}
                    >
                        © 2026 EAP - Empresas de Alta Performance.<br />
                        Selo EAP - Método FUL.
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}