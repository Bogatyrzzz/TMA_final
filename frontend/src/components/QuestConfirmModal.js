import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Zap } from 'lucide-react';
import { haptic } from '../lib/telegram';

export default function QuestConfirmModal({ quest, onConfirm, onCancel }) {
  if (!quest) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
        onClick={onCancel}
        data-testid="quest-confirm-overlay"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-700 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            {/* Quest Icon */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center border border-cyan-500/30"
            >
              <span className="text-4xl">{quest.title?.split(' ')[0] || '⚔️'}</span>
            </motion.div>
            
            {/* Title */}
            <h3 className="text-xl font-bold mb-2 text-white">{quest.title}</h3>
            <p className="text-slate-400 text-sm mb-6">
              Подтверди выполнение квеста
            </p>
            
            {/* XP Reward */}
            <div className="bg-slate-700/50 rounded-2xl p-4 mb-6 border border-slate-600/50">
              <div className="flex items-center justify-center space-x-2">
                <Zap size={24} className="text-cyan-400" />
                <div className="text-cyan-400 text-3xl font-bold">+{quest.xp_reward || 0}</div>
                <div className="text-slate-400 text-lg">XP</div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onCancel}
                className="flex-1 py-4 rounded-xl bg-slate-700/50 border border-slate-600 font-medium text-slate-300 hover:bg-slate-700 transition-all"
                data-testid="quest-confirm-cancel"
              >
                Отмена
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  haptic.success();
                  onConfirm();
                }}
                className="flex-1 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 font-bold text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all flex items-center justify-center space-x-2"
                data-testid="quest-confirm-submit"
              >
                <CheckCircle size={20} />
                <span>Выполнил!</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
