import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useState } from 'react';
import api from '../../api/axios.js';
import EventForm from '../../components/EventForm.jsx';

const CreateEvent = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (formData) => {
        setIsLoading(true);
        try {
            const res = await api.post('/events', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (res.data.success) {
                toast.success('Event created! 🎉');
                navigate('/organizer/manage');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to create event');
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
