'use client';

import React, { useState } from 'react';
import { Box, Card, Tabs, Tab, Button, Typography, Grid, Paper } from '@mui/material';

import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

import StepUpload from './StepUpload';
import StepURLDocument from './StepURLDocument';
import StepOCRText from './StepOCRText';
import StepVectorized from './StepVectorized';
import StepOCRConfig from './StepOCRConfig';

interface Props {
    clienteId: string;
}

const tabs = [
    'Início',
    'Especialista em Receita',
    'Documentos Vetorizados',
    'Configurações',
] as const;

type StartMode = 'upload' | 'url' | null;

export default function OCRTabs({ clienteId }: Props) {
    const [activeTab, setActiveTab] = useState(0);
    const [startMode, setStartMode] = useState<StartMode>(null);

    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const next = () => setActiveTab((t) => Math.min(t + 1, tabs.length - 1));
    const back = () => setActiveTab((t) => Math.max(t - 1, 0));

    // Após escolher Upload/URL, o próximo passo é sempre ir para o Texto OCR (tab 1)
    const goToOCRText = () => setActiveTab(1);

    return (
        <Card sx={{ borderRadius: 4 }}>
            {/* Abas */}
            <Tabs
                value={activeTab}
                onChange={handleChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    px: 2,
                }}
            >
                {tabs.map((label, index) => (
                    <Tab
                        key={label}
                        label={label}
                        id={`ocr-tab-${index}`}
                        aria-controls={`ocr-tabpanel-${index}`}
                        sx={{ textTransform: 'none', fontWeight: 500 }}
                    />
                ))}
            </Tabs>

            {/* Conteúdo */}
            <Box sx={{ p: 4 }}>
                {/* INÍCIO */}
                {activeTab === 0 && (
                    <Box
                        sx={{
                            minHeight: '55vh',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Box sx={{ width: '100%', maxWidth: 980 }}>
                            {!startMode ? (
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                                        Como você quer começar?
                                    </Typography>

                                    <Typography variant="body2" sx={{ opacity: 0.8, mb: 4 }}>
                                        Escolha uma opção para iniciar a extração e seguir para o OCR.
                                    </Typography>

                                    <Grid
                                        container
                                        spacing={3}
                                        justifyContent="center"
                                        alignItems="stretch"
                                        sx={{ maxWidth: 900, mx: 'auto' }}
                                    >
                                        {/* CARD: Upload */}
                                        <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: 'center' }}>
                                            <Paper
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => setStartMode('upload')}
                                                onKeyDown={(e) => e.key === 'Enter' && setStartMode('upload')}
                                                elevation={0}
                                                sx={{
                                                    width: '100%',
                                                    maxWidth: 420,
                                                    p: 3,
                                                    borderRadius: 4,
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    cursor: 'pointer',
                                                    minHeight: 210,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: 1.5,
                                                    transition: 'all .18s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-3px)',
                                                        boxShadow: 6,
                                                        borderColor: 'primary.main',
                                                    },
                                                }}
                                            >
                                                <CloudUploadOutlinedIcon sx={{ fontSize: 56 }} />
                                                <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
                                                    Upload de Arquivo
                                                </Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.8, maxWidth: 320 }}>
                                                    Envie um PDF ou imagem para extrair o texto automaticamente.
                                                </Typography>
                                            </Paper>
                                        </Grid>

                                        {/* CARD: URL */}
                                        <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: 'center' }}>
                                            <Paper
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => setStartMode('url')}
                                                onKeyDown={(e) => e.key === 'Enter' && setStartMode('url')}
                                                elevation={0}
                                                sx={{
                                                    width: '100%',
                                                    maxWidth: 420,
                                                    p: 3,
                                                    borderRadius: 4,
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    cursor: 'pointer',
                                                    minHeight: 210,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: 1.5,
                                                    transition: 'all .18s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-3px)',
                                                        boxShadow: 6,
                                                        borderColor: 'primary.main',
                                                    },
                                                }}
                                            >
                                                <LinkOutlinedIcon sx={{ fontSize: 56 }} />
                                                <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
                                                    URL do Documento
                                                </Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.8, maxWidth: 320 }}>
                                                    Informe um link para baixar o documento e processar o OCR.
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                </Box>
                            ) : (
                                <Box>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        size="large"
                                        startIcon={<ArrowBackRoundedIcon />}
                                        onClick={() => setStartMode(null)}
                                        sx={{
                                            mb: 3,
                                            borderRadius: 3,
                                            px: 3,
                                            fontWeight: 800,
                                            textTransform: 'none',
                                            boxShadow: 6,
                                        }}
                                    >
                                        Trocar opção
                                    </Button>

                                    {startMode === 'upload' && <StepUpload onNext={goToOCRText} />}
                                    {startMode === 'url' && <StepURLDocument onNext={goToOCRText} />}
                                </Box>
                            )}
                        </Box>
                    </Box>
                )}

                {/* RESTANTE DO FLUXO */}
                {activeTab === 1 && <StepOCRText onNext={next} onBack={back} />}
                {activeTab === 2 && <StepVectorized clienteId={clienteId} />}
                {activeTab === 3 && <StepOCRConfig />}
            </Box>
        </Card>
    );
}
