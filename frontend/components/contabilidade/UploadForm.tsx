'use client';

import React, { useState } from 'react';
import {
    Paper,
    Grid,
    TextField,
    MenuItem,
    Button,
    Tooltip,
    alpha,
    Stack,
    Typography,
    Avatar,
    Divider,
    Fade,
    Zoom,
    Box
} from '@mui/material';
import {
    UploadFile as UploadFileIcon,
    CalendarMonth as CalendarIcon,
    Category as CategoryIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

interface UploadFormProps {
    ano: string;
    setAno: (value: string) => void;
    categoria: string;
    setCategoria: (value: string) => void;
    onUpload: (file: File) => void;
    disabled?: boolean;
}

export default function UploadForm({
    ano,
    setAno,
    categoria,
    setCategoria,
    onUpload,
    disabled,
}: UploadFormProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileSelected, setFileSelected] = useState(false);

    const categorias = [
        { value: 'Geral', label: 'Geral', icon: '📊' },
        { value: 'Receitas', label: 'Receitas', icon: '💰' },
        { value: 'Despesas', label: 'Despesas', icon: '📉' },
        { value: 'Ativo', label: 'Ativo', icon: '🏦' },
        { value: 'Passivo', label: 'Passivo', icon: '📋' },
        { value: 'Patrimônio', label: 'Patrimônio', icon: '🏛️' },
        { value: 'Resultado', label: 'Resultado', icon: '📈' },
    ];

    const inputSx = {
        '& .MuiOutlinedInput-root': {
            backgroundColor: '#FFFFFF',
            borderRadius: 2,
            transition: 'all 0.2s ease',
            '& fieldset': {
                borderColor: 'rgba(230, 201, 105, 0.2)',
                borderWidth: '1.5px',
            },
            '&:hover fieldset': {
                borderColor: '#64748B',
            },
            '&.Mui-focused': {
                '& fieldset': {
                    borderColor: '#E6C969',
                    borderWidth: '2px',
                },
                '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                    color: '#E6C969',
                },
            },
            '& .MuiInputBase-input': {
                color: '#0F172A',
                fontWeight: 500,
                fontSize: '0.95rem',
                padding: '14px 16px',
            },
        },
        '& .MuiInputLabel-root': {
            color: '#64748B',
            fontWeight: 500,
            fontSize: '0.9rem',
            '&.Mui-focused': {
                color: '#E6C969',
                fontWeight: 600,
            },
        },
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setFileSelected(true);
            onUpload(file);
        }
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 4,
                borderRadius: 4,
                border: '1px solid rgba(230, 201, 105, 0.2)',
                bgcolor: alpha('#FFFFFF', 1),
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Header do Formulário */}
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Avatar
                    sx={{
                        bgcolor: alpha('#E6C969', 0.1),
                        color: '#E6C969',
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                    }}
                >
                    <UploadFileIcon />
                </Avatar>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#0F172A' }}>
                        Configuração da Importação
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748B' }}>
                        Defina o período e a categoria antes de selecionar o arquivo
                    </Typography>
                </Box>
            </Stack>

            <Divider sx={{ borderColor: 'rgba(230, 201, 105, 0.1)', mb: 3 }} />

            <Grid container spacing={3}>
                {/* Campo Ano */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        label="Ano de Referência"
                        type="number"
                        value={ano}
                        onChange={(e) => setAno(e.target.value)}
                        fullWidth
                        disabled={disabled}
                        sx={inputSx}
                        InputProps={{
                            startAdornment: (
                                <CalendarIcon sx={{ mr: 1, color: '#94A3B8', fontSize: '1.2rem' }} />
                            ),
                            inputProps: { min: 2000, max: 2100 },
                        }}
                        helperText="Ano base para os dados contábeis"
                    />
                </Grid>

                {/* Campo Categoria */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        select
                        label="Categoria dos Dados"
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                        fullWidth
                        disabled={disabled}
                        sx={inputSx}
                        InputProps={{
                            startAdornment: (
                                <CategoryIcon sx={{ mr: 1, color: '#94A3B8', fontSize: '1.2rem' }} />
                            ),
                        }}
                        helperText="Tipo de documento contábil"
                    >
                        {categorias.map((cat) => (
                            <MenuItem key={cat.value} value={cat.value} sx={{ py: 1.5 }}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <span style={{ fontSize: '1.2rem' }}>{cat.icon}</span>
                                    <Typography>{cat.label}</Typography>
                                </Stack>
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>

                {/* Área de Upload */}
                <Grid size={{ xs: 12 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            border: `2px dashed ${fileSelected ? '#E6C969' : 'rgba(230, 201, 105, 0.2)'}`,
                            bgcolor: fileSelected ? alpha('#E6C969', 0.02) : alpha('#64748B', 0.02),
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            '&:hover': {
                                borderColor: '#E6C969',
                                bgcolor: alpha('#E6C969', 0.02),
                            },
                        }}
                        onClick={() => document.getElementById('file-upload')?.click()}
                    >
                        <input
                            id="file-upload"
                            type="file"
                            hidden
                            accept=".xlsx"
                            onChange={handleFileChange}
                        />

                        <Stack spacing={2} alignItems="center">
                            {selectedFile ? (
                                <Fade in timeout={300}>
                                    <Stack spacing={2} alignItems="center">
                                        <Zoom in timeout={300}>
                                            <Avatar
                                                sx={{
                                                    width: 64,
                                                    height: 64,
                                                    bgcolor: alpha('#10B981', 0.1),
                                                    color: '#10B981',
                                                }}
                                            >
                                                <CheckCircleIcon sx={{ fontSize: 32 }} />
                                            </Avatar>
                                        </Zoom>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0F172A' }}>
                                                {selectedFile.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                                                {(selectedFile.size / 1024).toFixed(2)} KB • Pronto para upload
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Fade>
                            ) : (
                                <Stack spacing={2} alignItems="center">
                                    <UploadFileIcon sx={{ fontSize: 48, color: '#94A3B8', opacity: 0.7 }} />
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0F172A' }}>
                                            Clique para selecionar um arquivo
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                                            Formatos aceitos: .xlsx, .xls, .csv (máx. 10MB)
                                        </Typography>
                                    </Box>
                                </Stack>
                            )}
                        </Stack>
                    </Paper>
                </Grid>

                {/* Botão de Upload (alternativo) */}
                {!selectedFile && (
                    <Grid size={{ xs: 12 }}>
                        <Tooltip title="Selecione um arquivo primeiro" arrow>
                            <span>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    size="large"
                                    disabled={disabled}
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        borderRadius: 2,
                                        py: 1.5,
                                        bgcolor: '#E6C969',
                                        color: '#0F172A',
                                        opacity: 0.6,
                                        cursor: 'not-allowed',
                                    }}
                                >
                                    Aguardando arquivo...
                                </Button>
                            </span>
                        </Tooltip>
                    </Grid>
                )}
            </Grid>

        </Paper>
    );
}