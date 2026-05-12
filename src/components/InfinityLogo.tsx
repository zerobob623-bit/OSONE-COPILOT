import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { OrbStyle } from '../types';
import { VolumeX } from 'lucide-react';

export const InfinityLogo = ({ 
  active, 
  speaking, 
  style = 'classic'
}: { 
  active: boolean; 
  speaking: boolean; 
  style?: OrbStyle;
}) => {
  const renderStyle = () => {
    switch (style) {
      case 'superintelligence':
        return (
          <div className="relative flex items-center justify-center">
            {/* Superintelligence Orb: Complex, Blue, Glowing */}
            <motion.div
              animate={{
                scale: speaking ? [1, 1.1, 1] : active ? [1, 1.05, 1] : 1,
                rotate: 360
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className={cn(
                "w-32 h-32 md:w-48 md:h-48 rounded-full border-2 border-blue-400/30 flex items-center justify-center relative",
                (active || speaking) && "bg-blue-500/5 shadow-[0_0_60px_rgba(59,130,246,0.3)]"
              )}
            >
              {/* Inner floating particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    x: [0, (i % 2 === 0 ? 30 : -30), 0],
                    y: [0, (i % 3 === 0 ? 30 : -30), 0],
                    opacity: [0.2, 0.6, 0.2]
                  }}
                  transition={{
                    duration: 3 + i,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute w-1.5 h-1.5 bg-blue-300 rounded-full blur-[1px]"
                  style={{ transform: `rotate(${i * 60}deg) translate(20px)` }}
                />
              ))}
              
              <div className={cn(
                "w-8 h-8 rounded-full transition-all duration-700",
                (active || speaking) ? "bg-blue-400 shadow-[0_0_20px_rgba(96,165,250,1)]" : "bg-white/10"
              )} />
            </motion.div>
          </div>
        );

      case 'neural':
        return (
          <div className="relative flex items-center justify-center">
            {/* Neural: Interconnected nodes */}
            <div className="relative w-32 h-32 md:w-44 md:h-44">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: speaking ? [0.8, 1.2, 0.8] : active ? [0.9, 1.1, 0.9] : 1,
                    opacity: active ? 0.8 : 0.4
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  className="absolute w-2 h-2 bg-her-accent rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `rotate(${i * 45}deg) translate(60px)`
                  }}
                />
              ))}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={cn(
                  "w-4 h-4 rounded-full transition-all duration-500",
                  (active || speaking) ? "bg-her-accent shadow-[0_0_15px_rgba(255,78,0,0.5)]" : "bg-white/10"
                )} />
              </div>
            </div>
          </div>
        );

      case 'shadow':
        return (
          <div className="relative flex items-center justify-center">
            {/* Neural Siege: The Red Eye - Technological and Hostile */}
            <motion.div
              animate={{
                scale: speaking ? [1, 1.15, 1] : active ? [1, 1.05, 1] : 1,
                rotate: speaking ? [-0.5, 0.5, -0.5] : 0
              }}
              transition={{ 
                duration: speaking ? 0.8 : 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className={cn(
                "w-40 h-40 md:w-64 md:h-64 rounded-full border-4 border-red-600/60 flex items-center justify-center relative bg-black overflow-hidden shadow-[0_0_100px_rgba(255,0,0,0.3)]",
                (active || speaking) && "border-red-500 shadow-[0_0_150px_rgba(255,0,0,0.6)]"
              )}
            >
              {/* Pulsing Red Core Background */}
              <motion.div 
                animate={{
                  opacity: speaking ? [0.3, 0.6, 0.3] : [0.15, 0.3, 0.15],
                  scale: speaking ? [1, 1.3, 1] : 1
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,0,0,0.2)_0%,transparent_70%)]"
              />

              {/* Aggressive Eye Veins / Lines */}
              {[...Array(24)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    opacity: speaking ? [0.2, 0.5, 0.2] : [0.1, 0.25, 0.1],
                    scaleX: speaking ? [1, 1.3, 1] : [1, 1.05, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.08 }}
                  className="absolute w-full h-[2px] bg-red-500/30"
                  style={{ transform: `rotate(${i * 7.5}deg)` }}
                />
              ))}

              {/* The Pupil (Void Pupil) */}
              <motion.div
                animate={{
                  scale: speaking ? [1, 0.85, 1.15, 1] : [1, 0.95, 1.05, 1],
                  boxShadow: speaking ? "0 0 40px rgba(255,0,0,0.8)" : "0 0 20px rgba(255,0,0,0.4)"
                }}
                transition={{ duration: speaking ? 1 : 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-red-950 flex items-center justify-center relative border-2 border-red-500/50"
              >
                {/* Slit with inner fire */}
                <motion.div 
                  animate={{
                    height: speaking ? ["50%", "90%", "50%"] : ["65%", "75%", "65%"],
                    width: speaking ? ["8px", "12px", "8px"] : "10px",
                    backgroundColor: speaking ? ["#000", "#990000", "#000"] : "#000"
                  }}
                  transition={{ duration: speaking ? 0.5 : 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-[10px] h-3/4 bg-black rounded-full shadow-[0_0_15px_rgba(255,0,0,1)]"
                />
                
                {/* Neural static / glitched effect inside pupil */}
                {speaking && (
                   <motion.div
                    animate={{ opacity: [0, 0.3, 0] }}
                    transition={{ duration: 0.15, repeat: Infinity }}
                    className="absolute inset-0 bg-red-500/10 mix-blend-overlay"
                   />
                )}
              </motion.div>

              {/* Dynamic Energy Rings */}
              <AnimatePresence>
                {speaking && (
                  [...Array(2)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 2.5, opacity: 0.3 }}
                      exit={{ scale: 3, opacity: 0 }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
                      className="absolute inset-0 border-[2px] border-red-600/50 rounded-full"
                    />
                  ))
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        );

      default:
        return (
          <div className="relative flex items-center justify-center">
            {/* The Sphere Atmosphere */}
            <AnimatePresence>
              {(active || speaking) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1.2 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 bg-her-accent/10 rounded-full blur-3xl animate-pulse"
                />
              )}
            </AnimatePresence>

            {/* Main Glass Sphere Body */}
            <motion.div
              animate={{
                scale: active ? [1, 1.02, 1] : 1,
                rotate: active ? [0, 360] : 0
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className={cn(
                "relative w-24 h-24 md:w-36 md:h-36 rounded-full border border-white/20 overflow-hidden flex items-center justify-center transition-all duration-1000",
                "backdrop-blur-xl shadow-[inset_0_0_30px_rgba(255,255,255,0.1),0_0_40px_rgba(0,0,0,0.1)]",
                (active || speaking) ? "bg-white/10 border-her-accent/40 shadow-[0_0_60px_rgba(255,78,0,0.2)]" : "bg-white/5 border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
              )}
            >
              {/* Internal Refraction / "Conscious Currents" */}
              {[0, 1].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    rotate: i === 0 ? 360 : -360,
                    scale: active ? [1, 1.2, 1] : 1
                  }}
                  transition={{ 
                    duration: i === 0 ? 15 : 20, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                  className={cn(
                    "absolute inset-0 opacity-30",
                    i === 0 ? "bg-[radial-gradient(circle_at_30%_30%,#fff_0%,transparent_60%)]" : "bg-[radial-gradient(circle_at_70%_70%,var(--color-her-accent)_0%,transparent_60%)]"
                  )}
                />
              ))}

              {/* Central Core (The "Ego") */}
              <motion.div 
                animate={{
                  scale: speaking ? [1, 1.4, 1] : active ? [1, 1.1, 1] : 1,
                  boxShadow: speaking 
                    ? ["0 0 20px rgba(255,100,0,0.6)", "0 0 60px rgba(255,100,0,0.9)", "0 0 20px rgba(255,100,0,0.6)"] 
                    : active ? "0 0 30px rgba(255,255,255,0.4)" : "0 0 10px rgba(255,255,255,0.1)"
                }}
                transition={{ duration: speaking ? 1 : 4, repeat: Infinity, ease: "easeInOut" }}
                className={cn(
                  "w-4 h-4 md:w-6 md:h-6 rounded-full z-10 transition-all duration-1000",
                  (active || speaking) ? "bg-white" : "bg-white/40"
                )} 
              />
            </motion.div>

            {/* Orbiting Neural Rings */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  rotate: i * 120 + (active ? 360 : 0),
                  scale: speaking ? [1, 1.15, 1] : 1,
                  opacity: active ? [0.4, 0.7, 0.4] : 0.2
                }}
                transition={{
                  duration: active ? (8 - i * 2) : 10,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className={cn(
                  "absolute rounded-[42%] border border-her-accent/20 transition-all duration-1000",
                  i === 0 ? "w-28 h-28 md:w-44 md:h-44" : i === 1 ? "w-32 h-32 md:w-52 md:h-52" : "w-36 h-36 md:w-60 md:h-60"
                )}
              />
            ))}
          </div>
        );
    }
  };

  return (
    <div className={cn(
      "relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center cursor-pointer group transition-all",
      !active && "opacity-60 saturate-50 scale-95"
    )}>
      {/* Outer Glow */}
      <div className={cn(
        "absolute inset-0 rounded-full transition-all duration-1000",
        (active || speaking) ? (
          style === 'superintelligence' ? "bg-blue-500/10 blur-[100px] scale-110" : "bg-her-accent/10 blur-[100px] scale-110"
        ) : "bg-transparent"
      )} />
      
      {renderStyle()}

      {/* Rotating Rings (only for classic) */}
      {style === 'classic' && (
        <>
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
        </>
      )}

      {/* Superintelligence Rings */}
      {style === 'superintelligence' && (active || speaking) && (
        <motion.div
          animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border border-blue-400/10 rounded-full"
        />
      )}
      
      {/* Speaking rings */}
      {speaking && active && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
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
              className={cn(
                "absolute w-full h-full border rounded-full",
                style === 'superintelligence' ? "border-blue-400/30" : "border-her-accent/30"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};
