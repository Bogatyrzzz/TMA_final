import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, HelpCircle, LogOut, Crown } from 'lucide-react';
import { haptic } from '../lib/telegram';

const MENU_ITEMS = [
  { id: 'pro', icon: Crown, label: 'PRO подписка', color: 'text-yellow-400' },
  { id: 'settings', icon: Settings, label: 'Настройки', color: 'text-gray-300' },
  { id: 'help', icon: HelpCircle, label: 'Помощь', color: 'text-blue-400' },
  { id: 'logout', icon: LogOut, label: 'Выйти', color: 'text-red-400' },
];

export default function MenuModal({ isOpen, onClose, onItemClick }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className=\"fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end\"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className=\"w-full glass rounded-t-3xl p-6 pb-8\"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className=\"flex justify-between items-center mb-6\">
              <h2 className=\"text-2xl font-bold text-gaming\">МЕНЮ</h2>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className=\"p-2 rounded-xl bg-white/10\"
              >
                <X size={24} />
              </motion.button>
            </div>

            {/* Menu Items */}
            <div className=\"space-y-3\">
              {MENU_ITEMS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      haptic.medium();
                      onItemClick(item.id);
                    }}
                    className=\"w-full flex items-center space-x-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/10\"
                  >
                    <div className={`${item.color}`}>
                      <Icon size={24} />
                    </div>
                    <span className=\"text-lg font-medium\">{item.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
