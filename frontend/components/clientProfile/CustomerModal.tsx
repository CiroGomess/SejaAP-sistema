'use client';

import React, { useMemo } from 'react';

import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    Divider,
    Grid,
    MenuItem,
    TextField,
    Typography,
    Stack,
    alpha,
    InputAdornment,
    Chip,
    Paper,
    Avatar,
    Fade,
    FormControlLabel,
    Switch,
} from '@mui/material';

import {
    Person as PersonIcon,
    Business as BusinessIcon,
    LocationOn as LocationIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    WhatsApp as WhatsAppIcon,
    Badge as BadgeIcon,
    Numbers as NumbersIcon,
    Notes as NotesIcon,
    Flag as FlagIcon,
    Home as HomeIcon,
    Security as SecurityIcon,
    Key as KeyIcon,
} from '@mui/icons-material';

// --- PALETA DE CORES EAP (Refinada) ---
const GOLD_PRIMARY = '#B8860B';
const GOLD_LIGHT = '#DAA520';
const GOLD_MAIN = '#E6C969';
const DARK_BG = '#1A1A1A';
const CHARCOAL = '#2C2C2C';
const GRAY_MAIN = '#757575';
const GRAY_LIGHT = '#F5F5F7';
const WHITE = '#FFFFFF';
const BORDER_LIGHT = 'rgba(0, 0, 0, 0.08)';
const BORDER_FOCUS = 'rgba(184, 134, 11, 0.3)';

/* =======================
   VALIDAÇÕES
======================= */
function onlyNumbers(v: string) {
    return (v || '').replace(/\D/g, '');
}

function validateCPF(cpf: string) {
    const clean = onlyNumbers(cpf);

    if (clean.length !== 11) return false;
    if (/^(\d)\1+$/.test(clean)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i += 1) {
        sum += parseInt(clean.charAt(i), 10) * (10 - i);
    }

    let rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(clean.charAt(9), 10)) return false;

    sum = 0;
    for (let i = 0; i < 10; i += 1) {
        sum += parseInt(clean.charAt(i), 10) * (11 - i);
    }

    rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;

    return rev === parseInt(clean.charAt(10), 10);
}

