import { supabase } from '../supabase.js';

/**
 * Get all users (profiles rows). Admin only via RLS.
 * @param {{ role?: string, search?: string, department?: string }} [filters]
 * @returns {Promise<object[]>}
 */
export const getAllUsers = async (filters = {}) => {
    let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (filters.role) query = query.eq('role', filters.role);
    if (filters.department) query = query.eq('department', filters.department);
    if (filters.search) {
        query = query.or(
            `name.ilike.%${filters.search}%,roll_no.ilike.%${filters.search}%`
        );
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
};

/**
 * Update a user's role. Admin only via RLS.
 * @param {string} userId
 * @param {'student' | 'organizer' | 'admin'} role
 * @returns {Promise<object>} updated profiles row
 */
export const updateUserRole = async (userId, role) => {
    const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

/**
 * Update any field on a user's profile. Admin only via RLS.
 * @param {string} userId
 * @param {object} updates - partial profiles fields
 * @returns {Promise<object>} updated profiles row
 */
export const adminUpdateUser = async (userId, updates) => {
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
 * Get platform-wide statistics for the Admin Dashboard.
 * Returns totalUsers, totalEvents, registrationsThisMonth, and attendanceRate.
 * @returns {Promise<{ totalUsers: number, totalEvents: number, registrationsThisMonth: number, attendanceRate: number }>}
 */
export const getPlatformStats = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
        { count: totalUsers, error: usersError },
        { count: totalEvents, error: eventsError },
        { count: registrationsThisMonth, error: regError },
        { data: attendanceData, error: attendanceError },
    ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase
            .from('registrations')
            .select('id', { count: 'exact', head: true })
            .gte('registered_at', startOfMonth),
        supabase
            .from('registrations')
            .select('attended'),
    ]);

    if (usersError) throw usersError;
    if (eventsError) throw eventsError;
    if (regError) throw regError;
    if (attendanceError) throw attendanceError;

    const totalRegistrations = attendanceData?.length ?? 0;
    const attended = attendanceData?.filter((r) => r.attended).length ?? 0;
    const attendanceRate =
        totalRegistrations > 0
            ? Math.round((attended / totalRegistrations) * 100)
            : 0;

    return {
        totalUsers: totalUsers ?? 0,
        totalEvents: totalEvents ?? 0,
        registrationsThisMonth: registrationsThisMonth ?? 0,
        attendanceRate,
    };
};

/**
 * Get all events for admin management (joined with organizer profile and registration count).
 * @param {{ status?: string, search?: string }} [filters]
 * @returns {Promise<object[]>}
 */
export const adminGetAllEvents = async (filters = {}) => {
    let query = supabase
        .from('events')
        .select('*, profiles(id, name, email)')
        .order('date', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.search) {
        query = query.or(
            `title.ilike.%${filters.search}%,venue.ilike.%${filters.search}%`
        );
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
};

/**
 * Admin force-update an event's status (e.g. cancel an event).
 * @param {string} eventId
 * @param {'upcoming' | 'ongoing' | 'completed' | 'cancelled'} status
 * @returns {Promise<object>} updated events row
 */
export const adminUpdateEventStatus = async (eventId, status) => {
    const { data, error } = await supabase
        .from('events')
        .update({ status })
        .eq('id', eventId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

/**
 * Admin delete an event (and its registrations cascade via FK).
 * @param {string} eventId
 * @returns {Promise<void>}
 */
export const adminDeleteEvent = async (eventId) => {
    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);
    if (error) throw error;
};

/**
 * Export all users to a client-side CSV download.
 * @param {object[]} users - array of profiles rows (already fetched)
 * @param {string} [filename='users.csv']
 */
export const exportUsersCsv = (users, filename = 'users.csv') => {
    const headers = ['Name', 'Email', 'Roll No', 'Role', 'Department', 'Year', 'Joined'];

    const rows = users.map((u) => [
        u.name ?? '',
        u.email ?? '',
        u.roll_no ?? '',
        u.role,
        u.department ?? '',
        u.year ?? '',
        u.created_at ? new Date(u.created_at).toLocaleDateString() : '',
    ]);

    const csv = [headers, ...rows]
        .map((row) =>
            row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        )
        .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};
