import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Star, Crown, CheckCircle2, Circle, Trophy, Gift, Sparkles, Target } from 'lucide-react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Dumbbell01Icon, HealthIcon, BrainIcon } from '@hugeicons/core-free-icons';
import { haptic } from '../lib/telegram';
import { api } from '../lib/api';
import BottomNav from './BottomNav';
import MenuModal from './MenuModal';
import QuestConfirmModal from './QuestConfirmModal';
import LevelUpModal from './LevelUpModal';
import { Slider } from './ui/slider';

// Compact Stats Config - only icons
const STATS = [
  { key: 'strength', icon: Dumbbell01Icon, label: 'СИЛА', color: 'text-red-400' },
  { key: 'health', icon: HealthIcon, label: 'ЗДОРОВЬЕ', color: 'text-emerald-400' },
  { key: 'intellect', icon: BrainIcon, label: 'ИНТЕЛЛЕКТ', color: 'text-blue-400' },
];
const BRANCH_BADGES = {
  power: { label: 'СИЛА', className: 'border-[#FF6A2A]/60 text-[#FF6A2A]' },
  stability: { label: 'СТАБИЛЬНОСТЬ', className: 'border-[#33D6C7]/60 text-[#33D6C7]' },
  longevity: { label: 'ДОЛГОЛЕТИЕ', className: 'border-emerald-400/60 text-emerald-300' },
};

