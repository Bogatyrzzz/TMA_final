import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { MagicWand01Icon } from '@hugeicons/core-free-icons';
import { initTelegram, getTelegramUser, haptic } from './lib/telegram';
import { api } from './lib/api';
import Onboarding from './components/Onboarding';
import HomeScreen from './components/HomeScreen';
import './App.css';

const defaultProgress = {
  current_level: 1,
  current_xp: 0,
  next_level_xp: 100,
  total_xp: 0,
  goal_progress: 0,
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {}

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-3xl font-bold">Ошибка загрузки</div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [loading, setLoading] = useState(true);
  const [tgUser, setTgUser] = useState(null);
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [initError, setInitError] = useState('');
  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const forceOnboarding = typeof window !== 'undefined' && window.location.search.includes('onboarding=1');

  const initializeUser = React.useCallback(async (telegramUser) => {
    try {
      // Register or get existing user
      const userData = await api.registerUser({
        tg_id: telegramUser.id,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        language_code: telegramUser.language_code || 'en',
      });

      setUser(userData);

      // Check if onboarding is needed
      if (!userData.age || !userData.gender) {
        setShowOnboarding(true);
        setIsGeneratingAvatar(false);
      } else if (!userData.avatar_url) {
        setShowOnboarding(false);
        setIsGeneratingAvatar(true);
        const progressData = await api.getProgress(telegramUser.id);
        setProgress(progressData || defaultProgress);
      } else {
        const progressData = await api.getProgress(telegramUser.id);
        setProgress(progressData || defaultProgress);
        setIsGeneratingAvatar(false);
      }

      haptic.light();
    } catch (error) {
      console.error('Error initializing user:', error);
      setInitError('Не удалось подключиться к backend');
      setUser(null);
      setProgress(null);
      setShowOnboarding(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!backendUrl) {
      setInitError('REACT_APP_BACKEND_URL не задан');
      setLoading(false);
      return;
    }
    try {
      initTelegram();
      const telegramUser = getTelegramUser();
      const devUser = telegramUser || {
        id: 123456789,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        language_code: 'ru',
      };
      
      setTgUser(devUser);
      initializeUser(devUser);
    } catch (error) {
      console.error('Telegram init error:', error);
      const fallbackUser = {
        tg_id: 123456789,
        first_name: 'Fallback',
        last_name: 'User',
        username: 'fallback',
        language_code: 'ru',
        avatar_url: '',
        is_pro: false,
        active_branches: ['power'],
        strength: 2,
        health: 2,
        intellect: 2,
        agility: 2,
        confidence: 2,
        stability: 2,
      };
      setUser(fallbackUser);
      setProgress(defaultProgress);
      setShowOnboarding(false);
      setIsGeneratingAvatar(false);
      setLoading(false);
    }
  }, [backendUrl, initializeUser]);

  useEffect(() => {
    if (!tgUser || !user || showOnboarding || !isGeneratingAvatar) {
      return undefined;
    }
    let isActive = true;
    const interval = setInterval(async () => {
      try {
        const userData = await api.getUser(tgUser.id);
        if (!isActive) {
          return;
        }
        setUser(userData);
        if (userData.avatar_url) {
          const progressData = await api.getProgress(tgUser.id);
          setProgress(progressData || defaultProgress);
          setIsGeneratingAvatar(false);
        }
      } catch (error) {
        console.error('Error polling avatar status:', error);
      }
    }, 4000);
    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [tgUser, user, showOnboarding, isGeneratingAvatar]);

  const handleOnboardingComplete = async (onboardingData) => {
    try {
      setLoading(true);
      
      // Complete onboarding
      await api.completeOnboarding(tgUser.id, onboardingData);
      
      // Reload user and progress
      const userData = await api.getUser(tgUser.id);
      const progressData = await api.getProgress(tgUser.id);
      
      setUser(userData);
      setProgress(progressData || defaultProgress);
      setShowOnboarding(false);
      if (!userData.avatar_url) {
        setIsGeneratingAvatar(true);
      } else {
        setIsGeneratingAvatar(false);
      }
      
      haptic.success();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      haptic.error();
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      const userData = await api.getUser(tgUser.id);
      const progressData = await api.getProgress(tgUser.id);
      
      setUser(userData);
      setProgress(progressData || defaultProgress);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  if (forceOnboarding) {
    return (
      <ErrorBoundary>
        <Onboarding onComplete={() => {}} />
      </ErrorBoundary>
    );
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-white"
        style={{
          backgroundColor: '#0F0F23',
          backgroundImage: 'radial-gradient(circle at 50% 0%, #2D2D44 0%, #0F0F23 70%)',
        }}
      >
        <div className="text-center">
          <motion.div
            animate={{ 
              scale: [1, 1.12, 1],
              rotate: [0, 6, -6, 0]
            }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            className="mb-6"
          >
            <div className="relative flex items-center justify-center w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-3xl bg-[#FF6A2A]/20 blur-2xl" />
              <div className="absolute inset-2 rounded-2xl bg-gradient-to-br from-[#FF6A2A]/30 to-[#33D6C7]/20 blur-xl" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6A2A] to-[#FF8A3D] shadow-[0_10px_30px_rgba(255,106,42,0.45)] flex items-center justify-center">
                <HugeiconsIcon icon={MagicWand01Icon} size={34} color="#0F0F23" strokeWidth={1.8} />
              </div>
            </div>
          </motion.div>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-white text-2xl font-bold tracking-wide"
          >
            Загружаю, Босс
          </motion.div>
          <div className="mt-6 w-64 mx-auto progress-bar-thick">
            <motion.div
              className="progress-bar-fill"
              animate={{ width: ["0%", "100%"] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              style={{ background: '#33D6C7' }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-3xl font-bold">Ошибка загрузки</div>
          {initError && (
            <div className="text-sm text-slate-400">{initError}</div>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition"
          >
            Обновить страницу
          </button>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <ErrorBoundary>
        <Onboarding onComplete={handleOnboardingComplete} />
      </ErrorBoundary>
    );
  }

  if (isGeneratingAvatar) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-white"
        style={{
          backgroundColor: '#0F0F23',
          backgroundImage: 'radial-gradient(circle at 50% 0%, #2D2D44 0%, #0F0F23 70%)',
        }}
      >
        <div className="text-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 3, -3, 0] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
            className="text-7xl mb-6"
          >
            🧬
          </motion.div>
          <div className="text-white text-2xl font-bold text-gaming mb-3">
            Генерируем твоего героя
          </div>
          <div className="text-white/70 mb-6">
            Осталось совсем чуть‑чуть
          </div>
          <div className="mt-2 w-72 mx-auto progress-bar-thick">
            <motion.div
              className="progress-bar-fill"
              animate={{ width: ["0%", "100%"] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
              style={{ background: '#33D6C7' }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <ErrorBoundary>
        <HomeScreen user={user} progress={progress} onRefresh={handleRefresh} onProgressUpdate={setProgress} />
      </ErrorBoundary>
    </div>
  );
}

export default App;
