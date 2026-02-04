import React from 'react';
import { motion } from 'framer-motion';
import { Home, Target, User, Flag } from 'lucide-react';
const wizardMenu = `${process.env.PUBLIC_URL}/wizard_menu.png`;
import { haptic } from '../lib/telegram';

export default function BottomNav({ activeTab, onTabChange }) {
  const navItems = [
    { id: 'quests', icon: Target, size: 24, label: 'Квесты' },
    { id: 'goals', icon: Flag, size: 24, label: 'Цели' },
    { id: 'home', icon: Home, size: 32, label: '', isCenter: true },
    { id: 'profile', icon: User, size: 24, label: 'Профиль' },
    { id: 'sage', size: 24, label: 'Маг', disabled: true },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="relative h-24 border-t border-white/10 flex justify-between items-center px-8 pb-4 shadow-2xl overflow-visible bg-transparent isolate">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.06), rgba(0,0,0,0.96))',
            zIndex: 0,
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.0) 35%, rgba(0,0,0,0.45) 75%, rgba(0,0,0,0.85) 100%)',
            backdropFilter: 'blur(10px)',
            zIndex: 1,
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(255,106,42,0.12) 0%, rgba(255,106,42,0.05) 70%, rgba(255,106,42,0.0) 98%)',
            filter: 'blur(18px)',
            zIndex: 2,
          }}
        />
        <div className="relative z-10 grid w-full grid-cols-5 items-end justify-items-center gap-6">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const isPrimary = item.id === 'quests' || item.id === 'goals';
            if (item.id === 'home') {
              return (
                <div key={item.id} className="relative -top-5">
                  <motion.button
                    initial={false}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.03 }}
                    animate={activeTab === 'home' ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                    transition={{ duration: 1.6, ease: 'easeInOut', repeat: activeTab === 'home' ? Infinity : 0 }}
                    onClick={() => {
                      haptic.medium();
                      onTabChange('home');
                    }}
                    className="w-[72px] h-[72px] bg-gradient-to-b from-[#FF6A2A] to-orange-700 rounded-full flex items-center justify-center shadow-[0_10px_26px_rgba(255,106,42,0.55)] lq-nav-clip transform transition-transform active:scale-95"
                    data-testid="nav-home"
                  >
                    <Home size={28} className="text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]" strokeWidth={2.5} />
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      animate={activeTab === 'home' ? { boxShadow: ['0 0 26px rgba(255,106,42,0.35)', '0 0 40px rgba(255,106,42,0.55)', '0 0 26px rgba(255,106,42,0.35)'] } : { boxShadow: '0 0 26px rgba(255,106,42,0.3)' }}
                      transition={{ duration: 1.8, ease: 'easeInOut', repeat: activeTab === 'home' ? Infinity : 0 }}
                    />
                    <motion.div
                      className="absolute -inset-3 rounded-full border border-[#FF6A2A]/45 blur-lg opacity-70"
                      animate={activeTab === 'home' ? { opacity: [0.45, 0.8, 0.45] } : { opacity: 0.6 }}
                      transition={{ duration: 1.8, ease: 'easeInOut', repeat: activeTab === 'home' ? Infinity : 0 }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      animate={{ opacity: [0.2, 0.4, 0.2] }}
                      transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity }}
                      style={{ background: 'radial-gradient(circle at 50% 35%, rgba(255,255,255,0.35), rgba(255,255,255,0))' }}
                    />
                    <div className="absolute top-2 w-10 h-5 bg-white/15 rounded-full blur-md" />
                  </motion.button>
                </div>
              );
            }
            if (item.id === 'sage') {
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    haptic.light();
                  }}
                  className="relative w-10 h-14 flex flex-col items-center justify-end"
                  data-testid="nav-sage"
                >
                  <img
                    src={wizardMenu}
                    alt="Мудрец"
                    className="absolute left-1/2 -translate-x-1/2 object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.75)]"
                    style={{ width: 82, height: 82, bottom: 5, maxWidth: 'none' }}
                  />
                  <span className="text-[9px] font-bold uppercase tracking-tight opacity-0 h-[12px] leading-none">
                    Маг
                  </span>
                </button>
              );
            }
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                onClick={() => {
                  if (item.disabled) return;
                  haptic.light();
                  onTabChange(item.id);
                }}
                className="flex flex-col items-center justify-center gap-1 w-10 relative z-10"
                whileTap={!item.disabled ? { scale: 0.9 } : {}}
                data-testid={`nav-${item.id}`}
              >
                <Icon
                  size={item.size}
                  className={item.disabled ? 'text-slate-600' : isActive ? (isPrimary ? 'text-[#FF6A2A]' : 'text-[#33D6C7]') : 'text-white/70'}
                  strokeWidth={2}
                />
                <span className={`text-[9px] font-bold uppercase tracking-tight ${isActive ? 'text-white' : 'text-white/50'}`}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