export default function HomeScreen({ user, progress, onRefresh, onProgressUpdate }) {
  const [quests, setQuests] = useState([]);
  const [showProModal, setShowProModal] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [showMenu, setShowMenu] = useState(false);
  const [confirmQuest, setConfirmQuest] = useState(null);
  const [levelUpData, setLevelUpData] = useState(null);
  const [processingQuestId, setProcessingQuestId] = useState(null);
  const [goals, setGoals] = useState([]);
  const [goalText, setGoalText] = useState('');
  const [goalLevel, setGoalLevel] = useState(10);
  const [savingGoal, setSavingGoal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [goalErrors, setGoalErrors] = useState('');
  const [dailyXp, setDailyXp] = useState(0);
  const [dailyQuestCount, setDailyQuestCount] = useState(0);
  const [bonusDailyXp, setBonusDailyXp] = useState(0);
  const [bonusData, setBonusData] = useState(null);
  const [toast, setToast] = useState(null);
  const [achievedGoals, setAchievedGoals] = useState([]);
  const [heroImageReady, setHeroImageReady] = useState(false);
  const safeProgress = progress || {
    current_level: 1,
    current_xp: 0,
    next_level_xp: 100,
    total_xp: 0,
  };

  useEffect(() => {
    if (user) {
      loadQuests();
      loadGoals();
      loadDailyXp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timeout = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timeout);
  }, [toast]);

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
  const getTotalXpToLevel = (level) => {
    let total = 0;
    for (let current = 1; current < level; current += 1) {
      total += getNextLevelXp(current);
    }
    return total;
  };
  const getCurrentTotalXp = () => {
    return getTotalXpToLevel(safeProgress.current_level || 1) + (safeProgress.current_xp || 0);
  };
  const getGoalMetrics = (goalLevelValue) => {
    const targetTotal = getTotalXpToLevel(goalLevelValue || 1);
    const currentTotal = getCurrentTotalXp();
    const remaining = Math.max(0, targetTotal - currentTotal);
    const percent = targetTotal > 0 ? Math.min(100, (currentTotal / targetTotal) * 100) : 100;
    const days = dailyXp > 0 ? Math.ceil(remaining / dailyXp) : null;
    return { percent, remaining, days };
  };

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

  const pushAchievedGoals = (incomingGoals) => {
    if (!incomingGoals || incomingGoals.length === 0) {
      return;
    }
    setAchievedGoals((current) => {
      const currentIds = new Set(current.map((goal) => goal.id));
      const merged = [...current];
      incomingGoals.forEach((goal) => {
        if (!currentIds.has(goal.id)) {
          merged.push(goal);
        }
      });
      return merged;
    });
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

      if (result.achieved_goals && result.achieved_goals.length > 0) {
        pushAchievedGoals(result.achieved_goals);
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
    const trimmedTitle = goalText.trim();
    if (trimmedTitle.length < 3) {
      setGoalErrors('Название цели должно быть не короче 3 символов');
      return;
    }
    if (goalLevel < 1 || goalLevel > 50) {
      setGoalErrors('Целевой уровень должен быть от 1 до 50');
      return;
    }
    setSavingGoal(true);
    try {
      if (editingGoalId) {
        await api.updateGoal(user.tg_id, editingGoalId, {
          goal_text: trimmedTitle,
          goal_level: goalLevel,
        });
      } else {
        await api.createGoal(user.tg_id, {
          goal_text: trimmedTitle,
          goal_level: goalLevel,
        });
      }
      setGoalText('');
      setGoalLevel(10);
      setEditingGoalId(null);
      setGoalErrors('');
      await loadGoals();
      haptic.success();
      setToast({ type: 'success', message: 'Цель сохранена' });
    } catch (error) {
      haptic.error();
      console.error('Error creating goal:', error);
      setToast({ type: 'error', message: 'Не удалось сохранить цель' });
    } finally {
      setSavingGoal(false);
    }
  };

  const handleEditGoal = (goal) => {
    setEditingGoalId(goal.id);
    setGoalText(goal.goal_text || '');
    setGoalLevel(goal.goal_level || 10);
    setGoalErrors('');
    setActiveTab('goals');
  };

  const handleCancelEdit = () => {
    setEditingGoalId(null);
    setGoalText('');
    setGoalLevel(10);
    setGoalErrors('');
  };

  const handleArchiveGoal = async (goalId) => {
    if (!user?.tg_id) {
      return;
    }
    try {
      await api.updateGoal(user.tg_id, goalId, {
        is_completed: true,
        completed_at: new Date().toISOString(),
      });
      await loadGoals();
      setToast({ type: 'success', message: 'Цель перенесена в архив' });
    } catch (error) {
      console.error('Error archiving goal:', error);
      setToast({ type: 'error', message: 'Не удалось архивировать цель' });
    }
  };

  const handleCompleteGoal = async (goalId) => {
    if (!user?.tg_id) {
      return;
    }
    try {
      await api.completeGoal(user.tg_id, goalId);
      await loadGoals();
      setToast({ type: 'success', message: 'Цель выполнена' });
    } catch (error) {
      console.error('Error completing goal:', error);
      setToast({ type: 'error', message: 'Не удалось отметить цель' });
    }
  };

  const handleDismissAchieved = () => {
    setAchievedGoals((current) => current.slice(1));
  };

  const handleConfirmAchieved = async (goalId) => {
    await handleCompleteGoal(goalId);
    setAchievedGoals((current) => current.filter((goal) => goal.id !== goalId));
  };

  const loadGoals = async () => {
    try {
      if (!user?.tg_id) {
        return;
      }
      const data = await api.getGoals(user.tg_id);
      setGoals(data);
      const currentLevel = safeProgress.current_level || 1;
      const pending = (data || []).filter(
        (goal) => !goal.is_completed && (goal.goal_level || 1) <= currentLevel
      );
      pushAchievedGoals(pending);
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const loadDailyXp = async () => {
    try {
      if (!user?.tg_id) {
        return;
      }
      const data = await api.getDailyXp(user.tg_id);
      setDailyXp(data?.daily_xp || 0);
      setDailyQuestCount(data?.daily_quest_count || 0);
      setBonusDailyXp(data?.bonus_xp || 0);
    } catch (error) {
      console.error('Error loading daily xp:', error);
    }
  };
  
  const handleMenuAction = (action) => {
    haptic.medium();
    setShowMenu(false);
    
    if (action === 'pro') {
      setShowProModal(true);
    }
  };

  const avatarUrl = typeof user?.avatar_url === 'string' ? user.avatar_url : '';
  const hasAvatar = avatarUrl && !avatarUrl.includes('placehold');
  const heroImage = hasAvatar
    ? avatarUrl
    : 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIEAiT5xqJUM44W0D26T0YBOsEINF2oJTOe3WbCXezg0dOzJslrk-xlUauPYKGt-1XBgndbWAPYrl2Yl5KO-4r5r9UX91qHLGm0QVLdkG91QmLOhXnq1rlfj2aP-k8_hJB2Y6ZurQiTFKOC3SSrOEeRV10eKD6Im3nlGD09nhXoXCeCkOUrh0BECbaY5cgLrsSc85v3i-K5sAP5dD_giFc-YK6pmjwi3lTG2rP72FHAYXfjUOgHDKJKWQDuSs95MKutvoO8ia4X8M';

  useEffect(() => {
    setHeroImageReady(false);
    const image = new Image();
    image.src = heroImage;
    image.onload = () => setHeroImageReady(true);
    image.onerror = () => setHeroImageReady(true);
    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [heroImage]);

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
  const dailyPercent = totalDaily > 0 ? (completedDaily / totalDaily) * 100 : 0;
  const heroName = user.first_name || user.username || 'Герой';
  const activeGoals = goals.filter((goal) => !goal.is_completed);
  const primaryGoal = activeGoals[0];
  const secondaryGoals = activeGoals.slice(1);
  const completedGoals = goals.filter((goal) => goal.is_completed);
  const canSaveGoal = !savingGoal && goalText.trim().length >= 3 && goalLevel >= 1 && goalLevel <= 50;
  const activeBranches = (user.active_branches && user.active_branches.length > 0)
    ? user.active_branches
    : ['power'];

  return (
    <div className="h-screen bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950 text-white flex flex-col">
      {/* Home Tab - Avatar as Background */}
      {activeTab === 'home' && (
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src={heroImage}
              alt="Hero Background"
              className="w-full h-full object-cover object-center"
              loading="eager"
              decoding="async"
              onLoad={() => setHeroImageReady(true)}
              style={{ opacity: heroImageReady ? 1 : 0, transition: 'opacity 200ms ease-out' }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/10 to-black/80 pointer-events-none" />
          </div>

          <main className="relative z-20 h-full flex flex-col justify-between px-4 pb-8 pt-6">
            <div className="flex flex-col gap-3">
              <div
                className="w-full rounded-3xl px-3 py-2 shadow-2xl relative overflow-hidden border border-white/10"
                style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(20px)' }}
              >
                <div className="flex items-center gap-4 relative z-10">
                  <div className="relative flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6A2A] to-orange-700 flex items-center justify-center border-[3px] border-orange-900/50 shadow-[0_0_12px_rgba(255,106,42,0.45)]">
                    <span className="text-white font-extrabold text-lg drop-shadow-md">
                      {safeProgress.current_level}
                    </span>
                    <div className="absolute top-1 left-2 w-3 h-1.5 bg-white/30 rounded-full blur-[2px]" />
                    {user.is_pro && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-orange-900/50 shadow-lg">
                        <Crown size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-end mb-1 px-1">
                      <span className="text-xs font-bold text-white tracking-wide drop-shadow-sm">{heroName}</span>
                      <span className="text-[10px] font-bold text-[#33D6C7] uppercase tracking-wider">
                        {safeProgress.current_xp} / {safeProgress.next_level_xp} XP
                      </span>
                    </div>
                    <div className="h-3 w-full bg-black/60 rounded-full overflow-hidden relative border border-white/5">
                      <motion.div
                        className="h-full rounded-full shadow-[0_0_10px_rgba(255,106,42,0.6)] relative overflow-hidden"
                        initial={{ width: 0 }}
                        animate={{ width: `${xpPercentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{ background: 'linear-gradient(to right, #FF6A2A, #FF8A3D)' }}
                      >
                        <div className="lq-shimmer-overlay" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-grow"></div>

            <div className="absolute left-4 top-[25%] flex flex-col gap-3">
              {STATS.map((stat) => (
                <div
                  key={stat.key}
                  className="flex items-center gap-2"
                >
                  <span className={`${stat.color}`} style={{ filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.85))' }}>
                    <HugeiconsIcon icon={stat.icon} size={24} color="currentColor" strokeWidth={1.7} />
                  </span>
                  <span className="text-base font-bold text-white drop-shadow-[0_6px_10px_rgba(0,0,0,0.85)]">
                    {user[stat.key] || 1}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-6 w-full max-w-md mx-auto mb-20 px-6">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  haptic.medium();
                  setActiveTab('quests');
                }}
                className="group relative overflow-hidden bg-slate-900/60 backdrop-blur-xl border border-[#33D6C7]/20 rounded-2xl px-3 py-2.5 shadow-xl transition-all duration-300"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#33D6C7]/10 flex items-center justify-center text-[#33D6C7] border border-[#33D6C7]/20 shadow-[0_0_8px_rgba(51,214,199,0.25)]">
                      <Star size={16} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-white font-bold text-sm leading-tight">Ежедневные квесты</h3>
                      <div className="flex flex-wrap items-center gap-1 mt-0.5">
                        {activeBranches.map((branch) => {
                          const meta = BRANCH_BADGES[branch] || { label: branch, className: 'border-white/30 text-white/70' };
                          return (
                            <span
                              key={`branch-${branch}`}
                              className={`text-[8px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full border ${meta.className}`}
                            >
                              {meta.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="bg-[#FF6A2A]/15 text-[#FF6A2A] text-[9px] font-bold px-2 py-0.5 rounded-full border border-[#FF6A2A]/20">
                      +{dailyXp || 0} XP
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#33D6C7] shrink-0">{completedDaily}/{totalDaily}</span>
                  <div className="h-2.5 flex-1 bg-black/50 rounded-full overflow-hidden relative border border-white/5">
                    <motion.div
                      className="h-full rounded-full relative overflow-hidden shadow-[0_0_12px_rgba(51,214,199,0.35)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${dailyPercent}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      style={{ background: '#33D6C7' }}
                    >
                      <div className="lq-shimmer-overlay" />
                    </motion.div>
                  </div>
                </div>
                <div className="absolute -z-10 top-0 right-0 w-40 h-40 bg-[#33D6C7]/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
              </motion.button>
            </div>
          </main>
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
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
              <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl" />
              <div className="relative space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">REWARD GOAL</div>
                  <div className="flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
                    <Zap size={12} />
                    <span>{dailyXp > 0 ? `${dailyXp} XP/day` : 'XP/day'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-indigo-500/30 flex items-center justify-center border border-white/10">
                    <Gift size={22} className="text-cyan-200" />
                  </div>
                  <div>
                    <div className="text-3xl font-black text-white">ЦЕЛЬ</div>
                    <div className="text-sm text-slate-400">Заслужи подарок уровнем</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {primaryGoal ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/40 p-6"
              >
                <div className="absolute -top-14 -right-8 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl" />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400/30 to-orange-500/30 flex items-center justify-center border border-amber-300/30">
                        <Crown size={22} className="text-amber-200" />
                      </div>
                      <div>
                        <div className="text-sm uppercase tracking-widest text-amber-300/70">Легендарная цель</div>
                        <div className="text-xl font-bold text-white">Подарок: {primaryGoal.goal_text}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleArchiveGoal(primaryGoal.id)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                    >
                      В архив
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-slate-300">
                    <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1">
                      <Target size={14} className="text-amber-300" />
                      <span>Целевой уровень: {primaryGoal.goal_level}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1">
                      <Sparkles size={14} className="text-cyan-300" />
                      <span>Ты на уровне {safeProgress.current_level}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1">
                      <span>Осталось {Math.max(0, (primaryGoal.goal_level || 1) - (safeProgress.current_level || 1))}</span>
                    </div>
                  </div>
                  <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 shadow-[0_0_16px_rgba(251,191,36,0.6)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${getGoalMetrics(primaryGoal.goal_level).percent}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                    >
                      <motion.div
                        className="h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: 'linear', repeatDelay: 0.8 }}
                      />
                    </motion.div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{Math.round(getGoalMetrics(primaryGoal.goal_level).percent)}% прогресса</span>
                    <span>
                      {getGoalMetrics(primaryGoal.goal_level).days === null
                        ? 'нужны данные'
                        : `≈ ${getGoalMetrics(primaryGoal.goal_level).days} дней`}
                    </span>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleEditGoal(primaryGoal)}
                    className="w-full btn-pushable"
                  >
                    <span className="btn-shadow"></span>
                    <span className="btn-edge"></span>
                    <span className="btn-front" style={{ background: 'linear-gradient(to right, #f59e0b, #f97316)' }}>
                      СМЕНИТЬ ПОДАРОК
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-6"
              >
                <div className="absolute -top-12 -left-12 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
                <div className="relative space-y-3 text-slate-300">
                  <div className="text-lg font-bold text-white">У тебя пока нет цели</div>
                  <div className="text-sm">
                    Давай выберем подарок, который ты заслужишь.
                  </div>
                </div>
              </motion.div>
            )}

            {secondaryGoals.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Другие цели</div>
                {secondaryGoals.map((goal, index) => {
                  const metrics = getGoalMetrics(goal.goal_level);
                  return (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="relative overflow-hidden rounded-3xl border border-cyan-500/10 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/60 p-5"
                    >
                      <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl" />
                      <div className="relative space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-white">{goal.goal_text || 'Новая цель'}</div>
                          <div className="text-sm text-cyan-300 font-semibold">Уровень {goal.goal_level}</div>
                        </div>
                        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${metrics.percent}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>{Math.round(metrics.percent)}% прогресса</span>
                          <span>
                            {metrics.days === null ? 'нужны данные' : `≈ ${metrics.days} дней`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => handleEditGoal(goal)}
                            className="text-xs text-cyan-300"
                          >
                            Сменить подарок
                          </button>
                          <button
                            onClick={() => handleArchiveGoal(goal.id)}
                            className="text-xs text-slate-400"
                          >
                            В архив
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {completedGoals.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Выполнено</div>
                <div className="flex flex-wrap gap-2">
                  {completedGoals.map((goal) => (
                    <div key={goal.id} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                      {goal.goal_text || 'Цель'}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="glass rounded-3xl p-6 border border-white/10 space-y-5">
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold">{editingGoalId ? 'Изменить цель' : 'Новая цель'}</div>
                {editingGoalId && (
                  <button onClick={handleCancelEdit} className="text-xs text-slate-400">
                    Отмена
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Подарок, который ты заслужишь</label>
                <input
                  value={goalText}
                  onChange={(event) => {
                    setGoalText(event.target.value);
                    if (goalErrors) {
                      setGoalErrors('');
                    }
                  }}
                  placeholder="Например: Купить iPhone"
                  className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
                />
                {goalErrors && (
                  <div className="text-xs text-red-300">{goalErrors}</div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Достигнешь на уровне</span>
                  <span className="text-cyan-300 font-semibold">{goalLevel}</span>
                </div>
                <Slider
                  value={[goalLevel]}
                  min={1}
                  max={50}
                  step={1}
                  onValueChange={(value) => {
                    setGoalLevel(value[0]);
                    if (goalErrors) {
                      setGoalErrors('');
                    }
                  }}
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveGoal}
                disabled={!canSaveGoal}
                className="w-full btn-pushable"
              >
                <span className="btn-shadow"></span>
                <span className="btn-edge"></span>
                <span
                  className="btn-front"
                  style={{ background: canSaveGoal ? 'linear-gradient(to right, #22d3ee, #6366f1)' : 'linear-gradient(to right, #475569, #334155)' }}
                >
                  {savingGoal ? 'Сохраняю...' : 'СОХРАНИТЬ ЦЕЛЬ'}
                </span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 overflow-y-auto pb-24 overflow-x-hidden"
        >
          <div className="p-6 space-y-6">
            <h2 className="text-3xl font-bold text-gaming mb-6">ПРОФИЛЬ</h2>
            
            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="text-center mb-6">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#4ECDC4] p-1 mx-auto mb-4">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                    {hasAvatar ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover object-top" loading="lazy" decoding="async" />
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
                    <span className={`${stat.color}`}>
                      <HugeiconsIcon icon={stat.icon} size={20} color="currentColor" strokeWidth={1.7} />
                    </span>
                    <div>
                      <div className={`font-bold ${stat.color}`}>{user[stat.key] || 1}</div>
                      <div className="text-xs text-slate-500">{stat.label}</div>
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

      {achievedGoals.length > 0 && (
        <GoalAchievedModal
          goal={achievedGoals[0]}
          onConfirm={() => handleConfirmAchieved(achievedGoals[0].id)}
          onClose={handleDismissAchieved}
        />
      )}

      {toast && (
        <ToastMessage type={toast.type} message={toast.message} />
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

function GoalAchievedModal({ goal, onConfirm, onClose }) {
  if (!goal) {
    return null;
  }
  return (
    <AnimatePresence>
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
          transition={{ type: 'spring', damping: 18, stiffness: 260 }}
          className="relative w-full max-w-sm rounded-3xl border border-amber-400/30 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 p-8 text-center shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-400/30 via-pink-400/20 to-indigo-500/30 blur-2xl" />
          <div className="relative space-y-4">
            <div className="text-5xl">🎁</div>
            <div className="text-sm uppercase tracking-widest text-amber-300/70">Ты заслужил подарок</div>
            <div className="text-2xl font-bold text-white">{goal.goal_text || 'Цель'}</div>
            <div className="text-sm text-slate-300">
              Ты смог(ла) благодаря труду, стабильности и упорству.
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onConfirm}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 font-bold text-white shadow-lg"
            >
              Я сделал(а) это!
            </motion.button>
            <button onClick={onClose} className="text-sm text-slate-400">
              Позже
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ToastMessage({ type, message }) {
  const background = type === 'success' ? 'from-emerald-500/30 via-emerald-500/10 to-transparent' : 'from-red-500/30 via-red-500/10 to-transparent';
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-28 left-1/2 z-50 w-[90%] max-w-sm -translate-x-1/2"
      >
        <div className={`rounded-2xl border border-white/10 bg-gradient-to-r ${background} bg-slate-900/90 px-4 py-3 text-center text-sm text-white shadow-xl`}>
          {message}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
