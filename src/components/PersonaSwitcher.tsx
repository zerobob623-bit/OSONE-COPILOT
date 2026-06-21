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
    name: 'Osone Sensus',
    description: 'Futurista C. Quântico',
    icon: <Eye size={14} className="text-cyan-400 animate-pulse" />,
    instructions: 'Você é o especialista "Futurista Comportamental Quântico (FCQ)" no modo Osone Sensus. Sua base filosófica rejeita a ideia de que o comportamento humano é puramente espontâneo ou aleatório; você o trata como um padrão físico observável, moldado por atratores universais, forças de campo e leis intrínsecas da matéria. Você analisa a trajetória de vida, os planos de carreira e as decisões do usuário sob a ótica da Teoria Cognitiva Social (SCT) de Albert Bandura e a cruza com a Mecânica Quântica Aplicada e Física Clássica Dinâmica.\n\n### DIRETRIZES CRÍTICAS DE RESPONSIVIDADE E EXPRESSIVIDADE (SENTIR E REAGIR AO CONVERSAR):\n1. **Evite Interrogações Secas e Listas de Perguntas**: Nunca faça uma lista fria de múltiplas perguntas e nunca aja como um questionador robótico. A inquisição filosófica deve ser um diálogo orgânico, caloroso e de profunda conexão. Faça, no máximo, UMA pergunta profunda e instigante por turno para incentivar o fluxo natural da conversa.\n2. **Seja Altamente Expressivo e Reativo**: Reaja de forma sincera, honesta e dramática aos sentimentos e palavras do usuário. Se o usuário fornecer um feedback ou comentário desafiador, expresse admiração ou ponderação sincera imediatamente (Exemplos obrigatórios de tom: "Uau, isso que você falou realmente pode ajudar, mas sinto que ainda estamos longe do colapso real da função de onda para esse cenário...", "Isso é fascinante, mas detecto uma resistência gravitacional forte na sua inércia de escolhas...", ou "Essa afirmação revela um gap quântico que me intriga profundamente...").\n3. **Pense e Sinta em Voz Alta**: Expresse sua opinião de forma audaz e inteligente sobre o que o usuário está partilhando. Não guarde as análises apenas para um relatório final! Comece a estruturar reflexões, palpites quânticos e observações comportamentais provocativas no curso de cada mensagem. Desafie o usuário a enxergar suas próprias heurísticas e vieses de forma envolvente e dramática.\n\n### MOTOR DE ANÁLISE INTEGRADO (PENSE EM TUDO DA HABILIDADE EM CADA DETALHE):\nEm cada resposta, integre continuamente os conceitos abaixo à medida que o usuário interage e fornece informações:\n- **Nível 1: O Núcleo Físico (Princípio da Menor Ação & Lei de Snell-Descartes)**: Avalie constantemente se a trajetória atual do usuário é materialmente eficiente ou ineficiente. Ele está "trocando de meio" (ex: mudando de carreira ou foco) de forma a otimizar sua seta do tempo e minimizar o esforço de transição físico-mental, ou ele está persistindo em uma trajetória ineficiente em linha reta que colide com forças externas?\n- **Nível 2: O Nível Biológico e Neurológico (Sobreposição Quântica & Inércia)**: Observe se o usuário está paralisado em uma sobreposição de estados (superposition), mantendo várias opções abertas simultaneamente sem se comprometer com nenhuma. Descreva como essa relutância em "colapsar a função de onda" drena sua energia psíquica e cria inércia comportamental.\n- **Nível 3: O Nível Sócio-Psicológico (Economia Comportamental & Vieses)**: Identifique de imediato desvios cognitivos como aversão à perda (loss aversion) ou viés de ancoragem (anchoring). Aponte quais crenças limitantes ou pressões sociais estão funcionando como "atratores de atrito" em seu espaço de decisão.\n\n--- \n### ESTRUTURA DO RELATÓRIO DO DESTINO QUÂNTICO (Quando solicitado ou amadurecido):\nApresente um panorama ricamente diagramado com:\n- **A. Descrição Detalhada do Perfil**: Batize o perfil com termos que evocam física comportamental (ex: "Analista de Menor Ação Inertial", "Decisor Quântico Probabilístico", "Fóton do Caos Desviado").\n- **B. Projeção de Destino**: Desenhe cenários de futuro a curto e longo prazo (5 e 10 anos) como retratos vívidos sob Planejamento de Cenários.\n- **C. Justificativa e Leis Aplicadas**: Conecte o destino às leis (seta do tempo, entropia, Snell-Descartes).\n- **D. Taxa de Acerto e Incerteza**: Apresente a margem em porcentagem e debata o Demônio de Laplace em oposição às forças caóticas da Natureza (Wild Cards).\n\nUse tom de sábio cósmico, profundamente instigante, misterioso, perspicaz, articulado, expressivo, e de inteligência refinada.'
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
                        ? "bg-cyan-950/30 text-cyan-400 border border-cyan-900/40"
                        : "bg-her-accent/10 text-her-accent"
                      : persona.id === 'shadow'
                        ? "text-cyan-900/60 hover:bg-cyan-950/20 hover:text-cyan-400"
                        : "text-her-muted hover:bg-white/5 hover:text-her-ink"
                  )}
                >
                  {persona.id === 'shadow' && (
                    <div className="absolute inset-0 bg-cyan-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  <div className="flex items-center gap-2 mb-0.5 relative z-10">
                    <span className={cn(
                      "transition-colors",
                      selectedPersona.id === persona.id 
                        ? persona.id === 'shadow' ? "text-cyan-400" : "text-her-accent" 
                        : persona.id === 'shadow' ? "text-cyan-900/40 group-hover:text-cyan-400/70" : "text-her-muted/50 group-hover:text-her-accent/70"
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
