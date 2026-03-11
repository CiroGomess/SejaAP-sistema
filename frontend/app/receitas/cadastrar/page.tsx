'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Chip,
  Stack,
  Tooltip,
  Alert,
  Avatar,
  alpha,
  Fade,

  Paper,
  Badge,
  IconButton,

} from '@mui/material';

import {
  ReceiptLong as ReceiptIcon,
  UploadFile as UploadFileIcon,
  InfoOutlined as InfoIcon,

  Badge as BadgeIcon,
  PersonSearch as PersonSearchIcon,


  Download as DownloadIcon,

  Verified as VerifiedIcon,
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,

} from '@mui/icons-material';

import AppAlert, { AlertType } from '../../../components/AppAlert';
import services from '@/services/service';

import ReceitaCreateModal, { ReceitaForm as ReceitaFormModal } from '@/components/ReceitaCreateModal';
import ReceitaXlsxUploadModal from '@/components/receita/ReceitaXlsxUploadModal';

// --- PALETA DE CORES PREMIUM ---
const GOLD_PRIMARY = '#E6C969';
const GOLD_DARK = '#C4A052';
const GOLD_LIGHT = '#F5E6B8';
const DARK_BG = '#0F172A';

const WHITE = '#FFFFFF';
const GRAY_MAIN = '#64748B';
const GRAY_LIGHT = '#94A3B8';
const GRAY_EXTRA_LIGHT = '#F1F5F9';
const BORDER_LIGHT = 'rgba(100, 116, 139, 0.2)';
const TEXT_DARK = '#0F172A';


const STORAGE_KEY = 'selectedClient';
const UPLOAD_ENDPOINT = '/receitas/import-xlsx';
const XLSX_MODEL_PUBLIC_PATH = '/models_xlsx/Modelo_Receita.xlsx';

type ProdutoOuServico = 'PRODUTO' | 'SERVICO';
type SelectedClient = { id: number; code: string; name: string };
type UploadState = 'idle' | 'uploading' | 'success' | 'error';

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function addDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function pickApiError(data: any): string {
  if (!data) return 'Erro inesperado.';
  if (typeof data === 'string') return data;
  if (typeof data.detail === 'string') return data.detail;
  if (typeof data === 'object') {
    if (typeof data.details === 'string') return data.details;
    if (typeof data.error === 'string') return data.error;
    const firstKey = Object.keys(data)[0];
    const val = (data as any)[firstKey];
    if (Array.isArray(val) && val.length) return `${firstKey}: ${val[0]}`;
    if (typeof val === 'string') return `${firstKey}: ${val}`;
  }
  return 'Falha ao processar a requisição.';
}

