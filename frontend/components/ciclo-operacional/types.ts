import { ReactNode } from 'react';

export type SelectedClient = {
  id: string;
  code: string;
  name: string;
};

export type DragStep = {
  id: string;
  label: string;
  days: number;
  icon: ReactNode;
  operacional: boolean;
  financeiro: boolean;
};

export type CycleRecord = {
  id: string;
  user_id: string;
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  days1: number;
  days2: number;
  days3: number;
  days4: number;
  operacional1: boolean;
  financeiro1: boolean;
  operacional2: boolean;
  financeiro2: boolean;
  operacional3: boolean;
  financeiro3: boolean;
  operacional4: boolean;
  financeiro4: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CycleSummary = {
  pmp: number;  // Prazo Médio de Pagamento
  pme: number;  // Prazo Médio de Estocagem
  pmr: number;  // Prazo Médio de Recebimento
  cycleOperational: number;
  cycleFinancial: number;
};