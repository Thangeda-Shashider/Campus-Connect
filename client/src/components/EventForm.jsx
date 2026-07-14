import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, Plus, Trash2, Award, CreditCard, FileText, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { cn } from '../lib/utils.js';
import { toInputDatetime } from '../utils/formatDate.js';
import { useState } from 'react';

const CATEGORIES = ['Hackathon', 'Workshop', 'Seminar', 'Cultural', 'Sports'];
const FIELD_TYPES = [
    { value: 'text', label: 'Short Text' },
    { value: 'email', label: 'Email Address' },
    { value: 'number', label: 'Number' },
    { value: 'phone', label: 'Phone Number' },
];

const formFieldSchema = z.object({
    label: z.string().min(1, 'Field label is required'),
    type: z.enum(['text', 'email', 'number', 'phone']),
    required: z.boolean().default(false),
});

const eventSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Select a category' }) }),
    venue: z.string().min(2, 'Venue is required'),
    date: z.string().min(1, 'Event date is required'),
    registrationDeadline: z.string().min(1, 'Deadline is required'),
    maxSeats: z.string().optional(),
    tags: z.string().optional(),
    hasCertificate: z.boolean().default(false),
    paymentRequired: z.boolean().default(false),
    paymentAmount: z.string().optional(),
    registrationFormFields: z.array(formFieldSchema).default([]),
});

/**
 * Shared event form for Create and Edit.
 */
