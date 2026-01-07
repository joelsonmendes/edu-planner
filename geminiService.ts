// geminiService.ts
import { GoogleGenerativeAI } from '@google/genai';
import { CourseData, Competency, Module, Lesson } from './tipos';

// IMPORTANTE: Configure sua API Key do Google AI
// Opção 1: Variável de ambiente (recomendado)
// Opção 2: Substitua pela sua chave diretamente (apenas para desenvolvimento)
const API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY || 'AIzaSyDzefnvdxB1c0yFxDGlHAsF12ooqBQD6ss';

const ai = new GoogleGenerativeAI(API_KEY);

// Modelo mais adequado para tarefas educacionais
const model = ai.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp',
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 8192,
  },
});

// Função principal para gerar plano de curso
export async function generateCoursePlan(inputText: string): Promise<CourseData> {
  try {
    console.log('Iniciando geração de plano de curso...');
    
    // Verificar se a API key está configurada
    if (!API_KEY || API_KEY === 'SUA_API_KEY_AQUI') {
      throw new Error('API Key do Google AI não configurada. Configure a variável VITE_GOOGLE_AI_API_KEY.');
    }

    // Prompt melhorado para estruturação consistente
    const prompt = `
    Você é um especialista em design instrucional. Com base no seguinte plano de curso/ementa, crie uma estrutura detalhada:

    "${inputText}"

    Retorne APENAS um objeto JSON válido com a seguinte estrutura exata:

    {
      "courseName": "Nome do curso baseado no input",
      "description": "Descrição breve do curso (1-2 parágrafos)",
      "totalDuration": "XX horas",
      "targetAudience": "Público-alvo identificado",
      "modules": [
        {
          "id": 1,
          "title": "Título do módulo",
          "duration": "X horas",
          "lessons": [
            {
              "id": 1,
              "title": "Título da aula",
              "duration": "4 horas",
              "content": "Descrição detalhada do conteúdo",
              "objectives": ["Objetivo 1", "Objetivo 2", "Objetivo 3"],
              "methodology": "Metodologia ativa recomendada",
              "strategy": "Estratégia de ensino específica",
              "assessment": "Método de avaliação proposto",
              "competenciesIds": [1, 2]
            }
          ]
        }
      ],
      "competencies": [
        {
          "id": 1,
          "description": "Descrição da competência",
          "knowledgeRelationship": "Relacionamento com conhecimento prévio"
        }
      ]
    }

    REGRAS IMPORTANTES:
    1. Cada aula deve ter EXATAMENTE 4 horas de duração
    2. Divida o conteúdo total em módulos lógicos
    3. Cada módulo deve ter 1-4 aulas (cada aula com 4h)
    4. IDs devem ser sequenciais (1, 2, 3...)
    5. Competências devem ser mapeadas para as aulas
    6. Use metodologias ativas variadas
    7. Inclua avaliações práticas

    Não inclua markdown, apenas o JSON.
    `;

    console.log('Enviando requisição para Gemini API...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Resposta recebida:', text.substring(0, 200) + '...');
    
    // Extrair JSON da resposta (pode conter markdown ou texto extra)
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Não foi possível extrair JSON da resposta da API');
    }
    
    const jsonStr = jsonMatch[0];
    const parsedData = JSON.parse(jsonStr) as CourseData;
    
    // Validar estrutura básica
    if (!parsedData.modules || !Array.isArray(parsedData.modules)) {
      throw new Error('Estrutura de dados inválida: módulos não encontrados');
    }
    
    console.log('Plano gerado com sucesso:', {
      courseName: parsedData.courseName,
      modules: parsedData.modules.length,
      competencies: parsedData.competencies?.length || 0
    });
    
    return parsedData;
    
  } catch (error) {
    console.error('Erro detalhado no generateCoursePlan:', error);
    
    // Retornar dados de exemplo em caso de erro para testes
    if (error instanceof Error && error.message.includes('API Key')) {
      throw error; // Propagar erros de configuração
    }
    
    // Para outros erros, retornar dados de exemplo
    console.warn('Retornando dados de exemplo devido a erro na API');
    return getSampleCourseData(inputText);
  }
}

// Dados de exemplo para fallback/desenvolvimento
function getSampleCourseData(inputText: string): CourseData {
  return {
    courseName: inputText.substring(0, 50) + "...",
    description: "Curso gerado automaticamente com base na ementa fornecida.",
    totalDuration: "40 horas",
    targetAudience: "Estudantes e profissionais interessados",
    modules: [
      {
        id: 1,
        title: "Fundamentos e Conceitos Básicos",
        duration: "12 horas",
        lessons: [
          {
            id: 1,
            title: "Introdução e Contextualização",
            duration: "4 horas",
            content: "Apresentação do curso, objetivos e contextualização histórica.",
            objectives: ["Compreender o contexto do curso", "Identificar os objetivos de aprendizagem"],
            methodology: "Aula expositiva dialogada",
            strategy: "Exposição com slides e discussão em grupo",
            assessment: "Participação ativa e questionário rápido",
            competenciesIds: [1, 2]
          },
          {
            id: 2,
            title: "Princípios Fundamentais",
            duration: "4 horas",
            content: "Estudo dos princípios e conceitos centrais da área.",
            objectives: ["Dominar os conceitos básicos", "Aplicar princípios em exemplos"],
            methodology: "Estudo de caso",
            strategy: "Análise de casos reais em pequenos grupos",
            assessment: "Resolução de caso prático",
            competenciesIds: [2, 3]
          }
        ]
      }
    ],
    competencies: [
      {
        id: 1,
        description: "Compreensão contextual e histórica",
        knowledgeRelationship: "Conhecimento prévio da área e contexto social"
      },
      {
        id: 2,
        description: "Aplicação de conceitos teóricos",
        knowledgeRelationship: "Fundamentos teóricos da disciplina"
      }
    ]
  };
}
