import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://quest-hero-3.preview.emergentagent.com';
const API = `${BACKEND_URL}/api`;

export const api = {
  // User endpoints
  registerUser: async (userData) => {
    const response = await axios.post(`${API}/users/register`, userData);
    return response.data;
  },

  getUser: async (tgId) => {
    const response = await axios.get(`${API}/users/${tgId}`);
    return response.data;
  },

  completeOnboarding: async (tgId, data) => {
    const response = await axios.post(`${API}/users/${tgId}/onboarding`, data);
    return response.data;
  },

  // Progress endpoints
  getProgress: async (tgId) => {
    const response = await axios.get(`${API}/users/${tgId}/progress`);
    return response.data;
  },

  // Quest endpoints
  getQuests: async (tgId) => {
    const response = await axios.get(`${API}/users/${tgId}/quests`);
    return response.data;
  },

  completeQuest: async (tgId, questId) => {
    const response = await axios.post(`${API}/users/${tgId}/quests/complete`, {
      quest_id: questId,
    });
    return response.data;
  },

  // PRO endpoints
  activatePro: async (tgId) => {
    const response = await axios.post(`${API}/users/${tgId}/pro/activate`);
    return response.data;
  },

  addBranch: async (tgId, branch) => {
    const response = await axios.post(`${API}/users/${tgId}/branches/add`, branch);
    return response.data;
  },
};
