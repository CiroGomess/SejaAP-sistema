export type SelectedClient = {
  id: string;
  code: string;
  name: string;
};

export type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export type UploadResult = {
  success?: boolean;
  message?: string;
  rows_imported?: number;
  errors?: string[];
  [key: string]: unknown;
};

// Tipos para listagem
export type ContabilidadeData = {
  id: string;
  ano: number;
  descricao: string;
  valor: number;
  categoria: string | null;
  data_importacao: string | null;
};

export type Pagination = {
  page: number;
  per_page: number;
  items_on_page: number;
  total_items: number;
  total_pages: number;
};