import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, Keyboard, ArrowRight } from 'lucide-react';

/**
 * Camera-based QR code scanner with anti-duplicate debounce and manual code entry fallback.
 * @param {{ onScan: (text: string) => void, disabled?: boolean }} props
 */
const QRScanner = ({ onScan, disabled = false }) => {
    const scannerRef = useRef(null);
    const containerId = 'qr-scanner-container';
    const lastScanTimeRef = useRef(0);
    const lastScannedTextRef = useRef('');

    const [manualCode, setManualCode] = useState('');
    const [showManual, setShowManual] = useState(false);

    useEffect(() => {
        if (disabled) return;

        const scanner = new Html5QrcodeScanner(
            containerId,
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1,
                showTorchButtonIfSupported: true,
                experimentalFeatures: {
                    useBarCodeDetectorIfSupported: true,
                },
                videoConstraints: {
                    facingMode: { ideal: 'environment' },
                },
            },
            false
        );

        scanner.render(
            (decodedText) => {
                const now = Date.now();
                // Enforce 2.5 second cooldown between identical/rapid scans to prevent double requests
                if (now - lastScanTimeRef.current < 2500 && decodedText === lastScannedTextRef.current) {
                    return;
                }
                lastScanTimeRef.current = now;
                lastScannedTextRef.current = decodedText;
                onScan(decodedText);
            },
            (error) => {
                // Suppress per-frame scan failures
                void error;
            }
        );

        scannerRef.current = scanner;

        return () => {
            scanner.clear().catch(() => {});
        };
    }, [disabled, onScan]);

    const handleManualSubmit = (e) => {
        e.preventDefault();
        const trimmed = manualCode.trim();
        if (!trimmed) return;
        onScan(trimmed);
        setManualCode('');
    };

    if (disabled) {
        return (
            <div className="flex flex-col items-center justify-center h-64 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 gap-3">
                <Camera className="w-10 h-10 text-gray-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Scanner paused
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-black/5 dark:bg-black/20">
                <div id={containerId} />
            </div>

            {/* Manual Entry Accordion / Fallback */}
            <div className="pt-1">
                {!showManual ? (
                    <button
                        type="button"
                        onClick={() => setShowManual(true)}
                        className="w-full text-center text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1.5 py-1"
                    >
                        <Keyboard className="w-3.5 h-3.5" />
                        <span>Camera issues? Enter ticket code manually</span>
                    </button>
                ) : (
                    <form onSubmit={handleManualSubmit} className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2 animate-in fade-in duration-150">
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                            Manual Ticket / Token Code
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value)}
                                placeholder="Paste or type ticket token / UUID"
                                className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                type="submit"
                                disabled={!manualCode.trim()}
                                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                                <span>Check In</span>
                                <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default QRScanner;
