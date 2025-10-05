#!/usr/bin/env node

/**
 * 🤖 Gemini Helper
 * Assistente AI para melhorias no código
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// SECURITY: API key must be provided via environment variable
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';

if (!GEMINI_API_KEY) {
  console.error('❌ ERROR: GEMINI_API_KEY environment variable is required');
  console.error('Please set: export GEMINI_API_KEY="your-api-key"');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function askGemini(prompt) {
  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error('Erro ao consultar Gemini:', error.message);
    return null;
  }
}

async function main() {
  console.log('🤖 Gemini Helper - Consultando AI...\n');

  const prompt = `
Preciso adicionar uma funcionalidade ao meu script de monitoramento de Pull Requests.

Contexto:
- Tenho um script Node.js que monitora PRs do GitHub
- Cada PR tem uma propriedade "created_at" com timestamp ISO 8601
- Exemplo: "2025-10-04T05:06:39Z"

Tarefa:
Crie uma função JavaScript que:
1. Receba um timestamp ISO 8601 (created_at do PR)
2. Calcule quanto tempo se passou desde a criação
3. Retorne uma string formatada de forma humanizada, por exemplo:
   - "2 horas atrás"
   - "3 dias atrás"
   - "5 minutos atrás"
   - "1 semana atrás"

Requisitos:
- Use apenas JavaScript nativo (sem bibliotecas externas)
- A função deve se chamar "getTimeAgo"
- Retorne em português (pt-BR)
- Seja preciso mas humanizado (arredonde para a unidade mais relevante)
- Considere: minutos, horas, dias, semanas, meses

Por favor, forneça apenas o código da função, bem comentado.
`;

  const response = await askGemini(prompt);
  
  if (response) {
    console.log('✨ Resposta do Gemini:\n');
    console.log(response);
    console.log('\n📋 Copie o código acima e adicione ao monitorDevOps.js');
  } else {
    console.log('❌ Não foi possível obter resposta do Gemini');
  }
}

main();
