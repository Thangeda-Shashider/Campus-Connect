import { useState, useEffect, useRef } from 'react';
import { 
    Mail, Hash, GraduationCap, Phone, Sparkles, Building2,
    X, Check, Plus, ExternalLink, Loader2, LogOut, ChevronDown 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import { updateProfile } from '../lib/api/auth.js';
import toast from 'react-hot-toast';

const PRESET_INTERESTS = [
    'Web Dev', 'AI / ML', 'Mobile Dev', 'Cybersecurity', 
    'Cloud / DevOps', 'UI/UX Design', 'Robotics', 
    'Competitive Programming', 'Data Science', 'IoT'
];

const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'IT', 'MECH', 'CIVIL', 'MBA', 'MCA', 'Other'];
const YEARS = [1, 2, 3, 4];

const roleStyles = {
    student: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    organizer: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    admin: 'bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
};

export default function ProfilePopover({ onLogout }) {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [phone, setPhone] = useState(user?.phone || '');
    const [department, setDepartment] = useState(user?.department || '');
    const [year, setYear] = useState(user?.year || '');
    const [interests, setInterests] = useState(user?.interests || []);
    const [customTag, setCustomTag] = useState('');

    const popoverRef = useRef(null);

    useEffect(() => {
        if (isOpen && user) {
            setPhone(user.phone || '');
            setDepartment(user.department || '');
            setYear(user.year || '');
            setInterests(Array.isArray(user.interests) ? user.interests : []);
        }
    }, [isOpen, user]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const toggleInterest = (interest) => {
        setInterests((prev) => 
            prev.includes(interest) 
                ? prev.filter((i) => i !== interest) 
                : [...prev, interest]
        );
    };

    const addCustomTag = (e) => {
        e.preventDefault();
        const trimmed = customTag.trim();
        if (trimmed && !interests.includes(trimmed)) {
            setInterests((prev) => [...prev, trimmed]);
            setCustomTag('');
        }
    };

    const removeInterest = (item) => {
        setInterests((prev) => prev.filter((i) => i !== item));
    };

    const handleSave = async (e) => {
        e?.preventDefault();
        if (!user?.id) return;
        setIsSaving(true);
        try {
            const updates = {
                phone: phone.trim() || null,
                department: department || null,
                year: year ? Number(year) : null,
                interests,
            };
            await updateProfile(user.id, updates);
            updateUser(updates);
            toast.success('Profile updated!');
        } catch (err) {
            console.error('Profile update error:', err);
            toast.error(err.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const getDashboardPath = () => {
        if (user?.role === 'organizer') return '/organizer/manage';
        if (user?.role === 'admin') return '/admin';
        return '/dashboard';
    };

    const roleBadge = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Student';

    return (
        <div className="relative inline-block" ref={popoverRef}>
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer border border-transparent hover:border-indigo-300 dark:hover:border-indigo-700"
                aria-expanded={isOpen}
                aria-haspopup="true"
                title="View & Edit Profile"
            >
                <div className="w-6 h-6 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-white">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                    </span>
                </div>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 max-w-[110px] truncate text-left">
                    {user?.name || 'Account'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-[340px] sm:w-[380px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-white dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-gray-900 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-indigo-500/20 shrink-0">
                                    {user?.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-base font-bold text-gray-900 dark:text-white truncate">{user?.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${roleStyles[user?.role] || roleStyles.student}`}>
                                            {roleBadge}
                                        </span>
                                        {user?.roll_no && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{user.roll_no}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                        {/* Read-only account info */}
                        <div className="space-y-2 text-xs bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span className="truncate">{user?.email || 'No email attached'}</span>
                            </div>
                            {user?.roll_no && (
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                    <Hash className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                    <span>ID / Roll No: <span className="font-mono font-medium">{user.roll_no}</span></span>
                                </div>
                            )}
                        </div>

                        {/* Mobile Number */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-indigo-500" />
                                Mobile Number
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="10-digit mobile number"
                                className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-400"
                            />
                        </div>

                        {/* Department + Year */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                                    Department
                                </label>
                                <select
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                >
                                    <option value="">Select</option>
                                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                                    <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
                                    Year Studying
                                </label>
                                <select
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                >
                                    <option value="">Select</option>
                                    {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Areas of Interest */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                    Areas of Interest
                                </label>
                                <span className="text-[10px] text-gray-400">{interests.length} selected</span>
                            </div>

                            {interests.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {interests.map((item) => (
                                        <span key={item} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                            {item}
                                            <button type="button" onClick={() => removeInterest(item)} className="hover:text-red-500 transition-colors">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1.5">Tap to toggle interests:</div>
                            <div className="flex flex-wrap gap-1 mb-2.5">
                                {PRESET_INTERESTS.map((item) => {
                                    const isSelected = interests.includes(item);
                                    return (
                                        <button
                                            key={item}
                                            type="button"
                                            onClick={() => toggleInterest(item)}
                                            className={`text-[11px] px-2 py-0.5 rounded-full transition-colors cursor-pointer border ${
                                                isSelected
                                                    ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-400'
                                            }`}
                                        >
                                            {isSelected ? '✓ ' : '+ '}{item}
                                        </button>
                                    );
                                })}
                            </div>

                            <form onSubmit={addCustomTag} className="flex gap-1.5">
                                <input
                                    type="text"
                                    value={customTag}
                                    onChange={(e) => setCustomTag(e.target.value)}
                                    placeholder="Add custom interest..."
                                    className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-gray-400"
                                />
                                <button
                                    type="submit"
                                    disabled={!customTag.trim()}
                                    className="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium disabled:opacity-50 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-3 bg-gray-50 dark:bg-gray-900/90 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2">
                        <button
                            type="button"
                            onClick={() => { setIsOpen(false); navigate(getDashboardPath()); }}
                            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1"
                        >
                            <span>Dashboard</span>
                            <ExternalLink className="w-3 h-3" />
                        </button>
                        <div className="flex items-center gap-2">
                            {onLogout && (
                                <button
                                    type="button"
                                    onClick={() => { setIsOpen(false); onLogout(); }}
                                    className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                    title="Log Out"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors shadow-sm disabled:opacity-60"
                            >
                                {isSaving ? (
                                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Saving...</span></>
                                ) : (
                                    <><Check className="w-3.5 h-3.5" /><span>Save</span></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
