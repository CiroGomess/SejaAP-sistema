'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Button,
  Card,
  Chip,
  TextField,
  InputAdornment,
  Stack,
  Tooltip,
  TablePagination,
  Avatar,
  alpha,
  Divider,
  Fade,
  Zoom,
} from '@mui/material';

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

import AppAlert, { AlertType } from '../../components/AppAlert';
import services from '@/services/service';

import CustomerModal, { Customer, CustomerForm, CustomerStatus, UserForm } from '@/components/clientProfile/CustomerModal';

// --- PALETA DE CORES EAP (Refinada) ---
const GOLD_PRIMARY = '#B8860B';
const GOLD_LIGHT = '#DAA520';
const CHARCOAL = '#2C2C2C';
const GRAY_MAIN = '#757575';
const GRAY_EXTRA_LIGHT = '#FAFAFC';
const WHITE = '#FFFFFF';
const BORDER_LIGHT = 'rgba(0, 0, 0, 0.08)';
const BORDER_MEDIUM = 'rgba(0, 0, 0, 0.12)';

// Cores Semânticas
const COLOR_SUCCESS = '#10B981';
const COLOR_SUCCESS_LIGHT = '#D1FAE5';
const COLOR_ERROR = '#EF4444';
const COLOR_ERROR_LIGHT = '#FEE2E2';
const COLOR_WARNING = '#F59E0B';
const COLOR_WARNING_LIGHT = '#FEF3C7';

/* =======================
   Status Chip Refinado
======================= */
function StatusChip({ status }: { status: CustomerStatus }) {
  const config = {
    active: {
      label: 'Ativo',
      color: COLOR_SUCCESS,
      bg: COLOR_SUCCESS_LIGHT,
      icon: <PersonIcon sx={{ fontSize: 14 }} />
    },
    pending: {
      label: 'Pendente',
      color: COLOR_WARNING,
      bg: COLOR_WARNING_LIGHT,
      icon: <BusinessIcon sx={{ fontSize: 14 }} />
    },
    inactive: {
      label: 'Inativo',
      color: COLOR_ERROR,
      bg: COLOR_ERROR_LIGHT,
      icon: <PersonIcon sx={{ fontSize: 14 }} />
    },
  }[status] || { label: status, color: COLOR_SUCCESS, bg: COLOR_SUCCESS_LIGHT, icon: <PersonIcon sx={{ fontSize: 14 }} /> };

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      size="small"
      sx={{
        bgcolor: config.bg,
        color: config.color,
        fontWeight: 700,
        fontSize: '0.75rem',
        height: 24,
        '& .MuiChip-icon': {
          color: config.color,
        },
        border: `1px solid ${alpha(config.color, 0.2)}`,
      }}
    />
  );
}

