'use client';

import React, { useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  MenuItem,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';

// Ajuste o caminho do import conforme a estrutura do seu projeto
import { DocCliente } from './types'; 

const BRAND = '#ff6600';

// Função auxiliar para mostrar apenas o nome do arquivo, removendo pastas
function shortFileName(path: string) {
  if (!path) return '-';
  const parts = path.split('/');
  return parts[parts.length - 1] || path;
}

interface DocumentsTableCardProps {
  docs: DocCliente[];
  categoriaFilter: string;
  setCategoriaFilter: (v: string) => void;
  onRefresh: () => void;
  onDownload: (docId: number) => void; 
  onDelete: (docId: number) => void;
  loading?: boolean;
}

export default function DocumentsTableCard({
  docs,
  categoriaFilter,
  setCategoriaFilter,
  onRefresh,
  onDownload,
  onDelete,
  loading,
}: DocumentsTableCardProps) {

  // --- ESTADOS DO MODAL DE DOWNLOAD ---
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [docToDownload, setDocToDownload] = useState<DocCliente | null>(null);

  // Filtragem local
  const filtered = useMemo(() => {
    if (!categoriaFilter || categoriaFilter === 'ALL') return docs;
    return docs.filter((d) => String(d.categoria || '').toUpperCase() === categoriaFilter);
  }, [docs, categoriaFilter]);

  // Abre o modal e define qual documento será baixado
  const handleRequestDownload = (doc: DocCliente) => {
    setDocToDownload(doc);
    setDownloadModalOpen(true);
  };

  // Executa o download real e fecha o modal
  const handleConfirmDownload = () => {
    if (docToDownload) {
      onDownload(docToDownload.id); // Chama a função do Pai que faz o Blob
    }
    setDownloadModalOpen(false);
    setDocToDownload(null);
  };

  // Fecha o modal sem baixar
  const handleCloseModal = () => {
    setDownloadModalOpen(false);
    setDocToDownload(null);
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        boxShadow: '0 14px 40px rgba(17, 24, 39, 0.08)',
      }}
    >
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${BRAND}, rgba(255,102,0,0.18))` }} />

      <CardContent sx={{ p: 3 }}>
        {/* CABEÇALHO E FILTROS */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Box>
            <Typography sx={{ fontWeight: 950, color: '#111827', fontSize: 18 }}>
              Documentos
            </Typography>
            <Typography sx={{ color: '#6b7280', fontSize: 12, mt: 0.25 }}>
              Total listado: {filtered.length}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              select
              size="small"
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
              sx={{
                minWidth: 200,
                '& .MuiInputBase-root': { borderRadius: 2, backgroundColor: '#ffffff', fontSize: 13 },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BRAND },
              }}
              InputProps={{
                startAdornment: <CategoryRoundedIcon sx={{ mr: 1, color: '#9ca3af', fontSize: 18 }} />,
              }}
            >
              <MenuItem value="ALL">Todas as categorias</MenuItem>
              <MenuItem value="CONTRATO">CONTRATO</MenuItem>
              <MenuItem value="RG">RG</MenuItem>
              <MenuItem value="CPF">CPF</MenuItem>
              <MenuItem value="COMPROVANTE_ENDERECO">COMPROVANTE ENDEREÇO</MenuItem>
              <MenuItem value="OUTROS">OUTROS</MenuItem>
            </TextField>

            <Tooltip title="Atualizar lista">
              <IconButton
                onClick={onRefresh}
                disabled={!!loading}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#ffffff',
                  color: BRAND,
                  '&:hover': { backgroundColor: 'rgba(255,102,0,0.06)', borderColor: 'rgba(255,102,0,0.35)' },
                }}
              >
                <RefreshRoundedIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Divider sx={{ my: 2.25, borderColor: '#eef2f7' }} />

        {/* TABELA DE DADOS */}
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid #eef2f7' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 950, color: '#6b7280', backgroundColor: '#f9fafb' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionRoundedIcon sx={{ fontSize: 18 }} /> Arquivo
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 950, color: '#6b7280', backgroundColor: '#f9fafb' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FolderRoundedIcon sx={{ fontSize: 18 }} /> Categoria
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 950, color: '#6b7280', backgroundColor: '#f9fafb' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTimeRoundedIcon sx={{ fontSize: 18 }} /> Data
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 950, color: '#6b7280', backgroundColor: '#f9fafb', width: 140 }}>
                  Ações
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filtered.map((d) => (
                <TableRow key={d.id} hover sx={{ '&:hover': { backgroundColor: 'rgba(255,102,0,0.02)' } }}>
                  <TableCell sx={{ borderBottom: '1px solid #eef2f7' }}>
                    <Typography sx={{ fontWeight: 950, color: '#111827', fontSize: 13 }}>
                      {shortFileName(d.caminho_arquivo)}
                    </Typography>
                    <Typography sx={{ color: '#6b7280', fontSize: 11, mt: 0.3 }}>
                      {d.caminho_arquivo}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ borderBottom: '1px solid #eef2f7' }}>
                    <Chip
                      label={d.categoria || 'Geral'}
                      variant="outlined"
                      size="small"
                      sx={{ fontWeight: 800, fontSize: 11, borderColor: '#e5e7eb', color: '#4b5563' }}
                    />
                  </TableCell>

                  <TableCell sx={{ borderBottom: '1px solid #eef2f7' }}>
                    <Typography sx={{ color: '#111827', fontWeight: 600, fontSize: 13 }}>
                      {d.data_envio ? new Date(d.data_envio).toLocaleDateString('pt-BR') : '-'}
                    </Typography>
                  </TableCell>

                  <TableCell align="center" sx={{ borderBottom: '1px solid #eef2f7' }}>
                    {/* AÇÃO DE DOWNLOAD (ABRE MODAL AGORA) */}
                    <Tooltip title="Baixar Arquivo">
                      <IconButton
                        onClick={() => handleRequestDownload(d)} // <--- Alterado aqui
                        size="small"
                        sx={{
                          mr: 1,
                          borderRadius: 2,
                          color: '#111827',
                          '&:hover': { backgroundColor: 'rgba(255,102,0,0.10)', color: BRAND },
                        }}
                      >
                        <DownloadRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {/* AÇÃO DE EXCLUIR */}
                    <Tooltip title="Excluir">
                      <IconButton
                        onClick={() => onDelete(d.id)}
                        size="small"
                        sx={{
                          borderRadius: 2,
                          color: '#ef4444',
                          '&:hover': { backgroundColor: 'rgba(239,68,68,0.10)' },
                        }}
                      >
                        <DeleteRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <Typography sx={{ color: '#6b7280', fontWeight: 800 }}>
                      Nenhum documento encontrado.
                    </Typography>
                    <Typography sx={{ color: '#9ca3af', fontSize: 12, mt: 0.5 }}>
                      Verifique os filtros ou envie um novo arquivo.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>

      {/* --- MODAL DE CONFIRMAÇÃO DE DOWNLOAD --- */}
      <Dialog
        open={downloadModalOpen}
        onClose={handleCloseModal}
        PaperProps={{
          sx: { borderRadius: 3, p: 1, maxWidth: 450 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ 
            bgcolor: 'rgba(255,102,0,0.1)', 
            p: 1, 
            borderRadius: 2, 
            display: 'flex', 
            color: BRAND 
          }}>
            <CloudDownloadIcon />
          </Box>
          <Typography variant="h6" fontWeight={800}>Confirmar Download</Typography>
        </DialogTitle>
        
        <DialogContent>
          <DialogContentText sx={{ color: '#374151' }}>
            Você está prestes a baixar o arquivo:
            <br />
            <Typography component="span" fontWeight={700} color="#111827" sx={{ display: 'block', mt: 1, mb: 1 }}>
              {docToDownload ? shortFileName(docToDownload.caminho_arquivo) : '...'}
            </Typography>
            Deseja continuar?
          </DialogContentText>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleCloseModal} 
            variant="outlined"
            sx={{ 
              borderRadius: 2, 
              color: '#6b7280', 
              borderColor: '#e5e7eb',
              textTransform: 'none',
              fontWeight: 700
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmDownload} 
            variant="contained" 
            autoFocus
            sx={{ 
              borderRadius: 2, 
              bgcolor: BRAND, 
              textTransform: 'none',
              fontWeight: 700,
              '&:hover': { bgcolor: '#e65100' }
            }}
          >
            Confirmar e Baixar
          </Button>
        </DialogActions>
      </Dialog>

    </Card>
  );
}