const EventForm = ({ defaultValues, onSubmit, isLoading = false }) => {
    const [showFormBuilder, setShowFormBuilder] = useState(
        (defaultValues?.registrationFormFields?.length ?? 0) > 0
    );

    const {
        register,
        handleSubmit,
        watch,
        control,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            ...defaultValues,
            date: defaultValues?.date ? toInputDatetime(defaultValues.date) : '',
            registrationDeadline: defaultValues?.registrationDeadline
                ? toInputDatetime(defaultValues.registrationDeadline)
                : '',
            tags: defaultValues?.tags?.join(', ') ?? '',
            hasCertificate: defaultValues?.hasCertificate ?? false,
            paymentRequired: defaultValues?.paymentRequired ?? false,
            paymentAmount: defaultValues?.paymentAmount?.toString() ?? '',
            registrationFormFields: defaultValues?.registrationFormFields ?? [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'registrationFormFields',
    });

    const paymentRequired = watch('paymentRequired');

    const handleFormSubmit = (data) => {
        const fd = new FormData();
        fd.append('title', data.title);
        fd.append('description', data.description);
        fd.append('category', data.category);
        fd.append('venue', data.venue);
        fd.append('date', new Date(data.date).toISOString());
        fd.append('registrationDeadline', new Date(data.registrationDeadline).toISOString());
        if (data.maxSeats) fd.append('maxSeats', data.maxSeats);
        if (data.tags) {
            data.tags.split(',').forEach((t) => fd.append('tags', t.trim()));
        }
        fd.append('hasCertificate', String(data.hasCertificate));
        fd.append('paymentRequired', String(data.paymentRequired));
        if (data.paymentRequired && data.paymentAmount) {
            fd.append('paymentAmount', data.paymentAmount);
        }
        fd.append('registrationFormFields', JSON.stringify(data.registrationFormFields ?? []));

        const bannerFile = document.getElementById('banner-upload')?.files?.[0];
        if (bannerFile) fd.append('banner', bannerFile);
        const paymentQrFile = document.getElementById('payment-qr-upload')?.files?.[0];
        if (paymentQrFile) fd.append('paymentQr', paymentQrFile);
        onSubmit(fd);
    };

    const inputClass = (err) =>
        cn(
            'w-full rounded-lg border px-3 py-2.5 text-sm bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition',
            err
                ? 'border-red-400 focus:ring-red-400'
                : 'border-gray-300 dark:border-gray-700'
        );

    const addField = () => {
        append({ label: '', type: 'text', required: false });
        setShowFormBuilder(true);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* ── Basic Details ── */}
            <SectionHeader icon="📋" title="Event Details" />

            <Field label="Title" error={errors.title}>
                <input {...register('title')} className={inputClass(errors.title)} placeholder="Event title" />
            </Field>

            <Field label="Description" error={errors.description}>
                <textarea
                    {...register('description')}
                    rows={4}
                    className={inputClass(errors.description)}
                    placeholder="Describe the event..."
                />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Category" error={errors.category}>
                    <select {...register('category')} className={inputClass(errors.category)}>
                        <option value="">Select category</option>
                        {CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </Field>

                <Field label="Venue" error={errors.venue}>
                    <input {...register('venue')} className={inputClass(errors.venue)} placeholder="e.g. Main Auditorium" />
                </Field>

                <Field label="Event Date" error={errors.date}>
                    <input type="datetime-local" {...register('date')} className={inputClass(errors.date)} />
                </Field>

                <Field label="Registration Deadline" error={errors.registrationDeadline}>
                    <input
                        type="datetime-local"
                        {...register('registrationDeadline')}
                        className={inputClass(errors.registrationDeadline)}
                    />
                </Field>

                <Field label="Max Seats (optional)" error={errors.maxSeats}>
                    <input
                        type="number"
                        min="1"
                        {...register('maxSeats')}
                        className={inputClass(errors.maxSeats)}
                        placeholder="Leave blank for unlimited"
                    />
                </Field>

                <Field label="Tags (comma separated)" error={errors.tags}>
                    <input
                        {...register('tags')}
                        className={inputClass(errors.tags)}
                        placeholder="e.g. coding, AI, design"
                    />
                </Field>
            </div>

            {/* ── Banner Upload ── */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Banner Image (optional)
                </label>
                <label
                    htmlFor="banner-upload"
                    className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 hover:border-indigo-400 transition-colors"
                >
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Click to upload banner image (max 5 MB)
                    </span>
                </label>
                <input id="banner-upload" type="file" accept="image/*" className="hidden" />
            </div>

            {/* ── Registration Settings ── */}
            <div className="border-t dark:border-gray-800 pt-6 space-y-5">
                <SectionHeader icon="⚙️" title="Registration Settings" />

                {/* Certificate toggle */}
                <div className="flex items-start gap-4 p-4 rounded-xl border dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-3 flex-1">
                        <Award className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Certificate of Participation</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Enable to allow issuing certificates to attendees after the event
                            </p>
                        </div>
                    </div>
                    <Controller
                        control={control}
                        name="hasCertificate"
                        render={({ field }) => (
                            <button
                                type="button"
                                onClick={() => field.onChange(!field.value)}
                                className={cn(
                                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 mt-0.5',
                                    field.value ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'
                                )}
                            >
                                <span className={cn(
                                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                                    field.value ? 'translate-x-6' : 'translate-x-1'
                                )} />
                            </button>
                        )}
                    />
                </div>

                {/* Payment toggle */}
                <div className="space-y-3">
                    <div className="flex items-start gap-4 p-4 rounded-xl border dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                        <div className="flex items-center gap-3 flex-1">
                            <CreditCard className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Paid Event</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Mark this event as paid and set the registration fee
                                </p>
                            </div>
                        </div>
                        <Controller
                            control={control}
                            name="paymentRequired"
                            render={({ field }) => (
                                <button
                                    type="button"
                                    onClick={() => field.onChange(!field.value)}
                                    className={cn(
                                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 mt-0.5',
                                        field.value ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'
                                    )}
                                >
                                    <span className={cn(
                                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                                        field.value ? 'translate-x-6' : 'translate-x-1'
                                    )} />
                                </button>
                            )}
                        />
                    </div>
                    {paymentRequired && (
                        <div className="space-y-4 pl-0">
                            <Field label="Registration Fee (₹)" error={errors.paymentAmount}>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">₹</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        {...register('paymentAmount')}
                                        className={cn(inputClass(errors.paymentAmount), 'pl-7')}
                                        placeholder="0.00"
                                    />
                                </div>
                            </Field>

                            {/* Payment QR Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Payment QR Code <span className="text-gray-400 font-normal">(UPI / Bank QR)</span>
                                </label>
                                <PaymentQRUploader />
                                <p className="mt-1.5 text-xs text-gray-400">
                                    Students will see this QR to complete payment before registration is confirmed.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Custom Form Builder */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-indigo-500" />
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                Custom Registration Form
                            </p>
                            {fields.length > 0 && (
                                <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium">
                                    {fields.length} field{fields.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {fields.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setShowFormBuilder(!showFormBuilder)}
                                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                >
                                    {showFormBuilder ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    {showFormBuilder ? 'Collapse' : 'Expand'}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={addField}
                                className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add Field
                            </button>
                        </div>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Students will always be asked for Roll Number, College Email, and Phone. Add any extra fields needed for this event.
                    </p>

                    {/* Built-in fields preview */}
                    <div className="rounded-xl border dark:border-gray-800 overflow-hidden">
                        <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Default Fields (always collected)</p>
                        </div>
                        {['Roll Number', 'College Email', 'Phone Number'].map((label) => (
                            <div key={label} className="flex items-center justify-between px-4 py-2.5 border-t dark:border-gray-800">
                                <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">Required</span>
                            </div>
                        ))}
                    </div>

                    {/* Custom fields */}
                    {fields.length > 0 && showFormBuilder && (
                        <div className="space-y-3">
                            {fields.map((field, index) => (
                                <div
                                    key={field.id}
                                    className="rounded-xl border dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <GripVertical className="w-4 h-4" />
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                Custom Field {index + 1}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-colors"
                                            title="Remove field"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Field
                                            label="Field Label"
                                            error={errors.registrationFormFields?.[index]?.label}
                                        >
                                            <input
                                                {...register(`registrationFormFields.${index}.label`)}
                                                className={inputClass(errors.registrationFormFields?.[index]?.label)}
                                                placeholder="e.g. Team Name, Project Title..."
                                            />
                                        </Field>

                                        <Field label="Input Type">
                                            <select
                                                {...register(`registrationFormFields.${index}.type`)}
                                                className={inputClass(false)}
                                            >
                                                {FIELD_TYPES.map((t) => (
                                                    <option key={t.value} value={t.value}>{t.label}</option>
                                                ))}
                                            </select>
                                        </Field>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Controller
                                            control={control}
                                            name={`registrationFormFields.${index}.required`}
                                            render={({ field: f }) => (
                                                <button
                                                    type="button"
                                                    onClick={() => f.onChange(!f.value)}
                                                    className={cn(
                                                        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                                                        f.value ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'
                                                    )}
                                                >
                                                    <span className={cn(
                                                        'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                                                        f.value ? 'translate-x-4' : 'translate-x-0.5'
                                                    )} />
                                                </button>
                                            )}
                                        />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Required field</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? 'Saving...' : 'Save Event'}
            </button>
        </form>
    );
};

const SectionHeader = ({ icon, title }) => (
    <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{title}</h3>
    </div>
);

const Field = ({ label, error, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
        </label>
        {children}
        {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
    </div>
);

const PaymentQRUploader = () => {
    const [preview, setPreview] = useState(null);
    const [dragging, setDragging] = useState(false);

    const handleFile = (file) => {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(file);
        // Assign to the hidden input via DataTransfer
        const dt = new DataTransfer();
        dt.items.add(file);
        const input = document.getElementById('payment-qr-upload');
        if (input) input.files = dt.files;
    };

    const onDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        handleFile(file);
    };

    return (
        <div>
            <label
                htmlFor="payment-qr-upload"
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={cn(
                    'relative flex flex-col items-center justify-center cursor-pointer rounded-xl border-2 border-dashed transition-colors',
                    dragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-700 hover:border-indigo-400',
                    preview ? 'p-2' : 'p-8'
                )}
            >
                {preview ? (
                    <div className="relative">
                        <img src={preview} alt="Payment QR preview" className="max-h-64 mx-auto rounded-lg object-contain" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity">
                            <span className="text-white text-xs font-medium">Click to change</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Upload Payment QR Code</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB · Drag & drop or click</p>
                    </div>
                )}
            </label>
            <input
                id="payment-qr-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
            />
        </div>
    );
};

export default EventForm;
