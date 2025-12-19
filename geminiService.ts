
import { GoogleGenAI, Type } from "@google/genai";
import { CourseData } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateCoursePlan = async (inputPlan: string): Promise<CourseData> => {
  const model = "gemini-3-pro-preview";
  
  const response = await ai.models.generateContent({
    model: model,
    contents: `Você é um Engenheiro Pedagógico Sênior. Sua tarefa é transformar o texto abaixo em um plano de curso estruturado e detalhado.

INSTRUÇÕES CRÍTICAS DE ESTRUTURAÇÃO:
1. IDENTIFICAÇÃO DE CARGA HORÁRIA: Analise o texto para identificar a carga horária total do curso e de cada módulo/disciplina.
2. REGRA DE 4 HORAS: Cada aula gerada deve ter obrigatoriamente a duração de "4 horas". 
3. CÁLCULO DE AULAS: O número de aulas por módulo deve ser calculado dividindo a carga horária total do módulo por 4. 
   - Exemplo: Se um módulo tem 16h, gere exatamente 4 aulas. Se tem 20h, gere 5 aulas.
4. FIDELIDADE E EXPANSÃO: Mantenha fidelidade total aos tópicos do plano original, mas expanda-os com metodologias ativas (PBL, Inverted Classroom, Gamificação) e estratégias pedagógicas claras para preencher as 4 horas de cada sessão.
5. COMPETÊNCIAS: Relacione cada aula às competências e conhecimentos identificados no plano original de forma lógica e progressiva.

TEXTO DO PLANO ORIGINAL (PDF OU TEXTO):
${inputPlan}`,
    config: {
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          courseName: { type: Type.STRING },
          description: { type: Type.STRING },
          targetAudience: { type: Type.STRING },
          totalDuration: { type: Type.STRING, description: "Carga horária total identificada" },
          competencies: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                description: { type: Type.STRING },
                knowledgeRelationship: { type: Type.STRING }
              },
              required: ["id", "description", "knowledgeRelationship"]
            }
          },
          modules: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.NUMBER },
                title: { type: Type.STRING },
                lessons: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.NUMBER },
                      title: { type: Type.STRING },
                      duration: { type: Type.STRING, description: "Deve ser sempre '4 horas'" },
                      objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                      content: { type: Type.STRING, description: "Conteúdo detalhado para 4h de aula" },
                      strategy: { type: Type.STRING },
                      methodology: { type: Type.STRING },
                      assessment: { type: Type.STRING },
                      competenciesIds: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["id", "title", "duration", "objectives", "content", "strategy", "methodology", "assessment", "competenciesIds"]
                  }
                }
              },
              required: ["id", "title", "lessons"]
            }
          }
        },
        required: ["courseName", "description", "targetAudience", "totalDuration", "competencies", "modules"]
      }
    }
  });

  return JSON.parse(response.text);
};
