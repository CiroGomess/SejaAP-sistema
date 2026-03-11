export type CustomerStatus = 'active' | 'pending' | 'inactive';

export type Customer = {
  id?: number | string | null;
  code: string;
  first_name: string;
  last_name: string;
  email: string;
  document: string;
  phone: string;
  is_whatsapp: boolean;
  status: CustomerStatus;

  company_name?: string | null;
  notes?: string | null;

  cep?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;

  created_at?: string;
  updated_at?: string;
};

export type DocCliente = {
  id: number;
  id_cliente: number;
  caminho_arquivo: string;
  categoria: string;
  data_envio: string | null;
};

export function fullName(c: Customer) {
  return `${c?.first_name ?? ''} ${c?.last_name ?? ''}`.trim();
}

export function statusLabel(status: CustomerStatus) {
  const map: Record<CustomerStatus, string> = {
    active: 'Ativo',
    pending: 'Pendente',
    inactive: 'Inativo',
  };
  return map[status] ?? String(status);
}

export function statusColor(
  status: CustomerStatus
): 'success' | 'warning' | 'error' {
  const map: Record<CustomerStatus, 'success' | 'warning' | 'error'> = {
    active: 'success',
    pending: 'warning',
    inactive: 'error',
  };
  return map[status] ?? 'success';
}

/**
 * Formatador DEFENSIVO: nunca quebra se customer vier undefined/null.
 */
export function formatAddress(customer?: Partial<Customer> | null) {
  if (!customer) return '';

  const street = (customer.street ?? '').trim();
  const number = (customer.number ?? '').trim();
  const complement = (customer.complement ?? '').trim();
  const neighborhood = (customer.neighborhood ?? '').trim();
  const city = (customer.city ?? '').trim();
  const state = (customer.state ?? '').trim();
  const cep = (customer.cep ?? '').trim();

  const left = [street, number ? number : '', complement ? complement : '']
    .filter(Boolean)
    .join(', ')
    .replace(/\s+,/g, ',')
    .trim();

  const mid = [neighborhood, city, state].filter(Boolean).join(' • ').trim();

  const right = cep ? `CEP ${cep}` : '';

  return [left, mid, right].filter(Boolean).join(' • ').trim();
}
