import React from 'react';
import { motion } from 'framer-motion';
import { Home, Target, User, Sparkles, Flag } from 'lucide-react';
import { haptic } from '../lib/telegram';

export default function BottomNav({ activeTab, onTabChange }) {
  const navItems = [
    { id: 'quests', icon: Target, size: 24 },
    { id: 'goals', icon: Flag, size: 24 },
    { id: 'home', icon: Home, size: 32, isCenter: true },
    { id: 'profile', icon: User, size: 24 },
    { id: 'sage', icon: Sparkles, size: 24, disabled: true },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 pb-safe z-50">
      <div className="relative px-6 pb-6">
        {/* Blur background */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent backdrop-blur-xl" />
        
        {/* Navigation container */}
        <div className="relative flex items-center justify-center gap-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isCenter = item.isCenter;
            
            if (isCenter) {
              return (
                <motion.button
                  key={item.id}
                  onClick={() => {
                    haptic.medium();
                    onTabChange(item.id);
                  }}
                  className="relative"
                  whileTap={{ scale: 0.9 }}
                  data-testid="nav-home"
                >
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-orange-500 to-pink-500 rounded-full blur-xl opacity-50" />
                  
                  {/* Button */}
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 p-[3px] shadow-2xl">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-600 to-pink-600 flex items-center justify-center">
                      <Icon size={item.size} className="text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-lg"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            }
            
            return (
              <motion.button
                key={item.id}
                onClick={() => {
                  if (item.disabled) return;
                  haptic.light();
                  onTabChange(item.id);
                }}
                className="relative"
                whileTap={!item.disabled ? { scale: 0.9 } : {}}
                data-testid={`nav-${item.id}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                  item.disabled 
                    ? 'bg-slate-800/50 opacity-40' 
                    : isActive
                    ? 'bg-gradient-to-br from-slate-700 to-slate-800 shadow-lg'
                    : 'bg-slate-800/80 hover:bg-slate-700/80'
                }`}>
                  <Icon 
                    size={item.size} 
                    className={item.disabled ? 'text-slate-600' : isActive ? 'text-cyan-400' : 'text-slate-400'} 
                    strokeWidth={2}
                  />
                </div>
                
                {isActive && !item.disabled && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-full shadow-lg"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
