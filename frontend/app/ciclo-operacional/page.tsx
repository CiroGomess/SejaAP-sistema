'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import {
  Box,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Typography
} from '@mui/material';

import services from '@/services/service';
import AppAlert, { AlertType } from '@/components/AppAlert';

import { SelectedClient, DragStep, CycleRecord, CycleSummary } from '@/components/ciclo-operacional/types';
import NoClientState from '@/components/ciclo-operacional/NoClientState';
import CycleHeader from '@/components/ciclo-operacional/CycleHeader';
import ClientCard from '@/components/ciclo-operacional/ClientCard';
import DraggableStepCard from '@/components/ciclo-operacional/DraggableStepCard';
import CycleSummaryCard from '@/components/ciclo-operacional/CycleSummary';

import {
  ShoppingCart as CartIcon,
  Payments as PaymentsIcon,
  Sell as SellIcon,
  AttachMoney as MoneyIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';

const STORAGE_KEY = 'selectedClient';
const CYCLE_UPSERT_ENDPOINT = '/client-cycle-single';
const CYCLE_GET_ENDPOINT = (userId: number) => `/client-cycle-single/${userId}`;

function pickApiError(data: any): string {
  if (!data) return 'Erro inesperado.';
  if (typeof data === 'string') return data;
  if (typeof data.detail === 'string') return data.detail;
  if (typeof data.error === 'string') return data.error;
  if (typeof data.message === 'string') return data.message;
  return 'Falha ao processar a requisição.';
}

function normalizeType(op: any, fin: any) {
  const operacional = !!op;
  const financeiro = !!fin;
  if ((operacional && financeiro) || (!operacional && !financeiro)) {
    return { operacional: true, financeiro: false };
  }
  return { operacional, financeiro };
}

function stepMetaByLabel(label: string) {
  const normalized = String(label || '').trim().toLowerCase();
  if (normalized.includes('pedido de compra')) return { id: 'compra', icon: <CartIcon /> };
  if (normalized.includes('pagamento a fornecedores')) return { id: 'pagamento', icon: <PaymentsIcon /> };
  if (normalized.includes('venda de produto')) return { id: 'venda', icon: <SellIcon /> };
  if (normalized.includes('recebimento pela venda')) return { id: 'recebimento', icon: <MoneyIcon /> };
  return { id: `step_${normalized.replace(/\s+/g, '_')}`, icon: <InfoIcon /> };
}

function buildDefaultSteps(): DragStep[] {
  const base = [
    { label: 'Pedido de Compra', days: 0, operacional: true, financeiro: false },
    { label: 'Pagamento a Fornecedores', days: 29, operacional: false, financeiro: true },
    { label: 'Venda de Produto', days: 41, operacional: true, financeiro: false },
    { label: 'Recebimento pela Venda', days: 24, operacional: false, financeiro: true },
  ];

  return base.map((s) => {
    const meta = stepMetaByLabel(s.label);
    const fixed = normalizeType(s.operacional, s.financeiro);
    return {
      id: meta.id,
      label: s.label,
      days: s.days,
      icon: meta.icon,
      operacional: fixed.operacional,
      financeiro: fixed.financeiro,
    };
  });
}

export default function CicloOperacionalPage() {
  const router = useRouter();
  const [activeClient, setActiveClient] = useState<SelectedClient | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragSteps, setDragSteps] = useState<DragStep[]>(buildDefaultSteps());

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<AlertType>('info');

  const showAlert = (message: string, severity: AlertType) => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  const periodLabel = 'Últimos 90 dias';

  // Cálculo dos ciclos
  const summary = useMemo((): CycleSummary => {
    const pmp = dragSteps.find(s => s.id === 'pagamento')?.days || 0;
    const pme = dragSteps.find(s => s.id === 'venda')?.days || 0;
    const pmr = dragSteps.find(s => s.id === 'recebimento')?.days || 0;
    const cycleOperational = pme + pmr;
    const cycleFinancial = cycleOperational - pmp;

    return { pmp, pme, pmr, cycleOperational, cycleFinancial };
  }, [dragSteps]);

  // Carregar cliente do localStorage
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
          id: Number(parsed.id),
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

  // Validação de seleção
  function validateOneOfLocal(steps: DragStep[]) {
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      const count = (s.operacional ? 1 : 0) + (s.financeiro ? 1 : 0);
      if (count !== 1) return `Etapa ${i + 1}: selecione Operacional OU Financeiro.`;
    }
    return null;
  }

  // Carregar ciclo do backend
  useEffect(() => {
    const run = async () => {
      if (!activeClient?.id) return;

      setLoading(true);
      try {
        const res = await services(CYCLE_GET_ENDPOINT(activeClient.id), { method: 'GET' });

        if (!res.success) {
          showAlert('Nenhuma configuração encontrada. Use o padrão.', 'info');
          setDragSteps(buildDefaultSteps());
          return;
        }

        const record: CycleRecord | undefined = res.data;

        if (!record || !record.user_id) {
          showAlert('Resposta inválida do backend.', 'warning');
          setDragSteps(buildDefaultSteps());
          return;
        }

        const ordered: DragStep[] = [
          { label: record.step1, days: record.days1, operacional: record.operacional1, financeiro: record.financeiro1 },
          { label: record.step2, days: record.days2, operacional: record.operacional2, financeiro: record.financeiro2 },
          { label: record.step3, days: record.days3, operacional: record.operacional3, financeiro: record.financeiro3 },
          { label: record.step4, days: record.days4, operacional: record.operacional4, financeiro: record.financeiro4 },
        ].map((s) => {
          const meta = stepMetaByLabel(s.label);
          const fixed = normalizeType(s.operacional, s.financeiro);
          return {
            id: meta.id,
            label: String(s.label),
            days: Math.max(0, Math.trunc(Number(s.days))),
            icon: meta.icon,
            operacional: fixed.operacional,
            financeiro: fixed.financeiro,
          };
        });

        const oneOfErr = validateOneOfLocal(ordered);
        if (oneOfErr) {
          const fixedSteps = ordered.map(st => {
            const f = normalizeType(st.operacional, st.financeiro);
            return { ...st, operacional: f.operacional, financeiro: f.financeiro };
          });
          setDragSteps(fixedSteps);
          showAlert('Ciclo carregado, mas havia seleção inválida. Corrigimos.', 'warning');
          return;
        }

        setDragSteps(ordered);
        showAlert('Ciclo carregado com sucesso.', 'success');
      } catch (e: any) {
        showAlert(e?.message || 'Erro ao carregar ciclo.', 'error');
        setDragSteps(buildDefaultSteps());
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [activeClient?.id]);

  // Salvar ciclo
  async function handleSaveCycle() {
    if (!activeClient?.id) {
      showAlert('Selecione um cliente antes de salvar.', 'warning');
      return;
    }

    if (dragSteps.length !== 4) {
      showAlert('O ciclo precisa ter exatamente 4 etapas.', 'warning');
      return;
    }

    const oneOfErr = validateOneOfLocal(dragSteps);
    if (oneOfErr) {
      showAlert(oneOfErr, 'warning');
      return;
    }

    const payload = {
      user_id: activeClient.id,
      step1: dragSteps[0].label,
      step2: dragSteps[1].label,
      step3: dragSteps[2].label,
      step4: dragSteps[3].label,
      days1: dragSteps[0].days,
      days2: dragSteps[1].days,
      days3: dragSteps[2].days,
      days4: dragSteps[3].days,
      operacional1: dragSteps[0].operacional,
      financeiro1: dragSteps[0].financeiro,
      operacional2: dragSteps[1].operacional,
      financeiro2: dragSteps[1].financeiro,
      operacional3: dragSteps[2].operacional,
      financeiro3: dragSteps[2].financeiro,
      operacional4: dragSteps[3].operacional,
      financeiro4: dragSteps[3].financeiro,
    };

    setSaving(true);
    try {
      const res = await services(CYCLE_UPSERT_ENDPOINT, {
        method: 'PUT',
        data: payload,
      });

      if (!res.success) {
        showAlert(pickApiError(res.data) || 'Falha ao salvar ciclo.', 'error');
        return;
      }

      showAlert('Ciclo salvo com sucesso.', 'success');
    } catch (e: any) {
      showAlert(e?.message || 'Erro inesperado ao salvar ciclo.', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!activeClient) {
    return <NoClientState onGoToClients={() => router.push('/clients')} />;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', py: 4 }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 3 } }}>
        <CycleHeader 
          periodLabel={periodLabel}
          onSave={handleSaveCycle}
          saving={saving}
          loading={loading}
        />

        {(loading || saving) && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress sx={{ height: 4, borderRadius: 2 }} />
          </Box>
        )}

        <ClientCard client={activeClient} />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '60% 38%' },
            gap: 3,
            alignItems: 'stretch',
          }}
        >
          {/* Coluna de Configuração */}
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(230, 201, 105, 0.2)' }}>
            <Box sx={{ height: 4, background: 'linear-gradient(90deg, #E6C969, rgba(230, 201, 105, 0.3))' }} />
            
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={700} sx={{ color: '#111827' }}>
                  Configuração do Ciclo
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.25 }}>
                  Arraste para reordenar. Ajuste dias. Selecione apenas 1 tipo por etapa.
                </Typography>
              </Box>

              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={(event) => {
                  if (loading || saving) return;
                  const { active, over } = event;
                  if (!over || active.id === over.id) return;
                  setDragSteps((items) => {
                    const oldIndex = items.findIndex((i) => i.id === active.id);
                    const newIndex = items.findIndex((i) => i.id === over.id);
                    return arrayMove(items, oldIndex, newIndex);
                  });
                }}
              >
                <SortableContext items={dragSteps.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  {dragSteps.map((step) => (
                    <DraggableStepCard
                      key={step.id}
                      step={step}
                      disabled={loading || saving}
                      onDaysChange={(id, nextDays) => setDragSteps(prev => prev.map(s => s.id === id ? { ...s, days: nextDays } : s))}
                      onSelectOperacional={(id) => setDragSteps(prev => prev.map(s => s.id === id ? { ...s, operacional: true, financeiro: false } : s))}
                      onSelectFinanceiro={(id) => setDragSteps(prev => prev.map(s => s.id === id ? { ...s, financeiro: true, operacional: false } : s))}
                    />
                  ))}
                </SortableContext>
              </DndContext>

            </CardContent>
          </Card>

          {/* Coluna de Resumo */}
          <CycleSummaryCard summary={summary} />
        </Box>

        <AppAlert open={alertOpen} message={alertMessage} severity={alertSeverity} onClose={() => setAlertOpen(false)} />
      </Box>
    </Box>
  );
}