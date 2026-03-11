import axios, { AxiosError } from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:5000",
  withCredentials: false,
});

type ServiceResult = {
  success: boolean;
  status: number;
  data: any;
  networkError?: boolean;
  error?: string; // Adicionado para facilitar leitura de erro
  message?: string; // Adicionado para facilitar leitura de mensagem
};

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("sejaap_access");
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

const services = async (endpoint: string, options: Record<string, any> = {}): Promise<ServiceResult> => {
  try {
    // --- CORREÇÃO MÁGICA ---
    // 1. Axios usa 'data', Fetch usa 'body'. Vamos aceitar os dois.
    let requestData = options.data || options.body;

    // 2. Se você mandou JSON.stringify (string), vamos transformar em Objeto de volta.
    // O Axios prefere objetos. Quando ele vê um objeto, ele adiciona
    // automaticamente o header 'Content-Type: application/json'.
    if (typeof requestData === 'string') {
      try {
        requestData = JSON.parse(requestData);
      } catch (e) {
        // Se não for JSON, mantém como string mesmo
      }
    }
    // -----------------------

    const response = await api.request({
      url: endpoint,
      method: options.method || 'GET', // Garante que tenha um método
      data: requestData,               // Passa o dado tratado para o campo certo do Axios
      headers: options.headers,        // Repassa seus headers manuais
      ...options,                      // Mantém outras configurações
    });

    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    const err = error as AxiosError;
    console.error("Service Error:", err); // Log útil para debug

    if (!err.response) {
      return {
        success: false,
        status: 0,
        networkError: true,
        data: { message: "Falha de rede/CORS ou backend offline." },
      };
    }

    return {
      success: false,
      status: err.response.status,
      data: err.response.data,
      // Mapeia mensagens de erro comuns para facilitar o uso no front
      error: (err.response.data as any)?.error || "Erro na requisição",
      message: (err.response.data as any)?.message || "Erro desconhecido"
    };
  }
};

export default services;