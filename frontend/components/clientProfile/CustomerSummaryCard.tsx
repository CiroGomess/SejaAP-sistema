'use client';

import React, { useMemo } from 'react';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Typography,
} from '@mui/material';

import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import PhoneIphoneRoundedIcon from '@mui/icons-material/PhoneIphoneRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import NotesRoundedIcon from '@mui/icons-material/NotesRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

import { Customer, formatAddress, fullName, statusColor, statusLabel } from './types';

const BRAND = '#ff6600';

function initialsFromCustomer(c: Customer) {
  const fn = (c.first_name || '').trim();
  const ln = (c.last_name || '').trim();
  const cn = (c.company_name || '').trim();

  if (cn) {
    const parts = cn.split(/\s+/).filter(Boolean);
    const a = (parts[0] || '').charAt(0);
    const b = (parts[1] || parts[0] || '').charAt(0);
    return (a + b).toUpperCase() || 'CL';
  }

  const a = fn.charAt(0);
  const b = ln.charAt(0);
  return (a + b).toUpperCase() || 'CL';
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid #eef2f7',
        backgroundColor: '#fbfdff',
        display: 'flex',
        gap: 1.5,
        alignItems: 'flex-start',
        minWidth: 0,
      }}
    >
      <Box sx={{ color: '#6b7280', mt: '2px', flexShrink: 0 }}>{icon}</Box>

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontSize: 12, color: '#6b7280', lineHeight: 1.2 }}>
          {label}
        </Typography>

        <Typography
          sx={{
            mt: 0.3,
            fontSize: 14,
            fontWeight: 950,
            color: '#111827',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

export default function CustomerSummaryCard({
  customer,
  lastUpdated,
}: {
  customer: Customer;
  lastUpdated: string;
}) {
  const address = useMemo(() => formatAddress(customer ?? null), [customer]);
  const initials = useMemo(() => initialsFromCustomer(customer), [customer]);
  const name = useMemo(() => fullName(customer), [customer]);

  const email = customer.email || '-';
  const phone = customer.phone || '-';
  const company = (customer.company_name || '').trim();

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

      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 950, color: '#111827', fontSize: 18 }}>
              Dados do cliente
            </Typography>
            <Typography sx={{ color: '#6b7280', fontSize: 12, mt: 0.25 }}>
              Última atualização: {lastUpdated || '-'}
            </Typography>
          </Box>

          <Chip
            label={statusLabel(customer.status)}
            color={statusColor(customer.status)}
            variant="outlined"
            sx={{ fontWeight: 950, flexShrink: 0 }}
          />
        </Box>

        <Divider sx={{ my: 2.25, borderColor: '#eef2f7' }} />

        {/* Main box */}
        <Box
          sx={{
            borderRadius: 3,
            border: '1px solid #e5e7eb',
            backgroundColor: '#ffffff',
            boxShadow: '0 10px 30px rgba(17,24,39,0.06)',
            p: 2.5,
          }}
        >
          {/* Top row: avatar + identity */}
          <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'stretch', minWidth: 0 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center', flexShrink: 0 }}>
              <Avatar
                sx={{
                  width: 84,
                  height: 84,
                  fontWeight: 950,
                  fontSize: 26,
                  color: '#111827',
                  backgroundColor: 'rgba(255,102,0,0.10)',
                  border: '2px solid rgba(255,102,0,0.20)',
                }}
              >
                {initials}
              </Avatar>

              {company ? (
                <Chip
                  icon={<BusinessRoundedIcon />}
                  label={company}
                  variant="outlined"
                  sx={{
                    fontWeight: 900,
                    maxWidth: 240,
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    },
                  }}
                />
              ) : null}
            </Box>

            <Box sx={{ flex: 1, minWidth: 0, display: 'grid', gap: 1.25 }}>
              {/* Name box */}
              <Box
                sx={{
                  borderRadius: 2.5,
                  p: 2,
                  backgroundColor: '#fbfdff',
                  border: '1px solid #eef2f7',
                }}
              >
                <Typography sx={{ color: '#6b7280', fontSize: 12, fontWeight: 900 }}>
                  Nome
                </Typography>
                <Typography
                  sx={{
                    mt: 0.25,
                    color: '#111827',
                    fontSize: 18,
                    fontWeight: 950,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {name || '-'}
                </Typography>

                <Typography sx={{ mt: 0.6, color: '#6b7280', fontSize: 12 }}>
                  Código:{' '}
                  <span style={{ fontFamily: 'monospace', fontWeight: 800 }}>{customer.code}</span>
                  {'  '}•{'  '}
                  ID:{' '}
                  <span style={{ fontFamily: 'monospace', fontWeight: 800 }}>{String(customer.id ?? '-')}</span>
                </Typography>
              </Box>

              {/* Quick contact */}
              <Box
                sx={{
                  borderRadius: 2.5,
                  p: 2,
                  backgroundColor: '#ffffff',
                  border: '1px solid #eef2f7',
                }}
              >
                <Typography sx={{ color: '#6b7280', fontSize: 12, fontWeight: 900 }}>
                  Contato rápido
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    alignItems: 'center',
                    mt: 0.8,
                    flexWrap: 'wrap',
                    minWidth: 0,
                  }}
                >
                  <Chip
                    icon={<EmailRoundedIcon />}
                    label={email}
                    variant="outlined"
                    sx={{
                      fontWeight: 800,
                      maxWidth: '100%',
                      '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
                    }}
                  />
                  <Chip
                    icon={<PhoneIphoneRoundedIcon />}
                    label={phone}
                    variant="outlined"
                    sx={{
                      fontWeight: 800,
                      maxWidth: '100%',
                      '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
                    }}
                  />
                  {customer.is_whatsapp ? (
                    <Chip icon={<WhatsAppIcon />} label="WhatsApp" variant="outlined" sx={{ fontWeight: 800 }} />
                  ) : null}
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Info rows */}
          <Box sx={{ mt: 2.5, display: 'grid', gap: 1.5 }}>
            <InfoRow icon={<BadgeRoundedIcon fontSize="small" />} label="CPF/CNPJ" value={customer.document || '-'} />
            <InfoRow icon={<LocationOnRoundedIcon fontSize="small" />} label="Endereço" value={address || '-'} />
            <InfoRow
              icon={<NotesRoundedIcon fontSize="small" />}
              label="Observações"
              value={customer.notes?.trim() ? customer.notes : '—'}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
