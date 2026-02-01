import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Card } from './ui/card';
import { haptic } from '../lib/telegram';

const BRANCHES = [
  {
    id: 'power',
    title: '💪 Сила',
    subtitle: 'Power',
    description: 'Физическая мощь и уверенность',
    stats: '+2 Сила, +1 Уверенность',
    color: 'from-red-500 to-orange-500',
  },
  {
    id: 'stability',
    title: '🧘 Стабильность',
    subtitle: 'Stability',
    description: 'Баланс и интеллектуальный рост',
    stats: '+2 Стабильность, +1 Интеллект',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'longevity',
    title: '🌱 Долголетие',
    subtitle: 'Longevity',
    description: 'Здоровье и гибкость',
    stats: '+2 Здоровье, +1 Ловкость',
    color: 'from-green-500 to-emerald-500',
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
    <div className="min-h-screen bg-gradient-to-b from-[#0F0F23] to-[#1a1a2e] text-white p-4">
      {/* Progress Bar */}
      <div className="w-full bg-gray-800 rounded-full h-2 mb-8">
        <motion.div
          className="bg-gradient-to-r from-[#FF6B35] to-[#4ECDC4] h-2 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${(step / 3) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Расскажи о себе</h2>
              <p className="text-gray-400">Создадим твоего уникального героя</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-lg mb-2">Возраст: {formData.age}</Label>
                <Slider
                  value={[formData.age]}
                  onValueChange={(value) => setFormData({ ...formData, age: value[0] })}
                  min={18}
                  max={80}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-lg mb-4 block">Пол</Label>
                <RadioGroup
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2 flex-1">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male" className="cursor-pointer">
                      👨 Мужской
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 flex-1">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female" className="cursor-pointer">
                      👩 Женский
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <Button
              onClick={handleNext}
              className="w-full py-6 text-lg bg-gradient-to-r from-[#FF6B35] to-[#4ECDC4]"
              data-testid="onboarding-next-step1"
            >
              Далее →
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Выбери ветку развития</h2>
              <p className="text-gray-400">Определи путь своего героя</p>
            </div>

            <div className="space-y-4">
              {BRANCHES.map((branch) => (
                <Card
                  key={branch.id}
                  className={`p-6 cursor-pointer transition-all ${
                    formData.branch === branch.id
                      ? 'border-2 border-[#FF6B35] bg-gradient-to-r ' + branch.color + ' bg-opacity-20'
                      : 'border border-gray-700 bg-gray-900 hover:border-gray-600'
                  }`}
                  onClick={() => {
                    haptic.selection();
                    setFormData({ ...formData, branch: branch.id });
                  }}
                  data-testid={`branch-${branch.id}`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">{branch.title}</h3>
                      <p className="text-sm text-gray-400 mb-2">{branch.description}</p>
                      <p className="text-xs text-[#4ECDC4]">{branch.stats}</p>
                    </div>
                    {formData.branch === branch.id && (
                      <div className="text-2xl">✓</div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1 py-6 text-lg"
                data-testid="onboarding-back-step2"
              >
                ← Назад
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 py-6 text-lg bg-gradient-to-r from-[#FF6B35] to-[#4ECDC4]"
                data-testid="onboarding-next-step2"
              >
                Далее →
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Поставь цель</h2>
              <p className="text-gray-400">Что хочешь достичь?</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-lg mb-2">Твоя цель</Label>
                <Input
                  placeholder="Например: Купить новый гаджет"
                  value={formData.goal_text}
                  onChange={(e) => setFormData({ ...formData, goal_text: e.target.value })}
                  className="py-6 text-lg bg-gray-900 border-gray-700"
                  data-testid="goal-input"
                />
              </div>

              <div>
                <Label className="text-lg mb-2">Достичь на уровне: {formData.goal_level}</Label>
                <Slider
                  value={[formData.goal_level]}
                  onValueChange={(value) => setFormData({ ...formData, goal_level: value[0] })}
                  min={5}
                  max={50}
                  step={5}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#FF6B35] to-[#4ECDC4] p-6 rounded-lg">
              <h3 className="font-bold mb-2">🎯 Совет</h3>
              <p className="text-sm">
                Выбери реальную цель, которая мотивирует тебя! Это может быть покупка, путешествие,
                достижение в карьере или что угодно важное для тебя.
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1 py-6 text-lg"
                data-testid="onboarding-back-step3"
              >
                ← Назад
              </Button>
              <Button
                onClick={handleComplete}
                className="flex-1 py-6 text-lg bg-gradient-to-r from-[#FF6B35] to-[#4ECDC4]"
                disabled={!formData.goal_text}
                data-testid="onboarding-complete"
              >
                🚀 Создать героя!
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
