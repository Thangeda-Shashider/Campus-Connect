import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    Award,
    Download,
    Filter,
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    Search,
    Building2,
    Calendar,
} from 'lucide-react';
import {
    getAllAchievements,
    reviewAchievement,
    getProofFileUrl,
    exportAchievementsCsv,
} from '../../lib/api/achievements.js';
import { formatDate } from '../../utils/formatDate.js';
import { cn } from '../../lib/utils.js';

const ManageAchievements = () => {
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1); // Default to current month
    const [year, setYear] = useState(now.getFullYear());
    const [status, setStatus] = useState('');
    const [department, setDepartment] = useState('CSE'); // Default to CSE as per requirements
    
    // Action state
    const [isUpdating, setIsUpdating] = useState(null); // stores achievement ID being updated
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(null); // stores achievement ID

    const fetchAchievements = async () => {
        setLoading(true);
        try {
            const data = await getAllAchievements({
                month: month ? Number(month) : undefined,
                year: year ? Number(year) : undefined,
                status: status || undefined,
                department: department || undefined,
            });
            setAchievements(data || []);
        } catch (err) {
            toast.error('Failed to load achievements');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAchievements();
    }, [month, year, status, department]);

    const handleExportCSV = () => {
        try {
            exportAchievementsCsv(achievements, `achievements-${month || 'all'}-${year || 'all'}.csv`);
            toast.success('CSV exported successfully');
        } catch (err) {
            toast.error('Failed to export CSV');
        }
    };

    const handleViewProof = async (proofUrl) => {
        if (!proofUrl) {
            toast.error('No proof file available');
            return;
        }
        if (proofUrl.startsWith('http://') || proofUrl.startsWith('https://')) {
            window.open(proofUrl, '_blank');
            return;
        }
        try {
            const signedUrl = await getProofFileUrl(proofUrl);
            window.open(signedUrl, '_blank');
        } catch {
            toast.error('Failed to load proof file');
        }
    };

    const updateStatus = async (id, newStatus, reason = null) => {
        setIsUpdating(id);
        try {
            await reviewAchievement(id, newStatus, reason);
            toast.success(`Achievement marked as ${newStatus}`);
            setShowRejectModal(null);
            setRejectReason('');
            fetchAchievements(); // Refresh list to get updated data
        } catch (err) {
            toast.error(err.message || 'Failed to update status');
        } finally {
            setIsUpdating(null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Award className="w-7 h-7 text-indigo-500" />
                        Student Achievements
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Review and approve department certifications and workshop proofs.
                    </p>
                </div>
                <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border dark:border-gray-800 shadow-sm mb-6 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium mr-2">
                    <Filter className="w-4 h-4" />
                    Filters:
                </div>
                
                <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="px-3 py-1.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                >
                    <option value="">All Departments</option>
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="IT">IT</option>
                </select>

                <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="px-3 py-1.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                >
                    <option value="">All Months</option>
                    {[...Array(12)].map((_, i) => (
                        <option key={i+1} value={i+1}>
                            {new Date(0, i).toLocaleString('default', { month: 'long' })}
                        </option>
                    ))}
                </select>

                <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="px-3 py-1.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                >
                    <option value="">All Years</option>
                    {[now.getFullYear(), now.getFullYear() - 1].map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>

                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="px-3 py-1.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b dark:border-gray-800">
                            <tr>
                                <th className="px-6 py-4 font-medium">Student</th>
                                <th className="px-6 py-4 font-medium">Achievement</th>
                                <th className="px-6 py-4 font-medium">Details</th>
                                <th className="px-6 py-4 font-medium">Proof</th>
                                <th className="px-6 py-4 font-medium text-center">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center">
                                        <div className="animate-pulse flex flex-col items-center">
                                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                                            <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : achievements.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <Award className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                        <p className="text-gray-500 dark:text-gray-400">No achievements found matching your filters.</p>
                                    </td>
                                </tr>
                            ) : (
                                achievements.map((a) => {
                                    const achId = a.id || a._id;
                                    const student = a.profiles || a.student || {};
                                    const proofUrl = a.proof_file_url || a.proofFileUrl;
                                    const issuingOrg = a.issuing_organization || a.issuingOrganization;
                                    const compDate = a.completion_date || a.completionDate;
                                    const rejReason = a.rejection_reason || a.rejectionReason;

                                    return (
                                    <tr key={achId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        {/* Student Info */}
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {student.name || 'Unknown'}
                                            </div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                                                <span>{student.department || 'N/A'}</span>
                                                <span>•</span>
                                                <span>Year {student.year || 'N/A'}</span>
                                            </div>
                                            <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[150px]">
                                                {student.email}
                                            </div>
                                        </td>

                                        {/* Achievement Info */}
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white max-w-[200px] truncate" title={a.title}>
                                                {a.title}
                                            </div>
                                            <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mt-1">
                                                {a.type}
                                            </div>
                                        </td>

                                        {/* Details */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                <Building2 className="w-3.5 h-3.5" />
                                                <span className="truncate max-w-[150px]" title={issuingOrg}>
                                                    {issuingOrg}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatDate(compDate)}
                                            </div>
                                        </td>

                                        {/* Proof */}
                                        <td className="px-6 py-4">
                                            <button
                                                type="button"
                                                onClick={() => handleViewProof(proofUrl)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                                            >
                                                <FileText className="w-3.5 h-3.5" />
                                                View File
                                            </button>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center justify-center">
                                                {a.status === 'approved' ? (
                                                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full font-medium">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                                                    </span>
                                                ) : a.status === 'rejected' ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="flex items-center gap-1 text-xs px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full font-medium">
                                                            <XCircle className="w-3.5 h-3.5" /> Rejected
                                                        </span>
                                                        <span className="text-[10px] text-red-500 mt-1 max-w-[100px] truncate" title={rejReason}>
                                                            {rejReason}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full font-medium">
                                                        <Clock className="w-3.5 h-3.5" /> Pending
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 text-right">
                                            {a.status === 'pending' ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => updateStatus(achId, 'approved')}
                                                        disabled={isUpdating === achId}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setShowRejectModal(achId)}
                                                        disabled={isUpdating === achId}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Reject"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">No actions available</span>
                                            )}
                                        </td>
                                    </tr>
                                );})
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b dark:border-gray-800">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reject Achievement</h3>
                            <p className="text-sm text-gray-500 mt-1">Please provide a reason for rejection.</p>
                        </div>
                        <div className="p-6">
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="e.g. Blurry image, invalid certificate..."
                                rows="3"
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-sm outline-none transition-colors dark:text-white resize-none"
                            ></textarea>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-800 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(null);
                                    setRejectReason('');
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => updateStatus(showRejectModal, 'rejected', rejectReason)}
                                disabled={!rejectReason.trim()}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageAchievements;
