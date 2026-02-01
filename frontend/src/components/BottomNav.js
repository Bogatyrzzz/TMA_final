import React from 'react';
import { motion } from 'framer-motion';
import { Home, Trophy, User, Menu as MenuIcon } from 'lucide-react';
import { haptic } from '../lib/telegram';

const NAV_ITEMS = [
  { id: 'home', icon: Home, label: 'Главная', color: '#FF6B35' },
  { id: 'quests', icon: Trophy, label: 'Квесты', color: '#4ECDC4' },
  { id: 'profile', icon: User, label: 'Профиль', color: '#8B5CF6' },
  { id: 'menu', icon: MenuIcon, label: 'Меню', color: '#F59E0B' },
];

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-4 left-4 right-4 z-50"
    >
      <div className="glass rounded-3xl p-2 shadow-2xl border border-white/20">
        <div className="flex justify-around items-center">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => {
                  haptic.light();
                  onTabChange(item.id);
                }}
                className="relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all no-select"
                whileTap={{ scale: 0.9 }}
                data-testid={`nav-${item.id}`}
              >
                <motion.div
                  animate={{
                    y: isActive ? -4 : 0,
                    scale: isActive ? 1.2 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <Icon
                    size={24}
                    color={isActive ? item.color : '#94a3b8'}
                    strokeWidth={isActive ? 3 : 2}
                  />
                </motion.div>
                
                {isActive && (
                  <motion.div
                    layoutId=\"activeTab\"
                    className=\"absolute inset-0 rounded-2xl\"
                    style={{
                      background: `radial-gradient(circle, ${item.color}20 0%, transparent 70%)`,
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                
                <motion.span
                  className=\"text-[10px] mt-1 font-medium\"
                  animate={{
                    opacity: isActive ? 1 : 0.6,
                    color: isActive ? item.color : '#94a3b8',
                  }}
                >
                  {item.label}
                </motion.span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
