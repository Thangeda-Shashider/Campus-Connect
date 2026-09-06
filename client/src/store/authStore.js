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
     * Role is always 'student' by default — admin promotes via Manage Users.
     * @returns {{ user: object|null, needsEmailConfirmation: boolean }}
     */
    signup: async ({ email, password, name, rollNo, department, year }) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    roll_no: rollNo,
                    role: 'student',
                    email,
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

        // Store email on profile row for roll-no login lookup
        await supabase.from('profiles').update({ email }).eq('id', data.user.id);

        const profile = await fetchProfile(data.user.id);
        const user = buildUser(profile, data.user.email);
        set({ user, isAuthenticated: true });
        return { user, needsEmailConfirmation: false };
    },

    /**
     * Sign in with email or roll number / faculty ID.
     * If identifier is not an email, look up the email from profiles.roll_no first.
     * @param {{ identifier: string, password: string }} credentials
     * @returns {object} profiles row plus email
     */
    login: async ({ identifier, password }) => {
        let email = identifier.trim();

        // If the identifier is not an email, resolve it via roll_no in profiles
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!isEmail) {
            const { data: profile, error: lookupError } = await supabase
                .from('profiles')
                .select('email')
                .eq('roll_no', email.toUpperCase())
                .maybeSingle();

            if (lookupError) throw lookupError;
            if (!profile?.email) throw new Error('No account found for that Roll No / Faculty ID.');
            email = profile.email;
        }

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
     * Update local user state immediately after a profile edit.
     * @param {object} updatedFields
     */
    updateUser: (updatedFields) => {
        set((state) => ({
            user: state.user ? { ...state.user, ...updatedFields } : null,
        }));
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
