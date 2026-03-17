'use client';

import React, { useState } from 'react';
import Swal from 'sweetalert2';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    TextField,
    Typography,
    IconButton,
    InputAdornment,
    CircularProgress,
    alpha,
} from '@mui/material';

import {
    Close as CloseIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    LockReset as LockResetIcon,
} from '@mui/icons-material';

import services from '@/services/service';
import { AlertType } from '@/components/AppAlert';

const GOLD_PRIMARY = '#B8860B';
const GOLD_LIGHT = '#DAA520';
const CHARCOAL = '#2C2C2C';
const GRAY_MAIN = '#757575';
const BORDER_LIGHT = 'rgba(0, 0, 0, 0.08)';

function pickApiError(data: any): string {
    if (!data) return 'Erro inesperado.';
    if (typeof data === 'string') return data;
    if (typeof data?.details === 'string') return data.details;
    if (typeof data?.error === 'string') return data.error;
    if (typeof data?.detail === 'string') return data.detail;
    return 'Falha ao processar a requisição.';
}

type ChangePasswordModalProps = {
    open: boolean;
    onClose: () => void;
    userId: string | null | undefined;
    showAlert: (message: string, severity: AlertType) => void;
};

export default function ChangePasswordModal({
    open,
    onClose,
    userId,
    showAlert,
}: ChangePasswordModalProps) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const resetForm = () => {
        setPassword('');
        setConfirmPassword('');
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    const handleClose = () => {
        if (saving) return;
        resetForm();
        onClose();
    };

    const handleSubmit = async () => {

     


        if (!userId) {
            showAlert('Usuário inválido para alteração de senha.', 'error');
            return;
        }

        if (!password || !confirmPassword) {
            showAlert('Preencha os dois campos de senha.', 'warning');
            return;
        }

        if (password.length < 6) {
            showAlert('A senha deve ter pelo menos 6 caracteres.', 'warning');
            return;
        }

        if (password !== confirmPassword) {
            showAlert('A confirmação de senha não confere.', 'warning');
            return;
        }

        const result = await Swal.fire({
            title: 'Trocar senha?',
            text: 'A senha do usuário será atualizada.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sim, atualizar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: GOLD_PRIMARY,
            cancelButtonColor: GRAY_MAIN,
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        setSaving(true);


        const res = await services(`/users/${encodeURIComponent(userId)}`, {
            method: 'PUT',
            data: {
                password,
            },
        });

        setSaving(false);

        if (!res.success) {
            showAlert(pickApiError(res.data), 'error');
            return;
        }

        showAlert('Senha atualizada com sucesso.', 'success');
        resetForm();
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    border: `1px solid ${BORDER_LIGHT}`,
                },
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <LockResetIcon sx={{ color: GOLD_PRIMARY }} />
                        <Typography sx={{ fontWeight: 800, color: CHARCOAL, fontSize: '1.1rem' }}>
                            Trocar Senha do Usuário
                        </Typography>
                    </Stack>

                    <IconButton onClick={handleClose} disabled={saving}>
                        <CloseIcon />
                    </IconButton>
                </Stack>
            </DialogTitle>

            <DialogContent dividers sx={{ borderColor: BORDER_LIGHT }}>
                <Stack spacing={2.5} sx={{ mt: 1 }}>
                    <Typography sx={{ color: GRAY_MAIN, fontSize: '0.9rem' }}>
                        Digite a nova senha e confirme para atualizar o acesso do usuário.
                    </Typography>

                    <TextField
                        label="Nova senha"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        fullWidth
                        disabled={saving}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                        disabled={saving}
                                    >
                                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <TextField
                        label="Confirmar nova senha"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        fullWidth
                        disabled={saving}
                        error={!!confirmPassword && password !== confirmPassword}
                        helperText={
                            !!confirmPassword && password !== confirmPassword
                                ? 'As senhas precisam ser iguais.'
                                : ' '
                        }
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        edge="end"
                                        disabled={saving}
                                    >
                                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button
                    onClick={handleClose}
                    disabled={saving}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        color: CHARCOAL,
                    }}
                >
                    Cancelar
                </Button>

                <Button
                    onClick={handleSubmit}
                    disabled={saving}
                    variant="contained"
                    disableElevation
                    startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <LockResetIcon />}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        borderRadius: 2,
                        bgcolor: GOLD_PRIMARY,
                        '&:hover': {
                            bgcolor: GOLD_LIGHT,
                        },
                        '&.Mui-disabled': {
                            bgcolor: alpha(GOLD_PRIMARY, 0.3),
                            color: '#fff',
                        },
                    }}
                >
                    {saving ? 'Atualizando...' : 'Atualizar senha'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}