function validateCNPJ(cnpj: string) {
    const clean = onlyNumbers(cnpj);

    if (clean.length !== 14) return false;
    if (/^(\d)\1+$/.test(clean)) return false;

    const calc = (base: string, factors: number[]) => {
        let sum = 0;
        for (let i = 0; i < factors.length; i += 1) {
            sum += parseInt(base.charAt(i), 10) * factors[i];
        }
        const rest = sum % 11;
        return rest < 2 ? 0 : 11 - rest;
    };

    const base12 = clean.substring(0, 12);
    const digit1 = calc(base12, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    const base13 = `${base12}${digit1}`;
    const digit2 = calc(base13, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

    return clean === `${base12}${digit1}${digit2}`;
}

function validateDocument(doc: string) {
    const clean = onlyNumbers(doc);

    if (clean.length === 11) return validateCPF(clean);
    if (clean.length === 14) return validateCNPJ(clean);

    return false;
}

function validatePhone(phone: string) {
    const clean = onlyNumbers(phone);
    return clean.length === 10 || clean.length === 11;
}

function validateEmail(email: string) {
    const value = String(email || '').trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateUF(state: string) {
    return /^[A-Z]{2}$/.test(String(state || '').trim().toUpperCase());
}

function validateCEP(cep: string) {
    return onlyNumbers(cep).length === 8;
}

/* =======================
   Tipos
======================= */
export type CustomerStatus = 'active' | 'pending' | 'inactive';

export type Customer = {
    code: string;
    first_name: string;
    last_name: string;
    email: string;
    document: string;
    phone: string;
    is_whatsapp: boolean;
    status: CustomerStatus;
    company_name?: string | null;
    notes?: string | null;
    IPCA?: number | null;
    cep?: string | null;
    street?: string | null;
    number?: string | null;
    complement?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
    created_at?: string;
    updated_at?: string;
};

export type UserForm = {
    username: string;
    password: string;
    email: string;
    first_name: string;
    last_name: string;
    is_superuser: boolean;
    is_staff: boolean;
    is_active: boolean;
};

export type CustomerForm = {
    first_name: string;
    last_name: string;
    email: string;
    document: string;
    phone: string;
    is_whatsapp: boolean;
    status: CustomerStatus;
    company_name: string;
    notes: string;
    IPCA: string;
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    user?: UserForm;
};

type Props = {
    open: boolean;
    editing: Customer | null;
    form: CustomerForm;
    saving: boolean;
    onClose: () => void;
    onSave: () => void;
    onChange: (patch: Partial<CustomerForm>) => void;
};

// Estilo refinado para inputs
const inputSx = {
    '& .MuiOutlinedInput-root': {
        backgroundColor: WHITE,
        borderRadius: 2,
        transition: 'all 0.2s ease-in-out',
        '& fieldset': {
            borderColor: BORDER_LIGHT,
            borderWidth: '1.5px',
        },
        '&:hover fieldset': {
            borderColor: GOLD_LIGHT,
        },
        '&.Mui-focused fieldset': {
            borderColor: GOLD_PRIMARY,
            borderWidth: '2px',
            boxShadow: `0 0 0 4px ${BORDER_FOCUS}`,
        },
        '& .MuiInputBase-input': {
            color: CHARCOAL,
            fontWeight: 500,
            fontSize: '0.95rem',
            padding: '14px 16px',
        },
    },
    '& .MuiInputLabel-root': {
        color: GRAY_MAIN,
        fontWeight: 500,
        fontSize: '0.95rem',
        '&.Mui-focused': {
            color: GOLD_PRIMARY,
            fontWeight: 600,
        },
    },
    '& .MuiFormHelperText-root': {
        color: GRAY_MAIN,
        fontSize: '0.75rem',
        marginLeft: '4px',
        marginTop: '4px',
    },
};

// Componente para cabeçalhos de seção
const SectionHeader = ({
    title,
    subtitle,
    icon,
}: {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
}) => (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Avatar
            sx={{
                width: 44,
                height: 44,
                bgcolor: alpha(GOLD_PRIMARY, 0.1),
                color: GOLD_PRIMARY,
                borderRadius: 2,
            }}
        >
            {icon}
        </Avatar>
        <Box>
            <Typography
                sx={{
                    fontWeight: 700,
                    color: CHARCOAL,
                    fontSize: '1.1rem',
                    letterSpacing: '-0.02em',
                }}
            >
                {title}
            </Typography>
            <Typography
                sx={{
                    color: GRAY_MAIN,
                    fontSize: '0.85rem',
                    mt: 0.3,
                    fontWeight: 400,
                }}
            >
                {subtitle}
            </Typography>
        </Box>
    </Stack>
);

// Campo com ícone
const IconTextField = ({ icon, label, value, onChange, ...props }: any) => (
    <TextField
        label={label}
        value={value}
        onChange={onChange}
        fullWidth
        InputProps={{
            startAdornment: (
                <InputAdornment position="start">
                    <Box sx={{ color: GOLD_PRIMARY, display: 'flex', alignItems: 'center' }}>{icon}</Box>
                </InputAdornment>
            ),
        }}
        sx={inputSx}
        {...props}
    />
);

export default function CustomerModal({
    open,
    editing,
    form,
    saving,
    onClose,
    onSave,
    onChange,
}: Props) {
    const isCreateMode = !editing;

    const safeUser: UserForm = useMemo(
        () => ({
            username: form?.user?.username || '',
            password: form?.user?.password || '',
            email: form?.email || '',
            first_name: form?.first_name || '',
            last_name: form?.last_name || '',
            is_superuser: !!form?.user?.is_superuser,
            is_staff: !!form?.user?.is_staff,
            is_active: form?.user?.is_active === false ? false : true,
        }),
        [form?.user, form?.email, form?.first_name, form?.last_name]
    );

    function patchUser(patch: Partial<UserForm>) {
        onChange({
            user: {
                ...safeUser,
                ...patch,
            },
        });
    }

    React.useEffect(() => {
        if (isCreateMode && safeUser) {
            patchUser({
                email: form.email,
                first_name: form.first_name,
                last_name: form.last_name,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.email, form.first_name, form.last_name, isCreateMode]);

    const headerSubtitle = editing
        ? `ID: ${editing.code} • Última atualização: ${
              editing.updated_at ? new Date(editing.updated_at).toLocaleDateString('pt-BR') : '-'
          }`
        : 'Preencha os dados abaixo para cadastrar um novo cliente';

    // Validações
    const invalidEmail = !!form.email?.trim() && !validateEmail(form.email);
    const invalidDocument = !!form.document?.trim() && !validateDocument(form.document);
    const invalidPhone = !!form.phone?.trim() && !validatePhone(form.phone);
    const invalidCEP = !!form.cep?.trim() && !validateCEP(form.cep);
    const invalidUF = !!form.state?.trim() && !validateUF(form.state);

    // Obrigatórios
    const missingPersonalRequired =
        !form.first_name?.trim() ||
        !form.last_name?.trim() ||
        !form.email?.trim() ||
        !form.document?.trim() ||
        !form.phone?.trim() ||
        !form.status?.trim();

    const missingAddressRequired =
        !form.cep?.trim() ||
        !form.street?.trim() ||
        !form.number?.trim() ||
        !form.neighborhood?.trim() ||
        !form.city?.trim() ||
        !form.state?.trim();

    const missingSystemAccessRequired =
        isCreateMode &&
        (!safeUser.username?.trim() || !safeUser.password?.trim());

    const hasValidationErrors =
        invalidEmail ||
        invalidDocument ||
        invalidPhone ||
        invalidCEP ||
        invalidUF;

    const disableSave =
        saving ||
        missingPersonalRequired ||
        missingAddressRequired ||
        !!missingSystemAccessRequired ||
        hasValidationErrors;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="lg"
            TransitionComponent={Fade}
            transitionDuration={300}
            PaperProps={{
                sx: {
                    width: '90vw',
                    maxWidth: '1400px',
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 1)',
                    bgcolor: GRAY_LIGHT,
                },
            }}
        >
            {/* Header */}
            <Box sx={{ background: DARK_BG, px: 4, py: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography
                            sx={{
                                fontWeight: 800,
                                color: GOLD_MAIN,
                                fontSize: '1.8rem',
                                letterSpacing: '-0.02em',
                                lineHeight: 1.2,
                            }}
                        >
                            {editing ? 'Editar Cliente' : 'Novo Cliente'}
                        </Typography>
                        <Typography
                            sx={{
                                mt: 0.5,
                                color: alpha(WHITE, 0.7),
                                fontSize: '0.95rem',
                                fontWeight: 400,
                            }}
                        >
                            {headerSubtitle}
                        </Typography>
                    </Box>

                    {editing && (
                        <Chip
                            label="MODO EDIÇÃO"
                            size="small"
                            sx={{
                                bgcolor: alpha(GOLD_MAIN, 0.15),
                                color: GOLD_MAIN,
                                fontWeight: 700,
                                borderRadius: 1.5,
                                border: `1px solid ${alpha(GOLD_MAIN, 0.3)}`,
                                backdropFilter: 'blur(4px)',
                            }}
                        />
                    )}
                </Stack>
            </Box>

            <DialogContent
                sx={{
                    p: 3,
                    '&::-webkit-scrollbar': { width: '8px' },
                    '&::-webkit-scrollbar-thumb': {
                        background: alpha(GRAY_MAIN, 0.3),
                        borderRadius: '4px',
                    },
                }}
            >
                {/* === SEÇÃO 1: DADOS PESSOAIS === */}
                <Paper
                    elevation={0}
                    sx={{ p: 3, mb: 3, borderRadius: 2, border: `1px solid ${BORDER_LIGHT}` }}
                >
                    <SectionHeader
                        title="Dados Pessoais"
                        subtitle="Informações básicas do cliente"
                        icon={<PersonIcon />}
                    />

                    <Grid container spacing={2.5}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <IconTextField
                                icon={<BadgeIcon />}
                                label="Nome *"
                                value={form.first_name}
                                onChange={(e: any) => onChange({ first_name: e.target.value })}
                                autoFocus
                                required
                                error={!form.first_name?.trim()}
                                helperText={!form.first_name?.trim() ? 'Nome é obrigatório' : ' '}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <IconTextField
                                icon={<BadgeIcon />}
                                label="Sobrenome *"
                                value={form.last_name}
                                onChange={(e: any) => onChange({ last_name: e.target.value })}
                                required
                                error={!form.last_name?.trim()}
                                helperText={!form.last_name?.trim() ? 'Sobrenome é obrigatório' : ' '}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <IconTextField
                                icon={<EmailIcon />}
                                label="E-mail *"
                                value={form.email}
                                onChange={(e: any) => onChange({ email: e.target.value })}
                                type="email"
                                required
                                error={!form.email?.trim() || invalidEmail}
                                helperText={
                                    !form.email?.trim()
                                        ? 'E-mail é obrigatório'
                                        : invalidEmail
                                          ? 'Digite um e-mail válido'
                                          : ' '
                                }
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <IconTextField
                                icon={<NumbersIcon />}
                                label="CPF/CNPJ *"
                                value={form.document}
                                onChange={(e: any) => onChange({ document: e.target.value })}
                                required
                                error={!form.document?.trim() || invalidDocument}
                                helperText={
                                    !form.document?.trim()
                                        ? 'CPF/CNPJ é obrigatório'
                                        : invalidDocument
                                          ? 'CPF ou CNPJ inválido'
                                          : 'Digite CPF (11) ou CNPJ (14)'
                                }
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <IconTextField
                                icon={<PhoneIcon />}
                                label="Telefone *"
                                value={form.phone}
                                onChange={(e: any) => onChange({ phone: e.target.value })}
                                required
                                error={!form.phone?.trim() || invalidPhone}
                                helperText={
                                    !form.phone?.trim()
                                        ? 'Telefone é obrigatório'
                                        : invalidPhone
                                          ? 'Telefone inválido'
                                          : '(DDD) 00000-0000'
                                }
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                select
                                label="WhatsApp"
                                value={form.is_whatsapp ? 'yes' : 'no'}
                                onChange={(e: any) =>
                                    onChange({ is_whatsapp: e.target.value === 'yes' })
                                }
                                fullWidth
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <WhatsAppIcon
                                                sx={{
                                                    color: form.is_whatsapp ? '#25D366' : GRAY_MAIN,
                                                }}
                                            />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={inputSx}
                                helperText=" "
                            >
                                <MenuItem value="yes">Sim, este número tem WhatsApp</MenuItem>
                                <MenuItem value="no">
                                    Não, apenas telefone convencional
                                </MenuItem>
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                select
                                label="Status *"
                                value={form.status}
                                onChange={(e: any) =>
                                    onChange({ status: e.target.value as CustomerStatus })
                                }
                                fullWidth
                                required
                                error={!form.status?.trim()}
                                helperText={!form.status?.trim() ? 'Status é obrigatório' : ' '}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <FlagIcon
                                                sx={{
                                                    color:
                                                        form.status === 'active'
                                                            ? '#10B981'
                                                            : form.status === 'pending'
                                                              ? '#F59E0B'
                                                              : '#EF4444',
                                                }}
                                            />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={inputSx}
                            >
                                <MenuItem
                                    value="active"
                                    sx={{ color: '#10B981', fontWeight: 600 }}
                                >
                                    Ativo
                                </MenuItem>
                                <MenuItem
                                    value="pending"
                                    sx={{ color: '#F59E0B', fontWeight: 600 }}
                                >
                                    Pendente
                                </MenuItem>
                                <MenuItem
                                    value="inactive"
                                    sx={{ color: '#EF4444', fontWeight: 600 }}
                                >
                                    Inativo
                                </MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>
                </Paper>

                {/* === SEÇÃO 2: DADOS CORPORATIVOS === */}
                <Paper
                    elevation={0}
                    sx={{ p: 3, mb: 3, borderRadius: 2, border: `1px solid ${BORDER_LIGHT}` }}
                >
                    <SectionHeader
                        title="Dados Corporativos"
                        subtitle="Informações da empresa e financeiro"
                        icon={<BusinessIcon />}
                    />

                    <Grid container spacing={2.5}>
                        <Grid size={{ xs: 12, md: 8 }}>
                            <IconTextField
                                icon={<BusinessIcon />}
                                label="Razão Social / Nome da Empresa"
                                value={form.company_name}
                                onChange={(e: any) => onChange({ company_name: e.target.value })}
                                helperText="Opcional, preencha se for pessoa jurídica"
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                label="IPCA Vinculado"
                                value={form.IPCA}
                                onChange={(e: any) => onChange({ IPCA: e.target.value })}
                                fullWidth
                                placeholder="0,00"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <NumbersIcon sx={{ color: GOLD_PRIMARY }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Typography
                                                sx={{ fontWeight: 600, color: GRAY_MAIN }}
                                            >
                                                %
                                            </Typography>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={inputSx}
                                helperText=" "
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Observações"
                                value={form.notes}
                                onChange={(e: any) => onChange({ notes: e.target.value })}
                                fullWidth
                                multiline
                                rows={3}
                                placeholder="Anotações importantes sobre o cliente, histórico de negociação, etc."
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment
                                            position="start"
                                            sx={{ alignSelf: 'flex-start', mt: 1.5 }}
                                        >
                                            <NotesIcon sx={{ color: GOLD_PRIMARY }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={inputSx}
                                helperText=" "
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* === SEÇÃO 3: ENDEREÇO === */}
                <Paper
                    elevation={0}
                    sx={{ p: 3, mb: 3, borderRadius: 2, border: `1px solid ${BORDER_LIGHT}` }}
                >
                    <SectionHeader
                        title="Endereço"
                        subtitle="Localização para faturamento e correspondência"
                        icon={<LocationIcon />}
                    />

                    <Grid container spacing={2.5}>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <IconTextField
                                icon={<NumbersIcon />}
                                label="CEP *"
                                value={form.cep}
                                onChange={(e: any) => onChange({ cep: e.target.value })}
                                placeholder="01001000"
                                required
                                error={!form.cep?.trim() || invalidCEP}
                                helperText={
                                    !form.cep?.trim()
                                        ? 'CEP é obrigatório'
                                        : invalidCEP
                                          ? 'CEP inválido'
                                          : 'Use 8 dígitos (sem hífen)'
                                }
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 7 }}>
                            <IconTextField
                                icon={<HomeIcon />}
                                label="Logradouro *"
                                value={form.street}
                                onChange={(e: any) => onChange({ street: e.target.value })}
                                required
                                error={!form.street?.trim()}
                                helperText={!form.street?.trim() ? 'Logradouro é obrigatório' : ' '}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 2 }}>
                            <TextField
                                label="Número *"
                                value={form.number}
                                onChange={(e: any) => onChange({ number: e.target.value })}
                                fullWidth
                                required
                                error={!form.number?.trim()}
                                helperText={!form.number?.trim() ? 'Número é obrigatório' : ' '}
                                sx={inputSx}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 5 }}>
                            <TextField
                                label="Complemento"
                                value={form.complement}
                                onChange={(e: any) => onChange({ complement: e.target.value })}
                                fullWidth
                                placeholder="Apto, Sala, Bloco..."
                                sx={inputSx}
                                helperText=" "
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                label="Bairro *"
                                value={form.neighborhood}
                                onChange={(e: any) =>
                                    onChange({ neighborhood: e.target.value })
                                }
                                fullWidth
                                required
                                error={!form.neighborhood?.trim()}
                                helperText={
                                    !form.neighborhood?.trim()
                                        ? 'Bairro é obrigatório'
                                        : ' '
                                }
                                sx={inputSx}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }}>
                            <TextField
                                label="Cidade *"
                                value={form.city}
                                onChange={(e: any) => onChange({ city: e.target.value })}
                                fullWidth
                                required
                                error={!form.city?.trim()}
                                helperText={!form.city?.trim() ? 'Cidade é obrigatória' : ' '}
                                sx={inputSx}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 2 }}>
                            <TextField
                                label="UF *"
                                value={form.state}
                                onChange={(e: any) =>
                                    onChange({
                                        state: (e.target.value || '').toUpperCase(),
                                    })
                                }
                                fullWidth
                                required
                                placeholder="SP"
                                inputProps={{
                                    maxLength: 2,
                                    style: { textTransform: 'uppercase' },
                                }}
                                error={!form.state?.trim() || invalidUF}
                                helperText={
                                    !form.state?.trim()
                                        ? 'UF é obrigatória'
                                        : invalidUF
                                          ? 'UF inválida'
                                          : '2 letras (ex: SP)'
                                }
                                sx={inputSx}
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* === SEÇÃO 4: USUÁRIO DE ACESSO AO SISTEMA === */}
                {isCreateMode && (
                    <Paper
                        elevation={0}
                        sx={{ p: 3, borderRadius: 2, border: `1px solid ${BORDER_LIGHT}` }}
                    >
                        <SectionHeader
                            title="Acesso ao Sistema"
                            subtitle="Credenciais para login do cliente"
                            icon={<SecurityIcon />}
                        />

                        <Grid container spacing={2.5}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <IconTextField
                                    icon={<PersonIcon />}
                                    label="Username *"
                                    value={safeUser.username}
                                    onChange={(e: any) =>
                                        patchUser({ username: e.target.value })
                                    }
                                    helperText={
                                        !safeUser.username?.trim()
                                            ? 'Username é obrigatório'
                                            : 'Ex: mariana.cli01'
                                    }
                                    error={!safeUser.username?.trim()}
                                    required
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <IconTextField
                                    icon={<KeyIcon />}
                                    label="Senha *"
                                    value={safeUser.password}
                                    onChange={(e: any) =>
                                        patchUser({ password: e.target.value })
                                    }
                                    type="password"
                                    helperText={
                                        !safeUser.password?.trim()
                                            ? 'Senha é obrigatória'
                                            : 'Obrigatório no cadastro'
                                    }
                                    error={!safeUser.password?.trim()}
                                    required
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={safeUser.is_active}
                                            onChange={(e) =>
                                                patchUser({ is_active: e.target.checked })
                                            }
                                        />
                                    }
                                    label="Usuário Ativo"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={safeUser.is_staff}
                                            onChange={(e) =>
                                                patchUser({ is_staff: e.target.checked })
                                            }
                                        />
                                    }
                                    label="Staff"
                                />
                            </Grid>

                            {/* <Grid size={{ xs: 12, md: 4 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={safeUser.is_superuser}
                                            onChange={(e) =>
                                                patchUser({ is_superuser: e.target.checked })
                                            }
                                        />
                                    }
                                    label="Super Admin"
                                />
                            </Grid> */}

                            <input type="hidden" value={form.email} />
                            <input type="hidden" value={form.first_name} />
                            <input type="hidden" value={form.last_name} />
                        </Grid>
                    </Paper>
                )}
            </DialogContent>

            <Divider sx={{ borderColor: BORDER_LIGHT }} />

            {/* Footer */}
            <DialogActions sx={{ p: 3, bgcolor: WHITE }}>
                <Stack direction="row" spacing={2} justifyContent="flex-end" width="100%">
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: 2,
                            px: 4,
                            py: 1,
                            borderColor: BORDER_LIGHT,
                            color: GRAY_MAIN,
                            '&:hover': {
                                borderColor: GRAY_MAIN,
                                bgcolor: GRAY_LIGHT,
                            },
                        }}
                    >
                        Cancelar
                    </Button>

                    <Button
                        onClick={onSave}
                        variant="contained"
                        disabled={disableSave}
                        disableElevation
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: 2,
                            px: 5,
                            py: 1,
                            bgcolor: GOLD_PRIMARY,
                            color: WHITE,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                bgcolor: GOLD_LIGHT,
                                transform: 'translateY(-1px)',
                                boxShadow: `0 4px 12px ${alpha(GOLD_PRIMARY, 0.3)}`,
                            },
                            '&.Mui-disabled': {
                                bgcolor: alpha(GOLD_PRIMARY, 0.3),
                                color: alpha(WHITE, 0.7),
                            },
                        }}
                    >
                        {saving ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                    </Button>
                </Stack>
            </DialogActions>
        </Dialog>
    );
}