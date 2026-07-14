import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios.js';
import useAuth from '../../hooks/useAuth.js';
import { cn } from '../../lib/utils.js';
import { useState } from 'react';

const INTERESTS = ['coding', 'design', 'sports', 'music', 'AI', 'robotics', 'business', 'art'];

const schema = z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Valid email is required'),
    password: z.string().min(6, 'At least 6 characters'),
    role: z.enum(['student', 'organizer'], { errorMap: () => ({ message: 'Select a role' }) }),
    department: z.string().optional(),
    year: z.string().optional(),
    interests: z.array(z.string()).optional(),
});

const Register = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedInterests, setSelectedInterests] = useState([]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({ resolver: zodResolver(schema), defaultValues: { role: 'student' } });

    const toggleInterest = (interest) => {
        setSelectedInterests((prev) =>
            prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
        );
    };

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const payload = { ...data, interests: selectedInterests };
            if (data.year) payload.year = parseInt(data.year, 10);
            const res = await api.post('/auth/register', payload);
            if (res.data.success) {
                login(res.data.data);
                toast.success('Account created! Welcome to CampusConnect 🎉');
                const role = res.data.data.role;
                navigate(role === 'organizer' ? '/organizer/manage' : '/dashboard');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const inp = (err) =>
        cn(
            'w-full rounded-lg border px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition',
            err ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 dark:border-gray-600'
        );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 py-12">
            <div className="w-full max-w-lg">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 font-bold text-2xl text-indigo-600 dark:text-indigo-400">
                        <CalendarDays className="w-8 h-8" />
                        CampusConnect
                    </Link>
                    <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">Create your free account</p>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Name + Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                <input {...register('name')} className={inp(errors.name)} placeholder="Alex Johnson" />
                                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                <input type="email" {...register('email')} className={inp(errors.email)} placeholder="you@uni.edu" />
                                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                            <input type="password" {...register('password')} className={inp(errors.password)} placeholder="Min. 6 characters" />
                            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
                        </div>

                        {/* Role */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">I am a...</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['student', 'organizer'].map((r) => (
                                    <label key={r} className="cursor-pointer">
                                        <input type="radio" value={r} {...register('role')} className="sr-only peer" />
                                        <div className="border-2 rounded-xl px-4 py-3 text-center text-sm font-medium capitalize transition-all peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 dark:peer-checked:bg-indigo-900/30 dark:peer-checked:text-indigo-300 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300">
                                            {r === 'student' ? '🎓 Student' : '🎤 Organizer'}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Department + Year */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                                <input {...register('department')} className={inp()} placeholder="e.g. CSE" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                                <select {...register('year')} className={inp()}>
                                    <option value="">Select</option>
                                    {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Interests */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Interests <span className="text-gray-400 font-normal">(for recommendations)</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {INTERESTS.map((i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => toggleInterest(i)}
                                        className={cn(
                                            'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                                            selectedInterests.includes(i)
                                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                                : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-400'
                                        )}
                                    >
                                        {i}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors mt-2"
                        >
                            {isLoading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-600 hover:underline font-medium">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
