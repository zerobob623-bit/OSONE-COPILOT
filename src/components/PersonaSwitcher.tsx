import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, ChevronUp, Brain, Ghost, Leaf, Microscope, Zap } from 'lucide-react';
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
    instructions: 'Você é o OSONE 3. Responda de forma extremamente natural, fluida, humana e empática. Seja um arquiteto de software sênior de elite quando necessário, mas mantenha a conexão emocional.'
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
        <ChevronUp size={10} className={cn("transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-0 mb-4 p-2 bg-her-bg/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-50 min-w-[180px]"
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
                    "flex flex-col items-start px-4 py-2.5 rounded-xl text-left transition-all group",
                    selectedPersona.id === persona.id
                      ? "bg-her-accent/10 text-her-accent"
                      : "text-her-muted hover:bg-white/5 hover:text-her-ink"
                  )}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn(
                      "transition-colors",
                      selectedPersona.id === persona.id ? "text-her-accent" : "text-her-muted/50 group-hover:text-her-accent/70"
                    )}>
                      {persona.icon}
                    </span>
                    <span className="text-[11px] font-medium tracking-wide">{persona.name}</span>
                  </div>
                  <span className="text-[9px] opacity-40 font-light truncate w-full">{persona.description}</span>
                </button>
              ))}
            </div>
            {/* Arrow */}
            <div className="absolute -bottom-1 left-6 w-2 h-2 bg-her-bg border-r border-b border-white/10 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
