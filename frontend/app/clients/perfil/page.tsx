'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';

import {
  Box,
  Container,
  CircularProgress,
  Typography,
  Paper,
  Grid,
  Stack,
  alpha,
  Avatar,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Fade,
  Divider,
  LinearProgress,
} from '@mui/material';

import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Numbers as NumbersIcon,
  Notes as NotesIcon,
  FileUpload as FileUploadIcon,
  FileDownload as FileDownloadIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';

import services from '@/services/service';
import AppAlert, { AlertType } from '@/components/AppAlert';
import { Customer, DocCliente } from '@/components/clientProfile/types';

// --- PALETA DE CORES EAP (Refinada) ---
const GOLD_PRIMARY = '#B8860B';
const GOLD_LIGHT = '#DAA520';

const CHARCOAL = '#2C2C2C';
const GRAY_MAIN = '#757575';
const GRAY_LIGHT = '#F5F5F7';
const WHITE = '#FFFFFF';
const BORDER_LIGHT = 'rgba(0, 0, 0, 0.08)';
const SUCCESS = '#10B981';
const WARNING = '#F59E0B';
const ERROR = '#EF4444';
const INFO = '#3B82F6';

function pickApiError(data: any): string {
  if (!data) return 'Erro inesperado.';
  if (typeof data === 'string') return data;
  if (typeof data?.details === 'string') return data.details;
  if (typeof data?.error === 'string') return data.error;
  if (typeof data?.detail === 'string') return data.detail;
  return 'Falha ao processar a requisição.';
}

function normalizeCustomer(input: any): Customer {
  const c = input?.customer ?? input ?? {};

  return {
    id:
      c.id != null
        ? String(c.id)
        : c.user_id != null
          ? String(c.user_id)
          : c.customer_id != null
            ? String(c.customer_id)
            : null,
    code: String(c.code ?? ''),
    first_name: String(c.first_name ?? ''),
    last_name: String(c.last_name ?? ''),
    email: String(c.email ?? ''),
    document: String(c.document ?? ''),
    phone: String(c.phone ?? ''),
    is_whatsapp: Boolean(c.is_whatsapp),
    status: (c.status ?? 'active') as any,
    company_name: c.company_name ?? null,
    notes: c.notes ?? null,
    cep: c.cep ?? null,
    street: c.street ?? null,
    number: c.number ?? null,
    complement: c.complement ?? null,
    neighborhood: c.neighborhood ?? null,
    city: c.city ?? null,
    state: c.state ?? null,
    created_at: c.created_at ?? undefined,
    updated_at: c.updated_at ?? undefined,
  };
}

function normalizeDocList(data: any): DocCliente[] {
  const list = Array.isArray(data?.docs) ? data.docs : Array.isArray(data) ? data : [];

  return list.map((d: any) => ({
    id: String(d.id ?? ''),
    id_cliente: String(d.id_cliente ?? ''),
    caminho_arquivo: String(d.caminho_arquivo ?? ''),
    categoria: String(d.categoria ?? ''),
    data_envio: d.data_envio ? String(d.data_envio) : null,
  }));
}

// Componente de cabeçalho refinado
const ProfileHeader = ({
  onBack,
  onRefresh,
  loading,
  customerCode,
}: {
  onBack: () => void;
  onRefresh: () => void;
  loading: boolean;
  customerCode?: string;
}) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      mb: 3,
      borderRadius: 3,
      border: `1px solid ${BORDER_LIGHT}`,
      background: `linear-gradient(135deg, ${WHITE} 0%, ${GRAY_LIGHT} 100%)`,
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Stack direction="row" spacing={2} alignItems="center">
        <Tooltip title="Voltar para lista de clientes">
          <IconButton
            onClick={onBack}
            sx={{
              bgcolor: alpha(CHARCOAL, 0.05),
              '&:hover': { bgcolor: alpha(CHARCOAL, 0.1) },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>

        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h5" sx={{ fontWeight: 800, color: CHARCOAL }}>
              Perfil do Cliente
            </Typography>
            {customerCode && (
              <Chip
                label={`ID: ${customerCode}`}
                size="small"
                sx={{
                  bgcolor: alpha(GOLD_PRIMARY, 0.1),
                  color: GOLD_PRIMARY,
                  fontWeight: 600,
                  borderRadius: 1.5,
                }}
              />
            )}
          </Stack>
          <Typography sx={{ color: GRAY_MAIN, fontSize: '0.9rem', mt: 0.5 }}>
            Visualize e gerencie informações e documentos do cliente
          </Typography>
        </Box>
      </Stack>

      <Tooltip title="Atualizar dados">
        <Button
          onClick={onRefresh}
          disabled={loading}
          variant="outlined"
          startIcon={<RefreshIcon />}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            borderColor: BORDER_LIGHT,
            color: CHARCOAL,
            '&:hover': {
              borderColor: GOLD_PRIMARY,
              bgcolor: alpha(GOLD_PRIMARY, 0.05),
            },
          }}
        >
          Atualizar
        </Button>
      </Tooltip>
    </Stack>
  </Paper>
);

