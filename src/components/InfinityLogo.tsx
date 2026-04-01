import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export const InfinityLogo = ({ active, speaking }: { active: boolean; speaking: boolean }) => {
  return (
    <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
      {/* Outer Glow */}
      <div className={cn(
        "absolute inset-0 rounded-full transition-all duration-1000",
        active || speaking ? "bg-her-accent/10 blur-[100px] scale-110" : "bg-transparent"
      )} />
      
      <div className="relative flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: speaking ? [1, 1.15, 1] : active ? [1, 1.05, 1] : 1,
              opacity: speaking ? [0.4, 0.8, 0.4] : active ? [0.3, 0.6, 0.3] : 0.2,
              x: i === 0 ? -20 : i === 2 ? 20 : 0,
              y: speaking ? [0, -5, 0] : 0
            }}
            transition={{
              duration: speaking ? 2 : 4,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
            className={cn(
              "absolute w-16 h-16 md:w-24 md:h-24 rounded-full border border-white/[0.1] flex items-center justify-center mix-blend-screen",
              (active || speaking) && "bg-her-accent/5 shadow-[0_0_40px_rgba(255,78,0,0.1)]"
            )}
          >
            <div className={cn(
              "w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-700",
              (active || speaking) ? "bg-her-accent scale-110 shadow-[0_0_10px_rgba(242,125,38,0.8)]" : "bg-white/20 scale-100"
            )} />
          </motion.div>
        ))}
      </div>

      {/* Rotating Rings */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 border border-white/[0.03] rounded-full"
      />
      <motion.div 
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute inset-6 border border-white/[0.02] rounded-full border-dashed"
      />
      
      {/* Speaking rings */}
      {speaking && (
        <div className="absolute inset-0 flex items-center justify-center">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 0.3, 0], scale: [0.8, 1.5, 2] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeOut"
              }}
              className="absolute w-full h-full border border-her-accent/30 rounded-full"
            />
          ))}
        </div>
      )}
    </div>
  );
};
