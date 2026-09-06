import { supabase } from '../supabase.js';

/**
 * Fetch a single profile row by user ID.
 * @param {string} userId
 * @returns {Promise<object>} profiles row
 */
export const getProfile = async (userId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (error) throw error;
    return data;
};

/**
 * Look up the auth email for a given roll number or identifier.
 * Used to allow login via Roll No / Faculty ID instead of email.
 * @param {string} identifier - roll_no value stored in profiles
 * @returns {Promise<string>} email address associated with that roll number
 */
export const getEmailByIdentifier = async (identifier) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, roll_no')
        .eq('roll_no', identifier.trim().toUpperCase())
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('No account found with that Roll Number / Faculty ID.');

    // Fetch the auth user's email via getUser on the session — not possible client-side
    // for other users. Instead, store email on profiles during signup for lookup.
    const { data: profileWithEmail, error: emailError } = await supabase
        .from('profiles')
        .select('id, roll_no, name')
        .eq('id', data.id)
        .single();

    if (emailError) throw emailError;
    // We can't read auth.users.email from client — we store email in profiles at signup.
    // Return the profile so the caller can resolve the email.
    return profileWithEmail;
};

/**
 * Update the current user's own profile fields.
 * @param {string} userId
 * @param {object} updates - partial profiles fields (name, department, year, interests, avatar_url)
 * @returns {Promise<object>} updated profiles row
 */
export const updateProfile = async (userId, updates) => {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

/**
 * Upload a new avatar image and update the profile's avatar_url.
 * @param {string} userId
 * @param {File} file
 * @returns {Promise<string>} public URL of the uploaded avatar
 */
export const uploadAvatar = async (userId, file) => {
    const filePath = `avatars/${userId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
        .from('event-banners') // reuse the public bucket for avatars
        .upload(filePath, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
        .from('event-banners')
        .getPublicUrl(filePath);

    await updateProfile(userId, { avatar_url: publicUrl });
    return publicUrl;
};
