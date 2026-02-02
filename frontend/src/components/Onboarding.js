import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { haptic } from '../lib/telegram';
import { Flame, Brain, Heart } from 'lucide-react';

const BRANCHES = [
  {
    id: 'power',
    icon: Flame,
    title: '💪 СИЛА',
    subtitle: 'Power',
    description: 'Физическая мощь и уверенность',
    stats: '+2 Сила, +1 Уверенность',
    gradient: 'from-red-500 via-orange-500 to-yellow-500',
    glow: 'rgba(239, 68, 68, 0.3)',
  },
  {
    id: 'stability',
    icon: Brain,
    title: '🧘 СТАБИЛЬНОСТЬ',
    subtitle: 'Stability',
    description: 'Баланс и интеллектуальный рост',
    stats: '+2 Стабильность, +1 Интеллект',
    gradient: 'from-blue-500 via-cyan-500 to-teal-500',
    glow: 'rgba(59, 130, 246, 0.3)',
  },
  {
    id: 'longevity',
    icon: Heart,
    title: '🌱 ДОЛГОЛЕТИЕ',
    subtitle: 'Longevity',
    description: 'Здоровье и гибкость',
    stats: '+2 Здоровье, +1 Ловкость',
    gradient: 'from-green-500 via-emerald-500 to-teal-500',
    glow: 'rgba(34, 197, 94, 0.3)',
  },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    age: 25,
    gender: 'male',
    branch: 'power',
    goal_text: '',
    goal_level: 10,
    selfie_url: null,
  });

  const handleNext = () => {
    haptic.light();
    setStep(step + 1);
  };

  const handleBack = () => {
    haptic.light();
    setStep(step - 1);
  };

  const handleComplete = () => {
    haptic.success();
    onComplete(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      {/* Progress Bar - Thick & Juicy */}
      <div className="w-full mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">Шаг {step} из 3</span>
          <span className="font-bold text-[#4ECDC4]">{Math.round((step / 3) * 100)}%</span>
        </div>
        <div className="progress-bar-thick">
          <motion.div
            className="progress-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ background: 'linear-gradient(to right, #FF6B35, #4ECDC4)' }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="text-6xl mb-4"
              >
                🦸
              </motion.div>
              <h2 className="text-4xl font-bold text-gaming mb-3">РАССКАЖИ О СЕБЕ</h2>
              <p className="text-slate-400 text-lg">Создадим твоего уникального героя</p>
            </div>

            <div className="space-y-6">
              {/* Age Slider */}
              <div className="glass rounded-2xl p-6 border border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-lg font-medium text-slate-300">Возраст</label>
                  <motion.div
                    key={formData.age}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-3xl font-bold text-gaming text-[#FF6B35]"
                  >
                    {formData.age}
                  </motion.div>
                </div>
                <Slider
                  value={[formData.age]}
                  onValueChange={(value) => {
                    haptic.selection();
                    setFormData({ ...formData, age: value[0] });
                  }}
                  min={18}
                  max={80}
                  step={1}
                  className="mt-2"
                />
              </div>

              {/* Gender Selection */}
              <div className="glass rounded-2xl p-6 border border-white/10">
                <label className="text-lg font-medium text-slate-300 block mb-4">Пол</label>
                <RadioGroup
                  value={formData.gender}
                  onValueChange={(value) => {
                    haptic.selection();
                    setFormData({ ...formData, gender: value });
                  }}
                  className="grid grid-cols-2 gap-4"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative ${
                      formData.gender === 'male'
                        ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-500'
                        : 'bg-white/5 border border-white/10'
                    } rounded-xl p-4 cursor-pointer transition-all`}
                  >
                    <RadioGroupItem value="male" id="male" className="hidden" />
                    <label htmlFor="male" className="cursor-pointer flex flex-col items-center space-y-2">
                      <div className="text-4xl">👨</div>
                      <span className="font-bold">Мужской</span>
                    </label>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative ${
                      formData.gender === 'female'
                        ? 'bg-gradient-to-br from-pink-500/20 to-purple-500/20 border-2 border-pink-500'
                        : 'bg-white/5 border border-white/10'
                    } rounded-xl p-4 cursor-pointer transition-all`}
                  >
                    <RadioGroupItem value="female" id="female" className="hidden" />
                    <label htmlFor="female" className="cursor-pointer flex flex-col items-center space-y-2">
                      <div className="text-4xl">👩</div>
                      <span className="font-bold">Женский</span>
                    </label>
                  </motion.div>
                </RadioGroup>
              </div>

              <div className="glass rounded-2xl p-6 border border-white/10">
                <label className="text-lg font-medium text-slate-300 block mb-4">Селфи (ссылка)</label>
                <Input
                  placeholder="https://... (опционально)"
                  value={formData.selfie_url || ''}
                  onChange={(e) => setFormData({ ...formData, selfie_url: e.target.value })}
                  className="py-5 text-lg bg-slate-900/50 border-slate-700 rounded-xl focus:border-[#4ECDC4] transition-all"
                  data-testid="selfie-input"
                />
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="w-full btn-pushable"
              data-testid="onboarding-next-step1"
            >
              <span className="btn-shadow"></span>
              <span className="btn-edge"></span>
              <span className="btn-front">
                ДАЛЕЕ →
              </span>
            </motion.button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gaming mb-3">ВЫБЕРИ ВЕТКУ</h2>
              <p className="text-slate-400 text-lg">Определи путь своего героя</p>
            </div>

            <div className="space-y-4">
              {BRANCHES.map((branch, index) => {
                const Icon = branch.icon;
                const isSelected = formData.branch === branch.id;
                
                return (
                  <motion.div
                    key={branch.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      haptic.medium();
                      setFormData({ ...formData, branch: branch.id });
                    }}
                    className={`relative glass rounded-3xl p-6 cursor-pointer transition-all overflow-hidden ${
                      isSelected
                        ? 'border-2 border-white/30 shadow-2xl'
                        : 'border border-white/10'
                    }`}
                    data-testid={`branch-${branch.id}`}
                  >
                    {/* Gradient Background */}
                    {isSelected && (
                      <motion.div
                        layoutId="selectedBranch"
                        className={`absolute inset-0 bg-gradient-to-br ${branch.gradient} opacity-20`}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    
                    {/* Glow effect */}
                    {isSelected && (
                      <div 
                        className="absolute inset-0" 
                        style={{ 
                          background: `radial-gradient(circle at center, ${branch.glow} 0%, transparent 70%)`,
                          filter: 'blur(20px)'
                        }} 
                      />
                    )}

                    <div className="relative flex items-start space-x-4">
                      <motion.div
                        animate={{ rotate: isSelected ? [0, 5, -5, 0] : 0 }}
                        transition={{ repeat: isSelected ? Infinity : 0, duration: 2 }}
                        className={`p-4 rounded-2xl bg-gradient-to-br ${branch.gradient}`}
                      >
                        <Icon size={32} className="text-white" />
                      </motion.div>
                      
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gaming mb-2">{branch.title}</h3>
                        <p className="text-slate-400 mb-3">{branch.description}</p>
                        <div className="inline-block glass rounded-full px-4 py-2">
                          <span className="text-xs font-bold text-[#4ECDC4]">{branch.stats}</span>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-3xl"
                        >
                          ✔️
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex gap-4">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleBack}
                className="flex-1 py-4 rounded-xl glass border border-white/20 font-bold"
                data-testid="onboarding-back-step2"
              >
                ← Назад
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                className="flex-2 btn-pushable"
                data-testid="onboarding-next-step2"
                style={{ flex: 2 }}
              >
                <span className="btn-shadow"></span>
                <span className="btn-edge"></span>
                <span className="btn-front">
                  ДАЛЕЕ →
                </span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="text-6xl mb-4"
              >
                🎯
              </motion.div>
              <h2 className="text-4xl font-bold text-gaming mb-3">ПОСТАВЬ ЦЕЛЬ</h2>
              <p className="text-slate-400 text-lg">Что хочешь достичь?</p>
            </div>

            <div className="space-y-6">
              {/* Goal Input */}
              <div className="glass rounded-2xl p-6 border border-white/10">
                <label className="text-lg font-medium text-slate-300 block mb-4">Твоя цель</label>
                <Input
                  placeholder="Например: Купить новый гаджет"
                  value={formData.goal_text}
                  onChange={(e) => setFormData({ ...formData, goal_text: e.target.value })}
                  className="py-6 text-lg bg-slate-900/50 border-slate-700 rounded-xl focus:border-[#4ECDC4] transition-all"
                  data-testid="goal-input"
                />
              </div>

              {/* Goal Level */}
              <div className="glass rounded-2xl p-6 border border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-lg font-medium text-slate-300">Достичь на уровне</label>
                  <motion.div
                    key={formData.goal_level}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-3xl font-bold text-gaming text-[#FF6B35]"
                  >
                    {formData.goal_level}
                  </motion.div>
                </div>
                <Slider
                  value={[formData.goal_level]}
                  onValueChange={(value) => {
                    haptic.selection();
                    setFormData({ ...formData, goal_level: value[0] });
                  }}
                  min={5}
                  max={50}
                  step={5}
                  className="mt-2"
                />
              </div>

              {/* Tip Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-6 border border-[#4ECDC4]/30 bg-gradient-to-br from-[#4ECDC4]/10 to-[#FF6B35]/10"
              >
                <div className="flex items-start space-x-3">
                  <div className="text-3xl">💡</div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">Совет</h4>
                    <p className="text-sm text-slate-300">
                      Выбери реальную цель, которая мотивирует тебя! Это может быть покупка, путешествие,
                      достижение в карьере или что угодно важное для тебя.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="flex gap-4">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleBack}
                className="flex-1 py-4 rounded-xl glass border border-white/20 font-bold"
                data-testid="onboarding-back-step3"
              >
                ← Назад
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleComplete}
                disabled={!formData.goal_text}
                className="flex-2 btn-pushable"
                data-testid="onboarding-complete"
                style={{ flex: 2, opacity: !formData.goal_text ? 0.5 : 1 }}
              >
                <span className="btn-shadow"></span>
                <span className="btn-edge"></span>
                <span className="btn-front">
                  🚀 СОЗДАТЬ ГЕРОЯ!
                </span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
