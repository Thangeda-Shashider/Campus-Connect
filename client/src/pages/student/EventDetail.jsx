import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Calendar, MapPin, Users, Tag, User, X, CreditCard, Award,
    AlertCircle, CheckCircle2, Upload, Image, Loader2, ShieldCheck,
    XCircle, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios.js';
import useAuth from '../../hooks/useAuth.js';
import QRDisplay from '../../components/QRDisplay.jsx';
import { formatDateTime, formatRelative } from '../../utils/formatDate.js';
import { cn } from '../../lib/utils.js';

const CATEGORY_COLORS = {
    Hackathon: 'bg-purple-100 text-purple-700',
    Workshop: 'bg-blue-100 text-blue-700',
    Seminar: 'bg-amber-100 text-amber-700',
    Cultural: 'bg-pink-100 text-pink-700',
    Sports: 'bg-green-100 text-green-700',
};

/* ─── Payment Status Badge ──────────────────────────────────────── */
const PaymentBadge = ({ status }) => {
    const map = {
        pending: { label: 'Payment Pending Verification', icon: Clock, cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
        verified: { label: 'Payment Verified ✓', icon: ShieldCheck, cls: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800' },
        rejected: { label: 'Payment Rejected', icon: XCircle, cls: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800' },
        not_required: null,
    };
    const item = map[status];
    if (!item) return null;
    const Icon = item.icon;
    return (
        <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium', item.cls)}>
            <Icon className="w-4 h-4 shrink-0" />
            {item.label}
        </div>
    );
};

/* ─── Registration Modal ────────────────────────────────────────── */
const RegistrationModal = ({ event, user, onClose, onSuccess }) => {
    // Step 1 = fill details form, Step 2 = pay & upload screenshot (paid events only)
    const [step, setStep] = useState(1);
    const [registrationId, setRegistrationId] = useState(null);

    const [form, setForm] = useState({
        rollNumber: '',
        collegeEmail: user?.email ?? '',
        phone: '',
    });
    const [customForm, setCustomForm] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Step 2 state
    const [screenshotFile, setScreenshotFile] = useState(null);
    const [screenshotPreview, setScreenshotPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [dragging, setDragging] = useState(false);

    const validate = () => {
        const e = {};
        if (!form.rollNumber.trim()) e.rollNumber = 'Roll number is required';
        if (!form.collegeEmail.trim()) e.collegeEmail = 'College email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.collegeEmail)) e.collegeEmail = 'Enter a valid email';
        if (!form.phone.trim()) e.phone = 'Phone number is required';
        else if (!/^\d{10}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid 10-digit phone number';

        (event.registrationFormFields ?? []).forEach((field) => {
            if (field.required && !customForm[field.label]?.trim()) {
                e[`custom_${field.label}`] = `"${field.label}" is required`;
            }
        });

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmitStep1 = async (e) => {
        e.preventDefault();
        // If already registered (user came back from step 2), just go forward
        if (registrationId) {
            setStep(2);
            return;
        }
        if (!validate()) return;
        setSubmitting(true);
        try {
            const formResponses = {
                'Roll Number': form.rollNumber,
                'College Email': form.collegeEmail,
                'Phone Number': form.phone,
                ...customForm,
            };
            const res = await api.post(`/registrations/${event._id}`, { formResponses });
            if (res.data.success) {
                const reg = res.data.data.registration;
                setRegistrationId(reg._id);
                if (event.paymentRequired) {
                    setStep(2); // Move to payment step
                } else {
                    toast.success('Registered! Your QR code has been emailed to you 🎉');
                    onSuccess(res.data.data);
                }
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Registration failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleScreenshotFile = (file) => {
        if (!file || !file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File must be under 5 MB');
            return;
        }
        setScreenshotFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setScreenshotPreview(e.target.result);
        reader.readAsDataURL(file);
    };

    const handleUploadScreenshot = async () => {
        if (!screenshotFile) { toast.error('Please select a payment screenshot'); return; }
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('screenshot', screenshotFile);
            const res = await api.post(`/registrations/${registrationId}/payment-screenshot`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (res.data.success) {
                toast.success('Payment screenshot uploaded! Awaiting organizer verification 🎉');
                onSuccess({ registration: { _id: registrationId, paymentStatus: 'pending' }, qrToken: null });
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const onDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        handleScreenshotFile(e.dataTransfer.files?.[0]);
    };

    const inputClass = (hasError) => cn(
        'w-full rounded-lg border px-3 py-2.5 text-sm bg-white dark:bg-gray-900 dark:text-white',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500 transition',
        hasError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 dark:border-gray-700'
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">

                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b dark:border-gray-800">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                            {/* Step indicator */}
                            {event.paymentRequired && (
                                <div className="flex items-center gap-1">
                                    {[1, 2].map((s) => (
                                        <div key={s} className={cn(
                                            'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors',
                                            step === s
                                                ? 'bg-indigo-600 text-white'
                                                : step > s
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                                        )}>
                                            {step > s ? '✓' : s}
                                        </div>
                                    ))}
                                    <div className="w-6 h-0.5 bg-gray-200 dark:bg-gray-700 -order-none" style={{ order: 'initial' }} />
                                </div>
                            )}
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                {step === 1 ? 'Register for Event' : 'Complete Payment'}
                            </h2>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{event.title}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors ml-3">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ── Step 1: Details Form ── */}
                {step === 1 && (
                    <>
                        <div className="overflow-y-auto flex-1 p-6 space-y-4">
                            {/* Notices */}
                            {event.paymentRequired && (
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                    <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                                            Paid Event — ₹{event.paymentAmount}
                                        </p>
                                        <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                                            After filling this form, you'll be asked to scan the organizer's QR and upload your payment screenshot.
                                        </p>
                                    </div>
                                </div>
                            )}
                            {event.hasCertificate && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                                    <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                    <p className="text-sm text-indigo-700 dark:text-indigo-300">
                                        Attendees receive a <strong>Certificate of Participation</strong>.
                                    </p>
                                </div>
                            )}

                            {/* Default fields */}
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Your Details</p>

                            <FormField label="Roll Number" required error={errors.rollNumber}>
                                <input type="text" className={inputClass(errors.rollNumber)} placeholder="e.g. 21CS001"
                                    value={form.rollNumber} onChange={(e) => setForm((f) => ({ ...f, rollNumber: e.target.value }))} />
                            </FormField>
                            <FormField label="College Email" required error={errors.collegeEmail}>
                                <input type="email" className={inputClass(errors.collegeEmail)} placeholder="yourname@college.edu"
                                    value={form.collegeEmail} onChange={(e) => setForm((f) => ({ ...f, collegeEmail: e.target.value }))} />
                            </FormField>
                            <FormField label="Phone Number" required error={errors.phone}>
                                <input type="tel" className={inputClass(errors.phone)} placeholder="10-digit mobile number"
                                    value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                            </FormField>

                            {/* Custom fields */}
                            {(event.registrationFormFields ?? []).length > 0 && (
                                <>
                                    <div className="border-t dark:border-gray-800 pt-2">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Additional Details</p>
                                    </div>
                                    {event.registrationFormFields.map((field) => (
                                        <FormField key={field.label} label={field.label} required={field.required} error={errors[`custom_${field.label}`]}>
                                            <input
                                                type={field.type === 'phone' ? 'tel' : field.type}
                                                className={inputClass(errors[`custom_${field.label}`])}
                                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                                value={customForm[field.label] ?? ''}
                                                onChange={(e) => setCustomForm((f) => ({ ...f, [field.label]: e.target.value }))}
                                            />
                                        </FormField>
                                    ))}
                                </>
                            )}
                        </div>

                        <div className="p-6 border-t dark:border-gray-800 flex gap-3">
                            <button type="button" onClick={onClose}
                                className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSubmitStep1} disabled={submitting}
                                className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                {submitting ? 'Submitting...' : event.paymentRequired ? 'Next: Make Payment →' : 'Confirm Registration'}
                            </button>
                        </div>
                    </>
                )}

                {/* ── Step 2: Payment ── */}
                {step === 2 && (
                    <>
                        <div className="overflow-y-auto flex-1 p-6 space-y-5">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Scan the QR below using any UPI app and pay <strong className="text-gray-900 dark:text-white">₹{event.paymentAmount}</strong>.
                                    Then upload a screenshot of the payment confirmation.
                                </p>
                            </div>

                            {/* Organizer Payment QR */}
                            {event.paymentQrUrl ? (
                                <div className="rounded-2xl border dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
                                    <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2.5 flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-indigo-500" />
                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Payment QR Code</span>
                                    </div>
                                    <div className="p-6 flex flex-col items-center gap-3">
                                        <div className="p-3 bg-white rounded-xl shadow-sm border dark:border-gray-700">
                                            <img
                                                src={event.paymentQrUrl}
                                                alt="Payment QR Code"
                                                className="w-52 h-52 object-contain"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                            Scan with PhonePe, Google Pay, Paytm, or any UPI app
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-xl border dark:border-gray-700 p-4 flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50">
                                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        The organizer has not uploaded a payment QR yet. Please contact them directly for payment details.
                                    </p>
                                </div>
                            )}

                            {/* Screenshot Upload */}
                            <div>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                    <Image className="w-4 h-4 text-indigo-500" />
                                    Upload Payment Screenshot <span className="text-red-500">*</span>
                                </p>

                                <label
                                    htmlFor="payment-screenshot-input"
                                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                                    onDragLeave={() => setDragging(false)}
                                    onDrop={onDrop}
                                    className={cn(
                                        'relative flex flex-col items-center justify-center cursor-pointer rounded-xl border-2 border-dashed transition-colors',
                                        dragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-700 hover:border-indigo-400',
                                        screenshotPreview ? 'p-2' : 'p-8'
                                    )}
                                >
                                    {screenshotPreview ? (
                                        <div className="relative w-full">
                                            <img src={screenshotPreview} alt="Screenshot preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity">
                                                <span className="text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-full">Click to change screenshot</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                <Upload className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Upload payment screenshot</p>
                                            <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB · Drag & drop or click to browse</p>
                                        </div>
                                    )}
                                </label>
                                <input
                                    id="payment-screenshot-input"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleScreenshotFile(e.target.files?.[0])}
                                />

                                {screenshotFile && (
                                    <p className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {screenshotFile.name} selected
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t dark:border-gray-800 flex gap-3">
                            <button type="button" onClick={() => setStep(1)}
                                className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                ← Back
                            </button>
                            <button onClick={handleUploadScreenshot} disabled={uploading || !screenshotFile}
                                className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                                {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {uploading ? 'Uploading...' : 'Submit Payment Proof'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

/* ─── Main EventDetail ──────────────────────────────────────────── */
const EventDetail = () => {
    const { id } = useParams();
    const { user, isAuthenticated } = useAuth();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [myRegistration, setMyRegistration] = useState(null);
    const [qrToken, setQrToken] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [evRes] = await Promise.all([api.get(`/events/${id}`)]);
                setEvent(evRes.data.data);
                if (isAuthenticated) {
                    try {
                        const regRes = await api.get('/registrations/my');
                        const found = regRes.data.data.find((r) => r.event?._id === id);
                        if (found) {
                            setMyRegistration(found);
                            setQrToken(found.qrToken);
                        }
                    } catch { }
                }
            } catch {
                toast.error('Failed to load event');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, isAuthenticated]);

    const handleRegistrationSuccess = (data) => {
        setMyRegistration(data.registration);
        if (data.qrToken) setQrToken(data.qrToken);
        setShowModal(false);
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-4">
                <div className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-800" />
                <div className="h-8 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-32 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
        );
    }

    if (!event) {
        return <div className="text-center py-24 text-gray-500">Event not found.</div>;
    }

    const seatsRemaining = event.maxSeats != null ? event.maxSeats - (event.registrationCount ?? 0) : null;
    const full = seatsRemaining !== null && seatsRemaining <= 0;
    const deadline = new Date(event.registrationDeadline) < new Date();
    const isOrganizer = user?.role === 'organizer' || user?.role === 'admin';
    const canRegister = !myRegistration && !full && !deadline && !isOrganizer && isAuthenticated;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            {/* Banner */}
            <div className="rounded-2xl overflow-hidden h-72 bg-gray-100 dark:bg-gray-800 mb-8">
                <img
                    src={event.bannerUrl || `https://picsum.photos/seed/${event._id}/1200/400`}
                    alt={event.title}
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main content */}
                <div className="md:col-span-2 space-y-6">
                    <div>
                        <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', CATEGORY_COLORS[event.category] ?? 'bg-gray-100 text-gray-700')}>
                            {event.category}
                        </span>
                        <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">{event.title}</h1>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{event.description}</p>

                    {/* Highlights */}
                    {(event.hasCertificate || event.paymentRequired) && (
                        <div className="flex flex-wrap gap-2">
                            {event.hasCertificate && (
                                <span className="flex items-center gap-1.5 text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                                    <Award className="w-3.5 h-3.5" /> Certificate of Participation
                                </span>
                            )}
                            {event.paymentRequired && (
                                <span className="flex items-center gap-1.5 text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800">
                                    <CreditCard className="w-3.5 h-3.5" /> Paid Event — ₹{event.paymentAmount}
                                </span>
                            )}
                        </div>
                    )}

                    {event.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {event.tags.map((tag) => (
                                <span key={tag} className="flex items-center gap-1 text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-2.5 py-1 rounded-full">
                                    <Tag className="w-3 h-3" />{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 shrink-0" />
                            Organized by <strong>{event.organizer?.name}</strong>
                        </div>
                    </div>

                    {/* What we'll collect */}
                    {!isOrganizer && (
                        <div className="rounded-xl border dark:border-gray-800 overflow-hidden">
                            <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 flex items-center gap-2">
                                <AlertCircle className="w-3.5 h-3.5 text-gray-500" />
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                    Registration requires
                                </p>
                            </div>
                            {['Roll Number', 'College Email', 'Phone Number', ...(event.registrationFormFields?.map(f => f.label) ?? [])].map((label, i, arr) => (
                                <div key={label} className={cn('flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-900', i < arr.length - 1 ? 'border-b dark:border-gray-800' : '')}>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                                    <span className={cn('text-xs px-2 py-0.5 rounded-full',
                                        (i < 3 || event.registrationFormFields?.[i - 3]?.required)
                                            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500')}>
                                        {(i < 3 || event.registrationFormFields?.[i - 3]?.required) ? 'Required' : 'Optional'}
                                    </span>
                                </div>
                            ))}
                            {event.paymentRequired && (
                                <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-900 border-t dark:border-gray-800">
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Payment Screenshot</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">Required (Step 2)</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <div className="rounded-2xl border dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
                        <InfoRow icon={<Calendar className="w-4 h-4" />} label="Date" value={formatDateTime(event.date)} />
                        <InfoRow icon={<MapPin className="w-4 h-4" />} label="Venue" value={event.venue} />
                        {seatsRemaining !== null && (
                            <InfoRow icon={<Users className="w-4 h-4" />} label="Seats"
                                value={full ? 'Fully Booked' : `${seatsRemaining} / ${event.maxSeats} remaining`} />
                        )}

                        <div className="pt-2 border-t dark:border-gray-800">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                Registration closes {formatRelative(event.registrationDeadline)}
                            </p>

                            {/* Registration status */}
                            {myRegistration ? (
                                <div className="space-y-2">
                                    <div className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-medium">
                                        <CheckCircle2 className="w-4 h-4" /> You're registered!
                                    </div>

                                    {/* Payment status for paid events */}
                                    {event.paymentRequired && myRegistration.paymentStatus && myRegistration.paymentStatus !== 'not_required' && (
                                        <PaymentBadge status={myRegistration.paymentStatus} />
                                    )}

                                    {myRegistration.qrToken && (
                                        <button
                                            onClick={() => setQrToken(myRegistration.qrToken)}
                                            className="w-full py-2 rounded-lg border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                        >
                                            Show QR Code
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        if (!isAuthenticated) { toast.error('Please log in to register'); return; }
                                        if (canRegister) setShowModal(true);
                                    }}
                                    disabled={!canRegister}
                                    className={cn(
                                        'w-full py-2.5 rounded-lg text-sm font-semibold transition-colors',
                                        canRegister
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                    )}
                                >
                                    {full ? 'Fully Booked' : deadline ? 'Deadline Passed' : !isAuthenticated ? 'Login to Register' : isOrganizer ? 'Organizers cannot register' : 'Register Now'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* QR Modal */}
            {qrToken && <QRDisplay token={qrToken} eventTitle={event.title} onClose={() => setQrToken(null)} />}

            {/* Registration Form Modal */}
            {showModal && (
                <RegistrationModal
                    event={event}
                    user={user}
                    onClose={() => setShowModal(false)}
                    onSuccess={handleRegistrationSuccess}
                />
            )}
        </div>
    );
};

const InfoRow = ({ icon, label, value }) => (
    <div className="flex gap-3">
        <div className="text-indigo-500 mt-0.5 shrink-0">{icon}</div>
        <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{value}</p>
        </div>
    </div>
);

const FormField = ({ label, required, error, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
);

export default EventDetail;
