import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateCoursePlan } from './geminiService';
import { CourseData, Lesson, Module } from './types';
import { 
  BookOpen, 
  ChevronRight, 
  Target, 
  Lightbulb, 
  ClipboardCheck, 
  Loader2, 
  ArrowRight,
  Sparkles,
  Download,
  PlusCircle,
  Clock,
  Users,
  FileText,
  Upload,
  Info,
  AlertCircle,
  CheckCircle,
  Key,
  Settings
} from 'lucide-react';

// Dados de exemplo para fallback
const SAMPLE_COURSE_DATA: CourseData = {
  courseName: "Design Instrucional com Metodologias Ativas",
  description: "Curso completo sobre design instrucional moderno, focado na aplicação de metodologias ativas de aprendizagem em ambientes educacionais presenciais e online.",
  totalDuration: "40 horas",
  targetAudience: "Professores, coordenadores pedagógicos e designers instrucionais",
  modules: [
    {
      id: 1,
      title: "Fundamentos do Design Instrucional",
      duration: "12 horas",
      lessons: [
        {
          id: 1,
          title: "Introdução ao Design Instrucional Moderno",
          duration: "4 horas",
          content: "Conceitos fundamentais, histórico e evolução do design instrucional. Abordagem dos principais modelos (ADDIE, SAM, Design Thinking) e sua aplicação prática.",
          objectives: [
            "Compreender os princípios do design instrucional",
            "Identificar diferentes modelos de DI",
            "Analisar casos de aplicação prática"
          ],
          methodology: "Aula expositiva dialogada com estudo de caso",
          strategy: "Exposição teórica seguida de análise de casos reais em grupos",
          assessment: "Questionário formativo e análise crítica de caso",
          competenciesIds: [1, 2]
        },
        {
          id: 2,
          title: "Análise de Necessidades e Público-Alvo",
          duration: "4 horas",
          content: "Técnicas para análise de necessidades educacionais, identificação de gaps de aprendizagem e caracterização do público-alvo.",
          objectives: [
            "Aplicar técnicas de análise de necessidades",
            "Caracterizar diferentes perfis de aprendizes",
            "Elaborar perfis de público-alvo"
          ],
          methodology: "Workshop prático com atividades em grupo",
          strategy: "Dinâmicas de grupo e construção colaborativa de personas",
          assessment: "Elaboração de perfil de público-alvo e plano de análise",
          competenciesIds: [2, 3]
        },
        {
          id: 3,
          title: "Definição de Objetivos de Aprendizagem",
          duration: "4 horas",
          content: "Formulação de objetivos de aprendizagem claros, mensuráveis e alinhados à Taxonomia de Bloom revisada.",
          objectives: [
            "Formular objetivos de aprendizagem SMART",
            "Aplicar a Taxonomia de Bloom revisada",
            "Alinhar objetivos com competências e habilidades"
          ],
          methodology: "Aprendizagem baseada em problemas",
          strategy: "Resolução de problemas reais de formulação de objetivos",
          assessment: "Elaboração de matriz de objetivos para um curso",
          competenciesIds: [1, 3]
        }
      ]
    },
    {
      id: 2,
      title: "Metodologias Ativas de Aprendizagem",
      duration: "16 horas",
      lessons: [
        {
          id: 4,
          title: "Aprendizagem Baseada em Problemas e Projetos",
          duration: "4 horas",
          content: "Implementação da ABP (Aprendizagem Baseada em Problemas) e PBL (Project-Based Learning) em diferentes contextos educacionais.",
          objectives: [
            "Diferenciar ABP e PBL",
            "Estruturar problemas e projetos de aprendizagem",
            "Avaliar resultados em metodologias ativas"
          ],
          methodology: "Sala de aula invertida com atividade prática",
          strategy: "Preparação prévia com vídeos e leituras, seguida de workshop de criação",
          assessment: "Desenvolvimento de um cenário de ABP completo",
          competenciesIds: [3, 4]
        },
        {
          id: 5,
          title: "Gamificação e Elementos Lúdicos",
          duration: "4 horas",
          content: "Princípios de gamificação aplicados à educação: elementos de jogo, mecânicas, dinâmicas e recompensas.",
          objectives: [
            "Identificar elementos de gamificação aplicáveis",
            "Desenhar atividades gamificadas",
            "Avaliar o impacto da gamificação na motivação"
          ],
          methodology: "Design thinking com prototipagem",
          strategy: "Processo de design thinking para criação de atividade gamificada",
          assessment: "Prototipação e teste de atividade gamificada",
          competenciesIds: [4, 5]
        }
      ]
    }
  ],
  competencies: [
    {
      id: 1,
      description: "Planejamento pedagógico estratégico",
      knowledgeRelationship: "Conhecimento de teorias de aprendizagem e currículo"
    },
    {
      id: 2,
      description: "Análise de necessidades educacionais",
      knowledgeRelationship: "Metodologias de pesquisa e diagnóstico educacional"
    },
    {
      id: 3,
      description: "Design de experiências de aprendizagem",
      knowledgeRelationship: "Princípios de UX aplicados à educação"
    },
    {
      id: 4,
      description: "Aplicação de metodologias ativas",
      knowledgeRelationship: "Conhecimento de diferentes abordagens pedagógicas"
    },
    {
      id: 5,
      description: "Avaliação de processos educacionais",
      knowledgeRelationship: "Métodos e instrumentos de avaliação"
    }
  ]
};

