import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';

/**
 * Modal dialog displaying a QR code for event check-in.
 * @param {{ token: string, eventTitle: string, onClose: () => void }} props
 */
const QRDisplay = ({ token, eventTitle, onClose }) => {
    if (!token) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 relative animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center space-y-4">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                        Your Check-In QR Code
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{eventTitle}</p>

                    <div className="flex justify-center p-4 bg-white rounded-xl border dark:border-gray-700">
                        <QRCodeSVG
                            value={token}
                            size={220}
                            level="H"
                            includeMargin
                            fgColor="#1e1b4b"
                        />
                    </div>

                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        Present this code at the entrance. A copy was sent to your email.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QRDisplay;
