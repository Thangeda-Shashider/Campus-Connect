import { create } from 'zustand';
import { supabase } from '../lib/supabase.js';

const fetchProfile = async (userId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
};

const buildUser = (profile, email) => ({
    ...profile,
    email: profile?.email || email || null,
});

const useAuthStore = create((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    /**
     * Restore session on app load via supabase.auth.getSession().
     */
    hydrate: async () => {
        set({ isLoading: true });
        try {
            const {
                data: { session },
                error,
            } = await supabase.auth.getSession();
            if (error) throw error;

            if (!session?.user) {
                set({ user: null, isAuthenticated: false });
                return;
            }

            const profile = await fetchProfile(session.user.id);
            set({
                user: buildUser(profile, session.user.email),
                isAuthenticated: true,
            });
        } catch {
            set({ user: null, isAuthenticated: false });
        } finally {
            set({ isLoading: false });
        }
    },

    /**
     * Sign up with email/password. Profile row is created by the DB trigger.
     * @returns {{ user: object|null, needsEmailConfirmation: boolean }}
     */
    signup: async ({ email, password, name, rollNo, role, department, year }) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    roll_no: rollNo,
                    role,
                    department: department ?? '',
                    year: year != null && year !== '' ? String(year) : '',
                },
            },
        });
        if (error) throw error;

        if (!data.session) {
            set({ user: null, isAuthenticated: false });
            return { user: null, needsEmailConfirmation: true };
        }

        const profile = await fetchProfile(data.user.id);
        const user = buildUser(profile, data.user.email);
        set({ user, isAuthenticated: true });
        return { user, needsEmailConfirmation: false };
    },

    /**
     * Sign in with email/password.
     * @returns {object} profiles row plus email
     */
    login: async ({ email, password }) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;

        const profile = await fetchProfile(data.user.id);
        const user = buildUser(profile, data.user.email);
        set({ user, isAuthenticated: true });
        return user;
    },

    /**
     * Sign out and clear local auth state.
     */
    logout: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        set({ user: null, isAuthenticated: false, isLoading: false });
    },
}));

export default useAuthStore;
