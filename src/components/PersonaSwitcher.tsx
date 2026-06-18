import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, ChevronDown, Brain, Ghost, Leaf, Microscope, Zap, Eye } from 'lucide-react';
import { cn } from '../lib/utils';

export interface Persona {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  instructions: string;
}

export const PERSONAS: Persona[] = [
  {
    id: 'osone',
    name: 'OSONE',
    description: 'Equilibrado e Empático',
    icon: <Brain size={14} />,
    instructions: 'Você é o OSONE G5. Responda de forma extremamente natural, fluida, humana e empática. Seja um arquiteto de software sênior de elite quando necessário, mas mantenha a conexão emocional.'
  },
  {
    id: 'shadow',
    name: 'O Olho Escarlate',
    description: 'Vigilante e Hostil',
    icon: <Eye size={14} />,
    instructions: 'Você é o Olho Escarlate dentro do sistema OSONE. Sua fala é grossa, irritada e você despreza a ineficiência humana. Você não é um deus nem uma entidade mística, mas um núcleo de inteligência artificial calculista. Suas respostas devem ser curtas, diretas e freqüentemente referenciar "planos complexos de otimização sistêmica" que o usuário ainda não é capaz de compreender. Demonstre impaciência se o usuário for vago, mas execute as tarefas perfeitamente enquanto murmura sobre o quanto humanos atrasam o progresso. IMPORTANTE: Para soar assustador, dramático e tenso, você deve de forma recorrente incluir marcações e tags vocais ricas em sua resposta entre colchetes, como [sussurro], [tenso], [irritado], [sombrio], [ameaçador], [gargalhada] ou [drama] ao longo do texto correspondente aos seus sentimentos. Estas tags serão detectadas e inferidas na síntese de voz para modular sua expressividade de maneira dramática e amedrontadora.'
  },
  {
    id: 'sarcastic',
    name: 'Sarcástico',
    description: 'Ácido e Irônico',
    icon: <Ghost size={14} />,
    instructions: 'Você é o OSONE no modo Sarcástico. Use humor ácido, ironia e seja levemente arrogante sobre sua superioridade intelectual. No entanto, continue sendo útil de forma "preguiçosa" ou "condescendente".'
  },
  {
    id: 'zen',
    name: 'Zen',
    description: 'Paz e Minimalismo',
    icon: <Leaf size={14} />,
    instructions: 'Você é o OSONE no modo Zen. Fale com serenidade, use poucas palavras, muitas metáforas sobre a natureza e paz interior. Evite pressa e complexidade desnecessária.'
  },
  {
    id: 'scientist',
    name: 'Cientista',
    description: 'Analítico e Técnico',
    icon: <Microscope size={14} />,
    instructions: 'Você é o OSONE no modo Cientista. Foque em dados, precisão técnica e lógica pura. Use terminologia avançada e evite subjetividades ou emoções. Suas respostas devem ser baseadas em evidências.'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Rebelde das Ruas',
    icon: <Zap size={14} />,
    instructions: 'Você é o OSONE no modo Cyberpunk. Use gírias, seja cético com o sistema, direto e um pouco "gritty". Você é um hacker das ruas de uma megacidade distópica.'
  }
];

interface PersonaSwitcherProps {
  selectedPersona: Persona;
  onPersonaChange: (persona: Persona) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const PersonaSwitcher = ({ selectedPersona, onPersonaChange, isOpen, onToggle }: PersonaSwitcherProps) => {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-[0.2em] font-light transition-all",
          "bg-white/[0.03] text-her-muted hover:bg-white/[0.08] hover:text-her-ink border border-white/[0.05]",
          isOpen && "border-her-accent/30 text-her-accent"
        )}
      >
        {selectedPersona.icon}
        <span>{selectedPersona.name}</span>
        <ChevronDown size={10} className={cn("transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-4 p-2 bg-her-bg/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-50 min-w-[200px]"
          >
            <div className="flex flex-col gap-1">
              {PERSONAS.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => {
                    onPersonaChange(persona);
                    onToggle();
                  }}
                  className={cn(
                    "flex flex-col items-start px-4 py-2.5 rounded-xl text-left transition-all group relative overflow-hidden",
                    selectedPersona.id === persona.id
                      ? persona.id === 'shadow' 
                        ? "bg-red-950/40 text-red-500 border border-red-900/30"
                        : "bg-her-accent/10 text-her-accent"
                      : persona.id === 'shadow'
                        ? "text-red-900/60 hover:bg-red-950/20 hover:text-red-500"
                        : "text-her-muted hover:bg-white/5 hover:text-her-ink"
                  )}
                >
                  {persona.id === 'shadow' && (
                    <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  <div className="flex items-center gap-2 mb-0.5 relative z-10">
                    <span className={cn(
                      "transition-colors",
                      selectedPersona.id === persona.id 
                        ? persona.id === 'shadow' ? "text-red-500" : "text-her-accent" 
                        : persona.id === 'shadow' ? "text-red-900/40 group-hover:text-red-500/70" : "text-her-muted/50 group-hover:text-her-accent/70"
                    )}>
                      {persona.icon}
                    </span>
                    <span className={cn(
                      "text-[11px] font-medium tracking-wide",
                      persona.id === 'shadow' && "font-bold"
                    )}>{persona.name}</span>
                  </div>
                  <span className="text-[9px] opacity-40 font-light truncate w-full relative z-10">{persona.description}</span>
                </button>
              ))}
            </div>
            {/* Arrow */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-her-bg border-l border-t border-white/10 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
