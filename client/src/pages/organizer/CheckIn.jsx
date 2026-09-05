import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { checkInByQrToken } from '../../lib/api/registrations.js';
import QRScanner from '../../components/QRScanner.jsx';
import { cn } from '../../lib/utils.js';

const CheckIn = () => {
    const { eventId } = useParams();
    const [result, setResult] = useState(null); // { success, name, dept, error }
    const [processing, setProcessing] = useState(false);
    const [scanning, setScanning] = useState(true);

    const handleScan = async (qrToken) => {
        if (processing) return;
        setProcessing(true);
        setScanning(false);

        try {
            const reg = await checkInByQrToken(qrToken);
            if (eventId && reg.event_id && reg.event_id !== eventId) {
                throw new Error('This ticket belongs to a different event');
            }
            const profile = reg.profiles || reg.profile || reg.user;
            const name = profile?.name || 'Student';
            const dept = profile?.department || profile?.roll_no || '';
            setResult({ success: true, name, dept });
            toast.success(`✓ Checked in: ${name}`);
        } catch (err) {
            const errorMsg = err.message || 'Invalid or expired QR code';
            setResult({ success: false, error: errorMsg });
            toast.error(errorMsg);
        } finally {
            setProcessing(false);
        }
    };

    const reset = () => {
        setResult(null);
        setScanning(true);
    };

    return (
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">QR Check-In</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Scan a student's QR code to mark their attendance</p>

            {/* Scanner */}
            <div className="mb-6">
                <QRScanner onScan={handleScan} disabled={!scanning} />
            </div>

            {/* Feedback */}
            {result && (
                <div
                    className={cn(
                        'flex flex-col items-center gap-3 p-6 rounded-2xl border text-center',
                        result.success
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    )}
                >
                    {result.success ? (
                        <>
                            <CheckCircle className="w-12 h-12 text-green-500" />
                            <div>
                                <p className="font-bold text-lg text-green-800 dark:text-green-300">{result.name}</p>
                                {result.dept && <p className="text-sm text-green-600 dark:text-green-400">{result.dept}</p>}
                                <p className="text-sm text-green-700 dark:text-green-400 mt-1">Attendance marked ✓</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <XCircle className="w-12 h-12 text-red-500" />
                            <p className="font-semibold text-red-700 dark:text-red-400">{result.error}</p>
                        </>
                    )}
                    <button
                        onClick={reset}
                        className="mt-2 px-6 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                        Scan Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default CheckIn;
