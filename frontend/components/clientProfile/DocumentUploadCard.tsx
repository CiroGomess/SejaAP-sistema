'use client';

import React, { useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  MenuItem,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';

import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const BRAND = '#ff6600';
const ALLOWED_EXT = ['pdf', 'csv', 'xlsx'];

export default function DocumentUploadCard({
  categoria,
  setCategoria,
  file,
  setFile,
  onUpload,
  uploading,
}: {
  categoria: string;
  setCategoria: (v: string) => void;
  file: File | null;
  setFile: (f: File | null) => void;
  onUpload: () => void;
  uploading: boolean;
}) {
  const filename = useMemo(() => file?.name || '', [file]);
  const ext = useMemo(() => (filename.includes('.') ? filename.split('.').pop()!.toLowerCase() : ''), [filename]);
  const isAllowed = !file ? true : ALLOWED_EXT.includes(ext);

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 3,
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        boxShadow: '0 14px 40px rgba(17, 24, 39, 0.08)',
      }}
    >
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${BRAND}, rgba(255,102,0,0.18))` }} />

      <CardContent
        sx={{
          p: 3,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 950, color: '#111827', fontSize: 18 }}>
              Enviar documento
            </Typography>

            <Box sx={{ mt: 0.4, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <InfoOutlinedIcon sx={{ fontSize: 16, color: '#6b7280' }} />
              <Typography sx={{ color: '#6b7280', fontSize: 12 }}>
                Permitidos: PDF, CSV, XLSX
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2.25, borderColor: '#eef2f7' }} />

        {/* MAIN (retângulo grande do esboço) */}
        <Box
          sx={{
            borderRadius: 2.5,
            border: '1px solid #e5e7eb',
            backgroundColor: '#fbfdff',
            p: 2,
            display: 'grid',
            gap: 1.5,
            flex: 1,
            minHeight: 0,
          }}
        >
          <TextField
            select
            label="Categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            InputProps={{
              startAdornment: <CategoryRoundedIcon sx={{ mr: 1, color: '#9ca3af' }} />,
            }}
            sx={{
              '& .MuiInputBase-root': { borderRadius: 2, backgroundColor: '#ffffff' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
              '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BRAND },
              '& .MuiInputLabel-root': { color: '#6b7280' },
              '& .MuiInputLabel-root.Mui-focused': { color: BRAND },
            }}
          >
            <MenuItem value="CONTRATO">CONTRATO</MenuItem>
            <MenuItem value="RG">RG</MenuItem>
            <MenuItem value="CPF">CPF</MenuItem>
            <MenuItem value="COMPROVANTE_ENDERECO">COMPROVANTE_ENDEREÇO</MenuItem>
            <MenuItem value="OUTROS">OUTROS</MenuItem>
          </TextField>

          {/* “Dropzone” / arquivo */}
          <Box
            sx={{
              borderRadius: 2.5,
              border: '1px dashed #cbd5e1',
              backgroundColor: '#ffffff',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              minWidth: 0,
            }}
          >
            <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center', minWidth: 0 }}>
              <InsertDriveFileRoundedIcon sx={{ color: isAllowed ? '#6b7280' : '#ef4444' }} />

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 900,
                    color: isAllowed ? '#111827' : '#ef4444',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {file ? file.name : 'Nenhum arquivo selecionado'}
                </Typography>

                <Typography sx={{ fontSize: 12, color: '#6b7280', mt: 0.2 }}>
                  Clique em “Selecionar arquivo”
                </Typography>
              </Box>
            </Box>

            <Button
              component="label"
              variant="outlined"
              sx={{
                flexShrink: 0,
                textTransform: 'none',
                borderRadius: 2,
                fontWeight: 900,
                borderColor: '#e5e7eb',
                color: '#111827',
                backgroundColor: '#ffffff',
                '&:hover': { backgroundColor: 'rgba(255,102,0,0.06)', borderColor: 'rgba(255,102,0,0.35)' },
              }}
            >
              Selecionar
              <input
                hidden
                type="file"
                accept=".pdf,.csv,.xlsx"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setFile(f);
                }}
              />
            </Button>
          </Box>

          {!isAllowed && file ? (
            <Typography sx={{ fontSize: 12, color: '#ef4444', fontWeight: 800 }}>
              Arquivo inválido. Permitidos: PDF, CSV, XLSX.
            </Typography>
          ) : null}
        </Box>

        {/* BOTTOM (barra do esboço) */}
        <Button
          onClick={onUpload}
          disabled={uploading || !file || !isAllowed}
          startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadRoundedIcon />}
          variant="contained"
          sx={{
            mt: 2,
            width: '100%',
            textTransform: 'none',
            borderRadius: 2.5,
            fontWeight: 950,
            py: 1.4,
            background: `linear-gradient(90deg, ${BRAND}, #ff8a3d)`,
            boxShadow: '0 10px 22px rgba(255,102,0,0.20)',
            '&:hover': { background: 'linear-gradient(90deg, #ff7a1a, #ff9a57)' },
          }}
        >
          {uploading ? 'Enviando...' : 'Enviar documento'}
        </Button>
      </CardContent>
    </Card>
  );
}
