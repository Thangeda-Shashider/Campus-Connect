import { create } from 'zustand';
import api from '../api/axios.js';

const useAuthStore = create((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    /**
     * Hydrate auth state from the server (call on app mount).
     */
    hydrate: async () => {
        set({ isLoading: true });
        try {
            const { data } = await api.get('/auth/me');
            if (data.success) {
                set({ user: data.data, isAuthenticated: true });
            } else {
                set({ user: null, isAuthenticated: false });
            }
        } catch {
            set({ user: null, isAuthenticated: false });
        } finally {
            set({ isLoading: false });
        }
    },

    /**
     * Called after a successful login/register.
     * @param {{ name: string, email: string, role: string }} user
     */
    login: (user) => set({ user, isAuthenticated: true }),

    /**
     * Called after logout — clears local state.
     */
    logout: () => set({ user: null, isAuthenticated: false }),
}));

export default useAuthStore;
