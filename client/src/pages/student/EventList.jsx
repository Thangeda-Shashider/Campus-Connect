import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import api from '../../api/axios.js';
import EventCard from '../../components/EventCard.jsx';
import { cn } from '../../lib/utils.js';

const CATEGORIES = ['All', 'Hackathon', 'Workshop', 'Seminar', 'Cultural', 'Sports'];

const EventList = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const LIMIT = 12;

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const params = { page, limit: LIMIT };
            if (search) params.search = search;
            if (category !== 'All') params.category = category;
            const res = await api.get('/events', { params });
            setEvents(res.data.data);
            setTotal(res.data.pagination?.total ?? 0);
        } catch {
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
    }, [search, category]);

    useEffect(() => {
        fetchEvents();
    }, [page, search, category]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Campus Events</h1>
                <p className="mt-1 text-gray-500 dark:text-gray-400">Discover and register for events happening on campus</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search events..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                </div>

                {/* Category filter */}
                <div className="flex gap-2 flex-wrap">
                    {CATEGORIES.map((c) => (
                        <button
                            key={c}
                            onClick={() => setCategory(c)}
                            className={cn(
                                'px-4 py-2 rounded-xl text-sm font-medium transition-colors border',
                                category === c
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-400'
                            )}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <EventCard key={i} skeleton />
                    ))}
                </div>
            ) : events.length === 0 ? (
                <div className="text-center py-24">
                    <div className="text-5xl mb-4">🎭</div>
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No events found</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Try a different search or category filter</p>
                </div>
            ) : (
                <>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{total} event{total !== 1 ? 's' : ''} found</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {events.map((event) => (
                            <EventCard key={event._id} event={event} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {total > LIMIT && (
                        <div className="flex justify-center gap-2 mt-10">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors dark:border-gray-700"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                Page {page} of {Math.ceil(total / LIMIT)}
                            </span>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page >= Math.ceil(total / LIMIT)}
                                className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors dark:border-gray-700"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default EventList;