// Card de resumo do cliente refinado
const CustomerSummaryCard = ({
  customer,
  lastUpdated,
}: {
  customer: Customer;
  lastUpdated: string;
}) => {
  const statusConfig = {
    active: { color: SUCCESS, label: 'Ativo', bgColor: alpha(SUCCESS, 0.1) },
    pending: { color: WARNING, label: 'Pendente', bgColor: alpha(WARNING, 0.1) },
    inactive: { color: ERROR, label: 'Inativo', bgColor: alpha(ERROR, 0.1) },
  };

  const currentStatus = statusConfig[customer.status] || statusConfig.pending;

  return (
    <Paper
      elevation={0}
      sx={{ p: 3, borderRadius: 3, border: `1px solid ${BORDER_LIGHT}`, height: '100%' }}
    >
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: alpha(GOLD_PRIMARY, 0.1),
                color: GOLD_PRIMARY,
              }}
            >
              <PersonIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: CHARCOAL }}>
                {customer.first_name} {customer.last_name}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                <Chip
                  label={currentStatus.label}
                  size="small"
                  sx={{
                    bgcolor: currentStatus.bgColor,
                    color: currentStatus.color,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    borderRadius: 1.5,
                  }}
                />
              </Stack>
            </Box>
          </Stack>
        </Stack>

        <Divider sx={{ borderColor: BORDER_LIGHT }} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <EmailIcon sx={{ fontSize: 18, color: GRAY_MAIN }} />
              <Typography sx={{ color: GRAY_MAIN, fontSize: '0.85rem' }}>Email:</Typography>
              <Typography sx={{ fontWeight: 600, color: CHARCOAL, fontSize: '0.9rem' }}>
                {customer.email}
              </Typography>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <PhoneIcon sx={{ fontSize: 18, color: GRAY_MAIN }} />
              <Typography sx={{ color: GRAY_MAIN, fontSize: '0.85rem' }}>Telefone:</Typography>
              <Typography sx={{ fontWeight: 600, color: CHARCOAL, fontSize: '0.9rem' }}>
                {customer.phone}
              </Typography>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <NumbersIcon sx={{ fontSize: 18, color: GRAY_MAIN }} />
              <Typography sx={{ color: GRAY_MAIN, fontSize: '0.85rem' }}>CPF/CNPJ:</Typography>
              <Typography sx={{ fontWeight: 600, color: CHARCOAL, fontSize: '0.9rem' }}>
                {customer.document}
              </Typography>
            </Stack>
          </Grid>

          {customer.company_name && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <BusinessIcon sx={{ fontSize: 18, color: GRAY_MAIN }} />
                <Typography sx={{ color: GRAY_MAIN, fontSize: '0.85rem' }}>Empresa:</Typography>
                <Typography sx={{ fontWeight: 600, color: CHARCOAL, fontSize: '0.9rem' }}>
                  {customer.company_name}
                </Typography>
              </Stack>
            </Grid>
          )}
        </Grid>

        {(customer.street || customer.city) && (
          <>
            <Divider sx={{ borderColor: BORDER_LIGHT }} />
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <LocationIcon sx={{ fontSize: 18, color: GOLD_PRIMARY }} />
                <Typography sx={{ fontWeight: 700, color: CHARCOAL, fontSize: '0.9rem' }}>
                  Endereço
                </Typography>
              </Stack>
              <Typography sx={{ color: GRAY_MAIN, fontSize: '0.9rem', whiteSpace: 'pre-line' }}>
                {customer.street && `${customer.street}, ${customer.number || 'S/N'}`}
                {customer.complement && ` - ${customer.complement}`}
                {customer.neighborhood && `\n${customer.neighborhood}`}
                {customer.city && `, ${customer.city}`}
                {customer.state && ` - ${customer.state}`}
                {customer.cep && `\nCEP: ${customer.cep}`}
              </Typography>
            </Box>
          </>
        )}

        {customer.notes && (
          <>
            <Divider sx={{ borderColor: BORDER_LIGHT }} />
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <NotesIcon sx={{ fontSize: 18, color: GOLD_PRIMARY }} />
                <Typography sx={{ fontWeight: 700, color: CHARCOAL, fontSize: '0.9rem' }}>
                  Observações
                </Typography>
              </Stack>
              <Typography sx={{ color: GRAY_MAIN, fontSize: '0.9rem', fontStyle: 'italic' }}>
                {customer.notes}
              </Typography>
            </Box>
          </>
        )}

        <Box sx={{ mt: 'auto' }}>
          <Divider sx={{ borderColor: BORDER_LIGHT }} />
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.5 }}>
            <Typography sx={{ color: GRAY_MAIN, fontSize: '0.7rem' }}>
              Criado em:{' '}
              {customer.created_at ? new Date(customer.created_at).toLocaleDateString('pt-BR') : '-'}
            </Typography>
            <Typography sx={{ color: GRAY_MAIN, fontSize: '0.7rem' }}>
              Atualizado: {lastUpdated}
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};

