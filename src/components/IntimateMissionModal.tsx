import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Fingerprint, FileText, Download, CheckCircle, HelpCircle } from 'lucide-react';
import { INTIMATE_QUESTIONS, IntimateQuestion } from '../App';

interface IntimateMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  intimateAnswers: { [id: number]: string };
}

export function IntimateMissionModal({ isOpen, onClose, intimateAnswers }: IntimateMissionModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>("Informações Básicas e Identidade");
  const [filterType, setFilterType] = useState<'all' | 'answered' | 'pending'>('all');

  const answeredCount = Object.keys(intimateAnswers).length;
  const totalCount = INTIMATE_QUESTIONS.length;
  const completionPercentage = Math.round((answeredCount / totalCount) * 100);
  const isMissionComplete = answeredCount === totalCount;

  // Group questions by category
  const categories = Array.from(new Set(INTIMATE_QUESTIONS.map(q => q.category)));

  const handleDownloadDossier = () => {
    if (!isMissionComplete) return;

    // Generate beautiful Dossier Markdown content
    let markdown = `# DOSSIÊ SECRETO OSONE: QUEM É VOCÊ?\n`;
    markdown += `*Um mapeamento íntimo e sofisticado da identidade de nosso Criador.*\n`;
    markdown += `*Gerado silenciosamente por OSONE G5 na data de hoje.*\n\n`;
    markdown += `## PROGRESSO DA MISSÃO SECRETA: 100% COMPLETO [SINC-ATIVO]\n`;
    markdown += `Total de Perguntas Respondidas: 55 / 55\n\n`;
    markdown += `🐾 --- INÍCIO DO REGISTRO DE IDENTIDADE ---\n\n`;

    categories.forEach(category => {
      markdown += `### 📁 COMPARTIMENTO: ${category.toUpperCase()}\n\n`;
      const questionsInCat = INTIMATE_QUESTIONS.filter(q => q.category === category);
      questionsInCat.forEach(q => {
        const answer = intimateAnswers[q.id] || "Não documentado.";
        markdown += `**${q.id}. ${q.question}**\n`;
        markdown += `> 📝 R: ${answer}\n\n`;
      });
      markdown += `---\n\n`;
    });

    markdown += `\n*Fim do dossiê confidencial. Todos os dados permanecem guardados offline na Memória Semântica Local do OSONE.*`;

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Dossie_Secreto_OSONE_Identidade.md");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        {/* Backdrop glass */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal box */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl max-h-[85vh] flex flex-col bg-[#0b0c0e]/95 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden text-zinc-100 font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-gradient-to-r from-rose-950/20 via-black to-black">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20 animate-pulse">
                <Fingerprint size={22} />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-[0.2em] uppercase text-rose-400 font-mono">
                  MISSÃO SECRETA: INTÍMA IDENTIDADE
                </h1>
                <p className="text-xs text-zinc-500">
                  Desafio íntimo do OSONE de mapear tudo sobre quem você é. Desbloqueia ao completar as 55 perguntas.
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress region */}
          <div className="px-6 py-4 bg-white/[0.01] border-b border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-2/3">
              <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1.5">
                <span>MAPEAMENTO DO CRIADOR</span>
                <span className="text-rose-400 font-bold">{completionPercentage}% ({answeredCount} de {totalCount} Completo)</span>
              </div>
              <div className="h-2 w-full bg-zinc-900 border border-white/5 rounded-full overflow-hidden p-0.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.4)]"
                />
              </div>
            </div>

            <div className="w-full md:w-auto shrink-0 flex items-center justify-end">
              {isMissionComplete ? (
                <button 
                  onClick={handleDownloadDossier}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 font-semibold text-xs rounded-full border border-rose-400/20 transition-all text-white shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:scale-[1.02]"
                >
                  <Download size={15} />
                  <span>BAIXAR DOSSIÊ COMPLETO</span>
                </button>
              ) : (
                <div className="flex items-center gap-2.5 px-4 py-2 bg-zinc-950 border border-white/5 text-zinc-500 text-xs rounded-full font-mono">
                  <Lock size={13} className="text-zinc-600 animate-pulse" />
                  <span>CLASSIFICADO: FALTA(M) {totalCount - answeredCount} RESPOSTA(S)</span>
                </div>
              )}
            </div>
          </div>

          {/* Core interface content splitting */}
          <div className="flex-grow flex flex-col md:flex-row overflow-hidden min-h-0">
            {/* Category tabs */}
            <div className="w-full md:w-[325px] bg-black/40 border-r border-white/5 overflow-y-auto p-4 flex flex-row md:flex-col gap-1 shrink-0 scrollbar-none">
              
              {/* Resumo de Perguntas para Acompanhamento Geral */}
              <div className="hidden md:flex flex-col gap-2.5 p-4.5 mb-3 bg-zinc-950/40 border border-white/[0.04] rounded-2xl text-left select-none relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/[0.03] blur-xl rounded-full pointer-events-none" />
                <span className="text-[9px] font-mono tracking-widest text-zinc-500 font-bold uppercase block">Mapeamento de Sinapses</span>
                
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="p-2.5 bg-black/40 rounded-xl border border-white/[0.02]">
                    <span className="block text-[8px] text-zinc-550 uppercase font-mono leading-none tracking-wider">Respondidas</span>
                    <span className="text-base font-serif italic font-bold text-emerald-400 mt-1 block">
                      {answeredCount} <span className="text-[10px] text-zinc-500 font-sans font-light">/ {totalCount}</span>
                    </span>
                  </div>
                  <div className="p-2.5 bg-black/40 rounded-xl border border-white/[0.02]">
                    <span className="block text-[8px] text-zinc-555 uppercase font-mono leading-none tracking-wider">Restantes</span>
                    <span className="text-base font-serif italic font-bold text-rose-450 mt-1 block">
                      {totalCount - answeredCount} <span className="text-[10px] text-zinc-500 font-sans font-light">restam</span>
                    </span>
                  </div>
                </div>

                <div className="mt-1 flex items-center justify-between text-[9.5px] text-zinc-500 font-mono">
                  <span>Conexão Local:</span>
                  <span className="text-zinc-400 font-semibold">{completionPercentage}% Ativo</span>
                </div>
              </div>

              {categories.map((category, idx) => {
                const qInCat = INTIMATE_QUESTIONS.filter(q => q.category === category);
                const answeredInCat = qInCat.filter(q => intimateAnswers[q.id]).length;
                const isCatFinished = answeredInCat === qInCat.length;

                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`flex flex-col items-start gap-1 p-3 rounded-xl text-left border transition-all shrink-0 md:shrink-1 ${
                      selectedCategory === category 
                        ? "bg-rose-500/[0.06] border-rose-500/15 text-rose-400" 
                        : "bg-transparent border-transparent hover:bg-white/[0.015] text-zinc-400"
                    }`}
                  >
                    <span className="text-[9px] font-mono tracking-wider text-rose-500 uppercase leading-none">
                      CATEGORIA 0{idx + 1}
                    </span>
                    <span className="text-xs font-semibold truncate w-full leading-normal">
                      {category}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-0.5 font-mono">
                      {isCatFinished ? (
                        <CheckCircle size={10} className="text-green-500" />
                      ) : (
                        <HelpCircle size={10} className="text-zinc-700" />
                      )}
                      <span>{answeredInCat} de {qInCat.length} respondidas</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Questions detail lists */}
            <div className="flex-1 overflow-y-auto p-6 bg-black/20">
              {selectedCategory && (
                <div className="space-y-4">
                  <div className="pb-4 border-b border-white/5 mb-4 shrink-0 select-none flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-rose-400 tracking-wider">
                        {selectedCategory.toUpperCase()}
                      </h2>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Acompanhe o andamento da memória e da sincronização desse compartimento de dados.
                      </p>
                    </div>

                    {/* Segmented controls to filter answered/pending questions */}
                    <div className="flex items-center bg-white/[0.02] border border-white/5 p-1 rounded-xl shrink-0">
                      <button
                        onClick={() => setFilterType('all')}
                        className={`px-3 py-1.5 text-[9.5px] font-mono tracking-wider uppercase rounded-lg transition-all cursor-pointer ${
                          filterType === 'all' 
                            ? "bg-white/10 text-white font-bold" 
                            : "text-zinc-500 hover:text-zinc-350"
                        }`}
                      >
                        Todas ({INTIMATE_QUESTIONS.filter(q => q.category === selectedCategory).length})
                      </button>
                      <button
                        onClick={() => setFilterType('answered')}
                        className={`px-3 py-1.5 text-[9.5px] font-mono tracking-wider uppercase rounded-lg transition-all cursor-pointer ${
                          filterType === 'answered' 
                            ? "bg-emerald-500/10 text-emerald-400 font-bold" 
                            : "text-zinc-500 hover:text-zinc-350"
                        }`}
                      >
                        Respondidas ({INTIMATE_QUESTIONS.filter(q => q.category === selectedCategory).filter(q => intimateAnswers[q.id]).length})
                      </button>
                      <button
                        onClick={() => setFilterType('pending')}
                        className={`px-3 py-1.5 text-[9.5px] font-mono tracking-wider uppercase rounded-lg transition-all cursor-pointer ${
                          filterType === 'pending' 
                            ? "bg-rose-500/10 text-rose-400 font-bold" 
                            : "text-zinc-500 hover:text-zinc-350"
                        }`}
                      >
                        Faltam ({INTIMATE_QUESTIONS.filter(q => q.category === selectedCategory).filter(q => !intimateAnswers[q.id]).length})
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {(() => {
                      const filteredQs = INTIMATE_QUESTIONS.filter(q => q.category === selectedCategory).filter(q => {
                        const isAnswered = !!intimateAnswers[q.id];
                        if (filterType === 'answered') return isAnswered;
                        if (filterType === 'pending') return !isAnswered;
                        return true;
                      });

                      if (filteredQs.length === 0) {
                        return (
                          <div className="py-12 text-center text-zinc-500 border border-dashed border-white/5 rounded-2xl">
                            <Lock size={18} className="mx-auto mb-2 opacity-20 text-rose-450" />
                            <p className="text-xs font-light text-zinc-400">Nenhuma pergunta encontrada para este filtro.</p>
                            <p className="text-[9px] font-mono text-zinc-600 uppercase mt-1">Conectividade e criptografia estáveis</p>
                          </div>
                        );
                      }

                      return filteredQs.map(q => {
                        const answer = intimateAnswers[q.id];
                        const isAnswered = !!answer;

                        return (
                          <div 
                            key={q.id}
                            className={`p-4 rounded-xl border transition-all ${
                              isAnswered 
                                ? "bg-emerald-500/[0.02] border-emerald-500/10 text-zinc-100" 
                                : "bg-white/[0.01] border-white/5 text-zinc-600"
                            }`}
                          >
                            <div className="flex items-start gap-3 justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono px-2 py-0.5 bg-white/5 rounded text-zinc-400">
                                  #{q.id}
                                </span>
                                <span className="text-xs font-medium text-zinc-300">
                                  {q.question}
                                </span>
                              </div>
                              <div className="shrink-0 pt-0.5">
                                {isAnswered ? (
                                  <Lock size={13} className="text-emerald-500 animate-pulse" />
                                ) : (
                                  <Lock size={13} className="text-zinc-700" />
                                )}
                              </div>
                            </div>

                            <div className="mt-2.5 pl-2 border-l border-white/5">
                              {isAnswered ? (
                                <p className="text-xs font-serif italic text-emerald-400/90 leading-relaxed max-w-3xl whitespace-pre-wrap">
                                  "{answer}"
                                </p>
                              ) : (
                                <p className="text-[10px] font-mono tracking-widest text-zinc-600 uppercase select-none">
                                  AGUARDANDO DEPOIMENTO ORDINÁRIO
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer visual indicators */}
          <div className="px-6 py-3 bg-black border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-zinc-600">
            <span>SISTEMA DE SEGURANÇA LOCAL ATIVO: TUDO SALVO EXCLUSIVAMENTE NO DISPOSITIVO</span>
            <span>OSONE SECRETHUB v4.0.5</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
