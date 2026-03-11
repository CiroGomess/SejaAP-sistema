# 📊 Outbox Consulting - Backend API

API robusta desenvolvida em **Python** utilizando o framework **Flask**, focada em **consultoria financeira**, **análise de dados** e **geração de insights com Inteligência Artificial**.

O sistema integra:

- Processamento de planilhas (Excel)
- Cálculo de métricas estratégicas (Curva ABC, Ticket Médio, Margem)
- Geração automatizada de insights com IA
- Gestão financeira e ciclo de vida de clientes
- Autenticação segura via JWT

---

# 🗂️ Estrutura do Projeto

O projeto segue uma arquitetura modular organizada por responsabilidades:
back/

    ├── app.py # Ponto de entrada da aplicação
    ├── routes/ # Definição dos endpoints organizados por contexto
        ├── clientes.py
        ├── receita.py
        ├── user_routes.py
        └── ...

    ├── controllers/ # Lógica de negócio
    ├── services/ # Integrações externas (IA, APIs, etc.)
    ├── config/
        │ └── db.py # Configuração e conexão com PostgreSQL
    ├── docs/ # Uploads e documentos processados

        └── requirements.txt # Dependências do projeto

---

# 🚀 Funcionalidades Principais

## 📈 Análise Financeira
- Cálculo de **Curva ABC de Produtos**
- Análise de **Margem de Lucro**
- Cálculo de **Ticket Médio**
- Avaliação de Receita e Performance

## 📊 Processamento de Dados
- Importação de arquivos `.xlsx`
- Exportação de relatórios consolidados

## 🤖 Insights com IA
- Geração automática de relatórios estratégicos
- Integração com **Mistral AI**
- Integração com **Gama Service**

## 👥 Gestão de Clientes
- Monitoramento do **Client Cycle**
- Análise de faturamento por cliente


## 🔐 Segurança
- Autenticação baseada em **JWT**
- Controle de expiração de token
- Hash seguro de senhas com `passlib`

---

# 🛠️ Pré-requisitos

Antes de iniciar, certifique-se de possuir:

- **Python 3.8+**
- **PgAdmin**

---

# ⚙️ Configuração do Ambiente

## 1️⃣ Instalação das Dependências

Na raiz da pasta `back/`, execute:

```bash
pip install -r requirements.txt
```
## 2️⃣ Configuração das Variáveis de Ambiente

Crie um arquivo .env na raiz da pasta back/ com o seguinte conteúdo:

```

# ==============================
# Banco de Dados
# ==============================
DB_NAME=outbox_consulting_vector
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
DB_HOST=localhost
DB_PORT=5432

# ==============================
# Segurança e Autenticação
# ==============================
JWT_SECRET=seu_segredo_jwt
JWT_EXPIRES_MINUTES=99999

# ==============================
# Integrações de IA
# ==============================
MISTRAL_API_KEY=sua_chave_mistral
GAMA_API_KEY=sua_chave_gama
```

# 🏃 Como Executar

Na raiz da pasta back/, execute:
```
flask run 
```

# 📡 Principais Endpoints (Resumo)

| Categoria    | Funcionalidade                  | Arquivo de Rota      |
| ------------ | ------------------------------- | -------------------- |
| Autenticação | Login e Gestão de Usuários      | `user_routes.py`     |
| Financeiro   | Análise de Margem e Receita     | `analise_margem.py`  |
| Produtos     | Curva ABC de Produtos           | `curvaABCProduto.py` |
| IA           | Geração de Insights (Mistral)   | `toon_insights.py`   |
| Arquivos     | Upload e Download de Documentos | `documentsRoutes.py` |


# 📌 Considerações Finais

Esta API foi projetada com foco em:

Escalabilidade

Organização modular

Separação clara de responsabilidades

Integração inteligente com IA

Segurança robusta

Ideal para projetos de consultoria financeira, BI estratégico e automação de análise de dados.