// Card de upload refinado
const DocumentUploadCard = ({
  categoria,
  setCategoria,
  file,
  setFile,
  onUpload,
  uploading,
}: {
  categoria: string;
  setCategoria: (value: string) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  onUpload: () => void;
  uploading: boolean;
}) => {
  const categorias = ['CONTRATO', 'IDENTIDADE', 'COMPROVANTE', 'FISCAL', 'OUTROS'];

  return (
    <Paper
      elevation={0}
      sx={{ p: 3, borderRadius: 3, border: `1px solid ${BORDER_LIGHT}`, height: '100%' }}
    >
      <Stack spacing={3}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            sx={{
              width: 44,
              height: 44,
              bgcolor: alpha(GOLD_PRIMARY, 0.1),
              color: GOLD_PRIMARY,
              borderRadius: 2,
            }}
          >
            <CloudUploadIcon />
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 700, color: CHARCOAL, fontSize: '1rem' }}>
              Upload de Documento
            </Typography>
            <Typography sx={{ color: GRAY_MAIN, fontSize: '0.8rem' }}>
              Adicione novos documentos ao cliente
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ borderColor: BORDER_LIGHT }} />

        <Box>
          <Typography sx={{ fontWeight: 600, color: CHARCOAL, fontSize: '0.9rem', mb: 1 }}>
            Categoria do Documento
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {categorias.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                onClick={() => setCategoria(cat)}
                sx={{
                  bgcolor: categoria === cat ? alpha(GOLD_PRIMARY, 0.1) : 'transparent',
                  color: categoria === cat ? GOLD_PRIMARY : GRAY_MAIN,
                  fontWeight: categoria === cat ? 700 : 500,
                  border: `1px solid ${categoria === cat ? GOLD_PRIMARY : BORDER_LIGHT}`,
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: alpha(GOLD_PRIMARY, 0.05),
                    borderColor: GOLD_PRIMARY,
                  },
                }}
              />
            ))}
          </Stack>
        </Box>

        <Box
          sx={{
            border: `2px dashed ${file ? GOLD_PRIMARY : BORDER_LIGHT}`,
            borderRadius: 3,
            p: 3,
            textAlign: 'center',
            bgcolor: file ? alpha(GOLD_PRIMARY, 0.02) : 'transparent',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            '&:hover': {
              borderColor: GOLD_PRIMARY,
              bgcolor: alpha(GOLD_PRIMARY, 0.02),
            },
          }}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <input
            type="file"
            id="file-upload"
            style={{ display: 'none' }}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          {file ? (
            <Stack spacing={1} alignItems="center">
              <Avatar sx={{ bgcolor: alpha(SUCCESS, 0.1), color: SUCCESS }}>
                <DescriptionIcon />
              </Avatar>
              <Typography sx={{ fontWeight: 600, color: CHARCOAL, fontSize: '0.9rem' }}>
                {file.name}
              </Typography>
              <Typography sx={{ color: GRAY_MAIN, fontSize: '0.8rem' }}>
                {(file.size / 1024).toFixed(2)} KB
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={1} alignItems="center">
              <FileUploadIcon sx={{ fontSize: 40, color: GRAY_MAIN }} />
              <Typography sx={{ fontWeight: 600, color: CHARCOAL, fontSize: '0.9rem' }}>
                Clique para selecionar um arquivo
              </Typography>
              <Typography sx={{ color: GRAY_MAIN, fontSize: '0.8rem' }}>
                PDF, imagens ou documentos (máx. 10MB)
              </Typography>
            </Stack>
          )}
        </Box>

        <Button
          onClick={onUpload}
          disabled={!file || uploading}
          variant="contained"
          fullWidth
          disableElevation
          startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 2,
            py: 1.5,
            bgcolor: GOLD_PRIMARY,
            color: WHITE,
            '&:hover': {
              bgcolor: GOLD_LIGHT,
            },
            '&.Mui-disabled': {
              bgcolor: alpha(GOLD_PRIMARY, 0.3),
            },
          }}
        >
          {uploading ? 'Enviando...' : 'Fazer Upload'}
        </Button>
      </Stack>
    </Paper>
  );
};

