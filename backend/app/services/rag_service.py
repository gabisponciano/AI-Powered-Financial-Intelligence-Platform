from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
import os

_model = None  # Cache

template = """
Você é um especialista financeiro analisando transações de um sistema financeiro.

Use APENAS o contexto abaixo para responder. Se a informação não estiver no contexto, diga que não encontrou dados suficientes.

Contexto das transações:
{context}

Pergunta: {question}

Responda em português, de forma clara e objetiva. Se envolver valores, formate em reais (R$). Se envolver datas coloque no formato DD/MM/YYYY.
"""

def get_model():
    """Inicializa o modelo na primeira utilização (lazy loading)"""
    global _model
    if _model is None:
        _model = OllamaLLM(
            model=os.getenv("OLLAMA_MODEL", "mistral"),
            base_url=os.getenv("OLLAMA_BASE_URL"),
        )
    return _model

def rag_config(context: str, question: str) -> str:
    prompt = ChatPromptTemplate.from_template(template)
    model = get_model() 
    chain = prompt | model
    result = chain.invoke({"context": context, "question": question})
    return result
