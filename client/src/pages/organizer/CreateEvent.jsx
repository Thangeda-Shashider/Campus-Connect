import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { createEvent, uploadEventBanner, uploadPaymentQr } from '../../lib/api/events.js';
import useAuth from '../../hooks/useAuth.js';
import EventForm from '../../components/EventForm.jsx';

const CreateEvent = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (formData) => {
        setIsLoading(true);
        try {
            let bannerUrl = null;
            let paymentQrUrl = null;

            const bannerFile = formData.get('banner');
            if (bannerFile && bannerFile.size > 0) {
                bannerUrl = await uploadEventBanner(user.id, bannerFile);
            }

            const paymentQrFile = formData.get('paymentQr');
            if (paymentQrFile && paymentQrFile.size > 0) {
                paymentQrUrl = await uploadPaymentQr(user.id, paymentQrFile);
            }

            const maxSeatsVal = formData.get('maxSeats');
            const paymentAmountVal = formData.get('paymentAmount');
            const tags = formData.getAll('tags');

            const eventData = {
                organizer_id: user.id,
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
                banner_url: bannerUrl,
                payment_qr_url: paymentQrUrl,
                status: 'upcoming',
            };

            await createEvent(eventData);
            toast.success('Event created! 🎉');
            navigate('/organizer/manage');
        } catch (err) {
            toast.error(err.message || 'Failed to create event');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create Event</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Fill in the details for your new campus event</p>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 p-6">
                <EventForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>
        </div>
    );
};

export default CreateEvent;
