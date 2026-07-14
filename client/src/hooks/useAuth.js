import useAuthStore from '../store/authStore.js';

/**
 * Convenience hook wrapping the Zustand auth store.
 * @returns {{ user, isAuthenticated, isLoading, hydrate, login, logout }}
 */
const useAuth = () => useAuthStore();

export default useAuth;
