import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
        <div className="min-h-screen lq-main-screen text-white flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-3xl font-bold">Ошибка загрузки</div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl lq-glass-panel transition"
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
  const [hasInitialized, setHasInitialized] = useState(false);
  const [tgUser, setTgUser] = useState(null);
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [avatarFadeKey, setAvatarFadeKey] = useState(0);
  const [avatarStartAt, setAvatarStartAt] = useState(null);
  const [initError, setInitError] = useState('');
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

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
        setAvatarStartAt(null);
        setAvatarError(false);
      } else if (!userData.avatar_url) {
        setShowOnboarding(false);
        setIsGeneratingAvatar(true);
        setAvatarStartAt(Date.now());
        setAvatarError(false);
        const progressData = await api.getProgress(telegramUser.id);
        setProgress(progressData || defaultProgress);
      } else {
        const progressData = await api.getProgress(telegramUser.id);
        setProgress(progressData || defaultProgress);
        setIsGeneratingAvatar(false);
        setAvatarStartAt(null);
        setAvatarError(false);
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
      setHasInitialized(true);
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
      setAvatarStartAt(null);
      setAvatarError(false);
      setLoading(false);
      setHasInitialized(true);
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
          setAvatarStartAt(null);
          setAvatarError(false);
          setAvatarFadeKey((current) => current + 1);
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

  useEffect(() => {
    if (!isGeneratingAvatar) {
      setAvatarError(false);
      return undefined;
    }
    const timeout = setTimeout(() => {
      setAvatarError(true);
    }, 90000);
    return () => clearTimeout(timeout);
  }, [isGeneratingAvatar, avatarStartAt]);

  const handleOnboardingComplete = async (onboardingData) => {
    try {
      setLoading(true);
      localStorage.setItem('lq_onboarding_payload', JSON.stringify(onboardingData));
      
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
        setAvatarStartAt(Date.now());
        setAvatarError(false);
      } else {
        setIsGeneratingAvatar(false);
        setAvatarStartAt(null);
        setAvatarError(false);
      }
      
      haptic.success();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      haptic.error();
    } finally {
      setLoading(false);
    }
  };

  const handleRetryAvatar = async () => {
    const cachedPayload = localStorage.getItem('lq_onboarding_payload');
    setAvatarError(false);
    setIsGeneratingAvatar(true);
    setAvatarStartAt(Date.now());
    if (!cachedPayload) {
      return;
    }
    setLoading(true);
    try {
      await api.completeOnboarding(tgUser.id, JSON.parse(cachedPayload));
    } catch (error) {
      console.error('Error retrying avatar generation:', error);
      setAvatarError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithoutAvatar = () => {
    setAvatarError(false);
    setIsGeneratingAvatar(false);
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

  if (loading && !hasInitialized) {
    return (
      <div className="min-h-screen lq-main-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-8xl mb-6"
          >
            🦸
          </motion.div>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-white text-2xl font-bold text-gaming"
          >
            Запускаем LifeQuest Hero
          </motion.div>
          <div className="mt-6 w-64 mx-auto progress-bar-thick">
            <motion.div
              className="progress-bar-fill"
              animate={{ width: ["0%", "100%"] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (loading && hasInitialized) {
    return <AppSkeleton />;
  }

  if (!user) {
    return (
      <div className="min-h-screen lq-main-screen text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-3xl font-bold">Ошибка загрузки</div>
          {initError && (
            <div className="text-sm lq-text-muted">{initError}</div>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl lq-glass-panel transition"
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

  if (isGeneratingAvatar && avatarError) {
    return (
      <div className="min-h-screen lq-main-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">⚠️</div>
          <div className="text-white text-2xl font-bold text-gaming mb-3">
            Герой ещё не сгенерировался
          </div>
          <div className="lq-text-muted mb-6">
            Проверь сеть или попробуй ещё раз. Можно продолжить без фона.
          </div>
          <div className="space-y-3">
            <button
              onClick={handleRetryAvatar}
              className="w-full btn-pushable"
            >
              <span className="btn-shadow"></span>
              <span className="btn-edge"></span>
              <span className="btn-front">Повторить</span>
            </button>
            <button
              onClick={handleContinueWithoutAvatar}
              className="w-full px-6 py-3 rounded-xl lq-glass-panel lq-text-muted"
            >
              Продолжить без аватара
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isGeneratingAvatar) {
    return (
      <div className="min-h-screen lq-main-screen flex items-center justify-center">
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
          <div className="lq-text-muted mb-6">
            Осталось совсем чуть‑чуть
          </div>
          <div className="mt-2 w-72 mx-auto progress-bar-thick">
            <motion.div
              className="progress-bar-fill"
              animate={{ width: ["0%", "100%"] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <ErrorBoundary>
        <motion.div
          key={avatarFadeKey}
          initial={avatarFadeKey > 0 ? { opacity: 0, scale: 0.98 } : { opacity: 1, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <HomeScreen user={user} progress={progress} onRefresh={handleRefresh} onProgressUpdate={setProgress} />
        </motion.div>
      </ErrorBoundary>
    </div>
  );
}

function AppSkeleton() {
  return (
    <div className="min-h-screen lq-main-screen text-white flex flex-col">
      <div className="flex items-center w-full px-4 lq-safe-top">
        <div className="w-16 h-16 lq-skeleton rounded-full" />
        <div className="flex-1 h-10 -ml-4 pl-6 pr-4 lq-glass-panel rounded-r-2xl flex items-center">
          <div className="w-full h-2 lq-skeleton rounded-full" />
        </div>
      </div>

      <div className="flex-1 relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 space-y-2">
          {[0, 1, 2].map((item) => (
            <div key={`left-${item}`} className="flex items-center space-x-2 lq-glass-chip rounded-full px-3 py-2">
              <div className="w-6 h-6 lq-skeleton rounded-full" />
              <div className="w-8 h-3 lq-skeleton rounded-full" />
            </div>
          ))}
        </div>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 space-y-2">
          {[0, 1, 2].map((item) => (
            <div key={`right-${item}`} className="flex items-center space-x-2 lq-glass-chip rounded-full px-3 py-2">
              <div className="w-8 h-3 lq-skeleton rounded-full" />
              <div className="w-6 h-6 lq-skeleton rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pb-24 pt-2 lq-safe-bottom">
        <div className="w-full lq-glass-panel rounded-2xl p-4 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 lq-skeleton rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 lq-skeleton rounded-full w-40" />
              <div className="h-3 lq-skeleton rounded-full w-24" />
            </div>
          </div>
          <div className="h-1.5 lq-skeleton rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default App;