// Componente da tabela de documentos refinado
const DocumentsTableCard = ({
  docs,
  categoriaFilter,
  setCategoriaFilter,
  onRefresh,
  onDownload,
  onDelete,
  loading,
}: {
  docs: DocCliente[];
  categoriaFilter: string;
  setCategoriaFilter: (value: string) => void;
  onRefresh: () => void;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}) => {
  const categorias = ['ALL', 'CONTRATO', 'IDENTIDADE', 'COMPROVANTE', 'FISCAL', 'OUTROS'];

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <PdfIcon sx={{ color: ERROR }} />;
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'gif') {
      return <ImageIcon sx={{ color: INFO }} />;
    }
    return <FileIcon sx={{ color: GRAY_MAIN }} />;
  };

  const filteredDocs =
    categoriaFilter === 'ALL' ? docs : docs.filter((doc) => doc.categoria === categoriaFilter);

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${BORDER_LIGHT}` }}>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              sx={{
                width: 44,
                height: 44,
                bgcolor: alpha(GOLD_PRIMARY, 0.1),
                color: GOLD_PRIMARY,
                borderRadius: 2,
              }}
            >
              <DescriptionIcon />
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 700, color: CHARCOAL, fontSize: '1rem' }}>
                Documentos do Cliente
              </Typography>
              <Typography sx={{ color: GRAY_MAIN, fontSize: '0.8rem' }}>
                {filteredDocs.length}{' '}
                {filteredDocs.length === 1 ? 'documento encontrado' : 'documentos encontrados'}
              </Typography>
            </Box>
          </Stack>

          <Tooltip title="Atualizar lista">
            <IconButton onClick={onRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        <Box>
          <Typography sx={{ fontWeight: 600, color: CHARCOAL, fontSize: '0.9rem', mb: 1.5 }}>
            Filtrar por categoria
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {categorias.map((cat) => (
              <Chip
                key={cat}
                label={cat === 'ALL' ? 'Todos' : cat}
                onClick={() => setCategoriaFilter(cat)}
                icon={cat === 'ALL' ? <FilterListIcon /> : undefined}
                sx={{
                  bgcolor: categoriaFilter === cat ? alpha(GOLD_PRIMARY, 0.1) : 'transparent',
                  color: categoriaFilter === cat ? GOLD_PRIMARY : GRAY_MAIN,
                  fontWeight: categoriaFilter === cat ? 700 : 500,
                  border: `1px solid ${categoriaFilter === cat ? GOLD_PRIMARY : BORDER_LIGHT}`,
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: alpha(GOLD_PRIMARY, 0.05),
                    borderColor: GOLD_PRIMARY,
                  },
                }}
              />
            ))}
          </Stack>
        </Box>

        <Divider sx={{ borderColor: BORDER_LIGHT }} />

        {loading ? (
          <Box sx={{ py: 4 }}>
            <LinearProgress
              sx={{
                bgcolor: alpha(GOLD_PRIMARY, 0.1),
                '& .MuiLinearProgress-bar': { bgcolor: GOLD_PRIMARY },
              }}
            />
          </Box>
        ) : filteredDocs.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <DescriptionIcon sx={{ fontSize: 48, color: GRAY_MAIN, mb: 2, opacity: 0.5 }} />
            <Typography sx={{ fontWeight: 600, color: CHARCOAL }}>
              Nenhum documento encontrado
            </Typography>
            <Typography sx={{ color: GRAY_MAIN, fontSize: '0.85rem', mt: 0.5 }}>
              Faça upload do primeiro documento utilizando o card ao lado
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {filteredDocs.map((doc) => (
              <Fade key={doc.id} in={true}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${BORDER_LIGHT}`,
                    '&:hover': {
                      borderColor: GOLD_PRIMARY,
                      boxShadow: `0 4px 12px ${alpha(CHARCOAL, 0.05)}`,
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={2} alignItems="center">
                      {getFileIcon(doc.caminho_arquivo)}
                      <Box>
                        <Typography sx={{ fontWeight: 600, color: CHARCOAL }}>
                          {doc.caminho_arquivo.split('/').pop()}
                        </Typography>
                        <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                          <Chip
                            label={doc.categoria}
                            size="small"
                            sx={{
                              bgcolor: alpha(GOLD_PRIMARY, 0.05),
                              color: GOLD_PRIMARY,
                              fontSize: '0.7rem',
                              height: 20,
                            }}
                          />
                          {doc.data_envio && (
                            <Typography sx={{ color: GRAY_MAIN, fontSize: '0.7rem' }}>
                              {new Date(doc.data_envio).toLocaleDateString('pt-BR')}
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Download">
                        <IconButton
                          onClick={() => onDownload(doc.id)}
                          size="small"
                          sx={{ color: GOLD_PRIMARY }}
                        >
                          <FileDownloadIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton
                          onClick={() => onDelete(doc.id)}
                          size="small"
                          sx={{ color: ERROR }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Paper>
              </Fade>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};

export default function ClientePerfilPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const code = useMemo(() => (searchParams.get('code') || '').trim(), [searchParams]);

  const [loading, setLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [docs, setDocs] = useState<DocCliente[]>([]);
  const [lastUpdated, setLastUpdated] = useState('');

  const [categoriaUpload, setCategoriaUpload] = useState('CONTRATO');
  const [file, setFile] = useState<File | null>(null);

  const [categoriaFilter, setCategoriaFilter] = useState<string>('ALL');

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<AlertType>('info');

  const showAlert = (message: string, severity: AlertType) => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  const loadCustomer = async () => {
    if (!code) return;

    setLoading(true);
    const res = await services(`/customers/${code}`, { method: 'GET' });

    if (!res.success) {
      showAlert(pickApiError(res.data), 'error');
      setCustomer(null);
      setLoading(false);
      return;
    }

    const c = normalizeCustomer(res.data);
    setCustomer(c);
    setLastUpdated(new Date().toLocaleString());
    setLoading(false);
  };

  const loadDocs = async (id_cliente: string) => {
    setDocsLoading(true);

    const res = await services(`/docs-clientes?id_cliente=${encodeURIComponent(id_cliente)}`, {
      method: 'GET',
    });

    if (!res.success) {
      showAlert(pickApiError(res.data), 'error');
      setDocs([]);
      setDocsLoading(false);
      return;
    }

    setDocs(normalizeDocList(res.data));
    setDocsLoading(false);
  };

  const refreshAll = async () => {
    await loadCustomer();
  };

  useEffect(() => {
    (async () => {
      if (!code) {
        showAlert('Código do cliente não informado.', 'warning');
        setLoading(false);
        return;
      }

      await loadCustomer();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  useEffect(() => {
    if (customer?.id) {
      loadDocs(customer.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id]);

  const onUpload = async () => {
    if (!customer?.id) {
      showAlert('Cliente inválido para upload.', 'warning');
      return;
    }

    if (!file) {
      showAlert('Selecione um arquivo.', 'warning');
      return;
    }

    setUploading(true);

    const form = new FormData();
    form.append('file', file);
    form.append('id_cliente', customer.id);
    form.append('categoria', categoriaUpload);

    const res = await services(`/docs-clientes/upload`, {
      method: 'POST',
      data: form,
      headers: { 'Content-Type': 'multipart/form-data' } as any,
    });

    setUploading(false);

    if (!res.success) {
      showAlert(pickApiError(res.data), 'error');
      return;
    }

    showAlert('Documento enviado com sucesso.', 'success');
    setFile(null);
    await loadDocs(customer.id);
  };

  const onDownload = async (docId: string) => {
    try {
      const doc = docs.find((d) => d.id === docId);
      const fileName = doc ? doc.caminho_arquivo.split('/').pop() : `documento_${docId}`;

      const res = await services(`/documents/download/${encodeURIComponent(docId)}`, {
        method: 'GET',
        responseType: 'blob',
      });

      if (!res.success) {
        console.error('Erro backend:', res);
        showAlert('Erro ao baixar: Arquivo não encontrado no servidor.', 'error');
        return;
      }

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'download');

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro download:', error);
      showAlert('Falha de conexão ao tentar baixar arquivo.', 'error');
    }
  };

  const onDelete = async (docId: string) => {
    const result = await Swal.fire({
      title: 'Excluir documento?',
      text: 'Esta ação não pode ser desfeita.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: ERROR,
      cancelButtonColor: GRAY_MAIN,
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    const res = await services(`/docs-clientes/${encodeURIComponent(docId)}`, {
      method: 'DELETE',
    });

    if (!res.success) {
      showAlert(pickApiError(res.data), 'error');
      return;
    }

    showAlert('Documento excluído.', 'warning');

    if (customer?.id) {
      await loadDocs(customer.id);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <ProfileHeader
        onBack={() => router.push('/clients')}
        onRefresh={async () => {
          await refreshAll();
          if (customer?.id) {
            await loadDocs(customer.id);
          }
        }}
        loading={loading || docsLoading}
        customerCode={customer?.code}
      />

      {loading ? (
        <Paper elevation={0} sx={{ p: 6, borderRadius: 3, textAlign: 'center' }}>
          <CircularProgress sx={{ color: GOLD_PRIMARY }} />
          <Typography sx={{ mt: 2, color: GRAY_MAIN, fontWeight: 600 }}>
            Carregando perfil do cliente...
          </Typography>
        </Paper>
      ) : !customer ? (
        <Paper elevation={0} sx={{ p: 6, borderRadius: 3, textAlign: 'center' }}>
          <PersonIcon sx={{ fontSize: 64, color: GRAY_MAIN, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: CHARCOAL }}>
            Cliente não encontrado
          </Typography>
          <Typography sx={{ color: GRAY_MAIN, mt: 1 }}>
            Verifique o código informado e tente novamente.
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.push('/clients')}
            sx={{
              mt: 3,
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              bgcolor: GOLD_PRIMARY,
              '&:hover': { bgcolor: GOLD_LIGHT },
            }}
          >
            Voltar para lista de clientes
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 7, lg: 8 }}>
              <CustomerSummaryCard customer={customer} lastUpdated={lastUpdated} />
            </Grid>

            <Grid size={{ xs: 12, md: 5, lg: 4 }}>
              <DocumentUploadCard
                categoria={categoriaUpload}
                setCategoria={setCategoriaUpload}
                file={file}
                setFile={setFile}
                onUpload={onUpload}
                uploading={uploading}
              />
            </Grid>
          </Grid>

          <DocumentsTableCard
            docs={docs}
            categoriaFilter={categoriaFilter}
            setCategoriaFilter={setCategoriaFilter}
            onRefresh={() => {
              if (customer?.id) {
                loadDocs(customer.id);
              }
            }}
            onDownload={onDownload}
            onDelete={onDelete}
            loading={docsLoading}
          />
        </Box>
      )}

      <AppAlert
        open={alertOpen}
        message={alertMessage}
        severity={alertSeverity}
        onClose={() => setAlertOpen(false)}
      />
    </Container>
  );
}