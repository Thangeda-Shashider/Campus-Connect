import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios.js';
import EventForm from '../../components/EventForm.jsx';

const EditEvent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get(`/events/${id}`)
            .then((res) => setEvent(res.data.data))
            .catch(() => toast.error('Failed to load event'))
            .finally(() => setLoading(false));
    }, [id]);

    const handleSubmit = async (formData) => {
        setSaving(true);
        try {
            const res = await api.put(`/events/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (res.data.success) {
                toast.success('Event updated!');
                navigate('/organizer/manage');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Update failed');
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
