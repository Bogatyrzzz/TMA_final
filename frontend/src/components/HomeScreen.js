import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronRight, Star, Crown } from 'lucide-react';
import { haptic, showConfirm } from '../lib/telegram';
import { api } from '../lib/api';
import BottomNav from './BottomNav';
import MenuModal from './MenuModal';
import QuestConfirmModal from './QuestConfirmModal';

// Stats icons config
const STATS_CONFIG = {
  strength: { icon: '💪', label: 'Сила', color: 'from-red-500 to-red-600', bgColor: 'bg-red-500/20' },
  health: { icon: '❤️', label: 'Здоровье', color: 'from-pink-500 to-pink-600', bgColor: 'bg-pink-500/20' },
  intellect: { icon: '🧠', label: 'Интеллект', color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-500/20' },
  agility: { icon: '⚡', label: 'Ловкость', color: 'from-yellow-500 to-yellow-600', bgColor: 'bg-yellow-500/20' },
  confidence: { icon: '🔥', label: 'Уверенность', color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-500/20' },
  stability: { icon: '🧘', label: 'Стабильность', color: 'from-cyan-500 to-cyan-600', bgColor: 'bg-cyan-500/20' },
};

export default function HomeScreen({ user, progress, onRefresh }) {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    loadQuests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadQuests = async () => {
    try {
      const data = await api.getQuests(user.tg_id);
      setQuests(data);
    } catch (error) {
      console.error('Error loading quests:', error);
    }
  };

  const handleCompleteQuest = async (questId) => {
    haptic.light();
    setLoading(true);

    try {
      const result = await api.completeQuest(user.tg_id, questId);

      setQuests(
        quests.map((q) => (q.id === questId ? { ...q, is_completed: true } : q))
      );

      if (result.leveled_up) {
        haptic.success();
        showConfirm(
          `🎉 Поздравляем! Ты достиг уровня ${result.new_level}!`,
          () => {}
        );
      } else {
        haptic.success();
      }

      onRefresh();
    } catch (error) {
      haptic.error();
      console.error('Error completing quest:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMenuAction = (action) => {
    haptic.medium();
    setShowMenu(false);
    
    if (action === 'pro') {
      setShowProModal(true);
    }
  };

  const xpPercentage = (progress.current_xp / progress.next_level_xp) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pb-28">
      {/* Hero Section */}
      {activeTab === 'home' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 space-y-6"
        >
          {/* Level Badge */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gaming text-neon">
                {user.first_name}
              </h1>
              <p className="text-slate-400 text-sm">Герой LifeQuest</p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative"
            >
              <div className="glass rounded-2xl px-6 py-3 border-2 border-[#FF6B35]">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gaming text-[#FF6B35]">
                    {progress.current_level}
                  </div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Level</div>
                </div>
              </div>
              {!user.is_pro && (
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles size={20} className="text-yellow-400" />
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Avatar Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass rounded-3xl p-8 border border-white/10 relative overflow-hidden"
            data-testid="avatar-section"
          >
            {/* Radial glow background */}
            <div className="absolute inset-0 radial-glow" style={{ background: 'radial-gradient(circle at center, rgba(79, 209, 197, 0.15) 0%, transparent 70%)' }} />
            
            <div className="relative flex flex-col items-center">
              {/* Avatar with breathing animation */}
              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="relative mb-6"
              >
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#4ECDC4] p-1">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt="Hero Avatar"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log('Avatar failed to load:', user.avatar_url);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <div className="text-6xl" style={{ display: user.avatar_url ? 'none' : 'block' }}>🦸</div>
                  </div>
                </div>
                
                {/* Level badge on avatar */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 glass rounded-full px-4 py-1 border border-[#4ECDC4]"
                >
                  <span className="text-sm font-bold text-[#4ECDC4]">LVL {progress.current_level}</span>
                </motion.div>
              </motion.div>

              {/* XP Progress */}
              <div className="w-full space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Zap size={16} className="text-[#4ECDC4]" />
                    <span className="text-sm font-medium text-slate-300">XP</span>
                  </div>
                  <span className="text-sm font-bold text-[#4ECDC4]">
                    {progress.current_xp} / {progress.next_level_xp}
                  </span>
                </div>
                
                {/* Thick gradient progress bar */}
                <div className="progress-bar-thick">
                  <motion.div
                    className="progress-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(STATS_CONFIG).map(([key, config], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`glass rounded-2xl p-4 border border-white/10 ${config.bgColor}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{config.icon}</div>
                    <div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider">
                        {config.label}
                      </div>
                      <div className="text-2xl font-bold text-gaming">
                        {user[key]}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Goal Card */}
          {progress.goal_text && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-3xl p-6 border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10"
              data-testid="goal-section"
            >
              <div className="flex items-start space-x-3 mb-4">
                <Target className="text-purple-400 mt-1" size={24} />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gaming mb-1">ТВОЯ ЦЕЛЬ</h3>
                  <p className="text-slate-300">{progress.goal_text}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Прогресс</span>
                  <span className="font-bold text-purple-400">{progress.goal_progress}%</span>
                </div>
                <div className="progress-bar-thick bg-purple-900/30">
                  <motion.div
                    className="progress-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.goal_progress}%` }}
                    style={{ background: 'linear-gradient(to right, #a855f7, #ec4899)' }}
                  />
                </div>
                <p className="text-xs text-slate-400">Достичь на уровне: {progress.goal_level}</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Quests Tab */}
      {activeTab === 'quests' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-6 space-y-4"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gaming">КВЕСТЫ</h2>
            <div className="glass rounded-full px-4 py-2">
              <span className="text-sm text-slate-400">
                {quests.filter(q => q.is_completed).length} / {quests.length}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {quests.map((quest, index) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                index={index}
                onComplete={() => handleCompleteQuest(quest.id)}
                disabled={loading || quest.is_completed}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-6 space-y-6"
        >
          <h2 className="text-3xl font-bold text-gaming mb-6">ПРОФИЛЬ</h2>
          
          <div className="glass rounded-3xl p-6 border border-white/10">
            <div className="text-center mb-6">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#4ECDC4] p-1 mx-auto mb-4">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl">🦸</span>
                  )}
                </div>
              </div>
              <h3 className="text-2xl font-bold">{user.first_name}</h3>
              <p className="text-slate-400">@{user.username || 'hero'}</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                <span className="text-slate-400">Уровень</span>
                <span className="font-bold text-[#FF6B35]">{progress.current_level}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                <span className="text-slate-400">Всего XP</span>
                <span className="font-bold text-[#4ECDC4]">{progress.total_xp}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                <span className="text-slate-400">Ветка</span>
                <span className="font-bold">{user.active_branches?.[0] || 'power'}</span>
              </div>
              {user.is_pro && (
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/30">
                  <span className="text-yellow-400">Статус</span>
                  <span className="font-bold text-yellow-400">⭐ PRO</span>
                </div>
              )}
            </div>
          </div>

          {!user.is_pro && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowProModal(true)}
              className="w-full btn-pushable"
            >
              <span className="btn-shadow"></span>
              <span className="btn-edge"></span>
              <span className="btn-front" style={{ background: 'linear-gradient(to right, #eab308, #f97316)' }}>
                🌟 ПОЛУЧИТЬ PRO
              </span>
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Bottom Navigation */}
      <BottomNav 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          if (tab === 'menu') {
            setShowMenu(true);
          } else {
            setActiveTab(tab);
          }
        }} 
      />

      {/* Menu Modal */}
      <MenuModal
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        onItemClick={handleMenuAction}
      />

      {/* PRO Modal */}
      {showProModal && <ProModal onClose={() => setShowProModal(false)} user={user} onRefresh={onRefresh} />}
    </div>
  );
}

// Quest Card Component - Detached style
function QuestCard({ quest, index, onComplete, disabled }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`glass rounded-2xl p-5 border ${
        quest.is_completed
          ? 'border-green-500/50 bg-green-500/10'
          : 'border-white/10'
      } transition-all quest-card-enter`}
      data-testid={`quest-${quest.id}`}
    >
      <div className="flex items-start space-x-4">
        <motion.button
          onClick={onComplete}
          disabled={disabled}
          whileTap={{ scale: 0.9 }}
          className={`mt-1 w-8 h-8 rounded-full border-2 flex items-center justify-center ${
            quest.is_completed
              ? 'bg-green-500 border-green-500'
              : 'border-slate-600 hover:border-[#4ECDC4]'
          } transition-all`}
          data-testid={`quest-checkbox-${quest.id}`}
        >
          {quest.is_completed ? (
            <CheckCircle2 size={20} className="text-white" />
          ) : (
            <Circle size={20} className="text-slate-600" />
          )}
        </motion.button>

        <div className="flex-1">
          <h4 className={`font-bold text-lg mb-1 ${
            quest.is_completed ? 'line-through text-slate-500' : ''
          }`}>
            {quest.title}
          </h4>
          {quest.description && (
            <p className="text-sm text-slate-400 mb-3">{quest.description}</p>
          )}
          
          <div className="flex items-center gap-2">
            <div className="glass rounded-full px-3 py-1 flex items-center space-x-1">
              <Zap size={14} className="text-[#4ECDC4]" />
              <span className="text-xs font-bold text-[#4ECDC4]">+{quest.xp_reward}</span>
            </div>
            {quest.branch !== 'global' && (
              <div className="glass rounded-full px-3 py-1">
                <span className="text-xs text-slate-400 uppercase">{quest.branch}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// PRO Modal
function ProModal({ onClose, user, onRefresh }) {
  const handleActivate = async () => {
    try {
      await api.activatePro(user.tg_id);
      haptic.success();
      onRefresh();
      onClose();
    } catch (error) {
      haptic.error();
      console.error('Error activating PRO:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="glass rounded-3xl p-8 max-w-md w-full border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-orange-500/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-7xl mb-4"
          >
            🌟
          </motion.div>
          <h2 className="text-3xl font-bold text-gaming mb-2">PRO ПОДПИСКА</h2>
          <p className="text-slate-400 mb-6">Раскрой весь потенциал героя</p>
          
          <div className="text-left space-y-4 mb-8">
            {[
              { icon: Star, text: 'Все 3 ветки развития' },
              { icon: Zap, text: '+50% XP к каждому квесту' },
              { icon: Trophy, text: 'Эксклюзивные квесты' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start space-x-3 glass rounded-xl p-3"
              >
                <item.icon className="text-yellow-400 mt-1" size={20} />
                <span className="text-slate-200">{item.text}</span>
              </motion.div>
            ))}
          </div>

          <div className="space-y-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleActivate}
              className="w-full btn-pushable"
              data-testid="activate-pro-button"
            >
              <span className="btn-shadow"></span>
              <span className="btn-edge"></span>
              <span className="btn-front" style={{ background: 'linear-gradient(to right, #eab308, #f97316)' }}>
                АКТИВИРОВАТЬ PRO
              </span>
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-full py-4 rounded-xl glass border border-white/20 font-bold"
              data-testid="close-pro-modal"
            >
              ПОЗЖЕ
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
