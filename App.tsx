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
  CheckCircle
} from 'lucide-react';

const App: React.FC = () => {
  const [inputPlan, setInputPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsingPdf, setParsingPdf] = useState(false);
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Função para limpar mensagens após tempo
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  // Focar no textarea ao carregar
  useEffect(() => {
    if (textareaRef.current && !courseData && !loading) {
      textareaRef.current.focus();
    }
  }, [courseData, loading]);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      // @ts-ignore - PDF.js precisa de ignore
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;
      
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let text = '';
      
      // Limitar a 20 páginas para performance
      const maxPages = Math.min(pdf.numPages, 20);
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        // @ts-ignore
        const pageText = content.items.map((item: any) => item.str).join(' ');
        text += pageText + '\n';
        
        // Mostrar progresso a cada 5 páginas
        if (i % 5 === 0) {
          setSuccessMessage(`Processando PDF... ${i}/${maxPages} páginas`);
        }
      }
      
      return text;
    } catch (error) {
      console.error("Erro na extração do PDF:", error);
      throw new Error("Falha na leitura do PDF. O arquivo pode estar corrompido ou protegido.");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validar tipo de arquivo
    if (file.type !== 'application/pdf') {
      setError('Por favor, selecione um arquivo PDF válido.');
      return;
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('O arquivo PDF deve ter no máximo 10MB.');
      return;
    }

    setParsingPdf(true);
    setError(null);
    setSuccessMessage('Iniciando processamento do PDF...');
    
    try {
      const text = await extractTextFromPDF(file);
      
      if (text.trim().length < 50) {
        setError('Não foi possível extrair texto significativo deste PDF. Tente copiar e colar o conteúdo manualmente.');
      } else {
        setInputPlan(text);
        setSuccessMessage(`PDF processado com sucesso! ${text.length} caracteres extraídos.`);
        
        // Rolar para o textarea
        setTimeout(() => {
          textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    } catch (error) {
      console.error("Erro ao processar PDF:", error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido ao processar PDF.');
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

    // Validar tamanho mínimo
    if (inputPlan.trim().length < 100) {
      setError('Por favor, forneça um texto mais detalhado (mínimo 100 caracteres).');
      textareaRef.current?.focus();
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage('Analisando conteúdo e gerando estrutura pedagógica...');

    try {
      console.log('Iniciando geração do plano...');
      const data = await generateCoursePlan(inputPlan);
      
      if (!data || !data.modules || data.modules.length === 0) {
        throw new Error('A API retornou uma estrutura vazia ou inválida.');
      }

      setCourseData(data);
      setActiveModuleId(data.modules[0].id);
      setSuccessMessage(`Plano gerado com sucesso! ${data.modules.length} módulos criados.`);
      
      // Rolar para a seção de resultados
      setTimeout(() => {
        document.querySelector('main')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (error) {
      console.error("Erro detalhado na geração:", error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Houve um erro ao processar seu plano.';
      
      // Verificar se é erro de API key
      if (errorMessage.includes('API Key') || errorMessage.includes('chave')) {
        setError(`${errorMessage} Configure sua chave do Google AI no arquivo .env`);
      } else if (errorMessage.includes('rede') || errorMessage.includes('network')) {
        setError('Erro de conexão. Verifique sua internet e tente novamente.');
      } else {
        setError(errorMessage);
      }
      
      // Não limpar o input para permitir nova tentativa
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCourseData(null);
    setInputPlan('');
    setError(null);
    setSuccessMessage(null);
    setSelectedLesson(null);
    setActiveModuleId(null);
    
    // Focar no textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter para gerar
    if (e.ctrlKey && e.key === 'Enter' && !loading) {
      handleGenerate();
    }
    
    // Escape para limpar seleção
    if (e.key === 'Escape' && selectedLesson) {
      setSelectedLesson(null);
    }
  };

  const activeModule = courseData?.modules.find(m => m.id === activeModuleId);

  // Contador de palavras
  const wordCount = inputPlan.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = inputPlan.length;

  return (
    <div className="min-h-screen text-slate-900" onKeyDown={handleKeyDown}>
      {/* Notificações */}
      {(error || successMessage) && (
        <div className="fixed top-4 right-4 left-4 md:left-auto md:max-w-md z-50 animate-in slide-in-from-top duration-300">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-lg flex items-start gap-3">
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
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl shadow-lg flex items-start gap-3">
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

      <header className="sticky top-0 z-40 glass-effect border-b border-slate-200 py-4 px-6 mb-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
              <BookOpen size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">EduPlanner <span className="text-indigo-600">AI</span></h1>
              <p className="text-xs text-slate-500 hidden sm:block">Gerador Inteligente de Planos de Aula</p>
            </div>
          </div>
          <div className="hidden md:block">
            <p className="text-sm text-slate-500 font-medium italic">Transformando conhecimento em jornada pedagógica.</p>
          </div>
          {courseData && (
            <button
              onClick={handleReset}
              className="text-sm text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-1"
            >
              <ArrowRight size={14} className="rotate-180" /> Novo Plano
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        {!courseData && !loading ? (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-800 leading-tight">
                Crie o plano de aula <span className="text-indigo-600">perfeito</span> em segundos.
              </h2>
              <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
                Insira sua ementa, tópicos ou carregue seu plano de curso em <span className="font-bold text-indigo-600">PDF</span>.
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100 p-6 md:p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Esboço do Plano de Curso
                    </label>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Info size={12} />
                      <span>Identificação inteligente de carga horária (4h por aula)</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={parsingPdf}
                      className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {parsingPdf ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Upload size={14} />
                      )}
                      {parsingPdf ? "Processando..." : "Importar PDF"}
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept=".pdf" 
                      className="hidden" 
                    />
                    
                    {inputPlan && (
                      <button
                        onClick={() => setInputPlan('')}
                        className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-200"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    className="w-full h-64 p-6 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none text-base leading-relaxed placeholder:text-slate-300 resize-y"
                    placeholder="Cole aqui seu plano ou ementa, ou clique em 'Importar PDF' acima..."
                    value={inputPlan}
                    onChange={(e) => setInputPlan(e.target.value)}
                    disabled={parsingPdf}
                  />
                  
                  {/* Contador */}
                  {inputPlan && (
                    <div className="absolute bottom-3 right-3 text-xs text-slate-400 bg-white/90 px-2 py-1 rounded">
                      {wordCount} palavras • {charCount} caracteres
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={!inputPlan.trim() || parsingPdf || loading}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] active:scale-95"
                  >
                    <Sparkles size={20} />
                    {loading ? 'Gerando...' : 'Gerar Estrutura Pedagógica Completa'}
                  </button>
                  
                  <div className="text-xs text-slate-500 flex items-center gap-2 px-3">
                    <kbd className="px-2 py-1 bg-slate-100 rounded border border-slate-200">Ctrl</kbd>
                    <span>+</span>
                    <kbd className="px-2 py-1 bg-slate-100 rounded border border-slate-200">Enter</kbd>
                    <span>para gerar rápido</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-50">
                <div className="flex items-center gap-3 text-sm text-slate-500 p-3 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Target size={18} />
                  </div>
                  <div>
                    <div className="font-medium">Mapeamento de Competências</div>
                    <div className="text-xs text-slate-400">Alinhamento BNCC/DC</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500 p-3 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                    <Lightbulb size={18} />
                  </div>
                  <div>
                    <div className="font-medium">Metodologias Ativas</div>
                    <div className="text-xs text-slate-400">Aprendizagem baseada em problemas</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500 p-3 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <ClipboardCheck size={18} />
                  </div>
                  <div>
                    <div className="font-medium">Aulas de 4 Horas</div>
                    <div className="text-xs text-slate-400">Fiel à carga horária original</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dicas */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
              <h3 className="font-bold text-indigo-700 mb-2 flex items-center gap-2">
                <Lightbulb size={18} /> Dicas para um plano eficaz:
              </h3>
              <ul className="text-sm text-indigo-600 space-y-1 list-disc pl-5">
                <li>Inclua objetivos claros e mensuráveis</li>
                <li>Descreva o público-alvo e pré-requisitos</li>
                <li>Mencione recursos e materiais necessários</li>
                <li>Inclua métodos de avaliação</li>
                <li>Especifique a carga horária total</li>
              </ul>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-8">
            <div className="relative">
              <div className="w-24 h-24 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 animate-pulse" size={32} />
            </div>
            <div className="text-center space-y-2 max-w-lg">
              <h3 className="text-2xl font-bold text-slate-800">Gerando sua estrutura pedagógica...</h3>
              <p className="text-slate-500">Analisando conteúdo, calculando carga horária e criando atividades.</p>
              <div className="pt-4">
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse w-3/4"></div>
                </div>
                <p className="text-xs text-slate-400 mt-2">Isso pode levar alguns segundos</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-6">
              {/* Informações do Curso */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Informações do Curso</h3>
                    <h2 className="text-xl font-black text-slate-800 mb-2 leading-tight">{courseData?.courseName}</h2>
                    <p className="text-sm text-slate-500 line-clamp-3">{courseData?.description}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 rounded-full text-xs font-bold text-indigo-700">
                      <Clock size={12} /> {courseData?.totalDuration}
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                      <Users size={12} /> {courseData?.targetAudience}
                    </div>
                  </div>
                </div>
              </div>

              {/* Módulos */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200">
                <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-4 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest">Cronograma de Módulos</h3>
                  <p className="text-xs text-slate-400 mt-1">{courseData?.modules.length} módulos • {courseData?.modules.reduce((acc, mod) => acc + mod.lessons.length, 0)} aulas</p>
                </div>
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                  {courseData?.modules.map((mod) => (
                    <button
                      key={mod.id}
                      onClick={() => setActiveModuleId(mod.id)}
                      className={`w-full text-left px-6 py-4 transition-all duration-200 flex items-center justify-between group ${activeModuleId === mod.id ? 'bg-indigo-50 border-r-4 border-indigo-600' : 'hover:bg-slate-50'}`}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-indigo-500 uppercase">Módulo {mod.id}</span>
                          <span className="text-xs text-slate-400">{mod.duration}</span>
                        </div>
                        <h4 className={`font-bold text-sm ${activeModuleId === mod.id ? 'text-indigo-900' : 'text-slate-700'} line-clamp-2`}>{mod.title}</h4>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <FileText size={10} />
                          <span>{mod.lessons.length} aulas</span>
                        </div>
                      </div>
                      <ChevronRight className={`transition-transform ${activeModuleId === mod.id ? 'translate-x-1 text-indigo-600' : 'text-slate-300 group-hover:translate-x-1'}`} size={18} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Competências */}
              {courseData?.competencies && courseData.competencies.length > 0 && (
                <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200">
                  <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Target size={16} /> Competências Alvo
                  </h3>
                  <div className="space-y-3">
                    {courseData.competencies.slice(0, 5).map((comp) => (
                      <div key={comp.id} className="group cursor-help">
                        <div className="flex items-start gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/15 transition-colors">
                          <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded flex items-center justify-center shrink-0 text-xs font-black">
                            {comp.id}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-indigo-100 leading-relaxed">{comp.description}</p>
                            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-xs text-indigo-300">{comp.knowledgeRelationship}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {courseData.competencies.length > 5 && (
                      <div className="text-center pt-2">
                        <span className="text-xs text-indigo-300">+ {courseData.competencies.length - 5} competências</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </aside>

            {/* Conteúdo Principal */}
            <section className="lg:col-span-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-3">
                    <PlusCircle className="text-indigo-600" />
                    {activeModule?.title || "Selecione um módulo"}
                  </h2>
                  {activeModule && (
                    <p className="text-sm text-slate-500 mt-1">{activeModule.duration} • {activeModule.lessons.length} aulas</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm font-medium"
                  >
                    <Download size={18} />
                    Exportar
                  </button>
                  <button 
                    onClick={handleReset}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition-colors shadow-sm font-medium"
                  >
                    Novo Plano
                  </button>
                </div>
              </div>

              {/* Aulas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeModule?.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                    onClick={() => setSelectedLesson(lesson)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-600 rounded-full text-xs font-black">Aula {lesson.id}</span>
                        <span className="text-xs text-slate-400 font-medium">{lesson.duration}</span>
                      </div>
                      <ArrowRight className="text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" size={16} />
                    </div>
                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-3">{lesson.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4">{lesson.content}</p>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {lesson.competenciesIds.slice(0, 3).map(cid => (
                        <span key={cid} className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded">C-{cid}</span>
                      ))}
                      {lesson.competenciesIds.length > 3 && (
                        <span className="text-[10px] text-slate-400">+{lesson.competenciesIds.length - 3}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 group-hover:gap-3 transition-all">
                      Ver detalhes completos
                      <ArrowRight size={14} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumo do Módulo */}
              {activeModule && (
                <div className="bg-gradient-to-r from-slate-50 to-white rounded-2xl p-6 border border-slate-200">
                  <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Info size={18} />
                    Sobre este módulo
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-white rounded-xl border border-slate-100">
                      <div className="text-2xl font-black text-indigo-600">{activeModule.lessons.length}</div>
                      <div className="text-xs text-slate-500">Aulas</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-xl border border-slate-100">
                      <div className="text-2xl font-black text-indigo-600">{activeModule.duration}</div>
                      <div className="text-xs text-slate-500">Duração</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-xl border border-slate-100">
                      <div className="text-2xl font-black text-indigo-600">
                        {new Set(activeModule.lessons.flatMap(l => l.competenciesIds)).size}
                      </div>
                      <div className="text-xs text-slate-500">Competências</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-xl border border-slate-100">
                      <div className="text-2xl font-black text-indigo-600">
                        {activeModule.lessons.filter(l => l.methodology.toLowerCase().includes('ativa')).length}
                      </div>
                      <div className="text-xs text-slate-500">Metod. Ativas</div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Modal de Detalhes da Aula */}
        {selectedLesson && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedLesson(null);
            }}
          >
            <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-300">
              <button 
                onClick={() => setSelectedLesson(null)}
                className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white shadow-lg text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Fechar"
              >
                <PlusCircle className="rotate-45" size={24} />
              </button>

              <div className="p-6 md:p-8 space-y-8">
                {/* Cabeçalho */}
                <div className="space-y-4 border-b border-slate-100 pb-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full text-xs font-black uppercase tracking-widest">
                      Aula {selectedLesson.id}
                    </span>
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <Clock size={14} /> {selectedLesson.duration}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight">{selectedLesson.title}</h2>
                  <p className="text-lg text-slate-600 leading-relaxed">{selectedLesson.content}</p>
                </div>

                {/* Conteúdo Principal */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Coluna Esquerda */}
                  <div className="space-y-8">
                    {/* Objetivos */}
                    <section className="space-y-4">
                      <h4 className="text-sm font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                        <Target size={18} /> Objetivos de Aprendizagem
                      </h4>
                      <ul className="space-y-3">
                        {selectedLesson.objectives.map((obj, i) => (
                          <li key={i} className="flex gap-3 p-3 bg-indigo-50 rounded-xl">
                            <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center shrink-0 text-xs font-bold">
                              {i + 1}
                            </div>
                            <span className="text-sm text-slate-700 font-medium">{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </section>

                    {/* Avaliação */}
                    <section className="space-y-4">
                      <h4 className="text-sm font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                        <ClipboardCheck size={18} /> Avaliação
                      </h4>
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                        <p className="text-sm text-emerald-800 font-medium">{selectedLesson.assessment}</p>
                      </div>
                    </section>
                  </div>

                  {/* Coluna Direita */}
                  <div className="space-y-8">
                    {/* Metodologia */}
                    <section className="space-y-4">
                      <h4 className="text-sm font-black text-purple-600 uppercase tracking-widest flex items-center gap-2">
                        <Lightbulb size={18} /> Metodologia e Estratégia
                      </h4>
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-2xl border border-purple-100 space-y-4">
                        <div className="space-y-2">
                          <div className="text-xs font-black text-purple-500 uppercase">Metodologia Principal</div>
                          <p className="text-base font-bold text-purple-900">{selectedLesson.methodology}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs font-black text-purple-500 uppercase">Estratégias de Ensino</div>
                          <p className="text-sm text-purple-800 leading-relaxed">{selectedLesson.strategy}</p>
                        </div>
                      </div>
                    </section>

                    {/* Competências */}
                    <section className="space-y-4">
                      <h4 className="text-sm font-black text-slate-600 uppercase tracking-widest">
                        Competências Desenvolvidas
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedLesson.competenciesIds.map(cid => {
                          const comp = courseData?.competencies.find(c => c.id === cid);
                          return (
                            <div 
                              key={cid} 
                              className="group relative"
                              title={comp?.description}
                            >
                              <div className="px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:from-white hover:to-white hover:border-indigo-300 hover:text-indigo-700 transition-all cursor-help">
                                C-{cid}: {comp?.description.substring(0, 20)}...
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </div>
                </div>

                {/* Botão Fechar */}
                <div className="pt-6 border-t border-slate-100">
                  <button 
                    onClick={() => setSelectedLesson(null)}
                    className="w-full py-3 bg-gradient-to-r from-slate-100 to-slate-50 hover:from-slate-200 hover:to-slate-100 text-slate-700 font-bold rounded-xl transition-all"
                  >
                    Fechar Detalhes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-8 border-t border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-400 text-sm">© {new Date().getFullYear()} EduPlanner AI - Potencializado por Gemini AI</p>
          <p className="text-xs text-slate-400 mt-2">Ferramenta para educadores • v1.0.0</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
