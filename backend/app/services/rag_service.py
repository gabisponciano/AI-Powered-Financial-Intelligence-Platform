from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate

model = OllamaLLM(model="llama3")

template = """
Você é um especialista financeiro analisando transações de um sistema financeiro.

Use APENAS o contexto abaixo para responder. Se a informação não estiver no contexto, diga que não encontrou dados suficientes.

Contexto das transações:
{context}

Pergunta: {question}

Responda em português, de forma clara e objetiva. Se envolver valores, formate em reais (R$).
"""

def rag_config(context: str, question: str) -> str:
    prompt = ChatPromptTemplate.from_template(template)
    chain = prompt | model
    result = chain.invoke({"context": context, "question": question})
    return result