export default function ReceitasCadastrarPage() {
  const router = useRouter();
  const [activeClient, setActiveClient] = useState<SelectedClient | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<AlertType>('info');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [uploadFileSize, setUploadFileSize] = useState<number>(0);

  const [form, setForm] = useState<ReceitaFormModal>({
    numero_orcamento: '',
    nome_cliente: '',
    data_emissao: todayISO(),
    data_vencimento: addDaysISO(30),
    produto_ou_servico: 'SERVICO' as ProdutoOuServico,
    nome_produto_ou_servico: '',
    quantidade: 1,
    valor_unitario: 0,
    unidade_filial: '',
    projeto: '',
    centro_de_resultado: '',
  });

  const showAlert = (message: string, severity: AlertType) => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  // Carrega cliente ativo do localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setActiveClient(null);
        setModalOpen(false);
        return;
      }

      const parsed = JSON.parse(raw);
      if (parsed?.id && parsed?.code && parsed?.name) {
        const client: SelectedClient = {
          id: Number(parsed.id),
          code: String(parsed.code),
          name: String(parsed.name),
        };

        setActiveClient(client);
        setForm((prev) => ({ ...prev, nome_cliente: client.name }));
        setModalOpen(false);
      } else {
        setActiveClient(null);
        setModalOpen(false);
      }
    } catch {
      setActiveClient(null);
      setModalOpen(false);
    }
  }, []);

  const total = useMemo(() => {
    const q = Number(form.quantidade) || 0;
    const v = Number(form.valor_unitario) || 0;
    return q * v;
  }, [form.quantidade, form.valor_unitario]);

  const validateForm = () => {
    if (!activeClient) return 'Selecione um cliente no menu lateral.';
    if (!form.numero_orcamento.trim()) return 'Informe o número do orçamento.';
    if (!form.nome_cliente.trim()) return 'Nome do cliente não foi preenchido.';
    if (!form.data_emissao.trim()) return 'Informe a data de emissão.';
    if (!form.data_vencimento.trim()) return 'Informe a data de vencimento.';
    if (!form.nome_produto_ou_servico.trim()) return 'Informe o nome do produto/serviço.';
    if (!form.quantidade || Number(form.quantidade) <= 0) return 'Quantidade deve ser maior que zero.';
    if (form.valor_unitario === null || form.valor_unitario === undefined || Number(form.valor_unitario) < 0)
      return 'Valor unitário inválido.';
    if (!form.unidade_filial.trim()) return 'Informe a unidade/filial.';
    if (!form.projeto.trim()) return 'Informe o projeto.';
    if (!form.centro_de_resultado.trim()) return 'Informe o centro de resultado.';
    return null;
  };

  const handleSave = async () => {
    const err = validateForm();
    if (err) {
      showAlert(err, 'warning');
      return;
    }
    if (!activeClient) return;

    setSaving(true);

    const payload: any = {
      user_id: activeClient.id,
      numero_orcamento: form.numero_orcamento.trim(),
      nome_cliente: activeClient.name,
      data_emissao: form.data_emissao,
      data_vencimento: form.data_vencimento,
      produto_ou_servico: form.produto_ou_servico,
      nome_produto_ou_servico: form.nome_produto_ou_servico.trim(),
      quantidade: Number(form.quantidade),
      valor_unitario: Number(form.valor_unitario),
      unidade_filial: form.unidade_filial.trim(),
      projeto: form.projeto.trim(),
      centro_de_resultado: form.centro_de_resultado.trim(),
    };

    const res = await services('/receitas', { method: 'POST', data: payload });
    setSaving(false);

    if (!res.success) {
      showAlert(pickApiError(res.data), 'error');
      return;
    }

    setModalOpen(false);

    await Swal.fire({
      title: 'Receita cadastrada',
      html: `
        <div style="text-align:left; font-family: inherit;">
          <div style="margin-bottom:12px; color: ${TEXT_DARK}; font-size:16px; font-weight:600;">
            ${activeClient.name}
          </div>
          <div style="color: ${GRAY_MAIN}; font-size:13px; margin-bottom:8px;">
            Orçamento: <span style="font-family: monospace; background: ${GRAY_EXTRA_LIGHT}; padding: 2px 6px; border-radius: 4px;">${payload.numero_orcamento}</span>
          </div>
          <div style="color: ${GRAY_MAIN}; font-size:13px; margin-bottom:16px;">
            Total: <span style="font-weight:700; color: ${GOLD_PRIMARY};">R$ ${total.toFixed(2)}</span>
          </div>
          <div style="color: ${GRAY_LIGHT}; font-size:12px;">
            Registro enviado com sucesso.
          </div>
        </div>
      `,
      icon: 'success',
      confirmButtonText: 'OK',
      confirmButtonColor: GOLD_PRIMARY,
      background: WHITE,
      backdrop: `rgba(0,0,0,0.4)`,
      customClass: { popup: 'rounded-3xl' },
    });

    showAlert('Receita cadastrada com sucesso.', 'success');
  };

  const startUploadXlsx = async (file: File) => {
    if (!activeClient) {
      showAlert('Selecione um cliente no menu lateral antes de importar XLSX.', 'warning');
      return;
    }

    setUploadFileName(file.name);
    setUploadFileSize(file.size);
    setUploadResult(null);
    setUploadError('');
    setUploadState('uploading');
    setUploadOpen(true);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('id_cliente', String(activeClient.id));
      fd.append('categoria', 'RECEITAS_XLSX');

      const res = await services(UPLOAD_ENDPOINT, {
        method: 'POST',
        data: fd,
      });

      if (!res.success) {
        const msg = pickApiError(res.data) || 'Falha ao importar XLSX.';
        setUploadError(msg);
        setUploadResult(res.data);
        setUploadState('error');
        return;
      }

      setUploadResult(res.data);
      setUploadState('success');
      showAlert('Upload XLSX concluído. Retorno disponível no modal.', 'success');
    } catch (e: any) {
      setUploadError(e?.message || 'Erro inesperado ao enviar o XLSX.');
      setUploadResult(null);
      setUploadState('error');
    }
  };

  const downloadXlsxModel = () => {
    try {
      const a = document.createElement('a');
      a.href = XLSX_MODEL_PUBLIC_PATH;
      a.download = 'modelo-receita-sejaap.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      showAlert('Download do modelo XLSX iniciado.', 'info');
    } catch {
      showAlert('Não foi possível iniciar o download do modelo XLSX.', 'error');
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
  };

  // UI quando NÃO tem cliente selecionado
  if (!activeClient) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        bgcolor: GRAY_EXTRA_LIGHT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}>
        <Fade in timeout={500}>
          <Paper
            elevation={0}
            sx={{
              maxWidth: 520,
              width: '100%',
              borderRadius: 4,
              border: `1px solid ${BORDER_LIGHT}`,
              bgcolor: WHITE,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Box sx={{ height: 6, background: `linear-gradient(90deg, ${GOLD_PRIMARY}, ${GOLD_LIGHT})` }} />
            
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: alpha(GOLD_PRIMARY, 0.1),
                  color: GOLD_PRIMARY,
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <PersonSearchIcon sx={{ fontSize: 40 }} />
              </Avatar>

              <Typography variant="h4" sx={{ fontWeight: 700, color: TEXT_DARK, mb: 1 }}>
                Nenhum cliente selecionado
              </Typography>
              
              <Typography sx={{ color: GRAY_MAIN, mb: 4, maxWidth: 360, mx: 'auto' }}>
                Para cadastrar uma receita, primeiro selecione um cliente no menu lateral ou na lista de clientes.
              </Typography>

              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  startIcon={<PersonSearchIcon />}
                  onClick={() => router.push('/clients')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 4,
                    py: 1.2,
                    bgcolor: GOLD_PRIMARY,
                    color: TEXT_DARK,
                    '&:hover': {
                      bgcolor: GOLD_DARK,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 16px ${alpha(GOLD_PRIMARY, 0.3)}`,
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  Ir para Clientes
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => router.back()}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 4,
                    borderColor: BORDER_LIGHT,
                    color: GRAY_MAIN,
                    '&:hover': { borderColor: GOLD_PRIMARY, color: GOLD_PRIMARY },
                  }}
                >
                  Voltar
                </Button>
              </Stack>
            </CardContent>
          </Paper>
        </Fade>

        <AppAlert
          open={alertOpen}
          message={alertMessage}
          severity={alertSeverity}
          onClose={() => setAlertOpen(false)}
        />
      </Box>
    );
  }

  // UI normal com cliente ativo - usando 90% da tela
  return (
    <Box sx={{ bgcolor: GRAY_EXTRA_LIGHT, minHeight: '100vh', py: 3 }}>
      <Container maxWidth={false} sx={{ maxWidth: '90%', mx: 'auto' }}>
        {/* Header */}
        <Fade in timeout={500}>
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton
                onClick={() => router.back()}
                sx={{
                  border: `1px solid ${BORDER_LIGHT}`,
                  borderRadius: 2,
                  bgcolor: WHITE,
                  '&:hover': { borderColor: GOLD_PRIMARY, color: GOLD_PRIMARY },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                  Cadastrar Receita
                </Typography>
                <Typography variant="body1" sx={{ color: GRAY_MAIN }}>
                  Vincule uma nova receita ao cliente selecionado
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Fade>

        {/* Main Card */}
        <Fade in timeout={600}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: `1px solid ${BORDER_LIGHT}`,
              bgcolor: WHITE,
              overflow: 'hidden',
              boxShadow: `0 20px 40px ${alpha(DARK_BG, 0.05)}`,
            }}
          >
            <Box sx={{ height: 6, background: `linear-gradient(90deg, ${GOLD_PRIMARY}, ${GOLD_LIGHT})` }} />

            <CardContent sx={{ p: 4 }}>
              {/* Cliente Ativo Card - Versão simplificada */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 4,
                  borderRadius: 3,
                  bgcolor: alpha(GOLD_PRIMARY, 0.03),
                  border: `1px solid ${alpha(GOLD_PRIMARY, 0.15)}`,
                }}
              >
                <Stack direction="row" spacing={2.5} alignItems="center">
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      <Avatar
                        sx={{
                          width: 22,
                          height: 22,
                          bgcolor: GOLD_PRIMARY,
                          color: TEXT_DARK,
                          border: `2px solid ${WHITE}`,
                        }}
                      >
                        <VerifiedIcon sx={{ fontSize: 14 }} />
                      </Avatar>
                    }
                  >
                    <Avatar
                      sx={{
                        width: 64,
                        height: 64,
                        bgcolor: alpha(GOLD_PRIMARY, 0.15),
                        color: GOLD_PRIMARY,
                        fontSize: '1.5rem',
                        fontWeight: 700,
                      }}
                    >
                      {activeClient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </Avatar>
                  </Badge>

                  <Box>
                    <Typography variant="caption" sx={{ color: GRAY_MAIN, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Cliente Ativo
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: TEXT_DARK, mt: 0.5 }}>
                      {activeClient.name}
                    </Typography>
                    <Chip
                      icon={<BadgeIcon sx={{ fontSize: '0.9rem' }} />}
                      label={`Código: ${activeClient.code}`}
                      size="small"
                      sx={{
                        mt: 1,
                        bgcolor: alpha(GOLD_PRIMARY, 0.1),
                        color: GOLD_PRIMARY,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    />
                  </Box>
                </Stack>
              </Paper>

              {/* Actions Grid - Usando 2 colunas com tamanhos iguais */}
              <Grid container spacing={3}>
                {/* Cadastro Manual */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      borderRadius: 3,
                      border: `1px solid ${BORDER_LIGHT}`,
                      height: '100%',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': { borderColor: GOLD_PRIMARY, boxShadow: `0 8px 24px ${alpha(GOLD_PRIMARY, 0.1)}` },
                    }}
                  >
                    <Stack spacing={3} sx={{ height: '100%' }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: alpha(GOLD_PRIMARY, 0.1), color: GOLD_PRIMARY, width: 56, height: 56 }}>
                          <ReceiptIcon sx={{ fontSize: 28 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                            Cadastro Manual
                          </Typography>
                          <Typography variant="body2" sx={{ color: GRAY_MAIN }}>
                            Preencha todos os dados da receita
                          </Typography>
                        </Box>
                      </Stack>

                      <Divider sx={{ borderColor: BORDER_LIGHT }} />

                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ color: GRAY_MAIN, mb: 2, fontWeight: 600 }}>
                          Informações necessárias:
                        </Typography>
                        <Grid container spacing={1.5}>
                          <Grid size={{ xs: 6 }}>
                            <Chip 
                              label="Nº do Orçamento" 
                              size="small" 
                              sx={{ width: '100%', justifyContent: 'flex-start', bgcolor: alpha(GRAY_MAIN, 0.05) }} 
                            />
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Chip 
                              label="Cliente" 
                              size="small" 
                              sx={{ width: '100%', justifyContent: 'flex-start', bgcolor: alpha(GRAY_MAIN, 0.05) }} 
                            />
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Chip 
                              label="Data Emissão" 
                              size="small" 
                              sx={{ width: '100%', justifyContent: 'flex-start', bgcolor: alpha(GRAY_MAIN, 0.05) }} 
                            />
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Chip 
                              label="Data Vencimento" 
                              size="small" 
                              sx={{ width: '100%', justifyContent: 'flex-start', bgcolor: alpha(GRAY_MAIN, 0.05) }} 
                            />
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Chip 
                              label="Produto/Serviço" 
                              size="small" 
                              sx={{ width: '100%', justifyContent: 'flex-start', bgcolor: alpha(GRAY_MAIN, 0.05) }} 
                            />
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Chip 
                              label="Quantidade" 
                              size="small" 
                              sx={{ width: '100%', justifyContent: 'flex-start', bgcolor: alpha(GRAY_MAIN, 0.05) }} 
                            />
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Chip 
                              label="Valor Unitário" 
                              size="small" 
                              sx={{ width: '100%', justifyContent: 'flex-start', bgcolor: alpha(GRAY_MAIN, 0.05) }} 
                            />
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Chip 
                              label="Unidade/Filial" 
                              size="small" 
                              sx={{ width: '100%', justifyContent: 'flex-start', bgcolor: alpha(GRAY_MAIN, 0.05) }} 
                            />
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Chip 
                              label="Projeto" 
                              size="small" 
                              sx={{ width: '100%', justifyContent: 'flex-start', bgcolor: alpha(GRAY_MAIN, 0.05) }} 
                            />
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Chip 
                              label="Centro de Resultado" 
                              size="small" 
                              sx={{ width: '100%', justifyContent: 'flex-start', bgcolor: alpha(GRAY_MAIN, 0.05) }} 
                            />
                          </Grid>
                        </Grid>
                      </Box>

                      <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        startIcon={<ReceiptIcon />}
                        onClick={() => setModalOpen(true)}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          borderRadius: 2,
                          py: 1.8,
                          bgcolor: GOLD_PRIMARY,
                          color: TEXT_DARK,
                          '&:hover': {
                            bgcolor: GOLD_DARK,
                            transform: 'translateY(-2px)',
                            boxShadow: `0 8px 16px ${alpha(GOLD_PRIMARY, 0.3)}`,
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        Iniciar Cadastro Manual
                      </Button>
                    </Stack>
                  </Paper>
                </Grid>

                {/* Importação em Massa */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      borderRadius: 3,
                      border: `1px solid ${BORDER_LIGHT}`,
                      height: '100%',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': { borderColor: GOLD_PRIMARY, boxShadow: `0 8px 24px ${alpha(GOLD_PRIMARY, 0.1)}` },
                    }}
                  >
                    <Stack spacing={3} sx={{ height: '100%' }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: alpha('#5e5e5e', 0.1), color: '#858585', width: 56, height: 56 }}>
                          <CloudUploadIcon sx={{ fontSize: 28 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: TEXT_DARK }}>
                            Importação em Massa
                          </Typography>
                          <Typography variant="body2" sx={{ color: GRAY_MAIN }}>
                            Upload de planilha com múltiplas receitas
                          </Typography>
                        </Box>
                      </Stack>

                      <Divider sx={{ borderColor: BORDER_LIGHT }} />

                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ color: GRAY_MAIN, mb: 2, fontWeight: 600 }}>
                          Formatos aceitos:
                        </Typography>
                        <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
                          <Chip 
                            icon={<DescriptionIcon />} 
                            label=".xlsx" 
                            sx={{ bgcolor: alpha(GRAY_MAIN, 0.05), fontWeight: 500 }} 
                          />
                        </Stack>

                        <Alert
                          severity="info"
                          icon={<InfoIcon />}
                          sx={{
                            borderRadius: 2,
                            bgcolor: alpha(GOLD_PRIMARY, 0.05),
                            color: GRAY_MAIN,
                            '& .MuiAlert-icon': { color: GOLD_PRIMARY },
                          }}
                        >
                          Baixe o modelo para garantir o formato correto da planilha.
                        </Alert>
                      </Box>

                      <Stack direction="row" spacing={2}>
                        <Button
                          variant="contained"
                          fullWidth
                          size="large"
                          startIcon={<UploadFileIcon />}
                          component="label"
                          sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: 2,
                            py: 1.8,
                            bgcolor: GOLD_PRIMARY,
                            color: TEXT_DARK,
                            '&:hover': {
                              bgcolor: GOLD_DARK,
                              transform: 'translateY(-2px)',
                              boxShadow: `0 8px 16px ${alpha(GOLD_PRIMARY, 0.3)}`,
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          Upload Planilha
                          <input
                            type="file"
                            accept=".xlsx,.xls"
                            hidden
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              startUploadXlsx(file);
                              e.currentTarget.value = '';
                            }}
                          />
                        </Button>

                        <Tooltip title="Baixar modelo XLSX" arrow>
                          <IconButton
                            onClick={downloadXlsxModel}
                            sx={{
                              border: `1px solid ${BORDER_LIGHT}`,
                              borderRadius: 2,
                              width: 56,
                              height: 56,
                              '&:hover': { borderColor: GOLD_PRIMARY, color: GOLD_PRIMARY, bgcolor: alpha(GOLD_PRIMARY, 0.05) },
                            }}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Fade>
      </Container>

      {/* Modais */}
      <ReceitaCreateModal
        open={modalOpen}
        saving={saving}
        customer={{ id: activeClient.id, code: activeClient.code, display_name: activeClient.name }}
        form={form}
        setForm={setForm}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
      />

      <ReceitaXlsxUploadModal
        open={uploadOpen}
        state={uploadState}
        fileName={uploadFileName}
        fileSizeBytes={uploadFileSize}
        result={uploadResult}
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