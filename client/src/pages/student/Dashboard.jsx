import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Calendar, MapPin, QrCode, CheckCircle2, XCircle, Award, Clock,
    ChevronDown, ChevronUp, ExternalLink, FileText, CreditCard,
    ShieldCheck,
} from 'lucide-react';
import api from '../../api/axios.js';
import useAuth from '../../hooks/useAuth.js';
import QRDisplay from '../../components/QRDisplay.jsx';
import { formatDate, formatDateTime } from '../../utils/formatDate.js';
import { cn } from '../../lib/utils.js';

const TABS = ['Upcoming', 'Past'];

const Dashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('Upcoming');
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [qrToken, setQrToken] = useState(null);
    const [qrEventTitle, setQrEventTitle] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const regRes = await api.get('/registrations/my');
                setRegistrations(regRes.data.data);
            } catch {
                setRegistrations([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const now = new Date();
    const upcoming = registrations.filter((r) => r.event && new Date(r.event.date) >= now);
    const past = registrations.filter((r) => r.event && new Date(r.event.date) < now);
    const currentList = activeTab === 'Upcoming' ? upcoming : past;

    const showQR = (token, title) => {
        setQrToken(token);
        setQrEventTitle(title);
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            {/* Welcome header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        My Events 👋
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {upcoming.length > 0
                            ? `You have ${upcoming.length} upcoming event${upcoming.length !== 1 ? 's' : ''}`
                            : 'No upcoming events — browse and register for one!'}
                    </p>
                </div>
                <Link
                    to="/events"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    <ExternalLink className="w-4 h-4" />
                    Browse Events
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit mb-8">
                {TABS.map((tab) => {
                    const count = tab === 'Upcoming' ? upcoming.length : past.length;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                'px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                                activeTab === tab
                                    ? 'bg-white dark:bg-gray-900 shadow-sm text-indigo-600 dark:text-indigo-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                            )}
                        >
                            {tab}
                            <span className={cn(
                                'text-xs px-1.5 py-0.5 rounded-full font-semibold',
                                activeTab === tab
                                    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            )}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-36 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
                    ))}
                </div>
            ) : currentList.length === 0 ? (
                <EmptyState
                    emoji={activeTab === 'Upcoming' ? '🗓️' : '📚'}
                    message={activeTab === 'Upcoming' ? 'No upcoming registered events' : 'No past events yet'}
                    sub={
                        activeTab === 'Upcoming'
                            ? <Link to="/events" className="text-indigo-600 hover:underline">Browse events and register</Link>
                            : 'Events you attended will appear here'
                    }
                />
            ) : (
                <div className="space-y-4">
                    {currentList.map((reg) => (
                        <RegistrationCard
                            key={reg._id}
                            reg={reg}
                            isPast={activeTab === 'Past'}
                            onShowQR={showQR}
                        />
                    ))}
                </div>
            )}

            {/* QR Modal */}
            {qrToken && <QRDisplay token={qrToken} eventTitle={qrEventTitle} onClose={() => setQrToken(null)} />}
        </div>
    );
};

/* ─── Registration Card ─────────────────────────────────────────── */
const RegistrationCard = ({ reg, isPast, onShowQR }) => {
    const [expanded, setExpanded] = useState(false);
    const event = reg.event;
    if (!event) return null;

    const hasCert = event.hasCertificate;
    const attended = reg.attended;
    const certIssued = reg.certificateIssued;
    const formResponses = reg.formResponses ? Object.entries(reg.formResponses) : [];

    return (
        <div className="rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden transition-all">
            {/* Main row */}
            <div className="flex gap-4 p-5">
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                    <img
                        src={event.bannerUrl || `https://picsum.photos/seed/${event._id}/160/160`}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate">{event.title}</h3>
                            <div className="flex flex-wrap items-center gap-3 mt-1">
                                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(event.date)}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                    <MapPin className="w-3 h-3" />
                                    {event.venue}
                                </span>
                            </div>
                        </div>

                        {/* Status badges */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                            {isPast ? (
                                attended ? (
                                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        <CheckCircle2 className="w-3 h-3" /> Attended
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                        <XCircle className="w-3 h-3" /> Not Attended
                                    </span>
                                )
                            ) : (
                                <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                    <Clock className="w-3 h-3" /> Registered
                                </span>
                            )}

                            {/* Payment status badge */}
                            {event.paymentRequired && reg.paymentStatus && reg.paymentStatus !== 'not_required' && (
                                reg.paymentStatus === 'verified' ? (
                                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        <ShieldCheck className="w-3 h-3" /> Payment Verified
                                    </span>
                                ) : reg.paymentStatus === 'rejected' ? (
                                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                        <XCircle className="w-3 h-3" /> Payment Rejected
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                        <Clock className="w-3 h-3" /> Payment Pending
                                    </span>
                                )
                            )}

                            {/* Certificate status (only for past events with cert enabled) */}
                            {isPast && hasCert && (
                                certIssued ? (
                                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                        <Award className="w-3 h-3" /> Certificate Issued ✓
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-400 dark:bg-gray-800">
                                        <Award className="w-3 h-3" /> Certificate Pending
                                    </span>
                                )
                            )}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {!isPast && (
                            <button
                                onClick={() => onShowQR(reg.qrToken, event.title)}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 font-medium transition-colors"
                            >
                                <QrCode className="w-3.5 h-3.5" />
                                Show QR Code
                            </button>
                        )}

                        <Link
                            to={`/events/${event._id}`}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            View Event
                        </Link>

                        {/* View Details toggle */}
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors ml-auto"
                        >
                            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {expanded ? 'Hide Details' : 'View Details'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Expanded details */}
            {expanded && (
                <div className="border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 p-5 space-y-5">
                    {/* Event info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DetailItem label="Event Date & Time" value={formatDateTime(event.date)} />
                        <DetailItem label="Venue" value={event.venue} />
                        <DetailItem label="Category" value={event.category} />
                        <DetailItem label="Registered On" value={formatDate(reg.registeredAt)} />
                    </div>

                    {/* Attendance */}
                    {isPast && (
                        <div className="rounded-xl border dark:border-gray-700 overflow-hidden">
                            <div className="bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Attendance</span>
                                {attended ? (
                                    <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 font-medium">
                                        <CheckCircle2 className="w-4 h-4" /> You attended this event
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-sm text-gray-400 font-medium">
                                        <XCircle className="w-4 h-4" /> Attendance not recorded
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Certificate section */}
                    {isPast && hasCert && (
                        <div className={cn(
                            'rounded-xl border overflow-hidden',
                            certIssued
                                ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                        )}>
                            <div className="px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Award className={cn('w-4 h-4', certIssued ? 'text-amber-500' : 'text-gray-400')} />
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Certificate of Participation
                                    </span>
                                </div>
                                {certIssued ? (
                                    <div className="text-right">
                                        <span className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400 font-medium">
                                            <CheckCircle2 className="w-4 h-4" /> Issued by organizer
                                        </span>
                                        {reg.certificateIssuedAt && (
                                            <p className="text-xs text-gray-400 mt-0.5">{formatDate(reg.certificateIssuedAt)}</p>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-400">Pending — organizer will issue after the event</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Payment info */}
                    {event.paymentRequired && (
                        <div className="rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 flex items-center gap-3">
                            <CreditCard className="w-4 h-4 text-amber-500 shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Paid Event</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Registration fee: ₹{event.paymentAmount}</p>
                            </div>
                        </div>
                    )}

                    {/* Form responses */}
                    {formResponses.length > 0 && (
                        <div className="rounded-xl border dark:border-gray-700 overflow-hidden">
                            <div className="bg-white dark:bg-gray-900 px-4 py-2.5 border-b dark:border-gray-700 flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                    Registration Form Responses
                                </span>
                            </div>
                            <div className="bg-white dark:bg-gray-900 divide-y dark:divide-gray-800">
                                {formResponses.map(([key, value]) => (
                                    <div key={key} className="px-4 py-2.5 flex items-center justify-between gap-4">
                                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{key}</span>
                                        <span className="text-sm text-gray-800 dark:text-gray-200 text-right">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const DetailItem = ({ label, value }) => (
    <div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{value}</p>
    </div>
);

const EmptyState = ({ emoji, message, sub }) => (
    <div className="text-center py-20">
        <div className="text-5xl mb-4">{emoji}</div>
        <h3 className="font-semibold text-gray-700 dark:text-gray-300">{message}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{sub}</p>
    </div>
);

export default Dashboard;
