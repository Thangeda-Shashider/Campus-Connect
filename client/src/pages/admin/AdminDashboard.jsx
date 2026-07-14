import { useEffect, useState } from 'react';
import { Users, CalendarDays, ClipboardList, TrendingUp, Plus, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';

const StatCard = ({ icon, label, value, color }) => (
    <div className="rounded-2xl p-6 flex items-center gap-4 shadow-sm transition-all hover:scale-[1.02]"
        style={{ border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
        <div className={`p-3 rounded-xl ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-400">{label}</p>
            <p className="text-2xl font-bold text-white">{value ?? '–'}</p>
        </div>
    </div>
);

const QuickCard = ({ title, description, onClick, accent, icon }) => (
    <button
        onClick={onClick}
        className="block w-full text-left rounded-2xl p-6 transition-all hover:scale-[1.01] group"
        style={{ border: `1px solid rgba(255,255,255,0.08)`, backgroundColor: 'rgba(255,255,255,0.04)' }}
    >
        <div className="flex items-start gap-4">
            <div className={`p-2.5 rounded-xl ${accent} transition-transform group-hover:scale-110`}>
                {icon}
            </div>
            <div>
                <h2 className="font-semibold text-white mb-1">{title}</h2>
                <p className="text-sm text-gray-400">{description}</p>
            </div>
        </div>
    </button>
);

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/stats')
            .then((res) => setStats(res.data.data))
            .catch(() => setStats(null))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                    <p className="text-gray-400 text-sm mt-1">Platform-wide overview</p>
                </div>
                <button
                    onClick={() => navigate('/organizer/create')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Add Event
                </button>
            </div>

            {/* Stats grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard icon={<Users className="w-6 h-6 text-indigo-400" />} label="Total Users" value={stats?.totalUsers} color="bg-indigo-500/20" />
                    <StatCard icon={<CalendarDays className="w-6 h-6 text-purple-400" />} label="Total Events" value={stats?.totalEvents} color="bg-purple-500/20" />
                    <StatCard icon={<ClipboardList className="w-6 h-6 text-blue-400" />} label="Registrations This Month" value={stats?.registrationsThisMonth} color="bg-blue-500/20" />
                    <StatCard icon={<TrendingUp className="w-6 h-6 text-green-400" />} label="Attendance Rate" value={stats ? `${stats.attendanceRate}%` : null} color="bg-green-500/20" />
                </div>
            )}

            {/* Quick actions */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <QuickCard
                    title="Manage Users"
                    description="Edit profiles, change roles, deactivate accounts"
                    onClick={() => navigate('/admin/users')}
                    accent="bg-indigo-500/20"
                    icon={<Users className="w-5 h-5 text-indigo-400" />}
                />
                <QuickCard
                    title="Manage Events"
                    description="Approve, cancel, and publish events platform-wide"
                    onClick={() => navigate('/admin/events')}
                    accent="bg-purple-500/20"
                    icon={<CalendarDays className="w-5 h-5 text-purple-400" />}
                />
                <QuickCard
                    title="Add New Event"
                    description="Create an event directly as admin"
                    onClick={() => navigate('/organizer/create')}
                    accent="bg-green-500/20"
                    icon={<Plus className="w-5 h-5 text-green-400" />}
                />
            </div>
        </div>
    );
};

export default AdminDashboard;
