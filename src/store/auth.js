import { create } from 'zustand';
import api from '../lib/api';

export const useAuth = create((set) => ({
  user: null,
  ready: false,
  async init() {
    if (!localStorage.getItem('nexora_token')) return set({ ready: true });
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, ready: true });
    } catch {
      localStorage.removeItem('nexora_token');
      set({ user: null, ready: true });
    }
  },
  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('nexora_token', data.token);
    set({ user: data.user });
  },
  async register(name, email, password) {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('nexora_token', data.token);
    set({ user: data.user });
  },
  setUser: (user) => set({ user }),
  logout() {
    localStorage.removeItem('nexora_token');
    set({ user: null });
  },
}));

if (typeof window !== 'undefined') {
  window.addEventListener('nexora:logout', () => useAuth.getState().logout());
}
