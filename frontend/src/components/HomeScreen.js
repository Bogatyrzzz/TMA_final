import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { haptic, showConfirm } from '../lib/telegram';
import { api } from '../lib/api';

// Stats icons
const STATS_CONFIG = {
  strength: { icon: '💪', label: 'Сила', color: 'text-red-500' },
  health: { icon: '❤️', label: 'Здоровье', color: 'text-pink-500' },
  intellect: { icon: '🧠', label: 'Интеллект', color: 'text-blue-500' },
  agility: { icon: '⚡', label: 'Ловкость', color: 'text-yellow-500' },
  confidence: { icon: '🔥', label: 'Уверенность', color: 'text-orange-500' },
  stability: { icon: '🧘', label: 'Стабильность', color: 'text-cyan-500' },
};

export default function HomeScreen({ user, progress, onRefresh }) {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProModal, setShowProModal] = useState(false);

  useEffect(() => {
    loadQuests();
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

      // Update quest as completed
      setQuests(
        quests.map((q) => (q.id === questId ? { ...q, is_completed: true } : q))
      );

      // Show feedback
      if (result.leveled_up) {
        haptic.success();
        showConfirm(
          `🎉 Поздравляем! Ты достиг уровня ${result.new_level}!`,
          () => {}
        );
      } else {
        haptic.success();
      }

      // Refresh data
      onRefresh();
    } catch (error) {
      haptic.error();
      console.error('Error completing quest:', error);
    } finally {
      setLoading(false);
    }
  };

  const xpPercentage = (progress.current_xp / progress.next_level_xp) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F0F23] to-[#1a1a2e] text-white pb-20">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-[#FF6B35] to-[#4ECDC4]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{user.first_name}</h1>
            <p className="text-sm opacity-90">
              Уровень {progress.current_level}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{progress.current_level}</div>
            <div className="text-xs opacity-90">LVL</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Avatar Section */}
        <Card className="bg-gray-900 border-gray-800 p-6" data-testid="avatar-section">
          <div className="flex flex-col items-center">
            <div className="w-48 h-48 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#4ECDC4] p-1 mb-4">
              <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-6xl">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Hero Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  '🦸'
                )}
              </div>
            </div>
            
            {/* XP Bar */}
            <div className="w-full" data-testid="xp-progress">
              <div className="flex justify-between text-sm mb-2">
                <span>XP</span>
                <span>
                  {progress.current_xp} / {progress.next_level_xp}
                </span>
              </div>
              <Progress value={xpPercentage} className="h-3" />
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <Card className="bg-gray-900 border-gray-800 p-6" data-testid="stats-section">
          <h3 className="text-xl font-bold mb-4">Характеристики</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(STATS_CONFIG).map(([key, config]) => (
              <div key={key} className="flex items-center space-x-3">
                <div className="text-2xl">{config.icon}</div>
                <div className="flex-1">
                  <div className="text-sm text-gray-400">{config.label}</div>
                  <div className={`text-xl font-bold ${config.color}`}>
                    {user[key]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Goal Section */}
        {progress.goal_text && (
          <Card className="bg-gradient-to-r from-purple-900 to-pink-900 border-purple-700 p-6" data-testid="goal-section">
            <h3 className="text-xl font-bold mb-2">🎯 Твоя цель</h3>
            <p className="text-lg mb-3">{progress.goal_text}</p>
            <div className="flex justify-between text-sm mb-2">
              <span>Прогресс</span>
              <span>{progress.goal_progress}%</span>
            </div>
            <Progress value={progress.goal_progress} className="h-2" />
            <p className="text-sm text-gray-300 mt-2">
              Достичь на уровне: {progress.goal_level}
            </p>
          </Card>
        )}

        {/* Quests Section */}
        <Card className="bg-gray-900 border-gray-800 p-6" data-testid="quests-section">
          <h3 className="text-xl font-bold mb-4">Квесты</h3>

          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800">
              <TabsTrigger value="daily" data-testid="tab-daily">
                Ежедневные
              </TabsTrigger>
              <TabsTrigger value="all" data-testid="tab-all">
                Все квесты
              </TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-3 mt-4">
              {quests
                .filter((q) => q.is_daily)
                .map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    onComplete={() => handleCompleteQuest(quest.id)}
                    disabled={loading || quest.is_completed}
                  />
                ))}
            </TabsContent>

            <TabsContent value="all" className="space-y-3 mt-4">
              {quests.map((quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  onComplete={() => handleCompleteQuest(quest.id)}
                  disabled={loading || quest.is_completed}
                />
              ))}
            </TabsContent>
          </Tabs>
        </Card>

        {/* PRO Button */}
        {!user.is_pro && (
          <Button
            onClick={() => {
              haptic.medium();
              setShowProModal(true);
            }}
            className="w-full py-6 text-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            data-testid="pro-button"
          >
            🌟 Получить PRO
          </Button>
        )}

        {user.is_pro && (
          <Badge className="w-full justify-center py-3 text-lg bg-gradient-to-r from-yellow-500 to-orange-500">
            🌟 PRO активен
          </Badge>
        )}
      </div>

      {/* PRO Modal */}
      {showProModal && (
        <ProModal
          onClose={() => setShowProModal(false)}
          onActivate={async () => {
            try {
              await api.activatePro(user.tg_id);
              haptic.success();
              onRefresh();
              setShowProModal(false);
            } catch (error) {
              haptic.error();
              console.error('Error activating PRO:', error);
            }
          }}
        />
      )}
    </div>
  );
}

// Quest Card Component
function QuestCard({ quest, onComplete, disabled }) {
  return (
    <Card
      className={`p-4 ${
        quest.is_completed
          ? 'bg-green-900 bg-opacity-20 border-green-700'
          : 'bg-gray-800 border-gray-700'
      }`}
      data-testid={`quest-${quest.id}`}
    >
      <div className="flex items-start space-x-4">
        <Checkbox
          checked={quest.is_completed}
          onCheckedChange={onComplete}
          disabled={disabled}
          className="mt-1"
          data-testid={`quest-checkbox-${quest.id}`}
        />
        <div className="flex-1">
          <h4 className="font-bold text-lg mb-1">{quest.title}</h4>
          {quest.description && (
            <p className="text-sm text-gray-400 mb-2">{quest.description}</p>
          )}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              +{quest.xp_reward} XP
            </Badge>
            {quest.branch !== 'global' && (
              <Badge variant="secondary" className="text-xs">
                {quest.branch}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// PRO Modal Component
function ProModal({ onClose, onActivate }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-2xl p-8 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="text-6xl mb-4">🌟</div>
          <h2 className="text-3xl font-bold mb-4">PRO подписка</h2>
          
          <div className="text-left space-y-3 mb-6">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">✓</div>
              <div>
                <h4 className="font-bold">Все ветки развития</h4>
                <p className="text-sm opacity-90">Активируй все 3 ветки одновременно</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="text-2xl">✓</div>
              <div>
                <h4 className="font-bold">Больше XP</h4>
                <p className="text-sm opacity-90">Прокачивайся быстрее</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="text-2xl">✓</div>
              <div>
                <h4 className="font-bold">Эксклюзивные квесты</h4>
                <p className="text-sm opacity-90">Доступ к уникальным заданиям</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={onActivate}
              className="w-full py-6 text-lg bg-white text-orange-600 hover:bg-gray-100"
              data-testid="activate-pro-button"
            >
              Активировать PRO
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full py-6 text-lg border-white text-white hover:bg-white hover:text-orange-600"
              data-testid="close-pro-modal"
            >
              Позже
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
