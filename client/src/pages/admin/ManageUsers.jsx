import { useEffect, useState } from 'react';
import { Trash2, Search, Plus, Pencil, CheckCircle, XCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';
import { formatDate } from '../../utils/formatDate.js';

const ROLES = ['student', 'organizer', 'admin'];

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES = {
    upcoming:  'bg-blue-500/20 text-blue-300 border border-blue-500/40',
    ongoing:   'bg-green-500/20 text-green-300 border border-green-500/40',
    completed: 'bg-gray-500/20 text-gray-300 border border-gray-500/40',
    cancelled: 'bg-red-500/20 text-red-300 border border-red-500/40',
};

const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[status] || STATUS_STYLES.upcoming}`}>
        {status}
    </span>
);

// ─── Edit User Modal ───────────────────────────────────────────────────────────
const EditUserModal = ({ user, onClose, onSave }) => {
    const [form, setForm] = useState({
        name: user.name || '',
        email: user.email || '',
        department: user.department || '',
        year: user.year || '',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(user._id, form);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
                    <h2 className="text-lg font-bold text-white">Edit User</h2>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Full Name</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full rounded-xl border border-gray-600 bg-gray-800 text-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                            placeholder="Full name"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Email</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full rounded-xl border border-gray-600 bg-gray-800 text-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                            placeholder="Email address"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Department</label>
                            <input
                                type="text"
                                value={form.department}
                                onChange={(e) => setForm({ ...form, department: e.target.value })}
                                className="w-full rounded-xl border border-gray-600 bg-gray-800 text-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                                placeholder="e.g. CSE"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Year</label>
                            <input
                                type="number"
                                min="1"
                                max="6"
                                value={form.year}
                                onChange={(e) => setForm({ ...form, year: e.target.value })}
                                className="w-full rounded-xl border border-gray-600 bg-gray-800 text-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                                placeholder="1–6"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-600 text-gray-300 text-sm font-semibold hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const ManageUsers = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('users');
    const [userSearch, setUserSearch] = useState('');
    const [eventSearch, setEventSearch] = useState('');
    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [uRes, eRes] = await Promise.all([
                    api.get('/admin/users'),
                    api.get('/admin/events'),
                ]);
                setUsers(uRes.data.data);
                setEvents(eRes.data.data);
            } catch {
                toast.error('Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // ── User actions ──────────────────────────────────────────────────────────
    const updateRole = async (id, role) => {
        try {
            await api.put(`/admin/users/${id}/role`, { role });
            setUsers((u) => u.map((user) => user._id === id ? { ...user, role } : user));
            toast.success('Role updated');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update role');
        }
    };

    const saveUser = async (id, data) => {
        try {
            const res = await api.put(`/admin/users/${id}`, data);
            setUsers((u) => u.map((user) => user._id === id ? { ...user, ...res.data.data } : user));
            toast.success('User updated');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update user');
            throw err;
        }
    };

    const deleteUser = async (id) => {
        if (!window.confirm('Permanently delete this user?')) return;
        try {
            await api.delete(`/admin/users/${id}`);
            setUsers((u) => u.filter((user) => user._id !== id));
            toast.success('User deleted');
        } catch {
            toast.error('Failed to delete user');
        }
    };

    // ── Event actions ─────────────────────────────────────────────────────────
    const setEventStatus = async (id, status) => {
        try {
            await api.put(`/admin/events/${id}/status`, { status });
            setEvents((e) => e.map((ev) => ev._id === id ? { ...ev, status } : ev));
            const msg = status === 'upcoming' ? '✅ Event approved & published' : '❌ Event cancelled';
            toast.success(msg);
        } catch {
            toast.error('Failed to update event status');
        }
    };

    // ── Filtered lists ────────────────────────────────────────────────────────
    const filteredUsers = users.filter((u) => {
        const q = userSearch.toLowerCase();
        return !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    });

    const filteredEvents = events.filter((ev) => {
        const q = eventSearch.toLowerCase();
        return !q || ev.title?.toLowerCase().includes(q) || ev.organizer?.name?.toLowerCase().includes(q);
    });

    const ROLE_COLORS = {
        student: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
        organizer: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
        admin: 'bg-red-500/20 text-red-300 border border-red-500/40',
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Edit modal */}
            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSave={saveUser}
                />
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Admin — User &amp; Event Management</h1>
                    <p className="text-gray-400 text-sm mt-1">Manage users, roles, and event publishing</p>
                </div>
                <button
                    onClick={() => navigate('/organizer/create')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all duration-150"
                >
                    <Plus className="w-4 h-4" />
                    Add Event
                </button>
            </div>

            {/* Tab toggle */}
            <div className="flex gap-1 p-1 rounded-xl w-fit mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {['users', 'events'].map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className="px-6 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-150"
                        style={tab === t
                            ? { backgroundColor: '#4f46e5', color: '#ffffff', boxShadow: '0 1px 8px rgba(79,70,229,0.5)' }
                            : { color: '#9ca3af' }
                        }
                    >
                        {t === 'users' ? `👤 Users (${users.length})` : `📅 Events (${events.length})`}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-14 rounded-xl animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
                    ))}
                </div>
            ) : tab === 'users' ? (
                <>
                    {/* User search */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            placeholder="Search users by name or email…"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                        {userSearch && (
                            <button onClick={() => setUserSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Users table */}
                    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide">Name</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide">Email</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide">Role</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide">Dept / Year</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide">Joined</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                                                {userSearch ? `No users matching "${userSearch}"` : 'No users found'}
                                            </td>
                                        </tr>
                                    ) : filteredUsers.map((u) => (
                                        <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                            className="hover:bg-white/5 transition-colors">
                                            <td className="px-5 py-3.5 font-semibold text-white">{u.name}</td>
                                            <td className="px-5 py-3.5 text-gray-400">{u.email}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${ROLE_COLORS[u.role]}`}>
                                                        {u.role}
                                                    </span>
                                                    <select
                                                        value={u.role}
                                                        onChange={(e) => updateRole(u._id, e.target.value)}
                                                        className="text-xs rounded-lg px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                        style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
                                                    >
                                                        {ROLES.map((r) => <option key={r} value={r} style={{ backgroundColor: '#1f2937' }}>{r}</option>)}
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-400 text-xs">
                                                {u.department ? `${u.department}${u.year ? ` · Y${u.year}` : ''}` : '—'}
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-500 text-xs">{formatDate(u.createdAt)}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => setEditingUser(u)}
                                                        title="Edit user"
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => deleteUser(u._id)}
                                                        title="Delete user"
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Event search */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            value={eventSearch}
                            onChange={(e) => setEventSearch(e.target.value)}
                            placeholder="Search events by title or organizer…"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                        {eventSearch && (
                            <button onClick={() => setEventSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Events table */}
                    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide">Title</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide">Organizer</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide">Date</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide">Status</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wide">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEvents.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-12 text-center text-gray-500">
                                                {eventSearch ? `No events matching "${eventSearch}"` : 'No events found'}
                                            </td>
                                        </tr>
                                    ) : filteredEvents.map((ev) => (
                                        <tr key={ev._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                            className="hover:bg-white/5 transition-colors">
                                            <td className="px-5 py-3.5 font-semibold text-white max-w-xs truncate">{ev.title}</td>
                                            <td className="px-5 py-3.5 text-gray-400">{ev.organizer?.name || '—'}</td>
                                            <td className="px-5 py-3.5 text-gray-500 text-xs">{formatDate(ev.date)}</td>
                                            <td className="px-5 py-3.5">
                                                <StatusBadge status={ev.status} />
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <button
                                                        onClick={() => setEventStatus(ev._id, 'upcoming')}
                                                        disabled={ev.status === 'upcoming'}
                                                        title="Approve & publish event"
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        <CheckCircle className="w-3 h-3" />
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => setEventStatus(ev._id, 'cancelled')}
                                                        disabled={ev.status === 'cancelled'}
                                                        title="Cancel event"
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        <XCircle className="w-3 h-3" />
                                                        Cancel
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ManageUsers;
