import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getEventById, updateEvent, uploadEventBanner, uploadPaymentQr } from '../../lib/api/events.js';
import useAuth from '../../hooks/useAuth.js';
import EventForm from '../../components/EventForm.jsx';

const EditEvent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getEventById(id)
            .then((data) => setEvent(data))
            .catch(() => toast.error('Failed to load event'))
            .finally(() => setLoading(false));
    }, [id]);

    const handleSubmit = async (formData) => {
        setSaving(true);
        try {
            const bannerFile = formData.get('banner');
            let bannerUrl = event?.banner_url;
            if (bannerFile && bannerFile.size > 0) {
                bannerUrl = await uploadEventBanner(user.id, bannerFile);
            }

            const paymentQrFile = formData.get('paymentQr');
            let paymentQrUrl = event?.payment_qr_url;
            if (paymentQrFile && paymentQrFile.size > 0) {
                paymentQrUrl = await uploadPaymentQr(user.id, paymentQrFile);
            }

            const maxSeatsVal = formData.get('maxSeats');
            const paymentAmountVal = formData.get('paymentAmount');
            const tags = formData.getAll('tags');

            const updates = {
                title: formData.get('title'),
                description: formData.get('description'),
                category: formData.get('category'),
                venue: formData.get('venue'),
                date: formData.get('date'),
                registration_deadline: formData.get('registrationDeadline'),
                max_seats: maxSeatsVal ? parseInt(maxSeatsVal, 10) : null,
                tags: tags.length > 0 ? tags : [],
                has_certificate: formData.get('hasCertificate') === 'true',
                payment_required: formData.get('paymentRequired') === 'true',
                payment_amount: paymentAmountVal ? parseFloat(paymentAmountVal) : 0,
                registration_form_fields: JSON.parse(formData.get('registrationFormFields') || '[]'),
            };

            if (bannerUrl !== undefined) updates.banner_url = bannerUrl;
            if (paymentQrUrl !== undefined) updates.payment_qr_url = paymentQrUrl;

            await updateEvent(id, updates);
            toast.success('Event updated!');
            navigate('/organizer/manage');
        } catch (err) {
            toast.error(err.message || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-10 space-y-4 animate-pulse">
                <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-96 rounded-2xl bg-gray-200 dark:bg-gray-800" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Edit Event</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Update the event details below</p>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 p-6">
                <EventForm defaultValues={event} onSubmit={handleSubmit} isLoading={saving} />
            </div>
        </div>
    );
};

export default EditEvent;
