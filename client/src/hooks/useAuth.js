import useAuthStore from '../store/authStore.js';

/**
 * Convenience hook wrapping the Zustand auth store.
 * @returns {{
 *   user: object|null,
 *   isAuthenticated: boolean,
 *   isLoading: boolean,
 *   hydrate: Function,
 *   signup: Function,
 *   login: Function,
 *   logout: Function
 * }}
 */
const useAuth = () => useAuthStore();

export default useAuth;
