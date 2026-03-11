# 🖥️ Outbox Consulting — Frontend (Next.js)

Frontend desenvolvido em **Next.js (App Router)** com **TypeScript**, organizado para escalar com boas práticas (separação por domínio, serviços centralizados e componentes reutilizáveis).

---

## 🗂️ Estrutura do Projeto (Frontend)

Estrutura baseada no seu print:

frontend/

    ├── .next/ # Build/cache do Next (gerado automaticamente)
    ├── app/ # App Router (rotas, layouts, páginas)
    ├── assets/ # Imagens/ícones/arquivos estáticos importados via código
    ├── components/ # Componentes reutilizáveis (UI, layouts, etc.)
    ├── public/ # Arquivos públicos servidos direto (favicon, imagens públicas, etc.)
    ├── services/ # Camada de integração HTTP (API)
    ├── models_xlsx/ # (Opcional) modelos/planilhas base para downloads ou parsing
    ├── node_modules/ # Dependências (gerado automaticamente)
    ├── .gitignore
    ├── eslint.config.mjs
    ├── global.css
    ├── middleware.ts # Middlewares do Next (auth/redirect, etc.)
    ├── next-env.d.ts
    ├── next.config.ts
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.mjs
    ├── README.md
    └── tsconfig.json

---

## 🔌 Conexão com Backend (Camada de Services)

A conexão com o backend Flask fica centralizada no arquivo:

- `services/service.tsx` (ou `services/service.ts` — recomendado)

Ele é o **ponto único de entrada** para chamadas HTTP, garantindo:

- `baseURL` padronizada
- Inserção automática de `Bearer token` via interceptor
- Tratamento consistente de erro (rede, CORS, backend offline)
- Compatibilidade com payload enviado como `data` ou `body`
- Normalização de retorno para o front

---

## ✅ Arquivo principal: `services/service.tsx`

> **Função:** fazer requisições para o backend e devolver um resultado padronizado para o frontend.

```tsx
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
  error?: string;
  message?: string;
};

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("outbox_access");
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

const services = async (
  endpoint: string,
  options: Record<string, any> = {}
): Promise<ServiceResult> => {
  try {
    let requestData = options.data || options.body;

    if (typeof requestData === "string") {
      try {
        requestData = JSON.parse(requestData);
      } catch (e) {
        // mantém string caso não seja JSON
      }
    }

    const response = await api.request({
      url: endpoint,
      method: options.method || "GET",
      data: requestData,
      headers: options.headers,
      ...options,
    });

    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    const err = error as AxiosError;
    console.error("Service Error:", err);

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
      error: (err.response.data as any)?.error || "Erro na requisição",
      message: (err.response.data as any)?.message || "Erro desconhecido",
    };
  }
};

export default services;

```

## 🧩 Instalação e Execução (Frontend)

### ✅ 1) Instalar dependências

Na raiz da pasta `frontend/`, rode:

```bash
npm i
npm run dev       # Executar frontend 
npm run build     # Para build produção 
npm run start     # Rodar o build gerado
```