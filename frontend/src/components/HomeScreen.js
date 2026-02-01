import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronRight, Star, Crown, CheckCircle2, Circle, Trophy } from 'lucide-react';
import { haptic } from '../lib/telegram';
import { api } from '../lib/api';
import BottomNav from './BottomNav';
import MenuModal from './MenuModal';
import QuestConfirmModal from './QuestConfirmModal';
import LevelUpModal from './LevelUpModal';

// Compact Stats Config - only icons
const STATS = [
  { key: 'strength', icon: '💪', color: 'text-red-400' },
  { key: 'health', icon: '❤️', color: 'text-pink-400' },
  { key: 'intellect', icon: '🧠', color: 'text-blue-400' },
  { key: 'agility', icon: '⚡', color: 'text-yellow-400' },
  { key: 'confidence', icon: '🔥', color: 'text-orange-400' },
  { key: 'stability', icon: '🧘', color: 'text-cyan-400' },
];

export default function HomeScreen({ user, progress, onRefresh }) {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [showMenu, setShowMenu] = useState(false);
  const [confirmQuest, setConfirmQuest] = useState(null);
  const [levelUpData, setLevelUpData] = useState(null);

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
    setLoading(true);

    try {
      const result = await api.completeQuest(user.tg_id, questId);

      setQuests(
        quests.map((q) => (q.id === questId ? { ...q, is_completed: true } : q))
      );

      if (result.leveled_up) {
        haptic.success();
        setLevelUpData(result.new_level);
      }

      onRefresh();
      setConfirmQuest(null);
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
  const completedDaily = quests.filter(q => q.is_daily && q.is_completed).length;
  const totalDaily = quests.filter(q => q.is_daily).length;

  return (
    <div className="h-screen bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950 text-white overflow-hidden flex flex-col">
      {/* Home Tab - Hero with Avatar */}
      {activeTab === 'home' && (
        <div className="flex-1 flex flex-col">
          {/* XP Bar at top */}
          <div className="p-4 pb-2">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm text-slate-400">Уровень {progress.current_level}</div>
              <div className="text-sm font-bold text-cyan-400">
                {progress.current_xp} / {progress.next_level_xp} XP
              </div>
            </div>
            <div className="h-2.5 bg-slate-800/50 rounded-full overflow-hidden border border-slate-700">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full relative"
                initial={{ width: 0 }}
                animate={{ width: `${xpPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </motion.div>
            </div>
          </div>

          {/* Avatar Section - Compact */}
          <div className="flex-1 flex items-center justify-center px-4 relative min-h-0">
            {/* Stats positioned around avatar */}
            <div className="absolute inset-0 px-2">
              {/* Left side stats */}
              <div className="absolute left-1 top-1/2 transform -translate-y-1/2 space-y-2">
                {STATS.slice(0, 3).map((stat, idx) => (
                  <motion.div
                    key={stat.key}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center space-x-1 bg-slate-800/80 backdrop-blur-sm rounded-full px-2 py-1 border border-slate-700/50"
                  >
                    <div className="text-base">{stat.icon}</div>
                    <div className={`text-sm font-bold ${stat.color}`}>{user[stat.key] || 1}</div>
                  </motion.div>
                ))}
              </div>

              {/* Right side stats */}
              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 space-y-2">
                {STATS.slice(3, 6).map((stat, idx) => (
                  <motion.div
                    key={stat.key}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center space-x-1 bg-slate-800/80 backdrop-blur-sm rounded-full px-2 py-1 border border-slate-700/50"
                  >
                    <div className={`text-sm font-bold ${stat.color}`}>{user[stat.key] || 1}</div>
                    <div className="text-base">{stat.icon}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Avatar container - smaller */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="relative z-10"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 via-purple-500/20 to-transparent rounded-full blur-2xl" />
              
              {/* Avatar image - compact size */}
              <div className="relative w-44 h-64 rounded-2xl overflow-hidden bg-gradient-to-b from-slate-800/50 to-slate-900/50 border border-slate-700/50">
                {user.avatar_url && !user.avatar_url.includes('placehold') ? (
                  <img
                    src={user.avatar_url}
                    alt="Hero"
                    className="w-full h-full object-cover object-top"
                    style={{ 
                      objectPosition: 'center 15%',
                      transform: 'scale(1.1)'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-center text-6xl"
                  style={{ display: user.avatar_url && !user.avatar_url.includes('placehold') ? 'none' : 'flex' }}
                >
                  🦸
                </div>
              </div>

              {/* Level badge */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full px-4 py-1.5 border-3 border-slate-900 shadow-xl">
                <div className="text-lg font-bold">LVL {progress.current_level}</div>
              </div>

              {/* PRO badge if active */}
              {user.is_pro && (
                <div className="absolute -top-3 -right-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-2 border-3 border-slate-900 shadow-xl">
                  <Crown size={18} className="text-white" />
                </div>
              )}
            </motion.div>
          </div>

          {/* Daily Quests Progress Button - Always visible */}
          <div className="px-4 pb-24 pt-2">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                haptic.medium();
                setActiveTab('quests');
              }}
              className="w-full bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-3 border border-slate-600 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Star size={20} className="text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-base">Ежедневные квесты</div>
                    <div className="text-xs text-slate-400">
                      {completedDaily} / {totalDaily} выполнено
                    </div>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-400" />
              </div>
              
              {/* Progress bar */}
              <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: totalDaily > 0 ? `${(completedDaily / totalDaily) * 100}%` : '0%' }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.button>
          </div>
        </div>
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
                onComplete={() => {
                  if (!quest.is_completed) {
                    haptic.light();
                    setConfirmQuest(quest);
                  }
                }}
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

      {/* Quest Confirm Modal */}
      {confirmQuest && (
        <QuestConfirmModal
          quest={confirmQuest}
          onConfirm={() => handleCompleteQuest(confirmQuest.id)}
          onCancel={() => setConfirmQuest(null)}
        />
      )}
    </div>
  );
}

// Quest Card Component - Detached style
function QuestCard({ quest, index, onComplete, disabled }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={!disabled ? onComplete : undefined}
      disabled={disabled}
      className={`w-full text-left rounded-2xl p-5 border transition-all ${
        quest.is_completed
          ? 'bg-green-500/10 border-green-500/50'
          : 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 hover:bg-slate-700/50'
      }`}
      data-testid={`quest-${quest.id}`}
    >
      <div className="flex items-start space-x-4">
        <div className="text-3xl">{quest.title.split(' ')[0]}</div>
        
        <div className="flex-1">
          <h4 className={`font-bold text-lg mb-1 ${
            quest.is_completed ? 'line-through text-slate-500' : 'text-white'
          }`}>
            {quest.title}
          </h4>
          {quest.description && (
            <p className="text-sm text-slate-400 mb-3">{quest.description}</p>
          )}
          
          <div className="flex items-center gap-2">
            <div className="bg-cyan-500/20 rounded-full px-3 py-1 flex items-center space-x-1 border border-cyan-500/30">
              <Zap size={14} className="text-cyan-400" />
              <span className="text-xs font-bold text-cyan-400">+{quest.xp_reward}</span>
            </div>
            {quest.branch !== 'global' && (
              <div className="bg-slate-700/50 rounded-full px-3 py-1 border border-slate-600">
                <span className="text-xs text-slate-400 uppercase font-medium">{quest.branch}</span>
              </div>
            )}
          </div>
        </div>

        {quest.is_completed && (
          <div className="text-2xl">✅</div>
        )}
      </div>
    </motion.button>
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
