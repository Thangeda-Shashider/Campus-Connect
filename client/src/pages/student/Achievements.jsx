import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import {
    Award,
    Plus,
    UploadCloud,
    FileText,
    CheckCircle2,
    Clock,
    XCircle,
    Calendar,
    Building2,
    X,
} from 'lucide-react';
import {
    getMyAchievements,
    submitAchievement,
    uploadProofFile,
    getProofFileUrl,
} from '../../lib/api/achievements.js';
import useAuth from '../../hooks/useAuth.js';
import { formatDate } from '../../utils/formatDate.js';
import { cn } from '../../lib/utils.js';

// We'll hardcode the types for the client to avoid importing from server
const ACHIEVEMENT_TYPES = ['certification', 'workshop', 'seminar', 'webinar', 'other'];

const achievementSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    type: z.enum(['certification', 'workshop', 'seminar', 'webinar', 'other'], {
        required_error: 'Please select a type',
    }),
    issuingOrganization: z.string().min(2, 'Organization name is required'),
    completionDate: z.string().nonempty('Completion date is required'),
    description: z.string().max(1000, 'Description too long').optional(),
});

const Achievements = () => {
    const { user } = useAuth();
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    
    // File upload state
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        resolver: zodResolver(achievementSchema),
    });

    const fetchAchievements = async () => {
        setLoading(true);
        try {
            const data = await getMyAchievements();
            setAchievements(data || []);
        } catch (err) {
            toast.error('Failed to load achievements');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAchievements();
    }, []);

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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Limit to 5MB
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB');
            return;
        }

        setSelectedFile(file);
        
        // Generate preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => setPreviewUrl(reader.result);
            reader.readAsDataURL(file);
        } else {
            // For PDFs or other files, we don't show a direct visual preview, just the file name
            setPreviewUrl(null);
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const onSubmit = async (data) => {
        if (!selectedFile) {
            toast.error('Please upload a proof document (image or PDF)');
            return;
        }

        setIsSubmitting(true);
        try {
            const proofInfo = await uploadProofFile(user.id, selectedFile);
            await submitAchievement({
                title: data.title,
                type: data.type,
                issuing_organization: data.issuingOrganization,
                completion_date: data.completionDate,
                description: data.description || null,
                proof_file_url: proofInfo.path,
                proof_file_name: proofInfo.name,
            });
            toast.success('Achievement submitted successfully!');
            reset();
            clearFile();
            setShowForm(false);
            fetchAchievements();
        } catch (err) {
            toast.error(err.message || 'Submission failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Award className="w-7 h-7 text-indigo-500" />
                        My Achievements
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Upload your monthly certifications and workshop proofs for HOD review.
                    </p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add New
                    </button>
                )}
            </div>

            {/* Submission Form Modal / Panel */}
            {showForm && (
                <div className="mb-10 bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden transition-all">
                    <div className="px-6 py-4 border-b dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                        <h2 className="font-semibold text-gray-800 dark:text-white">Submit New Achievement</h2>
                        <button
                            onClick={() => {
                                setShowForm(false);
                                reset();
                                clearFile();
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Col: Details */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        {...register('title')}
                                        placeholder="e.g. AWS Solutions Architect"
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm outline-none transition-colors dark:text-white"
                                    />
                                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Type
                                        </label>
                                        <select
                                            {...register('type')}
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm outline-none transition-colors dark:text-white capitalize"
                                        >
                                            <option value="">Select type...</option>
                                            {ACHIEVEMENT_TYPES.map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                        {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Completion Date
                                        </label>
                                        <input
                                            type="date"
                                            {...register('completionDate')}
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm outline-none transition-colors dark:text-white"
                                        />
                                        {errors.completionDate && <p className="text-red-500 text-xs mt-1">{errors.completionDate.message}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Issuing Organization
                                    </label>
                                    <input
                                        type="text"
                                        {...register('issuingOrganization')}
                                        placeholder="e.g. Coursera, NPTEL"
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm outline-none transition-colors dark:text-white"
                                    />
                                    {errors.issuingOrganization && <p className="text-red-500 text-xs mt-1">{errors.issuingOrganization.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        {...register('description')}
                                        rows="2"
                                        placeholder="Key learnings or details..."
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm outline-none transition-colors dark:text-white resize-none"
                                    ></textarea>
                                </div>
                            </div>

                            {/* Right Col: File Upload */}
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Proof Document (Image/PDF)
                                </label>
                                <div className="flex-1 relative border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex flex-col items-center justify-center p-6 group">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/jpeg,image/png,application/pdf"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    
                                    {previewUrl ? (
                                        <div className="absolute inset-0 p-2 z-0">
                                            <div className="w-full h-full rounded-lg overflow-hidden bg-white dark:bg-gray-950 flex items-center justify-center shadow-sm">
                                                <img src={previewUrl} alt="Preview" className="max-h-full object-contain" />
                                            </div>
                                        </div>
                                    ) : selectedFile ? (
                                        <div className="text-center z-0">
                                            <FileText className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[200px] truncate">
                                                {selectedFile.name}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-center z-0">
                                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                                <UploadCloud className="w-6 h-6" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Click or drag to upload
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Max size: 5MB (JPG, PNG, PDF)
                                            </p>
                                        </div>
                                    )}
                                </div>
                                {selectedFile && (
                                    <button
                                        type="button"
                                        onClick={clearFile}
                                        className="mt-2 text-xs text-red-500 hover:text-red-600 font-medium self-end"
                                    >
                                        Remove file
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3 pt-6 border-t dark:border-gray-800">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    reset();
                                    clearFile();
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Achievement'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 rounded-2xl bg-gray-100 dark:bg-gray-800/50 animate-pulse" />
                    ))}
                </div>
            ) : achievements.length === 0 ? (
                !showForm && (
                    <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/20 rounded-3xl border border-dashed dark:border-gray-700">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Award className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No achievements yet</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                            You haven't uploaded any certifications or workshop proofs yet.
                        </p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Submit First Achievement
                        </button>
                    </div>
                )
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {achievements.map((a) => (
                        <AchievementCard
                            key={a.id || a._id}
                            achievement={a}
                            onViewProof={handleViewProof}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const AchievementCard = ({ achievement, onViewProof }) => {
    const proofUrl = achievement.proof_file_url || achievement.proofFileUrl;
    const issuingOrg = achievement.issuing_organization || achievement.issuingOrganization;
    const compDate = achievement.completion_date || achievement.completionDate;
    const createdAt = achievement.created_at || achievement.createdAt;
    const rejectionReason = achievement.rejection_reason || achievement.rejectionReason;

    return (
        <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            
            {/* Status badge */}
            <div className="absolute top-4 right-4">
                {achievement.status === 'approved' ? (
                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                    </span>
                ) : achievement.status === 'rejected' ? (
                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full font-medium">
                        <XCircle className="w-3.5 h-3.5" /> Rejected
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full font-medium">
                        <Clock className="w-3.5 h-3.5" /> Pending
                    </span>
                )}
            </div>

            <div className="mb-4 pr-24">
                <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1.5 block">
                    {achievement.type}
                </span>
                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                    {achievement.title}
                </h3>
            </div>

            <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Building2 className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="truncate">{issuingOrg}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span>Completed {formatDate(compDate)}</span>
                </div>
            </div>

            <div className="pt-4 border-t dark:border-gray-800 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                    Submitted {formatDate(createdAt)}
                </p>
                {proofUrl && (
                    <button
                        type="button"
                        onClick={() => onViewProof(proofUrl)}
                        className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                        <FileText className="w-3.5 h-3.5" />
                        View Proof
                    </button>
                )}
            </div>

            {/* Rejection Note */}
            {achievement.status === 'rejected' && rejectionReason && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg">
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">Rejection Reason:</p>
                    <p className="text-xs text-red-500 dark:text-red-300 mt-0.5">{rejectionReason}</p>
                </div>
            )}
        </div>
    );
};

export default Achievements;
