import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Menu, X, Sun, Moon, CalendarDays, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth.js';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils.js';

const THEME_KEY = 'campusconnect-theme';

const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [dark, setDark] = useState(
        () => document.documentElement.classList.contains('dark')
    );

    // Keep dark state in sync when class changes externally
    useEffect(() => {
        setDark(document.documentElement.classList.contains('dark'));
    }, []);

    const toggleDark = () => {
        const html = document.documentElement;
        const isNowDark = !html.classList.contains('dark');
        html.classList.toggle('dark');
        localStorage.setItem(THEME_KEY, isNowDark ? 'dark' : 'light');
        setDark(isNowDark);
    };

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
            logout();
            navigate('/login');
            toast.success('Logged out successfully');
        } catch {
            logout();
            navigate('/login');
        }
    };

    const navLinks = {
        student: [
            { to: '/events', label: 'Events' },
            { to: '/dashboard', label: 'My Dashboard' },
        ],
        organizer: [
            { to: '/events', label: 'Events' },
            { to: '/organizer/manage', label: 'Manage Events' },
            { to: '/organizer/create', label: '+ Create' },
        ],
        admin: [
            { to: '/admin', label: 'Dashboard' },
            { to: '/admin/users', label: 'Users' },
        ],
    };

    const links = isAuthenticated ? (navLinks[user?.role] ?? []) : [];
    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    return (
        <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600 dark:text-indigo-400 shrink-0">
                        <CalendarDays className="w-6 h-6" />
                        CampusConnect
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {links.map((l) => (
                            <Link
                                key={l.to}
                                to={l.to}
                                className={cn(
                                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                    isActive(l.to)
                                        ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                )}
                            >
                                {l.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-2">
                        {/* Dark mode toggle */}
                        <button
                            onClick={toggleDark}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Toggle dark mode"
                            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>

                        {isAuthenticated ? (
                            <div className="hidden md:flex items-center gap-2">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800">
                                    <div className="w-6 h-6 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center">
                                        <span className="text-xs font-bold text-white">
                                            {user?.name?.[0]?.toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 max-w-[100px] truncate">
                                        {user?.name}
                                    </span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 transition-colors"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="hidden md:flex items-center gap-2">
                                <Link
                                    to="/login"
                                    className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors"
                                >
                                    Log In
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors shadow-sm"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}

                        {/* Mobile menu toggle */}
                        <button
                            onClick={() => setMenuOpen((o) => !o)}
                            className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {menuOpen && (
                    <div className="md:hidden py-3 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-1">
                        {links.map((l) => (
                            <Link
                                key={l.to}
                                to={l.to}
                                onClick={() => setMenuOpen(false)}
                                className={cn(
                                    'text-sm font-medium px-3 py-2.5 rounded-lg transition-colors',
                                    isActive(l.to)
                                        ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                )}
                            >
                                {l.label}
                            </Link>
                        ))}

                        <div className="pt-2 mt-1 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-1">
                            {isAuthenticated ? (
                                <>
                                    <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                                        Signed in as <strong className="text-gray-900 dark:text-white">{user?.name}</strong>
                                    </div>
                                    <button
                                        onClick={() => { setMenuOpen(false); handleLogout(); }}
                                        className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" onClick={() => setMenuOpen(false)}
                                        className="px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 text-center">
                                        Log In
                                    </Link>
                                    <Link to="/register" onClick={() => setMenuOpen(false)}
                                        className="px-3 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 text-center">
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
