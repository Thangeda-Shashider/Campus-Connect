import { supabase } from '../supabase.js';

/**
 * Register the current user for an event.
 * @param {{ eventId: string, formResponses?: object }} payload
 * @returns {Promise<object>} new registrations row
 */
export const registerForEvent = async ({ eventId, formResponses = {} }) => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const { data, error } = await supabase
        .from('registrations')
        .insert({
            user_id: user.id,
            event_id: eventId,
            form_responses: formResponses,
        })
        .select()
        .single();
    if (error) throw error;
    return data;
};

/**
 * Check if the current user is registered for a given event.
 * @param {string} eventId
 * @returns {Promise<object|null>} registrations row or null
 */
export const getMyRegistration = async (eventId) => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .maybeSingle();
    if (error) throw error;
    return data;
};

/**
 * Get all registrations for the current user, joined with event details.
 * @returns {Promise<object[]>}
 */
export const getMyRegistrations = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const { data, error } = await supabase
        .from('registrations')
        .select('*, events(id, title, date, venue, status, banner_url, category, organizer_id, has_certificate, payment_required, payment_amount, payment_qr_url)')
        .eq('user_id', user.id)
        .order('registered_at', { ascending: false });
    if (error) throw error;
    return data;
};

/**
 * Get all registrations for a specific event (organizer/admin only via RLS).
 * @param {string} eventId
 * @returns {Promise<object[]>}
 */
export const getEventRegistrants = async (eventId) => {
    const { data, error } = await supabase
        .from('registrations')
        .select('*, profiles(id, name, email, roll_no, department, year)')
        .eq('event_id', eventId)
        .order('registered_at', { ascending: false });
    if (error) throw error;
    return data;
};

/**
 * Toggle attendance for a registrant (organizer/admin only via RLS).
 * @param {string} registrationId
 * @param {boolean} attended
 * @returns {Promise<object>} updated row
 */
export const toggleAttendance = async (registrationId, attended) => {
    const { data, error } = await supabase
        .from('registrations')
        .update({ attended })
        .eq('id', registrationId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

/**
 * Mark attendance by QR token. Used by the check-in scanner.
 * @param {string} qrToken - the unique qr_token value on the registration
 * @returns {Promise<object>} updated registrations row joined with event and profile
 */
export const checkInByQrToken = async (qrToken) => {
    // First look up the registration
    const { data: reg, error: findError } = await supabase
        .from('registrations')
        .select('*, profiles(name, email, roll_no), events(title, date, venue)')
        .eq('qr_token', qrToken)
        .single();
    if (findError) throw findError;

    if (reg.attended) return reg; // already checked in

    const { data, error } = await supabase
        .from('registrations')
        .update({ attended: true })
        .eq('id', reg.id)
        .select('*, profiles(name, email, roll_no), events(title, date, venue)')
        .single();
    if (error) throw error;
    return data;
};

/**
 * Issue (or revoke) a certificate for a registrant (organizer/admin only via RLS).
 * @param {string} registrationId
 * @param {boolean} issued
 * @returns {Promise<object>} updated row
 */
export const setCertificateIssued = async (registrationId, issued) => {
    const { data, error } = await supabase
        .from('registrations')
        .update({
            certificate_issued: issued,
            certificate_issued_at: issued ? new Date().toISOString() : null,
        })
        .eq('id', registrationId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

/**
 * Upload a payment screenshot (student action). Saves to private bucket and updates the row.
 * @param {string} registrationId
 * @param {string} userId - for storage path scoping
 * @param {File} file
 * @returns {Promise<object>} updated registrations row
 */
export const uploadPaymentScreenshot = async (registrationId, userId, file) => {
    const filePath = `${userId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(filePath, file);
    if (uploadError) throw uploadError;

    // Private bucket — store path, not public URL
    const { data, error } = await supabase
        .from('registrations')
        .update({
            payment_screenshot_url: filePath,
            payment_status: 'pending',
        })
        .eq('id', registrationId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

/**
 * Get a signed URL for a private payment screenshot (organizer/admin only).
 * @param {string} filePath - stored path in payment-screenshots bucket
 * @param {number} [expiresIn=3600] - seconds
 * @returns {Promise<string>} signed URL
 */
export const getPaymentScreenshotUrl = async (filePath, expiresIn = 3600) => {
    const { data, error } = await supabase.storage
        .from('payment-screenshots')
        .createSignedUrl(filePath, expiresIn);
    if (error) throw error;
    return data.signedUrl;
};

/**
 * Verify a student's payment (organizer/admin only via RLS).
 * @param {string} registrationId
 * @returns {Promise<object>} updated row
 */
export const verifyPayment = async (registrationId) => {
    const { data, error } = await supabase
        .from('registrations')
        .update({
            payment_status: 'verified',
            payment_verified_at: new Date().toISOString(),
            payment_rejection_reason: null,
        })
        .eq('id', registrationId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

/**
 * Reject a student's payment (organizer/admin only via RLS).
 * @param {string} registrationId
 * @param {string} reason
 * @returns {Promise<object>} updated row
 */
export const rejectPayment = async (registrationId, reason) => {
    const { data, error } = await supabase
        .from('registrations')
        .update({
            payment_status: 'rejected',
            payment_rejection_reason: reason,
        })
        .eq('id', registrationId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

/**
 * Cancel (delete) the current user's own registration.
 * @param {string} registrationId
 * @returns {Promise<void>}
 */
export const cancelRegistration = async (registrationId) => {
    const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', registrationId);
    if (error) throw error;
};

/**
 * Export event registrants to client-side CSV download.
 * @param {object[]} registrants - rows from getEventRegistrants (profiles joined)
 * @param {string} [eventTitle='event']
 */
export const exportRegistrantsCsv = (registrants, eventTitle = 'event') => {
    const headers = ['Name', 'Email', 'Roll No', 'Department', 'Year', 'Attended', 'Payment Status', 'Registered At'];
    const rows = registrants.map((r) => [
        r.profiles?.name ?? '',
        r.profiles?.email ?? '',
        r.profiles?.roll_no ?? '',
        r.profiles?.department ?? '',
        r.profiles?.year ?? '',
        r.attended ? 'Yes' : 'No',
        r.payment_status ?? 'not_required',
        r.registered_at ? new Date(r.registered_at).toLocaleDateString() : '',
    ]);

    const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${eventTitle.toLowerCase().replace(/[^a-z0-9]/gi, '_')}_registrants.csv`;
    link.click();
    URL.revokeObjectURL(url);
};

