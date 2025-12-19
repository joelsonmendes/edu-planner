
import React, { useState, useCallback, useRef } from 'react';
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
  Info
} from 'lucide-react';

const App: React.FC = () => {
  const [inputPlan, setInputPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsingPdf, setParsingPdf] = useState(false);
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    // @ts-ignore
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;
    
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let text = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      // @ts-ignore
      const pageText = content.items.map((item: any) => item.str).join(' ');
      text += pageText + '\n';
    }
    
    return text;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      alert('Por favor, selecione um arquivo PDF.');
      return;
    }

    setParsingPdf(true);
    try {
      const text = await extractTextFromPDF(file);
      if (text.trim().length === 0) {
        alert("Não foi possível extrair texto deste PDF. Tente copiar e colar o conteúdo.");
      } else {
        setInputPlan(text);
      }
    } catch (error) {
      console.error("Erro ao ler PDF:", error);
      alert("Houve um erro ao processar o PDF. Certifique-se de que o arquivo não está corrompido ou protegido.");
    } finally {
      setParsingPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!inputPlan.trim()) return;
    setLoading(true);
    try {
      const data = await generateCoursePlan(inputPlan);
      setCourseData(data);
      if (data.modules.length > 0) {
        setActiveModuleId(data.modules[0].id);
      }
    } catch (error) {
      console.error("Erro ao gerar plano:", error);
      alert("Houve um erro ao processar seu plano. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const activeModule = courseData?.modules.find(m => m.id === activeModuleId);

  return (
    <div className="min-h-screen text-slate-900">
      <header className="sticky top-0 z-50 glass-effect border-b border-slate-200 py-4 px-6 mb-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
              <BookOpen size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">EduPlanner <span className="text-indigo-600">AI</span></h1>
          </div>
          <div className="hidden md:block">
            <p className="text-sm text-slate-500 font-medium italic">Transformando conhecimento em jornada pedagógica.</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-12">
        {!courseData && !loading ? (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-black text-slate-800 leading-tight">
                Crie o plano de aula <span className="text-indigo-600">perfeito</span> em segundos.
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Insira sua ementa, tópicos ou carregue seu plano de curso em <span className="font-bold text-indigo-600">PDF</span>.
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100 p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Esboço do Plano de Curso</label>
                    <span className="text-[10px] text-indigo-500 font-bold flex items-center gap-1 mt-1">
                      <Info size={10} /> Identificação inteligente de carga horária (4h por aula)
                    </span>
                  </div>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={parsingPdf}
                    className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 disabled:opacity-50"
                  >
                    {parsingPdf ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    {parsingPdf ? "Lendo PDF..." : "Importar PDF"}
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
                  className="w-full h-64 p-6 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none text-lg leading-relaxed placeholder:text-slate-300"
                  placeholder="Cole aqui seu plano ou ementa, ou clique em 'Importar PDF' acima..."
                  value={inputPlan}
                  onChange={(e) => setInputPlan(e.target.value)}
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={!inputPlan.trim() || parsingPdf}
                className="w-full py-4 px-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] active:scale-95"
              >
                <Sparkles size={22} />
                Gerar Estrutura Pedagógica Completa
              </button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Target size={16} />
                  </div>
                  Mapeamento de Competências
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                    <Lightbulb size={16} />
                  </div>
                  Metodologias Ativas
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <ClipboardCheck size={16} />
                  </div>
                  Aulas de 4 Horas (Fiel ao Original)
                </div>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-8">
            <div className="relative">
              <div className="w-24 h-24 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 animate-pulse" size={32} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-slate-800">Cálculo de Carga Horária...</h3>
              <p className="text-slate-500">Distribuindo conteúdos em sessões de 4 horas com fidelidade pedagógica.</p>
            </div>
            <div className="max-w-md w-full bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <div className="flex gap-3 text-indigo-700 italic text-sm">
                <Lightbulb className="shrink-0" size={18} />
                <p>"Inteligência é a capacidade de se adaptar à mudança." - Stephen Hawking</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500">
            <aside className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                <button 
                  onClick={() => { setCourseData(null); setInputPlan(''); }}
                  className="mb-4 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1"
                >
                  <ArrowRight size={12} className="rotate-180" /> Novo Plano
                </button>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Informações do Curso</h3>
                <h2 className="text-2xl font-black text-slate-800 mb-2 leading-tight">{courseData?.courseName}</h2>
                <p className="text-sm text-slate-500 mb-4 line-clamp-3">{courseData?.description}</p>
                
                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50">
                   <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                    <Clock size={12} /> {courseData?.totalDuration}
                   </div>
                   <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                    <Users size={12} /> {courseData?.targetAudience}
                   </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest">Cronograma de Módulos</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {courseData?.modules.map((mod) => (
                    <button
                      key={mod.id}
                      onClick={() => setActiveModuleId(mod.id)}
                      className={`w-full text-left px-6 py-4 transition-colors flex items-center justify-between group ${activeModuleId === mod.id ? 'bg-indigo-50 border-r-4 border-indigo-600' : 'hover:bg-slate-50'}`}
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-indigo-500 uppercase">Módulo {mod.id}</span>
                        <h4 className={`font-bold text-sm ${activeModuleId === mod.id ? 'text-indigo-900' : 'text-slate-700'}`}>{mod.title}</h4>
                      </div>
                      <ChevronRight className={`transition-transform ${activeModuleId === mod.id ? 'translate-x-1 text-indigo-600' : 'text-slate-300 group-hover:translate-x-1'}`} size={18} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-indigo-900 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200">
                <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-4">Competências Alvo</h3>
                <div className="space-y-3">
                  {courseData?.competencies.map((comp) => (
                    <div key={comp.id} className="group cursor-help relative">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-indigo-500 rounded flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black">
                          {comp.id}
                        </div>
                        <p className="text-xs text-indigo-100 leading-relaxed font-medium">{comp.description}</p>
                      </div>
                      <div className="absolute left-0 bottom-full mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-white text-slate-800 p-3 rounded-xl shadow-2xl border border-slate-200 text-xs w-64 z-10">
                        <span className="font-bold text-indigo-600 block mb-1">Conhecimento Relacionado:</span>
                        {comp.knowledgeRelationship}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <section className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <PlusCircle className="text-indigo-600" />
                  {activeModule?.title}
                </h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => window.print()}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <Download size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeModule?.lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-left group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full">Aula {lesson.id}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{lesson.duration}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2">{lesson.title}</h3>
                    <div className="mt-4 flex flex-wrap gap-1">
                      {lesson.competenciesIds.map(cid => (
                        <span key={cid} className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">C-{cid}</span>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:gap-2 transition-all">
                      Ver detalhes <ArrowRight size={14} />
                    </div>
                  </button>
                ))}
              </div>

              {selectedLesson && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
                  <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-300">
                    <button 
                      onClick={() => setSelectedLesson(null)}
                      className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <PlusCircle className="rotate-45" size={28} />
                    </button>

                    <div className="p-8 md:p-12 space-y-8">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-xs font-black uppercase tracking-widest">Aula {selectedLesson.id}</span>
                          <span className="text-slate-400 font-medium">{selectedLesson.duration}</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-800 leading-tight">{selectedLesson.title}</h2>
                        <p className="text-lg text-slate-600 leading-relaxed">{selectedLesson.content}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                        <div className="space-y-6">
                          <section className="space-y-3">
                            <h4 className="text-sm font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                              <Target size={18} /> Objetivos de Aprendizagem
                            </h4>
                            <ul className="space-y-2">
                              {selectedLesson.objectives.map((obj, i) => (
                                <li key={i} className="flex gap-3 text-sm text-slate-700">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                                  {obj}
                                </li>
                              ))}
                            </ul>
                          </section>

                          <section className="space-y-3">
                            <h4 className="text-sm font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                              <ClipboardCheck size={18} /> Avaliação
                            </h4>
                            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm text-emerald-800 font-medium">
                              {selectedLesson.assessment}
                            </div>
                          </section>
                        </div>

                        <div className="space-y-6">
                          <section className="space-y-3">
                            <h4 className="text-sm font-black text-purple-600 uppercase tracking-widest flex items-center gap-2">
                              <Lightbulb size={18} /> Metodologia e Estratégia
                            </h4>
                            <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 space-y-4">
                              <div>
                                <span className="text-[10px] font-black text-purple-400 uppercase">Metodologia</span>
                                <p className="text-sm font-bold text-purple-900">{selectedLesson.methodology}</p>
                              </div>
                              <div>
                                <span className="text-[10px] font-black text-purple-400 uppercase">Estratégia de Ensino</span>
                                <p className="text-sm text-purple-800 leading-relaxed">{selectedLesson.strategy}</p>
                              </div>
                            </div>
                          </section>

                          <section className="space-y-3">
                            <h4 className="text-sm font-black text-slate-600 uppercase tracking-widest">Competências Praticadas</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedLesson.competenciesIds.map(cid => {
                                const comp = courseData?.competencies.find(c => c.id === cid);
                                return (
                                  <div key={cid} className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-white hover:border-indigo-300 cursor-help group/c relative">
                                    C-{cid}
                                    <div className="absolute left-0 bottom-full mb-2 opacity-0 group-hover/c:opacity-100 pointer-events-none transition-opacity bg-slate-900 text-white p-3 rounded-xl text-[10px] w-48 z-20">
                                      {comp?.description}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </section>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => setSelectedLesson(null)}
                        className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl transition-colors mt-4"
                      >
                        Fechar Detalhes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <footer className="py-12 border-t border-slate-200 text-center">
        <p className="text-slate-400 text-sm">© 2025 EduPlanner AI - Potencializado por Gemini 3 Pro</p>
      </footer>
    </div>
  );
};

export default App;
