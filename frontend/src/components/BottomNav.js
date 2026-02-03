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
    <div className="fixed bottom-0 left-0 right-0 z-50 lq-safe-bottom">
      <div className="relative px-6 pb-6">
        {/* Blur background */}
        <div className="absolute inset-0 lq-nav-blur" />
        
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
                  <div className="absolute inset-0 lq-nav-center rounded-full blur-xl opacity-50" />
                  
                  {/* Button */}
                  <div className="relative w-20 h-20 rounded-full lq-nav-center p-[3px]">
                    <div className="w-full h-full rounded-full lq-nav-center-inner flex items-center justify-center">
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
                    ? 'lq-nav-item-disabled' 
                    : isActive
                    ? 'lq-nav-item-active'
                    : 'lq-nav-item'
                }`}>
                  <Icon 
                    size={item.size} 
                    className={item.disabled ? 'lq-text-soft' : isActive ? 'lq-nav-icon-active' : 'lq-nav-icon'} 
                    strokeWidth={2}
                  />
                </div>
                
                {isActive && !item.disabled && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 lq-nav-dot rounded-full shadow-lg"
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
