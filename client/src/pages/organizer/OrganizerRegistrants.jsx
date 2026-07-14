import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ArrowLeft, Users, Download, Award, CheckCircle2, XCircle,
    Search, ChevronDown, ChevronUp, FileText, ShieldCheck,
    CreditCard, Clock, Image, AlertCircle, Loader2, QrCode,
    UserCheck, UserX, ScanLine,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios.js';
import QRScanner from '../../components/QRScanner.jsx';
import { formatDate, formatDateTime } from '../../utils/formatDate.js';
import { cn } from '../../lib/utils.js';

/* ─── Payment Status Badge ──────────────────────────────────────── */
const PaymentBadge = ({ status }) => {
    const map = {
        not_required: null,
        pending: { label: 'Pending', icon: Clock, cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
        verified: { label: 'Verified', icon: ShieldCheck, cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
        rejected: { label: 'Rejected', icon: XCircle, cls: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
    };
    const item = map[status];
    if (!item) return null;
    const Icon = item.icon;
    return (
        <span className={cn('inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium', item.cls)}>
            <Icon className="w-3 h-3" />{item.label}
        </span>
    );
};

/* ─── Screenshot Preview Modal ──────────────────────────────────── */
const ScreenshotModal = ({ url, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className="relative max-w-xl w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b dark:border-gray-800">
                <p className="font-semibold text-gray-800 dark:text-white text-sm">Payment Screenshot</p>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
                    <XCircle className="w-5 h-5" />
                </button>
            </div>
            <div className="p-4">
                <img src={url} alt="Payment screenshot" className="w-full max-h-[70vh] object-contain rounded-lg" />
            </div>
        </div>
    </div>
);

/* ─── QR Scanner Modal ──────────────────────────────────────────── */
const QRScanModal = ({ onClose, onScan }) => {
    const [result, setResult] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleScan = async (qrToken) => {
        if (processing) return;
        setProcessing(true);
        try {
            const res = await api.post('/registrations/checkin', { qrToken });
            if (res.data.success) {
                const reg = res.data.data;
                setResult({ success: true, name: reg.user?.name, dept: reg.user?.department, registrationId: reg._id });
                toast.success(`✓ Checked in: ${reg.user?.name}`);
                onScan(reg._id);
            }
        } catch (err) {
            setResult({ success: false, error: err.response?.data?.error || 'Invalid QR code' });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <ScanLine className="w-5 h-5 text-indigo-500" />
                        <p className="font-bold text-gray-900 dark:text-white">QR Check-In Scanner</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-5">
                    {!result ? (
                        <>
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                                Point camera at student's QR code to mark attendance
                            </p>
                            <QRScanner onScan={handleScan} disabled={processing} />
                            {processing && (
                                <div className="flex items-center justify-center gap-2 mt-4 text-indigo-600 dark:text-indigo-400">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">Processing...</span>
                                </div>
                            )}
                        </>
                    ) : result.success ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-9 h-9 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{result.name}</h3>
                            {result.dept && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{result.dept}</p>}
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-2">Attendance marked successfully ✓</p>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setResult(null)}
                                    className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors">
                                    Scan Next
                                </button>
                                <button onClick={onClose}
                                    className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    Done
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                                <XCircle className="w-9 h-9 text-red-600 dark:text-red-400" />
                            </div>
                            <p className="font-semibold text-red-600 dark:text-red-400">{result.error}</p>
                            <button onClick={() => setResult(null)}
                                className="mt-4 px-6 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ─── Main Page ─────────────────────────────────────────────────── */
const OrganizerRegistrants = () => {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState(null);
    const [screenshotModal, setScreenshotModal] = useState(null);
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [attendanceFilter, setAttendanceFilter] = useState('all'); // all | attended | absent

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [evRes, regRes] = await Promise.all([
                    api.get(`/events/${eventId}`),
                    api.get(`/registrations/event/${eventId}`),
                ]);
                setEvent(evRes.data.data);
                setRegistrations(regRes.data.data);
            } catch (err) {
                toast.error(err.response?.data?.error || 'Failed to load registrants');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [eventId]);

    const handleToggleAttendance = async (regId, currentlyAttended) => {
        try {
            const res = await api.patch(`/registrations/${regId}/attendance`, {
                attended: !currentlyAttended,
            });
            if (res.data.success) {
                setRegistrations((prev) =>
                    prev.map((r) => r._id === regId ? { ...r, attended: res.data.data.attended } : r)
                );
                toast.success(res.data.data.attended ? '✓ Marked as attended' : 'Removed attendance mark');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update attendance');
        }
    };

    const handleQRCheckIn = (registrationId) => {
        setRegistrations((prev) =>
            prev.map((r) => r._id === registrationId ? { ...r, attended: true } : r)
        );
    };

    const handleIssueCertificate = async (regId, issue) => {
        try {
            const res = await api.patch(`/registrations/${regId}/certificate`, { issue });
            if (res.data.success) {
                setRegistrations((prev) =>
                    prev.map((r) => r._id === regId ? {
                        ...r,
                        certificateIssued: res.data.data.certificateIssued,
                        certificateIssuedAt: res.data.data.certificateIssuedAt,
                    } : r)
                );
                toast.success(issue ? 'Certificate issued!' : 'Certificate revoked');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update certificate');
        }
    };

    const handleVerifyPayment = async (regId, status, rejectionReason) => {
        try {
            const res = await api.patch(`/registrations/${regId}/payment-verify`, { status, rejectionReason });
            if (res.data.success) {
                setRegistrations((prev) =>
                    prev.map((r) => r._id === regId ? {
                        ...r,
                        paymentStatus: res.data.data.paymentStatus,
                        paymentVerifiedAt: res.data.data.paymentVerifiedAt,
                    } : r)
                );
                toast.success(status === 'verified' ? '✅ Payment verified!' : '❌ Payment rejected');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update payment status');
        }
    };

    const filtered = registrations.filter((r) => {
        const s = search.toLowerCase();
        const matchSearch = !s || r.user?.name?.toLowerCase().includes(s) || r.user?.email?.toLowerCase().includes(s) || r.user?.department?.toLowerCase().includes(s);
        const matchPayment = paymentFilter === 'all' || r.paymentStatus === paymentFilter;
        const matchAttendance = attendanceFilter === 'all' || (attendanceFilter === 'attended' ? r.attended : !r.attended);
        return matchSearch && matchPayment && matchAttendance;
    });

    const attendedCount = registrations.filter((r) => r.attended).length;
    const certIssuedCount = registrations.filter((r) => r.certificateIssued).length;
    const pendingPayments = registrations.filter((r) => r.paymentStatus === 'pending').length;
    const isPastEvent = event ? new Date(event.date) < new Date() : false;

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-pulse space-y-4">
                <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-40 rounded-2xl bg-gray-200 dark:bg-gray-800" />
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-200 dark:bg-gray-800" />)}
            </div>
        );
    }

    if (!event) return null;

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            {/* Back */}
            <Link to="/organizer/manage"
                className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to My Events
            </Link>

            {/* Event header */}
            <div className="rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                            <img src={event.bannerUrl || `https://picsum.photos/seed/${event._id}/120/120`} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{event.title}</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{formatDateTime(event.date)} · {event.venue}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {event.hasCertificate && (
                                    <span className="flex items-center gap-1 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                                        <Award className="w-3 h-3" /> Certificates Enabled
                                    </span>
                                )}
                                {event.paymentRequired && (
                                    <span className="flex items-center gap-1 text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-800">
                                        <CreditCard className="w-3 h-3" /> Paid — ₹{event.paymentAmount}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {/* QR Scanner button */}
                        <button onClick={() => setShowQRScanner(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm">
                            <QrCode className="w-4 h-4" />
                            Scan QR Check-In
                        </button>
                        <button onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL}/registrations/event/${eventId}/export`, '_blank')}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className={cn('grid gap-4 mt-6 pt-6 border-t dark:border-gray-800', event.paymentRequired ? 'grid-cols-4' : event.hasCertificate ? 'grid-cols-3' : 'grid-cols-2')}>
                    <Stat label="Registered" value={registrations.length} icon={<Users className="w-5 h-5 text-indigo-500" />} color="text-indigo-600 dark:text-indigo-400" />
                    <Stat label="Attended" value={`${attendedCount} / ${registrations.length}`}
                        icon={<UserCheck className="w-5 h-5 text-green-500" />} color="text-green-600 dark:text-green-400"
                        sub={registrations.length > 0 ? `${Math.round((attendedCount / registrations.length) * 100)}% rate` : ''} />
                    {event.paymentRequired && (
                        <Stat label="Pending Payments" value={pendingPayments}
                            icon={<Clock className="w-5 h-5 text-amber-500" />} color="text-amber-600 dark:text-amber-400"
                            highlight={pendingPayments > 0} />
                    )}
                    {event.hasCertificate && (
                        <Stat label="Certs Issued" value={`${certIssuedCount} / ${attendedCount || registrations.length}`}
                            icon={<Award className="w-5 h-5 text-amber-500" />} color="text-amber-600 dark:text-amber-400" />
                    )}
                </div>
            </div>

            {/* Alerts */}
            {event.paymentRequired && pendingPayments > 0 && (
                <div className="mb-4 flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                        <strong>{pendingPayments}</strong> student{pendingPayments !== 1 ? 's have' : ' has'} uploaded payment screenshots awaiting verification.
                    </p>
                    <button onClick={() => setPaymentFilter('pending')}
                        className="ml-auto text-xs font-semibold text-amber-700 dark:text-amber-300 underline whitespace-nowrap">
                        Show only
                    </button>
                </div>
            )}

            {/* Attendance tip */}
            <div className="mb-4 flex items-center gap-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                    Use the <strong>Scan QR Check-In</strong> button to scan student QR codes, or toggle attendance manually for each student below.
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Search by name, email or department..." value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                    {/* Attendance filter */}
                    {['all', 'attended', 'absent'].map((f) => (
                        <button key={f} onClick={() => setAttendanceFilter(f)}
                            className={cn('px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors',
                                attendanceFilter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700')}>
                            {f === 'all' ? 'All' : f === 'attended' ? '✓ Attended' : '✗ Absent'}
                        </button>
                    ))}
                    {event.paymentRequired && ['pending', 'verified', 'rejected'].map((f) => (
                        <button key={f} onClick={() => setPaymentFilter(paymentFilter === f ? 'all' : f)}
                            className={cn('px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors',
                                paymentFilter === f ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700')}>
                            💳 {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Registrants list */}
            {filtered.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-4xl mb-3">👥</div>
                    <p className="text-gray-500 dark:text-gray-400">
                        {registrations.length === 0 ? 'No registrations yet.' : 'No results match your filters.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((reg) => (
                        <RegistrantRow
                            key={reg._id}
                            reg={reg}
                            event={event}
                            isPastEvent={isPastEvent}
                            isExpanded={expanded === reg._id}
                            onToggle={() => setExpanded(expanded === reg._id ? null : reg._id)}
                            onToggleAttendance={() => handleToggleAttendance(reg._id, reg.attended)}
                            onIssueCert={handleIssueCertificate}
                            onVerifyPayment={handleVerifyPayment}
                            onViewScreenshot={(url) => setScreenshotModal(url)}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}
            {screenshotModal && <ScreenshotModal url={screenshotModal} onClose={() => setScreenshotModal(null)} />}
            {showQRScanner && <QRScanModal onClose={() => setShowQRScanner(false)} onScan={handleQRCheckIn} />}
        </div>
    );
};

/* ─── Registrant Row ────────────────────────────────────────────── */
const RegistrantRow = ({ reg, event, isPastEvent, isExpanded, onToggle, onToggleAttendance, onIssueCert, onVerifyPayment, onViewScreenshot }) => {
    const [rejecting, setRejecting] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const [attendanceLoading, setAttendanceLoading] = useState(false);

    const formResponses = reg.formResponses ? Object.entries(reg.formResponses) : [];

    const doToggleAttendance = async () => {
        setAttendanceLoading(true);
        await onToggleAttendance();
        setAttendanceLoading(false);
    };

    const doVerify = async (status) => {
        setActionLoading(status);
        await onVerifyPayment(reg._id, status, status === 'rejected' ? rejectReason : undefined);
        setActionLoading(null);
        setRejecting(false);
        setRejectReason('');
    };

    return (
        <div className="rounded-xl border dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            {/* Main row */}
            <div className="flex items-center gap-3 px-4 py-3.5">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        {reg.user?.name?.[0]?.toUpperCase() ?? '?'}
                    </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{reg.user?.name ?? '—'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{reg.user?.email}</p>
                </div>

                {/* Dept / Year */}
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                    {reg.user?.department && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                            {reg.user.department}
                        </span>
                    )}
                    {reg.user?.year && <span className="text-xs text-gray-400">Yr {reg.user.year}</span>}
                </div>

                {/* ── Attendance toggle button ── */}
                <button
                    onClick={doToggleAttendance}
                    disabled={attendanceLoading}
                    title={reg.attended ? 'Click to remove attendance' : 'Click to mark as attended'}
                    className={cn(
                        'hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0',
                        reg.attended
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 group'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-400'
                    )}
                >
                    {attendanceLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : reg.attended ? (
                        <>
                            <CheckCircle2 className="w-3.5 h-3.5 group-hover:hidden" />
                            <UserX className="w-3.5 h-3.5 hidden group-hover:block" />
                            <span className="group-hover:hidden">Attended</span>
                            <span className="hidden group-hover:block">Remove</span>
                        </>
                    ) : (
                        <>
                            <UserCheck className="w-3.5 h-3.5" />
                            Mark Attended
                        </>
                    )}
                </button>

                {/* Payment status */}
                {event.paymentRequired && (
                    <div className="hidden sm:block shrink-0">
                        <PaymentBadge status={reg.paymentStatus} />
                    </div>
                )}

                {/* Certificate */}
                {event.hasCertificate && isPastEvent && (
                    <button onClick={() => onIssueCert(reg._id, !reg.certificateIssued)}
                        className={cn(
                            'hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0',
                            reg.certificateIssued
                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400'
                        )}>
                        <Award className="w-3.5 h-3.5" />
                        {reg.certificateIssued ? 'Issued ✓' : 'Issue Cert'}
                    </button>
                )}

                {/* Payment screenshot view */}
                {event.paymentRequired && reg.paymentScreenshotUrl && (
                    <button onClick={() => onViewScreenshot(reg.paymentScreenshotUrl)}
                        className="hidden sm:flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline shrink-0">
                        <Image className="w-3.5 h-3.5" /> Screenshot
                    </button>
                )}

                {/* Expand */}
                <button onClick={onToggle}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
            </div>

            {/* Expanded panel */}
            {isExpanded && (
                <div className="border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 p-5 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <DetailItem label="Registered On" value={formatDate(reg.registeredAt)} />
                        <DetailItem label="Attendance" value={
                            <div className="flex items-center gap-2">
                                <span className={cn('text-sm font-medium', reg.attended ? 'text-green-600 dark:text-green-400' : 'text-gray-400')}>
                                    {reg.attended ? '✅ Attended' : '⭕ Not recorded'}
                                </span>
                                {/* Mobile toggle */}
                                <button onClick={doToggleAttendance} disabled={attendanceLoading}
                                    className={cn('text-xs px-2 py-1 rounded-lg font-medium transition-colors sm:hidden',
                                        reg.attended ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400')}>
                                    {attendanceLoading ? '...' : reg.attended ? 'Remove' : 'Mark'}
                                </button>
                            </div>
                        } />
                        {event.hasCertificate && (
                            <DetailItem label="Certificate"
                                value={reg.certificateIssued
                                    ? <span className="text-amber-600 dark:text-amber-400 text-sm font-medium">✅ Issued{reg.certificateIssuedAt ? ` (${formatDate(reg.certificateIssuedAt)})` : ''}</span>
                                    : <span className="text-gray-400 text-sm">⏳ Not issued</span>} />
                        )}
                        {event.paymentRequired && (
                            <DetailItem label="Payment" value={<PaymentBadge status={reg.paymentStatus} />} />
                        )}
                    </div>

                    {/* Payment verification section */}
                    {event.paymentRequired && (
                        <div className="rounded-xl border dark:border-gray-700 overflow-hidden">
                            <div className="bg-white dark:bg-gray-900 px-4 py-2.5 border-b dark:border-gray-700 flex items-center gap-2">
                                <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Payment Verification</span>
                            </div>
                            <div className="bg-white dark:bg-gray-900 p-4 space-y-4">
                                {reg.paymentScreenshotUrl ? (
                                    <>
                                        <div className="flex gap-4">
                                            <div className="w-24 h-24 rounded-lg overflow-hidden border dark:border-gray-700 cursor-pointer hover:opacity-80 transition shrink-0"
                                                onClick={() => onViewScreenshot(reg.paymentScreenshotUrl)}>
                                                <img src={reg.paymentScreenshotUrl} alt="Payment" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Payment Screenshot</p>
                                                <p className="text-xs text-gray-500">Click to view full size</p>
                                                <PaymentBadge status={reg.paymentStatus} />
                                            </div>
                                        </div>

                                        {reg.paymentStatus === 'pending' && (
                                            !rejecting ? (
                                                <div className="flex gap-2">
                                                    <button onClick={() => doVerify('verified')} disabled={actionLoading === 'verified'}
                                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
                                                        {actionLoading === 'verified' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                                        Verify Payment
                                                    </button>
                                                    <button onClick={() => setRejecting(true)}
                                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-600 dark:text-red-400 text-sm font-semibold transition-colors">
                                                        <XCircle className="w-4 h-4" /> Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <input type="text" placeholder="Reason for rejection (optional)" value={rejectReason}
                                                        onChange={(e) => setRejectReason(e.target.value)}
                                                        className="w-full px-3 py-2 text-sm rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400" />
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setRejecting(false)}
                                                            className="flex-1 py-2 rounded-lg border dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
                                                            Cancel
                                                        </button>
                                                        <button onClick={() => doVerify('rejected')} disabled={actionLoading === 'rejected'}
                                                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-60">
                                                            {actionLoading === 'rejected' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                                            Confirm Rejection
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        )}

                                        {reg.paymentStatus === 'rejected' && (
                                            <button onClick={() => doVerify('verified')}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold">
                                                <ShieldCheck className="w-4 h-4" /> Mark as Verified Instead
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-400 flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> No payment screenshot uploaded yet.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Form responses */}
                    {formResponses.length > 0 && (
                        <div className="rounded-xl border dark:border-gray-700 overflow-hidden">
                            <div className="bg-white dark:bg-gray-900 px-4 py-2.5 border-b dark:border-gray-700 flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Registration Responses</span>
                            </div>
                            <div className="bg-white dark:bg-gray-900 divide-y dark:divide-gray-800">
                                {formResponses.map(([key, value]) => (
                                    <div key={key} className="px-4 py-2.5 grid grid-cols-2 gap-4">
                                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{key}</span>
                                        <span className="text-sm text-gray-800 dark:text-gray-200">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Mobile cert button */}
                    {event.hasCertificate && isPastEvent && (
                        <button onClick={() => onIssueCert(reg._id, !reg.certificateIssued)} className="sm:hidden w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                            style={{ background: reg.certificateIssued ? '#fef3c7' : '#4f46e5', color: reg.certificateIssued ? '#92400e' : 'white' }}>
                            <Award className="w-4 h-4" />
                            {reg.certificateIssued ? 'Certificate Issued — Click to Revoke' : 'Issue Certificate'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const Stat = ({ label, value, icon, color, sub, highlight }) => (
    <div className={cn('text-center p-3 rounded-xl', highlight ? 'bg-amber-50 dark:bg-amber-900/10' : '')}>
        <div className="flex justify-center mb-1">{icon}</div>
        <p className={cn('text-xl font-bold', color)}>{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
);

const DetailItem = ({ label, value }) => (
    <div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{value}</div>
    </div>
);

export default OrganizerRegistrants;
