# Finflow — Frontend

Dashboard financeiro inteligente para análise de transações com IA.

## Stack

- **Next.js 14** (App Router)
- **Tailwind CSS**
- **Recharts** — gráficos
- **Lucide React** — ícones
- Fontes: **Syne** (display) + **DM Sans** (body) + **DM Mono** (mono)

## Estrutura

```
src/
├── app/
│   ├── layout.tsx        # Root layout com fonte e globals
│   ├── globals.css       # CSS base + variáveis de tema
│   └── page.tsx          # Página principal (dashboard)
├── components/
│   ├── layout/
│   │   └── Sidebar.tsx   # Navegação lateral colapsável
│   ├── dashboard/
│   │   ├── KpiCards.tsx      # Cards de KPIs
│   │   ├── EvolucaoChart.tsx # Gráfico de área mensal
│   │   ├── Rankings.tsx      # Top clientes + categorias
│   │   ├── InsightsPanel.tsx # Insights gerados por IA
│   │   └── AnomaliasPanel.tsx# Anomalias com explicação IA
│   ├── chat/
│   │   └── ChatPanel.tsx     # Chat RAG
│   └── ui/
│       ├── UploadModal.tsx   # Modal de upload com drag & drop
│       └── EmptyState.tsx    # Estado vazio inicial
├── hooks/
│   └── useUpload.ts      # Hook de upload de arquivo
└── lib/
    └── api.ts            # Todas as chamadas ao backend
```

## Rotas do backend consumidas

| Componente | Rota |
|---|---|
| KpiCards | `GET /analysis/kpis` |
| EvolucaoChart | `GET /analysis/evolucao` |
| TopClientes | `GET /analysis/por-cliente` |
| InsightsPanel | `GET /llm_analysis/insights` |
| AnomaliasPanel | `GET /llm_analysis/anomalias-ia` |
| ChatPanel | `POST /rag/ask` |
| UploadModal | `POST /upload/upload` |

## Setup local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variável de ambiente
cp .env.local.example .env.local
# edite NEXT_PUBLIC_API_URL se necessário

# 3. Rodar em dev
npm run dev
```

Acesse: http://localhost:3000

## Com Docker (projeto completo)

Coloque a pasta `frontend/` na raiz do projeto backend e use o `docker-compose.yml` fornecido:

```bash
docker-compose up --build
```

Serviços:
- Frontend: http://localhost:3000
- API: http://localhost:8000
- Ollama: http://localhost:11434

### Baixar modelos no Ollama após subir

```bash
docker exec -it ollama ollama pull llama3
docker exec -it ollama ollama pull nomic-embed-text
```
