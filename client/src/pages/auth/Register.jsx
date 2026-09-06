import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth.js';
import { cn } from '../../lib/utils.js';
import { useState } from 'react';

const schema = z
    .object({
        rollNo: z.string().min(1, 'Roll number is required'),
        name: z.string().min(2, 'Full name must be at least 2 characters'),
        email: z.string().email('Enter a valid email address'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        confirmPassword: z.string().min(1, 'Please confirm your password'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

const Register = () => {
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({ resolver: zodResolver(schema) });

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const { confirmPassword: _confirmPassword, ...payload } = data;
            const { user, needsEmailConfirmation } = await signup(payload);
            if (needsEmailConfirmation) {
                toast.success('Account created. Confirm your email, then sign in.');
                navigate('/login');
                return;
            }
            toast.success('Account created! Welcome to CampusConnect 🎉');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const inp = (err) =>
        cn(
            'w-full rounded-lg border px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition',
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
                    <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">Create your account to get started</p>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                        {/* Roll Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Roll Number / Faculty ID
                            </label>
                            <input {...register('rollNo')} className={inp(errors.rollNo)} autoComplete="off" placeholder="e.g. 23951A059Q" />
                            {errors.rollNo && <p className="mt-1 text-xs text-red-500">{errors.rollNo.message}</p>}
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Full Name
                            </label>
                            <input {...register('name')} className={inp(errors.name)} autoComplete="name" />
                            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                College Email Address
                            </label>
                            <input type="email" {...register('email')} className={inp(errors.email)} autoComplete="email" placeholder="you@iare.ac.in" />
                            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                        </div>

                        {/* Password + Confirm Password */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    {...register('password')}
                                    className={inp(errors.password)}
                                    autoComplete="new-password"
                                />
                                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    {...register('confirmPassword')}
                                    className={inp(errors.confirmPassword)}
                                    autoComplete="new-password"
                                />
                                {errors.confirmPassword && (
                                    <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Role note */}
                        <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                            <span>🎓</span>
                            All accounts are created as <strong className="text-gray-600 dark:text-gray-300">Student</strong>.
                            Organizer / Admin roles are assigned by the administrator.
                        </p>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors mt-2"
                        >
                            {isLoading ? 'Creating account…' : 'Create Account'}
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
