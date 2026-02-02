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
      } else {
        const progressData = await api.getProgress(telegramUser.id);
        setProgress(progressData || defaultProgress);
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
      setLoading(false);
    }
  }, [backendUrl, initializeUser]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
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
            ЗАГРУЗКА...
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

  return (
    <div className="App">
      <ErrorBoundary>
        <HomeScreen user={user} progress={progress} onRefresh={handleRefresh} onProgressUpdate={setProgress} />
      </ErrorBoundary>
    </div>
  );
}

export default App;
