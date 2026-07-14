import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users } from 'lucide-react';
import { formatDate } from '../utils/formatDate.js';
import { cn } from '../lib/utils.js';

const CATEGORY_COLORS = {
    Hackathon: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    Workshop: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    Seminar: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    Cultural: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
    Sports: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

/**
 * Event card displayed in a grid. Shows banner, category, title, date, venue, seat count.
 * Pass `skeleton={true}` to render a loading placeholder.
 */
const EventCard = ({ event, skeleton = false }) => {
    if (skeleton) {
        return (
            <div className="rounded-2xl border bg-white dark:bg-gray-900 dark:border-gray-800 overflow-hidden animate-pulse">
                <div className="h-44 bg-gray-200 dark:bg-gray-800" />
                <div className="p-4 space-y-3">
                    <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-9 rounded-lg bg-gray-200 dark:bg-gray-700 mt-2" />
                </div>
            </div>
        );
    }

    const seatsRemaining =
        event.maxSeats != null
            ? event.maxSeats - (event.registrationCount ?? 0)
            : null;
    const full = seatsRemaining !== null && seatsRemaining <= 0;
    const deadline = new Date(event.registrationDeadline) < new Date();

    return (
        <div className="rounded-2xl border bg-white dark:bg-gray-900 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
            {/* Banner */}
            <div className="relative h-44 overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                    src={event.bannerUrl || `https://picsum.photos/seed/${event._id}/600/300`}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span
                    className={cn(
                        'absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full',
                        CATEGORY_COLORS[event.category] ?? 'bg-gray-100 text-gray-700'
                    )}
                >
                    {event.category}
                </span>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1 gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">
                    {event.title}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    {formatDate(event.date)}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{event.venue}</span>
                </div>

                {seatsRemaining !== null && (
                    <div
                        className={cn(
                            'flex items-center gap-1.5 text-xs font-medium',
                            full ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
                        )}
                    >
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        {full ? 'Fully booked' : `${seatsRemaining} seats left`}
                    </div>
                )}

                <div className="mt-auto pt-2">
                    <Link
                        to={`/events/${event._id}`}
                        className={cn(
                            'block w-full text-center text-sm font-medium py-2 rounded-lg transition-colors',
                            full || deadline
                                ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed pointer-events-none'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        )}
                    >
                        {full ? 'Fully Booked' : deadline ? 'Deadline Passed' : 'View Event'}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default EventCard;
