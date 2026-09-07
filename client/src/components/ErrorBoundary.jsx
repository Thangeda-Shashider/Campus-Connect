import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Unhandled UI error caught by ErrorBoundary:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/events';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[70vh] flex items-center justify-center p-6">
                    <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl text-center space-y-5">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 flex items-center justify-center text-red-600 dark:text-red-400">
                            <AlertTriangle className="w-7 h-7" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Something went wrong
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                An unexpected error occurred while rendering this page.
                            </p>
                            {this.state.error?.message && (
                                <p className="text-xs font-mono text-red-500/80 bg-red-50 dark:bg-red-950/30 p-2.5 rounded-lg border border-red-200 dark:border-red-900/40 text-left overflow-x-auto">
                                    {this.state.error.message}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center justify-center gap-3 pt-2">
                            <button
                                onClick={this.handleReload}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span>Reload</span>
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-medium text-white transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                <span>Go to Events</span>
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
