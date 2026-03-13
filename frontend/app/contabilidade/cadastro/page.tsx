'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Fade,
  IconButton,
  Stack,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

import services from '@/services/service';
import AppAlert, { AlertType } from '@/components/AppAlert';
import ContabilidadeXlsxUploadModal from '@/components/contabilidade/ContabilidadeXlsxUploadModal';

import { SelectedClient, UploadState } from '@/components/contabilidade/types';
import NoClientState from '@/components/contabilidade/NoClientState';
import ClientHeader from '@/components/contabilidade/ClientHeader';
import UploadForm from '@/components/contabilidade/UploadForm';

const STORAGE_KEY = 'selectedClient';
const UPLOAD_ENDPOINT = '/contabilidade/upload';

function pickApiError(data: unknown): string {
  if (!data) return 'Erro inesperado.';
  if (typeof data === 'string') return data;
  if (typeof data === 'object' && data !== null && 'detail' in data && typeof (data as Record<string, unknown>).detail === 'string') return (data as Record<string, unknown>).detail as string;
  if (typeof data === 'object' && data !== null && 'error' in data && typeof (data as Record<string, unknown>).error === 'string') return (data as Record<string, unknown>).error as string;
  if (typeof data === 'object' && data !== null && 'message' in data && typeof (data as Record<string, unknown>).message === 'string') return (data as Record<string, unknown>).message as string;
  return 'Falha ao processar a requisição.';
}

export default function ContabilidadeCadastroPage() {
  const router = useRouter();
  const [activeClient, setActiveClient] = useState<SelectedClient | null>(null);

  /* FORM STATE */
  const [ano, setAno] = useState<string>(new Date().getFullYear().toString());
  const [categoria, setCategoria] = useState<string>('Geral');

  /* ALERT STATE */
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<AlertType>('info');

  /* UPLOAD MODAL STATE */
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadResult, setUploadResult] = useState<Record<string, unknown> | null>(null);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [uploadFileSize, setUploadFileSize] = useState<number>(0);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const showAlert = (message: string, severity: AlertType) => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  // Load active client from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setActiveClient(null);
        return;
      }
      const parsed = JSON.parse(raw);
      if (parsed?.id && parsed?.code && parsed?.name) {
        setActiveClient({
          id: parsed.id,
          code: String(parsed.code),
          name: String(parsed.name),
        });
      } else {
        setActiveClient(null);
      }
    } catch {
      setActiveClient(null);
    }
  }, []);

  const startUploadXlsx = async (file: File) => {
    if (!activeClient) {
      showAlert('Selecione um cliente no menu lateral antes de importar.', 'warning');
      return;
    }

    if (!ano) {
      showAlert('Selecione o ano de referência.', 'warning');
      return;
    }

    setUploadFileName(file.name);
    setUploadFileSize(file.size);
    setUploadResult(null);
    setUploadError('');
    setUploadState('uploading');
    setUploadOpen(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('user_id', String(activeClient.id).trim());
      fd.append('ano', String(ano).trim());
      fd.append('categoria', String(categoria).trim());

      const res = await services(UPLOAD_ENDPOINT, {
        method: 'POST',
        data: fd,
      });

      clearInterval(interval);
      setUploadProgress(100);

      if (!res.success) {
        const msg = pickApiError(res.data) || 'Falha ao importar XLSX.';
        setUploadError(msg);
        setUploadResult(res.data as Record<string, unknown>);
        setUploadState('error');
        return;
      }

      setUploadResult(res.data as Record<string, unknown>);
      setUploadState('success');
      showAlert('Dados contábeis importados com sucesso.', 'success');
    } catch (e: any) {
      clearInterval(interval);
      setUploadError(e?.message || 'Erro inesperado ao enviar o arquivo.');
      setUploadResult(null);
      setUploadState('error');
    }
  };

  const closeUploadModal = () => {
    if (uploadState === 'uploading') return;
    setUploadOpen(false);
    setUploadState('idle');
    setUploadResult(null);
    setUploadError('');
    setUploadFileName('');
    setUploadFileSize(0);
    setUploadProgress(0);
  };

  if (!activeClient) {
    return <NoClientState onGoToClients={() => router.push('/clients')} />;
  }

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header com gradiente */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${'rgba(230, 201, 105, 0.05)'} 0%, ${'rgba(15, 23, 42, 0.02)'} 100%)`,
          borderBottom: '1px solid rgba(100, 116, 139, 0.2)',
          pt: 3,
          pb: 2,
          mb: 3,
        }}
      >
        <Container maxWidth={false} sx={{ maxWidth: '95%', mx: 'auto' }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton
              onClick={() => router.back()}
              sx={{
                border: '1px solid rgba(100, 116, 139, 0.2)',
                borderRadius: 2,
                bgcolor: '#FFFFFF',
                '&:hover': { borderColor: '#E6C969', color: '#E6C969' },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A' }}>
                Importar Contabilidade
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748B' }}>
                Importe planilhas de balancete, DRE ou lançamentos contábeis
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth={false} sx={{ maxWidth: '95%', mx: 'auto' }}>
        {/* Card Principal */}
        <Fade in timeout={600}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid rgba(100, 116, 139, 0.2)',
              bgcolor: '#FFFFFF',
              overflow: 'hidden',
              boxShadow: `0 20px 40px ${'rgba(15, 23, 42, 0.05)'}`,
            }}
          >
            <Box sx={{ height: 6, background: `linear-gradient(90deg, #E6C969, #F5E6B8)` }} />

            <CardContent sx={{ p: 4 }}>
              {/* Header do Cliente */}
              <ClientHeader client={activeClient} ano={ano} categoria={categoria} />

              {/* Formulário de Upload */}
              <UploadForm
                ano={ano}
                setAno={setAno}
                categoria={categoria}
                setCategoria={setCategoria}
                onUpload={startUploadXlsx}
                disabled={uploadState === 'uploading'}
              />

              {/* Barra de Progresso durante upload */}
              {uploadState === 'uploading' && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: 'rgba(230, 201, 105, 0.1)',
                      '& .MuiLinearProgress-bar': { bgcolor: '#E6C969' },
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Fade>
      </Container>

      {/* Modal de Upload */}
      <ContabilidadeXlsxUploadModal
        open={uploadOpen}
        state={uploadState}
        fileName={uploadFileName}
        fileSizeBytes={uploadFileSize}
        errorMessage={uploadError}
        onClose={closeUploadModal}
      />

      <AppAlert
        open={alertOpen}
        message={alertMessage}
        severity={alertSeverity}
        onClose={() => setAlertOpen(false)}
      />
    </Box>
  );
}