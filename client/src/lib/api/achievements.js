import { supabase } from '../supabase.js';

/**
 * Submit a new achievement. The student_id is set to the currently authenticated user.
 * Proof file upload should happen before calling this — pass the returned file path as proof_file_url.
 * @param {object} achievementData
 * @param {string} achievementData.title
 * @param {string} achievementData.type
 * @param {string} achievementData.issuing_organization
 * @param {string} achievementData.completion_date - ISO date string (YYYY-MM-DD)
 * @param {string} [achievementData.description]
 * @param {string} [achievementData.proof_file_url] - path in achievement-proofs bucket
 * @param {string} [achievementData.proof_file_name] - original filename for display
 * @returns {Promise<object>} created achievements row
 */
export const submitAchievement = async (achievementData) => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const { data, error } = await supabase
        .from('achievements')
        .insert({ ...achievementData, student_id: user.id })
        .select()
        .single();
    if (error) throw error;
    return data;
};

/**
 * Get all achievements for the currently authenticated student.
 * @param {{ month?: number, year?: number, status?: string }} [filters]
 * @returns {Promise<object[]>}
 */
export const getMyAchievements = async (filters = {}) => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    let query = supabase
        .from('achievements')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

    if (filters.month) query = query.eq('completion_month', filters.month);
    if (filters.year) query = query.eq('completion_year', filters.year);
    if (filters.status) query = query.eq('status', filters.status);

    const { data, error } = await query;
    if (error) throw error;
    return data;
};

/**
 * Get all achievements across all students (admin only via RLS).
 * @param {{ month?: number, year?: number, status?: string, department?: string, search?: string }} [filters]
 * @returns {Promise<object[]>}
 */
export const getAllAchievements = async (filters = {}) => {
    let query = supabase
        .from('achievements')
        .select('*, profiles(id, name, email, roll_no, department, year)')
        .order('created_at', { ascending: false });

    if (filters.month) query = query.eq('completion_month', filters.month);
    if (filters.year) query = query.eq('completion_year', filters.year);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.search) {
        query = query.or(
            `title.ilike.%${filters.search}%,issuing_organization.ilike.%${filters.search}%`
        );
    }

    const { data, error } = await query;
    if (error) throw error;

    // Filter by department after joining profiles (PostgREST doesn't support filtering on joined columns directly)
    if (filters.department && data) {
        return data.filter((a) => a.profiles?.department === filters.department);
    }

    return data;
};

/**
 * Update the status of an achievement (admin only via RLS).
 * @param {string} achievementId
 * @param {'approved' | 'rejected'} status
 * @param {string} [rejectionReason]
 * @returns {Promise<object>} updated achievements row
 */
export const reviewAchievement = async (achievementId, status, rejectionReason = null) => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const { data, error } = await supabase
        .from('achievements')
        .update({
            status,
            rejection_reason: status === 'rejected' ? rejectionReason : null,
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', achievementId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

/**
 * Upload a proof file to the private achievement-proofs bucket.
 * Returns the storage path (not a public URL — it's a private bucket).
 * Use getProofFileUrl() to get a signed URL for viewing.
 * @param {string} userId
 * @param {File} file
 * @returns {Promise<{ path: string, name: string }>}
 */
export const uploadProofFile = async (userId, file) => {
    const filePath = `${userId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
        .from('achievement-proofs')
        .upload(filePath, file);
    if (error) throw error;
    return { path: filePath, name: file.name };
};

/**
 * Get a signed URL for viewing a private achievement proof file.
 * @param {string} filePath - path in achievement-proofs bucket
 * @param {number} [expiresIn=3600] - seconds
 * @returns {Promise<string>} signed URL
 */
export const getProofFileUrl = async (filePath, expiresIn = 3600) => {
    const { data, error } = await supabase.storage
        .from('achievement-proofs')
        .createSignedUrl(filePath, expiresIn);
    if (error) throw error;
    return data.signedUrl;
};

/**
 * Build and download a CSV of achievements (client-side, no server needed).
 * Pass in the achievements array (already fetched from getAllAchievements).
 * @param {object[]} achievements - rows from getAllAchievements (with profiles joined)
 * @param {string} [filename='achievements.csv']
 */
export const exportAchievementsCsv = (achievements, filename = 'achievements.csv') => {
    const headers = [
        'Student Name',
        'Roll No',
        'Department',
        'Year',
        'Title',
        'Type',
        'Issuing Organization',
        'Completion Date',
        'Status',
        'Submission Date',
    ];

    const rows = achievements.map((a) => [
        a.profiles?.name ?? '',
        a.profiles?.roll_no ?? '',
        a.profiles?.department ?? '',
        a.profiles?.year ?? '',
        a.title,
        a.type,
        a.issuing_organization,
        a.completion_date,
        a.status,
        a.created_at ? new Date(a.created_at).toLocaleDateString() : '',
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
