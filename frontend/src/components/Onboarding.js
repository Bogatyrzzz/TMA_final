import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import { haptic } from '../lib/telegram';

const TOTAL_STEPS = 5;
const GENDERS = [
  {
    id: 'male',
    title: 'Мужской',
    icon: '👨',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBHdE7LqwasQiN_YEgLIP1fHG1q684r_3t6Gs4589chBFDg3eqC_MpCeEaXkYPDvRqOJOGN7Qjlb4PcHzOwiHAfDo2dB5eKT5w6Ev6z6yJVtJcUTAEUOj8y_NdlT0a2Xh3MzWCdJawu2opbJ8gbm1yJmFL5q8wFS4BNNs4sPJ-HAOpp7K5eOyf-i8JJVR2nggui5arxdKy0oUT-OHREC-A43QgWRcNFM7X-qYxpQQBPAyPvRzu5I8kmHcoGeUh-29KkiQsHAS4nJOQ',
  },
  {
    id: 'female',
    title: 'Женский',
    icon: '👩',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCiYF0iqEBBKnzI0d3H8-SSnR4sHxA6ehMPAar4GnTEZ7upbtZHIOdBT91z28AQRaD_HfTBcxS-_vl5mdCvePsb6rz7sEHaeWWIUJDskD3Imx0sh6EDPc1XqRumLEnj7uiN0P9KDL0dqMxvYEoxJHYBocbzRmN2zHof_4rh8NAhdnomssZKlyBFjvzvfK8y8qYP_WKfwxMQvL3_NnX5vipscUtDjN0SdhRxIdUWE0cDUmsv6KVcnJTVihvKkhly-0ju3b-sJOV4OFY',
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
    about_text: '',
  });

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      haptic.light();
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      haptic.light();
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    haptic.success();
    onComplete(formData);
  };

  return (
    <div
      className="min-h-screen text-white flex flex-col"
      style={{
        backgroundColor: '#0F0F23',
        backgroundImage: 'radial-gradient(circle at 50% 0%, #2D2D44 0%, #0F0F23 70%)',
      }}
    >
      <div className="w-full pt-12 pb-4 px-6">
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => {
            const current = index + 1 === step;
            const completed = index + 1 < step;
            return (
              <div
                key={`step-${index}`}
                className={`${current ? 'w-8' : 'w-2'} h-2 rounded-full ${
                  current || completed ? 'bg-[#FF6A2A]' : 'bg-white/20'
                }`}
                style={{
                  boxShadow: current ? '0 0 20px rgba(255, 106, 42, 0.4)' : 'none',
                }}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between text-xs text-white/60 mt-3">
          <span>Шаг {step} из {TOTAL_STEPS}</span>
          <span className="font-semibold text-[#33D6C7]">
            {Math.round((step / TOTAL_STEPS) * 100)}%
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-6 pb-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="gender"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex-1 flex flex-col"
            >
              <div className="text-center pt-2 pb-6">
                <h1 className="text-white tracking-tight text-[36px] font-black leading-tight drop-shadow-lg">
                  Выберите пол
                </h1>
                <p className="text-white/70 text-base font-medium leading-normal pt-3 max-w-xs mx-auto">
                  Это нужно для генерации стартового героя.
                </p>
              </div>

              <div className="flex-1 flex items-center justify-center w-full">
                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                  {GENDERS.map((gender) => {
                    const selected = formData.gender === gender.id;
                    return (
                      <button
                        key={gender.id}
                        onClick={() => {
                          haptic.selection();
                          setFormData({ ...formData, gender: gender.id });
                        }}
                        className="group relative flex flex-col h-[320px] w-full cursor-pointer transition-all duration-300 ease-out active:scale-95 text-left"
                      >
                        {selected && (
                          <div className="absolute -inset-0.5 bg-[#FF6A2A]/30 blur-xl rounded-2xl opacity-60" />
                        )}
                        <div
                          className={`w-full h-full rounded-2xl flex flex-col overflow-hidden relative transition-all duration-300 ${
                            selected ? 'border border-[#FF6A2A]/70 bg-white/10' : 'border border-white/10 bg-white/5'
                          }`}
                          style={{
                            boxShadow: selected ? '0 0 25px rgba(255, 106, 42, 0.25)' : 'none',
                            backdropFilter: 'blur(20px)',
                          }}
                        >
                          <div className="flex-1 w-full relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F23]/80 via-transparent to-transparent z-10" />
                            <div
                              className="w-full h-full bg-cover bg-center opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                              style={{ backgroundImage: `url("${gender.image}")` }}
                            />
                          </div>
                          <div className="relative z-20 p-4 pt-2 flex flex-col items-center border-t border-white/10 bg-white/5 backdrop-blur-sm">
                            <div
                              className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 transition-colors duration-300 ${
                                selected ? 'bg-[#FF6A2A] text-white shadow-[0_0_16px_rgba(255,106,42,0.45)]' : 'bg-white/10 text-white/70'
                              }`}
                            >
                              <span className="text-xl">{gender.icon}</span>
                            </div>
                            <span className="text-white text-lg font-bold tracking-wide">{gender.title}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="w-full pt-6">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNext}
                  className="w-full relative flex items-center justify-center overflow-hidden rounded-xl h-14 text-white text-lg font-bold tracking-wide"
                  style={{
                    background: '#FF6A2A',
                    boxShadow: '0 0 20px rgba(255, 106, 42, 0.35)',
                  }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Далее
                    <span className="text-xl">→</span>
                  </span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="age"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex-1 flex flex-col"
            >
              <div className="text-center pt-2 pb-6">
                <h2 className="text-[32px] font-black tracking-tight">Сколько вам лет?</h2>
                <p className="text-white/70 text-base font-medium leading-normal pt-3 max-w-xs mx-auto">
                  Это помогает рассчитать путь прокачки героя.
                </p>
              </div>

              <div className="space-y-6 flex-1">
                <div className="glass rounded-2xl p-6 border border-white/10">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-lg font-medium text-white/80">Возраст</label>
                    <motion.div
                      key={formData.age}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="text-3xl font-bold text-[#FF6A2A]"
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
                    min={16}
                    max={80}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBack}
                  className="flex-1 h-14 rounded-xl border border-white/10 text-white/80 font-semibold"
                >
                  Назад
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNext}
                  className="flex-[1.4] h-14 rounded-xl text-white font-bold"
                  style={{
                    background: '#FF6A2A',
                    boxShadow: '0 0 20px rgba(255, 106, 42, 0.35)',
                  }}
                >
                  Далее
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="selfie"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex-1 flex flex-col"
            >
              <div className="text-center pt-2 pb-6">
                <h2 className="text-[32px] font-black tracking-tight">Загрузите селфи</h2>
                <p className="text-white/70 text-base font-medium leading-normal pt-3 max-w-xs mx-auto">
                  Пока что это заглушка. Скоро добавим загрузку.
                </p>
              </div>

              <div className="flex-1 flex flex-col gap-6">
                <div className="border border-dashed border-white/20 rounded-2xl p-6 bg-white/5 text-center">
                  <div className="text-5xl mb-3">📷</div>
                  <div className="text-white/80 font-semibold mb-2">Селфи будет использоваться для героя</div>
                  <div className="text-sm text-white/50">Формат: JPG/PNG, портрет</div>
                </div>
                <button
                  type="button"
                  className="h-14 rounded-xl bg-white/10 text-white/60 font-semibold"
                  disabled
                >
                  Загрузить селфи
                </button>
              </div>

              <div className="flex gap-3 pt-6">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBack}
                  className="flex-1 h-14 rounded-xl border border-white/10 text-white/80 font-semibold"
                >
                  Назад
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNext}
                  className="flex-[1.4] h-14 rounded-xl text-white font-bold"
                  style={{
                    background: '#FF6A2A',
                    boxShadow: '0 0 20px rgba(255, 106, 42, 0.35)',
                  }}
                >
                  Далее
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="about"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex-1 flex flex-col"
            >
              <div className="text-center pt-2 pb-6">
                <h2 className="text-[32px] font-black tracking-tight">Расскажите о себе</h2>
                <p className="text-white/70 text-base font-medium leading-normal pt-3 max-w-xs mx-auto">
                  Ваш стиль, профессия и что угодно важное.
                </p>
              </div>

              <div className="flex-1 flex flex-col gap-4">
                <textarea
                  value={formData.about_text}
                  onChange={(event) => setFormData({ ...formData, about_text: event.target.value })}
                  placeholder="Например: дизайнер, люблю хайкинг и комиксы. Хочу прокачать дисциплину."
                  className="min-h-[180px] rounded-2xl bg-white/5 border border-white/10 px-4 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-[#33D6C7] transition-all"
                />
                <div className="text-xs text-white/50">
                  Подсказка: стиль, профессия, привычки, интересы.
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBack}
                  className="flex-1 h-14 rounded-xl border border-white/10 text-white/80 font-semibold"
                >
                  Назад
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNext}
                  className="flex-[1.4] h-14 rounded-xl text-white font-bold"
                  style={{
                    background: '#FF6A2A',
                    boxShadow: '0 0 20px rgba(255, 106, 42, 0.35)',
                  }}
                >
                  Далее
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="goal"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex-1 flex flex-col"
            >
              <div className="text-center pt-2 pb-6">
                <h2 className="text-[32px] font-black tracking-tight">Первая цель</h2>
                <p className="text-white/70 text-base font-medium leading-normal pt-3 max-w-xs mx-auto">
                  Опиши подарок или достижение, которое хочешь получить.
                </p>
              </div>

              <div className="space-y-6 flex-1">
                <div className="glass rounded-2xl p-6 border border-white/10">
                  <label className="text-lg font-medium text-white/80 block mb-4">Цель</label>
                  <Input
                    placeholder="Например: Новый ноутбук для работы"
                    value={formData.goal_text}
                    onChange={(e) => setFormData({ ...formData, goal_text: e.target.value })}
                    className="py-6 text-lg bg-transparent border-white/10 rounded-xl focus:border-[#33D6C7] transition-all"
                    data-testid="goal-input"
                  />
                </div>

                <div className="glass rounded-2xl p-6 border border-white/10">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-lg font-medium text-white/80">Достичь на уровне</label>
                    <motion.div
                      key={formData.goal_level}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="text-3xl font-bold text-[#FF6A2A]"
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
              </div>

              <div className="flex gap-3 pt-6">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBack}
                  className="flex-1 h-14 rounded-xl border border-white/10 text-white/80 font-semibold"
                >
                  Назад
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleComplete}
                  disabled={!formData.goal_text.trim()}
                  className="flex-[1.4] h-14 rounded-xl text-white font-bold"
                  style={{
                    background: '#FF6A2A',
                    boxShadow: '0 0 20px rgba(255, 106, 42, 0.35)',
                    opacity: formData.goal_text.trim() ? 1 : 0.5,
                  }}
                >
                  Создать героя
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
