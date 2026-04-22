# AI-Powered Financial Intelligence Platform (Finflow)

Plataforma full-stack para **upload de transações (.csv/.xlsx)**, **cálculo de KPIs** e **análises com IA** (insights, anomalias explicadas e chat estilo RAG), com foco em rodar de forma simples e local.

<img width="1912" height="953" alt="image" src="https://github.com/user-attachments/assets/d56159d9-f66f-4443-83c0-6871dc794a40" />
<img width="1908" height="963" alt="image" src="https://github.com/user-attachments/assets/8658fce7-12f2-40e5-941a-bf255ad8ee8f" />


## Visão geral

- **Backend (FastAPI)**: ingestão do arquivo, persistência (SQLite), endpoints de análise e endpoints de IA.
- **Frontend (Next.js 14)**: dashboard com KPIs, gráficos, rankings, lista de transações e chat.
- **IA local (Ollama)**: chamadas para LLM + embeddings sem depender de serviços externos.
- **Vector store (Chroma)**: indexação semântica das transações para RAG.

## Arquitetura (alto nível)

1. Usuário faz upload de um `.csv`/`.xlsx` no frontend
2. Backend normaliza colunas e persiste em **SQLite** (`backend/database.db`)
3. Endpoints `/analysis/*` calculam KPIs, evolução, rankings e anomalias estatísticas
4. Endpoints `/llm_analysis/*` e `/rag/*` usam **Ollama + LangChain + Chroma** para respostas em linguagem natural

## Decisões técnicas (por quê)

- **FastAPI + routers (`backend/app/routes`)**: separa responsabilidades (upload, análise, IA, RAG) e facilita evolução de endpoints.
- **SQLite + SQLAlchemy**: baixo atrito para protótipo/MVP, sem dependência de banco externo; os dados ficam em arquivo.
- **Persistência de “raw_data” (JSON)**: mantém o conteúdo original da linha importada (útil para auditoria e futuras features).
- **Pandas no backend**: ingestão e normalização rápida de CSV/XLSX e cálculos agregados eficientes.
- **Ollama local**: privacidade (dados não saem da máquina) e custo previsível; modelos podem ser trocados por variável de ambiente.
- **LangChain + Chroma**: RAG simples com persistência local (`backend/chroma_db`) e recuperação semântica por similaridade.
- **Next.js 14 (App Router) + Tailwind**: UI rápida de iterar, com componentes reaproveitáveis e boa DX.

## Formato do arquivo de upload

O endpoint aceita `.csv` e `.xlsx`.

Colunas esperadas (case-insensitive):
- `amount`, `date`, `status`, `customer`, `description`

Mapeamento automático (pt-BR → padrão):
- `valor` → `amount`
- `data` → `date`
- `cliente` → `customer`
- `descricao` → `description`

Valores de `status` usados nas análises:
- `pago`, `pendente`, `atrasado`

## Endpoints principais (backend)

- Upload: `POST /upload/file_upload`
- KPIs: `GET /analysis/kpis?upload_id=...`
- Evolução: `GET /analysis/evolucao?upload_id=...`
- Ranking clientes: `GET /analysis/por-cliente?upload_id=...`
- Ranking atraso: `GET /analysis/por-cliente-atraso?upload_id=...`
- Anomalias (estatístico): `GET /analysis/anomalias?upload_id=...`
- Lista/filters: `GET /analysis/transacoes?...`
- Insights (LLM): `GET /llm_analysis/insights?upload_id=...`
- Anomalias com IA: `GET /llm_analysis/anomalias-ia?upload_id=...`
- Pergunta em linguagem natural: `POST /llm_analysis/query?upload_id=...`
- Chat RAG: `POST /rag/ask`

## Como rodar

### Opção A — Docker Compose (recomendado para “subir tudo”)

Pré-requisitos:
- Docker + Docker Compose

Subir serviços:

```bash
docker compose up --build
```

Depois de subir, baixe os modelos no container do Ollama (uma vez):

```bash
docker exec -it ollama ollama pull mistral
docker exec -it ollama ollama pull nomic-embed-text
```

Serviços:
- Frontend: `http://localhost:3000`
- API: `http://localhost:8000`
- Ollama: `http://localhost:11434`

### Opção B — Local (dev)

Pré-requisitos:
- Python `>= 3.12`
- Node.js `>= 20`
- Ollama instalado (rodando localmente)

1) Backend (FastAPI)

Crie um `.env` opcional (para apontar o backend para o Ollama local):

```powershell
Copy-Item .env.example .env
```

Instale dependências com `uv` (recomendado, existe `uv.lock` no repo):

```powershell
uv sync
```

Suba a API:

```powershell
cd backend
uv run uvicorn app.main:app --reload
```

2) Ollama

Em outro terminal:

```powershell
ollama serve
ollama pull mistral
ollama pull nomic-embed-text
```

3) Frontend (Next.js)

```powershell
cd frontend
npm install
Copy-Item .env.local.example .env.local
npm run dev
```

Acesse `http://localhost:3000`.

## Configuração (IA)

Variáveis de ambiente suportadas (opcionais):
- `OLLAMA_URL` (default: `http://localhost:11434/api/generate`) — usado por `backend/app/services/llm_service.py`
- `OLLAMA_BASE_URL` (default: `http://localhost:11434`) — usado por RAG/embeddings (`langchain_ollama`)
- `OLLAMA_MODEL` (default: `mistral`) — modelo para insights/anomalias/chat
- `OLLAMA_EMBED_MODEL` (default: `nomic-embed-text`) — modelo de embeddings
