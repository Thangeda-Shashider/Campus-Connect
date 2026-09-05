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
