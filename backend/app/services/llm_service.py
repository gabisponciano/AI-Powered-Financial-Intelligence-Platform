import requests
import json
import pandas as pd
from typing import Optional
import os

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
MODEL = os.getenv("OLLAMA_MODEL", "mistral")  # exemplo: "llama3", "mistral"


def _call_ollama(prompt: str, system: Optional[str] = None, temperature: float = 0.3) -> str:
    """
    Faz uma chamada síncrona ao Ollama e retorna o texto gerado.
    stream=False retorna tudo de uma vez.
    """
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": temperature,
            "num_predict": 1024,
        },
    }

    if system:
        payload["system"] = system

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=120)
        response.raise_for_status()
        data = response.json()
        return data.get("response", "").strip()
    except requests.exceptions.ConnectionError:
        raise RuntimeError(
            "Ollama não está rodando. Inicie com: ollama serve"
        )
    except requests.exceptions.Timeout:
        raise RuntimeError("Timeout ao chamar o Ollama. O modelo pode estar carregando.")
    except Exception as e:
        raise RuntimeError(f"Erro ao chamar Ollama: {str(e)}")


INSIGHTS_SYSTEM = (
    "Você é um analista financeiro especialista em dados de vendas e recebíveis. "
    "Analise os KPIs fornecidos e gere insights claros, diretos e acionáveis em português. "
    "Foque em: oportunidades de melhoria, riscos e tendências. "
    "Seja conciso e prático. Se envolver datas coloque no formato DD/MM/YYYY"
)


def generate_insights(kpis: dict, evolucao: list[dict], top_clientes: list[dict]) -> dict:
    """Gera insights automáticos com base nos KPIs e dados do upload."""

    # Monta contexto compacto para o LLM
    evolucao_resumo = ""
    if evolucao:
        meses = [e.get("mes", "") for e in evolucao[-3:]]  # últimos 3 meses
        evolucao_resumo = f"Últimos meses: {', '.join(meses)}"

    top3 = top_clientes[:3] if top_clientes else []
    clientes_resumo = "; ".join(
        [f"{c.get('cliente', 'N/A')} (R$ {float(c.get('receita', 0)):.0f})" for c in top3]
    )

    prompt = (
        f"Dados financeiros do período:\n"
        f"- Receita total: R$ {kpis.get('receita_total', 0):.2f}\n"
        f"- Ticket médio: R$ {kpis.get('ticket_medio', 0):.2f}\n"
        f"- Total de transações: {kpis.get('total_transacoes', 0)}\n"
        f"- Taxa de inadimplência: {kpis.get('taxa_inadimplencia', 0):.1f}%\n"
        f"- Valor pendente: R$ {kpis.get('valor_pendente', 0):.2f}\n"
        f"- Inadimplentes: {kpis.get('inadimplentes_count', 0)}\n"
        f"- {evolucao_resumo}\n"
        f"- Top clientes: {clientes_resumo}\n\n"
        f"Gere exatamente 4 insights no seguinte formato JSON:\n"
        f'{{"insights": [{{"titulo": "...", "descricao": "...", "tipo": "positivo|negativo|neutro|alerta"}}]}}\n'
        f"Responda APENAS com o JSON, sem texto adicional."
    )

    raw = _call_ollama(prompt, system=INSIGHTS_SYSTEM, temperature=0.4)

    try:
        # Remove possíveis ```json ``` wrappers
        clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        data = json.loads(clean)
        return data
    except json.JSONDecodeError:
        # Fallback: retorna o texto bruto estruturado
        return {
            "insights": [
                {
                    "titulo": "Análise Gerada",
                    "descricao": raw,
                    "tipo": "neutro"
                }
            ]
        }

ANOMALY_SYSTEM = (
    "Você é um especialista em detecção de fraudes e anomalias financeiras. "
    "Analise as transações considerando não apenas valores extremos, mas também padrões incomuns.\n\n"
    
    "Considere como anomalias:\n"
    "- Valores acima do esperado (estatístico)\n"
    "- Mudanças de comportamento do cliente\n"
    "- Frequência incomum de transações\n"
    "- Descrições incomuns ou suspeitas\n"
    "- Horários atípicos\n"
    "- Combinação de fatores aparentemente normais, mas estranhos juntos\n\n"
    
    "Classifique a severidade:\n"
    "- alta: forte indício de fraude ou valor muito fora do padrão\n"
    "- media: comportamento suspeito\n"
    "- baixa: leve desvio ou padrão incomum\n\n"
    
    "Seja objetivo, específico e direto."
)

