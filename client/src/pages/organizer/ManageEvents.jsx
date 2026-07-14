import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pencil, Trash2, QrCode, Download, BarChart2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../../api/axios.js';
import { formatDate } from '../../utils/formatDate.js';
import { cn } from '../../lib/utils.js';

const STATUS_COLORS = {
    upcoming: 'bg-blue-100 text-blue-700',
    ongoing: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-600',
};

const PIE_COLORS = ['#4F46E5', '#E5E7EB'];

const ManageEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ perDay: [], perDept: [], attendance: [] });
    const navigate = useNavigate();

    const load = async () => {
        setLoading(true);
        try {
            const res = await api.get('/events/my/events');
            setEvents(res.data.data);
        } catch {
            toast.error('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this event?')) return;
        try {
            await api.delete(`/events/${id}`);
            toast.success('Event deleted');
            setEvents((e) => e.filter((ev) => ev._id !== id));
        } catch (err) {
            toast.error(err.response?.data?.error || 'Delete failed');
        }
    };

    const handleExport = (id) => {
        window.open(`${import.meta.env.VITE_API_BASE_URL}/registrations/event/${id}/export`, '_blank');
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Events</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your events and view registrations</p>
                </div>
                <Link
                    to="/organizer/create"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                    + Create Event
                </Link>
            </div>

            {/* Events table */}
            <div className="rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden mb-10">
                {loading ? (
                    <div className="p-8 space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
                        ))}
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-4">📋</div>
                        <p className="text-gray-500 dark:text-gray-400">No events yet. <Link to="/organizer/create" className="text-indigo-600 hover:underline">Create one!</Link></p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                    <th className="text-left px-5 py-3 font-medium text-gray-600 dark:text-gray-400">Event</th>
                                    <th className="text-left px-5 py-3 font-medium text-gray-600 dark:text-gray-400">Date</th>
                                    <th className="text-left px-5 py-3 font-medium text-gray-600 dark:text-gray-400">Registrations</th>
                                    <th className="text-left px-5 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                                    <th className="text-left px-5 py-3 font-medium text-gray-600 dark:text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((ev) => (
                                    <tr key={ev._id} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-5 py-4 font-medium text-gray-900 dark:text-white max-w-xs truncate">{ev.title}</td>
                                        <td className="px-5 py-4 text-gray-600 dark:text-gray-400">{formatDate(ev.date)}</td>
                                        <td className="px-5 py-4">
                                            <Link
                                                to={`/organizer/manage/${ev._id}`}
                                                className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                                            >
                                                <Users className="w-4 h-4" />
                                                {ev.registrationCount ?? 0}
                                            </Link>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full capitalize', STATUS_COLORS[ev.status] ?? '')}>
                                                {ev.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <Link to={`/organizer/edit/${ev._id}`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors" title="Edit">
                                                    <Pencil className="w-4 h-4" />
                                                </Link>
                                                <Link to={`/organizer/checkin/${ev._id}`} className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-500 transition-colors" title="Check-in">
                                                    <QrCode className="w-4 h-4" />
                                                </Link>
                                                <button onClick={() => handleExport(ev._id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors" title="Export CSV">
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(ev._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-colors" title="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Analytics Charts */}
            {events.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-indigo-500" />
                        Analytics
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Line chart – registrations per day (placeholder data) */}
                        <div className="lg:col-span-2 rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Registrations (last 7 days)</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={demoLineData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="registrations" stroke="#4F46E5" strokeWidth={2} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Pie chart – attendance rate */}
                        <div className="rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Attendance Rate</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={[{ name: 'Attended', value: 62 }, { name: 'Absent', value: 38 }]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={80}
                                        dataKey="value"
                                    >
                                        {PIE_COLORS.map((color, i) => (
                                            <Cell key={i} fill={color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v) => `${v}%`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Bar chart – registrations by department */}
                        <div className="lg:col-span-3 rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Registrations by Department</h3>
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={demoDeptData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="dept" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Demo data (will be replaced with live API calls once backend aggregation endpoints are added)
const demoLineData = [
    { day: 'Mon', registrations: 3 }, { day: 'Tue', registrations: 7 },
    { day: 'Wed', registrations: 5 }, { day: 'Thu', registrations: 12 },
    { day: 'Fri', registrations: 9 }, { day: 'Sat', registrations: 15 },
    { day: 'Sun', registrations: 6 },
];
const demoDeptData = [
    { dept: 'CSE', count: 28 }, { dept: 'ECE', count: 14 },
    { dept: 'Mech', count: 9 }, { dept: 'Civil', count: 5 }, { dept: 'MBA', count: 11 },
];

export default ManageEvents;
