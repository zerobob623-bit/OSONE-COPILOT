import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, Trash2, Plus, X, Sparkles, Bookmark, Check, Search, Tag, 
  Layers, Lightbulb, Filter, ArrowRight, Hourglass, HelpCircle 
} from 'lucide-react';

interface SemanticMemoryProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNotification?: (message: string, type: 'info' | 'success' | 'error') => void;
}

interface ParsedMemory {
  id: string;
  rawIndex: number;
  date?: string;
  text: string;
  category: string;
  categoryColor: string;
  activationWords: string[];
}

const STOP_WORDS = new Set([
  'de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está', 'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'depois', 'sem', 'mesmo', 'aos', 'ter', 'seus', 'quem', 'nas', 'me', 'esse', 'eles', 'estão', 'você', 'tinha', 'foram', 'essa', 'num', 'nem', 'suas', 'meu', 'minha', 'são', 'este', 'eles', 'vocês'
]);

export function SemanticMemory({ isOpen, onClose, onAddNotification }: SemanticMemoryProps) {
  const [memories, setMemories] = useState<ParsedMemory[]>([]);
  const [newMemoryText, setNewMemoryText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAssociationWord, setSelectedAssociationWord] = useState<string | null>(null);

  // Load and categorize memories on-the-fly
  const loadMemories = () => {
    try {
      const raw = localStorage.getItem('osone_long_term_memory') || '';
      const lines = raw.split('\n').filter(line => line.trim().length > 0);
      
      const parsed = lines.map((line, index) => {
        let cleanText = line.trim();
        let date: string | undefined;

        // Strip leading hyphen
        if (cleanText.startsWith('-')) {
          cleanText = cleanText.substring(1).trim();
        }
        
        // Parse date
        const dateRegex = /^(\d{1,2}\/\d{1,2}\/\d{4}):\s*(.*)$/;
        const match = cleanText.match(dateRegex);
        if (match) {
          date = match[1];
          cleanText = match[2].trim();
        }

        // 1. Intelligent Category Triage via Lexical Analysis
        const lowerText = cleanText.toLowerCase();
        let category = 'Geral';
        let categoryColor = 'text-gray-400 bg-gray-500/10 border-gray-500/20';

        const techTerms = ['code', 'react', 'ts', 'js', 'python', 'api', 'css', 'tailwind', 'docker', 'banco', 'database', 'db', 'backend', 'frontend', 'dev', 'git', 'github', 'webhook', 'codar', 'projeto', 'arquitetura', 'sqlite', 'postgres', 'sql', 'osone'];
        const prefTerms = ['gosto', 'gosta', 'prefiro', 'prefere', 'favorito', 'favorita', 'café', 'comida', 'acordar', 'rotina', 'mania', 'cor', 'estilo', 'música', 'hábito', 'leitura', 'sono', 'hobbie', 'lazer'];
        const goalTerms = ['meta', 'dinheiro', 'faturar', 'trabalhar', 'negócio', 'empresa', 'emprego', 'lucro', 'gastar', 'comprar', 'curso', 'aula', 'faculdade', 'estudar', 'vender', 'vendas'];
        const lifeTerms = ['nasci', 'morei', 'cidade', 'viagem', 'viajei', 'família', 'pai', 'mãe', 'amigo', 'cachorro', 'gato', 'pet', 'passado', 'história', 'lembrança', 'idade', 'anos'];

        if (techTerms.some(term => lowerText.includes(term))) {
          category = 'Tecnologia';
          categoryColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
        } else if (prefTerms.some(term => lowerText.includes(term))) {
          category = 'Preferências';
          categoryColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        } else if (goalTerms.some(term => lowerText.includes(term))) {
          category = 'Metas & Trabalho';
          categoryColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        } else if (lifeTerms.some(term => lowerText.includes(term))) {
          category = 'Pessoal & Vivências';
          categoryColor = 'text-purple-400 bg-purple-500/10 border-purple-500/20';
        }

        // 2. Dynamic Tag/Activation Keyword Generation
        const words = lowerText
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, "")
          .split(/\s+/)
          .filter(word => word.length > 3 && !STOP_WORDS.has(word));
        
        // Remove duplicates and limit to top 4 unique keywords
        const activationWords = Array.from(new Set(words)).slice(0, 4);

        return {
          id: `mem-${index}-${Date.now()}`,
          rawIndex: index,
          date,
          text: cleanText,
          category,
          categoryColor,
          activationWords
        };
      });

      // Show latest memories first but keep correct rawIndex link
      setMemories(parsed.reverse());
    } catch (e) {
      console.error('Error parsing semantic memories:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMemories();
    }
  }, [isOpen]);

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;

    try {
      const prev = localStorage.getItem('osone_long_term_memory') || '';
      const dateStr = new Date().toLocaleDateString('pt-BR');
      const newMemoryLine = prev 
        ? `${prev}\n- ${dateStr}: ${newMemoryText.trim()}`
        : `- ${dateStr}: ${newMemoryText.trim()}`;
        
      localStorage.setItem('osone_long_term_memory', newMemoryLine);
      setNewMemoryText('');
      loadMemories();
      
      if (onAddNotification) {
        onAddNotification("Fato gravado e categorizado com sucesso", "success");
      }
      
      window.dispatchEvent(new CustomEvent('osone_sync', { detail: { type: 'memory_updated' } }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMemory = (rawIndex: number) => {
    try {
      const raw = localStorage.getItem('osone_long_term_memory') || '';
      const lines = raw.split('\n').filter(line => line.trim().length > 0);
      
      if (rawIndex >= 0 && rawIndex < lines.length) {
        lines.splice(rawIndex, 1);
        const newRaw = lines.join('\n');
        localStorage.setItem('osone_long_term_memory', newRaw);
        loadMemories();
        
        if (onAddNotification) {
          onAddNotification("Informação apagada da memória", "info");
        }
        
        window.dispatchEvent(new CustomEvent('osone_sync', { detail: { type: 'memory_updated' } }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Compile unique frequency cloud of associative words for prompt filters
  const getTopActivationWordsCloud = () => {
    const counts: Record<string, number> = {};
    memories.forEach(mem => {
      mem.activationWords.forEach(word => {
        counts[word] = (counts[word] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0]);
  };

  const frequentWords = getTopActivationWordsCloud();

  // Filter memories matching search string, selected categories, and clicked activation tags
  const filteredMemories = memories.filter(mem => {
    // 1. Category Filter Match
    if (selectedCategory !== 'all' && mem.category !== selectedCategory) {
      return false;
    }

    // 2. Quick Click Associative Tag Match
    if (selectedAssociationWord && !mem.activationWords.includes(selectedAssociationWord)) {
      return false;
    }

    // 3. Search Bar Match (text contents, categories, dates, or tags)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const textMatch = mem.text.toLowerCase().includes(q);
      const tagMatch = mem.activationWords.some(tag => tag.includes(q));
      const dateMatch = mem.date && mem.date.includes(q);
      const categoryMatch = mem.category.toLowerCase().includes(q);
      return textMatch || tagMatch || dateMatch || categoryMatch;
    }

    return true;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-start justify-center pt-16 md:pt-20 px-4 bg-black/75 backdrop-blur-md">
          {/* Base overlay for simple click away */}
          <div className="absolute inset-0" onClick={onClose} />
          
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="w-full max-w-2xl bg-[#09090b] border border-white/[0.08] rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative z-10 flex flex-col max-h-[85vh]"
          >
            {/* Header Area */}
            <div className="flex items-center justify-between p-6 px-8 border-b border-white/[0.04] bg-[#0c0c0f] shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-violet-500/25 animate-ping" />
                  <div className="p-2.5 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 text-violet-400 border border-violet-500/25 relative">
                    <Brain size={20} className="animate-pulse" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white tracking-wide flex items-center gap-2">
                    Cérebro Semântico OSONE
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 uppercase font-mono font-bold tracking-widest animate-pulse">
                      Ativo
                    </span>
                  </h3>
                  <p className="text-[9px] text-[#86869a] tracking-wider uppercase mt-1">Conexão Relacional, Memória de Longo Prazo e Aprendizado</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/5 text-her-muted hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 px-8 space-y-6 custom-scrollbar">
              
              {/* Concept Info Block */}
              <div className="p-4 rounded-2xl bg-[#0c0d12]/50 border border-violet-500/10 text-[11px] text-[#aeaec5] leading-relaxed flex gap-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 blur-2xl rounded-full" />
                <Sparkles size={16} className="text-violet-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1">
                  <span className="text-white font-medium block">Como funciona o motor semântico?</span>
                  <span>
                    O OSONE tria e categoriza de maneira autônoma suas conversas e decisões importantes. Sempre que preciso, o assistente consulta o histórico por <strong>associação de palavras chaves</strong>, criando caminhos conexos de dados em tempo real.
                  </span>
                </div>
              </div>

              {/* Associative Search Console */}
              <div className="space-y-3.5">
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-3.5 text-her-muted" />
                  <input 
                    type="text"
                    placeholder="Pesquise por associação de palavras ou tags de ativação..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedAssociationWord(null); // Click reset association on raw typing
                    }}
                    className="w-full pl-10 pr-9 py-3 rounded-xl bg-[#030303] border border-white/[0.05] text-xs text-white placeholder-[#515162] focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-3 hover:text-white text-her-muted"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Cloud of Frequent Associative Trigger words */}
                {frequentWords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-her-muted uppercase tracking-wider flex items-center gap-1 mr-1">
                      <Lightbulb size={11} className="text-yellow-500" />
                      Ativadores:
                    </span>
                    {frequentWords.map((word) => {
                      const isSelected = selectedAssociationWord === word;
                      return (
                        <button
                          key={word}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedAssociationWord(null);
                            } else {
                              setSelectedAssociationWord(word);
                              setSearchQuery(''); // Prioritize the exact tag search
                            }
                          }}
                          className={`text-[9px] font-mono px-2 py-1 rounded-lg transition-all border ${
                            isSelected 
                              ? 'bg-violet-500/20 text-violet-300 border-violet-500/30 font-semibold shadow-[0_0_8px_rgba(139,92,246,0.15)]' 
                              : 'bg-white/[0.01] hover:bg-white/[0.03] text-her-muted hover:text-white border-white/[0.03]'
                          }`}
                        >
                          🏷️ {word}
                        </button>
                      );
                    })}
                    {selectedAssociationWord && (
                      <button 
                        onClick={() => setSelectedAssociationWord(null)}
                        className="text-[9px] text-[#e04040] hover:underline font-mono ml-1"
                      >
                        [limpar filtro]
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Triage Categories Filters */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#727289] font-bold flex items-center gap-1">
                  <Layers size={11} />
                  Filtrar por Categoria
                </span>
                
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'Tudo' },
                    { id: 'Tecnologia', label: '💻 Tecnologia & Código' },
                    { id: 'Preferências', label: '🌟 Preferências' },
                    { id: 'Metas & Trabalho', label: '🎯 Metas & Trabalho' },
                    { id: 'Pessoal & Vivências', label: '🏡 Pessoal' },
                    { id: 'Geral', label: '📦 Geral' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`text-[10px] px-3.5 py-1.5 rounded-xl border transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-white/10 text-white border-white/25 font-medium'
                          : 'bg-white/[0.01] hover:bg-white/[0.02] text-her-muted hover:text-white border-white/[0.03]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Memory Manual Input Drawer */}
              <div className="p-4 rounded-2xl bg-[#050507] border border-white/[0.02]">
                <form onSubmit={handleAddMemory} className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Ensine ou registre uma preferência pessoal para o OSONE..."
                    value={newMemoryText}
                    onChange={(e) => setNewMemoryText(e.target.value)}
                    className="flex-grow p-3 rounded-xl bg-black border border-white/[0.03] text-xs text-white placeholder-[#454556] focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!newMemoryText.trim()}
                    className="px-4 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:hover:bg-violet-600 font-semibold text-white transition-colors flex items-center justify-center shrink-0 text-xs gap-1"
                    title="Guardar na Memória"
                  >
                    <Plus size={14} />
                    <span className="hidden sm:inline">Gravar</span>
                  </button>
                </form>
              </div>

              {/* Memories List */}
              <div className="space-y-3.5">
                <div className="flex justify-between items-center px-1">
                  <h4 className="text-[10px] uppercase tracking-wider text-[#7e7e8c] font-semibold flex items-center gap-1.5">
                    <Bookmark size={11} className="text-[#7e7e8c]" />
                    Conhecimento Organizado ({filteredMemories.length})
                  </h4>
                  {(searchQuery || selectedCategory !== 'all' || selectedAssociationWord) && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setSelectedAssociationWord(null);
                      }}
                      className="text-[9px] text-violet-400 hover:underline uppercase font-mono tracking-wider font-bold"
                    >
                      Limpar Filtros
                    </button>
                  )}
                </div>
                
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 select-none custom-scrollbar-preview">
                  {filteredMemories.length === 0 ? (
                    <div className="py-12 text-center rounded-3xl bg-[#040405] border border-white/[0.02] text-xs text-her-muted flex flex-col items-center justify-center gap-2">
                      <Hourglass size={20} className="text-her-muted opacity-40 animate-pulse" />
                      <span>Nenhum conhecimento ou associação correspondeu aos filtros ativos.</span>
                    </div>
                  ) : (
                    filteredMemories.map((mem) => (
                      <motion.div
                        key={mem.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-2xl bg-[#0c0c0f] border border-white/[0.02] hover:border-white/[0.05] transition-all flex justify-between items-start gap-4 group relative"
                      >
                        <div className="space-y-2.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Dynamically assigned Category Label */}
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded-md border tracking-wider uppercase font-mono ${mem.categoryColor}`}>
                              {mem.category}
                            </span>
                            
                            {mem.date && (
                              <span className="text-[9px] text-[#4d4d62] font-mono leading-none">
                                • {mem.date}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs text-white/90 leading-relaxed font-light break-words pr-2">
                            {mem.text}
                          </p>

                          {/* Dynamic associated activation tags */}
                          {mem.activationWords.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1.5">
                              {mem.activationWords.map(tag => (
                                <span 
                                  key={tag} 
                                  className={`text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/[0.01] text-her-muted/65 border border-white/[0.01] hover:text-white hover:border-white/10 cursor-pointer ${
                                    searchQuery && tag.includes(searchQuery.toLowerCase().trim()) ? 'text-violet-300 font-medium bg-violet-950/20 border-violet-500/20' : ''
                                  }`}
                                  onClick={() => {
                                    setSearchQuery(tag);
                                    setSelectedCategory('all');
                                    setSelectedAssociationWord(null);
                                  }}
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteMemory(mem.rawIndex)}
                          className="p-1.5 rounded-lg bg-white/0 hover:bg-red-500/10 text-her-muted hover:text-red-400 transition-all opacity-0 group-hover:opacity-100 mt-1 shrink-0"
                          title="Esquecer Registro de Memória"
                        >
                          <Trash2 size={13} />
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 px-8 border-t border-white/[0.04] bg-[#0c0c0f] text-center text-[9px] text-her-muted tracking-widest font-mono flex items-center justify-between shrink-0">
              <span>Mecanismo Relacional Ativo</span>
              <span className="text-violet-400 font-bold">OSONE 4 PRO</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