def explain_anomalies(anomalies: list[dict], stats: dict) -> list[dict]:
    if not anomalies:
        return []

    # 🔹 Score de risco (simplificado)
    def risk_score(t):
        score = 0

        amount = float(t.get("amount", 0))
        status = str(t.get("status", "")).lower()

        # Valor muito alto (global)
        if amount > stats.get("threshold", 0):
            score += 3
        elif amount > stats.get("mean", 0):
            score += 1  # levemente acima da média

        # Atraso
        if status == "atrasado":
            score += 2

        return score

    # Ordena pelas mais suspeitas
    anomalies_sorted = sorted(anomalies, key=risk_score, reverse=True)

    stats_text = (
        f"Média: R$ {stats.get('mean', 0):.2f}, "
        f"Desvio padrão: R$ {stats.get('std', 0):.2f}, "
        f"Limite alto (~2σ): R$ {stats.get('threshold', 0):.2f}, "
        f"Total de transações: {stats.get('count', 0)}"
    )

    lines = []
    for i, t in enumerate(anomalies_sorted[:10]):
        lines.append(
            f"{i+1}. Valor: R$ {float(t.get('amount', 0)):.2f} | "
            f"Cliente: {t.get('customer', 'N/A')} | "
            f"Descrição: {t.get('description', 'N/A')} | "
            f"Data: {t.get('date', 'N/A')} | "
            f"Status: {t.get('status', 'N/A')}"
        )

    prompt = (
        f"Contexto estatístico: {stats_text}\n\n"
        f"Transações suspeitas:\n" + "\n".join(lines) + "\n\n"
        "Considere valores fora do padrão e comportamento geral.\n\n"
        'Formato JSON:\n'
        '{"anomalias": [{"id": 1, "explicacao": "...", "severidade": "alta|media|baixa"}]}\n'
        "Responda APENAS com o JSON."
    )

    raw = _call_ollama(prompt, system=ANOMALY_SYSTEM, temperature=0.35)

    try:
        clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        data = json.loads(clean)
        explicacoes = {item["id"]: item for item in data.get("anomalias", [])}

        enriched = []
        for i, t in enumerate(anomalies_sorted[:10]):
            exp = explicacoes.get(i + 1, {})
            enriched.append({
                **t,
                "explicacao_ia": exp.get("explicacao", "Valor fora do padrão esperado."),
                "severidade": exp.get("severidade", "media"),
                "risk_score": risk_score(t)
            })
        return enriched

    except Exception:
        return [
            {
                **t,
                "explicacao_ia": "Valor fora do padrão estatístico.",
                "severidade": "media",
                "risk_score": risk_score(t)
            }
            for t in anomalies_sorted[:10]
        ]


QUERY_SYSTEM = (
    "Você é um assistente de análise financeira. "
    "Você recebe dados de transações e responde perguntas em português de forma clara e direta. "
    "Use os dados fornecidos para embasar sua resposta. "
    "Se não souber a resposta com os dados disponíveis, diga isso claramente."
)


def natural_language_query(question: str, df_summary: dict) -> str:
    """
    Responde uma pergunta em linguagem natural sobre os dados do upload.
    df_summary contém estatísticas pré-calculadas para não enviar toda a tabela.
    """
    context = (
        f"Dados disponíveis sobre as transações:\n"
        f"- Total de transações: {df_summary.get('total', 0)}\n"
        f"- Período: {df_summary.get('data_inicio', 'N/A')} a {df_summary.get('data_fim', 'N/A')}\n"
        f"- Receita total (pagas): R$ {df_summary.get('receita_total', 0):.2f}\n"
        f"- Valor pendente: R$ {df_summary.get('valor_pendente', 0):.2f}\n"
        f"- Ticket médio: R$ {df_summary.get('ticket_medio', 0):.2f}\n"
        f"- Maior transação: R$ {df_summary.get('maior_transacao', 0):.2f}\n"
        f"- Menor transação: R$ {df_summary.get('menor_transacao', 0):.2f}\n"
        f"- Taxa inadimplência: {df_summary.get('taxa_inadimplencia', 0):.1f}%\n"
        f"- Top 5 clientes por receita: {df_summary.get('top_clientes', 'N/A')}\n"
        f"- Distribuição por status: {df_summary.get('status_dist', 'N/A')}\n"
    )

    prompt = f"{context}\n\nPergunta do usuário: {question}\n\nResponda de forma direta e objetiva."

    return _call_ollama(prompt, system=QUERY_SYSTEM, temperature=0.5)


def build_df_summary(df: pd.DataFrame) -> dict:
    """Gera um dicionário de sumário estatístico do DataFrame para enviar ao LLM."""
    if df.empty:
        return {}

    total = len(df)
    pago = df[df["status"] == "pago"] if "status" in df.columns else df
    pendente = df[df["status"] == "pendente"] if "status" in df.columns else pd.DataFrame()
    atrasado = df[df["status"] == "atrasado"] if "status" in df.columns else pd.DataFrame()

    receita_total = float(pago["amount"].sum()) if not pago.empty else 0
    valor_pendente = float(pendente["amount"].sum()) if not pendente.empty else 0
    ticket_medio = float(pago["amount"].mean()) if not pago.empty else 0
    maior = float(df["amount"].max()) if "amount" in df.columns else 0
    menor = float(df["amount"].min()) if "amount" in df.columns else 0
    taxa_inad = (len(atrasado) / total * 100) if total > 0 else 0

    # Datas
    data_inicio = str(df["date"].min().date()) if "date" in df.columns and not df["date"].isna().all() else "N/A"
    data_fim = str(df["date"].max().date()) if "date" in df.columns and not df["date"].isna().all() else "N/A"

    # Top clientes
    top_clientes = ""
    if "customer" in df.columns and "amount" in df.columns:
        top = pago.groupby("customer")["amount"].sum().nlargest(5)
        top_clientes = "; ".join([f"{k} (R$ {v:.0f})" for k, v in top.items()])

    # Distribuição status
    status_dist = ""
    if "status" in df.columns:
        dist = df["status"].value_counts()
        status_dist = "; ".join([f"{k}: {v}" for k, v in dist.items()])

    return {
        "total": total,
        "receita_total": receita_total,
        "valor_pendente": valor_pendente,
        "ticket_medio": ticket_medio,
        "maior_transacao": maior,
        "menor_transacao": menor,
        "taxa_inadimplencia": taxa_inad,
        "data_inicio": data_inicio,
        "data_fim": data_fim,
        "top_clientes": top_clientes,
        "status_dist": status_dist,
    }