/* =======================
   Helpers
======================= */
function fullName(c: Customer) {
  return `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim();
}

function pickApiError(data: any): string {
  if (!data) return 'Erro inesperado.';
  if (typeof data === 'string') return data;
  if (typeof data.detail === 'string') return data.detail;
  if (typeof data.message === 'string') return data.message;

  if (typeof data === 'object') {
    const firstKey = Object.keys(data)[0];
    const val = (data as any)[firstKey];
    if (Array.isArray(val) && val.length) return `${firstKey}: ${val[0]}`;
    if (typeof val === 'string') return `${firstKey}: ${val}`;
  }

  return 'Falha ao processar a requisição.';
}

function generateCustomerCode(len = 15) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

function normalizeCustomer(input: any): Customer {
  const c = input?.customer ?? input ?? {};

  return {
    code: String(c.code ?? ''),
    first_name: String(c.first_name ?? ''),
    last_name: String(c.last_name ?? ''),
    email: String(c.email ?? ''),
    document: String(c.document ?? ''),
    phone: String(c.phone ?? ''),
    is_whatsapp: Boolean(c.is_whatsapp),
    status: (c.status ?? 'active') as CustomerStatus,
    company_name: c.company_name ?? null,
    notes: c.notes ?? null,
    IPCA: c.IPCA ?? null,
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

function normalizeCustomerList(data: any): Customer[] {
  const list = Array.isArray(data?.customers) ? data.customers : Array.isArray(data) ? data : [];
  return list.map(normalizeCustomer).filter((c) => !!c.code);
}

/* =======================
   Componente principal
======================= */
export default function ClienteTable() {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<Customer[]>([]);

  // Paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Alert State
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<AlertType>('info');

  const showAlert = (message: string, severity: AlertType) => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // ✅ Form com todos os campos incluindo user
  const [form, setForm] = useState<CustomerForm>({
    first_name: '',
    last_name: '',
    email: '',
    document: '',
    phone: '',
    is_whatsapp: true,
    status: 'active',
    company_name: '',
    notes: '',
    IPCA: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    user: {
      username: '',
      password: '',
      email: '',
      first_name: '',
      last_name: '',
      is_superuser: false,
      is_staff: false,
      is_active: true,
    },
  });

  const resetForm = () => {
    setForm({
      first_name: '',
      last_name: '',
      email: '',
      document: '',
      phone: '',
      is_whatsapp: true,
      status: 'active',
      company_name: '',
      notes: '',
      IPCA: '',
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      user: {
        username: '',
        password: '',
        email: '',
        first_name: '',
        last_name: '',
        is_superuser: false,
        is_staff: false,
        is_active: true,
      },
    });
  };

  /* =======================
     Load customers
  ======================= */
  const loadCustomers = async () => {
    setLoading(true);
    setLastUpdated(new Date().toLocaleString('pt-BR'));

    const res = await services('/customers', { method: 'GET' });

    if (!res.success) {
      showAlert(pickApiError(res.data), 'error');
      setRows([]);
      setLoading(false);
      return;
    }

    const normalized = normalizeCustomerList(res.data);
    setRows(normalized);
    setLoading(false);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  /* =======================
     Filter & Pagination
  ======================= */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((c) => {
      const nome = fullName(c).toLowerCase();
      const email = (c.email || '').toLowerCase();
      const doc = (c.document || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      return nome.includes(q) || email.includes(q) || doc.includes(q) || phone.includes(q);
    });
  }, [rows, search]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return filtered.slice(start, end);
  }, [filtered, page, rowsPerPage]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  /* =======================
     Handlers
  ======================= */
  const handleAdd = () => {
    setEditing(null);
    resetForm();
    setModalOpen(true);
  };

  const handleEdit = (c: Customer) => {
    setEditing(c);

    setForm({
      first_name: c.first_name ?? '',
      last_name: c.last_name ?? '',
      email: c.email ?? '',
      document: c.document ?? '',
      phone: c.phone ?? '',
      is_whatsapp: Boolean(c.is_whatsapp),
      status: (c.status ?? 'active') as CustomerStatus,
      company_name: (c.company_name ?? '') as string,
      notes: (c.notes ?? '') as string,
      IPCA: c.IPCA ? String(c.IPCA) : '',
      cep: (c.cep ?? '') as string,
      street: (c.street ?? '') as string,
      number: (c.number ?? '') as string,
      complement: (c.complement ?? '') as string,
      neighborhood: (c.neighborhood ?? '') as string,
      city: (c.city ?? '') as string,
      state: (c.state ?? '') as string,
      // ✅ Na edição, não preenchemos os dados do usuário
      // O backend deve lidar com isso separadamente
      user: undefined,
    });

    setModalOpen(true);
  };

  const handleDelete = async (c: Customer) => {
    const result = await Swal.fire({
      title: 'Excluir cliente?',
      html: `
      <div style="text-align: center; font-family: 'Inter', system-ui, -apple-system, sans-serif;">
        <div style="
          width: 72px;
          height: 72px;
          margin: 0 auto 16px auto;
          background: ${alpha(COLOR_ERROR, 0.1)};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9V14M12 17V17.5M3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12Z" 
              stroke="${COLOR_ERROR}" 
              stroke-width="1.5" 
              stroke-linecap="round"
            />
          </svg>
        </div>

        <div style="
          background: ${GRAY_EXTRA_LIGHT};
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          border: 1px solid ${BORDER_LIGHT};
        ">
          <div style="
            color: ${CHARCOAL};
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 4px;
          ">
            ${fullName(c)}
          </div>
          <div style="
            color: ${GRAY_MAIN};
            font-size: 13px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
          ">
            <span style="
              background: ${WHITE};
              padding: 4px 8px;
              border-radius: 6px;
              font-family: 'SF Mono', 'Fira Code', monospace;
              font-size: 12px;
              border: 1px solid ${BORDER_LIGHT};
            ">
              ${c.code}
            </span>
          </div>
        </div>

        <div style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 20px;
        ">
          <div style="
            background: ${GRAY_EXTRA_LIGHT};
            border-radius: 8px;
            padding: 8px;
            text-align: left;
          ">
            <div style="
              color: ${GRAY_MAIN};
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 2px;
            ">
              Documento
            </div>
            <div style="
              color: ${CHARCOAL};
              font-weight: 600;
              font-size: 13px;
            ">
              ${c.document || '-'}
            </div>
          </div>
          <div style="
            background: ${GRAY_EXTRA_LIGHT};
            border-radius: 8px;
            padding: 8px;
            text-align: left;
          ">
            <div style="
              color: ${GRAY_MAIN};
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 2px;
            ">
              Telefone
            </div>
            <div style="
              color: ${CHARCOAL};
              font-weight: 600;
              font-size: 13px;
            ">
              ${c.phone || '-'}
            </div>
          </div>
        </div>

        <div style="
          background: ${alpha(COLOR_ERROR, 0.05)};
          border-radius: 8px;
          padding: 12px;
          border: 1px solid ${alpha(COLOR_ERROR, 0.1)};
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 8px;
            color: ${COLOR_ERROR};
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 4px;
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 8V12M12 16H12.01M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z" 
                stroke="${COLOR_ERROR}" 
                stroke-width="1.5"
              />
            </svg>
            <span>Ação irreversível</span>
          </div>
          <div style="
            color: ${GRAY_MAIN};
            font-size: 13px;
            line-height: 1.4;
          ">
            Esta ação não poderá ser desfeita. Todos os dados e documentos associados a este cliente serão permanentemente removidos.
          </div>
        </div>
      </div>
    `,
      icon: undefined,
      showCancelButton: true,
      confirmButtonText: 'Confirmar exclusão',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: COLOR_ERROR,
      cancelButtonColor: GRAY_MAIN,
      focusCancel: true,
      reverseButtons: true,
      background: WHITE,
      backdrop: 'rgba(0,0,0,0.5)',
      customClass: {
        popup: 'rounded-3xl',
      },
      buttonsStyling: true,
      showCloseButton: true,
      closeButtonHtml: '×',
      padding: '24px',
      width: '480px',
    });

    if (!result.isConfirmed) return;

    const res = await services(`/customers/${c.code}`, { method: 'DELETE' });

    if (!res.success) {
      showAlert(pickApiError(res.data), 'error');
      return;
    }

    showAlert('Cliente removido com sucesso.', 'warning');
    setRows((prev) => prev.filter((x) => x.code !== c.code));
    await loadCustomers();
  };

  const validateForm = () => {
    if (!form.first_name.trim()) return 'Informe o nome.';
    if (!form.last_name.trim()) return 'Informe o sobrenome.';
    if (!form.email.trim()) return 'Informe o e-mail.';
    if (!form.document.trim()) return 'Informe CPF/CNPJ.';
    if (!form.phone.trim()) return 'Informe o contato.';
    
    // ✅ Validações adicionais para criação de novo cliente
    if (!editing) {
      if (!form.user?.username?.trim()) return 'Informe o nome de usuário.';
      if (!form.user?.password?.trim()) return 'Informe a senha.';
    }
    
    return null;
  };

  const handleSave = async () => {
    const err = validateForm();
    if (err) {
      showAlert(err, 'warning');
      return;
    }

    setSaving(true);

    // ✅ Construir payload completo
    const payload: any = {
      ...(editing ? {} : { code: generateCustomerCode(15) }),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim().toLowerCase(),
      document: String(form.document).replace(/\D/g, ''),
      phone: form.phone.trim(),
      is_whatsapp: Boolean(form.is_whatsapp),
      status: form.status,
      company_name: form.company_name.trim() ? form.company_name.trim() : null,
      notes: form.notes.trim() ? form.notes.trim() : null,
      IPCA: form.IPCA ? Number(form.IPCA.toString().replace(',', '.')) : null,
      cep: String(form.cep).replace(/\D/g, '') || null,
      street: form.street.trim() || null,
      number: form.number.trim() || null,
      complement: form.complement.trim() || null,
      neighborhood: form.neighborhood.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim().toUpperCase() || null,
    };

    // ✅ Adicionar dados do usuário apenas na criação
    if (!editing && form.user) {
      payload.user = {
        username: form.user.username.trim(),
        password: form.user.password,
        email: form.email.trim().toLowerCase(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        is_superuser: form.user.is_superuser || false,
        is_staff: form.user.is_staff || false,
        is_active: form.user.is_active !== false,
      };
    }

    const url = editing ? `/customers/${editing.code}` : `/customers`;
    const method = editing ? 'PUT' : 'POST';

    const res = await services(url, { method, data: payload });
    setSaving(false);

    if (!res.success) {
      showAlert(pickApiError(res.data), 'error');
      return;
    }

    const saved = normalizeCustomer(res.data);

    showAlert(
      editing ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.',
      'success'
    );

    setRows((prev) => {
      if (!editing) return [saved, ...prev];
      return prev.map((x) => (x.code === editing.code ? saved : x));
    });

    await loadCustomers();
    setModalOpen(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: GRAY_EXTRA_LIGHT,
        p: { xs: 2, md: 4 },
      }}
    >
      {/* Header da Página */}
      <Fade in timeout={500}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: CHARCOAL,
              letterSpacing: '-0.02em',
              mb: 0.5,
            }}
          >
            Gestão de Clientes
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: GRAY_MAIN,
              fontSize: '0.95rem',
            }}
          >
            Visualização, controle e manutenção do cadastro de clientes
          </Typography>
        </Box>
      </Fade>

      {/* Card Principal */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          border: `1px solid ${BORDER_LIGHT}`,
          bgcolor: WHITE,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: `0 8px 24px ${alpha(CHARCOAL, 0.05)}`,
          },
        }}
      >
        {/* Toolbar Superior */}
        <Box
          sx={{
            p: { xs: 2, md: 3 },
            borderBottom: `1px solid ${BORDER_LIGHT}`,
            bgcolor: WHITE,
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', md: 'center' }}
            spacing={2}
          >
            {/* Informações da Base */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: CHARCOAL }}>
                Base Cadastrada
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                <Chip
                  label={`${filtered.length} registros`}
                  size="small"
                  sx={{
                    bgcolor: alpha(GOLD_PRIMARY, 0.1),
                    color: GOLD_PRIMARY,
                    fontWeight: 600,
                    borderRadius: 1.5,
                  }}
                />
                {lastUpdated && (
                  <Typography variant="caption" sx={{ color: GRAY_MAIN }}>
                    Última atualização: {lastUpdated}
                  </Typography>
                )}
              </Stack>
            </Box>

            {/* Busca e Ações */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              <TextField
                size="small"
                placeholder="Buscar por nome, e-mail, documento ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: GRAY_MAIN, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: search && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearch('')}>
                        <DeleteIcon fontSize="small" sx={{ color: GRAY_MAIN }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: { xs: '100%', sm: 320 },
                  '& .MuiOutlinedInput-root': {
                    bgcolor: GRAY_EXTRA_LIGHT,
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '& fieldset': {
                      borderColor: BORDER_LIGHT,
                      borderWidth: '1.5px',
                    },
                    '&:hover fieldset': {
                      borderColor: GOLD_PRIMARY,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: GOLD_PRIMARY,
                      borderWidth: '2px',
                    },
                  },
                }}
              />

              <Tooltip title="Atualizar dados" TransitionComponent={Zoom}>
                <IconButton
                  onClick={loadCustomers}
                  sx={{
                    width: { xs: '100%', sm: 40 },
                    height: 40,
                    border: `1px solid ${BORDER_LIGHT}`,
                    borderRadius: 2,
                    color: CHARCOAL,
                    '&:hover': {
                      borderColor: GOLD_PRIMARY,
                      bgcolor: alpha(GOLD_PRIMARY, 0.05),
                    },
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAdd}
                disableElevation
                fullWidth={false}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 3,
                  height: 40,
                  bgcolor: GOLD_PRIMARY,
                  color: WHITE,
                  '&:hover': {
                    bgcolor: GOLD_LIGHT,
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 12px ${alpha(GOLD_PRIMARY, 0.3)}`,
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Novo Cliente
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* Paginação no Topo */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            px: 2,
          }}
        >
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Linhas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} de ${count}`
            }
            sx={{
              borderBottom: 'none',
              color: CHARCOAL,
              '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                color: GRAY_MAIN,
                fontWeight: 500,
                fontSize: '0.875rem',
              },
              '.MuiTablePagination-select': {
                borderRadius: 1.5,
              },
            }}
          />
        </Box>

        {/* Tabela */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {['Cliente', 'Contato', 'Status', 'Ações'].map((col, index) => (
                  <TableCell
                    key={col}
                    align={col === 'Ações' ? 'center' : 'left'}
                    sx={{
                      fontWeight: 700,
                      color: GRAY_MAIN,
                      bgcolor: GRAY_EXTRA_LIGHT,
                      borderBottom: `1px solid ${BORDER_MEDIUM}`,
                      py: 2,
                      ...(index === 0 && { pl: 3 }),
                      ...(col === 'Ações' && { pr: 3 }),
                    }}
                  >
                    {col}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 8, borderBottom: 'none' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Typography sx={{ color: GRAY_MAIN, fontWeight: 500 }}>
                        Carregando clientes...
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {paginatedRows.map((c) => (
                    <Fade key={c.code} in timeout={300}>
                      <TableRow
                        hover
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: alpha(GOLD_PRIMARY, 0.02),
                          },
                          '& td': {
                            borderBottom: `1px solid ${BORDER_LIGHT}`,
                            py: 2,
                          },
                        }}
                        onClick={() => router.push(`/clients/perfil?code=${encodeURIComponent(c.code)}`)}
                      >
                        {/* Cliente */}
                        <TableCell sx={{ pl: 3 }}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar
                              sx={{
                                width: 40,
                                height: 40,
                                bgcolor: alpha(GOLD_PRIMARY, 0.1),
                                color: GOLD_PRIMARY,
                                fontSize: '0.9rem',
                                fontWeight: 700,
                              }}
                            >
                              {c.first_name?.[0]}{c.last_name?.[0]}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontWeight: 700, color: CHARCOAL }}>
                                {fullName(c)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: GRAY_MAIN }}>
                                {c.email}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        {/* Contato */}
                        <TableCell>
                          <Stack direction="row" spacing={2}>
                            <Tooltip title={c.phone}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <PhoneIcon sx={{ fontSize: 16, color: GRAY_MAIN }} />
                                <Typography variant="body2" sx={{ color: CHARCOAL }}>
                                  {c.phone}
                                </Typography>
                              </Box>
                            </Tooltip>
                            {c.is_whatsapp && (
                              <Tooltip title="WhatsApp disponível">
                                <Box
                                  sx={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 1,
                                    bgcolor: alpha('#25D366', 0.1),
                                    color: '#25D366',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <PhoneIcon sx={{ fontSize: 12 }} />
                                </Box>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <StatusChip status={c.status} />
                        </TableCell>

                        {/* Ações */}
                        <TableCell align="center" sx={{ pr: 3 }}>
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Tooltip title="Editar" TransitionComponent={Zoom}>
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(c)}
                                sx={{
                                  color: GRAY_MAIN,
                                  borderRadius: 1.5,
                                  '&:hover': {
                                    color: GOLD_PRIMARY,
                                    bgcolor: alpha(GOLD_PRIMARY, 0.1),
                                  },
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Excluir" TransitionComponent={Zoom}>
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(c)}
                                sx={{
                                  color: GRAY_MAIN,
                                  borderRadius: 1.5,
                                  '&:hover': {
                                    color: COLOR_ERROR,
                                    bgcolor: alpha(COLOR_ERROR, 0.1),
                                  },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    </Fade>
                  ))}

                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 8, borderBottom: 'none' }}>
                        <Fade in timeout={500}>
                          <Box>
                            <SearchIcon
                              sx={{
                                fontSize: 48,
                                color: GRAY_MAIN,
                                opacity: 0.3,
                                mb: 2,
                              }}
                            />
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 600, color: CHARCOAL, mb: 0.5 }}
                            >
                              Nenhum cliente encontrado
                            </Typography>
                            <Typography sx={{ color: GRAY_MAIN, fontSize: '0.9rem', mb: 2 }}>
                              {search
                                ? 'Tente ajustar os termos da busca'
                                : 'Comece cadastrando um novo cliente'}
                            </Typography>
                            {!search && (
                              <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleAdd}
                                disableElevation
                                sx={{
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  borderRadius: 2,
                                  bgcolor: GOLD_PRIMARY,
                                  '&:hover': {
                                    bgcolor: GOLD_LIGHT,
                                  },
                                }}
                              >
                                Novo Cliente
                              </Button>
                            )}
                          </Box>
                        </Fade>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginação no Rodapé */}
        {filtered.length > 0 && (
          <>
            <Divider sx={{ borderColor: BORDER_LIGHT }} />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                bgcolor: WHITE,
                px: 2,
              }}
            >
              {/* Paginação já está no topo, pode remover daqui se quiser */}
            </Box>
          </>
        )}
      </Card>

      {/* Modal */}
      <CustomerModal
        open={modalOpen}
        editing={editing}
        form={form}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
      />

      {/* Alert */}
      <AppAlert
        open={alertOpen}
        message={alertMessage}
        severity={alertSeverity}
        onClose={() => setAlertOpen(false)}
      />
    </Box>
  );
}