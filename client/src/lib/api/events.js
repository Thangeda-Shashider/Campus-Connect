import { supabase } from '../supabase.js';

/**
 * Fetch all events with organizer name, optional filters, and registration counts.
 * @param {{ category?: string, status?: string, search?: string, organizerId?: string }} [filters]
 * @returns {Promise<object[]>}
 */
export const getEvents = async (filters = {}) => {
    let query = supabase
        .from('events')
        .select('*, profiles(id, name, email)')
        .order('date', { ascending: true });

    if (filters.category) query = query.eq('category', filters.category);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.organizerId) query = query.eq('organizer_id', filters.organizerId);
    if (filters.search) {
        query = query.or(
            `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,venue.ilike.%${filters.search}%`
        );
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
};

/**
 * Fetch a single event by ID, joined with organizer profile.
 * @param {string} eventId
 * @returns {Promise<object>}
 */
export const getEventById = async (eventId) => {
    const { data, error } = await supabase
        .from('events')
        .select('*, profiles(id, name, email)')
        .eq('id', eventId)
        .single();
    if (error) throw error;
    return data;
};

/**
 * Get registration count for an event.
 * @param {string} eventId
 * @returns {Promise<number>}
 */
export const getEventRegistrationCount = async (eventId) => {
    const { count, error } = await supabase
        .from('registrations')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId);
    if (error) throw error;
    return count ?? 0;
};

/**
 * Create a new event. The caller must be authenticated as organizer or admin.
 * @param {object} eventData
 * @returns {Promise<object>} created event row
 */
export const createEvent = async (eventData) => {
    const { data, error } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single();
    if (error) throw error;
    return data;
};

/**
 * Update an event. Only the owning organizer or admin can do this (enforced by RLS).
 * @param {string} eventId
 * @param {object} updates
 * @returns {Promise<object>} updated event row
 */
export const updateEvent = async (eventId, updates) => {
    const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', eventId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

/**
 * Delete an event. Only the owning organizer or admin can do this (enforced by RLS).
 * @param {string} eventId
 * @returns {Promise<void>}
 */
export const deleteEvent = async (eventId) => {
    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);
    if (error) throw error;
};

/**
 * Upload an event banner image to Supabase Storage and return the public URL.
 * @param {string} organizerId
 * @param {File} file
 * @returns {Promise<string>} public URL
 */
export const uploadEventBanner = async (organizerId, file) => {
    const filePath = `${organizerId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
        .from('event-banners')
        .upload(filePath, file);
    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from('event-banners')
        .getPublicUrl(filePath);

    return publicUrl;
};

/**
 * Upload a payment QR code image to Supabase Storage and return the public URL.
 * @param {string} organizerId
 * @param {File} file
 * @returns {Promise<string>} public URL
 */
export const uploadPaymentQr = async (organizerId, file) => {
    const filePath = `${organizerId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
        .from('payment-qr')
        .upload(filePath, file);
    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from('payment-qr')
        .getPublicUrl(filePath);

    return publicUrl;
};
