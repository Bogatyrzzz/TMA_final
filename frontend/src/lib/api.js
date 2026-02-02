import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const getApiBase = () => {
  if (!BACKEND_URL) {
    throw new Error('REACT_APP_BACKEND_URL is not set');
  }
  return `${BACKEND_URL}/api`;
};
const getClient = () => axios.create({
  baseURL: getApiBase(),
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});

export const api = {
  // User endpoints
  registerUser: async (userData) => {
    const response = await getClient().post('/users/register', userData);
    return response.data;
  },

  getUser: async (tgId) => {
    const response = await getClient().get(`/users/${tgId}`);
    return response.data;
  },

  completeOnboarding: async (tgId, data) => {
    const response = await getClient().post(`/users/${tgId}/onboarding`, data);
    return response.data;
  },

  // Progress endpoints
  getProgress: async (tgId) => {
    const response = await getClient().get(`/users/${tgId}/progress`);
    return response.data;
  },
  getGoals: async (tgId) => {
    const response = await getClient().get(`/users/${tgId}/goals`);
    return response.data;
  },
  createGoal: async (tgId, data) => {
    const response = await getClient().post(`/users/${tgId}/goals`, data);
    return response.data;
  },
  updateGoal: async (tgId, goalId, data) => {
    const response = await getClient().patch(`/users/${tgId}/goals/${goalId}`, data);
    return response.data;
  },
  completeGoal: async (tgId, goalId) => {
    const response = await getClient().post(`/users/${tgId}/goals/${goalId}/complete`);
    return response.data;
  },
  getDailyXp: async (tgId) => {
    const response = await getClient().get(`/users/${tgId}/daily-xp`);
    return response.data;
  },

  // Quest endpoints
  getQuests: async (tgId) => {
    const response = await getClient().get(`/users/${tgId}/quests`);
    return response.data;
  },

  completeQuest: async (tgId, questId) => {
    const response = await getClient().post(`/users/${tgId}/quests/complete`, {
      quest_id: questId,
    });
    return response.data;
  },

  // PRO endpoints
  activatePro: async (tgId) => {
    const response = await getClient().post(`/users/${tgId}/pro/activate`);
    return response.data;
  },

  addBranch: async (tgId, branch) => {
    const response = await getClient().post(`/users/${tgId}/branches/add`, branch);
    return response.data;
  },
};
