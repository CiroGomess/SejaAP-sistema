'use client';

import React, { useEffect } from 'react';
import { Alert, Stack, Slide } from '@mui/material';

export type AlertType = 'success' | 'info' | 'warning' | 'error';

interface AppAlertProps {
  open: boolean;
  message: string;
  severity: AlertType;
  onClose: () => void;
  duration?: number; // default 5s
}

export default function AppAlert({
  open,
  message,
  severity,
  onClose,
  duration = 5000,
}: AppAlertProps) {

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  return (
    <Stack
      spacing={2}
      sx={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 2000,
      }}
    >
      <Slide direction="left" in={open} mountOnEnter unmountOnExit>
        <Alert
          severity={severity}
          variant="filled"
          onClose={onClose}
          sx={{
            minWidth: 320,
            boxShadow: 3,
            borderRadius: 2,
            fontWeight: 500,
          }}
        >
          {message}
        </Alert>
      </Slide>
    </Stack>
  );
}