const App: React.FC = () => {
  const [inputPlan, setInputPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsingPdf, setParsingPdf] = useState(false);
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [useSampleData, setUseSampleData] = useState(false);
  const [showApiKeyInfo, setShowApiKeyInfo] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Limpar mensagens após tempo
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  // Focar no textarea
  useEffect(() => {
    if (textareaRef.current && !courseData && !loading) {
      textareaRef.current.focus();
    }
  }, [courseData, loading]);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      // @ts-ignore
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;
      
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let text = '';
      
      const maxPages = Math.min(pdf.numPages, 10);
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        // @ts-ignore
        const pageText = content.items.map((item: any) => item.str).join(' ');
        text += pageText + '\n';
      }
      
      return text;
    } catch (error) {
      console.error("Erro na extração do PDF:", error);
      throw new Error("Falha na leitura do PDF. Tente copiar o texto manualmente.");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setError('Por favor, selecione um arquivo PDF válido.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('O arquivo PDF deve ter no máximo 5MB.');
      return;
    }

    setParsingPdf(true);
    setError(null);
    
    try {
      const text = await extractTextFromPDF(file);
      
      if (text.trim().length < 50) {
        setError('Pouco texto extraído do PDF. Recomendo copiar e colar manualmente.');
      } else {
        setInputPlan(text);
        setSuccessMessage('PDF importado com sucesso!');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao processar PDF.');
    } finally {
      setParsingPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!inputPlan.trim()) {
      setError('Por favor, insira um plano de curso ou ementa.');
      textareaRef.current?.focus();
      return;
    }

    if (inputPlan.trim().length < 50) {
      setError('Por favor, forneça um texto mais detalhado (mínimo 50 caracteres).');
      textareaRef.current?.focus();
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage('Gerando estrutura pedagógica...');

    try {
      // Tentar usar a API real
      const data = await generateCoursePlan(inputPlan);
      
      if (!data || !data.modules || data.modules.length === 0) {
        throw new Error('Estrutura inválida retornada pela API.');
      }

      setCourseData(data);
      setActiveModuleId(data.modules[0].id);
      setSuccessMessage(`Plano gerado com sucesso! ${data.modules.length} módulos criados.`);
      setUseSampleData(false);
      
    } catch (error) {
      console.error("Erro na geração:", error);
      
      // Se for erro de API key, mostrar dados de exemplo
      const errorMessage = error instanceof Error ? error.message : '';
      
      if (errorMessage.includes('API key') || errorMessage.includes('API Key')) {
        setError('API Key não configurada. Usando dados de exemplo para demonstração.');
        setSuccessMessage('Modo de demonstração ativado com dados de exemplo.');
        
        // Usar dados de exemplo
        setCourseData(SAMPLE_COURSE_DATA);
        setActiveModuleId(1);
        setUseSampleData(true);
        
        // Mostrar instruções para configurar API key
        setTimeout(() => {
          setShowApiKeyInfo(true);
        }, 1000);
        
      } else {
        setError(`Erro: ${errorMessage}. Tente novamente ou use dados de exemplo.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUseSampleData = () => {
    setCourseData(SAMPLE_COURSE_DATA);
    setActiveModuleId(1);
    setUseSampleData(true);
    setSuccessMessage('Dados de exemplo carregados com sucesso!');
    setError(null);
  };

  const handleReset = () => {
    setCourseData(null);
    setInputPlan('');
    setError(null);
    setSuccessMessage(null);
    setSelectedLesson(null);
    setActiveModuleId(null);
    setUseSampleData(false);
    
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const handlePrint = () => {
    window.print();
  };

  const wordCount = inputPlan.trim().split(/\s+/).filter(word => word.length > 0).length;

  const activeModule = courseData?.modules.find(m => m.id === activeModuleId);

  return (
    <div className="min-h-screen text-slate-900 bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Modal de Informações da API Key */}
      {showApiKeyInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Key size={20} /> Configurar API Key
              </h3>
              <button onClick={() => setShowApiKeyInfo(false)} className="text-slate-400 hover:text-slate-600">
                <PlusCircle className="rotate-45" size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-slate-600">
                Para usar a funcionalidade completa com IA, você precisa configurar uma API Key do Google AI:
              </p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <ol className="text-sm text-amber-800 space-y-2 list-decimal pl-4">
                  <li>Acesse <a href="https://makersuite.google.com/app/apikey" target="_blank" className="text-blue-600 hover:underline">Google AI Studio</a></li>
                  <li>Crie uma nova API Key</li>
                  <li>Crie um arquivo <code className="bg-amber-100 px-1 rounded">.env</code> na raiz do projeto</li>
                  <li>Adicione: <code className="bg-slate-100 px-1 rounded">VITE_GOOGLE_AI_API_KEY=sua_chave_aqui</code></li>
                  <li>Reinicie o servidor de desenvolvimento</li>
                </ol>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowApiKeyInfo(false)}
                  className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition"
                >
                  Entendi
                </button>
                <button
                  onClick={handleUseSampleData}
                  className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition"
                >
                  Usar Dados de Exemplo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notificações */}
      {(error || successMessage) && (
        <div className="fixed top-4 right-4 left-4 md:left-auto md:max-w-md z-40">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-lg flex items-start gap-3 animate-in slide-in-from-top">
              <AlertCircle className="shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="font-medium">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                <PlusCircle className="rotate-45" size={20} />
              </button>
            </div>
          )}
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl shadow-lg flex items-start gap-3 animate-in slide-in-from-top">
              <CheckCircle className="shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="font-medium">{successMessage}</p>
              </div>
              <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700">
                <PlusCircle className="rotate-45" size={20} />
              </button>
            </div>
          )}
        </div>
      )}

      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-slate-200 py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl text-white shadow-lg">
              <BookOpen size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">EduPlanner <span className="text-indigo-600">AI</span></h1>
              <p className="text-xs text-slate-500">Gerador Inteligente de Planos de Aula</p>
            </div>
          </div>
          
          {useSampleData && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
              <Info size={12} /> Modo Demonstração
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {!courseData ? (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800">
                Crie planos de aula <span className="text-indigo-600">perfeitos</span> em minutos
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Transforme ementas em estruturas pedagógicas completas com metodologias ativas e competências mapeadas.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 space-y-6">
              {/* API Key Alert */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Settings className="text-blue-600 mt-0.5" size={20} />
                  <div className="flex-1">
                    <h4 className="font-bold text-blue-800 mb-1">Configuração da API Key</h4>
                    <p className="text-sm text-blue-700 mb-2">
                      Para usar a IA, configure sua chave do Google AI. Ou use nossos dados de exemplo para testar.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowApiKeyInfo(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                      >
                        Como Configurar
                      </button>
                      <button
                        onClick={handleUseSampleData}
                        className="px-4 py-2 bg-white border border-blue-300 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-50 transition"
                      >
                        Usar Dados de Exemplo
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Sua Ementa ou Plano de Curso
                    </label>
                    <p className="text-xs text-slate-500">Cole o texto ou importe um PDF</p>
                  </div>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={parsingPdf}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition disabled:opacity-50"
                  >
                    {parsingPdf ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Upload size={16} />
                    )}
                    {parsingPdf ? 'Processando...' : 'Importar PDF'}
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".pdf" 
                    className="hidden" 
                  />
                </div>

                <textarea
                  ref={textareaRef}
                  className="w-full h-64 p-4 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition resize-y"
                  placeholder="Cole aqui a ementa do seu curso, objetivos, conteúdo programático..."
                  value={inputPlan}
                  onChange={(e) => setInputPlan(e.target.value)}
                  disabled={parsingPdf}
                />

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-slate-500">
                    {wordCount} palavras • {inputPlan.length} caracteres
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleUseSampleData}
                      className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl border border-slate-300 transition"
                    >
                      Ver Exemplo
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={!inputPlan.trim() || parsingPdf}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Sparkles size={18} />
                      {loading ? 'Gerando...' : 'Gerar Plano'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-100">
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target size={24} />
                  </div>
                  <h4 className="font-semibold text-slate-700">Competências Mapeadas</h4>
                  <p className="text-sm text-slate-500 mt-1">Alinhamento com BNCC e DC</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Lightbulb size={24} />
                  </div>
                  <h4 className="font-semibold text-slate-700">Metodologias Ativas</h4>
                  <p className="text-sm text-slate-500 mt-1">ABP, Gamificação, Sala Invertida</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ClipboardCheck size={24} />
                  </div>
                  <h4 className="font-semibold text-slate-700">Aulas de 4 Horas</h4>
                  <p className="text-sm text-slate-500 mt-1">Carga horária otimizada</p>
                </div>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600" size={24} />
            </div>
            <div className="text-center mt-6 space-y-2">
              <h3 className="text-xl font-bold text-slate-800">Gerando seu plano...</h3>
              <p className="text-slate-500">Analisando conteúdo e estruturando as aulas</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Informações do Curso */}
              <div className="bg-white rounded-2xl p-5 shadow border border-slate-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Curso</h3>
                    <h2 className="text-xl font-bold text-slate-800 mt-1">{courseData.courseName}</h2>
                  </div>
                  <button
                    onClick={handleReset}
                    className="text-slate-400 hover:text-slate-600"
                    title="Novo plano"
                  >
                    <ArrowRight className="rotate-180" size={20} />
                  </button>
                </div>
                
                <p className="text-sm text-slate-600 mb-4">{courseData.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                    <Clock size={12} /> {courseData.totalDuration}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                    <Users size={12} /> {courseData.targetAudience}
                  </span>
                </div>
              </div>

              {/* Módulos */}
              <div className="bg-white rounded-2xl overflow-hidden shadow border border-slate-200">
                <div className="bg-slate-50 px-5 py-4 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-700">Módulos do Curso</h3>
                  <p className="text-xs text-slate-500 mt-1">{courseData.modules.length} módulos • {courseData.modules.reduce((total, mod) => total + mod.lessons.length, 0)} aulas</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {courseData.modules.map((module) => (
                    <button
                      key={module.id}
                      onClick={() => setActiveModuleId(module.id)}
                      className={`w-full text-left px-5 py-4 transition-colors ${activeModuleId === module.id ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-indigo-600">Módulo {module.id}</span>
                            <span className="text-xs text-slate-400">{module.duration}</span>
                          </div>
                          <h4 className="font-medium text-slate-700">{module.title}</h4>
                          <div className="text-xs text-slate-400 flex items-center gap-1">
                            <FileText size={12} />
                            {module.lessons.length} aulas
                          </div>
                        </div>
                        <ChevronRight 
                          size={18} 
                          className={`transition-transform ${activeModuleId === module.id ? 'text-indigo-500 translate-x-1' : 'text-slate-300'}`}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Competências */}
              {courseData.competencies && courseData.competencies.length > 0 && (
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
                  <h3 className="font-semibold text-slate-200 mb-4">Competências Desenvolvidas</h3>
                  <div className="space-y-3">
                    {courseData.competencies.slice(0, 4).map((comp) => (
                      <div key={comp.id} className="p-3 bg-white/10 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center text-xs font-bold shrink-0">
                            {comp.id}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{comp.description}</p>
                            <p className="text-xs text-slate-300 mt-1">{comp.knowledgeRelationship}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Conteúdo Principal */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl p-5 shadow border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      {activeModule?.title || 'Selecione um módulo'}
                    </h2>
                    {activeModule && (
                      <p className="text-sm text-slate-500 mt-1">
                        {activeModule.duration} • {activeModule.lessons.length} aulas
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition"
                    >
                      <Download size={16} />
                      Exportar
                    </button>
                  </div>
                </div>

                {/* Aulas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeModule?.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => setSelectedLesson(lesson)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                          Aula {lesson.id}
                        </span>
                        <span className="text-xs text-slate-500">{lesson.duration}</span>
                      </div>
                      <h3 className="font-bold text-slate-800 mb-2">{lesson.title}</h3>
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{lesson.content}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex gap-1">
                          {lesson.competenciesIds.slice(0, 2).map((cid) => (
                            <span key={cid} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                              C-{cid}
                            </span>
                          ))}
                        </div>
                        <ArrowRight size={16} className="text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Se usar dados de exemplo, mostrar alerta */}
              {useSampleData && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Info className="text-blue-600" size={20} />
                    <div>
                      <h4 className="font-bold text-blue-800">Modo de Demonstração</h4>
                      <p className="text-sm text-blue-700">
                        Você está visualizando dados de exemplo. Para usar a IA real, 
                        <button 
                          onClick={() => setShowApiKeyInfo(true)}
                          className="text-blue-600 hover:text-blue-800 font-medium underline ml-1"
                        >
                          configure sua API Key
                        </button>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de Detalhes da Aula */}
        {selectedLesson && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setSelectedLesson(null)}
          >
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-xs font-bold">
                        Aula {selectedLesson.id}
                      </span>
                      <span className="text-slate-500">{selectedLesson.duration}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">{selectedLesson.title}</h2>
                  </div>
                  <button
                    onClick={() => setSelectedLesson(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <PlusCircle className="rotate-45" size={24} />
                  </button>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-700 mb-2">Conteúdo</h3>
                  <p className="text-slate-600">{selectedLesson.content}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-indigo-600 mb-2 flex items-center gap-2">
                        <Target size={16} /> Objetivos
                      </h4>
                      <ul className="space-y-2">
                        {selectedLesson.objectives.map((obj, i) => (
                          <li key={i} className="flex gap-2 text-sm text-slate-700">
                            <span className="text-indigo-500">•</span>
                            {obj}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-emerald-600 mb-2 flex items-center gap-2">
                        <ClipboardCheck size={16} /> Avaliação
                      </h4>
                      <p className="text-sm text-slate-700 bg-emerald-50 p-3 rounded-lg">
                        {selectedLesson.assessment}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-purple-600 mb-2 flex items-center gap-2">
                        <Lightbulb size={16} /> Metodologia
                      </h4>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <p className="font-medium text-purple-800 mb-1">{selectedLesson.methodology}</p>
                        <p className="text-sm text-purple-700">{selectedLesson.strategy}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-600 mb-2">Competências</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedLesson.competenciesIds.map((cid) => {
                          const comp = courseData?.competencies.find(c => c.id === cid);
                          return (
                            <span 
                              key={cid}
                              className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm"
                              title={comp?.description}
                            >
                              C-{cid}: {comp?.description.substring(0, 20)}...
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setSelectedLesson(null)}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-6 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} EduPlanner AI • 
            {useSampleData ? ' Modo Demonstração' : ' Gerador de Planos de Aula'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Desenvolvido para educadores • v1.0
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
