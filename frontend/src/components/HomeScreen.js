import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronRight, Star, Crown, CheckCircle2, Circle, Trophy } from 'lucide-react';
import { haptic } from '../lib/telegram';
import { api } from '../lib/api';
import BottomNav from './BottomNav';
import MenuModal from './MenuModal';
import QuestConfirmModal from './QuestConfirmModal';
import LevelUpModal from './LevelUpModal';
import { Slider } from './ui/slider';

// Compact Stats Config - only icons
const STATS = [
  { key: 'strength', icon: '💪', color: 'text-red-400' },
  { key: 'health', icon: '❤️', color: 'text-pink-400' },
  { key: 'intellect', icon: '🧠', color: 'text-blue-400' },
  { key: 'agility', icon: '⚡', color: 'text-yellow-400' },
  { key: 'confidence', icon: '🔥', color: 'text-orange-400' },
  { key: 'stability', icon: '🧘', color: 'text-cyan-400' },
];

export default function HomeScreen({ user, progress, onRefresh, onProgressUpdate }) {
  const [quests, setQuests] = useState([]);
  const [showProModal, setShowProModal] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [showMenu, setShowMenu] = useState(false);
  const [confirmQuest, setConfirmQuest] = useState(null);
  const [levelUpData, setLevelUpData] = useState(null);
  const [processingQuestId, setProcessingQuestId] = useState(null);
  const [goalText, setGoalText] = useState('');
  const [goalLevel, setGoalLevel] = useState(10);
  const [savingGoal, setSavingGoal] = useState(false);
  const [bonusData, setBonusData] = useState(null);
  const safeProgress = progress || {
    current_level: 1,
    current_xp: 0,
    next_level_xp: 100,
    total_xp: 0,
  };

  useEffect(() => {
    if (user) {
      loadQuests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    setGoalText(progress?.goal_text || '');
    setGoalLevel(progress?.goal_level || 10);
  }, [progress]);

  const loadQuests = async () => {
    try {
      if (!user?.tg_id) {
        return;
      }
      const data = await api.getQuests(user.tg_id);
      setQuests(data);
    } catch (error) {
      console.error('Error loading quests:', error);
    }
  };

  const getNextLevelXp = (level) => Math.floor(100 * Math.pow(1.05, level - 1));

  const applyXpGain = (currentProgress, xpGain) => {
    const baseProgress = currentProgress || {
      current_level: 1,
      current_xp: 0,
      next_level_xp: 100,
      total_xp: 0,
      goal_text: null,
      goal_level: 10,
      goal_progress: 0,
    };

    let newLevel = baseProgress.current_level || 1;
    let nextLevelXp = baseProgress.next_level_xp || getNextLevelXp(newLevel);
    let currentXp = (baseProgress.current_xp || 0) + xpGain;

    while (currentXp >= nextLevelXp) {
      currentXp -= nextLevelXp;
      newLevel += 1;
      nextLevelXp = getNextLevelXp(newLevel);
    }

    return {
      ...baseProgress,
      current_level: newLevel,
      current_xp: currentXp,
      next_level_xp: nextLevelXp,
      total_xp: (baseProgress.total_xp || 0) + xpGain,
    };
  };

  const handleCompleteQuest = async (questId) => {
    if (processingQuestId) {
      return;
    }

    const targetQuest = quests.find((quest) => quest.id === questId);
    if (!targetQuest || targetQuest.is_completed) {
      return;
    }

    setProcessingQuestId(questId);
    const previousQuests = quests;
    const previousProgress = safeProgress;

    setQuests(
      quests.map((q) => (q.id === questId ? { ...q, is_completed: true } : q))
    );

    const optimisticProgress = applyXpGain(safeProgress, targetQuest.xp_reward || 0);
    if (onProgressUpdate) {
      onProgressUpdate(optimisticProgress);
    }

    try {
      const result = await api.completeQuest(user.tg_id, questId);

      if (result.leveled_up) {
        haptic.success();
        setLevelUpData(result.new_level);
      }

      if (result.bonus_awarded) {
        if (onProgressUpdate) {
          onProgressUpdate((current) => applyXpGain(current, result.bonus_xp || 0));
        }
        setBonusData({ xp: result.bonus_xp || 0 });
        if (result.bonus_leveled_up && !result.leveled_up) {
          haptic.success();
          setLevelUpData(result.bonus_new_level);
        }
      }

      onRefresh();
      setConfirmQuest(null);
    } catch (error) {
      setQuests(previousQuests);
      if (onProgressUpdate) {
        onProgressUpdate(previousProgress);
      }
      haptic.error();
      console.error('Error completing quest:', error);
    } finally {
      setProcessingQuestId(null);
    }
  };

  const handleSaveGoal = async () => {
    if (!user?.tg_id) {
      return;
    }
    setSavingGoal(true);
    try {
      const result = await api.updateGoal(user.tg_id, {
        goal_text: goalText,
        goal_level: goalLevel,
      });
      if (result?.progress && onProgressUpdate) {
        onProgressUpdate(result.progress);
      } else {
        onRefresh();
      }
      haptic.success();
    } catch (error) {
      haptic.error();
      console.error('Error updating goal:', error);
    } finally {
      setSavingGoal(false);
    }
  };
  
  const handleMenuAction = (action) => {
    haptic.medium();
    setShowMenu(false);
    
    if (action === 'pro') {
      setShowProModal(true);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-3xl font-bold">Загрузка данных...</div>
        </div>
      </div>
    );
  }

  const xpPercentage = safeProgress.next_level_xp > 0
    ? (safeProgress.current_xp / safeProgress.next_level_xp) * 100
    : 0;
  const completedDaily = quests.filter(q => q.is_daily && q.is_completed).length;
  const totalDaily = quests.filter(q => q.is_daily).length;

  return (
    <div className="h-screen bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950 text-white flex flex-col">
      {/* Home Tab - Avatar as Background */}
      {activeTab === 'home' && (
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Avatar Background - Full Screen */}
          {user.avatar_url && !user.avatar_url.includes('placehold') ? (
            <div className="absolute inset-0">
              <img
                src={user.avatar_url}
                alt="Hero Background"
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center center' }}
                loading="lazy"
                decoding="async"
              />
              {/* Gradient overlays for UI readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/60 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-transparent to-transparent pointer-events-none" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-indigo-950/30 to-slate-950 flex items-center justify-center">
              <span className="text-9xl opacity-30">🦸</span>
            </div>
          )}

          {/* UI Content - Overlaid on background */}
          <div className="relative z-10 flex-1 flex flex-col">
            {/* RPG HUD - Level Circle + XP Bar (Seamless Organic Shape) */}
            <div className="flex items-center w-full px-4 pt-4 absolute top-0 left-0 z-50">
              {/* Level Circle - Left Anchor (ON TOP) */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center relative z-20 shadow-[0_0_15px_rgba(139,92,246,0.6)] bg-gradient-to-br from-[#6366f1] to-[#a855f7] border-4 border-[#0F0F23]"
              >
                <span className="text-white font-black text-xl leading-none">
                  {safeProgress.current_level}
                </span>
                
                {/* PRO Crown Badge */}
                {user.is_pro && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-[#0F0F23] shadow-lg">
                    <Crown size={12} className="text-white" />
                  </div>
                )}
              </motion.div>

              {/* XP Bar Container - Right Extension (UNDER the circle) */}
              <div className="flex-1 h-10 -ml-6 pl-8 pr-4 bg-slate-900/90 backdrop-blur-md rounded-r-2xl border border-white/10 flex flex-col justify-center relative z-10">
                {/* Text Labels */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">XP</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {safeProgress.current_xp}/{safeProgress.next_level_xp}
                  </span>
                </div>
                
                {/* XP Fill Track */}
                <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden mt-1">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(34,211,238,0.5)] rounded-full relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                  >
                    {/* Shimmer effect */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                    />
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Spacer for the fixed HUD */}
            <div className="h-20" />

            {/* Stats - positioned on sides */}
            <div className="flex-1 relative">
              {/* Left side stats */}
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 space-y-2">
                {STATS.slice(0, 3).map((stat, idx) => (
                  <motion.div
                    key={stat.key}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center space-x-1 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1.5 border border-white/20"
                  >
                    <div className="text-base">{stat.icon}</div>
                    <div className={`text-sm font-bold ${stat.color} drop-shadow-lg`}>{user[stat.key] || 1}</div>
                  </motion.div>
                ))}
              </div>

              {/* Right side stats */}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 space-y-2">
                {STATS.slice(3, 6).map((stat, idx) => (
                  <motion.div
                    key={stat.key}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center space-x-1 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1.5 border border-white/20"
                  >
                    <div className={`text-sm font-bold ${stat.color} drop-shadow-lg`}>{user[stat.key] || 1}</div>
                    <div className="text-base">{stat.icon}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Daily Quests Progress Button - Always visible at bottom */}
            <div className="px-4 pb-24 pt-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  haptic.medium();
                  setActiveTab('quests');
                }}
                className="w-full bg-black/40 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Star size={20} className="text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-base drop-shadow-lg">Ежедневные квесты</div>
                      <div className="text-xs text-white/70">
                        {completedDaily} / {totalDaily} выполнено
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-white/70" />
                </div>
                
                {/* Progress bar */}
                <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
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
        </div>
      )}

      {/* Quests Tab */}
      {activeTab === 'quests' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 overflow-y-auto pb-24"
        >
          <div className="p-6 space-y-4">
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
                  disabled={processingQuestId === quest.id || quest.is_completed}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'goals' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 overflow-y-auto pb-24"
        >
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-gaming">ЦЕЛИ</h2>
              <div className="glass rounded-full px-4 py-2">
                <span className="text-sm text-slate-400">
                  {safeProgress.goal_progress || 0}%
                </span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl p-6 border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-slate-900/60 to-indigo-900/40">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-400/20 rounded-full blur-3xl" />
              <div className="relative space-y-4">
                <div className="text-sm uppercase tracking-widest text-cyan-300/70">Текущая цель</div>
                <div className="text-2xl font-bold text-white">
                  {safeProgress.goal_text || 'Добавь цель, чтобы начать путь'}
                </div>
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Целевой уровень</span>
                  <span className="text-cyan-300 font-semibold">{safeProgress.goal_level || 10}</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${safeProgress.goal_progress || 0}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>

            <div className="glass rounded-3xl p-6 border border-white/10 space-y-5">
              <div className="text-xl font-bold">Новая цель</div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Что ты хочешь достичь</label>
                <input
                  value={goalText}
                  onChange={(event) => setGoalText(event.target.value)}
                  placeholder="Например: Пробежать марафон"
                  className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Достичь на уровне</span>
                  <span className="text-cyan-300 font-semibold">{goalLevel}</span>
                </div>
                <Slider
                  value={[goalLevel]}
                  min={5}
                  max={50}
                  step={5}
                  onValueChange={(value) => setGoalLevel(value[0])}
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveGoal}
                disabled={savingGoal}
                className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all ${
                  savingGoal
                    ? 'bg-slate-700/60'
                    : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500'
                }`}
              >
                {savingGoal ? 'Сохраняю...' : 'СОХРАНИТЬ ЦЕЛЬ'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 overflow-y-auto pb-24"
        >
          <div className="p-6 space-y-6">
            <h2 className="text-3xl font-bold text-gaming mb-6">ПРОФИЛЬ</h2>
            
            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="text-center mb-6">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#4ECDC4] p-1 mx-auto mb-4">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                    {user.avatar_url && !user.avatar_url.includes('placehold') ? (
                      <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover object-top" loading="lazy" decoding="async" />
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
                  <span className="font-bold text-[#FF6B35]">{safeProgress.current_level}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                  <span className="text-slate-400">Всего XP</span>
                  <span className="font-bold text-[#4ECDC4]">{safeProgress.total_xp}</span>
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

            {/* Stats Grid */}
            <div className="glass rounded-3xl p-6 border border-white/10">
              <h3 className="text-xl font-bold mb-4">Характеристики</h3>
              <div className="grid grid-cols-2 gap-3">
                {STATS.map((stat) => (
                  <div key={stat.key} className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                    <span className="text-2xl">{stat.icon}</span>
                    <div>
                      <div className={`font-bold ${stat.color}`}>{user[stat.key] || 1}</div>
                      <div className="text-xs text-slate-500 capitalize">{stat.key}</div>
                    </div>
                  </div>
                ))}
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
          </div>
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

      {/* Level Up Modal */}
      {levelUpData && (
        <LevelUpModal
          level={levelUpData}
          onClose={() => setLevelUpData(null)}
        />
      )}

      {bonusData && (
        <BonusRewardModal
          bonus={bonusData}
          onClose={() => setBonusData(null)}
        />
      )}
    </div>
  );
}

// Quest Card Component - Detached style
function QuestCard({ quest, index, onComplete, disabled }) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
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
      if (!user?.tg_id) {
        return;
      }
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

function BonusRewardModal({ bonus, onClose }) {
  return (
    <AnimatePresence>
      {bonus && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.85, y: 30 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative w-full max-w-sm rounded-3xl border border-cyan-400/30 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 p-8 text-center shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-400/30 via-blue-400/20 to-indigo-500/30 blur-2xl" />
            <div className="relative space-y-4">
              <div className="text-5xl">🏅</div>
              <div className="text-sm uppercase tracking-widest text-cyan-300/70">Ежедневный бонус</div>
              <div className="text-2xl font-bold text-white">Все квесты выполнены</div>
              <div className="text-4xl font-black text-cyan-300">+{bonus.xp} XP</div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  haptic.success();
                  onClose();
                }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 font-bold text-white shadow-lg"
              >
                КРУТО! ⚡
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
