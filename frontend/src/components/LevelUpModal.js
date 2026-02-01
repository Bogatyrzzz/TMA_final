import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { haptic } from '../lib/telegram';

export default function LevelUpModal({ level, onClose }) {
  if (!level) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6"
        onClick={onClose}
        data-testid="levelup-modal-overlay"
      >
        {/* Particles background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full"
              initial={{ 
                x: '50vw', 
                y: '50vh',
                scale: 0,
                opacity: 1 
              }}
              animate={{ 
                x: `${Math.random() * 100}vw`,
                y: `${Math.random() * 100}vh`,
                scale: [0, 1, 0],
                opacity: [1, 1, 0]
              }}
              transition={{ 
                duration: 2,
                delay: i * 0.05,
                ease: "easeOut"
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0.5, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.5, y: 50 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 rounded-3xl p-8 max-w-sm w-full border border-yellow-500/30 shadow-2xl shadow-yellow-500/20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 rounded-3xl blur-xl opacity-30" />
          
          <div className="relative text-center">
            {/* 3D Trophy Icon */}
            <motion.div 
              className="relative w-32 h-32 mx-auto mb-6"
              animate={{ 
                rotateY: [0, 10, -10, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Glow behind icon */}
              <div className="absolute inset-0 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full blur-2xl opacity-50" />
              
              {/* Icon container */}
              <div className="relative w-full h-full bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-lg border-4 border-yellow-300/50">
                <span className="text-6xl">🏆</span>
              </div>
              
              {/* Sparkles */}
              <motion.div 
                className="absolute -top-2 -right-2"
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles size={24} className="text-yellow-300" />
              </motion.div>
              <motion.div 
                className="absolute -bottom-2 -left-2"
                animate={{ rotate: -360, scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              >
                <Sparkles size={20} className="text-orange-300" />
              </motion.div>
            </motion.div>
            
            {/* Title */}
            <motion.h2 
              className="text-3xl font-black mb-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              НОВЫЙ УРОВЕНЬ!
            </motion.h2>
            
            {/* Level number */}
            <div className="relative inline-block mb-6">
              <motion.div
                className="text-8xl font-black bg-gradient-to-b from-yellow-300 via-orange-400 to-pink-500 bg-clip-text text-transparent"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.3 }}
              >
                {level}
              </motion.div>
              <div className="text-slate-400 text-lg font-medium -mt-2">УРОВЕНЬ</div>
            </div>
            
            {/* Motivational text */}
            <p className="text-slate-300 mb-8">
              Отличная работа! Продолжай в том же духе! 💪
            </p>
            
            {/* Close button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                haptic.success();
                onClose();
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 font-bold text-white text-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"
              data-testid="levelup-close-button"
            >
              КРУТО! 🎉
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
