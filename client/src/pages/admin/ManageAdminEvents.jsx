import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CalendarDays, Filter, CheckCircle2, Clock, XCircle, Search, Edit2 } from 'lucide-react';
import { adminGetAllEvents, adminUpdateEventStatus } from '../../lib/api/admin.js';
import { formatDate } from '../../utils/formatDate.js';
import { cn } from '../../lib/utils.js';

const ManageAdminEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const data = await adminGetAllEvents();
            setEvents(data);
        } catch (err) {
            toast.error('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const updateEventStatus = async (id, newStatus) => {
        try {
            await adminUpdateEventStatus(id, newStatus);
            toast.success(`Event status updated to ${newStatus}`);
            setEvents((prev) => prev.map((e) => (e.id || e._id) === id ? { ...e, status: newStatus } : e));
        } catch (err) {
            toast.error(err.message || 'Failed to update status');
        }
    };

    const filtered = events.filter((e) => {
        const orgName = e.profiles?.name || e.organizer?.name || '';
        const matchesSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || orgName.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const StatusBadge = ({ status }) => {
        const badges = {
            upcoming: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            completed: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
            cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
        };
        return (
            <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full capitalize', badges[status] || badges.draft)}>
                {status}
            </span>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CalendarDays className="w-7 h-7 text-indigo-500" />
                        Manage Events
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        View and manage all platform events.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border dark:border-gray-800 shadow-sm mb-6 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-4 w-full sm:w-auto">
                    <div className="relative flex-1 sm:min-w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white capitalize">
                        <option value="all">All Statuses</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="draft">Draft</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b dark:border-gray-800">
                            <tr>
                                <th className="px-6 py-4 font-medium">Event Title</th>
                                <th className="px-6 py-4 font-medium">Organizer</th>
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-10 text-center"><div className="animate-pulse h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-500">No events found.</td></tr>
                            ) : (
                                filtered.map((event) => {
                                    const eventId = event.id || event._id;
                                    return (
                                    <tr key={eventId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white max-w-[250px] truncate" title={event.title}>
                                                 {event.title}
                                            </div>
                                            <div className="text-xs text-indigo-500 mt-1">{event.category}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-900 dark:text-white">{event.profiles?.name || event.organizer?.name || 'Unknown'}</div>
                                            <div className="text-xs text-gray-500">{event.profiles?.email || event.organizer?.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                            {formatDate(event.date)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={event.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <select
                                                value={event.status}
                                                onChange={(e) => updateEventStatus(eventId, e.target.value)}
                                                className="text-xs px-2 py-1.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 outline-none focus:ring-1 focus:ring-indigo-500"
                                            >
                                                <option value="upcoming">Mark Upcoming</option>
                                                <option value="completed">Mark Completed</option>
                                                <option value="cancelled">Mark Cancelled</option>
                                            </select>
                                        </td>
                                    </tr>
                                );})
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManageAdminEvents;
