import WebApp from '@twa-dev/sdk';

export const tg = WebApp;

// Initialize Telegram Web App
export const initTelegram = () => {
  if (!tg || !tg.ready) {
    return null;
  }
  tg.ready();
  tg.expand();
  
  // Set theme
  if (tg.colorScheme === 'dark') {
    document.documentElement.classList.add('dark');
  }
  
  return tg;
};

// Get Telegram user data
export const getTelegramUser = () => {
  if (!tg) return null;
  const user = tg.initDataUnsafe?.user;
  return user || null;
};

// Haptic feedback
export const haptic = {
  light: () => tg?.HapticFeedback?.impactOccurred('light'),
  medium: () => tg?.HapticFeedback?.impactOccurred('medium'),
  heavy: () => tg?.HapticFeedback?.impactOccurred('heavy'),
  success: () => tg?.HapticFeedback?.notificationOccurred('success'),
  error: () => tg?.HapticFeedback?.notificationOccurred('error'),
  warning: () => tg?.HapticFeedback?.notificationOccurred('warning'),
  selection: () => tg?.HapticFeedback?.selectionChanged(),
};

// Main Button
export const mainButton = {
  show: (text, onClick) => {
    tg.MainButton.setText(text);
    tg.MainButton.onClick(onClick);
    tg.MainButton.show();
  },
  hide: () => {
    tg.MainButton.hide();
  },
  showProgress: () => {
    tg.MainButton.showProgress();
  },
  hideProgress: () => {
    tg.MainButton.hideProgress();
  },
};

// Show alert
export const showAlert = (message) => {
  tg.showAlert(message);
};

// Show confirm
export const showConfirm = (message, callback) => {
  tg.showConfirm(message, callback);
};

// Close app
export const closeApp = () => {
  tg.close();
};
